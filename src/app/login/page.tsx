/**
 * /login — magic-link. Ingen adgangskode, intet at lække.
 *
 * Better Auth var konfigureret hele tiden, men der var ingen side der kaldte
 * det. Whitelisten i src/lib/auth.ts afgør hvem der får en mail; denne side
 * ved intet om hvem der står på den — og svarer derfor ens uanset hvad, så
 * den ikke kan bruges til at afprøve hvilke adresser der findes.
 */
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Log ind · 365 Ejendomme' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ videre?: string }>;
}) {
  const { videre } = await searchParams;

  // Kun interne stier accepteres, så ?videre= ikke kan sende folk videre til
  // et fremmed domæne efter et gyldigt login.
  const maal = videre && videre.startsWith('/') && !videre.startsWith('//') ? videre : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <div className="font-bold text-lg">
            365 <span className="text-slate-400">Ejendomme</span>
          </div>
          <h1 className="text-[22px] font-semibold text-slate-900 mt-4">Log ind</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Skriv din arbejdsmail, så sender vi et link. Der er ingen adgangskode —
            linket virker i fem minutter og kan kun bruges én gang.
          </p>
        </div>

        <LoginForm videre={maal} />

        <p className="text-xs text-slate-400 mt-8 leading-relaxed">
          Kun mails på den interne liste får et link. Står du ikke på den, sker der
          ingenting — og du får samme kvittering, så siden ikke kan bruges til at
          afprøve, hvilke adresser der findes.
        </p>
      </div>
    </div>
  );
}
