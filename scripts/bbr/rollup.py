# -*- coding: utf-8 -*-
"""
Samler BBR-enhederne til én linje pr. ejerforening.

HVORFOR ET EKSTRA TRIN: bbr-enheder.json er 2.163 rækker og vokser med hver
ejendom. Tragtsiden har ikke brug for den enkelte lejlighed — kun optællingen.
Ved at lægge summeringen her slipper siden for at læse hele filen ved hver
visning, og opgørelsen bliver noget man kan se på i en diff.

Koblingen ejendom -> forening kommer fra bbr-forening-map.json og er
håndskrevet. Se noten i den fil for hvorfor den ikke må gættes.

BRUG:
    /opt/homebrew/bin/python3.12 scripts/bbr/rollup.py
"""
import json, os, datetime as dt, statistics
from collections import defaultdict

ROD = os.path.join(os.path.dirname(__file__), '..', '..')
DATA = os.path.join(ROD, 'src', 'lib', 'data')

KVM_FRA, KVM_TIL = 20, 80
I_DAG = dt.date.today()

with open(os.path.join(DATA, 'bbr-enheder.json'), encoding='utf-8') as f:
    bbr = json.load(f)
with open(os.path.join(DATA, 'bbr-forening-map.json'), encoding='utf-8') as f:
    kort = json.load(f)
with open(os.path.join(DATA, 'ejerforeninger-seed.json'), encoding='utf-8') as f:
    seed = json.load(f)

# Ejerdata er nøglet på den enkelte lejligheds BFE, så koblingen til foreningen
# sker gennem registrets egen BFE-liste — et opslag, ingen gætteri. Filen er
# valgfri: er den ikke hentet endnu, springes ejerkolonnerne bare over.
try:
    with open(os.path.join(DATA, 'ejere.json'), encoding='utf-8') as f:
        ejere = {e['bfe']: e for e in json.load(f)['enheder']}
except FileNotFoundError:
    ejere = {}

kobling = kort['kobling']
udenfor = kort['udenfor']
foreninger = {f['adresse']: f for f in seed['foreninger']}

# Enhver ejendom skal enten være koblet eller bevidst holdt udenfor. En ny
# BBR-fil der ikke er nævnt nogen af stederne, skal opdages her og ikke
# forsvinde stille ud af optællingen.
ukendte = {str(e['bfe']) for e in bbr['ejendomme']} - set(kobling) - set(udenfor)
if ukendte:
    raise SystemExit(
        f'Ejendomme uden kobling: {sorted(ukendte)}\n'
        'Tilføj dem til bbr-forening-map.json — enten under "kobling" eller "udenfor".')

g = defaultdict(lambda: dict(boliger=0, erhverv=0, ubygget=0, iMaalgruppe=0,
                             iMaalgruppe30=0, kvmMin=None, kvmMax=None,
                             # Ejeren bor der selv / har lejet ud. To vidt
                             # forskellige sælgere: beboeren skal flytte,
                             # udlejeren skal regne. Tælles kun for de
                             # lejligheder der ER i målgruppen — det er dem
                             # der skal skrives til.
                             maalEjerBor=0, maalUdlejet=0, maalTom=0,
                             ejendomme=[]))

for e in bbr['ejendomme']:
    navn = kobling.get(str(e['bfe']))
    if navn:
        g[navn]['ejendomme'].append(e['bfe'])

for u in bbr['enheder']:
    navn = kobling.get(str(u['ejendomBfe']))
    if not navn:
        continue
    x = g[navn]
    if not u['erOpfoert']:
        x['ubygget'] += 1
        continue
    if not u['erBolig']:
        x['erhverv'] += 1
        continue
    kvm = u['kvm']
    if not kvm:
        continue
    x['boliger'] += 1
    x['kvmMin'] = kvm if x['kvmMin'] is None else min(x['kvmMin'], kvm)
    x['kvmMax'] = kvm if x['kvmMax'] is None else max(x['kvmMax'], kvm)
    if KVM_FRA <= kvm <= KVM_TIL:
        x['iMaalgruppe'] += 1
        ude = u.get('udlejning') or ''
        if ude.startswith('Benyttet'):
            x['maalEjerBor'] += 1
        elif ude.startswith('Udlejet'):
            x['maalUdlejet'] += 1
        else:
            x['maalTom'] += 1
    if 30 <= kvm <= KVM_TIL:
        x['iMaalgruppe30'] += 1

