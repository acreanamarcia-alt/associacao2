import { X } from 'lucide-react';
import { useState } from 'react';
import {
  CHRISTMAS_THEME_ENABLED,
  isChristmasBannerDismissed,
  persistChristmasBannerDismissal,
} from '../config/christmasTheme';

/**
 * 1. Banner de Felicitações no topo do site
 *    - Fechável via botão "X" com aria-label acessível
 *    - Lembra o fechamento em sessionStorage/localStorage para não reaparecer
 */
export function ChristmasGreetingBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => isChristmasBannerDismissed());

  if (!CHRISTMAS_THEME_ENABLED || dismissed) {
    return null;
  }

  const handleClose = () => {
    persistChristmasBannerDismissal();
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Mensagem de Boas Festas"
      className="natal-banner relative z-50 px-4 py-2 text-center"
    >
      <div className="mx-auto flex max-w-[1340px] items-center justify-center gap-3 pr-8 sm:pr-10">
        <span
          aria-hidden="true"
          className="natal-banner-gold-dot hidden text-xs sm:inline-block"
        >
          ✦
        </span>
        <p className="text-xs font-medium tracking-wide text-[#FDFBF7] sm:text-[13px]">
          🎄 Feliz Natal 2026! Que seja um tempo de paz, alegria e união.
        </p>
        <span
          aria-hidden="true"
          className="natal-banner-gold-dot hidden text-xs sm:inline-block"
        >
          ✦
        </span>
      </div>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar banner de felicitações de Natal"
        className="absolute top-1/2 right-3 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded border border-[#D4AF37]/45 text-[#FDFBF7] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * 2. Flocos de neve sutis ao fundo (CSS puro + SVG leve, pointer-events: none)
 */
const SNOWFLAKES = [
  { left: '4%', size: 11, duration: '15s', delay: '0s', opacity: 0.25 },
  { left: '12%', size: 9, duration: '19s', delay: '-5s', opacity: 0.2 },
  { left: '20%', size: 12, duration: '17s', delay: '-9s', opacity: 0.26 },
  { left: '28%', size: 8, duration: '21s', delay: '-3s', opacity: 0.21 },
  { left: '36%', size: 11, duration: '16s', delay: '-11s', opacity: 0.24 },
  { left: '45%', size: 9, duration: '20s', delay: '-7s', opacity: 0.2 },
  { left: '53%', size: 11, duration: '18s', delay: '-2s', opacity: 0.24 },
  { left: '61%', size: 10, duration: '22s', delay: '-13s', opacity: 0.22 },
  { left: '69%', size: 12, duration: '16s', delay: '-6s', opacity: 0.26 },
  { left: '77%', size: 8, duration: '19s', delay: '-14s', opacity: 0.2 },
  { left: '85%', size: 11, duration: '17s', delay: '-4s', opacity: 0.24 },
  { left: '93%', size: 9, duration: '21s', delay: '-10s', opacity: 0.21 },
];

export function ChristmasSnowfall() {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <div aria-hidden="true" className="natal-snow-layer">
      {SNOWFLAKES.map((flake, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          width={flake.size}
          height={flake.size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="natal-snowflake"
          style={{
            left: flake.left,
            opacity: flake.opacity,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
          }}
        >
          <path d="M12 2v20M4.93 6.93l14.14 10.14M19.07 6.93L4.93 17.07" />
        </svg>
      ))}
    </div>
  );
}

/**
 * 3. Detalhe de festão e luzinhas delicadas sobreposto na borda superior do Header
 *    (Posicionamento absoluto para NÃO aumentar a altura do header)
 */
export function ChristmasHeaderGarland() {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-50 h-2 w-full overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <path
          d="M0 1 Q150 9 300 2 T600 3 T900 2 T1200 1"
          fill="none"
          stroke="#1E5631"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
        {[50, 170, 290, 410, 530, 650, 770, 890, 1010, 1130].map((x, idx) => (
          <circle
            key={x}
            cx={x}
            cy={idx % 2 === 0 ? 5.5 : 4.5}
            r="2.1"
            fill={idx % 3 === 0 ? '#D4AF37' : idx % 3 === 1 ? '#C0392B' : '#15803D'}
            className={idx % 2 === 0 ? 'natal-light-bulb' : 'natal-light-bulb-alt'}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * 4. Mini gorro de Papai Noel minimalista / ramo natalino no avatar do logo (sem afetar layout)
 */
export function ChristmasLogoCornerAccent() {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 28"
      className="pointer-events-none -top-2 -right-1.5 absolute h-5 w-5 drop-shadow-2xs"
      fill="none"
    >
      {/* Gorro de Natal elegante inclinado */}
      <path
        d="M5 17C6 9 13 5 21 7c-2 4-2 8-1 11L5 17Z"
        fill="#C0392B"
        stroke="#B91C1C"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Barra branca macia do gorro */}
      <rect
        x="3.8"
        y="15.8"
        width="16.8"
        height="3.4"
        rx="1.7"
        transform="rotate(4 3.8 15.8)"
        fill="#FAFAFA"
        stroke="#D4AF37"
        strokeWidth="0.6"
      />
      {/* Pompom dourado/neve */}
      <circle cx="22.5" cy="7.5" r="2.3" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="0.7" />
    </svg>
  );
}

/**
 * 5. Estrela dourada minimalista para badges e ações principais
 */
export function ChristmasGoldStarAccent({ className = '' }: { className?: string }) {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`pointer-events-none h-3 w-3 shrink-0 text-[#E5C158] ${className}`}
      fill="currentColor"
    >
      <path d="M8 0.5L9.7 5.8L15 7.5L9.7 9.2L8 14.5L6.3 9.2L1 7.5L6.3 5.8L8 0.5Z" />
    </svg>
  );
}

/**
 * 6. Detalhe sutil de ramo de pinheiro e estrela dourada no canto superior de cards em destaque
 *    (Posicionamento absoluto e pointer-events: none para não alterar o grid nem espaçamentos)
 */
export function ChristmasCardCornerAccent({ className = '' }: { className?: string }) {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 28"
      className={`pointer-events-none absolute top-1.5 right-1.5 h-4 w-6 opacity-80 ${className}`}
      fill="none"
    >
      {/* Ramo de pinheiro minimalista */}
      <path
        d="M4 8c8 0 15 3 22 9M10 12c5 0 9 2 13 5"
        stroke="#1E5631"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Bagas vermelhas sutis */}
      <circle cx="20" cy="12" r="1.4" fill="#C0392B" fillOpacity="0.85" />
      <circle cx="23.2" cy="14.2" r="1.15" fill="#B91C1C" fillOpacity="0.85" />
      {/* Estrela dourada champanhe */}
      <path
        d="M29 3L30.1 6.4L33.5 7.5L30.1 8.6L29 12L27.9 8.6L24.5 7.5L27.9 6.4L29 3Z"
        fill="#D4AF37"
      />
    </svg>
  );
}

