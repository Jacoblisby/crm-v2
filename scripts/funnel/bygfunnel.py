#!/usr/bin/env python3
"""
Funnel-regneark for brevkampagnen: fra brev til køb.

Tager udgangspunkt i de breve, der blev sendt i denne omgang (runde 2, 11.09.2026,
segment A og C), og følger netop dem hele vejen. Alle andre leads vises som
sammenligning, så tallene ikke blandes.

Samme designfilosofi som standard-ejendomsmodellen (skill: ejendomsmodel):
  · Konklusion først, derefter antagelser, beregninger og bilag
  · input = blå tekst på gul baggrund, hardcodet tal = blå tekst, alt andet formel
  · ingen farvekodede faner, ingen statiske resultater: alt i Funnel, Pr. forening
    og Sensitivity er COUNTIFS/formler på Data og Breve
  · Kontroller og flag til sidst

Data:
  · CRM: https://crm.365ejendom.dk/api/admin/funnel-data  (anonymt, én række pr. lead)
  · Breve: Brevliste runde 2 2026-09.xlsx (fanen Flettefil) i vaulten
  · Adresser kobles via en hash. Regnearket indeholder ingen adresser, navne,
    mails eller telefonnumre.

Kør:  python3 scripts/funnel/bygfunnel.py
Ud:   Projects/Brevkampagne ejerforeninger/Funnel boligberegner – v<N>.xlsx
"""
import hashlib
import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import openpyxl

sys.path.insert(0, str(Path.home() / '.claude/skills/ejendomsmodel/scripts'))
from mstyle import (  # noqa: E402
    BOX, HEAD_FILL, INPUT_FILL, NUM, NUM1, PCT, SUB_FILL, KPI_FILL,
    fml, hard, header_row, inp, kpi, lbl, note, put, section, title, widths, _font,
)
from openpyxl.styles import Alignment  # noqa: E402

VAULT = Path.home() / 'Desktop/Claude Vault/Projects/Brevkampagne ejerforeninger'
BREVLISTE = VAULT / 'Brevliste runde 2 2026-09.xlsx'
URL = 'https://crm.365ejendom.dk/api/admin/funnel-data'
CPH = ZoneInfo('Europe/Copenhagen')
SENDT = date(2026, 9, 11)
SENDTE_SEGMENTER = ('A', 'C')
DR = 1000  # Data-fanen: formler dækker række 5 til 1000


def norm(s):
    return re.sub(r'[\s.]+', ' ', s.lower()).strip()


def h(nogle):
    return hashlib.sha256(('365-funnel|' + nogle).encode()).hexdigest()[:16]


def til_dato(iso):
    if not iso:
        return None
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(CPH).replace(tzinfo=None)


# ═══ 1. Hent data ════════════════════════════════════════════════════════
def hent_crm():
    with urllib.request.urlopen(URL, timeout=90) as r:
        return json.load(r)


def laes_brevliste():
    wb = openpyxl.load_workbook(BREVLISTE, data_only=True)
    ws = wb['Flettefil']
    rows = list(ws.iter_rows(values_only=True))
    ix = {n: i for i, n in enumerate(rows[0])}
    breve, gade = [], {}
    for r in rows[1:]:
        if not r[0]:
            continue
        pn = str(r[ix['Postnr og by']]).split()[0]
        linje = str(r[ix['Adresselinje 1']])
        nogle = norm(linje) + '|' + pn
        base = norm(linje.split(',')[0]) + '|' + pn
        post = dict(
            hash=h(nogle), base=h(base), segment=r[ix['Segment']], forening=r[ix['Forening']],
            kvm=r[ix['Kvm']], jul=r[ix['Fik brev jul 2025']],
        )
        breve.append(post)
        gade.setdefault(post['base'], []).append(post)
    return breve, gade


def kobl(leads, breve, gade):
    """Hvert lead kobles til et brev: først eksakt adresse, ellers gade+nr hvis entydigt."""
    pr_hash = {b['hash']: b for b in breve}
    for l in leads:
        b, hvordan = pr_hash.get(l.get('nogle')), 'eksakt'
        if not b and l.get('nogleGade') in gade:
            kandidater = gade[l['nogleGade']]
            if len(kandidater) == 1:
                b, hvordan = kandidater[0], 'gade+nr'
        l['_brev'], l['_match'] = (b, hvordan) if b else (None, '')
    return leads


