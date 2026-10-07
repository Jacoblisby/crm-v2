#!/usr/bin/env python3
"""
Funnel-regneark for brevkampagnen: fra identificerede ejerforeninger til køb.

Starter hvor «Opkøbs-tragten» på /foreninger starter (alle foreninger, dem vi vil
købe i, boliger, størrelsen 20–80 kvm) og fortsætter nedad:

  Foreninger → enheder → brevlisten → grupperet efter hvem der bor der
    Flow 1  beboet af ejer       (segment A må kontaktes, C reklamebeskyttet)
    Flow 2  ikke beboet, lejer   (segment B må kontaktes, D reklamebeskyttet)
  → hvem der har fået brev, og hvor mange gange → leads → booking → besigtigelse
  → bud → køb. Hvert flow har sin egen tragt.

Samme designfilosofi som standard-ejendomsmodellen (skill: ejendomsmodel):
  · Konklusion først, derefter antagelser, beregninger og bilag
  · input = blå tekst på gul baggrund, hardcodet tal = blå tekst, alt andet formel
  · koblingen mellem brev og lead sker i arket (INDEX/MATCH på en adresse-hash),
    så reglen kan læses og rettes. Scriptet skriver kun rådata.
  · ingen statiske resultater. Kontroller og flag til sidst.

Data:
  · CRM: /api/admin/funnel-data  (anonymt: leads og foreningslisten)
  · Breve: Brevliste runde 2 2026-09.xlsx (Flettefil) i vaulten
  · BBR pr. forening: src/lib/data/bbr-forening-rollup.json
  · Arket indeholder ingen adresser, navne, mails eller telefonnumre.

Kør:  python3 scripts/funnel/bygfunnel.py [versionsnummer]
Ud:   Projects/Brevkampagne ejerforeninger/Funnel boligberegner – v<N>.xlsx
"""
import hashlib
import json
import re
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import openpyxl
from openpyxl.styles import Alignment
from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path.home() / '.claude/skills/ejendomsmodel/scripts'))
from mstyle import (  # noqa: E402
    NUM, PCT, _font, fml, hard, header_row, inp, kpi, lbl, note, put, section, title, widths,
)

ROD = Path(__file__).resolve().parents[2]
VAULT = Path.home() / 'Desktop/Claude Vault/Projects/Brevkampagne ejerforeninger'
BREVLISTE = VAULT / 'Brevliste runde 2 2026-09.xlsx'
ROLLUP = ROD / 'src/lib/data/bbr-forening-rollup.json'
URL = 'https://crm.365ejendom.dk/api/admin/funnel-data'
CPH = ZoneInfo('Europe/Copenhagen')
SENDT_FLOW1 = date(2026, 9, 11)
DR = 1000   # Data: formler dækker række 5 til 1000
BR = 2000   # Breve: række 5 til 2000
STATUS_TEKST = {'maalgruppe': 'Målgruppe', 'undersoeges': 'Undersøges', 'fravalgt': 'Fravalgt'}
FLOWS = [
    ('Flow 1', 'Flow 1 · beboet af ejer', ('A', 'C')),
    ('Flow 2', 'Flow 2 · ikke beboet, lejer', ('B', 'D')),
]
SEGTEKST = {
    'A': 'Må kontaktes · ejer bor der', 'B': 'Må kontaktes · ejer bor et andet sted',
    'C': 'Reklamebeskyttet · ejer bor der', 'D': 'Reklamebeskyttet · ejer bor et andet sted',
}
IKKE = '">0"'   # dato udfyldt. «<>» ville tælle formelceller med tom tekst med
Q = '"'


def norm(s):
    return re.sub(r'[\s.]+', ' ', s.lower()).strip()


def h(nogle):
    return hashlib.sha256(('365-funnel|' + nogle).encode()).hexdigest()[:16]


def til_dato(iso):
    if not iso:
        return None
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(CPH).replace(tzinfo=None)


def q(s):
    return Q + s + Q


# ═══ 1. Data ═════════════════════════════════════════════════════════════
def hent_crm():
    with urllib.request.urlopen(URL, timeout=90) as r:
        return json.load(r)


def laes_brevliste():
    wb = openpyxl.load_workbook(BREVLISTE, data_only=True)
    rows = list(wb['Flettefil'].iter_rows(values_only=True))
    ix = {n: i for i, n in enumerate(rows[0])}
    breve = []
    for r in rows[1:]:
        if not r[0]:
            continue
        pn = str(r[ix['Postnr og by']]).split()[0]
        linje = str(r[ix['Adresselinje 1']])
        breve.append(dict(
            hash=h(norm(linje) + '|' + pn), gade=h(norm(linje.split(',')[0]) + '|' + pn),
            segment=r[ix['Segment']], gruppe=r[ix['Forening']], kvm=r[ix['Kvm']], jul=r[ix['Fik brev jul 2025']],
        ))
    return breve


