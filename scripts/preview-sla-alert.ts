/**
 * Renderer SLA-påmindelsen til stdout med testdata, så den kan ses uden at
 * vente på at en rigtig sælger bliver overset.
 *
 *   npx tsx scripts/preview-sla-alert.ts > /tmp/sla.html && open /tmp/sla.html
 */
import { alertHtml } from '../src/worker/lead-sla';

const nu = Date.now();
process.stdout.write(
  alertHtml(
    [
      { id: 'aaaa1111-0000-0000-0000-000000000001', fullName: 'Bjarne Hemmingsen', email: 'bjarnehemmingsen@example.com', phone: '60 66 45 00', address: 'Svendborgvej 237, st., 4700 Næstved', createdAt: new Date(nu - 22 * 3600e3), hoursWaiting: 22 },
      { id: 'aaaa1111-0000-0000-0000-000000000002', fullName: 'Steen Toftebjerg', email: 'st@example.dk', phone: '40 14 75 65', address: 'Svendborgvej 35, st., 4700 Næstved', createdAt: new Date(nu - 19 * 3600e3), hoursWaiting: 19 },
    ],
    'https://crm.365ejendom.dk',
  ),
);
