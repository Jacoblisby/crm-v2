# -*- coding: utf-8 -*-
"""
Læser Resights' ejendomsudtræk — én række pr. BFE — og gemmer det vi må gemme.

HVAD DET TILFØJER: BBR-tabellerne fortæller hvad bygningen ER. Dette udtræk
fortæller hvem der ejer den, hvad de gav, og om de selv bor der. Og til
forskel fra BBR-tabellerne er det nøglet på den enkelte lejligheds BFE, så
det kan kobles direkte til registrets numre.

── Hvad der IKKE gemmes ──────────────────────────────────────────────────
Udtrækket indeholder ejerens NAVN og fulde ADRESSE. Det er personoplysninger
om identificerede personer, og repoet er ikke stedet for et kartotek over
1.500 navngivne mennesker. Derfor gemmes kun det afledte:

  ejerBorDer    beregnet ved at sammenligne de to adresser, og så smidt væk
  ejerAlder     tal, ikke navn
  ejerType      privat / selskab / forening
  cvr           kun for selskaber — offentligt og ikke personhenførbart

Skal der skrives breve, slås navn og adresse op i kilden på det tidspunkt.
De behøver ikke ligge her.

BRUG:
    /opt/homebrew/bin/python3.12 scripts/bbr/ejere.py ~/Downloads/ResightsUdtraek*.xlsx
"""
import sys, os, json, glob, re

try:
    from openpyxl import load_workbook
except ImportError:
    sys.exit('openpyxl mangler. Brug /opt/homebrew/bin/python3.12')

ROD = os.path.join(os.path.dirname(__file__), '..', '..')
UD = os.path.join(ROD, 'src', 'lib', 'data', 'ejere.json')


def norm(s):
    """Adressesammenligning: små bogstaver, ingen tegnsætning, ét mellemrum."""
    return re.sub(r'\s+', ' ', re.sub(r'[.,]', '', str(s or '').lower())).strip()


def tal(v):
    return v if isinstance(v, (int, float)) and v > 0 else None


def laes(sti):
    wb = load_workbook(sti, data_only=True)
    ws = wb['Stamdata']
    h = [c.value for c in ws[1]]
    k = {n: h.index(n) for n in h if n}

    def f(r, navn):
        return r[k[navn]] if navn in k else None

    ud = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r[k['BFE-nummer']]:
            continue

        # Bor ejeren på adressen? Sammenlign vej, husnr, etage, dør og postnr.
        # Kun resultatet gemmes — ejerens adresse må ikke ende i filen.
        bolig_adr = norm('|'.join(str(f(r, x) or '') for x in
                                  ['Vejnavn', 'Husnr.', 'Etage', 'Dør', 'Postnr']))
        ejer_adr = norm('|'.join(str(f(r, x) or '') for x in
                                 ['Primær ejer Vejnavn', 'Primær ejer husnr.',
                                  'Primær ejer etage', 'Primær ejer dør', 'Primær ejer postnr.']))

        anv = str(f(r, 'Anvendelse') or '')
        kvm = tal(f(r, 'Enhedsareal - Beboelse'))
        pris = tal(f(r, 'Seneste handelspris'))
        dato = f(r, 'Seneste handelsdato')

        ud.append({
            'bfe': int(r[k['BFE-nummer']]),
            'adresse': str(f(r, 'Adresse') or ''),
            'postnr': f(r, 'Postnr'),
            'by': f(r, 'By'),
            'anvendelse': anv,
            # Resights skriver «Etagebolig-bygning…», ikke «Bolig…» som BBR.
            # Samme skelnen, andet ordvalg — og et filter på «Bolig» rammer nul.
            'erBolig': 'Etagebolig' in anv,
            'kvm': kvm,
            'vaerelser': tal(f(r, 'Antal værelser')),
            'handelspris': pris,
            'handelsdato': str(dato)[:10] if dato else None,
            'krPrKvm': round(pris / kvm) if pris and kvm else None,
            'ejerType': f(r, 'Ejerskabstype'),
            'ejerAlder': tal(f(r, 'Primær ejer alder')),
            'ejerBorDer': bool(ejer_adr) and bolig_adr == ejer_adr,
            'antalEjere': tal(f(r, 'Antal ejere')),
            'cvr': f(r, 'Primær ejer CVR-nummer') if f(r, 'Ejerskabstype') == 'Selskab' else None,
            'reklamebeskyttet': f(r, 'Primær ejer reklamebeskyttet'),
            'administrator': f(r, 'Ejendomsadministrator'),
        })
    return ud


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    filer = [p for m in sys.argv[1:] for p in glob.glob(os.path.expanduser(m))]
    if not filer:
        sys.exit('ingen filer fundet')

    alle, set_bfe = [], set()
    for sti in filer:
        for row in laes(sti):
            if row['bfe'] in set_bfe:
                continue
            set_bfe.add(row['bfe'])
            alle.append(row)
        print(f'  læst {os.path.basename(sti)}')

    b = [r for r in alle if r['erBolig'] and r['kvm']]
    m = [r for r in b if 20 <= r['kvm'] <= 80]
    print(f'\n{len(alle)} BFE  ->  {len(b)} boliger  ->  {len(m)} i 20-80 kvm')
    print(f"  ejer bor der      : {sum(1 for r in m if r['ejerBorDer'])}")
    print(f"  ejer bor andetsteds: {sum(1 for r in m if not r['ejerBorDer'])}")
    print(f"  selskaber         : {sum(1 for r in m if r['ejerType'] == 'Selskab')}")
    print(f"  reklamebeskyttet  : {sum(1 for r in m if r['reklamebeskyttet'] == 'Ja')}")
    print(f"  pris kendt        : {sum(1 for r in m if r['handelspris'])}")

    os.makedirs(os.path.dirname(UD), exist_ok=True)
    with open(UD, 'w', encoding='utf-8') as fh:
        json.dump({'kilde': 'Resights ejendomsudtræk pr. BFE',
                   'note': 'Ejernavn og ejeradresse gemmes bevidst ikke — se scripts/bbr/ejere.py',
                   'enheder': alle}, fh, ensure_ascii=False, indent=1)
    print(f'\nskrevet: {os.path.relpath(UD, ROD)}')


if __name__ == '__main__':
    main()
