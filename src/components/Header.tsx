import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AdminUser, canEnterAdminPanel } from '../data/adminAuthClient';
import { OFFICIAL_ASSETS } from '../data/institutionalData';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageCode } from '../i18n/translations';
import {
  ChristmasHeaderGarland,
  ChristmasLogoCornerAccent,
} from './ChristmasThemeElements';
import { PWAInstallButton } from './PWAInstallButton';
import { TopSiteSearchBar } from './TopSiteSearchBar';

interface HeaderProps {
  authUser?: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenAccount?: () => void;
  onJumpToVolunteer: () => void;
}

const LANGUAGE_BUTTONS: Array<{ code: LanguageCode; label: string; full: string }> = [
  { code: 'pt', label: 'PT', full: 'Português' },
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'es', label: 'ES', full: 'Español' },
];

export function Header({
  authUser,
  onOpenAdmin,
  onOpenAccount,
  onJumpToVolunteer,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navLinks = [
    { href: '#vagas', label: t.nav.roles },
    { href: '#doacoes', label: t.nav.donate },
    { href: '#sacoloes', label: t.nav.baskets },
    { href: '#producao', label: t.nav.production },
    { href: '#depoimentos', label: t.nav.testimonials },
    { href: '#central-ia', label: t.nav.intel },
    { href: '#historia', label: t.nav.history },
  ];

  const isStandardUser = Boolean(authUser && !canEnterAdminPanel(authUser.role));

  const accountActionLabel = isStandardUser ? t.nav.account : t.nav.panel;

  const handleAccountAction = () => {
    if (isStandardUser && onOpenAccount) {
      onOpenAccount();
      return;
    }
    onOpenAdmin();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D6CEBE] bg-[#FBF9F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <a href="#inicio" className="flex min-w-0 items-center gap-3 group">
          <div className="relative shrink-0">
            <img
              src={OFFICIAL_ASSETS.logo}
              alt="Logo oficial Projeto Sopão Acre"
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-full border border-[#14532D]/30 bg-white object-cover shadow-xs sm:h-12 sm:w-12"
            />
            <ChristmasLogoCornerAccent />
          </div>
          <span className="font-serif text-base font-bold leading-tight tracking-tight text-[#14532D] transition-colors group-hover:text-[#0F3F22] sm:text-lg xl:whitespace-nowrap">
            Associação Recanto Social Bom Pastor
          </span>
        </a>

        <nav
          aria-label="Navegação principal"
          className="hidden xl:flex items-center gap-4 text-[13px] font-medium text-[#57534E]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#1C1917] hover:underline underline-offset-4"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={handleAccountAction}
            className="whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-150 hover:text-[#1C1917] hover:underline underline-offset-4"
          >
            {accountActionLabel}
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Seletor Global de Idiomas (PT / EN / ES) */}
          <div
            role="group"
            aria-label={t.nav.selectLanguage}
            className="inline-flex items-center gap-0.5 rounded-md border border-[#D6CEBE] bg-[#EFEBE3] p-0.5"
          >
            <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-[#14532D] hidden sm:block" aria-hidden="true" />
            {LANGUAGE_BUTTONS.map((item) => {
              const active = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  title={item.full}
                  aria-pressed={active}
                  className={`cursor-pointer rounded px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#14532D] text-white shadow-xs'
                      : 'text-[#57534E] hover:bg-white hover:text-[#1C1917]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block">
            <PWAInstallButton variant="header" />
          </div>

          <button
            type="button"
            onClick={onJumpToVolunteer}
            className="hidden sm:inline-flex cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
          >
            {t.nav.volunteerCta}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2DDD3] text-[#1C1917] xl:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#E2DDD3] bg-[#FBF9F5] px-6 py-4 xl:hidden">
          <nav aria-label="Navegação móvel" className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-sm font-medium text-[#1C1917]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAccountAction();
              }}
              className="py-1.5 text-left text-sm font-medium text-[#1C1917]"
            >
              {isStandardUser ? t.nav.account : t.nav.panel}
            </button>

            <div className="flex items-center justify-between border-t border-[#E2DDD3] pt-3">
              <span className="text-xs font-medium text-[#57534E]">{t.nav.selectLanguage}</span>
              <div className="inline-flex items-center gap-1 rounded-md border border-[#D6CEBE] bg-[#EFEBE3] p-0.5">
                {LANGUAGE_BUTTONS.map((item) => {
                  const active = lang === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLang(item.code)}
                      className={`cursor-pointer rounded px-2.5 py-1 text-xs font-semibold ${
                        active ? 'bg-[#14532D] text-white' : 'text-[#57534E]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1">
              <PWAInstallButton
                variant="sidebar"
                onAfterAction={() => setMobileMenuOpen(false)}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onJumpToVolunteer();
              }}
              className="mt-1 inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-semibold text-white"
            >
              {t.nav.volunteerCta}
            </button>
          </nav>
        </div>
      )}
      <TopSiteSearchBar />
      <ChristmasHeaderGarland />
    </header>
  );
}
