import { useCallback, useEffect, useState } from 'react';
import { OFFICIAL_ASSETS } from './institutionalData';

export interface RadioBannerConfig {
  enabled: boolean;
  stationName: string;
  frequencyLabel: string;
  programTitle: string;
  presenterName: string;
  description: string;
  listenUrl: string;
  ctaLabel: string;
  bannerImageUrl: string;
  bannerImageAlt: string;
  scheduleNote: string;
  updatedAt: string;
}

const STORAGE_KEY = 'arsbp_radio_banner_v1';
const RADIO_BANNER_UPDATED_EVENT = 'arsbp:radio-banner-updated';

export const DEFAULT_RADIO_BANNER_CONFIG: RadioBannerConfig = {
  enabled: true,
  stationName: 'Rádio Boas Novas FM 96,3',
  frequencyLabel: 'FM 96,3 · Série Voz Missionária',
  programTitle: 'Programa Voz da Assembleia de Deus — Série Voz Missionária',
  presenterName: 'Missionário Teodoro',
  description:
    'Ouça o programa Voz da Assembleia de Deus com a série Voz Missionária através deste APLICATIVO DA RÁDIO BOAS NOVAS FM 96.3.',
  listenUrl: 'https://voxhdstore.com.br/radioboasnovasfm963',
  ctaLabel: 'Ouvir no Aplicativo Rádio Boas Novas FM 96,3',
  bannerImageUrl: OFFICIAL_ASSETS.leadershipInAction,
  bannerImageAlt:
    'Missionário Teodoro — Programa Voz da Assembleia de Deus (Série Voz Missionária) na Rádio Boas Novas FM 96,3',
  scheduleNote: 'Transmissão Missionária · Rádio Boas Novas FM 96,3',
  updatedAt: '2026-11-23T00:00:00.000Z',
};

export function sanitizeExternalRadioUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_RADIO_BANNER_CONFIG.listenUrl;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }
  return DEFAULT_RADIO_BANNER_CONFIG.listenUrl;
}

export function sanitizeBannerImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_RADIO_BANNER_CONFIG.bannerImageUrl;
  if (
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/src/') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Fallback below
  }
  return DEFAULT_RADIO_BANNER_CONFIG.bannerImageUrl;
}

export function loadRadioBannerConfig(): RadioBannerConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_RADIO_BANNER_CONFIG;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RADIO_BANNER_CONFIG;
    const parsed = JSON.parse(raw) as Partial<RadioBannerConfig>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      stationName: parsed.stationName?.trim() || DEFAULT_RADIO_BANNER_CONFIG.stationName,
      frequencyLabel:
        parsed.frequencyLabel?.trim() || DEFAULT_RADIO_BANNER_CONFIG.frequencyLabel,
      programTitle: parsed.programTitle?.trim() || DEFAULT_RADIO_BANNER_CONFIG.programTitle,
      presenterName: parsed.presenterName?.trim() || DEFAULT_RADIO_BANNER_CONFIG.presenterName,
      description: parsed.description?.trim() || DEFAULT_RADIO_BANNER_CONFIG.description,
      listenUrl: sanitizeExternalRadioUrl(
        parsed.listenUrl ?? DEFAULT_RADIO_BANNER_CONFIG.listenUrl
      ),
      ctaLabel: parsed.ctaLabel?.trim() || DEFAULT_RADIO_BANNER_CONFIG.ctaLabel,
      bannerImageUrl: sanitizeBannerImageUrl(
        parsed.bannerImageUrl ?? DEFAULT_RADIO_BANNER_CONFIG.bannerImageUrl
      ),
      bannerImageAlt: parsed.bannerImageAlt?.trim() || DEFAULT_RADIO_BANNER_CONFIG.bannerImageAlt,
      scheduleNote: parsed.scheduleNote?.trim() || DEFAULT_RADIO_BANNER_CONFIG.scheduleNote,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_RADIO_BANNER_CONFIG;
  }
}

export function saveRadioBannerConfig(next: RadioBannerConfig): RadioBannerConfig {
  const sanitized: RadioBannerConfig = {
    enabled: Boolean(next.enabled),
    stationName: next.stationName.trim() || DEFAULT_RADIO_BANNER_CONFIG.stationName,
    frequencyLabel: next.frequencyLabel.trim() || DEFAULT_RADIO_BANNER_CONFIG.frequencyLabel,
    programTitle: next.programTitle.trim() || DEFAULT_RADIO_BANNER_CONFIG.programTitle,
    presenterName: next.presenterName.trim() || DEFAULT_RADIO_BANNER_CONFIG.presenterName,
    description: next.description.trim() || DEFAULT_RADIO_BANNER_CONFIG.description,
    listenUrl: sanitizeExternalRadioUrl(next.listenUrl),
    ctaLabel: next.ctaLabel.trim() || DEFAULT_RADIO_BANNER_CONFIG.ctaLabel,
    bannerImageUrl: sanitizeBannerImageUrl(next.bannerImageUrl),
    bannerImageAlt: next.bannerImageAlt.trim() || DEFAULT_RADIO_BANNER_CONFIG.bannerImageAlt,
    scheduleNote: next.scheduleNote.trim() || DEFAULT_RADIO_BANNER_CONFIG.scheduleNote,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(RADIO_BANNER_UPDATED_EVENT, { detail: sanitized }));
  }
  return sanitized;
}

export function resetRadioBannerConfig(): RadioBannerConfig {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(RADIO_BANNER_UPDATED_EVENT, { detail: DEFAULT_RADIO_BANNER_CONFIG })
    );
  }
  return DEFAULT_RADIO_BANNER_CONFIG;
}

export function useRadioBannerStore() {
  const [config, setConfig] = useState<RadioBannerConfig>(() => loadRadioBannerConfig());

  useEffect(() => {
    const sync = () => {
      setConfig(loadRadioBannerConfig());
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        sync();
      }
    };
    window.addEventListener(RADIO_BANNER_UPDATED_EVENT, sync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(RADIO_BANNER_UPDATED_EVENT, sync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateConfig = useCallback((next: RadioBannerConfig) => {
    const saved = saveRadioBannerConfig(next);
    setConfig(saved);
    return saved;
  }, []);

  const resetConfig = useCallback(() => {
    const reset = resetRadioBannerConfig();
    setConfig(reset);
    return reset;
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
  };
}

/**
 * Redimensiona/comprime a imagem selecionada (até 1280px de largura) para que
 * banners enviados do celular ou computador sejam salvos com segurança no navegador.
 */
export async function compressBannerImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Não foi possível ler o arquivo de imagem.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });

  if (dataUrl.length <= 350_000) {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1280;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const compressed = canvas.toDataURL('image/jpeg', 0.84);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
