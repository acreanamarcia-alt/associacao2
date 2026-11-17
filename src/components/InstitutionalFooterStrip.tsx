import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { INSTITUTION_PROFILE } from '../data/institutionalData';

interface InstitutionalFooterStripProps {
  variant?: 'portal' | 'admin' | 'compact';
}

export function InstitutionalFooterStrip({ variant = 'compact' }: InstitutionalFooterStripProps) {
  const isAdmin = variant === 'admin';

  return (
    <div
      className={
        isAdmin
          ? 'border-t border-slate-200 bg-white px-6 py-5 text-xs text-slate-600'
          : 'border-t border-[#E2DDD3] bg-[#EFEBE3] px-6 py-3.5 text-xs text-[#44403C]'
      }
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className={isAdmin ? 'font-semibold text-slate-900' : 'font-semibold text-[#1C1917]'}>
            {INSTITUTION_PROFILE.legalName} ({INSTITUTION_PROFILE.popularName}) · CNPJ:{' '}
            <span className="font-mono tabular-nums">{INSTITUTION_PROFILE.cnpj}</span> · Fundação:{' '}
            <span className="font-mono tabular-nums">{INSTITUTION_PROFILE.foundedShort}</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#14532D]" aria-hidden="true" />
              <span>{INSTITUTION_PROFILE.fullAddress}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#14532D]" aria-hidden="true" />
              <span>
                {INSTITUTION_PROFILE.phoneDisplay} / PIX {INSTITUTION_PROFILE.pixPhoneDisplay}
              </span>
            </span>
          </p>
          <p className={isAdmin ? 'text-[11px] text-slate-500' : 'text-[11px] text-[#57534E]'}>
            Utilidade Pública Estadual: {INSTITUTION_PROFILE.stateLaw} · Controle e Parcerias:{' '}
            {INSTITUTION_PROFILE.partners}
          </p>
        </div>

        <a
          href={INSTITUTION_PROFILE.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 self-start rounded-md border border-[#14532D]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#14532D] hover:bg-[#14532D] hover:text-white transition-colors sm:self-center"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Ver Sede no Google Maps</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
