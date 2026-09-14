"""
Handler pr. forening — de faktiske comps bag kvm-prisen.

Rollup'et giver én median pr. forening. Det er nok til at sortere efter,
men ikke til at vurdere et bud: dér skal man se de enkelte handler — hvilken
lejlighed, hvor stor, hvornår, til hvad. Denne fil er dén liste.

Kilden er Resights' udtræk (ejere.json), som har SENESTE handel pr. lejlighed.
Det betyder to ting, man skal vide, når man læser tallene:

· En lejlighed, der er handlet to gange på et år, tæller kun med den sidste.
· Ejernavne er ikke med — de gemmes bevidst ikke (se ejere.py).

Alle handler gemmes, uanset alder. Siden viser kun de seneste 36 måneder
som comps — ældre handler er historie — men de ældre skal med alligevel,
fordi vores egne køb måles mod markedet PÅ KØBSTIDSPUNKTET, og de første
køb er fra 2020.

Vores egne køb mærkes «vores». En lejlighed, vi har ejet og solgt igen,
står med privat ejer i udtrækket; dens seneste handel er køberens, ikke
vores, og den mærkes derfor ikke.

Kør:  python3 scripts/bbr/handler.py
"""
import datetime as dt
import json
import os

DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'lib', 'data')
I_DAG = dt.date.today()
VIS_MDR = 36  # hvor langt tilbage siden viser comps

with open(os.path.join(DATA, 'ejerforeninger-seed.json'), encoding='utf-8') as f:
    seed = json.load(f)
with open(os.path.join(DATA, 'ejere.json'), encoding='utf-8') as f:
    ejere = {e['bfe']: e for e in json.load(f)['enheder']}

egne = {int(x['bfe']) for x in seed['ejede']}
ud = {}
for f in seed['foreninger']:
    # Samme navneregel som seed-ruten og rollup.py: databasen kender
    # foreningen under dette navn, og «Ukendt» gøres entydig med adressen.
    navn = f['navn'] if f.get('navn') and f['navn'] != 'Ukendt' else f"{f.get('navn') or 'Ukendt'} · {f['adresse']}"
    handler = []
    for bfe in set(f['bfe']):
        e = ejere.get(bfe)
        if not e or not e['erBolig'] or not e.get('handelsdato') or not e.get('handelspris'):
            continue
        vores = bfe in egne and e['ejerType'] == 'Selskab'
        # Adressen uden by og postnr — foreningen ligger ét sted.
        adr = ', '.join(e['adresse'].split(', ')[:2])
        handler.append({
            'bfe': bfe,
            'adresse': adr,
            'kvm': e['kvm'],
            'pris': e['handelspris'],
            'dato': e['handelsdato'],
            'krPrKvm': e['krPrKvm'],
            'metode': e['handelsmetode'],
            # Fri handel af én ejendom. Familieoverdragelser og porteføljehandler
            # er også «priser», men ikke priser nogen fremmed ville betale.
            'fri': bool(e.get('friHandel')),
            'vores': vores,
        })
    handler.sort(key=lambda h: h['dato'], reverse=True)
    if handler:
        ud[navn] = handler

with open(os.path.join(DATA, 'handler-forening.json'), 'w', encoding='utf-8') as f:
    json.dump({'kilde': 'Resights ejendomsudtræk — seneste handel pr. lejlighed',
               'genereret': I_DAG.isoformat(), 'maaneder': VIS_MDR, 'foreninger': ud},
              f, ensure_ascii=False, indent=1)

n = sum(len(v) for v in ud.values())
print(f'{len(ud)} foreninger, {n} handler i alt')
for navn, h in sorted(ud.items(), key=lambda kv: -len(kv[1]))[:6]:
    et_aar = [x for x in h if x['fri'] and dt.date.fromisoformat(x['dato']) >= I_DAG - dt.timedelta(days=365)]
    print(f'  {navn:32} {len(h):3} handler · {len(et_aar):3} frie sidste 12 mdr · {sum(x["vores"] for x in h):2} vores køb')
