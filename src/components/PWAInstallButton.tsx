import { ArrowUpRight, Download, Share, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { INSTITUTION_PROFILE, OFFICIAL_ASSETS } from '../data/institutionalData';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero' | 'sidebar';
  onAfterAction?: () => void;
}

export function PWAInstallButton({ variant = 'header', onAfterAction }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const { t } = useLanguage();

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      onAfterAction?.();
      return;
    }
    setShowGuideModal(true);
  };

  const buttonClasses =
    variant === 'hero'
      ? 'inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-[#14532D] bg-white px-4 py-2.5 text-sm font-semibold text-[#14532D] transition-colors duration-150 hover:bg-[#F4F0E8] whitespace-nowrap shrink-0'
      : variant === 'sidebar'
        ? 'flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]'
        : 'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#14532D]/40 bg-white px-3 py-2 text-xs font-semibold text-[#14532D] transition-colors duration-150 hover:bg-[#F4F0E8] whitespace-nowrap shrink-0';

  return (
    <>
      <button type="button" onClick={handleClick} className={buttonClasses}>
        <img
          src={OFFICIAL_ASSETS.logo}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 rounded-full border border-[#14532D]/20 bg-white object-cover"
        />
        <span>{t.pwa.installApp}</span>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-[#D6CEBE] bg-[#FBF9F5] p-6 text-[#1C1917] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={OFFICIAL_ASSETS.logo}
                  alt="Ícone oficial do aplicativo Projeto Sopão"
                  className="h-14 w-14 shrink-0 rounded-xl border border-[#D6CEBE] bg-white object-cover p-1 shadow-xs"
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#14532D]">
                    {t.pwa.badge}
                  </p>
                  <h3 id="pwa-install-title" className="font-serif text-lg font-semibold">
                    Bom Pastor — Projeto Sopão
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Fechar janela de instalação"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[#E2DDD3] bg-white text-[#57534E] hover:bg-[#EFEBE3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-[#E2DDD3] bg-white p-4 text-xs leading-relaxed text-[#44403C]">
              {isIOS ? (
                <>
                  <p className="font-semibold text-[#1C1917]">
                    Como instalar no iPhone ou iPad (Safari):
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-4">
                    <li>
                      Toque no ícone <strong className="inline-flex items-center gap-1"><Share className="h-3.5 w-3.5" /> Compartilhar</strong> na barra inferior do Safari.
                    </li>
                    <li>
                      Role as opções e toque em <strong>Adicionar à Tela de Início</strong>.
                    </li>
                    <li>
                      Confirme o nome <strong>Bom Pastor</strong> e toque em <strong>Adicionar</strong>.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#1C1917]">
                    Como instalar no Android, Windows ou Mac:
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-4">
                    {isInIframe && (
                      <li>
                        Como você está visualizando dentro do painel de prévia, abra o portal em
                        uma guia direta do navegador clicando no botão abaixo.
                      </li>
                    )}
                    <li>
                      No Google Chrome ou Edge, toque no menu (<strong>⋮</strong>) ou no ícone{' '}
                      <strong className="inline-flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5" /> Instalar aplicativo
                      </strong>{' '}
                      na barra de endereços.
                    </li>
                    <li>
                      O ícone oficial do <strong>Projeto Sopão</strong> será criado na sua tela
                      inicial para acesso rápido e suporte offline.
                    </li>
                  </ol>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
              {isInIframe && typeof window !== 'undefined' && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  <span>{t.pwa.openNewTab}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="inline-flex min-h-[40px] cursor-pointer items-center rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#EFEBE3]"
              >
                {t.pwa.close}
              </button>
            </div>

            <p className="mt-4 border-t border-[#E2DDD3] pt-3 text-[11px] text-[#78716C]">
              {INSTITUTION_PROFILE.legalName} · {INSTITUTION_PROFILE.fullAddress}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
