/**
 * Renderer kvitteringsmailen til stdout med testdata, så den kan ses i en
 * browser uden at oprette et rigtigt lead og sende en rigtig mail.
 *
 *   npx tsx scripts/preview-customer-email.ts > /tmp/mail.html && open /tmp/mail.html
 *
 * Outputtet må IKKE lægges i public/ — så ville skabelonen ligge offentligt
 * tilgængelig på produktionen.
 */
import { customerEmailHtml } from '../src/lib/services/customer-email';
process.stdout.write(customerEmailHtml({
  firstName: 'Bjarne',
  fullAddress: 'Svendborgvej 209, 1., 4700 Næstved',
  phone: '20 67 15 00',
  comparables: [
    { address: 'Svendborgvej 217, 1.', kvm: 69, price: 905000, date: '2026-05-14' },
    { address: 'Svendborgvej 35, st.', kvm: 69, price: 880000, date: '2026-03-02' },
    { address: 'Bogensevej 57, 2. tv.', kvm: 72, price: 945000, date: '2026-01-28' },
  ],
}));
