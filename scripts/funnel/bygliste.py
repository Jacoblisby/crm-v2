#!/usr/bin/env python3
"""
To fulde lister til brevkampagnen, samlet i én arbejdsmappe i vaulten:

  Adresser         én række pr. lejlighed på brevlisten: adresse, ejer, kontakt,
                   breve sendt og datoer, og om lejligheden er blevet til et lead
  Ejerforeninger   alle foreninger vi har fundet, hvor de kommer fra, og hvorfor
                   de er med eller ikke er med

Indeholder personoplysninger (ejernavne, mails, telefon). Skrives derfor kun til
vaulten, aldrig til repoet. Ejernavne og lead-kontakter ligger ikke i repoet; de
gives til scriptet som filer:

  --ejere    JSON  {bfe: {ejer, ovrige, adr}}  fra Resights-udtrækket
  --kontakt  TXT   id|navn|mail|telefon        fra lead-siderne i CRM

Kør:  python3 scripts/funnel/bygliste.py --ejere ejernavne.json --kontakt leadkontakt.txt
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

sys.path.insert(0, str(Path(__file__).parent))
from bygfunnel import BREVLISTE, ROLLUP, VAULT, ROD, h, hent_crm, norm, til_dato  # noqa: E402

JUL_2025 = datetime(2025, 7, 24)
SEP_2026 = datetime(2026, 9, 11)
STATUSARK = VAULT / 'Ejerforeninger breve Status.xlsx'
EJERE_JSON = ROD / 'src/lib/data/ejere.json'

NAVY, GREY, LINE = '1E293B', 'F1F5F9', 'CBD5E1'
HEAD = PatternFill('solid', fgColor=NAVY)
BAND = PatternFill('solid', fgColor=GREY)
F = lambda b=False, c='000000', s=10, i=False: Font(name='Arial', bold=b, color=c, size=s, italic=i)

TRIN = {
    'ny-lead': 'Ny lead', 'besigtigelse-foreslaaet': 'Besigtigelse foreslået', 'besigtigelse-aftalt': 'Besigtigelse aftalt',
    'besigtigelse-afholdt': 'Besigtigelse afholdt', 'bud-afgivet': 'Bud afgivet', 'ikke-enige': 'Ikke enige om pris',
    'vil-ikke-nu': 'Vil ikke sælge nu', 'koebt': 'Købt', 'arkiv': 'Arkiv',
    'arkiveret': 'Arkiveret', 'vil-ikke-saelge-nu': 'Vil ikke sælge nu', 'ikke-enige-om-pris': 'Ikke enige om pris',
}
SEGTEKST = {'A': 'Må kontaktes, ejer bor der', 'B': 'Må kontaktes, ejer bor et andet sted',
            'C': 'Reklamebeskyttet, ejer bor der', 'D': 'Reklamebeskyttet, ejer bor et andet sted'}
# Foreninger der står to gange i CRM-registret under hvert sit navn
DUBLET = {'Blomsterparken': 'Lupin, Hvede, Erantis', 'Lindebo': 'ejerforeningen Lindebo 1-29'}


def tabel(ws, header, rows, bredder, datokolonner=(), taltal=()):
    ws.append(header)
    for c in ws[1]:
        c.font = F(True, 'FFFFFF')
        c.fill = HEAD
        c.alignment = Alignment(wrap_text=True, vertical='center')
    ws.row_dimensions[1].height = 34
    for r in rows:
        ws.append(r)
    for i, w in enumerate(bredder, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = F()
            c.alignment = Alignment(vertical='top', wrap_text=c.column_letter in ws._wrap)
            if c.column in datokolonner:
                c.number_format = 'dd-mm-yyyy'
            if c.column in taltal:
                c.number_format = '#,##0'
    ws.freeze_panes = 'B2'
    ws.auto_filter.ref = ws.dimensions
    ws.sheet_view.showGridLines = False


def laes_flettefil():
    rows = list(openpyxl.load_workbook(BREVLISTE, data_only=True)['Flettefil'].iter_rows(values_only=True))
    ix = {n: i for i, n in enumerate(rows[0])}
    ud = []
    for r in rows[1:]:
        if not r[0]:
            continue
        pn = str(r[ix['Postnr og by']]).split()[0]
        linje = str(r[ix['Adresselinje 1']])
        ud.append(dict(
            seg=r[ix['Segment']], rb=r[ix['Reklamebeskyttet']], ejertype=r[ix['Ejertype']], forening=r[ix['Forening']],
            adresse=f"{linje}, {r[ix['Postnr og by']]}", kvm=r[ix['Kvm']], jul=r[ix['Fik brev jul 2025']] == 'Ja', bfe=int(r[ix['BFE']]),
            hash=h(norm(linje) + '|' + pn), gade=h(norm(linje.split(',')[0]) + '|' + pn)))
    return ud


def laes_egne():
    ws = openpyxl.load_workbook(BREVLISTE, data_only=True)['Fratrukket (egne)']
    return [dict(bfe=int(r[0]), adresse=r[1], forening=r[2], ejertype=r[3]) for r in list(ws.iter_rows(values_only=True))[1:] if r[0]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ejere', required=True)
    ap.add_argument('--kontakt', required=True)
    ap.add_argument('-o', '--ud', default=str(VAULT / 'Brevliste og ejerforeninger.xlsx'))
    a = ap.parse_args()

    breve = laes_flettefil()
    egne = laes_egne()
    ejernavn = {int(k): v for k, v in json.load(open(a.ejere)).items()}
    ejere = {u['bfe']: u for u in json.load(open(EJERE_JSON))['enheder']}
    kontakt = {}
    for linje in open(a.kontakt, encoding='utf-8'):
        p = linje.rstrip('\n').split('|')
        if len(p) >= 4:
            kontakt[p[0]] = dict(navn=p[1].strip(), mail=p[2].strip(), tel=p[3].strip())
    crm = hent_crm()
    hentet = til_dato(crm['genereret'])

    # lead → brev (samme regel som funnel-regnearket)
    efter_hash = {b['hash']: b for b in breve}
    efter_gade = {}
    for b in breve:
        efter_gade.setdefault(b['gade'], []).append(b)
    for b in breve:
        b['leads'] = []
    for l in crm['leads']:
        if l['test'] or not l['oprettet'] or l['id'] not in kontakt:
            continue
        b = efter_hash.get(l['nogle']) if l.get('nogle') else None
        if not b and l.get('nogleGade') and len(efter_gade.get(l['nogleGade'], [])) == 1:
            b = efter_gade[l['nogleGade']][0]
        if b:
            b['leads'].append(l)

    # ── Fane 1: Adresser ────────────────────────────────────────────────
    rows = []
    for b in sorted(breve, key=lambda x: (x['forening'], x['adresse'])):
        u = ejere.get(b['bfe'], {})
        n = ejernavn.get(b['bfe'], {})
        sendt26 = b['seg'] in ('A', 'C')
        ls = sorted(b['leads'], key=lambda l: l['oprettet'])
        sidste = ls[-1] if ls else None
        k = kontakt.get(sidste['id']) if sidste else {}
        ejer_navn = n.get('ejer') if n.get('ejer') not in (None, '-') else ''
        ovrige = n.get('ovrige') if n.get('ovrige') not in (None, '-') else ''
        ejer_adr = n.get('adr') if n.get('adr') not in (None, '-') else ''
        rows.append([
            b['adresse'], b['forening'], b['kvm'], b['seg'], SEGTEKST[b['seg']],
            'Ja' if u.get('ejerBorDer') else 'Nej', b['rb'], b['ejertype'], u.get('ejerAlder') if isinstance(u.get('ejerAlder'), (int, float)) else None,
            u.get('cvr') if u.get('cvr') not in (None, '-') else '', ejer_navn, ovrige, ejer_adr,
            k.get('navn', ''), k.get('mail', ''), k.get('tel', ''),
            'Ja' if b['jul'] else 'Nej', JUL_2025 if b['jul'] else None,
            'Ja' if sendt26 else 'Nej', SEP_2026 if sendt26 else None,
            int(b['jul']) + int(sendt26),
            len(ls) or None, til_dato(sidste['oprettet']) if sidste else None,
            TRIN.get(sidste['trinNu'], sidste['trinNu']) if sidste else '',
            b['bfe'],
        ])
    for e in sorted(egne, key=lambda x: x['adresse']):
        rows.append([e['adresse'], e['forening'], None, 'Egen', 'Koncernens egen lejlighed, trukket fra listen', '', '', e['ejertype'], None, '', '', '', '', '', '', '', 'Nej', None, 'Nej', None, 0, None, None, '', e['bfe']])
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Adresser'
    ws._wrap = ()
    header = ['Adresse', 'Forening', 'Kvm', 'Segment', 'Hvad segmentet betyder', 'Ejer bor på adressen', 'Reklame-beskyttet', 'Ejertype',
              'Ejers alder', 'CVR', 'Ejer', 'Øvrige ejere', 'Ejers adresse', 'Lead: navn', 'Lead: mail', 'Lead: telefon',
              'Brev jul 2025', 'Sendt jul 2025', 'Brev sep 2026', 'Sendt sep 2026', 'Breve i alt', 'Antal leads', 'Seneste lead oprettet', 'Seneste leads trin', 'BFE']
    bredder = [40, 24, 6, 8, 30, 10, 11, 14, 8, 11, 30, 26, 40, 24, 30, 14, 9, 12, 9, 12, 8, 7, 13, 22, 10]
    tabel(ws, header, rows, bredder, datokolonner=(18, 20, 23))
    n = len(rows) + 3
    ws.cell(n, 1, f'Leads hentet fra CRM {hentet:%d-%m-%Y}. Ejer er hentet fra Resights-udtrækket (primær ejer). Mail og telefon findes kun for lejligheder, der er blevet til et lead.').font = F(i=True, c='64748B')
    ws.cell(n + 1, 1, 'Segment A og C fik brev 11.09.2026. B og D er ikke sendt. Ejers adresse på B og D er der, hvor et brev til ejeren selv ville lande.').font = F(i=True, c='64748B')
    ws.cell(n + 2, 1, 'Jul 2025 er brevrunden 24.07.2025. Koncernens egne lejligheder står nederst og har ikke fået brev.').font = F(i=True, c='64748B')

    # ── Fane 2: Ejerforeninger ──────────────────────────────────────────
    rollup = {f['forening']: f for f in json.load(open(ROLLUP))['foreninger']}
    crm_f = {(f['by'].strip().lower(), f['gade'].strip().lower()): f for f in crm['foreninger']}
    stat = list(openpyxl.load_workbook(STATUSARK, data_only=True)['EJERFORENINGER'].iter_rows(values_only=True))
    tael = {}
    for b in breve:
        t = tael.setdefault(b['forening'], dict(ac=0, bd=0, jul=0))
        t['ac' if b['seg'] in ('A', 'C') else 'bd'] += 1
        t['jul'] += b['jul']
    ark = []
    brugt = set()
    for r in stat[1:]:
        if not r[0] or not r[1] or str(r[0]).strip() == 'Total':
            continue
        by, adr, navn = str(r[0]).strip(), str(r[1]).strip(), (str(r[2]).strip() if r[2] else 'Ukendt')
        cf = crm_f.get((by.lower(), adr.lower()))
        if cf:
            brugt.add((by.lower(), adr.lower()))
        ark.append(dict(by=by, adr=adr, navn=cf['navn'] if cf else navn, enh=r[3], kvm=r[4], mail=r[6], mail2=r[7], hvorfor=r[8], nxt=r[9],
                        status=cf['status'] if cf else None, runder=cf['breveRunder'] if cf else None))
    for f in crm['foreninger']:
        if (f['by'].strip().lower(), f['gade'].strip().lower()) not in brugt and f['navn'] not in {x['navn'] for x in ark}:
            ark.append(dict(by=f['by'], adr=f['gade'], navn=f['navn'], enh=f['enheder'], kvm=None, mail=None, mail2=None, hvorfor=f['hvorfor'], nxt=None, status=f['status'], runder=f['breveRunder'], dublet=True))
    frows = []
    for x in ark:
        ru = rollup.get(x['adr'])
        ru = ru if ru and (ru['foreningNavn'] == x['navn'] or ru['by'] == x['by']) else None
        t = tael.get(x['adr'], dict(ac=0, bd=0, jul=0))
        status = {'maalgruppe': 'Målgruppe', 'undersoeges': 'Undersøges', 'fravalgt': 'Fravalgt'}.get(x['status'], x['status'] or '')
        kvm = x['kvm'] if isinstance(x['kvm'], str) else (f"{x['kvm']}" if x['kvm'] else '')
        # beslutning og begrundelse
        if x.get('dublet'):
            beslutning = 'Dublet'
            hvorfor = f"Samme forening som {DUBLET.get(x['navn'], 'en anden post')}, som står under det navn i registret. Tælles dér."
            kilde = 'Oprettet i CRM-registret'
        elif x['status'] == 'fravalgt':
            beslutning = 'Fravalgt'
            hvorfor = f"{x['hvorfor']}." if x['hvorfor'] else 'Ingen begrundelse noteret.'
            kilde = 'Jacobs screening (statusarket)'
        elif x['status'] == 'undersoeges' or (x['status'] is None and x['nxt']):
            beslutning = 'Undersøges, ikke sendt'
            dele = [str(x['hvorfor']).rstrip('.') + '.' if x['hvorfor'] else '', f"Næste skridt: {x['nxt']}." if x['nxt'] else '']
            hvorfor = ' '.join(d for d in dele if d) or 'Ikke vurderet endnu.'
            kilde = 'Jacobs screening (statusarket)'
        elif t['ac'] or t['bd']:
            beslutning = 'Med: brev sendt'
            hvorfor = (f"I målgruppen (20–80 kvm). {t['ac']} breve sendt 11.09.2026 (ejer bor på adressen). "
                       f"{t['bd']} ikke sendt (ejer bor et andet sted eller reklamebeskyttet).")
            kilde = 'Jacobs screening (statusarket)'
        else:
            beslutning = 'Målgruppe, ikke sendt'
            hvorfor = ('I målgruppen' + (' (ny tilføjet)' if x['hvorfor'] == 'Ny tilføjet' else '') +
                       ', men ikke med i brevrunden 11.09.2026: vi har ikke Resights-ejerdata for foreningen, så brevlisten kunne ikke bygges.')
            kilde = 'Jacobs screening (statusarket)'
        frows.append([
            x['navn'], x['by'], x['adr'], x['enh'], kvm,
            ru['boliger'] if ru else None, ru['iMaalgruppe'] if ru else None, ru['maalEjerBor'] if ru else None,
            ru['maalUdlejet'] if ru else None, ru['maalTom'] if ru else None,
            beslutning, hvorfor, status, kilde,
            'Ja' if t['jul'] else 'Nej', t['jul'] or None, t['ac'] or None, (t['ac'] + t['jul']) if (t['ac'] or t['jul']) else None,
            x['mail'] or '', x['mail2'] or '',
        ])
    ord_ = {'Med: brev sendt': 0, 'Målgruppe, ikke sendt': 1, 'Undersøges, ikke sendt': 2, 'Fravalgt': 3, 'Dublet': 4}
    frows.sort(key=lambda r: (ord_[r[10]], r[1], r[0]))
    ws2 = wb.create_sheet('Ejerforeninger')
    ws2._wrap = ('L', 'A', 'C')
    header2 = ['Ejerforening', 'By', 'Adresse', 'Enheder i alt', 'Kvm fra–til', 'Boliger i BBR', 'Heraf 20–80 kvm', 'Ejer bor der', 'Udlejet', 'Tom',
               'Beslutning', 'Hvorfor med eller ikke med', 'Status i CRM', 'Hvor den kommer fra',
               'Brev jul 2025', 'Breve jul 2025', 'Breve sep 2026', 'Breve i alt',
               'Mail sendt (statusarket)', 'Mail sendt 23/11 (statusarket)']
    bredder2 = [30, 12, 26, 9, 10, 9, 10, 9, 9, 7, 22, 70, 13, 28, 9, 9, 9, 9, 12, 12]
    tabel(ws2, header2, frows, bredder2)
    n2 = len(frows) + 3
    for i, t in enumerate([
        'Alle foreninger er fundet og vurderet af Jacob i statusarket (Ejerforeninger breve Status.xlsx). Enheder og kvm er fra Resights og BBR. Hvor præcis hver forening først blev fundet (søgning, mægler, Boligsiden) er ikke noteret i noget af vores data.',
        'Kolonnerne «Mail sendt» er kopieret uændret fra statusarket. Jeg ved ikke sikkert, hvad datoen 23/11 dækker, så den er ikke brugt til at tælle breve.',
        f'Antal breve er talt fra brevlisten 11.09.2026. Foreninger, CRM og BBR hentet {hentet:%d-%m-%Y}.',
    ]):
        ws2.cell(n2 + i, 1, t).font = F(i=True, c='64748B')

    Path(a.ud).parent.mkdir(parents=True, exist_ok=True)
    wb.save(a.ud)
    print('skrevet', a.ud, len(rows), 'adresser,', len(frows), 'foreninger')


if __name__ == '__main__':
    main()
