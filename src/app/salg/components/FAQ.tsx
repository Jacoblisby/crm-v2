'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

/**
 * FAQ accordion — inspireret af Offerpad's social-proof-sektion på forsiden.
 *
 * Addresserer de mest almindelige indvendinger sælgere har:
 *   - 'Er det legit?'
 *   - 'Hvorfor jer i stedet for mægler?'
 *   - 'Hvad er fordelene konkret?'
 *   - 'Hvordan virker det egentlig?'
 *
 * Hver item starter lukket; klik på header expand'er content. Plus-ikonet
 * roterer til ×. Bygger tillid uden at fylde flow'et med marketing-tekst.
 */

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

const ITEMS: FAQItem[] = [
  {
    q: 'Er 365 Ejendomme legit?',
    a: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Ja — vi er et registreret dansk ejendomsselskab (Boligselskabet Sommerhave ApS,
          ejet af United Capital ApS) med base i Næstved. Vi har købt over{' '}
          <strong>87 ejerlejligheder siden 2024</strong> og udlejer i dag ~218 lejemål
          i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde.
        </p>
        <p>
          Vores tilbud er bindende efter besigtigelse, og hvis vores endelige tilbud
          afviger mere end 5% fra det foreløbige, kan du trække dig uden konsekvens.
          Kontant betaling, ingen bankforbehold.
        </p>
        <p className="text-xs text-slate-500">
          CVR-registreret · Tinglyst i alle handler · Reference fra tidligere sælgere
          tilgængelig på forespørgsel
        </p>
      </div>
    ),
  },
  {
    q: 'Hvorfor sælge til os i stedet for mægler?',
    a: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Mægler-salget af en ejerlejlighed på Sjælland tager typisk{' '}
          <strong>4-6 måneder</strong> og koster sælger ~70.000 kr i salær plus
          markedsafslag på 5-10%. Hos os er det:
        </p>
        <ul className="space-y-1.5 pl-4">
          <li>
            <strong>Ingen mæglersalær</strong> — du sparer typisk 70.000 kr
          </li>
          <li>
            <strong>Ingen fremvisninger eller åbent hus</strong> — vi besigtiger én gang
          </li>
          <li>
            <strong>Du vælger overtagelsesdato</strong> — fra 14 dage til 6 måneder
          </li>
          <li>
            <strong>Kontant betaling</strong> — ingen bankforbehold eller venten
          </li>
          <li>
            <strong>Ingen 3 mdr drift mens den står til salg</strong> — du sparer
            ejerudgifter
          </li>
        </ul>
        <p>
          Vi tilbyder lidt mindre end maks-prisen via mægler, men det er sjældent
          forskellen er stor når du regner alle besparelserne med.
        </p>
      </div>
    ),
  },
  {
    q: 'Top 6 grunde sælgere vælger os',
    a: (
      <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal pl-5">
        <li>
          <strong>Skilsmisse eller separation</strong> — hurtigt salg uden mæglerdrama
        </li>
        <li>
          <strong>Arv eller dødsbo</strong> — vi køber as-is, du slipper for rengøring og
          istandsættelse
        </li>
        <li>
          <strong>Flytter til ny by/job</strong> — fast overtagelsesdato der passer dig
        </li>
        <li>
          <strong>Udlejet lejlighed</strong> — vi køber gerne udlejede, lejer beholder kontrakten
        </li>
        <li>
          <strong>Vil blive boende som lejer</strong> — sale-leaseback giver frihed
        </li>
        <li>
          <strong>Økonomisk pres</strong> — kontant betaling kan komme på 14 dage
        </li>
      </ol>
    ),
  },
  {
    q: 'Hvordan får du et kontant tilbud?',
    a: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <ol className="space-y-2.5 pl-5 list-decimal">
          <li>
            <strong>Udfyld formularen ovenfor</strong> — adresse, fotos og udgifter. Vi
            henter automatisk data fra OIS (Offentlig Information om fast Ejendom).
          </li>
          <li>
            <strong>Få et foreløbigt tilbud med det samme</strong> — bygget på tinglyste
            handler i samme ejerforening og område.
          </li>
          <li>
            <strong>Gratis besigtigelse indenfor 24 timer</strong> — Jacob kommer forbi,
            ser boligen og snakker om dine ønsker.
          </li>
          <li>
            <strong>Bindende tilbud efter besigtigelse</strong> — du vælger overtagelsesdato.
            Hele handlen lukker indenfor 14 dage til 6 måneder, som det passer dig.
          </li>
        </ol>
        <p className="text-xs text-slate-500 pt-1">
          Hele processen tager normalt 1-2 uger fra du udfylder formularen til handlen er
          underskrevet. Vi har gjort det 87+ gange siden 2024.
        </p>
      </div>
    ),
  },
  {
    q: 'Hvad nu hvis I tilbyder for lidt?',
    a: (
      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Vores tilbud er ikke det højeste tal du kan få — det er det{' '}
          <strong>sikreste og hurtigste</strong>. Hvis vores foreløbige tilbud ikke
          giver mening for dig, er der ingen forpligtelse:
        </p>
        <ul className="space-y-1.5 pl-4">
          <li>
            Du behøver ikke acceptere — vi følger ikke op aggressivt
          </li>
          <li>
            Vi kan også formidle din bolig til en mægler i vores netværk hvis du vil
            gå den vej
          </li>
          <li>
            Hvis vi tilbyder under den seneste sammenlignelige handel i din EF, fortæller
            vi dig hvorfor (fx stand, manglende altan, kommende EF-renoveringer)
          </li>
        </ul>
        <p>
          Vores model er at byde det vi kan tjene 20% afkast på efter renovering og
          udlejning. Du får transparens på begge sider af bordet.
        </p>
      </div>
    ),
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      aria-labelledby="faq-title"
      className="space-y-5 pt-8 border-t border-dashed border-slate-300"
    >
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
          Spørgsmål sælgere ofte stiller
        </p>
        <h2
          id="faq-title"
          className="font-display text-3xl font-semibold text-slate-900 leading-tight"
        >
          Det skal du vide først
        </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-2">
        {ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          const triggerId = `faq-trigger-${idx}`;
          const panelId = `faq-panel-${idx}`;
          return (
            <div
              key={item.q}
              className={`bg-white border rounded-2xl transition-colors ${
                isOpen ? 'border-amber-300 shadow-sm' : 'border-slate-200'
              }`}
            >
              <button
                id={triggerId}
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span
                  className={`text-base font-semibold ${
                    isOpen ? 'text-slate-900' : 'text-slate-800'
                  }`}
                >
                  {item.q}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isOpen
                      ? 'bg-amber-100 text-amber-700 rotate-45'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="px-5 pb-5 pt-1 border-t border-slate-100"
              >
                <div className="pt-4">{item.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
