#!/usr/bin/env python3
"""
Funnel-regnearket i sin enkleste form: to faner.

  1  Funnel  tragten fra brev til køb, med frafald pr. trin
  2  Breve   hvem der har fået brev, og hvor mange gange

Tallene hentes live fra CRM (/api/admin/funnel-data) og brevlisten og skrives som
blå tal. Procenter, frafald og bjælker er formler. Ingen adresser, navne eller mails.

Kør:  python3 scripts/funnel/bygfunnel_simpel.py [versionsnummer]
"""
import json
import sys
from datetime import datetime
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

sys.path.insert(0, str(Path(__file__).parent))
from bygfunnel import SEGTEKST, VAULT, hent_crm, laes_brevliste, til_dato  # noqa: E402
from mstyle import PCT, _font, fml, hard, header_row, inp, lbl, note, put, section, title, widths  # noqa: E402

SENDT_FLOW1 = datetime(2026, 9, 11)
LINKS = json.load(open(Path(__file__).with_name('drive-links.json')))
BREV = {'A': 'Beboende ejer brev 2', 'C': 'Beboende ejer brev 2', 'B': 'Udlejer brev 1', 'D': 'Udlejer brev 1'}
LINK_FONT = Font(name='Arial', size=10, color='0000FF', underline='single')


def tael(crm, breve):
    """Tæl leads pr. segment og trin. Et lead hører til et brev, hvis adressen matcher."""
    efter_hash = {b['hash']: b for b in breve}
    efter_gade = {}
    for b in breve:
        efter_gade.setdefault(b['gade'], []).append(b)
    trin = ['lead', 'booking', 'aftalt', 'afholdt', 'bud', 'koebt']
    tal = {f: {t: 0 for t in trin} for f in ('Flow 1', 'Flow 2')}
    seg_leads = {s: 0 for s in 'ABCD'}
    for l in crm['leads']:
        if l['test'] or not l['oprettet']:
            continue
        b = efter_hash.get(l['nogle']) if l.get('nogle') else None
        if not b and l.get('nogleGade') and len(efter_gade.get(l['nogleGade'], [])) == 1:
            b = efter_gade[l['nogleGade']][0]
        if not b:
            continue
        flow = 'Flow 1' if b['segment'] in 'AC' else 'Flow 2'
        if flow == 'Flow 2' or til_dato(l['oprettet']) < SENDT_FLOW1:
            continue   # Flow 2 er ikke sendt, og leads før brevet hører ikke til det
        d = lambda k: bool(l[k])
        koebt, ikke_enige = d('tKoebt'), d('tIkkeEnige')
        bud = d('tBud') or ikke_enige or koebt
        afholdt = d('tAfholdt') or bud
        aftalt = d('tAftalt') or afholdt
        tal[flow]['lead'] += 1
        tal[flow]['booking'] += d('tBooking')
        tal[flow]['aftalt'] += aftalt
        tal[flow]['afholdt'] += afholdt
        tal[flow]['bud'] += bud
        tal[flow]['koebt'] += koebt
        seg_leads[b['segment']] += 1
    return tal, seg_leads


