import { Check, Copy, ExternalLink, Headphones, Pencil, Radio } from 'lucide-react';
import { useState } from 'react';
import { sanitizeExternalRadioUrl, useRadioBannerStore } from '../data/radioBannerStore';
import {
  ChristmasCardCornerAccent,
  ChristmasGoldStarAccent,
} from './ChristmasThemeElements';

interface RadioBoasNovasBannerProps {
  onOpenAdminRadio?: () => void;
}

export function RadioBoasNovasBanner({ onOpenAdminRadio }: RadioBoasNovasBannerProps) {
  const { config } = useRadioBannerStore();
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!config.enabled) {
    return null;
  }

  const safeListenUrl = sanitizeExternalRadioUrl(config.listenUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeListenUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
    }
  };

  return (
    <section
      id="radio-boas-novas"
      aria-labelledby="radio-boas-novas-heading"
      className="border-b border-[#E2DDD3] bg-[#F4F0E8]"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-14">
        <article className="relative overflow-hidden rounded-lg border border-[#D6CEBE] bg-white p-5 sm:p-7">
          <ChristmasCardCornerAccent />

          <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-9">
            {/* Banner Foto do Missionário Teodoro na Rádio Boas Novas FM 96,3 */}
            <div className="lg:col-span-6">
              <a
                href={safeListenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-lg border border-[#D6CEBE] bg-[#EFEBE3] aspect-[16/10]"
              >
                {!imageLoadFailed ? (
                  <img
                    src={config.bannerImageUrl}
                    alt={config.bannerImageAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setImageLoadFailed(true)}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1E5631]/10 via-white to-[#D4AF37]/15 px-6 text-center">
                    <Radio className="h-9 w-9 text-[#1E5631]" aria-hidden="true" />
                    <p className="font-serif text-base font-semibold text-[#1F2937]">
                      {config.presenterName} · {config.stationName}
                    </p>
                    <p className="text-xs text-[#57534E]">{config.scheduleNote}</p>
                  </div>
                )}

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-4 text-white">
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#E5C158]">
                      {config.frequencyLabel}
                    </p>
                    <p className="mt-0.5 font-serif text-base font-semibold leading-snug sm:text-lg">
                      {config.presenterName} · {config.stationName}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#14532D]/95 px-2.5 py-1 text-[11px] font-semibold text-white border border-[#D4AF37]/50">
                    <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ouvir ao vivo</span>
                  </span>
                </div>
              </a>
            </div>

            {/* Informações do Programa, Série Voz Missionária e Link do Aplicativo */}
            <div className="flex flex-col justify-between space-y-4 lg:col-span-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                  <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-widest text-[#14532D]">
                    <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{config.stationName}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{config.presenterName}</span>
                </div>

                <h2
                  id="radio-boas-novas-heading"
                  className="mt-2 font-serif text-2xl font-semibold leading-tight text-[#1C1917] sm:text-[1.75rem]"
                >
                  {config.programTitle}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#44403C] sm:text-base">
                  {config.description}
                </p>

                <p className="mt-2 text-xs font-medium text-[#57534E]">{config.scheduleNote}</p>
              </div>

              {/* Bloco do Link Oficial do Aplicativo */}
              <div className="rounded-md border border-[#E2DDD3] bg-[#FAFAFA] px-3.5 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                  Link oficial do aplicativo
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={safeListenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate font-mono text-xs font-medium text-[#14532D] underline-offset-4 hover:underline sm:text-[13px]"
                  >
                    {safeListenUrl}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F5F1E8]"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#57534E]" aria-hidden="true" />
                        <span>Copiar link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ações Principais */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={safeListenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
                >
                  <Headphones className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{config.ctaLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <ChristmasGoldStarAccent className="h-2.5 w-2.5 opacity-90" />
                </a>

                {onOpenAdminRadio && (
                  <button
                    type="button"
                    onClick={onOpenAdminRadio}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C1917] transition-colors duration-150 hover:bg-[#F5F1E8] whitespace-nowrap shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                    <span>Atualizar Banner / Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
