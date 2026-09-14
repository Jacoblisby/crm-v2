"""
Comps pr. ejerforening som regneark — én fane pr. forening.

Samme data som /foreninger/[id]: handler-forening.json (Resights, seneste
handel pr. lejlighed). Fanen viser de seneste 36 måneder plus alle vores
egne køb uanset alder, så man kan se, hvad vi gav, ved siden af markedet.

Kør:  python3 scripts/bbr/comps_xlsx.py
"""
import datetime as dt
import json
import os
import re
import statistics

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'lib', 'data')
UD = os.path.expanduser('~/Desktop/Claude Vault/Projects/Brevkampagne ejerforeninger/Comps pr. ejerforening.xlsx')
I_DAG = dt.date.today()

with open(os.path.join(DATA, 'handler-forening.json'), encoding='utf-8') as f:
    d = json.load(f)
VIS_MDR = d['maaneder']


def tilbage(dato, mdr):
    y, m = dato.year, dato.month - mdr
    while m <= 0:
        m += 12; y -= 1
    return dato.replace(year=y, month=m)


G12, G24, GVIS = (tilbage(I_DAG, m).isoformat() for m in (12, 24, VIS_MDR))

FED = Font(bold=True)
GRAA = Font(color='7B8482')
VORES = PatternFill('solid', fgColor='D9EAE8')
HOVED = PatternFill('solid', fgColor='F2F6F6')


def median(v):
    return statistics.median(v) if v else None


def noegletal(h, g):
    frie = [x['krPrKvm'] for x in h if x['dato'] >= g and not x['vores'] and x['fri'] and x['krPrKvm'] > 0]
    return len(frie), (round(median(frie)) if frie else None)


def fanenavn(navn):
    # Excel: max 31 tegn, ingen af : \ / ? * [ ]
    n = re.sub(r'[:\\/?*\[\]]', '', navn).replace('Ukendt · ', '')
    return n[:31]


wb = openpyxl.Workbook()
ov = wb.active
ov.title = 'Overblik'
ov.append([f'Comps pr. ejerforening · Resights, seneste handel pr. lejlighed · genereret {I_DAG:%d.%m.%Y}'])
ov['A1'].font = Font(bold=True, size=13)
ov.append(['Nøgletal er frie handler uden vores egne køb. Vores køb: median-forskel til markedet i samme størrelse (±20 % kvm) i 12 mdr op til købet.'])
ov['A2'].font = GRAA
ov.append([])
ov.append(['Forening', 'Frie handler 12 mdr', 'Median kr/kvm 12 mdr', 'Frie handler 24 mdr', 'Median kr/kvm 24 mdr',
           'Vores køb', 'Vores median kr/kvm', 'Median-forskel til markedet'])
for c in ov[4]:
    c.font = FED; c.fill = HOVED; c.alignment = Alignment(wrap_text=True, vertical='top')

for navn, h in sorted(d['foreninger'].items(), key=lambda kv: -len(kv[1])):
    h = sorted(h, key=lambda x: x['dato'], reverse=True)
    marked = [x for x in h if not x['vores'] and x['fri'] and x['krPrKvm'] > 0]

    # Vores køb målt mod samme størrelse — samme regel som på siden.
    koeb = []
    for k in [x for x in h if x['vores']]:
        lo, hi = round(k['kvm'] * 0.8), round(k['kvm'] * 1.2)
        ss = [x for x in marked if lo <= x['kvm'] <= hi and x['dato'] <= k['dato']]
        v, mdr = [], 12
        for mdr in (12, 24, 36):
            kd = dt.date.fromisoformat(k['dato'])
            v = [x for x in ss if x['dato'] >= tilbage(kd, mdr).isoformat()]
            if len(v) >= 3:
                break
        m = round(median([x['krPrKvm'] for x in v])) if len(v) >= 3 else None
        koeb.append((k, m, len(v), mdr, round(100 * (k['krPrKvm'] - m) / m, 1) if m and k['krPrKvm'] else None))

    n12, m12 = noegletal(h, G12)
    n24, m24 = noegletal(h, G24)
    forskelle = [f for *_, f in koeb if f is not None]
    ov.append([navn, n12, m12, n24, m24, len(koeb),
               round(median([k['krPrKvm'] for k, *_ in koeb])) if koeb else None,
               (median(forskelle) / 100) if forskelle else None])
    ov.cell(ov.max_row, 8).number_format = '+0.0%;-0.0%;0.0%'

    # ── Fanen ──
    ws = wb.create_sheet(fanenavn(navn))
    ws.append([navn]); ws['A1'].font = Font(bold=True, size=13)
    ws.append([f'Seneste {VIS_MDR} mdr + alle vores køb · frie handler uden vores køb: {n12} på 12 mdr (median {m12 or "—"} kr/kvm), {n24} på 24 mdr (median {m24 or "—"})'])
    ws['A2'].font = GRAA
    ws.append([])
    hdr = ['Dato', 'Periode', 'Adresse', 'Kvm', 'Pris', 'Kr/kvm', 'Handel', 'Tæller i markedet', 'Vores køb',
           'Marked kr/kvm ved købet', 'Forskel', 'Markedstal bygger på', 'BFE']
    ws.append(hdr)
    for c in ws[4]:
        c.font = FED; c.fill = HOVED; c.alignment = Alignment(wrap_text=True, vertical='top')
    koeb_by = {k['bfe']: (m, n, mdr, f) for k, m, n, mdr, f in koeb}
    for x in h:
        if x['dato'] < GVIS and not x['vores']:
            continue
        periode = '0–12 mdr' if x['dato'] >= G12 else '12–24 mdr' if x['dato'] >= G24 else f'24–{VIS_MDR} mdr' if x['dato'] >= GVIS else f'over {VIS_MDR} mdr'
        m, n, mdr, f = koeb_by.get(x['bfe'], (None, None, None, None))
        ws.append([dt.date.fromisoformat(x['dato']), periode, x['adresse'], x['kvm'], x['pris'], x['krPrKvm'],
                   'Fri handel' if x['fri'] else x['metode'],
                   'Ja' if (x['fri'] and not x['vores']) else 'Nej',
                   'Ja' if x['vores'] else '',
                   m, (f / 100) if f is not None else None,
                   f'{n} handler à {round(x["kvm"]*0.8)}–{round(x["kvm"]*1.2)} kvm / {mdr} mdr' if x['vores'] and n else ('for få handler' if x['vores'] else ''),
                   x['bfe']])
        r = ws.max_row
        ws.cell(r, 1).number_format = 'dd.mm.yyyy'
        ws.cell(r, 5).number_format = '#,##0'
        ws.cell(r, 6).number_format = '#,##0'
        ws.cell(r, 10).number_format = '#,##0'
        ws.cell(r, 11).number_format = '+0.0%;-0.0%;0.0%'
        if x['vores']:
            for c in ws[r]: c.fill = VORES
        elif not x['fri']:
            for c in ws[r]: c.font = GRAA
    ws.freeze_panes = 'A5'
    ws.auto_filter.ref = f'A4:{get_column_letter(len(hdr))}{ws.max_row}'
    for i, w in enumerate((11, 11, 30, 6, 12, 9, 22, 10, 9, 12, 9, 30, 9), start=1):
        ws.column_dimensions[get_column_letter(i)].width = w

for i, w in enumerate((34, 12, 12, 12, 12, 10, 12, 14), start=1):
    ov.column_dimensions[get_column_letter(i)].width = w
ov.freeze_panes = 'A5'
wb.save(UD)
print('Gemt:', UD, '| faner:', len(wb.sheetnames))