/**
 * 7. Ícones natalinos discretos nos divisores de seção (estrela dourada + ramo de pinheiro)
 */
export function ChristmasSectionDivider() {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none relative mx-auto max-w-[1200px] px-6">
      <div className="absolute inset-x-6 -top-3 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/45 bg-white px-3 py-0.5 shadow-2xs">
          <svg viewBox="0 0 20 12" className="h-2.5 w-4 text-[#1E5631]" fill="none">
            <path
              d="M1 8c4-3 8-4 14-3M5 9c2-2 5-3 9-2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="16" cy="5.5" r="1.3" fill="#C0392B" />
          </svg>
          <svg viewBox="0 0 16 16" className="h-3 w-3 text-[#D4AF37]" fill="currentColor">
            <path d="M8 0.5L9.7 5.8L15 7.5L9.7 9.2L8 14.5L6.3 9.2L1 7.5L6.3 5.8L8 0.5Z" />
          </svg>
          <svg viewBox="0 0 20 12" className="h-2.5 w-4 text-[#1E5631] scale-x-[-1]" fill="none">
            <path
              d="M1 8c4-3 8-4 14-3M5 9c2-2 5-3 9-2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="16" cy="5.5" r="1.3" fill="#C0392B" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/**
 * 8. Saudação discreta de "Boas Festas" com estrelas douradas no Rodapé
 */
export function ChristmasFooterAccent() {
  if (!CHRISTMAS_THEME_ENABLED) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex items-center justify-center gap-3 border-b border-[#D4AF37]/35 bg-gradient-to-r from-[#1E5631]/5 via-[#C0392B]/5 to-[#1E5631]/5 px-6 py-2 text-[11px] font-medium text-[#1E5631]"
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-[#D4AF37]" fill="currentColor">
        <path d="M8 0.5L9.7 5.8L15 7.5L9.7 9.2L8 14.5L6.3 9.2L1 7.5L6.3 5.8L8 0.5Z" />
      </svg>
      <span>Boas Festas · Solidariedade e Esperança no Natal 2026</span>
      <svg viewBox="0 0 16 16" className="h-3 w-3 text-[#D4AF37]" fill="currentColor">
        <path d="M8 0.5L9.7 5.8L15 7.5L9.7 9.2L8 14.5L6.3 9.2L1 7.5L6.3 5.8L8 0.5Z" />
      </svg>
    </div>
  );
}