ud = []
for navn, x in sorted(g.items(), key=lambda kv: -kv[1]['iMaalgruppe']):
    f = foreninger[navn]
    # Databasen gemmer foreningen under NAVN, ikke adresse — og seed-ruten
    # gør «Ukendt» entydig med adressen. Samme regel her, ellers kan siden
    # ikke slå op, og fejlen ville vise sig som «ikke målt» frem for som fejl.
    # Ejerprofil for de af foreningens lejligheder der ER i målgruppen.
    # Kun dem: en 110 kvm lejlighed skal ikke trække medianalderen med sig,
    # når vi aldrig skriver til den.
    ej = [ejere[b] for b in set(f['bfe']) if b in ejere]
    ejM = [e for e in ej if e['erBolig'] and e['kvm'] and KVM_FRA <= e['kvm'] <= KVM_TIL]
    # Markedspris kun på frie handler af én ejendom. Familieoverdragelser og
    # porteføljehandler er også «priser», men ikke priser nogen ville betale.
    def kvmpris(mdr):
        graense = I_DAG - dt.timedelta(days=int(mdr * 30.44))
        v = sorted(e['krPrKvm'] for e in ejM
                   if e.get('friHandel') and e['krPrKvm'] and e['handelsdato']
                   and dt.date.fromisoformat(e['handelsdato']) >= graense)
        if not v:
            return None
        return {'antal': len(v),
                'gns': round(statistics.mean(v)),
                'median': v[len(v) // 2]}

    aldre = sorted(e['ejerAlder'] for e in ejM if e['ejerAlder'])
    priser = sorted(e['krPrKvm'] for e in ejM if e['krPrKvm'])
    ejerprofil = {
        'medDataIMaalgruppe': len(ejM),
        'ejerBorDer': sum(1 for e in ejM if e['ejerBorDer']),
        'selskaber': sum(1 for e in ejM if e['ejerType'] == 'Selskab'),
        'reklamebeskyttet': sum(1 for e in ejM if e['reklamebeskyttet'] == 'Ja'),
        'alderMedian': aldre[len(aldre) // 2] if aldre else None,
        'alder60plus': sum(1 for a in aldre if a >= 60),
        'alder70plus': sum(1 for a in aldre if a >= 70),
        'krPrKvmMedian': priser[len(priser) // 2] if priser else None,
        'kvmpris12mdr': kvmpris(12),
        'kvmpris24mdr': kvmpris(24),
    } if ejM else None

    db_navn = f['navn'] if f['navn'] and f['navn'] != 'Ukendt' else f"{f['navn'] or 'Ukendt'} · {f['adresse']}"
    ud.append({
        'forening': navn,
        'foreningNavn': db_navn,
        'by': f['by'],
        'status': f['status'],
        'registreretEnheder': len(f['bfe']) or f['enheder'] or 0,
        **{k: v for k, v in x.items() if k != 'ejendomme'},
        'ejendomme': sorted(x['ejendomme']),
        'ejerprofil': ejerprofil,
    })

sti = os.path.join(DATA, 'bbr-forening-rollup.json')
with open(sti, 'w', encoding='utf-8') as f:
    json.dump({
        'kilde': bbr['kilde'],
        'kvmFra': KVM_FRA,
        'kvmTil': KVM_TIL,
        'foreninger': ud,
    }, f, ensure_ascii=False, indent=1)

maal = [r for r in ud if r['status'] == 'maalgruppe']
print(f'{len(ud)} foreninger målt op, heraf {len(maal)} i målgruppen')
print(f"  boliger        : {sum(r['boliger'] for r in maal)}")
print(f"  erhverv/garage : {sum(r['erhverv'] for r in maal)}")
print(f"  ubygget        : {sum(r['ubygget'] for r in maal)}")
print(f"  i {KVM_FRA}-{KVM_TIL} kvm    : {sum(r['iMaalgruppe'] for r in maal)}")
print(f"  i 30-{KVM_TIL} kvm    : {sum(r['iMaalgruppe30'] for r in maal)}")
print(f"    heraf udlejet : {sum(r['maalUdlejet'] for r in maal)}")
print(f"    ejer bor der  : {sum(r['maalEjerBor'] for r in maal)}")
print(f"    tom/ukendt    : {sum(r['maalTom'] for r in maal)}")
medEjer = [r for r in maal if r['ejerprofil']]
if medEjer:
    p = [r['ejerprofil'] for r in medEjer]
    print(f"  ejerdata for  : {sum(x['medDataIMaalgruppe'] for x in p)} lejligheder "
          f"i {len(medEjer)} foreninger")
    print(f"    ejer bor der: {sum(x['ejerBorDer'] for x in p)}")
    print(f"    selskaber   : {sum(x['selskaber'] for x in p)}")
    print(f"    ejer 60+    : {sum(x['alder60plus'] for x in p)}   70+: {sum(x['alder70plus'] for x in p)}")
    for mdr in (12, 24):
        n = sum(x[f'kvmpris{mdr}mdr']['antal'] for x in p if x[f'kvmpris{mdr}mdr'])
        vaegt = sum(x[f'kvmpris{mdr}mdr']['gns'] * x[f'kvmpris{mdr}mdr']['antal']
                    for x in p if x[f'kvmpris{mdr}mdr'])
        print(f'    kr/kvm {mdr} mdr: {round(vaegt / n):,} kr  ({n} frie handler)'.replace(',', '.'))
print(f'skrevet: {os.path.relpath(sti, ROD)}')
