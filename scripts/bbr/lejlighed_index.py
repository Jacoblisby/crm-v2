"""
Indeks pr. lejlighed: BBR + Resights, slået op på adresse.

Lead-kortet skal kunne vise, hvad registrene siger om boligen, ved siden af
det sælgeren selv har svaret i beregneren. Sælgerens svar kommer fra
leadet; registrenes fra denne fil.

Nøglen er «vej nr, etage dør|postnr», normaliseret (små bogstaver, punktum
og ekstra mellemrum væk). Samme normalisering bruges i src/lib/bbr-lejlighed.ts
— ændres den ene, skal den anden følge med.

Kør efter nyt BBR- eller Resights-udtræk:
    python3 scripts/bbr/lejlighed_index.py
"""
import json
import os
import re

DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'lib', 'data')


def norm(s):
    return re.sub(r'[\s.]+', ' ', s.lower()).strip()


def noegle(adresse, postnr):
    # Kun vej+nr og etage/dør; by og postnr skilles fra, fordi Resights
    # skriver «Benløse, 4100 Ringsted», mens BBR har postnr for sig.
    return f"{norm(', '.join(adresse.split(', ')[:2]))}|{postnr}"


with open(os.path.join(DATA, 'bbr-enheder.json'), encoding='utf-8') as f:
    bbr = json.load(f)['enheder']
with open(os.path.join(DATA, 'ejere.json'), encoding='utf-8') as f:
    ejere = json.load(f)['enheder']
with open(os.path.join(DATA, 'bbr-forening-map.json'), encoding='utf-8') as f:
    kobling = json.load(f)['kobling']
with open(os.path.join(DATA, 'ejerforeninger-seed.json'), encoding='utf-8') as f:
    seed = json.load(f)['foreninger']

# Foreningsnavnet som databasen kender det — samme regel som seed-ruten.
db_navn = {f['adresse']: (f['navn'] if f.get('navn') and f['navn'] != 'Ukendt' else f"{f.get('navn') or 'Ukendt'} · {f['adresse']}")
           for f in seed}

ejer_idx = {noegle(u['adresse'], u['postnr']): u for u in ejere}

ud = {}
for r in bbr:
    if not r.get('erBolig'):
        continue
    k = f"{norm(r['adresse'])}|{r['postnr']}"
    seed_adr = kobling.get(str(r['ejendomBfe']))
    u = ejer_idx.get(k)
    ud[k] = {
        'forening': db_navn.get(seed_adr) if seed_adr else None,
        'bbr': {
            'kvm': r['kvm'],
            'kvmBeboelse': r.get('kvmBeboelse'),
            'vaerelser': r.get('vaerelser'),
            'anvendelse': r['anvendelse'],
            'status': r['status'],
            'udlejning': r.get('udlejning') or None,
            'ejendomBfe': r['ejendomBfe'],
            'enhedBfe': r['enhedBfe'],
        },
        'ejer': None if not u else {
            'type': u['ejerType'],
            'alder': u.get('ejerAlder'),
            'borDer': u.get('ejerBorDer'),
            'antal': u.get('antalEjere'),
            'reklamebeskyttet': u.get('reklamebeskyttet'),
        },
        'handel': None if not u or not u.get('handelsdato') else {
            'pris': u['handelspris'],
            'dato': u['handelsdato'],
            'krPrKvm': u['krPrKvm'],
            'metode': u['handelsmetode'],
            'fri': bool(u.get('friHandel')),
        },
    }

with open(os.path.join(DATA, 'bbr-lejligheder.json'), 'w', encoding='utf-8') as f:
    json.dump({'kilde': 'BBR pr. ejendom + Resights pr. lejlighed', 'lejligheder': ud}, f, ensure_ascii=False, separators=(',', ':'))

print(f'{len(ud)} boliger · {sum(1 for v in ud.values() if v["ejer"])} med ejerdata · {sum(1 for v in ud.values() if v["forening"])} med forening')
