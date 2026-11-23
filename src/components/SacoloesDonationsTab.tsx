import {
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Maximize2,
  PackageCheck,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  SACOLOES_ACTIVITY_TEXT,
  SACOLOES_GALLERY_ITEMS,
} from '../data/institutionalData';
import { useLanguage } from '../i18n/LanguageContext';

interface SacoloesDonationsTabProps {
  onDonatePix: () => void;
  onSchedulePickup: () => void;
}

export function SacoloesDonationsTab({
  onDonatePix,
  onSchedulePickup,
}: SacoloesDonationsTabProps) {
  const { t, pick } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeItem =
    selectedIndex !== null ? SACOLOES_GALLERY_ITEMS[selectedIndex] ?? null : null;

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((idx) =>
          idx === null ? null : (idx + 1) % SACOLOES_GALLERY_ITEMS.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((idx) =>
          idx === null
            ? null
            : (idx - 1 + SACOLOES_GALLERY_ITEMS.length) % SACOLOES_GALLERY_ITEMS.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex]);

  return (
    <div
      id="sacoloes-panel"
      role="tabpanel"
      aria-label="Doações de Sacolões"
      className="mt-6 space-y-8 rounded-lg border border-[#D6CEBE] bg-white p-6 sm:p-8"
    >
      {/* Texto editorial descrevendo a atividade */}
      <div className="grid grid-cols-1 gap-8 border-b border-[#E2DDD3] pb-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
            {t.sacoloes.kicker}
          </p>
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#1C1917] sm:text-3xl [text-wrap:balance]">
            {t.sacoloes.title}
          </h3>
          <p className="max-w-2xl text-base font-medium leading-relaxed text-[#292524]">
            {t.sacoloes.lead}
          </p>
          <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-[#44403C]">
            <p>{t.sacoloes.p1}</p>
            <p>{t.sacoloes.p2}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onDonatePix}
              className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
            >
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              <span>{t.sacoloes.ctaPix}</span>
            </button>
            <button
              type="button"
              onClick={onSchedulePickup}
              className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#1C1917] transition-colors hover:bg-[#EFEBE3] whitespace-nowrap shrink-0"
            >
              <Truck className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
              <span>{t.sacoloes.ctaPickup}</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#E2DDD3] rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-5 py-2 lg:col-span-5">
          {SACOLOES_ACTIVITY_TEXT.pillars.map((pillar, idx) => (
            <div key={pillar.index} className="py-4">
              <p className="font-mono text-xs font-semibold tabular-nums text-[#9A3412]">
                {pillar.index}.{' '}
                {idx === 0
                  ? pick({
                      pt: pillar.title,
                      en: 'Essential Nutritional Basket',
                      es: 'Composición Nutricional Esencial',
                    })
                  : idx === 1
                    ? pick({
                        pt: pillar.title,
                        en: 'Social Screening & Follow-Up',
                        es: 'Evaluación y Acompañamiento Social',
                      })
                    : pick({
                        pt: pillar.title,
                        en: 'Direct Door-to-Door Delivery',
                        es: 'Entrega Directa Puerta a Puerta',
                      })}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#44403C]">
                {idx === 0
                  ? pick({
                      pt: pillar.detail,
                      en: 'Standardized baskets with rice, beans, cassava flour, pasta, wheat flour, oil, sugar, and coffee for daily family meals.',
                      es: 'Canastas estandarizadas con arroz, frijoles, harina de yuca, pasta, harina de trigo, aceite, azúcar y café para la alimentación diaria.',
                    })
                  : idx === 1
                    ? pick({
                        pt: pillar.detail,
                        en: 'Priority for households with children, elderly residents, informal workers, and families supported across Bairro Olaria.',
                        es: 'Prioridad para hogares con niños, personas mayores, trabajadores informales y familias atendidas en Bairro Olaria.',
                      })
                    : pick({
                        pt: pillar.detail,
                        en: 'Daytime and evening routes led directly by Projeto Sopão coordinators and volunteers to beneficiaries’ homes.',
                        es: 'Rutas diurnas y nocturnas realizadas por la coordinación y voluntarios del Projeto Sopão directamente en los hogares.',
                      })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Galeria documental das 5 entregas de sacolões */}
      <div>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
              {t.sacoloes.galleryKicker}{' '}
              <span className="font-mono tabular-nums">{SACOLOES_GALLERY_ITEMS.length}</span>{' '}
              {t.sacoloes.galleryRecordsSuffix}
            </p>
            <h4 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
              {t.sacoloes.galleryTitle}
            </h4>
          </div>
          <p className="text-xs text-[#57534E]">{t.sacoloes.galleryHint}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SACOLOES_GALLERY_ITEMS.map((item, index) => {
            const hasFailed = Boolean(failedImages[item.id]);
            return (
              <figure
                key={item.id}
                id={item.id}
                className="group flex flex-col justify-between rounded-lg border border-[#D6CEBE] bg-[#FBF9F5] p-4 transition-colors hover:border-[#14532D]/50"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`Ampliar ${item.registerNumber} — ${item.title}`}
                    className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded bg-[#EFEBE3]"
                  >
                    {hasFailed ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#EFEBE3] p-6 text-center text-[#57534E]">
                        <PackageCheck className="h-8 w-8 text-[#14532D]" aria-hidden="true" />
                        <p className="font-serif text-sm font-semibold text-[#1C1917]">
                          {item.title}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={item.imageSrc}
                        alt={`${item.registerNumber} — ${item.title}: ${item.caption}`}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    )}
                    <span className="absolute right-2.5 bottom-2.5 inline-flex h-8 w-8 items-center justify-center rounded bg-black/65 text-white opacity-90 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>

                  <div className="mt-3.5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#78716C]">
                      {item.registerNumber} · {item.periodLabel}
                    </p>
                    <h5 className="mt-1 font-serif text-lg font-semibold leading-snug text-[#1C1917]">
                      {item.title}
                    </h5>
                    <figcaption className="mt-1.5 font-serif text-xs leading-relaxed italic text-[#57534E]">
                      {item.caption}
                    </figcaption>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#E2DDD3] pt-3 text-[11px] text-[#57534E]">
                  <span className="font-medium text-[#14532D]">{t.sacoloes.itemsPrefix}</span>{' '}
                  {item.itemsSummary}
                </div>
              </figure>
            );
          })}
        </div>
      </div>

      {/* Lightbox de inspeção fotográfica */}
      {activeItem && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sacolao-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="grid max-h-[90vh] w-full max-w-5xl grid-cols-1 overflow-y-auto rounded-lg border border-[#D6CEBE] bg-[#FBF9F5] shadow-2xl lg:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center bg-[#EFEBE3] p-4 sm:p-8 lg:col-span-7">
              <img
                src={activeItem.imageSrc}
                alt={`${activeItem.registerNumber} — ${activeItem.title}`}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto rounded object-contain shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-[#78716C]">
                      {activeItem.registerNumber} · {t.sacoloes.modalSub}
                    </p>
                    <h3
                      id="sacolao-modal-title"
                      className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]"
                    >
                      {activeItem.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    aria-label="Fechar visualização ampliada"
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#E2DDD3] text-[#1C1917] hover:bg-[#EFEBE3]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-4 font-serif text-sm leading-relaxed italic text-[#44403C]">
                  {activeItem.caption}
                </p>

                <dl className="mt-6 divide-y divide-[#E2DDD3] border-y border-[#E2DDD3] text-xs">
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#78716C]">{t.sacoloes.modalModality}</dt>
                    <dd className="text-right font-medium text-[#14532D]">
                      {activeItem.periodLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#78716C]">{t.sacoloes.modalLocation}</dt>
                    <dd className="text-right font-medium text-[#1C1917]">
                      {activeItem.locationLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#78716C]">{t.sacoloes.modalComposition}</dt>
                    <dd className="text-right text-[#1C1917]">{activeItem.itemsSummary}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-[#78716C]">{t.sacoloes.modalResponsible}</dt>
                    <dd className="text-right text-[#1C1917]">
                      Projeto Sopão · Ass. Recanto Social Bom Pastor
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + SACOLOES_GALLERY_ITEMS.length) %
                        SACOLOES_GALLERY_ITEMS.length
                    )
                  }
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EFEBE3]"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>{t.sacoloes.prevBtn}</span>
                </button>

                <span className="font-mono text-xs tabular-nums text-[#78716C]">
                  {selectedIndex + 1} / {SACOLOES_GALLERY_ITEMS.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((selectedIndex + 1) % SACOLOES_GALLERY_ITEMS.length)
                  }
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EFEBE3]"
                >
                  <span>{t.sacoloes.nextBtn}</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
