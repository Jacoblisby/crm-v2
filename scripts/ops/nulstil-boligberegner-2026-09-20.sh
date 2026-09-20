#!/bin/sh
# Nulstilling af boligberegner-leads · 20.09.2026
#
# Soft-sletter 35 test-leads fra beregneren. Tilbage står de seks rigtige:
# Sten nielsen, Thomas Holmehøj, Christian Ankerhus, Stephanie Barbon Ravn ×2
# og Rebecka Alskog.
#
# Reversibelt: UPDATE leads SET deleted_at = NULL WHERE id IN (...) henter dem
# tilbage. Listen over de 35 ligger i JSON-filen ved siden af, og en note med
# navne og adresser ligger i vaulten under Brevkampagne ejerforeninger.
#
# Kør ÉN af delene:
#
#   A) I Coolifys terminal (CRON_SECRET er allerede sat i containeren):
#      sh -c "$(cat scripts/ops/nulstil-boligberegner-2026-09-20.sh)"
#      — eller bare linjen nederst, kopieret direkte ind.
#
#   B) Lokalt, hvor du selv sætter hemmeligheden:
#      CRON_SECRET='...' sh scripts/ops/nulstil-boligberegner-2026-09-20.sh
#
set -eu
URL="${CRM_URL:-https://crm.365ejendom.dk}/api/admin/soft-delete-leads"
DIR=$(dirname "$0")
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d @"$DIR/nulstil-boligberegner-2026-09-20.json"
echo
