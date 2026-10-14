#!/usr/bin/env python3
"""
Funnel-regneark med de fulde lister: fanerne Funnel, Ejerforeninger, Ejere (segmenteret) og Breve.
Indeholder personoplysninger, så filen ligger kun i vaulten. Ejernavne, lead-kontakter og mailhistorik
gives som filer (se bygliste.py).

Kør:  python3 scripts/funnel/bygfunnel_v5.py --ejere ejernavne.json --kontakt leadkontakt.txt --mails mailhistorik.txt [-n 5]
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from bygfunnel import VAULT  # noqa: E402
from bygfunnel_simpel import byg  # noqa: E402
from bygliste import byg_lister  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('--ejere', required=True)
ap.add_argument('--kontakt', required=True)
ap.add_argument('--mails', required=True)
ap.add_argument('-n', type=int, default=5)
a = ap.parse_args()
ud = VAULT / f'Funnel boligberegner – v{a.n}.xlsx'


def ekstra(wb):
    byg_lister(wb, a.ejere, a.kontakt, a.mails)
    raekke = ['Funnel', 'Ejerforeninger', 'Ejere', 'Breve']
    wb._sheets = [wb[n] for n in raekke]


byg(ud, ekstra)
print('skrevet', ud)
