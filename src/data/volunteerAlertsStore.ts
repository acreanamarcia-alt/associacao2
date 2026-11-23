import { useCallback, useEffect, useState } from 'react';
import { DonationProductItem, PIX_INFO } from './donationsStore';
import { dispatchNativePwaNotification, PwaDispatchResult } from '../utils/pwaNotifications';

export type VolunteerAlertCategory = 'work_shift' | 'stock_emergency';
export type VolunteerAlertPriority = 'normal' | 'urgente' | 'critica';

export interface VolunteerPwaAlert {
  id: string;
  category: VolunteerAlertCategory;
  priority: VolunteerAlertPriority;
  title: string;
  message: string;
  shiftRole?: string;
  shiftDate?: string;
  shiftTime?: string;
  location?: string;
  spotsNeeded?: number;
  affectedItems?: string[];
  targetAudienceLabel: string;
  targetVolunteersCount: number;
  createdAt: string;
  createdBy: string;
  deliveredNative: boolean;
  deliveryChannel: PwaDispatchResult['channel'];
  deliveryNote?: string;
  readByVolunteer?: boolean;
}

export interface VolunteerAlertSettings {
  autoStockEmergencyEnabled: boolean;
  criticalStockThresholdPct: number;
  volunteerOptInEnabled: boolean;
  lastAutoAlertSignature: string;
}

export interface CriticalStockProductInfo {
  product: DonationProductItem;
  percentOfTarget: number;
  severity: 'critica' | 'baixa';
}

const KEY_ALERTS = 'rsbp_volunteer_pwa_alerts_v1';
const KEY_SETTINGS = 'rsbp_volunteer_pwa_alert_settings_v1';
const SYNC_EVENT = 'rsbp-volunteer-pwa-alerts-sync';
const CHANNEL_NAME = 'rsbp-pwa-alerts-broadcast';

const DEFAULT_SETTINGS: VolunteerAlertSettings = {
  autoStockEmergencyEnabled: true,
  criticalStockThresholdPct: 25,
  volunteerOptInEnabled: false,
  lastAutoAlertSignature: '',
};

function readAlertsStorage(): VolunteerPwaAlert[] {
  try {
    const raw = localStorage.getItem(KEY_ALERTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VolunteerPwaAlert[]) : [];
  } catch {
    return [];
  }
}