# ═══ 2. Fanerne ══════════════════════════════════════════════════════════
class Bygger:
    def __init__(self, crm, breve, gade):
        self.crm = crm
        self.breve = breve
        self.leads = kobl(crm['leads'], breve, gade)
        self.wb = openpyxl.Workbook()
        self.wb.remove(self.wb.active)
        self.A = {}  # Antagelser-celler
        self.F = {}  # Funnel-celler

    # ── Antagelser ──────────────────────────────────────────────────────
    def antagelser(self):
        ws = self.wb.create_sheet('Antagelser')
        title(ws, 'Antagelser', 'Gule felter er input. Blå tal uden gul baggrund er hentet fra brevlisten eller CRM’et.', 6)
        widths(ws, {'A': 54, 'B': 16, 'C': 4, 'D': 70})

        seg = Counter(b['segment'] for b in self.breve)
        section(ws, 4, 'Hvem kan få brev (brevliste runde 2, genereret 11.09.2026)', 6)
        rows = [
            ('Målgruppe: bolig, 20–80 kvm', 1166, 'mal', 'Fra Brevliste runde 2, fanen Overblik'),
            ('− koncernens egne lejligheder', 69, 'egne', 'Trukket fra via Resights (fanen «Vi ejer»)'),
        ]
        r = 5
        for text, v, key, kilde in rows:
            lbl(ws, f'A{r}', text); hard(ws, f'B{r}', v); note(ws, f'D{r}', kilde); self.A[key] = f'Antagelser!$B${r}'; r += 1
        lbl(ws, f'A{r}', 'Kan få brev', bold=True); fml(ws, f'B{r}', '=B5-B6', bold=True); self.A['kan'] = f'Antagelser!$B${r}'; r += 1
        for s, txt in [('A', 'A  Må kontaktes · ejer bor der'), ('B', 'B  Må kontaktes · ejer bor et andet sted'),
                       ('C', 'C  Reklamebeskyttet · ejer bor der'), ('D', 'D  Reklamebeskyttet · ejer bor et andet sted')]:
            lbl(ws, f'A{r}', txt, indent=1); hard(ws, f'B{r}', seg[s]); self.A['seg' + s] = f'Antagelser!$B${r}'; r += 1
        note(ws, f'D{r-4}', 'Segment-tal tælles fra Breve-fanen')

        section(ws, 13, 'Denne omgang (kohorten)', 6)
        lbl(ws, 'A14', 'Brevene sendt den'); inp(ws, 'B14', SENDT, fmt='dd-mm-yyyy'); self.A['sendt'] = 'Antagelser!$B$14'
        lbl(ws, 'A15', 'Segmenter sendt'); put(ws, 'B15', 'A + C', align='right'); note(ws, 'D15', 'B og D (611 breve) er ikke sendt endnu')
        lbl(ws, 'A16', 'Antal breve sendt', bold=True)
        fml(ws, 'B16', '=COUNTIFS(Breve!$G$5:$G$2000,1)', bold=True); self.A['breve'] = 'Antagelser!$B$16'
        lbl(ws, 'A17', 'Ikke sendt endnu (B + D)'); fml(ws, 'B17', '=B9+B11'); self.A['ikkeSendt'] = 'Antagelser!$B$17'

        section(ws, 19, 'Omkostning og værdi', 6)
        lbl(ws, 'A20', 'Pris pr. brev, inkl. print og porto (kr)'); inp(ws, 'B20', None, fmt='#,##0.00'); self.A['pris'] = 'Antagelser!$B$20'
        note(ws, 'D20', 'Udfyld. Uden en pris viser Konklusion ikke omkostning pr. lead og pr. køb')
        lbl(ws, 'A21', 'Bruttoavance pr. købt lejlighed (kr)'); inp(ws, 'B21', None); self.A['avance'] = 'Antagelser!$B$21'
        note(ws, 'D21', 'Udfyld. Bruges til at vise, hvad et brev må koste for at løbe rundt')

        section(ws, 23, 'Trin vi ikke måler endnu (indtast, når tallet findes)', 6)
        lbl(ws, 'A24', 'Besøg på forsiden fra brevet'); inp(ws, 'B24', None); self.A['besoeg'] = 'Antagelser!$B$24'
        note(ws, 'D24', 'QR-koden på brevene peger på forsiden uden kode, så vi kan ikke se, hvem der scannede')
        lbl(ws, 'A25', 'Startet beregneren (adresse tastet)'); inp(ws, 'B25', None); self.A['startet'] = 'Antagelser!$B$25'
        note(ws, 'D25', 'Beregneren gemmer først noget ved afsendelse. Trinmåling er ikke bygget')

        section(ws, 27, 'Hvornår tæller et tal', 6)
        lbl(ws, 'A28', 'Mindste antal for at kalde en rate sikker'); inp(ws, 'B28', 10); self.A['minN'] = 'Antagelser!$B$28'
        note(ws, 'D28', 'Rater på færre end dette antal bruges ikke til at udpege lækager og erstattes af gæt i fremskrivningen')
        ws.freeze_panes = 'A4'

    # ── Breve ───────────────────────────────────────────────────────────
    def breve_fane(self):
        ws = self.wb.create_sheet('Breve')
        title(ws, 'Breve', 'Alle 1.097 modtagere i runde 2. Adresserne er erstattet af en hash. Kolonne E er udfyldt for de breve, der er sendt.', 7)
        header_row(ws, 4, ['Adresse-hash', 'Segment', 'Forening', 'Kvm', 'Sendt', 'Fik brev jul 2025', 'Sendt (1/0)'])
        widths(ws, {'A': 20, 'B': 10, 'C': 28, 'D': 8, 'E': 12, 'F': 16, 'G': 11})
        for i, b in enumerate(self.breve):
            r = 5 + i
            hard(ws, f'A{r}', b['hash'], fmt='@'); hard(ws, f'B{r}', b['segment'], fmt='@'); hard(ws, f'C{r}', b['forening'], fmt='@')
            hard(ws, f'D{r}', b['kvm']);
            fml(ws, f'E{r}', f'=IF(OR(B{r}="A",B{r}="C"),Antagelser!$B$14,"")', fmt='dd-mm-yyyy')
            hard(ws, f'F{r}', b['jul'], fmt='@')
            fml(ws, f'G{r}', f'=IF(OR(B{r}="A",B{r}="C"),1,0)', fmt='0')
        ws.freeze_panes = 'A5'

    # ── Data ────────────────────────────────────────────────────────────
    def data_fane(self):
        ws = self.wb.create_sheet('Data')
        gen = til_dato(self.crm['genereret'])
        title(ws, 'Data', f'Hentet fra CRM {gen:%d-%m-%Y %H:%M}. Én række pr. lead, uden navne, mails, telefon og adresser. Kør bygfunnel.py for at opdatere.', 36)
        self.A['hentet'] = 'Data!$B$3'
        lbl(ws, 'A3', 'Hentet'); put(ws, 'B3', gen, fmt='dd-mm-yyyy hh:mm', color='0000FF')
        self.A['nCrm'] = 'Data!$D$3'
        lbl(ws, 'C3', 'Leads i CRM'); hard(ws, 'D3', self.crm['antal'])
        cols = [
            ('Lead', 8), ('Oprettet', 16), ('Kilde', 18), ('Postnr', 8), ('Forening', 24), ('Kvm', 6), ('Test', 6),
            ('Brevmatch', 11), ('Segment', 9), ('Gruppe', 20),
            ('Hvornår vil du flytte', 18), ('Efter salget', 22), ('Stand samlet', 11), ('Udgifter udfyldt', 9), ('Billeder', 8),
            ('Bud', 11), ('Markedsestimat', 12), ('Trin nu', 22),
            ('Booking sendt', 16), ('Kundens svar', 16), ('Første opkald', 16), ('Aftalt', 16), ('Afholdt', 16),
            ('Bud afgivet', 16), ('Købt', 16), ('Ikke enige om pris', 16), ('Vil ikke sælge nu', 16), ('Arkiveret / tabt', 16),
            ('Dage brev→lead', 10), ('Dage →booking', 10), ('Dage →svar', 10), ('Dage →aftalt', 10),
            ('Dage →afholdt', 10), ('Dage →bud', 10), ('Dage →købt', 10),
        ]
        header_row(ws, 4, [c[0] for c in cols])
        for i, (_, w) in enumerate(cols):
            ws.column_dimensions[openpyxl.utils.get_column_letter(i + 1)].width = w

        leads = sorted(self.leads, key=lambda x: x['oprettet'] or '')
        for i, l in enumerate(leads):
            r = 5 + i
            b = l['_brev']
            vals = {
                'A': l['id'], 'B': til_dato(l['oprettet']), 'C': l['kilde'] or 'ældre import', 'D': l['postnr'],
                'E': (b['forening'] if b else l['forening']), 'F': l['kvm'], 'G': l['test'],
                'H': l['_match'] or None, 'I': (b['segment'] if b else None),
                'K': l['tidshorisont'], 'L': l['efterSalget'], 'M': l['standSamlet'], 'N': l['udgifterUdfyldt'], 'O': l['billeder'],
                'P': l['bud'], 'Q': l['estimat'], 'R': l['trinNu'],
                'S': til_dato(l['tBooking']), 'T': til_dato(l['tSvar']), 'U': til_dato(l['tOpkald']), 'V': til_dato(l['tAftalt']),
                'W': til_dato(l['tAfholdt']), 'X': til_dato(l['tBud']), 'Y': til_dato(l['tKoebt']),
                'Z': til_dato(l['tIkkeEnige']), 'AA': til_dato(l['tVilIkkeNu']), 'AB': til_dato(l['tArkiv']),
            }
            for c, v in vals.items():
                if v is None:
                    continue
                cell = hard(ws, f'{c}{r}', v, fmt=('dd-mm-yyyy hh:mm' if isinstance(v, datetime) else '@' if isinstance(v, str) else NUM))
            # Gruppe: formel, så reglen er synlig
            fml(ws, f'J{r}',
                f'=IF(G{r}=1,"Test",IF(AND(OR(I{r}="A",I{r}="C"),B{r}>=Antagelser!$B$14),"Runde 2",'
                f'IF(LEFT(C{r},12)="boligberegne","Anden beregner-lead","Øvrige")))', fmt='@')
            # Dage fra lead (kun kohorten)
            fml(ws, f'AC{r}', f'=IF($J{r}="Runde 2",B{r}-Antagelser!$B$14,"")', fmt='0.0')
            for kol, tid in [('AD', 'S'), ('AE', 'T'), ('AF', 'V'), ('AG', 'W'), ('AH', 'X'), ('AI', 'Y')]:
                fml(ws, f'{kol}{r}', f'=IF(AND($J{r}="Runde 2",{tid}{r}<>""),{tid}{r}-$B{r},"")', fmt='0.0')
        ws.freeze_panes = 'B5'

    # Hjælper: reference til Data-kolonne
    @staticmethod
    def D(c):
        return f'Data!${c}$5:${c}${DR}'

    def tael(self, *krav):
        """COUNTIFS på Data med kohorten som fast krav. krav = (kolonne, kriterium)…"""
        dele = [f'{self.D("J")},"Runde 2"'] + [f'{self.D(c)},{k}' for c, k in krav]
        return 'COUNTIFS(' + ','.join(dele) + ')'

    # ── Funnel ──────────────────────────────────────────────────────────
    def funnel(self):
        ws = self.wb.create_sheet('Funnel')
        title(ws, 'Funnel: breve sendt 11.09.2026 til køb', 'Kohorten er de breve, der blev sendt i denne omgang (segment A og C). Alt tælles på leads, hvis adresse er en af de 486.', 10)
        widths(ws, {'A': 40, 'B': 11, 'C': 12, 'D': 14, 'E': 14, 'F': 13, 'G': 15, 'H': 11, 'I': 3, 'J': 60})

        section(ws, 4, 'Hvem fik brev', 10)
        lbl(ws, 'A5', 'Målgruppe (bolig 20–80 kvm)'); fml(ws, 'C5', f'={self.A["mal"]}')
        lbl(ws, 'A6', '− koncernens egne lejligheder'); fml(ws, 'C6', f'=-{self.A["egne"]}')
        lbl(ws, 'A7', 'Kan få brev', bold=True); fml(ws, 'C7', '=C5+C6', bold=True)
        lbl(ws, 'A8', '− ikke sendt endnu (segment B og D)'); fml(ws, 'C8', f'=-{self.A["ikkeSendt"]}')
        lbl(ws, 'A9', 'Breve sendt denne omgang', bold=True); fml(ws, 'C9', '=C7+C8', bold=True)

        section(ws, 11, 'Kohortens funnel', 10)
        header_row(ws, 12, ['Trin', 'Målt', 'Antal', '% af forrige målte', '% af breve sendt', 'Tabt fra forrige', 'Median dage fra lead', 'Lille n', '', 'Hvad tallet er'])
        # (label, målt?, formel for antal, dagekolonne eller None, kommentar)
        t = self.tael
        trin = [
            ('Breve sendt', 'Ja', f'={self.A["breve"]}', None, 'Segment A og C, sendt 11.09.2026'),
            ('Besøgt siden fra brevet', 'Nej', f'=IF({self.A["besoeg"]}="","ikke målt",{self.A["besoeg"]})', None, 'QR-koden har ingen kode. Se Antagelser'),
            ('Startet beregneren', 'Nej', f'=IF({self.A["startet"]}="","ikke målt",{self.A["startet"]})', None, 'Beregneren logger ikke trin. Se fanen Beregner'),
            ('Gennemført beregneren (lead)', 'Ja', f'={t()}', 'AC', 'Leads hvis adresse matcher et sendt brev. Dage er fra brevet blev sendt'),
            ('Booking-mail sendt', 'Ja', f'={t(("S", chr(34)+"<>"+chr(34)))}', 'AD', 'Første udgående mail med booking-frasen'),
            ('Kunden har svaret', 'Ja', f'={t(("T", chr(34)+"<>"+chr(34)))}', 'AE', 'Første indgående mail. Svar til administration@ er først med fra 05.10'),
            ('Besigtigelse aftalt', 'Ja', f'={t(("V", chr(34)+"<>"+chr(34)))}', 'AF', 'Stage-skift til aftalt, eller aftale i telefonen'),
            ('Besigtigelse afholdt', 'Ja', f'={t(("W", chr(34)+"<>"+chr(34)))}', 'AG', ''),
            ('Bud afgivet', 'Ja', f'={t(("X", chr(34)+"<>"+chr(34)))}', 'AH', ''),
            ('Købt', 'Ja', f'={t(("Y", chr(34)+"<>"+chr(34)))}', 'AI', ''),
        ]
        first = 13
        prev_measured = None
        self.F['rows'] = {}
        for i, (navn, maalt, formel, dagkol, kom) in enumerate(trin):
            r = first + i
            lbl(ws, f'A{r}', navn, bold=(i in (0, 3, 9)))
            put(ws, f'B{r}', maalt, align='center', color='64748B')
            fml(ws, f'C{r}', formel, bold=(i in (0, 3, 9)))
            ws[f'C{r}'].alignment = Alignment(horizontal='right')
            if maalt == 'Ja' and prev_measured:
                fml(ws, f'D{r}', f'=IF(AND(ISNUMBER(C{r}),ISNUMBER(C{prev_measured}),C{prev_measured}>0),C{r}/C{prev_measured},"–")', fmt=PCT)
                fml(ws, f'F{r}', f'=IF(AND(ISNUMBER(C{r}),ISNUMBER(C{prev_measured})),C{prev_measured}-C{r},"–")')
            else:
                put(ws, f'D{r}', '–', align='right'); put(ws, f'F{r}', '–', align='right')
            fml(ws, f'E{r}', f'=IF(AND(ISNUMBER(C{r}),$C${first}>0),C{r}/$C${first},"–")', fmt=PCT)
            if dagkol:
                fml(ws, f'G{r}', f'=IFERROR(MEDIAN({self.D(dagkol)}),"–")', fmt='0.0')
            else:
                put(ws, f'G{r}', '–', align='right')
            if maalt == 'Ja' and prev_measured:
                fml(ws, f'H{r}', f'=IF(AND(ISNUMBER(C{prev_measured}),C{prev_measured}<{self.A["minN"]}),"lille n","")')
            note(ws, f'J{r}', kom)
            self.F['rows'][navn] = r
            if maalt == 'Ja':
                prev_measured = r
        self.F['first'] = first
        self.F['last'] = first + len(trin) - 1

        # K: sikker rate (ellers blank) til lækage-opslag
        prev = None
        for i, (navn, maalt, *_r) in enumerate(trin):
            r = first + i
            if maalt == 'Ja' and prev and navn != 'Gennemført beregneren (lead)':
                fml(ws, f'K{r}', f'=IF(AND(ISNUMBER(D{r}),C{prev}>={self.A["minN"]}),D{r},"")', fmt=PCT)
            if maalt == 'Ja':
                prev = r
        ws.column_dimensions['K'].width = 12
        put(ws, f'K{first-1}', 'Sikker rate', bold=True, color='1E293B', size=9, align='center', fill=SUB_FILL, border=BOX)

        # Status i dag
        r0 = self.F['last'] + 3
        section(ws, r0, 'Hvor står kohortens leads i dag', 10)
        header_row(ws, r0 + 1, ['Trin nu', '', 'Antal', '% af leads'])
        stat = [
            ('Ny lead', 'ny-lead'), ('Besigtigelse foreslået', 'besigtigelse-foreslaaet'), ('Besigtigelse aftalt', 'besigtigelse-aftalt'),
            ('Besigtigelse afholdt', 'besigtigelse-afholdt'), ('Bud afgivet', 'bud-afgivet'), ('Ikke enige om pris', 'ikke-enige-om-pris'),
            ('Vil ikke sælge nu', 'vil-ikke-saelge-nu'), ('Købt', 'koebt'), ('Arkiveret', 'arkiveret'), ('Tabt', 'tabt'),
        ]
        leadrow = self.F['rows']['Gennemført beregneren (lead)']
        for j, (navn, slug) in enumerate(stat):
            r = r0 + 2 + j
            lbl(ws, f'A{r}', navn)
            fml(ws, f'C{r}', f'={t(("R", chr(34)+slug+chr(34)))}')
            fml(ws, f'D{r}', f'=IF($C${leadrow}>0,C{r}/$C${leadrow},"–")', fmt=PCT)
        rr = r0 + 2 + len(stat)
        lbl(ws, f'A{rr}', 'Øvrige trin (ældre navne)')
        fml(ws, f'C{rr}', f'=C{leadrow}-SUM(C{r0+2}:C{rr-1})')
        fml(ws, f'D{rr}', f'=IF($C${leadrow}>0,C{rr}/$C${leadrow},"–")', fmt=PCT)
        self.F['stat0'] = r0 + 2

        # Pr. segment
        r1 = rr + 3
        section(ws, r1, 'Pr. segment', 10)
        header_row(ws, r1 + 1, ['Segment', '', 'Breve', 'Leads', 'Respons', 'Booking', 'Svar', 'Aftalt', '', 'Afholdt · Bud · Købt'])
        self.F['seg0'] = r1 + 2
        for j, (s, txt) in enumerate([('A', 'A  Må kontaktes, ejer bor der'), ('C', 'C  Reklamebeskyttet, ejer bor der')]):
            r = r1 + 2 + j
            lbl(ws, f'A{r}', txt)
            fml(ws, f'C{r}', f'=COUNTIFS(Breve!$B$5:$B$2000,"{s}",Breve!$G$5:$G$2000,1)')
            fml(ws, f'D{r}', f'={t(("I", chr(34)+s+chr(34)))}')
            fml(ws, f'E{r}', f'=IF(C{r}>0,D{r}/C{r},"–")', fmt=PCT)
            fml(ws, f'F{r}', f'={t(("I", chr(34)+s+chr(34)), ("S", chr(34)+"<>"+chr(34)))}')
            fml(ws, f'G{r}', f'={t(("I", chr(34)+s+chr(34)), ("T", chr(34)+"<>"+chr(34)))}')
            fml(ws, f'H{r}', f'={t(("I", chr(34)+s+chr(34)), ("V", chr(34)+"<>"+chr(34)))}')
            fml(ws, f'J{r}', f'={t(("I", chr(34)+s+chr(34)), ("W", chr(34)+"<>"+chr(34)))}&" · "&{t(("I", chr(34)+s+chr(34)), ("X", chr(34)+"<>"+chr(34)))}&" · "&{t(("I", chr(34)+s+chr(34)), ("Y", chr(34)+"<>"+chr(34)))}', fmt='@')
        rs = r1 + 4
        lbl(ws, f'A{rs}', 'Samlet', bold=True)
        for c in 'CDFGH':
            fml(ws, f'{c}{rs}', f'=SUM({c}{r1+2}:{c}{r1+3})', bold=True)
        fml(ws, f'E{rs}', f'=IF(C{rs}>0,D{rs}/C{rs},"–")', fmt=PCT, bold=True)

        # Sammenligning
        r2 = rs + 3
        section(ws, r2, 'Til sammenligning: beregner-leads uden for runden', 10)
        header_row(ws, r2 + 1, ['', '', 'Antal', '', '', 'Booking', 'Svar', 'Aftalt', '', 'Afholdt · Bud · Købt'])
        lbl(ws, f'A{r2+2}', 'Anden beregner-lead')
        def anden(*krav):
            dele = [f'{self.D("J")},"Anden beregner-lead"'] + [f'{self.D(c)},{k}' for c, k in krav]
            return 'COUNTIFS(' + ','.join(dele) + ')'
        fml(ws, f'C{r2+2}', f'={anden()}')
        fml(ws, f'F{r2+2}', f'={anden(("S", chr(34)+"<>"+chr(34)))}')
        fml(ws, f'G{r2+2}', f'={anden(("T", chr(34)+"<>"+chr(34)))}')
        fml(ws, f'H{r2+2}', f'={anden(("V", chr(34)+"<>"+chr(34)))}')
        fml(ws, f'J{r2+2}', f'={anden(("W", chr(34)+"<>"+chr(34)))}&" · "&{anden(("X", chr(34)+"<>"+chr(34)))}&" · "&{anden(("Y", chr(34)+"<>"+chr(34)))}', fmt='@')
        note(ws, f'A{r2+3}', 'Beregner-leads, hvis adresse ikke er et sendt brev: ældre leads fra før runden, segment B og D, og adresser uden for målgruppen.')
        ws.freeze_panes = 'A4'

    # ── Pr. forening ────────────────────────────────────────────────────
    def pr_forening(self):
        ws = self.wb.create_sheet('Pr. forening')
        title(ws, 'Pr. forening', 'Kohortens funnel pr. ejerforening. Forening er brevlistens gruppering.', 11)
        widths(ws, {'A': 28, 'B': 10, 'C': 10, 'D': 10, 'E': 10, 'F': 10, 'G': 10, 'H': 10, 'I': 10, 'J': 12, 'K': 14})
        header_row(ws, 4, ['Forening', 'Breve sendt', 'Leads', 'Respons', 'Booking', 'Svar', 'Aftalt', 'Afholdt', 'Bud', 'Købt', 'Ikke sendt endnu (B+D)'])
        sendt = Counter(b['forening'] for b in self.breve if b['segment'] in SENDTE_SEGMENTER)
        alle = Counter(b['forening'] for b in self.breve)
        fors = sorted(alle, key=lambda f: (-sendt[f], f))
        first = 5
        for i, f in enumerate(fors):
            r = first + i
            hard(ws, f'A{r}', f, fmt='@')
            fml(ws, f'B{r}', f'=COUNTIFS(Breve!$C$5:$C$2000,$A{r},Breve!$G$5:$G$2000,1)')
            q = lambda *kr: 'COUNTIFS(' + ','.join([f'{self.D("J")},"Runde 2"', f'{self.D("E")},$A{r}'] + [f'{self.D(c)},{k}' for c, k in kr]) + ')'
            fml(ws, f'C{r}', f'={q()}')
            fml(ws, f'D{r}', f'=IF(B{r}>0,C{r}/B{r},"–")', fmt=PCT)
            for col_, tid in [('E', 'S'), ('F', 'T'), ('G', 'V'), ('H', 'W'), ('I', 'X'), ('J', 'Y')]:
                fml(ws, f'{col_}{r}', f'={q((tid, chr(34)+"<>"+chr(34)))}')
            fml(ws, f'K{r}', f'=COUNTIFS(Breve!$C$5:$C$2000,$A{r},Breve!$G$5:$G$2000,0)')
        last = first + len(fors) - 1
        r = last + 1
        lbl(ws, f'A{r}', 'I alt', bold=True)
        for c in 'BCEFGHIJK':
            fml(ws, f'{c}{r}', f'=SUM({c}{first}:{c}{last})', bold=True)
        fml(ws, f'D{r}', f'=IF(B{r}>0,C{r}/B{r},"–")', fmt=PCT, bold=True)
        self.F['forTotal'] = r
        note(ws, f'A{r+2}', 'Respons er leads divideret med breve sendt. Små foreninger har få breve, så en enkelt reply flytter raten meget.')
        ws.freeze_panes = 'B5'

    # ── Beregner ────────────────────────────────────────────────────────
    def beregner(self):
        ws = self.wb.create_sheet('Beregner')
        title(ws, 'Beregner: hvor falder de fra', 'Trinene er målt ved at kigge på dem, der gennemførte. Hvor de falder fra, kræver trinmåling (se nederst).', 8)
        widths(ws, {'A': 44, 'B': 16, 'C': 14, 'D': 12, 'E': 3, 'F': 70})
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
            ('9  Estimat og lead oprettet', 'Her gemmes leadet. Dette tal kender vi allerede: kohortens leads'),
        ]
        first = 6
        for i, (navn, kom) in enumerate(steps):
            r = first + i
            lbl(ws, f'A{r}', navn)
            if i == len(steps) - 1:
                fml(ws, f'B{r}', f'={self.tael()}')
            else:
                inp(ws, f'B{r}', None)
            if i > 0:
                fml(ws, f'C{r}', f'=IF(AND(ISNUMBER(B{r}),ISNUMBER(B{r-1}),B{r-1}>0),B{r}/B{r-1},"–")', fmt=PCT)
                fml(ws, f'D{r}', f'=IF(AND(ISNUMBER(B{r}),ISNUMBER(B{r-1})),B{r-1}-B{r},"–")')
            note(ws, f'F{r}', kom)
        last = first + len(steps) - 1
        note(ws, f'A{last+1}', 'Gule felter er tomme, fordi trinene ikke logges. Når de er målt, peger «% af forrige» på det trin, der taber flest.')

        # B: hvad de gennemførte svarede
        r0 = last + 4
        section(ws, r0, 'B. Det vi kan se i dag: hvad de gennemførte valgte (runde 2)', 8)
        header_row(ws, r0 + 1, ['Svar', 'Antal', '% af leads', '', '', 'Kommentar'])
        leadrow = self.F['rows']['Gennemført beregneren (lead)']
        n = f'Funnel!$C${leadrow}'
        def rad(r, navn, kolonne, vaerdi, kom='', key=None):
            if key: self.F[key] = f'Beregner!$C${r}'
            lbl(ws, f'A{r}', navn, indent=1)
            fml(ws, f'B{r}', f'={self.tael((kolonne, chr(34)+vaerdi+chr(34)))}')
            fml(ws, f'C{r}', f'=IF({n}>0,B{r}/{n},"–")', fmt=PCT)
            if kom: note(ws, f'F{r}', kom)
        r = r0 + 2
        lbl(ws, f'A{r}', 'Udgifter udfyldt', bold=True); r += 1
        rad(r, 'Udfyldt', 'N', '1'); r += 1
        rad(r, 'Sat til «senere»', 'N', '0', 'Blød drop-out: kunden kom til estimatet uden at give os udgifterne', key='udg_senere'); r += 1
        lbl(ws, f'A{r}', 'Billeder med', bold=True); r += 1
        rad(r, 'Har uploadet billeder', 'O', '1', 'Billedupload findes først fra 28.09, så ældre leads er 0'); r += 1
        lbl(ws, f'A{r}', 'Hvornår vil du flytte', bold=True); r += 1
        for v in ['Hurtigst muligt', '1–3 måneder', '3–6 måneder', '6+ måneder', 'Ved ikke endnu']:
            rad(r, v, 'K', v, key=('tid_ved_ikke' if v == 'Ved ikke endnu' else None)); r += 1
        lbl(ws, f'A{r}', 'Efter salget', bold=True); r += 1
        for v in ['Flytter ud helt', 'Vil leje en anden bolig', 'Vil blive boende som lejer', 'Ved ikke endnu']:
            rad(r, v, 'L', v, key=('efter_ved_ikke' if v == 'Ved ikke endnu' else None)); r += 1
        lbl(ws, f'A{r}', 'Stand samlet (prismotorens niveau)', bold=True); r += 1
        for v in ['nyrenoveret', 'god', 'middel', 'trænger', 'slidt']:
            rad(r, v, 'M', v); r += 1

        # C: plan
        r += 2
        section(ws, r, 'C. Sådan måler vi trinene (ikke bygget)', 8)
        for j, txt in enumerate([
            'Hvert trin sender én anonym hændelse til CRM’et: trin, tidspunkt og et sessions-id. Ingen navne, adresser eller indtastede værdier.',
            'Sessions-id regnes på serveren af en hash af IP, browser og dato. Der gemmes ingen cookie og intet på kundens enhed.',
            'Så kan vi se unikke besøgende pr. trin og dermed, hvor de falder fra. Samme metode giver besøg på forsiden.',
            'Tilføj personlige koder på brevene (/k/<kode>), så et besøg kan kobles til en modtager. Koden kan også forhåndsudfylde adressen.',
            'Få jeres rådgiver til at bekræfte, at måling uden cookie ikke kræver samtykke, før det slås til.',
        ]):
            note(ws, f'A{r+1+j}', f'{j+1}. {txt}')

    # ── Sensitivity ─────────────────────────────────────────────────────
    def sensitivity(self):
        ws = self.wb.create_sheet('Sensitivity')
        title(ws, 'Sensitivity: hvad flytter antal køb', 'Hver rate er målt, hvis grundlaget er stort nok, ellers et gæt (gult). Gæt er ikke resultater.', 9)
        widths(ws, {'A': 40, 'B': 11, 'C': 11, 'D': 12, 'E': 12, 'F': 12, 'G': 12, 'H': 12, 'I': 50})
        section(ws, 4, 'Drivere', 9)
        header_row(ws, 5, ['Driver', 'Målt', 'Grundlag (n)', 'Gæt', 'Bruges', 'Kilde', 'Køb pr. 1.000 breve', 'Hvis +1 pp', 'Hvad det er'])
        R = self.F['rows']
        def ref(n): return f'Funnel!$C${R[n]}'
        spec = [
            ('Respons: breve → lead', f'={ref("Gennemført beregneren (lead)")}/{ref("Breve sendt")}', f'={ref("Breve sendt")}', None, 'Leads divideret med breve sendt'),
            ('Lead → besigtigelse aftalt', f'=IF({ref("Gennemført beregneren (lead)")}>0,{ref("Besigtigelse aftalt")}/{ref("Gennemført beregneren (lead)")},0)', f'={ref("Gennemført beregneren (lead)")}', 0.15, 'Hvor mange leads ender med en aftalt besigtigelse'),
            ('Aftalt → afholdt', f'=IF({ref("Besigtigelse aftalt")}>0,{ref("Besigtigelse afholdt")}/{ref("Besigtigelse aftalt")},0)', f'={ref("Besigtigelse aftalt")}', 0.85, 'Hvor mange aftalte besigtigelser bliver til afholdte'),
            ('Afholdt → bud', f'=IF({ref("Besigtigelse afholdt")}>0,{ref("Bud afgivet")}/{ref("Besigtigelse afholdt")},0)', f'={ref("Besigtigelse afholdt")}', 0.80, 'Hvor mange besigtigelser ender med et bud'),
            ('Bud → køb', f'=IF({ref("Bud afgivet")}>0,{ref("Købt")}/{ref("Bud afgivet")},0)', f'={ref("Bud afgivet")}', 0.25, 'Hvor mange bud bliver til en handel'),
        ]
        first = 6
        for i, (navn, malt, n, gaet, kom) in enumerate(spec):
            r = first + i
            lbl(ws, f'A{r}', navn)
            fml(ws, f'B{r}', malt, fmt=PCT)
            fml(ws, f'C{r}', n)
            if gaet is None:
                put(ws, f'D{r}', '–', align='right')
                fml(ws, f'E{r}', f'=B{r}', fmt=PCT)
                put(ws, f'F{r}', 'Målt', align='center')
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
        lbl(ws, f'A{r}', 'Køb pr. 1.000 breve', bold=True); kpi(ws, f'G{r}', f'=1000*{prod}', fmt='0.00')
        lbl(ws, f'A{r+1}', 'Breve pr. købt lejlighed'); fml(ws, f'G{r+1}', f'=IF(G{r}>0,1000/G{r},"–")', fmt='#,##0')
        lbl(ws, f'A{r+2}', 'Omkostning pr. købt (kr)')
        fml(ws, f'G{r+2}', f'=IF(AND(ISNUMBER({self.A["pris"]}),{self.A["pris"]}>0,ISNUMBER(G{r+1})),G{r+1}*{self.A["pris"]},"udfyld pris")', fmt='#,##0')
        lbl(ws, f'A{r+3}', 'Et brev må koste højst (kr), for at det løber rundt')
        fml(ws, f'G{r+3}', f'=IF(AND(ISNUMBER({self.A["avance"]}),{self.A["avance"]}>0),G{r}/1000*{self.A["avance"]},"udfyld avance")', fmt='#,##0.00')
        self.F['kpi'] = r

        r0 = r + 6
        section(ws, r0, 'Forventede køb: antal breve × respons (resten af kæden som ovenfor)', 9)
        lbl(ws, f'A{r0+1}', 'Breve sendt ↓   Respons →', italic=True)
        resp = [0.02, 0.04, 0.066, 0.08, 0.10]
        for j, v in enumerate(resp):
            inp(ws, f'{chr(66+j)}{r0+1}', v, fmt=PCT)
        down = '*'.join(f'$E${first+i}' for i in range(1, len(spec)))
        for k, nb in enumerate([250, 500, 1000, 1500, 2000]):
            rr = r0 + 2 + k
            inp(ws, f'A{rr}', nb, fmt='#,##0')
            for j in range(len(resp)):
                c = chr(66 + j)
                fml(ws, f'{c}{rr}', f'=$A{rr}*{c}${r0+1}*{down}', fmt='0.0')
        note(ws, f'A{r0+8}', 'Respons i runde 2 står i drivere ovenfor. Matricen viser, hvad fx 1.000 breve giver ved andre responsrater.')

    # ── Konklusion ──────────────────────────────────────────────────────
    def konklusion(self):
        ws = self.wb.create_sheet('Konklusion', 0)
        title(ws, 'Konklusion: funnel fra brev til køb', 'Runde 2: breve sendt 11.09.2026 (segment A og C). Alle tal er formler på Data og Breve.', 8)
        widths(ws, {'A': 40, 'B': 12, 'C': 14, 'D': 14, 'E': 3, 'F': 62})
        R = self.F['rows']
        ws['A3'].value = None
        fml(ws, 'A3', f'="Data hentet "&TEXT({self.A["hentet"]},"dd-mm-yyyy")&" · "&{self.A["breve"]}&" breve sendt"', fmt='@')
        ws['A3'].font = _font(False, '64748B', 9, True)

        section(ws, 5, 'Funnel', 8)
        header_row(ws, 6, ['Trin', 'Antal', '% af breve', '% af forrige', '', 'Bemærkning'])
        vis = ['Breve sendt', 'Besøgt siden fra brevet', 'Startet beregneren', 'Gennemført beregneren (lead)', 'Booking-mail sendt',
               'Kunden har svaret', 'Besigtigelse aftalt', 'Besigtigelse afholdt', 'Bud afgivet', 'Købt']
        for i, navn in enumerate(vis):
            r = 7 + i
            fr = R[navn]
            lbl(ws, f'A{r}', navn, bold=(navn in ('Breve sendt', 'Gennemført beregneren (lead)', 'Købt')))
            fml(ws, f'B{r}', f'=Funnel!C{fr}'); ws[f'B{r}'].alignment = Alignment(horizontal='right')
            fml(ws, f'C{r}', f'=Funnel!E{fr}', fmt=PCT)
            fml(ws, f'D{r}', f'=Funnel!D{fr}', fmt=PCT)
            fml(ws, f'F{r}', f'=IF(ISNUMBER(B{r}),IF(Funnel!H{fr}="lille n","Få data: læs med forbehold",""),"Ikke målt")', fmt='@')
            ws[f'F{r}'].font = _font(False, '64748B', 9, True)
        e = 7 + len(vis)
        for rad_ in range(7, e):
            for kol_ in 'BCD':
                ws[f'{kol_}{rad_}'].alignment = Alignment(horizontal='right')

        # lækage
        section(ws, e + 1, 'Hvor lækker det', 8)
        a, b = R['Booking-mail sendt'], R['Købt']
        sikker = f'Funnel!$K${a}:$K${b}'
        trin_navne = f'Funnel!$A${a}:$A${b}'
        lbl(ws, f'A{e+2}', 'Laveste sikre trin-rate')
        fml(ws, f'B{e+2}', f'=IF(COUNT({sikker})=0,"–",MIN({sikker}))', fmt=PCT)
        lbl(ws, f'A{e+3}', 'Trinnet')
        fml(ws, f'B{e+3}', f'=IF(COUNT({sikker})=0,"for få data",INDEX({trin_navne},MATCH(MIN({sikker}),{sikker},0)))', fmt='@')
        ws.merge_cells(f'B{e+3}:D{e+3}')
        lbl(ws, f'A{e+4}', 'Mistet mellem brev og lead')
        fml(ws, f'B{e+4}', f'=Funnel!C{R["Breve sendt"]}-Funnel!C{R["Gennemført beregneren (lead)"]}')
        note(ws, f'F{e+4}', 'Det største enkelte tab. Vi kan ikke se hvor: besøg og start er ikke målt')
        fml(ws, f'F{e+3}', f'=IF(B{e+3}="Kunden har svaret","Svarraten er et minimum: svar til administration@ nåede ikke CRM’et før 05.10","")', fmt='@')
        ws[f'F{e+3}'].font = _font(False, '64748B', 9, True)
        note(ws, f'F{e+2}', 'Kun trin hvor forrige trin har mindst det antal, der står i Antagelser')

        # drivere
        d1, d2 = self.F['drivers']
        k = self.F['kpi']
        section(ws, e + 6, 'Driverne og hvad én procentpoint er værd (køb pr. 1.000 breve)', 8)
        header_row(ws, e + 7, ['Driver', 'Bruges', 'Kilde', 'Hvis +1 pp', '', 'Grundlag'])
        for i in range(d2 - d1 + 1):
            r = e + 8 + i
            fml(ws, f'A{r}', f'=Sensitivity!A{d1+i}', fmt='@')
            fml(ws, f'B{r}', f'=Sensitivity!E{d1+i}', fmt=PCT)
            fml(ws, f'C{r}', f'=Sensitivity!F{d1+i}', fmt='@')
            fml(ws, f'D{r}', f'=Sensitivity!H{d1+i}-Sensitivity!G{d1+i}', fmt='+0.00;-0.00;"–"')
            fml(ws, f'F{r}', f'="n = "&Sensitivity!C{d1+i}', fmt='@')
            ws[f'F{r}'].font = _font(False, '64748B', 9, True)
        rr = e + 8 + (d2 - d1 + 1)
        lbl(ws, f'A{rr}', 'Køb pr. 1.000 breve', bold=True); kpi(ws, f'B{rr}', f'=Sensitivity!G{k}', fmt='0.00')
        lbl(ws, f'A{rr+1}', 'Breve pr. købt lejlighed'); fml(ws, f'B{rr+1}', f'=Sensitivity!G{k+1}', fmt='#,##0')
        lbl(ws, f'A{rr+2}', 'Omkostning pr. købt (kr)'); fml(ws, f'B{rr+2}', f'=Sensitivity!G{k+2}', fmt='#,##0')
        note(ws, f'F{rr}', 'Gæt i de sidste led til kohorten har nået dem. Kilden står ved hver driver')

        # hvad leads fortæller
        section(ws, rr + 4, 'Hvad de, der gennemfører, fortæller', 8)
        for j, (txt, key, kom) in enumerate([
            ('Satte udgifterne til «senere»', 'udg_senere', 'Buddet regnes uden drift, og vi skal indhente tallene ved besigtigelsen'),
            ('Ved ikke endnu, hvornår de vil flytte', 'tid_ved_ikke', 'Størstedelen er ikke i gang med at sælge. Det er en lang opfølgning, ikke et hurtigt salg'),
            ('Ved ikke endnu, hvad de skal efter salget', 'efter_ved_ikke', ''),
        ]):
            lbl(ws, f'A{rr+5+j}', txt); fml(ws, f'B{rr+5+j}', f'={self.F[key]}', fmt=PCT)
            if kom: note(ws, f'F{rr+5+j}', kom)
        rr += 5
        # hvad vi ikke ved
        section(ws, rr + 4, 'Hvad vi ikke kan se endnu', 8)
        for j, txt in enumerate([
            'Hvor mange der besøgte siden fra brevet, og hvor mange der startede beregneren. QR-koden har ingen kode.',
            'Hvor i beregneren de falder fra. Den gemmer først ved afsendelse.',
            'Svar til administration@ før 05.10. Videresendelsen til CRM’et er ikke bevist at virke.',
            'Opkald før 05.10. Fanen Opkald findes først fra da, så «første opkald» er næsten tom.',
        ]):
            note(ws, f'A{rr+5+j}', f'· {txt}')
        # kontroller
        rk = rr + 10
        lbl(ws, f'A{rk}', 'Kontroller', bold=True)
        fml(ws, f'B{rk}', "='Kontroller og flag'!C3", fmt='@')
        ws.freeze_panes = 'A5'

    # ── Kontroller og flag ──────────────────────────────────────────────
    def kontroller(self):
        ws = self.wb.create_sheet('Kontroller og flag')
        title(ws, 'Kontroller og flag', None, 6)
        widths(ws, {'A': 64, 'B': 14, 'C': 12, 'D': 60})
        header_row(ws, 5, ['Kontrol', 'Værdi', 'Status', 'Kommentar'])
        R = self.F['rows']
        lead = f'Funnel!$C${R["Gennemført beregneren (lead)"]}'
        tests = [
            ('Breve sendt = segment A + C i brevlisten', f'={self.A["breve"]}-({self.A["segA"]}+{self.A["segC"]})', '=IF(B{r}=0,"OK","FEJL")', ''),
            ('A + B + C + D = kan få brev', f'={self.A["segA"]}+{self.A["segB"]}+{self.A["segC"]}+{self.A["segD"]}-{self.A["kan"]}', '=IF(B{r}=0,"OK","FEJL")', ''),
            ('Rækker i Data = leads i CRM', f'=COUNTA({self.D("A")})-{self.A["nCrm"]}', '=IF(B{r}=0,"OK","FEJL")', ''),
            ('Testleads, udeladt af alle tal', f'=COUNTIFS({self.D("J")},"Test")', '=IF(B{r}>=0,"Info","")', 'Jacob Lisby og Test Test'),
            ('Kohortens leads matchet kun på gade og nummer', f'=COUNTIFS({self.D("J")},"Runde 2",{self.D("H")},"gade+nr")', '=IF(B{r}=0,"OK","Tjek")', 'Adressen havde ikke etage og dør. Matchet hvis gade+nr er entydigt'),
            ('Kohortens leads uden forening', f'=COUNTIFS({self.D("J")},"Runde 2",{self.D("E")},"")', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Afholdt større end aftalt', f'=MAX(0,Funnel!C{R["Besigtigelse afholdt"]}-Funnel!C{R["Besigtigelse aftalt"]})', '=IF(B{r}=0,"OK","Tjek")', 'Kan ske, hvis et trin blev sprunget over i CRM’et'),
            ('Bud større end afholdt', f'=MAX(0,Funnel!C{R["Bud afgivet"]}-Funnel!C{R["Besigtigelse afholdt"]})', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Købt større end bud', f'=MAX(0,Funnel!C{R["Købt"]}-Funnel!C{R["Bud afgivet"]})', '=IF(B{r}=0,"OK","Tjek")', ''),
            ('Dage siden data blev hentet', f'=ROUND(NOW()-{self.A["hentet"]},0)', '=IF(B{r}<=7,"OK","Gammel")', 'Kør bygfunnel.py for at opdatere'),
            ('Trin der ikke måles', f'=COUNTIF(Funnel!$B${R["Breve sendt"]}:$B${R["Købt"]},"Nej")', '=IF(B{r}=0,"OK","Flag")', 'Besøg og start af beregner. Se Antagelser'),
            ('Pris pr. brev udfyldt', f'=IF(ISNUMBER({self.A["pris"]}),1,0)', '=IF(B{r}=1,"OK","Mangler")', 'Uden pris vises ingen omkostning pr. køb'),
        ]
        r = 6
        first = r
        for text, form, status, kom in tests:
            lbl(ws, f'A{r}', text); fml(ws, f'B{r}', form)
            fml(ws, f'C{r}', status.replace('{r}', str(r)), fmt='@'); note(ws, f'D{r}', kom)
            r += 1
        last = r - 1
        lbl(ws, 'A3', 'Samlet', bold=True)
        fml(ws, 'C3', f'=IF(COUNTIF(C{first}:C{last},"FEJL")>0,"FEJL",IF(COUNTIF(C{first}:C{last},"Tjek")+COUNTIF(C{first}:C{last},"Flag")+COUNTIF(C{first}:C{last},"Mangler")+COUNTIF(C{first}:C{last},"Gammel")>0,"Flag","OK"))', fmt='@', bold=True)
        fml(ws, 'D3', f'=COUNTIF(C{first}:C{last},"FEJL")&" fejl · "&(COUNTIF(C{first}:C{last},"Tjek")+COUNTIF(C{first}:C{last},"Flag")+COUNTIF(C{first}:C{last},"Mangler")+COUNTIF(C{first}:C{last},"Gammel"))&" flag"', fmt='@')

    def byg(self, ud):
        self.antagelser()
        self.breve_fane()
        self.data_fane()
        self.funnel()
        self.pr_forening()
        self.beregner()
        self.sensitivity()
        self.konklusion()
        self.kontroller()
        navne = ['Konklusion', 'Antagelser', 'Funnel', 'Pr. forening', 'Beregner', 'Sensitivity', 'Kontroller og flag', 'Data', 'Breve']
        self.wb._sheets = [self.wb[n] for n in navne]
        for ws in self.wb.worksheets:
            ws.sheet_view.showGridLines = False
            ws.sheet_properties.tabColor = None
        self.wb.save(ud)


def naeste_version():
    n = 1
    while (VAULT / f'Funnel boligberegner – v{n}.xlsx').exists():
        n += 1
    return n


if __name__ == '__main__':
    crm = hent_crm()
    breve, gade = laes_brevliste()
    n = int(sys.argv[1]) if len(sys.argv) > 1 else naeste_version()
    ud = VAULT / f'Funnel boligberegner – v{n}.xlsx'
    Bygger(crm, breve, gade).byg(ud)
    print('skrevet', ud)
