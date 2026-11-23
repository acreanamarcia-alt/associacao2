export type PwaPermissionState = NotificationPermission | 'unsupported';

export interface PwaNotificationSupport {
  supported: boolean;
  permission: PwaPermissionState;
  serviceWorkerAvailable: boolean;
  serviceWorkerReady: boolean;
  isInIframe: boolean;
  isStandalone: boolean;
}

export interface PwaAlertPayload {
  id: string;
  category: 'work_shift' | 'stock_emergency' | 'test';
  title: string;
  body: string;
  tag: string;
  priority: 'normal' | 'urgente' | 'critica';
  requireInteraction?: boolean;
  url?: string;
}

export interface PwaDispatchResult {
  delivered: boolean;
  channel: 'service-worker' | 'window-notification' | 'in-app-fallback';
  reason?: string;
}

interface ExtendedServiceWorkerNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
}

function detectIframeAndStandalone(): { isInIframe: boolean; isStandalone: boolean } {
  if (typeof window === 'undefined') {
    return { isInIframe: false, isStandalone: false };
  }
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return { isInIframe, isStandalone };
}

async function getReadyServiceWorkerRegistration(
  timeoutMs = 1200
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing?.active) {
      return existing;
    }

    const readyPromise = navigator.serviceWorker.ready.then((reg) => reg);
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });
    const reg = await Promise.race([readyPromise, timeoutPromise]);
    return reg ?? existing ?? null;
  } catch {
    return null;
  }
}

export async function getPwaNotificationSupport(): Promise<PwaNotificationSupport> {
  const { isInIframe, isStandalone } = detectIframeAndStandalone();
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const permission: PwaPermissionState = supported ? window.Notification.permission : 'unsupported';
  const serviceWorkerAvailable =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  let serviceWorkerReady = false;
  if (serviceWorkerAvailable) {
    const reg = await getReadyServiceWorkerRegistration(500);
    serviceWorkerReady = Boolean(reg?.active && typeof reg.showNotification === 'function');
  }

  return {
    supported,
    permission,
    serviceWorkerAvailable,
    serviceWorkerReady,
    isInIframe,
    isStandalone,
  };
}

export async function requestPwaNotificationPermission(): Promise<PwaPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (window.Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export async function dispatchNativePwaNotification(
  payload: PwaAlertPayload
): Promise<PwaDispatchResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      delivered: false,
      channel: 'in-app-fallback',
      reason: 'Este navegador não oferece suporte à API Notification.',
    };
  }

  if (window.Notification.permission !== 'granted') {
    return {
      delivered: false,
      channel: 'in-app-fallback',
      reason:
        window.Notification.permission === 'denied'
          ? 'Permissão de notificações bloqueada no navegador.'
          : 'Permissão de notificações ainda não concedida pelo usuário.',
    };
  }

  const baseOptions: NotificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag,
    requireInteraction: Boolean(payload.requireInteraction),
    data: {
      url: payload.url || '/#vagas',
      alertId: payload.id,
      category: payload.category,
    },
  };

  // Prefer PWA Service Worker native notification when active
  const registration = await getReadyServiceWorkerRegistration(1200);
  if (registration && typeof registration.showNotification === 'function') {
    try {
      const swOptions: ExtendedServiceWorkerNotificationOptions = {
        ...baseOptions,
        renotify: true,
        vibrate:
          payload.category === 'stock_emergency'
            ? [220, 100, 220, 100, 220]
            : [150, 75, 150],
      };
      await registration.showNotification(payload.title, swOptions);
      return {
        delivered: true,
        channel: 'service-worker',
      };
    } catch {
      // Fallback below to window.Notification
    }
  }

  // Direct Notification API fallback
  try {
    const nativeNotif = new window.Notification(payload.title, baseOptions);
    nativeNotif.onclick = () => {
      try {
        window.focus();
      } catch {
        // Ignore focus errors inside sandboxed contexts
      }
      nativeNotif.close();
    };
    return {
      delivered: true,
      channel: 'window-notification',
    };
  } catch (err) {
    return {
      delivered: false,
      channel: 'in-app-fallback',
      reason:
        err instanceof Error
          ? err.message
          : 'Não foi possível exibir a notificação nativa neste contexto.',
    };
  }
}
