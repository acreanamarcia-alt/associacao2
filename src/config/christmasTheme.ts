/**
 * Configuração central do Tema Natalino 2026.
 * Basta alterar `CHRISTMAS_THEME_ENABLED` para `false` após as festas
 * para desativar o banner, flocos de neve, enfeites e a classe `.tema-natal`.
 */
export const CHRISTMAS_THEME_ENABLED = true;

export const CHRISTMAS_ROOT_CLASS = 'tema-natal';
const BANNER_DISMISSED_KEY = 'rsbp_christmas_2026_banner_closed';

export function isChristmasBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1' ||
      window.localStorage.getItem(BANNER_DISMISSED_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function persistChristmasBannerDismissal(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    window.localStorage.setItem(BANNER_DISMISSED_KEY, '1');
  } catch {
    // Ignore storage access errors
  }
}