function writeAlertsStorage(alerts: VolunteerPwaAlert[]) {
  try {
    localStorage.setItem(KEY_ALERTS, JSON.stringify(alerts.slice(0, 60)));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

function readSettingsStorage(): VolunteerAlertSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<VolunteerAlertSettings>;
    return {
      autoStockEmergencyEnabled:
        typeof parsed.autoStockEmergencyEnabled === 'boolean'
          ? parsed.autoStockEmergencyEnabled
          : DEFAULT_SETTINGS.autoStockEmergencyEnabled,
      criticalStockThresholdPct:
        typeof parsed.criticalStockThresholdPct === 'number' &&
        parsed.criticalStockThresholdPct >= 5 &&
        parsed.criticalStockThresholdPct <= 80
          ? parsed.criticalStockThresholdPct
          : DEFAULT_SETTINGS.criticalStockThresholdPct,
      volunteerOptInEnabled: Boolean(parsed.volunteerOptInEnabled),
      lastAutoAlertSignature:
        typeof parsed.lastAutoAlertSignature === 'string'
          ? parsed.lastAutoAlertSignature
          : '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettingsStorage(settings: VolunteerAlertSettings) {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCriticalStockProducts(
  products: DonationProductItem[],
  thresholdPct = 25
): CriticalStockProductInfo[] {
  return products
    .filter((p) => p.active)
    .map((p) => {
      const target = Math.max(1, p.targetQty);
      const pct = Math.round((p.receivedQty / target) * 100);
      const severity: 'critica' | 'baixa' = p.receivedQty === 0 || pct <= 10 ? 'critica' : 'baixa';
      return {
        product: p,
        percentOfTarget: pct,
        severity,
      };
    })
    .filter((info) => info.percentOfTarget <= thresholdPct)
    .sort((a, b) => a.percentOfTarget - b.percentOfTarget);
}

export function buildVolunteerAlertWhatsappUrl(alert: VolunteerPwaAlert): string {
  const header =
    alert.category === 'stock_emergency'
      ? '*ALERTA DE EMERGÊNCIA DE ESTOQUE — PROJETO SOPÃO*'
      : '*CONVOCAÇÃO DE NOVA ESCALA VOLUNTÁRIA — PROJETO SOPÃO*';

  const details: string[] = [
    header,
    'Associação Recanto Social Bom Pastor · Plácido de Castro - AC',
    '',
    `*${alert.title}*`,
    alert.message,
  ];

  if (alert.shiftRole) details.push(`Frente: ${alert.shiftRole}`);
  if (alert.shiftDate || alert.shiftTime) {
    details.push(`Data/Horário: ${[alert.shiftDate, alert.shiftTime].filter(Boolean).join(' · ')}`);
  }
  if (alert.location) details.push(`Local: ${alert.location}`);
  if (alert.affectedItems && alert.affectedItems.length > 0) {
    details.push(`Itens críticos: ${alert.affectedItems.join(', ')}`);
  }
  details.push(`Emitido em: ${alert.createdAt} · Por: ${alert.createdBy}`);

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(
    details.join('\n')
  )}`;
}

export interface CreateVolunteerAlertInput {
  category: VolunteerAlertCategory;
  priority: VolunteerAlertPriority;
  title: string;
  message: string;
  shiftRole?: string;
  shiftDate?: string;
  shiftTime?: string;
  location?: string;
  spotsNeeded?: number;
  affectedItems?: string[];
  targetAudienceLabel: string;
  targetVolunteersCount: number;
  createdBy: string;
}

export function useVolunteerAlertsStore() {
  const [alerts, setAlerts] = useState<VolunteerPwaAlert[]>(() => readAlertsStorage());
  const [settings, setSettings] = useState<VolunteerAlertSettings>(() => readSettingsStorage());

  useEffect(() => {
    const sync = () => {
      setAlerts(readAlertsStorage());
      setSettings(readSettingsStorage());
    };

    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener('storage', sync);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event: MessageEvent<{ type?: string; alert?: VolunteerPwaAlert }>) => {
          sync();
          const currentSettings = readSettingsStorage();
          if (
            event.data?.type === 'NEW_VOLUNTEER_ALERT' &&
            event.data.alert &&
            currentSettings.volunteerOptInEnabled
          ) {
            const incoming = event.data.alert;
            void dispatchNativePwaNotification({
              id: incoming.id,
              category: incoming.category,
              priority: incoming.priority,
              title: incoming.title,
              body: incoming.message,
              tag: `${incoming.category}-${incoming.id}`,
              requireInteraction: incoming.category === 'stock_emergency',
              url: '/#vagas',
            });
          }
        };
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener('storage', sync);
      channel?.close();
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<VolunteerAlertSettings>) => {
    const current = readSettingsStorage();
    const next = { ...current, ...patch };
    setSettings(next);
    writeSettingsStorage(next);
  }, []);

  const dispatchAlert = useCallback(
    async (input: CreateVolunteerAlertInput): Promise<VolunteerPwaAlert> => {
      const id = `pwa-alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nowLabel = new Date().toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      const nativeRes = await dispatchNativePwaNotification({
        id,
        category: input.category,
        priority: input.priority,
        title: input.title,
        body: input.message,
        tag: `${input.category}-${id}`,
        requireInteraction:
          input.category === 'stock_emergency' || input.priority === 'critica',
        url: '/#vagas',
      });

      const newAlert: VolunteerPwaAlert = {
        ...input,
        id,
        createdAt: nowLabel,
        deliveredNative: nativeRes.delivered,
        deliveryChannel: nativeRes.channel,
        deliveryNote: nativeRes.reason,
        readByVolunteer: false,
      };

      const current = readAlertsStorage();
      const next = [newAlert, ...current];
      setAlerts(next);
      writeAlertsStorage(next);

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const ch = new BroadcastChannel(CHANNEL_NAME);
          ch.postMessage({ type: 'NEW_VOLUNTEER_ALERT', alert: newAlert });
          ch.close();
        } catch {
          // Ignore BroadcastChannel errors
        }
      }

      return newAlert;
    },
    []
  );

  const resendAlert = useCallback(async (id: string): Promise<PwaDispatchResult> => {
    const current = readAlertsStorage();
    const target = current.find((a) => a.id === id);
    if (!target) {
      return {
        delivered: false,
        channel: 'in-app-fallback',
        reason: 'Alerta não encontrado.',
      };
    }

    const res = await dispatchNativePwaNotification({
      id: target.id,
      category: target.category,
      priority: target.priority,
      title: target.title,
      body: target.message,
      tag: `${target.category}-${target.id}-resend`,
      requireInteraction: target.category === 'stock_emergency',
      url: '/#vagas',
    });

    const next = current.map((a) =>
      a.id === id
        ? {
            ...a,
            deliveredNative: res.delivered,
            deliveryChannel: res.channel,
            deliveryNote: res.reason,
          }
        : a
    );
    setAlerts(next);
    writeAlertsStorage(next);
    return res;
  }, []);

  const markAllRead = useCallback(() => {
    const current = readAlertsStorage();
    const next = current.map((a) => ({ ...a, readByVolunteer: true }));
    setAlerts(next);
    writeAlertsStorage(next);
  }, []);

  const removeAlert = useCallback((id: string) => {
    const current = readAlertsStorage();
    const next = current.filter((a) => a.id !== id);
    setAlerts(next);
    writeAlertsStorage(next);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    writeAlertsStorage([]);
  }, []);

  const unreadCount = alerts.filter((a) => !a.readByVolunteer).length;

  return {
    alerts,
    settings,
    unreadCount,
    updateSettings,
    dispatchAlert,
    resendAlert,
    markAllRead,
    removeAlert,
    clearAlerts,
  };
}
