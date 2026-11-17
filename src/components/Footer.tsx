import { ArrowUpRight, Calendar, FileText, Landmark, Lock, MapPin, Phone } from 'lucide-react';
import { INSTITUTION_PROFILE, OFFICIAL_ASSETS } from '../data/institutionalData';

interface FooterProps {
  onOpenEbook: () => void;
  onOpenAdmin: () => void;
}

export function Footer({ onOpenEbook, onOpenAdmin }: FooterProps) {
  const whatsappUrl = `https://wa.me/${INSTITUTION_PROFILE.whatsappDigits}?text=${encodeURIComponent(
    'Olá! Gostaria de saber mais sobre como ser voluntário ou apoiar o Projeto Sopão (Associação Recanto Social Bom Pastor).'
  )}`;

  return (
    <footer className="border-t border-[#E2DDD3] bg-[#F4F0E8] text-[#1C1917]">
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="flex items-start gap-4 md:col-span-5">
            <img
              src={OFFICIAL_ASSETS.logo}
              alt="Logo Projeto Sopão Acre"
              referrerPolicy="no-referrer"
              className="h-16 w-16 shrink-0 rounded-full border border-[#D6CEBE] bg-white object-cover"
            />
            <div className="space-y-1.5">
              <p className="font-serif text-lg font-semibold text-[#1C1917]">
                {INSTITUTION_PROFILE.legalName}
              </p>
              <p className="text-sm text-[#57534E]">
                Nome Popular: <strong className="text-[#1C1917]">{INSTITUTION_PROFILE.popularName}</strong>
              </p>
              <p className="font-mono text-xs tabular-nums text-[#44403C]">
                CNPJ / PIX: {INSTITUTION_PROFILE.cnpj} · PIX Tel: {INSTITUTION_PROFILE.pixPhoneDisplay}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-[#57534E]">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#14532D]" aria-hidden="true" />
                <span>Fundação: {INSTITUTION_PROFILE.foundedAt}</span>
              </p>
              <p className="flex items-start gap-1.5 text-xs text-[#57534E]">
                <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#14532D]" aria-hidden="true" />
                <span>
                  Utilidade Pública Estadual: {INSTITUTION_PROFILE.stateLaw} (DOE 24/11/2021) ·{' '}
                  {INSTITUTION_PROFILE.fomento} · {INSTITUTION_PROFILE.judiciary}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-sm text-[#44403C] md:col-span-4">
            <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
              Endereço da Sede &amp; Contato Direto
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#14532D]" aria-hidden="true" />
              <span>{INSTITUTION_PROFILE.fullAddress}</span>
            </p>
            <div>
              <a
                href={INSTITUTION_PROFILE.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline underline-offset-4"
              >
                <span>Abrir localização da sede no Google Maps</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <p className="flex items-center gap-2 pt-1">
              <Phone className="h-4 w-4 shrink-0 text-[#14532D]" aria-hidden="true" />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-medium tabular-nums text-[#14532D] hover:underline underline-offset-4"
              >
                {INSTITUTION_PROFILE.phoneDisplay} (WhatsApp / Coletas)
              </a>
            </p>
            <p className="text-xs text-[#57534E]">
              Parcerias e Controle Social: {INSTITUTION_PROFILE.partners}
            </p>
          </div>

          <div className="space-y-2.5 text-sm md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
              Navegação Institucional
            </p>
            <ul className="space-y-1.5 text-[#44403C]">
              <li>
                <a href="#vagas" className="hover:text-[#1C1917] hover:underline underline-offset-4">
                  Vagas de Voluntariado
                </a>
              </li>
              <li>
                <a href="#doacoes" className="hover:text-[#1C1917] hover:underline underline-offset-4">
                  Doar via PIX &amp; Agendar Coleta
                </a>
              </li>
              <li>
                <a href="#sacoloes" className="hover:text-[#1C1917] hover:underline underline-offset-4">
                  Doações de Sacolões às Famílias
                </a>
              </li>
              <li>
                <a href="#producao" className="hover:text-[#1C1917] hover:underline underline-offset-4">
                  Produção Própria de Alimentos
                </a>
              </li>
              <li>
                <a href="#central-ia" className="hover:text-[#1C1917] hover:underline underline-offset-4">
                  Mapa, Pesquisa &amp; Estúdio
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenEbook}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-[#14532D] font-medium hover:underline underline-offset-4"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>E-book Documental (PDF)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-[#44403C] font-medium hover:text-[#1C1917] hover:underline underline-offset-4"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Painel Administrativo &amp; Contabilidade</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#E2DDD3] pt-6 text-xs text-[#78716C]">
          <p>
            © {new Date().getFullYear()} {INSTITUTION_PROFILE.legalName} ({INSTITUTION_PROFILE.popularName}) · CNPJ{' '}
            <span className="font-mono tabular-nums">{INSTITUTION_PROFILE.cnpj}</span>.
          </p>
          <p>{INSTITUTION_PROFILE.fullAddress}</p>
        </div>
      </div>
    </footer>
  );
}