# ═══ 2. Fanerne ══════════════════════════════════════════════════════════
class Bygger:
    def __init__(self, crm, breve, rollup):
        self.crm = crm
        self.breve = breve
        self.rollup = {f['forening']: f for f in rollup['foreninger']}   # nøgle = brevgruppe
        self.wb = openpyxl.Workbook()
        self.wb.remove(self.wb.active)
        self.A, self.F = {}, {}

    # ── hjælpere ────────────────────────────────────────────────────────
    @staticmethod
    def D(c):
        return f'Data!${c}$5:${c}${DR}'

    @staticmethod
    def B(c):
        return f'Breve!${c}$5:${c}${BR}'

    def tael(self, gruppe, *krav):
        """COUNTIFS på Data med gruppen (fx 'Flow 1 · sendt') som fast krav."""
        dele = [f'{self.D("P")},"{gruppe}"'] + [f'{self.D(c)},{k}' for c, k in krav]
        return 'COUNTIFS(' + ','.join(dele) + ')'

    # ── Antagelser ──────────────────────────────────────────────────────
    def antagelser(self):
        ws = self.wb.create_sheet('Antagelser')
        title(ws, 'Antagelser', 'Gule felter er input. Blå tal uden gul baggrund er hentet fra brevlisten. Resten er formler.', 6)
        widths(ws, {'A': 56, 'B': 16, 'C': 4, 'D': 76})
        A = self.A

        section(ws, 4, 'Brevlisten (runde 2, genereret 11.09.2026)', 6)
        lbl(ws, 'A5', 'Målgruppe: bolig, 20–80 kvm, med Resights-data'); hard(ws, 'B5', 1166); A['mal'] = 'Antagelser!$B$5'
        note(ws, 'D5', 'BBR kender 1.197 i størrelsen. De 31 uden Resights-data kan ikke grupperes efter, hvem der bor der')
        lbl(ws, 'A6', '− koncernens egne lejligheder'); hard(ws, 'B6', 69); A['egne'] = 'Antagelser!$B$6'
        lbl(ws, 'A7', 'Kan få brev', bold=True); fml(ws, 'B7', '=B5-B6', bold=True); A['kan'] = 'Antagelser!$B$7'
        for i, s in enumerate('ABCD'):
            r = 8 + i
            lbl(ws, f'A{r}', f'{s}  {SEGTEKST[s]}', indent=1)
            fml(ws, f'B{r}', f'=COUNTIFS({self.B("C")},"{s}")'); A['seg' + s] = f'Antagelser!$B${r}'
        note(ws, 'D8', 'Tælles fra Breve-fanen')

        section(ws, 13, 'Udsendelser: hvornår er brevene sendt', 6)
        lbl(ws, 'A14', 'Flow 1 (A + C) sendt den'); inp(ws, 'B14', SENDT_FLOW1, fmt='dd-mm-yyyy'); A['sendt1'] = 'Antagelser!$B$14'
        lbl(ws, 'A15', 'Flow 2 (B + D) sendt den'); inp(ws, 'B15', None, fmt='dd-mm-yyyy'); A['sendt2'] = 'Antagelser!$B$15'
        note(ws, 'D15', 'Tom = ikke sendt. Skriv datoen, når B og D sendes, så flytter hele regnearket med')
        lbl(ws, 'A16', 'Breve sendt, Flow 1', bold=True)
        fml(ws, 'B16', f'=COUNTIFS({self.B("C")},"A",{self.B("H")},1)+COUNTIFS({self.B("C")},"C",{self.B("H")},1)', bold=True); A['breve1'] = 'Antagelser!$B$16'
        lbl(ws, 'A17', 'Breve sendt, Flow 2', bold=True)
        fml(ws, 'B17', f'=COUNTIFS({self.B("C")},"B",{self.B("H")},1)+COUNTIFS({self.B("C")},"D",{self.B("H")},1)', bold=True); A['breve2'] = 'Antagelser!$B$17'
        lbl(ws, 'A18', 'Klar til afsendelse, Flow 2'); fml(ws, 'B18', '=B9+B11-B17'); A['klar2'] = 'Antagelser!$B$18'

        section(ws, 20, 'Omkostning og værdi', 6)
        lbl(ws, 'A21', 'Pris pr. brev, inkl. print og porto (kr)'); inp(ws, 'B21', None, fmt='#,##0.00'); A['pris'] = 'Antagelser!$B$21'
        note(ws, 'D21', 'Udfyld. Uden en pris vises ingen omkostning pr. køb')
        lbl(ws, 'A22', 'Bruttoavance pr. købt lejlighed (kr)'); inp(ws, 'B22', None); A['avance'] = 'Antagelser!$B$22'
        note(ws, 'D22', 'Udfyld. Bruges til at vise, hvad et brev højst må koste')

        section(ws, 24, 'Trin vi ikke måler endnu (indtast, når tallet findes)', 6)
        for r, (txt, key, kom) in enumerate([
            ('Flow 1: besøg på forsiden fra brevet', 'besoeg1', 'QR-koden på brevene peger på forsiden uden kode, så vi ikke kan se, hvem der scannede'),
            ('Flow 1: startet beregneren (adresse tastet)', 'startet1', 'Beregneren gemmer først noget ved afsendelse'),
            ('Flow 2: besøg på forsiden fra brevet', 'besoeg2', 'Ikke sendt endnu. Her kan koden på brevet være personlig, hvis den bygges først'),
            ('Flow 2: startet beregneren', 'startet2', ''),
        ], start=25):
            lbl(ws, f'A{r}', txt); inp(ws, f'B{r}', None); A[key] = f'Antagelser!$B${r}'
            if kom:
                note(ws, f'D{r}', kom)

        section(ws, 30, 'Hvornår tæller et tal', 6)
        lbl(ws, 'A31', 'Mindste antal for at kalde en rate sikker'); inp(ws, 'B31', 10); A['minN'] = 'Antagelser!$B$31'
        note(ws, 'D31', 'Rater på færre end dette bruges ikke til at udpege lækager og erstattes af gæt i fremskrivningen')

        section(ws, 33, 'Flow 2: fremskrivning', 6)
        lbl(ws, 'A34', 'Gæt: respons i Flow 2 (breve → lead)'); inp(ws, 'B34', 0.03, fmt=PCT); A['resp2'] = 'Antagelser!$B$34'
        note(ws, 'D34', 'Intet målt. Brevet lander hos lejeren eller beboeren, ikke hos ejeren, så jeg har sat det under Flow 1')

        section(ws, 36, 'Over tid', 6)
        lbl(ws, 'A37', 'Dage efter en uges slutning, før dens leads tæller som modne'); inp(ws, 'B37', 14); A['moden'] = 'Antagelser!$B$37'
        lbl(ws, 'A38', 'Periode i fanen Tid for Flow 1 og Flow 2 (Uge eller Måned)'); inp(ws, 'B38', 'Måned', fmt='@'); A['periode'] = 'Antagelser!$B$38'
        from openpyxl.worksheet.datavalidation import DataValidation
        dv = DataValidation(type='list', formula1='"Uge,Måned"', allow_blank=False); ws.add_data_validation(dv); dv.add('B38')
        note(ws, 'D38', 'Måned følger afsendelsesdatoen: periode 0 er 30 dage fra brevet. Uge er bedre de første uger')
        note(ws, 'D37', 'Et lead fra sidste periode har ikke haft tid til at nå besigtigelse. Modne uger bruges til konverteringen i bunden af hver tabel')
        ws.freeze_panes = 'A4'

    # ── Breve ───────────────────────────────────────────────────────────
    def breve_fane(self):
        ws = self.wb.create_sheet('Breve')
        title(ws, 'Breve', 'Alle modtagere på brevlisten. Adresserne er erstattet af en hash. Sendt dato kommer fra Antagelser.', 10)
        header_row(ws, 4, ['Adresse-hash', 'Gade-hash', 'Segment', 'Forening (brevgruppe)', 'Kvm', 'Sendt dato', 'Fik brev jul 2025', 'Sendt (1/0)', 'Antal breve', 'Flow'])
        widths(ws, {'A': 19, 'B': 19, 'C': 9, 'D': 26, 'E': 7, 'F': 12, 'G': 14, 'H': 10, 'I': 10, 'J': 9})
        s1, s2 = self.A['sendt1'], self.A['sendt2']
        for i, b in enumerate(self.breve):
            r = 5 + i
            hard(ws, f'A{r}', b['hash'], fmt='@'); hard(ws, f'B{r}', b['gade'], fmt='@'); hard(ws, f'C{r}', b['segment'], fmt='@')
            hard(ws, f'D{r}', b['gruppe'], fmt='@'); hard(ws, f'E{r}', b['kvm']); hard(ws, f'G{r}', b['jul'], fmt='@')
            fml(ws, f'F{r}', f'=IF(OR(C{r}="A",C{r}="C"),IF({s1}="","",{s1}),IF({s2}="","",{s2}))', fmt='dd-mm-yyyy')
            fml(ws, f'H{r}', f'=IF(F{r}="",0,1)', fmt='0')
            fml(ws, f'I{r}', f'=IF(G{r}="Ja",1,0)+H{r}', fmt='0')
            fml(ws, f'J{r}', f'=IF(OR(C{r}="A",C{r}="C"),"Flow 1","Flow 2")', fmt='@')
        ws.freeze_panes = 'A5'

    # ── Data ────────────────────────────────────────────────────────────
    def data_fane(self):
        ws = self.wb.create_sheet('Data')
        gen = til_dato(self.crm['genereret'])
        title(ws, 'Data', f'Hentet fra CRM {gen:%d-%m-%Y %H:%M}. Én række pr. lead, uden navne, mails, telefon og adresser. Kolonnerne AX til AZ tæller et lead med på de trin, det har passeret. Kør bygfunnel.py for at opdatere.', 52)
        lbl(ws, 'A3', 'Hentet'); put(ws, 'B3', gen, fmt='dd-mm-yyyy hh:mm', color='0000FF'); self.A['hentet'] = 'Data!$B$3'
        lbl(ws, 'C3', 'Leads i CRM'); hard(ws, 'D3', self.crm['antal']); self.A['nCrm'] = 'Data!$D$3'
        cols = [
            ('Lead', 8), ('Oprettet', 16), ('Kilde', 18), ('Postnr', 8), ('Kvm', 6), ('Test', 6), ('Adresse-hash', 18), ('Gade-hash', 18),
            ('Breve-række', 9), ('Brevmatch', 10), ('Segment', 8), ('Forening', 24), ('Forening (BBR)', 24), ('Flow', 8), ('Sendt dato', 12), ('Gruppe', 20),
            ('Hvornår vil du flytte', 18), ('Efter salget', 22), ('Stand samlet', 11), ('Udgifter udfyldt', 9), ('Billeder', 8),
            ('Bud', 11), ('Markedsestimat', 12), ('Trin nu', 22),
            ('Booking sendt', 16), ('Kundens svar', 16), ('Første opkald', 16), ('Aftalt', 16), ('Afholdt', 16), ('Bud afgivet', 16), ('Købt', 16),
            ('Ikke enige om pris', 16), ('Vil ikke sælge nu', 16), ('Arkiveret / tabt', 16),
            ('F1 dage brev→lead', 9), ('F1 dage lead→booking', 9), ('F1 dage lead→svar', 9), ('F1 dage lead→aftalt', 9), ('F1 dage lead→afholdt', 9), ('F1 dage lead→bud', 9), ('F1 dage lead→købt', 9),
            ('F2 dage brev→lead', 9), ('F2 dage lead→booking', 9), ('F2 dage lead→svar', 9), ('F2 dage lead→aftalt', 9), ('F2 dage lead→afholdt', 9), ('F2 dage lead→bud', 9), ('F2 dage lead→købt', 9),
            ('Antal breve (modtager)', 9),
            ('Aftalt (nået)', 16), ('Afholdt (nået)', 16), ('Bud (nået)', 16),
        ]
        header_row(ws, 4, [c[0] for c in cols])
        ws.row_dimensions[4].height = 42
        for i, (_, w) in enumerate(cols):
            ws.column_dimensions[get_column_letter(i + 1)].width = w
        BG, BB, BC, BD, BF = (self.B(x) for x in 'ACDEF')
        BC_, BD_, BF_ = self.B('C'), self.B('D'), self.B('F')
        for i, l in enumerate(sorted(self.crm['leads'], key=lambda x: x['oprettet'] or '')):
            r = 5 + i
            vals = {
                'A': l['id'], 'B': til_dato(l['oprettet']), 'C': l['kilde'] or 'ældre import', 'D': l['postnr'], 'E': l['kvm'], 'F': l['test'],
                'G': l.get('nogle'), 'H': l.get('nogleGade'), 'M': l['forening'],
                'Q': l['tidshorisont'], 'R': l['efterSalget'], 'S': l['standSamlet'], 'T': l['udgifterUdfyldt'], 'U': l['billeder'],
                'V': l['bud'], 'W': l['estimat'], 'X': l['trinNu'],
                'Y': til_dato(l['tBooking']), 'Z': til_dato(l['tSvar']), 'AA': til_dato(l['tOpkald']), 'AB': til_dato(l['tAftalt']),
                'AC': til_dato(l['tAfholdt']), 'AD': til_dato(l['tBud']), 'AE': til_dato(l['tKoebt']),
                'AF': til_dato(l['tIkkeEnige']), 'AG': til_dato(l['tVilIkkeNu']), 'AH': til_dato(l['tArkiv']),
            }
            for c, v in vals.items():
                if v is None:
                    continue
                hard(ws, f'{c}{r}', v, fmt=('dd-mm-yyyy hh:mm' if isinstance(v, datetime) else '@' if isinstance(v, str) else NUM))
            # Kobling brev → lead, i arket så reglen kan læses: eksakt adresse, ellers entydig gade og nummer
            fml(ws, f'I{r}', f'=IF(G{r}="","",IFERROR(MATCH(G{r},{BG},0),IF(COUNTIF({BB},H{r})=1,MATCH(H{r},{BB},0),"")))', fmt='0')
            fml(ws, f'J{r}', f'=IF(I{r}="","",IF(ISNUMBER(MATCH(G{r},{BG},0)),"eksakt","gade+nr"))', fmt='@')
            fml(ws, f'K{r}', f'=IF(I{r}="","",INDEX({BC_},I{r}))', fmt='@')
            fml(ws, f'L{r}', f'=IF(I{r}="",M{r},INDEX({BD_},I{r}))', fmt='@')
            fml(ws, f'N{r}', f'=IF(K{r}="","",IF(OR(K{r}="A",K{r}="C"),"Flow 1","Flow 2"))', fmt='@')
            fml(ws, f'O{r}', f'=IF(I{r}="","",INDEX({BF_},I{r}))', fmt='dd-mm-yyyy')
            fml(ws, f'P{r}', f'=IF(F{r}=1,"Test",IF(AND(ISNUMBER(O{r}),B{r}>=O{r}),N{r}&" · sendt",IF(LEFT(C{r},12)="boligberegne","Anden beregner-lead","Øvrige")))', fmt='@')
            fml(ws, f'AW{r}', f'=IF(I{r}="","",INDEX({self.B("I")},I{r}))', fmt='0')
            # «Nået mindst dette trin»: et lead, der er ikke enige om pris, har fået et bud, selv om bud-trinnet blev sprunget over
            for kol, ind in (('AX', 'AB{r}:AF{r}'), ('AY', 'AC{r}:AF{r}'), ('AZ', 'AD{r}:AF{r}')):
                rng = ind.format(r=r)
                fml(ws, f'{kol}{r}', f'=IF(COUNT({rng})=0,"",MIN({rng}))', fmt='dd-mm-yyyy hh:mm')
            for fl, sæt in (('Flow 1', ('AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO')), ('Flow 2', ('AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV'))):
                fml(ws, f'{sæt[0]}{r}', f'=IF($P{r}="{fl} · sendt",B{r}-$O{r},"")', fmt='0.0')
                for kol, tid in zip(sæt[1:], ['Y', 'Z', 'AX', 'AY', 'AZ', 'AE']):
                    fml(ws, f'{kol}{r}', f'=IF(AND($P{r}="{fl} · sendt",{tid}{r}<>""),{tid}{r}-$B{r},"")', fmt='0.0')
        ws.freeze_panes = 'B5'

    # ── Foreninger (toppen) ─────────────────────────────────────────────
    def foreninger_fane(self):
        ws = self.wb.create_sheet('Foreninger')
        title(ws, 'Foreninger: fra registret til brev', 'Samme foreninger og tal som tragten på /foreninger, delt i Flow 1 og Flow 2 og fulgt til køb.', 21)
        widths(ws, {'A': 34, 'B': 12, 'C': 12, 'D': 9, 'E': 9, 'F': 11, 'G': 24, 'H': 7, 'I': 10, 'J': 10, 'K': 10, 'L': 10, 'M': 10, 'N': 10, 'O': 9, 'P': 9, 'Q': 9, 'R': 9, 'S': 9, 'T': 9, 'U': 9})
        header_row(ws, 5, ['Forening', 'By', 'Status', 'Enheder', 'Boliger (BBR)', 'I størrelsen 20–80', 'Brevgruppe', 'Ejet af os',
                           'På brevlisten', 'Flow 1 ejer bor der', 'Flow 2 lejer', 'Flow 1 sendt', 'Flow 2 sendt', 'Fik 2 breve',
                           'Leads Flow 1', 'Respons Flow 1', 'Aftalt', 'Afholdt', 'Bud', 'Købt', 'Leads Flow 2'])
        ws.row_dimensions[5].height = 42
        rang = ['maalgruppe', 'undersoeges', 'fravalgt']
        raek = sorted(self.crm['foreninger'], key=lambda f: (rang.index(f['status']) if f['status'] in rang else 9, -(f['enheder'] or 0)))
        first = 6
        for i, f in enumerate(raek):
            r = first + i
            ru = self.rollup.get(f['gade'])
            if ru and ru['foreningNavn'] != f['navn']:
                ru = None   # to foreninger kan dele gadenøgle; brevgruppen hører kun til den, der hedder det samme
            hard(ws, f'A{r}', f['navn'], fmt='@'); hard(ws, f'B{r}', f['by'], fmt='@')
            hard(ws, f'C{r}', STATUS_TEKST.get(f['status'], f['status']), fmt='@')
            hard(ws, f'D{r}', f['enheder'] or 0)
            if ru:
                hard(ws, f'E{r}', ru['boliger']); hard(ws, f'F{r}', ru['iMaalgruppe']); hard(ws, f'G{r}', f['gade'], fmt='@')
            hard(ws, f'H{r}', f['ejet'] or 0)
            g = f'$G{r}'

            def kr(*x):
                return 'COUNTIFS(' + ','.join([f'{self.B("D")},{g}'] + [f'{self.B(c)},{k}' for c, k in x]) + ')'

            def kd(gr, *x):
                return 'COUNTIFS(' + ','.join([f'{self.D("P")},"{gr}"', f'{self.D("L")},{g}'] + [f'{self.D(c)},{k}' for c, k in x]) + ')'

            fml(ws, f'I{r}', f'=IF({g}="","",{kr()})')
            fml(ws, f'J{r}', f'=IF({g}="","",{kr(("J", q("Flow 1")))})')
            fml(ws, f'K{r}', f'=IF({g}="","",{kr(("J", q("Flow 2")))})')
            fml(ws, f'L{r}', f'=IF({g}="","",{kr(("J", q("Flow 1")), ("H", "1"))})')
            fml(ws, f'M{r}', f'=IF({g}="","",{kr(("J", q("Flow 2")), ("H", "1"))})')
            fml(ws, f'N{r}', f'=IF({g}="","",{kr(("I", "2"))})')
            fml(ws, f'O{r}', f'=IF({g}="","",{kd("Flow 1 · sendt")})')
            fml(ws, f'P{r}', f'=IF({g}="","",IF(L{r}>0,O{r}/L{r},"–"))', fmt=PCT)
            for c_, tid in [('Q', 'AX'), ('R', 'AY'), ('S', 'AZ'), ('T', 'AE')]:
                fml(ws, f'{c_}{r}', f'=IF({g}="","",{kd("Flow 1 · sendt", (tid, IKKE))})')
            fml(ws, f'U{r}', f'=IF({g}="","",{kd("Flow 2 · sendt")})')
        last = first + len(raek) - 1
        tot = last + 1
        lbl(ws, f'A{tot}', 'I alt', bold=True)
        for c in 'DEFHIJKLMNOQRSTU':
            fml(ws, f'{c}{tot}', f'=SUM({c}{first}:{c}{last})', bold=True)
        fml(ws, f'P{tot}', f'=IF(L{tot}>0,O{tot}/L{tot},"–")', fmt=PCT, bold=True)
        self.F.update(for_first=first, for_last=last, for_tot=tot)
        self.F['FR'] = lambda c: f'Foreninger!${c}${first}:${c}${last}'
        FR = self.F['FR']

        # Status-opdeling (som på hjemmesiden)
        r0 = tot + 3
        section(ws, r0, 'Efter status: hvilke foreninger vi vil købe i', 21)
        header_row(ws, r0 + 1, ['Status', 'Foreninger', 'Enheder', '', '', 'I størrelsen'])
        for j, st in enumerate(['Målgruppe', 'Undersøges', 'Fravalgt']):
            r = r0 + 2 + j
            lbl(ws, f'A{r}', st + ('  (vil købe i)' if st == 'Målgruppe' else ''))
            fml(ws, f'B{r}', f'=COUNTIF({FR("C")},"{st}")')
            fml(ws, f'C{r}', f'=SUMIF({FR("C")},"{st}",{FR("D")})')
            fml(ws, f'F{r}', f'=SUMIF({FR("C")},"{st}",{FR("F")})')
        note(ws, f'A{r0+6}', 'Foreninger uden brevgruppe er ikke på brevlisten. Enheder er registrets BFE-numre og kan være garager. Boliger og størrelse er målt i BBR.')
        ws.freeze_panes = 'D6'

    # ── Udsendelser ─────────────────────────────────────────────────────
    def udsendelser_fane(self):
        ws = self.wb.create_sheet('Udsendelser')
        title(ws, 'Udsendelser: hvem har fået brev, og hvor mange gange', 'Tæller breve pr. modtager: ét fra juli 2025 (hvis modtageren stod på den liste) og ét fra runde 2 (hvis gruppen er sendt).', 10)
        widths(ws, {'A': 8, 'B': 10, 'C': 44, 'D': 12, 'E': 11, 'F': 11, 'G': 11, 'H': 16, 'I': 14, 'J': 44})
        BC, BH, BI, BF = self.B('C'), self.B('H'), self.B('I'), self.B('F')
        section(ws, 4, 'Pr. gruppe', 10)
        header_row(ws, 5, ['Gruppe', 'Flow', 'Hvem', 'Modtagere', '0 breve', '1 brev', '2 breve', 'Breve sendt i alt', '% fået mindst ét', 'Status'])
        ws.row_dimensions[5].height = 32
        for j, s in enumerate('ABCD'):
            r = 6 + j
            hard(ws, f'A{r}', s, fmt='@'); fml(ws, f'B{r}', f'=IF(OR(A{r}="A",A{r}="C"),"Flow 1","Flow 2")', fmt='@')
            lbl(ws, f'C{r}', SEGTEKST[s])
            fml(ws, f'D{r}', f'=COUNTIFS({BC},A{r})')
            for k, c in enumerate('EFG'):
                fml(ws, f'{c}{r}', f'=COUNTIFS({BC},$A{r},{BI},{k})')
            fml(ws, f'H{r}', f'=SUMIFS({BI},{BC},$A{r})')
            fml(ws, f'I{r}', f'=IF(D{r}>0,1-E{r}/D{r},"–")', fmt=PCT)
            fml(ws, f'J{r}', f'=IF(COUNTIFS({BC},$A{r},{BH},1)>0,"Runde 2 sendt "&TEXT(INDEX({BF},MATCH($A{r},{BC},0)),"dd-mm-yyyy"),"Ikke sendt i runde 2")', fmt='@')
        lbl(ws, 'A10', 'I alt', bold=True)
        for c in 'DEFGH':
            fml(ws, f'{c}10', f'=SUM({c}6:{c}9)', bold=True)
        fml(ws, 'I10', '=IF(D10>0,1-E10/D10,"–")', fmt=PCT, bold=True)

        section(ws, 12, 'Pr. flow', 10)
        header_row(ws, 13, ['', 'Flow', 'Hvem', 'Modtagere', '0 breve', '1 brev', '2 breve', 'Breve sendt i alt', '% fået mindst ét', ''])
        for j, (k, navn, segs) in enumerate(FLOWS):
            r = 14 + j
            hard(ws, f'B{r}', k, fmt='@'); lbl(ws, f'C{r}', navn)
            for c in 'DEFGH':
                fml(ws, f'{c}{r}', f'=SUMIF($B$6:$B$9,$B{r},{c}$6:{c}$9)')
            fml(ws, f'I{r}', f'=IF(D{r}>0,1-E{r}/D{r},"–")', fmt=PCT)

        section(ws, 17, 'Runderne', 10)
        header_row(ws, 18, ['Runde', '', 'Hvad', 'Dato', 'Modtagere', '', '', '', '', 'Kilde'])
        lbl(ws, 'A19', '1'); lbl(ws, 'C19', 'Juli 2025: alle segmenter, kun dem på listen i dag'); hard(ws, 'D19', 'jul 2025', fmt='@')
        fml(ws, 'E19', f'=COUNTIFS({self.B("G")},"Ja")'); note(ws, 'J19', 'Kolonnen «Fik brev jul 2025» i brevlisten')
        lbl(ws, 'A20', '2'); lbl(ws, 'C20', 'September 2026: Flow 1 (A + C)'); fml(ws, 'D20', f'={self.A["sendt1"]}', fmt='dd-mm-yyyy')
        fml(ws, 'E20', f'={self.A["breve1"]}'); note(ws, 'J20', 'Brevrunde 11.09.2026, beboende ejere')
        lbl(ws, 'A21', '3'); lbl(ws, 'C21', 'Flow 2 (B + D)'); fml(ws, 'D21', f'=IF({self.A["sendt2"]}="","ikke sendt",{self.A["sendt2"]})', fmt='dd-mm-yyyy')
        fml(ws, 'E21', f'=IF({self.A["sendt2"]}="",{self.A["klar2"]},{self.A["breve2"]})'); note(ws, 'J21', 'Klar til afsendelse. Skriv datoen i Antagelser, når brevene sendes')

        section(ws, 23, 'Flow 2: hvor mange breve har modtagerne fået, før og efter runde 3', 10)
        header_row(ws, 24, ['', '', '', 'Modtagere', '0 breve', '1 brev', '2 breve', '3 breve', '', ''])
        lbl(ws, 'C25', 'Før runde 3'); fml(ws, 'D25', '=D15'); fml(ws, 'E25', '=E15'); fml(ws, 'F25', '=F15'); fml(ws, 'G25', '=G15'); put(ws, 'H25', 0, color='64748B')
        lbl(ws, 'C26', 'Efter runde 3'); fml(ws, 'D26', '=D15'); put(ws, 'E26', 0, color='64748B'); fml(ws, 'F26', '=E15'); fml(ws, 'G26', '=F15'); fml(ws, 'H26', '=G15')
        note(ws, 'J26', 'Hver modtager rykker ét trin: 0 breve bliver til 1, 1 bliver til 2, 2 bliver til 3')
        note(ws, 'A28', 'Et brev nummer to til samme adresse kan give en anden respons end det første. Det kan kun ses, hvis hver runde har sin egen kode (/k/<kode>).')
        self.kun_et_brev(ws)

    def kun_et_brev(self, ws):
        """Hvem i Flow 1 har kun fået ét brev (ikke med i juli 2025)? Pr. brevgruppe, uden adresser."""
        grupper = sorted({b['gruppe'] for b in self.breve if b['segment'] in ('A', 'C') and b['jul'] != 'Ja'})
        section(ws, 30, 'Flow 1: dem der kun har fået ét brev (ikke med i juli 2025)', 10)
        header_row(ws, 31, ['', '', 'Brevgruppe', 'Flow 1 i alt', 'Kun 1 brev', 'Heraf leads', '', '', '', 'Bemærkning'])
        BC, BG, BD, BI = self.B('C'), self.B('G'), self.B('D'), self.B('I')
        for j, g in enumerate(grupper):
            r = 32 + j
            hard(ws, f'C{r}', g, fmt='@')
            fml(ws, f'D{r}', f'=COUNTIFS({BD},$C{r},{BC},"A")+COUNTIFS({BD},$C{r},{BC},"C")')
            fml(ws, f'E{r}', f'=COUNTIFS({BD},$C{r},{BC},"A",{BI},1)+COUNTIFS({BD},$C{r},{BC},"C",{BI},1)')
            fml(ws, f'F{r}', f'=COUNTIFS({self.D("P")},"Flow 1 · sendt",{self.D("L")},$C{r},{self.D("AW")},1)')
        last = 32 + len(grupper) - 1
        t = last + 1
        lbl(ws, f'C{t}', 'I alt', bold=True)
        for c in 'DEF':
            fml(ws, f'{c}{t}', f'=SUM({c}32:{c}{last})', bold=True)
        note(ws, 'J32', 'Hele foreninger: Farimagsvej og Nordre Farimagsvej var ikke med i runden i juli 2025, så alle deres Flow 1-modtagere har kun fået dette brev')
        note(ws, 'J33', 'Resten er enkeltlejligheder i foreninger, der ellers fik brev i 2025: sandsynligvis nye ejere eller adresser, der først nu opfylder kravet om 20–80 kvm og Resights-data')
        note(ws, f'A{t+2}', 'Adresserne på de 18 står i vaultnoten «Flow 1 med kun ét brev.md». Regnearket indeholder ingen adresser.')

    # ── Tid ─────────────────────────────────────────────────────────────
    def tid(self):
        ws = self.wb.create_sheet('Tid')
        title(ws, 'Tid: lead conversion over tid', 'Leads grupperet efter den uge (eller måned) de blev oprettet i, og hvor langt hver gruppe er nået. Opdateres, når bygfunnel.py køres.', 20)
        widths(ws, {'A': 8, 'B': 11, 'C': 11, 'D': 8, 'E': 9, 'F': 10, 'G': 9, 'H': 8, 'I': 8, 'J': 9, 'K': 7, 'L': 7, 'M': 9, 'N': 8, 'O': 8, 'P': 9, 'Q': 7, 'R': 7, 'S': 11, 'T': 10})
        A, hentet = self.A, self.A['hentet']
        stadier = [('G', 'Y', 'Booking'), ('H', 'Z', 'Svar'), ('I', 'AX', 'Aftalt'), ('J', 'AY', 'Afholdt'), ('K', 'AZ', 'Bud'), ('L', 'AE', 'Købt')]
        rate = dict(zip('GHIJKL', 'MNOPQR'))
        hdr = ['Uge', 'Fra', 'Til', 'Nye leads', 'Kum. leads', 'Kum. respons', 'Booking', 'Svar', 'Aftalt', 'Afholdt', 'Bud', 'Købt',
               'Booking', 'Svar', 'Aftalt', 'Afholdt', 'Bud', 'Købt', 'Dage siden periodens slutning', 'Moden']

        def blok(r0, titel, grp_krav, start, trin, n, breve=None, enhed='Uge'):
            """grp_krav: COUNTIFS-krav på Data!P. start: formel for første fra-dato. trin: 'uge' eller 'maaned'."""
            section(ws, r0, titel, 20)
            put(ws, f'G{r0+1}', 'Antal leads, der er nået trinnet', italic=True, color='64748B', size=9)
            put(ws, f'M{r0+1}', 'Andel af periodens leads', italic=True, color='64748B', size=9)
            h = list(hdr); h[0] = enhed
            header_row(ws, r0 + 2, h)
            ws.row_dimensions[r0 + 2].height = 32
            first = r0 + 3
            last = first + n - 1
            for i in range(n):
                r = first + i
                hard(ws, f'A{r}', i, fmt='0')
                if trin == 'uge':
                    per = A['periode']
                    fml(ws, f'B{r}', f'=IF({start}="","",IF({per}="Måned",EDATE({start},A{r}),{start}+7*A{r}))', fmt='dd-mm-yy')
                    slut = f'IF({per}="Måned",EDATE(B{r},1),B{r}+7)'
                    fml(ws, f'C{r}', f'=IF(B{r}="","",{slut}-1)', fmt='dd-mm-yy')
                else:
                    fml(ws, f'B{r}', f'=EDATE({start},A{r})', fmt='mmm yyyy')
                    slut = f'EDATE(B{r},1)'
                    fml(ws, f'C{r}', f'=EDATE(B{r},1)-1', fmt='dd-mm-yy')
                ok = f'AND(ISNUMBER(B{r}),B{r}<={hentet})'
                cnt = lambda *x: 'COUNTIFS(' + ','.join([grp_krav, f'{self.D("B")},">="&B{r}', f'{self.D("B")},"<"&({slut})'] + [f'{self.D(c)},{k}' for c, k in x]) + ')'
                fml(ws, f'D{r}', f'=IF({ok},{cnt()},"")')
                fml(ws, f'E{r}', f'=IF({ok},SUM(D${first}:D{r}),"")')
                if breve:
                    fml(ws, f'F{r}', f'=IF({ok},IF({breve}>0,E{r}/{breve},""),"")', fmt=PCT)
                for kol, tid_, _ in stadier:
                    fml(ws, f'{kol}{r}', f'=IF({ok},{cnt((tid_, IKKE))},"")')
                    fml(ws, f'{rate[kol]}{r}', f'=IF({ok},IF(D{r}>0,{kol}{r}/D{r},""),"")', fmt=PCT)
                fml(ws, f'S{r}', f'=IF({ok},ROUND({hentet}-C{r},0),"")', fmt='0')
                fml(ws, f'T{r}', f'=IF({ok},IF(C{r}>={hentet},"delvis",IF(S{r}>={A["moden"]},"ja","nej")),"")', fmt='@')
            for lab, r_, krav in [('I alt', last + 1, None), ('Modne', last + 2, '"ja"')]:
                lbl(ws, f'A{r_}', lab, bold=True)
                cols = 'DGHIJKL'
                for c in cols:
                    f_ = f'=SUM({c}{first}:{c}{last})' if krav is None else f'=SUMIF($T${first}:$T${last},{krav},{c}${first}:{c}${last})'
                    fml(ws, f'{c}{r_}', f_, bold=True)
                for kol, _, _ in stadier:
                    fml(ws, f'{rate[kol]}{r_}', f'=IF($D{r_}>0,{kol}{r_}/$D{r_},"")', fmt=PCT, bold=True)
            note(ws, f'S{last+2}', 'Kun modne perioder')
            return last + 4

        if True:
            r = 4
            for k, navn, segs in FLOWS:
                fl = 1 if k == 'Flow 1' else 2
                r = blok(r, f'{navn}: pr. periode efter afsendelse (uge eller måned, vælges i Antagelser)', f'{self.D("P")},"{k} · sendt"',
                         A['sendt' + str(fl)], 'uge', 12, enhed='Periode', breve=A['breve' + str(fl)])
            # alle ikke-test-leads pr. måned
            førstemd = min(til_dato(l['oprettet']) for l in self.crm['leads'] if l['oprettet'])
            første = date(førstemd.year, førstemd.month, 1)
            nu = til_dato(self.crm['genereret'])
            md = (nu.year - første.year) * 12 + nu.month - første.month + 1
            r0 = r
            section(ws, r0, 'Alle leads uden test: måned for måned', 20)
            self.F['tid_md_start'] = r0
            # månedsblok: startdato er et blåt hardcodet tal i en celle, så formlerne kan pege på den
            lbl(ws, f'A{r0+1}', 'Første måned'); hard(ws, f'D{r0+1}', første, fmt='mmm yyyy')
            r = blok(r0 + 2, 'Alle leads: oprettet i måneden', f'{self.D("P")},"<>Test"', f'$D${r0+1}', 'maaned', md, enhed='Måned')
            ws.row_dimensions[r0].height = 18
        note(ws, f'A{r}', 'Periode 0 starter på afsendelsesdagen. Brevene er 3–9 hverdage om at nå frem, så den første periode er lav. En periode kaldes delvis, hvis den ikke er slut, når data blev hentet.')
        note(ws, f'A{r+1}', 'Flow 2 fyldes ud, når datoen står i Antagelser. Tallene stiger, efterhånden som ældre leads når videre. Kør bygfunnel.py igen for at opdatere.')
        ws.freeze_panes = 'A4'

    # ── Flow og handling ────────────────────────────────────────────────
    def handlinger(self):
        from openpyxl.styles import Font
        ws = self.wb.create_sheet('Flow og handling')
        title(ws, 'Flow og handling: tragten', 'Fra brev til køb. Bjælkerne viser Flow 1 i forhold til antal leads. Hvert link åbner præcis det brev, den mail eller det script, vi bruger.', 8)
        widths(ws, {'A': 30, 'B': 9, 'C': 44, 'D': 10, 'E': 10, 'F': 46, 'G': 32, 'H': 26})
        links = json.load(open(Path(__file__).with_name('drive-links.json')))
        header_row(ws, 4, ['Trin', 'Flow 1', 'Tragt', '% af forrige', 'Flow 2', 'Handling', 'Brev, mail eller script', 'Hvornår'])
        ws.row_dimensions[4].height = 28
        R1, R2 = self.F['rows']['Flow 1'], self.F['rows']['Flow 2']
        # (trin, nøgle i Funnel, handling, [(dokument, hvornår)])
        rows = [
            ('Breve sendt', 'Breve sendt', 'Send som Word-fil i Resights, så flettefelterne udfyldes. Levering tager 3 til 9 hverdage.',
             [('Beboende ejer brev 2', 'Flow 1 (A og C)'), ('Udlejer brev 1', 'Flow 2 (B og D)')]),
            ('Lead', 'Gennemført beregneren (lead)', 'Send booking-mailen senest dagen efter, at de har brugt beregneren.',
             [('Mail 01 Booking', 'Senest dagen efter')]),
            ('Booking sendt', 'Booking-mail sendt', 'Følg op i samme tråd. Uden svar efter tredje opfølgning parkeres leadet.',
             [('Mail 02 Opfølgning 1 dag 3', 'Dag 3'), ('Mail 03 Opfølgning 2 dag 8', 'Dag 8'), ('Mail 04 Opfølgning 3 dag 15', 'Dag 15')]),
            ('Besigtigelse aftalt', 'Besigtigelse aftalt', 'Bekræft tiden skriftligt, og påmind dagen før. Kør derud med scriptet.',
             [('Mail 05 Bekræftelse', 'Straks'), ('Mail 06 Påmindelse', 'Dagen før'), ('Script Besigtigelse', 'På dagen')]),
            ('Besigtigelse afholdt', 'Besigtigelse afholdt', 'Giv et skriftligt bud senest dagen efter.',
             [('Mail 07 Tak for i dag', 'Samme dag')]),
            ('Bud afgivet', 'Bud afgivet', 'Send kontantbud, som gælder i 30 dage, og følg op.',
             [('Mail 08 Bud', 'Dagen efter besigtigelsen'), ('Mail 09 Bud-opfølgning dag 3', 'Dag 3')]),
            ('Købt', 'Købt', 'Send de næste skridt, når I er blevet enige.',
             [('Mail 14 Sådan foregår handlen', 'Når I er enige')]),
        ]
        link_font = Font(name='Arial', size=9, color='0000FF', underline='single')
        lead_r = None
        r = 5
        for i, (navn, fr, handling, dok) in enumerate(rows):
            antal = max(1, len(dok))
            top = r
            lbl(ws, f'A{r}', navn, bold=True)
            fml(ws, f'B{r}', f'=Funnel!C{R1[fr]}', bold=True)
            fml(ws, f'E{r}', f'=Funnel!C{R2[fr]}')
            if navn == 'Lead':
                lead_r = r
                fml(ws, f'D{r}', f'=Funnel!D{R1[fr]}', fmt=PCT)
            elif i > 1:
                fml(ws, f'D{r}', f'=Funnel!D{R1[fr]}', fmt=PCT)
            if navn == 'Breve sendt':
                fml(ws, f'C{r}', f'="Respons: "&ROUND(100*Funnel!D{R1["Gennemført beregneren (lead)"]},1)&" % blev til et lead"', fmt='@')
                ws[f'C{r}'].font = _font(False, '64748B', 9, True)
            else:
                fml(ws, f'C{r}', f'=IF(AND(ISNUMBER(B{r}),$B${lead_r}>0),REPT("█",MAX(IF(B{r}>0,1,0),ROUND(32*B{r}/$B${lead_r},0))),"")', fmt='@')
                ws[f'C{r}'].font = _font(False, '1E293B', 10)
            lbl(ws, f'F{r}', handling)
            for j, (d, hvornaar) in enumerate(dok):
                rr = r + j
                c = ws[f'G{rr}']; c.value = d; c.hyperlink = links[d]; c.font = link_font
                lbl(ws, f'H{rr}', hvornaar)
            for rr in range(r, r + antal):
                for c in 'ABCDEFGH':
                    ind = ws[f'{c}{rr}'].alignment.indent
                    ws[f'{c}{rr}'].alignment = Alignment(
                        wrap_text=True, vertical=('center' if c in 'ABCDE' and antal == 1 else 'top'),
                        horizontal=('center' if c == 'C' else 'right' if c in 'BDE' else None), indent=ind)
                ws.row_dimensions[rr].height = 20
            if antal > 1:
                for c in 'ABCDEF':
                    ws.merge_cells(f'{c}{r}:{c}{r+antal-1}')
                    ws[f'{c}{r}'].alignment = Alignment(wrap_text=True, vertical='center', horizontal=ws[f'{c}{r}'].alignment.horizontal)
            if len(handling) > 60:
                ws.row_dimensions[r].height = 32
            r += antal
        note(ws, f'A{r+1}', 'Flow 2 er ikke sendt endnu. Bjælkerne viser Flow 1: lead = fuld bredde. Antal er dem, der er nået mindst så langt.')
        ws.freeze_panes = 'A5'

    # ── Segmenter ───────────────────────────────────────────────────────
    def segmenter(self):
        ws = self.wb.create_sheet('Segmenter')
        title(ws, 'Segmenter: hvem de er, og hvad de har fået', 'A til D er brevlistens fire grupper. De deles i to flows efter, om ejeren bor på adressen. Tallene er formler på Breve.', 11)
        widths(ws, {'A': 9, 'B': 8, 'C': 26, 'D': 42, 'E': 40, 'F': 34, 'G': 28, 'H': 10, 'I': 12, 'J': 11, 'K': 52, 'L': 9, 'M': 10})
        header_row(ws, 4, ['Segment', 'Flow', 'Navn', 'Hvem er de', 'Sådan afgøres det', 'Brevet lander hos', 'Brev', 'Antal', 'Fik brev jul 2025', 'Sendt 2026', 'Forbehold', 'Leads', 'Respons'])
        ws.row_dimensions[4].height = 32
        BC, BG, BH = self.B('C'), self.B('G'), self.B('H')
        beskyttet = 'Reklamebeskyttelse betyder, at ejeren har sagt nej til uopfordret reklame (CPR for privatpersoner, CVR for selskaber). '
        rows = [
            ('A', 'Må kontaktes · ejer bor der',
             'Ejerlejligheder på 20–80 kvm, hvor ejeren selv bor, og hvor ejeren må få reklamepost.',
             'Resights: ejerens postadresse er lejlighedens adresse, og ejeren er ikke reklamebeskyttet.',
             'Ejeren selv', 'Beboende ejer brev 2',
             'Ejernavn og ejeradresse gemmes ikke. Alle breve adresseres «Til ejeren» på lejlighedens adresse.'),
            ('B', 'Må kontaktes · ejer bor et andet sted',
             'Ejerlejligheder på 20–80 kvm, som ejeren ikke bor i, og hvor ejeren må få reklamepost. Som regel udlejet.',
             'Resights: ejerens postadresse er en anden end lejlighedens, og ejeren er ikke reklamebeskyttet.',
             'Lejeren eller beboeren', 'Udlejer brev 1',
             'Udlejer-brevet er skrevet til ejeren, men lander hos lejeren, fordi ejerens postadresse ikke er i datasættet. Det skal løses, før B sendes: hent ejerens adresse, eller skriv et brev, en lejer også kan bruge.'),
            ('C', 'Reklamebeskyttet · ejer bor der',
             'Som A, men ejeren er reklamebeskyttet.',
             'Resights: ejeren bor på adressen og er reklamebeskyttet. «Ukendt» (5 stk.) tælles som beskyttet. ' + beskyttet.strip(),
             'Ejeren selv', 'Beboende ejer brev 2',
             'Sendt efter Jacobs beslutning. Fodnoten med afmelding blev fjernet før afsendelse.'),
            ('D', 'Reklamebeskyttet · ejer bor et andet sted',
             'Som B, men ejeren er reklamebeskyttet.',
             'Resights: ejeren bor et andet sted og er reklamebeskyttet.',
             'Lejeren eller beboeren', 'Udlejer brev 1',
             'Som B. Kræver desuden en ny beslutning om at skrive til reklamebeskyttede, hvis brevet sendes til ejerens egen adresse.'),
        ]
        for j, (sg, navn, hvem, afgoer, lander, brev, forbehold) in enumerate(rows):
            r = 5 + j
            hard(ws, f'A{r}', sg, fmt='@')
            fml(ws, f'B{r}', f'=IF(OR(A{r}="A",A{r}="C"),"Flow 1","Flow 2")', fmt='@')
            lbl(ws, f'C{r}', navn, bold=True)
            lbl(ws, f'D{r}', hvem); lbl(ws, f'E{r}', afgoer); lbl(ws, f'F{r}', lander); lbl(ws, f'G{r}', brev)
            fml(ws, f'H{r}', f'=COUNTIFS({BC},A{r})')
            fml(ws, f'I{r}', f'=COUNTIFS({BC},A{r},{BG},"Ja")')
            fml(ws, f'J{r}', f'=COUNTIFS({BC},A{r},{BH},1)')
            note(ws, f'K{r}', forbehold)
            fml(ws, f'L{r}', f'=COUNTIFS({self.D("P")},"*sendt",{self.D("K")},A{r})')
            fml(ws, f'M{r}', f'=IF(J{r}>0,L{r}/J{r},"–")', fmt=PCT)
            for c in 'ABCDEFGHIJKLM':
                ws[f'{c}{r}'].alignment = Alignment(wrap_text=True, vertical='top', horizontal=('right' if c in 'HIJLM' else None))
            ws.row_dimensions[r].height = 92
        lbl(ws, 'A9', 'I alt', bold=True)
        for c in 'HIJL':
            fml(ws, f'{c}9', f'=SUM({c}5:{c}8)', bold=True)
        fml(ws, 'M9', '=IF(J9>0,L9/J9,"–")', fmt=PCT, bold=True)
        lbl(ws, 'A10', 'A og C har samme situation: ejeren bor i lejligheden og får brevet selv, med samme brev. Forskellen er kun, om ejeren er reklamebeskyttet. Respons pr. segment viser, om det har betydning.', italic=True, color='64748B')
        ws['A10'].font = _font(False, '64748B', 9, True)

        section(ws, 12, 'De to flows', 13)
        header_row(ws, 13, ['Flow', '', 'Navn', 'Segmenter', 'Hvad vi skriver', 'Hvem der læser det', '', 'Antal', '', 'Sendt 2026', 'Status'])
        flows = [
            ('Flow 1', 'Beboet af ejer', 'A + C', 'Et kontant bud, uden mægler, og at ejeren kan blive boende som lejer.', 'Ejeren, som bor i lejligheden.'),
            ('Flow 2', 'Ikke beboet, lejer', 'B + D', 'Et kontant bud, med eller uden lejer, uden fremvisninger.', 'Skal være ejeren. Lander i dag hos lejeren.'),
        ]
        for j, (fl, navn, seg, hvad, laeser) in enumerate(flows):
            r = 14 + j
            hard(ws, f'A{r}', fl, fmt='@'); lbl(ws, f'C{r}', navn, bold=True); lbl(ws, f'D{r}', seg); lbl(ws, f'E{r}', hvad); lbl(ws, f'F{r}', laeser)
            fml(ws, f'H{r}', f'=SUMIF($B$5:$B$8,A{r},$H$5:$H$8)')
            fml(ws, f'J{r}', f'=SUMIF($B$5:$B$8,A{r},$J$5:$J$8)')
            fml(ws, f'K{r}', f'=IF(J{r}=0,"Ikke sendt","Sendt "&TEXT({self.A["sendt"+str(j+1)]},"dd-mm-yyyy"))', fmt='@')
            for c in 'ACDEFHJK':
                ws[f'{c}{r}'].alignment = Alignment(wrap_text=True, vertical='top', horizontal=('right' if c in 'HJ' else None))
            ws.row_dimensions[r].height = 44

        section(ws, 17, 'Fælles for alle fire', 13)
        for j, txt in enumerate([
            'Ejerlejligheder på 20–80 kvm i de 11 brevgrupper under Foreninger, og ejeren kendes i Resights.',
            'Koncernens egne lejligheder er trukket fra, så ingen af dem får brev.',
            'Alle breve har en QR-kode, der peger på forsiden uden personlig kode. Derfor kan vi ikke se, hvem der scannede.',
            'Fik brev jul 2025 er hvor mange af segmentet, der også stod på listen i juli 2025.',
        ]):
            note(ws, f'A{18+j}', f'· {txt}')
        ws.freeze_panes = 'A5'

    # ── Funnel ──────────────────────────────────────────────────────────
    def funnel(self):
        ws = self.wb.create_sheet('Funnel')
        title(ws, 'Funnel: fra foreninger til køb', 'Øverst som tragten på /foreninger. Derefter en tragt pr. flow, for de breve der er sendt.', 11)
        widths(ws, {'A': 46, 'B': 11, 'C': 12, 'D': 14, 'E': 14, 'F': 13, 'G': 15, 'H': 11, 'I': 3, 'J': 64, 'K': 12})
        FR, A = self.F['FR'], self.A
        section(ws, 4, 'Fra toppen: alle foreninger til brevlisten', 11)
        header_row(ws, 5, ['Trin', 'Foreninger', 'Antal', '% af forrige', '', '', '', '', '', 'Hvad tallet er'])
        top = [
            # række, navn, foreninger (B), antal (C), % af forrige (D), forklaring, fed
            (6, 'Enheder i alle foreninger', f'=COUNTA({FR("A")})', f'=SUM({FR("D")})', None, 'Registrets enheder. Et BFE-nummer kan være en garage', False),
            (7, 'I foreninger vi vil købe i (status Målgruppe)', f'=COUNTIF({FR("C")},"Målgruppe")', f'=SUMIF({FR("C")},"Målgruppe",{FR("D")})', '=IF(C6>0,C7/C6,"–")', 'Foreninger med status Målgruppe på /foreninger', True),
            (8, 'Heraf boliger, ikke garage eller erhverv', None, f'=SUMIF({FR("C")},"Målgruppe",{FR("E")})', '=IF(C7>0,C8/C7,"–")', 'Målt i BBR', False),
            (9, 'I størrelsen vi køber (20–80 kvm)', None, f'=SUMIF({FR("C")},"Målgruppe",{FR("F")})', '=IF(C8>0,C9/C8,"–")', 'Målt pr. lejlighed i BBR', False),
            (10, 'På brevlisten (har Resights-data)', None, f'={A["mal"]}', '=IF(C9>0,C10/C9,"–")', 'Resights kender ejeren og om han bor der. Resten kan ikke grupperes', False),
            (11, '− koncernens egne lejligheder', None, f'=-{A["egne"]}', None, 'Dem skriver vi ikke til', False),
            (12, 'Kan få brev', None, '=C10+C11', '=IF(C10>0,C12/C10,"–")', 'Alle der kan få et brev i dag', True),
        ]
        for r, navn, b, c, d, kom, fed in top:
            lbl(ws, f'A{r}', navn, bold=fed)
            if b:
                fml(ws, f'B{r}', b)
            fml(ws, f'C{r}', c, bold=fed)
            if d:
                fml(ws, f'D{r}', d, fmt=PCT)
            note(ws, f'J{r}', kom)
        kan = 12
        self.F['kan_row'] = kan

        section(ws, 14, 'Delt efter hvem der bor der', 11)
        r = 15
        for k, navn, segs in FLOWS:
            lbl(ws, f'A{r}', navn, bold=True)
            fml(ws, f'C{r}', f'={A["seg"+segs[0]]}+{A["seg"+segs[1]]}', bold=True)
            fml(ws, f'D{r}', f'=IF(C{kan}>0,C{r}/C{kan},"–")', fmt=PCT)
            note(ws, f'J{r}', 'Ejeren bor på adressen: brevet når ejeren' if k == 'Flow 1' else 'Ejeren bor et andet sted: brevet lander hos lejeren eller beboeren')
            self.F['flowrow_' + k] = r
            flow_r = r
            r += 1
            for s in segs:
                lbl(ws, f'A{r}', f'{s}  {SEGTEKST[s]}', indent=2); fml(ws, f'C{r}', f'={A["seg"+s]}')
                fml(ws, f'D{r}', f'=IF(C{flow_r}>0,C{r}/C{flow_r},"–")', fmt=PCT)
                r += 1
        lbl(ws, f'A{r}', 'Sendt: Flow 1', bold=True); fml(ws, f'C{r}', f'={A["breve1"]}', bold=True)
        fml(ws, f'D{r}', f'=IF(C{self.F["flowrow_Flow 1"]}>0,C{r}/C{self.F["flowrow_Flow 1"]},"–")', fmt=PCT); r += 1
        lbl(ws, f'A{r}', 'Sendt: Flow 2', bold=True); fml(ws, f'C{r}', f'={A["breve2"]}', bold=True)
        fml(ws, f'D{r}', f'=IF(C{self.F["flowrow_Flow 2"]}>0,C{r}/C{self.F["flowrow_Flow 2"]},"–")', fmt=PCT)
        fml(ws, f'J{r}', f'=IF({A["breve2"]}=0,"Ikke sendt endnu: "&{A["klar2"]}&" breve er klar","")', fmt='@')
        ws[f'J{r}'].font = _font(False, '64748B', 9, True)
        r += 3

        self.F['rows'] = {}
        for k, navn, segs in FLOWS:
            r = self.flow_blok(ws, r, k, navn, segs)

        section(ws, r, 'Til sammenligning: leads uden for de sendte breve', 11)
        header_row(ws, r + 1, ['', '', 'Antal', '', '', 'Booking', 'Svar', 'Aftalt', '', 'Afholdt · Bud · Købt'])
        for j, (g, txt) in enumerate([('Anden beregner-lead', 'Anden beregner-lead'), ('Øvrige', 'Øvrige (ældre leads fra før beregneren)')]):
            rr = r + 2 + j
            lbl(ws, f'A{rr}', txt)
            fml(ws, f'C{rr}', f'={self.tael(g)}')
            for c_, tid in [('F', 'Y'), ('G', 'Z'), ('H', 'AX')]:
                fml(ws, f'{c_}{rr}', f'={self.tael(g, (tid, IKKE))}')
            fml(ws, f'J{rr}', f'={self.tael(g, ("AY", IKKE))}&" · "&{self.tael(g, ("AZ", IKKE))}&" · "&{self.tael(g, ("AE", IKKE))}', fmt='@')
        note(ws, f'A{r+4}', 'Beregner-leads, hvis adresse ikke er et sendt brev: leads fra før brevet, adresser uden for brevlisten og segmenter der ikke er sendt.')
        ws.freeze_panes = 'A4'

    def flow_blok(self, ws, r, k, navn, segs):
        gruppe = f'{k} · sendt'
        A = self.A
        section(ws, r, f'{navn}: tragten for de breve, der er sendt', 11)
        header_row(ws, r + 1, ['Trin', 'Målt', 'Antal', '% af forrige målte', '% af breve sendt', 'Tabt fra forrige', 'Median dage (brev / lead)', 'Lille n', '', 'Hvad tallet er', 'Sikker rate'])
        ws.row_dimensions[r + 1].height = 42
        fl = 1 if k == 'Flow 1' else 2

        def t(*kr):
            return self.tael(gruppe, *kr)

        dg = ['AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO'] if fl == 1 else ['AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV']
        trin = [
            ('Breve sendt', 'Ja', f'={A["breve"+str(fl)]}', None, f'Segment {segs[0]} og {segs[1]}'),
            ('Besøgt siden fra brevet', 'Nej', f'=IF({A["besoeg"+str(fl)]}="","ikke målt",{A["besoeg"+str(fl)]})', None, 'QR-koden har ingen kode. Se Antagelser'),
            ('Startet beregneren', 'Nej', f'=IF({A["startet"+str(fl)]}="","ikke målt",{A["startet"+str(fl)]})', None, 'Beregneren logger ikke trin. Se fanen Beregner'),
            ('Gennemført beregneren (lead)', 'Ja', f'={t()}', dg[0], 'Leads hvis adresse er et sendt brev. Dage fra brevet blev sendt'),
            ('Booking-mail sendt', 'Ja', f'={t(("Y", IKKE))}', dg[1], 'Første udgående mail med booking-frasen. Dage fra leadet'),
            ('Kunden har svaret', 'Ja', f'={t(("Z", IKKE))}', dg[2], 'Første indgående mail. Svar til administration@ er først med fra 05.10'),
            ('Besigtigelse aftalt', 'Ja', f'={t(("AX", IKKE))}', dg[3], 'Skift til aftalt, eller aftale i telefonen'),
            ('Besigtigelse afholdt', 'Ja', f'={t(("AY", IKKE))}', dg[4], ''),
            ('Bud afgivet', 'Ja', f'={t(("AZ", IKKE))}', dg[5], 'Alle der har fået et bud, også dem der siden er blevet ikke enige eller vil vente'),
            ('Heraf ikke enige om pris', 'Info', f'={t(("AF", IKKE))}', None, 'Har fået et bud, men blev ikke enige om prisen. Tæller med i Bud afgivet'),
            ('Købt', 'Ja', f'={t(("AE", IKKE))}', dg[6], ''),
        ]
        first = r + 2
        prev = None
        rows = {}
        for i, (navn_, maalt, formel, dagkol, kom) in enumerate(trin):
            rr = first + i
            rows[navn_] = rr
            bold = i in (0, 3, 9)
            lbl(ws, f'A{rr}', navn_, bold=bold, indent=(2 if maalt == 'Info' else 0))
            put(ws, f'B{rr}', maalt, align='center', color='64748B')
            fml(ws, f'C{rr}', formel, bold=bold); ws[f'C{rr}'].alignment = Alignment(horizontal='right')
            if maalt == 'Info':
                bud_r = rows['Bud afgivet']
                fml(ws, f'D{rr}', f'=IF(AND(ISNUMBER(C{bud_r}),C{bud_r}>0),C{rr}/C{bud_r},"–")', fmt=PCT)
                fml(ws, f'E{rr}', f'=IF($C${first}>0,C{rr}/$C${first},"–")', fmt=PCT)
                put(ws, f'F{rr}', '–', align='right'); put(ws, f'G{rr}', '–', align='right')
                note(ws, f'J{rr}', kom)
                continue
            if maalt == 'Ja' and prev:
                fml(ws, f'D{rr}', f'=IF(AND(ISNUMBER(C{rr}),ISNUMBER(C{prev}),C{prev}>0),C{rr}/C{prev},"–")', fmt=PCT)
                fml(ws, f'F{rr}', f'=IF(AND(ISNUMBER(C{rr}),ISNUMBER(C{prev})),C{prev}-C{rr},"–")')
                fml(ws, f'H{rr}', f'=IF(AND(ISNUMBER(C{prev}),C{prev}<{A["minN"]}),"lille n","")')
                if navn_ != 'Gennemført beregneren (lead)':
                    fml(ws, f'K{rr}', f'=IF(AND(ISNUMBER(D{rr}),C{prev}>={A["minN"]}),D{rr},"")', fmt=PCT)
            else:
                put(ws, f'D{rr}', '–', align='right'); put(ws, f'F{rr}', '–', align='right')
            fml(ws, f'E{rr}', f'=IF(AND(ISNUMBER(C{rr}),$C${first}>0),C{rr}/$C${first},"–")', fmt=PCT)
            if dagkol:
                fml(ws, f'G{rr}', f'=IFERROR(MEDIAN({self.D(dagkol)}),"–")', fmt='0.0')
            else:
                put(ws, f'G{rr}', '–', align='right')
            note(ws, f'J{rr}', kom)
            if maalt == 'Ja':
                prev = rr
        self.F['rows'][k] = rows
        last = first + len(trin) - 1
        if k == 'Flow 2':
            note(ws, f'A{last+1}', 'Flow 2 er ikke sendt endnu. Tragten fyldes, når datoen står i Antagelser, og leads kommer ind.')

        r0 = last + 3
        header_row(ws, r0, ['Hvor står leadene i dag', '', 'Antal', '% af leads'])
        stat = [('Ny lead', 'ny-lead'), ('Besigtigelse foreslået', 'besigtigelse-foreslaaet'), ('Besigtigelse aftalt', 'besigtigelse-aftalt'),
                ('Besigtigelse afholdt', 'besigtigelse-afholdt'), ('Bud afgivet', 'bud-afgivet'), ('Ikke enige om pris', 'ikke-enige-om-pris'),
                ('Vil ikke sælge nu', 'vil-ikke-saelge-nu'), ('Købt', 'koebt'), ('Arkiveret', 'arkiveret'), ('Tabt', 'tabt')]
        lead = rows['Gennemført beregneren (lead)']
        for j, (txt, slug) in enumerate(stat):
            rr = r0 + 1 + j
            self.F.setdefault('stat', {}).setdefault(k, {})[slug] = rr
            lbl(ws, f'A{rr}', txt, indent=1); fml(ws, f'C{rr}', f'={t(("X", q(slug)))}')
            fml(ws, f'D{rr}', f'=IF($C${lead}>0,C{rr}/$C${lead},"–")', fmt=PCT)
        rr = r0 + 1 + len(stat)
        lbl(ws, f'A{rr}', 'Øvrige trin (ældre navne)', indent=1)
        fml(ws, f'C{rr}', f'=C{lead}-SUM(C{r0+1}:C{rr-1})'); fml(ws, f'D{rr}', f'=IF($C${lead}>0,C{rr}/$C${lead},"–")', fmt=PCT)

        r1 = rr + 2
        header_row(ws, r1, ['Pr. segment', '', 'Breve', 'Leads', 'Respons', 'Booking', 'Svar', 'Aftalt', '', 'Afholdt · Bud · Købt'])
        for j, s in enumerate(segs):
            qq = r1 + 1 + j
            lbl(ws, f'A{qq}', f'{s}  {SEGTEKST[s]}', indent=1)
            fml(ws, f'C{qq}', f'=COUNTIFS({self.B("C")},"{s}",{self.B("H")},1)')
            fml(ws, f'D{qq}', f'={t(("K", q(s)))}')
            fml(ws, f'E{qq}', f'=IF(C{qq}>0,D{qq}/C{qq},"–")', fmt=PCT)
            for c_, tid in [('F', 'Y'), ('G', 'Z'), ('H', 'AX')]:
                fml(ws, f'{c_}{qq}', f'={t(("K", q(s)), (tid, IKKE))}')
            fml(ws, f'J{qq}', f'={t(("K", q(s)), ("AY", IKKE))}&" · "&{t(("K", q(s)), ("AZ", IKKE))}&" · "&{t(("K", q(s)), ("AE", IKKE))}', fmt='@')
        return r1 + 1 + len(segs) + 2

    # ── Beregner ────────────────────────────────────────────────────────
    def beregner(self):
        ws = self.wb.create_sheet('Beregner')
        title(ws, 'Beregner: hvor falder de fra', 'Hvor de falder fra, kræver trinmåling (se nederst). Det vi kan se i dag er, hvad de gennemførte valgte.', 8)
        widths(ws, {'A': 44, 'B': 16, 'C': 14, 'D': 12, 'E': 3, 'F': 74})
        section(ws, 4, 'A. Trin for trin (unikke besøgende pr. trin)', 8)
        header_row(ws, 5, ['Trin', 'Unikke besøgende', '% af forrige', 'Tabt', '', 'Hvad kunden ser'])
        steps = [
            ('Forsiden: adresse tastet', 'Adressefeltet på saelg.365ejendom.dk. Kunden trykker «Tjek din pris»'),
            ('1  Bekræft boligens detaljer', 'Adresse, boligtype, areal, værelser, byggeår, etage, elevator, altan, energimærke'),
            ('2  Hvor sender vi dit tilbud?', 'Navn, mail og telefon. Her bliver kunden til en person'),
            ('3  Hvornår vil du flytte?', 'Tidshorisont'),
            ('4  Hvad skal du efter salget?', 'Flytter ud, lejer, eller bliver boende som lejer'),
            ('5  Boligens stand', 'Køkken, bad og øvrige rum'),
            ('6  Tilføj de sidste detaljer', 'Hvidevarer, billeder, særlige forhold. Alt valgfrit'),
            ('7  Boligens udgifter', 'Fællesudgift, ejendomsskat, fælleslån. Kan sættes til «senere»'),
            ('8  Er der noget, vi skal tage højde for?', 'Forhold der kan påvirke prisen'),
            ('9  Estimat og lead oprettet', 'Her gemmes leadet. Dette tal kender vi allerede'),
        ]
        first = 6
        for i, (navn, kom) in enumerate(steps):
            r = first + i
            lbl(ws, f'A{r}', navn)
            if i == len(steps) - 1:
                fml(ws, f'B{r}', f'=COUNTIFS({self.D("P")},"*sendt")')
            else:
                inp(ws, f'B{r}', None)
            if i > 0:
                fml(ws, f'C{r}', f'=IF(AND(ISNUMBER(B{r}),ISNUMBER(B{r-1}),B{r-1}>0),B{r}/B{r-1},"–")', fmt=PCT)
                fml(ws, f'D{r}', f'=IF(AND(ISNUMBER(B{r}),ISNUMBER(B{r-1})),B{r-1}-B{r},"–")')
            note(ws, f'F{r}', kom)
        last = first + len(steps) - 1
        note(ws, f'A{last+1}', 'Gule felter er tomme, fordi trinene ikke logges. Når de er målt, viser «% af forrige» det trin, der taber flest.')

        r0 = last + 4
        section(ws, r0, 'B. Det vi kan se i dag: hvad de gennemførte valgte (alle sendte breve)', 8)
        header_row(ws, r0 + 1, ['Svar', 'Antal', '% af leads', '', '', 'Kommentar'])
        n = f'COUNTIFS({self.D("P")},"*sendt")'

        def rad(r, navn, kolonne, vaerdi, kom='', key=None):
            if key:
                self.F[key] = f'Beregner!$C${r}'
            lbl(ws, f'A{r}', navn, indent=1)
            fml(ws, f'B{r}', f'=COUNTIFS({self.D("P")},"*sendt",{self.D(kolonne)},"{vaerdi}")')
            fml(ws, f'C{r}', f'=IF({n}>0,B{r}/{n},"–")', fmt=PCT)
            if kom:
                note(ws, f'F{r}', kom)
        r = r0 + 2
        lbl(ws, f'A{r}', 'Udgifter udfyldt', bold=True); r += 1
        rad(r, 'Udfyldt', 'T', '1'); r += 1
        rad(r, 'Sat til «senere»', 'T', '0', 'Kunden kom til estimatet uden at give os udgifterne', key='udg_senere'); r += 1
        lbl(ws, f'A{r}', 'Billeder med', bold=True); r += 1
        rad(r, 'Har uploadet billeder', 'U', '1', 'Billedupload findes først fra 28.09, så ældre leads er 0'); r += 1
        lbl(ws, f'A{r}', 'Hvornår vil du flytte', bold=True); r += 1
        for v in ['Hurtigst muligt', '1–3 måneder', '3–6 måneder', '6+ måneder', 'Ved ikke endnu']:
            rad(r, v, 'Q', v, key=('tid_ved_ikke' if v == 'Ved ikke endnu' else None)); r += 1
        lbl(ws, f'A{r}', 'Efter salget', bold=True); r += 1
        for v in ['Flytter ud helt', 'Vil leje en anden bolig', 'Vil blive boende som lejer', 'Ved ikke endnu']:
            rad(r, v, 'R', v, key=('efter_ved_ikke' if v == 'Ved ikke endnu' else None)); r += 1
        lbl(ws, f'A{r}', 'Stand samlet (prismotorens niveau)', bold=True); r += 1
        for v in ['nyrenoveret', 'god', 'middel', 'trænger', 'slidt']:
            rad(r, v, 'S', v); r += 1
        r += 2
        section(ws, r, 'C. Sådan måler vi trinene (ikke bygget)', 8)
        for j, txt in enumerate([
            'Hvert trin sender én anonym hændelse til CRM’et: trin, tidspunkt og et sessions-id. Ingen navne, adresser eller indtastede værdier.',
            'Sessions-id regnes på serveren af en hash af IP, browser og dato. Der gemmes ingen cookie og intet på kundens enhed.',
            'Så kan vi se unikke besøgende pr. trin og dermed, hvor de falder fra. Samme metode giver besøg på forsiden.',
            'Personlige koder på brevene (/k/<kode>) kobler et besøg til en modtager og kan forhåndsudfylde adressen. Byg dem, før Flow 2 sendes.',
            'Få jeres rådgiver til at bekræfte, at måling uden cookie ikke kræver samtykke, før det slås til.',
        ]):
            note(ws, f'A{r+1+j}', f'{j+1}. {txt}')

    # ── Sensitivity ─────────────────────────────────────────────────────
    def sensitivity(self):
        ws = self.wb.create_sheet('Sensitivity')
        title(ws, 'Sensitivity: hvad flytter antal køb', 'Ratene er Flow 1, målt hvis grundlaget er stort nok, ellers et gæt (gult). Gæt er ikke resultater.', 9)
        widths(ws, {'A': 46, 'B': 11, 'C': 11, 'D': 12, 'E': 12, 'F': 12, 'G': 14, 'H': 12, 'I': 52})
        section(ws, 4, 'Drivere (Flow 1)', 9)
        header_row(ws, 5, ['Driver', 'Målt', 'Grundlag (n)', 'Gæt', 'Bruges', 'Kilde', 'Køb pr. 1.000 breve', 'Hvis +1 pp', 'Hvad det er'])
        R = self.F['rows']['Flow 1']

        def ref(nv):
            return f'Funnel!$C${R[nv]}'
        lead, aft, afh, bud, kob, brv = (ref(x) for x in ['Gennemført beregneren (lead)', 'Besigtigelse aftalt', 'Besigtigelse afholdt', 'Bud afgivet', 'Købt', 'Breve sendt'])
        spec = [
            ('Respons: breve → lead', f'=IF({brv}>0,{lead}/{brv},0)', f'={brv}', None, 'Leads divideret med breve sendt'),
            ('Lead → besigtigelse aftalt', f'=IF({lead}>0,{aft}/{lead},0)', f'={lead}', 0.15, 'Hvor mange leads ender med en aftalt besigtigelse'),
            ('Aftalt → afholdt', f'=IF({aft}>0,{afh}/{aft},0)', f'={aft}', 0.85, 'Hvor mange aftalte besigtigelser bliver til afholdte'),
            ('Afholdt → bud', f'=IF({afh}>0,{bud}/{afh},0)', f'={afh}', 0.80, 'Hvor mange besigtigelser ender med et bud'),
            ('Bud → køb', f'=IF({bud}>0,{kob}/{bud},0)', f'={bud}', 0.25, 'Hvor mange bud bliver til en handel'),
        ]
        first = 6
        for i, (navn, malt, nn, gaet, kom) in enumerate(spec):
            r = first + i
            lbl(ws, f'A{r}', navn); fml(ws, f'B{r}', malt, fmt=PCT); fml(ws, f'C{r}', nn)
            if gaet is None:
                put(ws, f'D{r}', '–', align='right'); fml(ws, f'E{r}', f'=B{r}', fmt=PCT); put(ws, f'F{r}', 'Målt', align='center')
            else:
                inp(ws, f'D{r}', gaet, fmt=PCT)
                fml(ws, f'E{r}', f'=IF(C{r}>={self.A["minN"]},B{r},D{r})', fmt=PCT)
                fml(ws, f'F{r}', f'=IF(C{r}>={self.A["minN"]},"Målt","Gæt")')
            note(ws, f'I{r}', kom)
        last = first + len(spec) - 1
        prod = '*'.join(f'$E${first+i}' for i in range(len(spec)))
        for i in range(len(spec)):
            r = first + i
            fml(ws, f'G{r}', f'=1000*{prod}', fmt='0.00')
            others = '*'.join(f'$E${first+j}' for j in range(len(spec)) if j != i)
            fml(ws, f'H{r}', f'=1000*{others}*MIN(1,$E${r}+0.01)', fmt='0.00')
        self.F['drivers'] = (first, last)
        r = last + 2
        lbl(ws, f'A{r}', 'Køb pr. 1.000 breve (Flow 1)', bold=True); kpi(ws, f'G{r}', f'=1000*{prod}', fmt='0.00')
        lbl(ws, f'A{r+1}', 'Breve pr. købt lejlighed'); fml(ws, f'G{r+1}', f'=IF(G{r}>0,1000/G{r},"–")', fmt='#,##0')
        lbl(ws, f'A{r+2}', 'Omkostning pr. købt (kr)')
        fml(ws, f'G{r+2}', f'=IF(AND(ISNUMBER({self.A["pris"]}),ISNUMBER(G{r+1})),G{r+1}*{self.A["pris"]},"udfyld pris")', fmt='#,##0')
        lbl(ws, f'A{r+3}', 'Et brev må koste højst (kr), for at det løber rundt')
        fml(ws, f'G{r+3}', f'=IF(ISNUMBER({self.A["avance"]}),G{r}/1000*{self.A["avance"]},"udfyld avance")', fmt='#,##0.00')
        self.F['kpi'] = r

        rf = r + 6
        section(ws, rf, 'Flow 2: hvad giver det at sende B + D', 9)
        down = '*'.join(f'$E${first+i}' for i in range(1, len(spec)))
        lbl(ws, f'A{rf+1}', 'Breve klar til afsendelse'); fml(ws, f'G{rf+1}', f'={self.A["klar2"]}')
        lbl(ws, f'A{rf+2}', 'Respons (gæt, se Antagelser)'); fml(ws, f'G{rf+2}', f'={self.A["resp2"]}', fmt=PCT)
        lbl(ws, f'A{rf+3}', 'Forventede leads'); fml(ws, f'G{rf+3}', f'=G{rf+1}*G{rf+2}', fmt='0.0')
        lbl(ws, f'A{rf+4}', 'Forventede køb (resten af kæden som Flow 1)', bold=True); kpi(ws, f'G{rf+4}', f'=G{rf+3}*{down}', fmt='0.0')
        lbl(ws, f'A{rf+5}', 'Køb pr. 1.000 breve, Flow 2'); fml(ws, f'G{rf+5}', f'=IF(G{rf+1}>0,G{rf+4}/G{rf+1}*1000,"–")', fmt='0.00')
        note(ws, f'I{rf+2}', 'Gæt: brevet lander hos lejer eller beboer. Kan ikke afgøres før det er sendt')
        note(ws, f'I{rf+4}', 'Kun så sikkert som gættet på respons og de sidste led')
        self.F['flow2_koeb'] = f'Sensitivity!$G${rf+4}'

        r0 = rf + 8
        section(ws, r0, 'Forventede køb: antal breve × respons (resten af kæden som ovenfor)', 9)
        lbl(ws, f'A{r0+1}', 'Breve sendt ↓   Respons →', italic=True)
        for j, v in enumerate([0.02, 0.04, 0.066, 0.08, 0.10]):
            inp(ws, f'{chr(66+j)}{r0+1}', v, fmt=PCT)
        for kk, nb in enumerate([250, 500, 1000, 1500, 2000]):
            rr = r0 + 2 + kk
            inp(ws, f'A{rr}', nb, fmt='#,##0')
            for j in range(5):
                c = chr(66 + j)
                fml(ws, f'{c}{rr}', f'=$A{rr}*{c}${r0+1}*{down}', fmt='0.0')

    # ── Konklusion ──────────────────────────────────────────────────────
    def konklusion(self):
        ws = self.wb.create_sheet('Konklusion', 0)
        title(ws, 'Konklusion: fra foreninger til køb', 'Flow 1 (beboet af ejer) er sendt 11.09.2026. Flow 2 (ikke beboet, lejer) er ikke sendt. Alle tal er formler.', 8)
        widths(ws, {'A': 46, 'B': 14, 'C': 14, 'D': 14, 'E': 3, 'F': 70})
        A = self.A
        fml(ws, 'A3', f'="Data hentet "&TEXT({A["hentet"]},"dd-mm-yyyy")&" · "&{A["breve1"]}&" breve sendt i Flow 1 · "&{A["klar2"]}&" klar i Flow 2"', fmt='@')
        ws['A3'].font = _font(False, '64748B', 9, True)

        section(ws, 5, 'Fra toppen', 8)
        header_row(ws, 6, ['Trin', 'Antal', '% af forrige', '', '', 'Bemærkning'])
        kan = self.F['kan_row']
        f1, f2 = self.F['flowrow_Flow 1'], self.F['flowrow_Flow 2']
        top = [
            ('Foreninger i registret', '=Funnel!B6', None, '=Funnel!C6&" enheder"', False),
            ('Foreninger vi vil købe i', '=Funnel!B7', '=IF(Funnel!B6>0,Funnel!B7/Funnel!B6,"–")', '=Funnel!C7&" enheder"', False),
            ('Boliger i dem, i størrelsen 20–80 kvm', '=Funnel!C9', '=Funnel!D8*Funnel!D9', 'Målt i BBR. Procenten er andelen af enhederne i Målgruppe', False),
            ('Kan få brev', f'=Funnel!C{kan}', f'=Funnel!D{kan}', 'Har Resights-data, uden vores egne. Procenten er andelen af dem med Resights-data', True),
            ('Flow 1: beboet af ejer', f'=Funnel!C{f1}', f'=Funnel!D{f1}', 'Sendt 11.09.2026. Procenten er andelen af dem, der kan få brev', False),
            ('Flow 2: ikke beboet, lejer', f'=Funnel!C{f2}', f'=Funnel!D{f2}', 'Ikke sendt endnu. Procenten er andelen af dem, der kan få brev', False),
        ]
        for i, (txt, f_, p, kom, fed) in enumerate(top):
            r = 7 + i
            lbl(ws, f'A{r}', txt, bold=fed)
            fml(ws, f'B{r}', f_, bold=fed); ws[f'B{r}'].alignment = Alignment(horizontal='right')
            if p:
                fml(ws, f'C{r}', p, fmt=PCT)
            if kom.startswith('='):
                fml(ws, f'F{r}', kom, fmt='@')
                ws[f'F{r}'].font = _font(False, '64748B', 9, True)
            else:
                note(ws, f'F{r}', kom)
        lbl(ws, 'A13', 'Hvor mange gange har de fået brev', italic=True)
        fml(ws, 'B13', '="Flow 1: "&Udsendelser!G14&" har fået 2 breve, "&Udsendelser!F14&" har fået 1, "&Udsendelser!E14&" ingen"', fmt='@')
        fml(ws, 'B14', '="Flow 2: "&Udsendelser!G15&" har fået 2 breve, "&Udsendelser!F15&" har fået 1, "&Udsendelser!E15&" ingen"', fmt='@')

        R = self.F['rows']['Flow 1']
        e0 = 16
        section(ws, e0, 'Flow 1 · beboet af ejer: fra brev til køb', 8)
        header_row(ws, e0 + 1, ['Trin', 'Antal', '% af breve', '% af forrige', '', 'Bemærkning'])
        vis = ['Breve sendt', 'Besøgt siden fra brevet', 'Startet beregneren', 'Gennemført beregneren (lead)', 'Booking-mail sendt',
               'Kunden har svaret', 'Besigtigelse aftalt', 'Besigtigelse afholdt', 'Bud afgivet', 'Heraf ikke enige om pris', 'Købt']
        for i, navn in enumerate(vis):
            r = e0 + 2 + i
            fr = R[navn]
            lbl(ws, f'A{r}', navn, bold=(navn in ('Breve sendt', 'Gennemført beregneren (lead)', 'Købt')))
            fml(ws, f'B{r}', f'=Funnel!C{fr}'); fml(ws, f'C{r}', f'=Funnel!E{fr}', fmt=PCT); fml(ws, f'D{r}', f'=Funnel!D{fr}', fmt=PCT)
            for c in 'BCD':
                ws[f'{c}{r}'].alignment = Alignment(horizontal='right')
            fml(ws, f'F{r}', f'=IF(ISNUMBER(B{r}),IF(Funnel!H{fr}="lille n","Få data: læs med forbehold",""),"Ikke målt")', fmt='@')
            ws[f'F{r}'].font = _font(False, '64748B', 9, True)
        e = e0 + 2 + len(vis)

        lbl(ws, f'A{e}', 'Flow 2 · ikke beboet, lejer', bold=True)
        fml(ws, f'B{e}', f'=IF({A["breve2"]}>0,{A["breve2"]},"ikke sendt")'); ws[f'B{e}'].alignment = Alignment(horizontal='right')
        fml(ws, f'F{e}', f'="Klar: "&{A["klar2"]}&" breve. Forventet "&ROUND({self.F["flow2_koeb"]},1)&" køb ved "&ROUND({A["resp2"]}*100,1)&" %"&" respons (gæt)"', fmt='@')
        ws[f'F{e}'].font = _font(False, '64748B', 9, True)
        e += 1

        section(ws, e + 1, 'Hvor lækker det (Flow 1)', 8)
        a, b = R['Booking-mail sendt'], R['Købt']
        sikker = f'Funnel!$K${a}:$K${b}'
        trin_navne = f'Funnel!$A${a}:$A${b}'
        lbl(ws, f'A{e+2}', 'Laveste sikre trin-rate'); fml(ws, f'B{e+2}', f'=IF(COUNT({sikker})=0,"–",MIN({sikker}))', fmt=PCT)
        note(ws, f'F{e+2}', 'Kun trin hvor forrige trin har mindst det antal, der står i Antagelser')
        lbl(ws, f'A{e+3}', 'Trinnet')
        fml(ws, f'B{e+3}', f'=IF(COUNT({sikker})=0,"for få data",INDEX({trin_navne},MATCH(MIN({sikker}),{sikker},0)))', fmt='@')
        fml(ws, f'F{e+3}', f'=IF(B{e+3}="Kunden har svaret","Svarraten er et minimum: svar til administration@ nåede ikke CRM’et før 05.10","")', fmt='@')
        ws[f'F{e+3}'].font = _font(False, '64748B', 9, True)
        lbl(ws, f'A{e+4}', 'Mistet mellem brev og lead')
        fml(ws, f'B{e+4}', f'=Funnel!C{R["Breve sendt"]}-Funnel!C{R["Gennemført beregneren (lead)"]}')
        note(ws, f'F{e+4}', 'Det største enkelte tab. Vi kan ikke se hvor: besøg og start er ikke målt')

        d1, d2 = self.F['drivers']
        k = self.F['kpi']
        section(ws, e + 6, 'Driverne og hvad ét procentpoint er værd (køb pr. 1.000 breve)', 8)
        header_row(ws, e + 7, ['Driver', 'Bruges', 'Kilde', 'Hvis +1 pp', '', 'Grundlag'])
        for i in range(d2 - d1 + 1):
            r = e + 8 + i
            fml(ws, f'A{r}', f'=Sensitivity!A{d1+i}', fmt='@'); fml(ws, f'B{r}', f'=Sensitivity!E{d1+i}', fmt=PCT)
            fml(ws, f'C{r}', f'=Sensitivity!F{d1+i}', fmt='@')
            fml(ws, f'D{r}', f'=Sensitivity!H{d1+i}-Sensitivity!G{d1+i}', fmt='+0.00;-0.00;"–"')
            fml(ws, f'F{r}', f'="n = "&Sensitivity!C{d1+i}', fmt='@'); ws[f'F{r}'].font = _font(False, '64748B', 9, True)
        rr = e + 8 + (d2 - d1 + 1)
        lbl(ws, f'A{rr}', 'Køb pr. 1.000 breve', bold=True); kpi(ws, f'B{rr}', f'=Sensitivity!G{k}', fmt='0.00')
        lbl(ws, f'A{rr+1}', 'Breve pr. købt lejlighed'); fml(ws, f'B{rr+1}', f'=Sensitivity!G{k+1}', fmt='#,##0')
        lbl(ws, f'A{rr+2}', 'Omkostning pr. købt (kr)'); fml(ws, f'B{rr+2}', f'=Sensitivity!G{k+2}', fmt='#,##0')
        note(ws, f'F{rr}', 'Gæt i de sidste led, til kohorten har nået dem. Kilden står ved hver driver')

        rr += 4
        section(ws, rr, 'Hvad de, der gennemfører, fortæller', 8)
        for j, (txt, key, kom) in enumerate([
            ('Satte udgifterne til «senere»', 'udg_senere', 'Buddet regnes uden drift, og vi skal indhente tallene ved besigtigelsen'),
            ('Ved ikke endnu, hvornår de vil flytte', 'tid_ved_ikke', 'Mange er ikke i gang med at sælge. Det er en lang opfølgning, ikke et hurtigt salg'),
            ('Ved ikke endnu, hvad de skal efter salget', 'efter_ved_ikke', ''),
        ]):
            lbl(ws, f'A{rr+1+j}', txt); fml(ws, f'B{rr+1+j}', f'={self.F[key]}', fmt=PCT)
            if kom:
                note(ws, f'F{rr+1+j}', kom)
        rr += 5
        section(ws, rr, 'Hvad vi ikke kan se endnu', 8)
        for j, txt in enumerate([
            'Hvor mange der besøgte siden fra brevet, og hvor mange der startede beregneren. QR-koden har ingen kode.',
            'Hvor i beregneren de falder fra. Den gemmer først ved afsendelse.',
            'Svar til administration@ før 05.10. Videresendelsen til CRM’et er ikke bevist at virke.',
            'Opkald før 05.10. Fanen Opkald findes først fra da, så «første opkald» er næsten tom.',
        ]):
            note(ws, f'A{rr+1+j}', f'· {txt}')
        lbl(ws, f'A{rr+6}', 'Kontroller', bold=True); fml(ws, f'B{rr+6}', "='Kontroller og flag'!C3", fmt='@')
        ws.freeze_panes = 'A5'

    # ── Kontroller og flag ──────────────────────────────────────────────
    def kontroller(self):
        ws = self.wb.create_sheet('Kontroller og flag')
        title(ws, 'Kontroller og flag', None, 6)
        widths(ws, {'A': 66, 'B': 14, 'C': 12, 'D': 62})
        header_row(ws, 5, ['Kontrol', 'Værdi', 'Status', 'Kommentar'])
        A, R1 = self.A, self.F['rows']['Flow 1']
        FR = self.F['FR']
        tests = [
            ('A + B + C + D = kan få brev', f'={A["segA"]}+{A["segB"]}+{A["segC"]}+{A["segD"]}-{A["kan"]}', '=IF(B{r}=0,"OK","FEJL")', 'Antagelser B5 og B6 er skrevet ind fra brevlisten'),
            ('Alle breve hører til en forening i listen', f'=COUNTA({self.B("A")})-SUM({FR("I")})', '=IF(B{r}=0,"OK","FEJL")', 'Ellers mangler en brevgruppe i Foreninger-fanen'),
            ('Rækker i Data = leads i CRM', f'=COUNTA({self.D("A")})-{A["nCrm"]}', '=IF(B{r}=0,"OK","FEJL")', ''),
            ('Testleads, udeladt af alle tal', f'=COUNTIFS({self.D("P")},"Test")', '=IF(B{r}>=0,"Info","")', 'Jacob Lisby og Test Test'),
            ('Leads i Flow 1 matchet kun på gade og nummer', f'=COUNTIFS({self.D("P")},"Flow 1 · sendt",{self.D("J")},"gade+nr")', '=IF(B{r}=0,"OK","Tjek")', 'Adressen havde ikke etage og dør. Matchet, hvis gade og nummer er entydigt'),
            ('Leads i et sendt flow uden forening', f'=COUNTIFS({self.D("P")},"*sendt",{self.D("L")},"")', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Afholdt større end aftalt (Flow 1)', f'=MAX(0,Funnel!C{R1["Besigtigelse afholdt"]}-Funnel!C{R1["Besigtigelse aftalt"]})', '=IF(B{r}=0,"OK","Tjek")', 'Kan ske, hvis et trin blev sprunget over i CRM’et'),
            ('Bud større end afholdt (Flow 1)', f'=MAX(0,Funnel!C{R1["Bud afgivet"]}-Funnel!C{R1["Besigtigelse afholdt"]})', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Købt større end bud (Flow 1)', f'=MAX(0,Funnel!C{R1["Købt"]}-Funnel!C{R1["Bud afgivet"]})', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Dage siden data blev hentet', f'=ROUND(NOW()-{A["hentet"]},0)', '=IF(B{r}<=7,"OK","Gammel")', 'Kør bygfunnel.py for at opdatere'),
            ('Trin der ikke måles (Flow 1)', f'=COUNTIF(Funnel!$B${R1["Breve sendt"]}:$B${R1["Købt"]},"Nej")', '=IF(B{r}=0,"OK","Flag")', 'Besøg og start af beregner. Se Antagelser'),
            ('Pris pr. brev udfyldt', f'=IF(ISNUMBER({A["pris"]}),1,0)', '=IF(B{r}=1,"OK","Mangler")', 'Uden pris vises ingen omkostning pr. køb'),
        ]
        first = r = 6
        for text, form, status, kom in tests:
            lbl(ws, f'A{r}', text); fml(ws, f'B{r}', form)
            fml(ws, f'C{r}', status.replace('{r}', str(r)), fmt='@'); note(ws, f'D{r}', kom)
            r += 1
        last = r - 1
        flag = '+'.join(f'COUNTIF(C{first}:C{last},"{x}")' for x in ('Tjek', 'Flag', 'Mangler', 'Gammel'))
        lbl(ws, 'A3', 'Samlet', bold=True)
        fml(ws, 'C3', f'=IF(COUNTIF(C{first}:C{last},"FEJL")>0,"FEJL",IF({flag}>0,"Flag","OK"))', fmt='@', bold=True)
        fml(ws, 'D3', f'=COUNTIF(C{first}:C{last},"FEJL")&" fejl · "&({flag})&" flag"', fmt='@')

    def byg(self, ud):
        self.antagelser()
        self.breve_fane()
        self.data_fane()
        self.foreninger_fane()
        self.udsendelser_fane()
        self.funnel()
        self.tid()
        self.handlinger()
        self.segmenter()
        self.beregner()
        self.sensitivity()
        self.konklusion()
        self.kontroller()
        navne = ['Konklusion', 'Flow og handling', 'Segmenter', 'Antagelser', 'Foreninger', 'Udsendelser', 'Funnel', 'Tid', 'Beregner', 'Sensitivity', 'Kontroller og flag', 'Data', 'Breve']
        self.wb._sheets = [self.wb[n] for n in navne]
        for ws in self.wb.worksheets:
            ws.sheet_view.showGridLines = False
        self.wb.save(ud)


def naeste_version():
    n = 1
    while (VAULT / f'Funnel boligberegner – v{n}.xlsx').exists():
        n += 1
    return n


if __name__ == '__main__':
    crm = hent_crm()
    breve = laes_brevliste()
    rollup = json.load(open(ROLLUP))
    n = int(sys.argv[1]) if len(sys.argv) > 1 else naeste_version()
    ud = VAULT / f'Funnel boligberegner – v{n}.xlsx'
    Bygger(crm, breve, rollup).byg(ud)
    print('skrevet', ud)
