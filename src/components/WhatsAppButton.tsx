import { buildAssociationWhatsappUrl } from '../data/donationsStore';
import { INSTITUTION_PROFILE } from '../data/institutionalData';
import { useLanguage } from '../i18n/LanguageContext';

interface WhatsAppButtonProps {
  variant?: 'inline' | 'floating';
  customMessage?: string;
  className?: string;
}

function WhatsAppSpeechBubbleIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 3C8.82 3 3 8.7 3 15.72c0 2.54.76 4.91 2.07 6.91L3.35 28.9l6.54-1.69A13.1 13.1 0 0 0 16 28.45c7.18 0 13-5.7 13-12.73C29 8.7 23.18 3 16 3Z"
        fill="#FFFFFF"
      />
      <path
        d="M16 5.2c-5.94 0-10.77 4.72-10.77 10.52 0 2.24.72 4.33 1.96 6.06l-1.08 3.92 4.1-1.06a10.9 10.9 0 0 0 5.79 1.61c5.94 0 10.77-4.72 10.77-10.53C26.77 9.92 21.94 5.2 16 5.2Z"
        fill="#25D366"
      />
      <path
        d="M21.46 18.67c-.28-.14-1.66-.81-1.92-.9-.26-.09-.45-.14-.64.14-.19.28-.73.9-.9 1.09-.17.19-.33.21-.61.07-.28-.14-1.19-.43-2.27-1.38-.84-.74-1.4-1.65-1.57-1.93-.16-.28-.02-.43.12-.57.13-.12.28-.33.42-.49.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.64-1.52-.87-2.08-.23-.54-.47-.47-.64-.48h-.55c-.19 0-.49.07-.75.35-.26.28-.99.96-.99 2.34s1.02 2.71 1.16 2.9c.14.19 2 3.01 4.85 4.22.68.29 1.21.46 1.62.59.68.21 1.3.18 1.79.11.55-.08 1.66-.67 1.9-1.32.23-.65.23-1.21.16-1.32-.07-.12-.26-.19-.54-.33Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WhatsAppButton({
  variant = 'inline',
  customMessage,
  className = '',
}: WhatsAppButtonProps) {
  const { t } = useLanguage();
  const href = buildAssociationWhatsappUrl(customMessage);

  if (variant === 'floating') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.whatsapp.inlineTitle} (${INSTITUTION_PROFILE.phoneDisplay})`}
        className={`group fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] py-1.5 pr-2 pl-4 text-white shadow-lg ring-2 ring-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1EBE57] hover:shadow-xl sm:right-6 sm:bottom-6 ${className}`}
      >
        <span className="text-left leading-tight">
          <span className="block text-xs font-bold tracking-tight">{t.whatsapp.floatingLine1}</span>
          <span className="block text-xs font-bold tracking-tight">{t.whatsapp.floatingLine2}</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] transition-transform duration-200 group-hover:scale-105">
          <WhatsAppSpeechBubbleIcon className="h-9 w-9" />
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t.whatsapp.inlineTitle}: ${INSTITUTION_PROFILE.phoneDisplay}`}
      className={`group inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[#25D366] py-1.5 pr-2 pl-5 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1EBE57] hover:shadow-lg whitespace-nowrap shrink-0 ${className}`}
    >
      <span className="text-left leading-tight">
        <span className="block text-xs font-bold tracking-tight sm:text-[13px]">
          {t.whatsapp.inlineTitle}
        </span>
        <span className="block font-mono text-[10px] font-medium text-white/95 tabular-nums">
          {INSTITUTION_PROFILE.phoneDisplay}
        </span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] transition-transform duration-200 group-hover:scale-105">
        <WhatsAppSpeechBubbleIcon className="h-9 w-9" />
      </span>
    </a>
  );
}
