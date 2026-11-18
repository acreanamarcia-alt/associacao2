import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { LanguageCode, SiteTranslations, TRANSLATIONS } from './translations';

const STORAGE_KEY = 'bompastor_lang_v1';

interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (next: LanguageCode) => void;
  t: SiteTranslations;
  pick: <T>(variants: { pt: T; en: T; es: T }) => T;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'pt';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'es') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'pt';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(readInitialLanguage);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const htmlLang = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en' : 'es';
    document.documentElement.lang = htmlLang;
  }, [lang]);

  const pick = useCallback(
    <T,>(variants: { pt: T; en: T; es: T }): T => {
      return variants[lang] ?? variants.pt;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: TRANSLATIONS[lang],
        pick,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