def byg(ud):
    crm, breve = hent_crm(), laes_brevliste()
    tal, seg_leads = tael(crm, breve)
    hentet = til_dato(crm['genereret'])
    antal = {s: sum(1 for b in breve if b['segment'] == s) for s in 'ABCD'}
    fik25 = {s: sum(1 for b in breve if b['segment'] == s and b['jul'] == 'Ja') for s in 'ABCD'}

    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    # ── Breve ───────────────────────────────────────────────────────────
    wb_ = wb.create_sheet('Breve')
    title(wb_, 'Breve', 'Hvem der har fået brev, og hvor mange gange. Skriv sendedatoen i de gule felter, når et flow sendes.', 12)
    widths(wb_, {'A': 9, 'B': 8, 'C': 36, 'D': 9, 'E': 12, 'F': 10, 'G': 12, 'H': 9, 'I': 9, 'J': 9, 'K': 9, 'L': 24})
    header_row(wb_, 4, ['Segment', 'Flow', 'Hvem', 'Antal', 'Sendt den', 'Sendt', 'Fik brev jul 2025', '0 breve', '1 brev', '2 breve', 'Leads', 'Brev'])
    wb_.row_dimensions[4].height = 32
    for j, s in enumerate('ABCD'):
        r = 5 + j
        lbl(wb_, f'A{r}', s, bold=True)
        lbl(wb_, f'B{r}', 'Flow 1' if s in 'AC' else 'Flow 2')
        lbl(wb_, f'C{r}', SEGTEKST[s])
        hard(wb_, f'D{r}', antal[s])
        inp(wb_, f'E{r}', SENDT_FLOW1 if s in 'AC' else None, fmt='dd-mm-yyyy')
        fml(wb_, f'F{r}', f'=IF(E{r}="",0,D{r})')
        hard(wb_, f'G{r}', fik25[s])
        fml(wb_, f'H{r}', f'=D{r}-I{r}-J{r}')
        fml(wb_, f'I{r}', f'=IF(E{r}="",G{r},D{r}-G{r})')
        fml(wb_, f'J{r}', f'=IF(E{r}="",0,G{r})')
        hard(wb_, f'K{r}', seg_leads[s])
        c = wb_[f'L{r}']; c.value = BREV[s]; c.hyperlink = LINKS[BREV[s]]; c.font = LINK_FONT
    lbl(wb_, 'A9', 'I alt', bold=True)
    for c in 'DFGHIJK':
        fml(wb_, f'{c}9', f'=SUM({c}5:{c}8)', bold=True)
    note(wb_, 'A11', 'Flow 1 er ejer bor på adressen (A og C). Flow 2 er ejer bor et andet sted (B og D). C og D er reklamebeskyttede.')
    note(wb_, 'A12', 'Brevene til B og D lander hos lejeren, ikke ejeren, fordi ejerens postadresse ikke er i datasættet.')
    note(wb_, 'A13', f'Antal breve pr. modtager = brev i juli 2025 (hvis modtageren var med) + brev i 2026 (hvis sendt). Leads hentet fra CRM {hentet:%d-%m-%Y}.')

    # ── Funnel ──────────────────────────────────────────────────────────
    ws = wb.create_sheet('Funnel', 0)
    title(ws, 'Funnel: fra brev til køb', f'Leads og trin hentet fra CRM {hentet:%d-%m-%Y}. Et lead tæller med på alle de trin, det har passeret.', 8)
    widths(ws, {'A': 26, 'B': 10, 'C': 40, 'D': 12, 'E': 10, 'F': 3, 'G': 10})
    header_row(ws, 4, ['Trin', 'Flow 1', 'Tragt', '% af forrige', 'Faldt fra', '', 'Flow 2'])
    ws.row_dimensions[4].height = 28
    rader = [
        ('Breve sendt', "=Breve!F5+Breve!F7", "=Breve!F6+Breve!F8", None),
        ('Lead', tal['Flow 1']['lead'], tal['Flow 2']['lead'], 'lead'),
        ('Booking sendt', tal['Flow 1']['booking'], tal['Flow 2']['booking'], 'booking'),
        ('Besigtigelse aftalt', tal['Flow 1']['aftalt'], tal['Flow 2']['aftalt'], 'aftalt'),
        ('Besigtigelse afholdt', tal['Flow 1']['afholdt'], tal['Flow 2']['afholdt'], 'afholdt'),
        ('Bud afgivet', tal['Flow 1']['bud'], tal['Flow 2']['bud'], 'bud'),
        ('Købt', tal['Flow 1']['koebt'], tal['Flow 2']['koebt'], 'koebt'),
    ]
    for i, (navn, f1, f2, _) in enumerate(rader):
        r = 5 + i
        lbl(ws, f'A{r}', navn, bold=True)
        (fml if isinstance(f1, str) else hard)(ws, f'B{r}', f1)
        (fml if isinstance(f2, str) else hard)(ws, f'G{r}', f2)
        if i == 0:
            fml(ws, f'C{r}', '=IF(B5>0,"Respons: "&ROUND(100*B6/B5,1)&" % blev til et lead","")', fmt='@')
            ws[f'C{r}'].font = _font(False, '64748B', 9, True)
        else:
            fml(ws, f'C{r}', f'=IF($B$6>0,REPT("█",MAX(IF(B{r}>0,1,0),ROUND(32*B{r}/$B$6,0))),"")', fmt='@')
            ws[f'C{r}'].font = _font(False, '1E293B', 10)
            fml(ws, f'D{r}', f'=IF(B{r-1}>0,B{r}/B{r-1},"–")', fmt=PCT)
            fml(ws, f'E{r}', f'=B{r-1}-B{r}')
        for c in 'BCDEG':
            ws[f'{c}{r}'].alignment = Alignment(horizontal=('center' if c == 'C' else 'right'), vertical='center')
        ws.row_dimensions[r].height = 24
    note(ws, 'A13', 'Bjælkerne viser Flow 1 i forhold til antal leads. Flow 2 er ikke sendt endnu.')
    note(ws, 'A14', 'Bud afgivet tæller også dem, der siden blev uenige om prisen.')
    for w in wb.worksheets:
        w.sheet_view.showGridLines = False
    wb.save(ud)


if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    ud = VAULT / f'Funnel boligberegner – v{n}.xlsx'
    byg(ud)
    print('skrevet', ud)
