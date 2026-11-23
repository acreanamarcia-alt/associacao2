import {
  AlertTriangle,
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DonationProductItem } from '../data/donationsStore';
import { INSTITUTION_PROFILE, VOLUNTEER_ROLES } from '../data/institutionalData';
import {
  buildVolunteerAlertWhatsappUrl,
  CreateVolunteerAlertInput,
  getCriticalStockProducts,
  VolunteerAlertCategory,
  VolunteerAlertPriority,
  VolunteerAlertSettings,
  VolunteerPwaAlert,
} from '../data/volunteerAlertsStore';
import { VolunteerApplication } from '../data/volunteersStore';
import {
  dispatchNativePwaNotification,
  getPwaNotificationSupport,
  PwaDispatchResult,
  PwaNotificationSupport,
  requestPwaNotificationPermission,
} from '../utils/pwaNotifications';

interface PwaNotificationsPanelProps {
  products: DonationProductItem[];
  volunteerApplications: VolunteerApplication[];
  alerts: VolunteerPwaAlert[];
  settings: VolunteerAlertSettings;
  adminDisplayName: string;
  initialMode?: VolunteerAlertCategory;
  onDispatchAlert: (input: CreateVolunteerAlertInput) => Promise<VolunteerPwaAlert>;
  onResendAlert: (id: string) => Promise<PwaDispatchResult>;
  onRemoveAlert: (id: string) => void;
  onClearAlerts: () => void;
  onUpdateSettings: (patch: Partial<VolunteerAlertSettings>) => void;
}

export function PwaNotificationsPanel({
  products,
  volunteerApplications,
  alerts,
  settings,
  adminDisplayName,
  initialMode = 'work_shift',
  onDispatchAlert,
  onResendAlert,
  onRemoveAlert,
  onClearAlerts,
  onUpdateSettings,
}: PwaNotificationsPanelProps) {
  const [support, setSupport] = useState<PwaNotificationSupport>({
    supported: true,
    permission: 'default',
    serviceWorkerAvailable: false,
    serviceWorkerReady: false,
    isInIframe: false,
    isStandalone: false,
  });
  const [composerMode, setComposerMode] = useState<VolunteerAlertCategory>(initialMode);
  const [historyFilter, setHistoryFilter] = useState<'all' | VolunteerAlertCategory>('all');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Work Shift form state
  const defaultRole = VOLUNTEER_ROLES[0];
  const [selectedRoleId, setSelectedRoleId] = useState<string>(defaultRole?.id ?? 'custom');
  const [shiftDate, setShiftDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [shiftTime, setShiftTime] = useState<string>(defaultRole?.schedule ?? '14h00 às 18h00');
  const [shiftLocation, setShiftLocation] = useState<string>(
    defaultRole?.location ?? INSTITUTION_PROFILE.address
  );
  const [spotsNeeded, setSpotsNeeded] = useState<string>('4');
  const [shiftAudienceScope, setShiftAudienceScope] = useState<'all' | 'role'>('all');
  const [shiftPriority, setShiftPriority] = useState<VolunteerAlertPriority>('urgente');
  const [shiftTitle, setShiftTitle] = useState<string>(
    `Nova Escala: ${defaultRole?.title ?? 'Cozinha Solidária'}`
  );
  const [shiftMessage, setShiftMessage] = useState<string>(
    `Convocação aberta para a frente "${defaultRole?.title ?? 'Projeto Sopão'}" na sede do Bairro Olaria. Confirme sua presença no painel ou WhatsApp.`
  );

  // Stock Emergency form state
  const criticalItems = useMemo(
    () => getCriticalStockProducts(products, settings.criticalStockThresholdPct),
    [products, settings.criticalStockThresholdPct]
  );

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() =>
    criticalItems.slice(0, 5).map((item) => item.product.id)
  );
  const [stockPriority, setStockPriority] = useState<VolunteerAlertPriority>('critica');
  const [stockTitle, setStockTitle] = useState<string>(
    'Emergência de Estoque · Projeto Sopão'
  );
  const [stockMessage, setStockMessage] = useState<string>('');

  const refreshSupport = async () => {
    const info = await getPwaNotificationSupport();
    setSupport(info);
  };

  useEffect(() => {
    void refreshSupport();
  }, []);

  useEffect(() => {
    setComposerMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (selectedProductIds.length === 0 && criticalItems.length > 0) {
      setSelectedProductIds(criticalItems.slice(0, 5).map((i) => i.product.id));
    }
  }, [criticalItems, selectedProductIds.length]);

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  useEffect(() => {
    if (selectedProducts.length > 0) {
      const names = selectedProducts
        .slice(0, 4)
        .map((p) => `${p.name} (${p.receivedQty}/${p.targetQty} ${p.unit})`)
        .join(', ');
      const extra = selectedProducts.length > 4 ? ` e +${selectedProducts.length - 4} item(ns)` : '';
      setStockMessage(
        `Nível crítico detectado no estoque do sopão: ${names}${extra}. Mobilização urgente de doações e triagem na sede do Bairro Olaria.`
      );
    } else {
      setStockMessage(
        'Solicitamos apoio urgente dos voluntários para arrecadação e reposição de mantimentos essenciais do Projeto Sopão.'
      );
    }
  }, [selectedProducts]);

  const matchingShiftVolunteers = useMemo(() => {
    if (shiftAudienceScope === 'all' || selectedRoleId === 'custom') {
      return volunteerApplications;
    }
    return volunteerApplications.filter((v) => v.roleId === selectedRoleId);
  }, [volunteerApplications, shiftAudienceScope, selectedRoleId]);

  const handleRequestPermission = async () => {
    const result = await requestPwaNotificationPermission();
    await refreshSupport();
    if (result === 'granted') {
      setStatusFeedback({
        type: 'success',
        text: 'Permissão concedida! As notificações nativas do PWA estão ativas neste dispositivo.',
      });
    } else if (result === 'denied') {
      setStatusFeedback({
        type: 'warning',
        text: 'As notificações foram bloqueadas pelo navegador. Libere nas configurações do site ou abra em nova guia.',
      });
    } else if (result === 'unsupported') {
      setStatusFeedback({
        type: 'error',
        text: 'Este navegador não suporta a API Notification.',
      });
    } else {
      setStatusFeedback({
        type: 'warning',
        text: 'A solicitação de permissão foi fechada sem confirmação.',
      });
    }
  };

  const handleTestNotification = async () => {
    let currentPermission = support.permission;
    if (currentPermission === 'default') {
      currentPermission = await requestPwaNotificationPermission();
      await refreshSupport();
    }

    const res = await dispatchNativePwaNotification({
      id: `test-${Date.now()}`,
      category: 'test',
      priority: 'normal',
      title: 'Teste PWA · Projeto Sopão Bom Pastor',
      body: 'Notificações nativas configuradas com sucesso para alertas de escalas e estoque crítico.',
      tag: 'rsbp-pwa-test',
      url: '/#vagas',
    });

    if (res.delivered) {
      setStatusFeedback({
        type: 'success',
        text:
          res.channel === 'service-worker'
            ? 'Notificação de teste entregue via Service Worker nativo do PWA!'
            : 'Notificação de teste entregue via API Notification do navegador!',
      });
    } else {
      setStatusFeedback({
        type: 'warning',
        text: res.reason || 'Não foi possível disparar a notificação nativa neste ambiente.',
      });
    }
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    if (roleId === 'custom') {
      setShiftTitle('Nova Escala Extraordinária · Projeto Sopão');
      setShiftTime('08h00 às 12h00');
      setShiftLocation(INSTITUTION_PROFILE.address);
      setShiftMessage(
        'Mutirão extraordinário de voluntários na sede do Bairro Olaria. Confirme sua disponibilidade.'
      );
      return;
    }
    const found = VOLUNTEER_ROLES.find((r) => r.id === roleId);
    if (found) {
      setShiftTitle(`Nova Escala: ${found.title}`);
      setShiftTime(found.schedule);
      setShiftLocation(found.location);
      setShiftMessage(
        `Convocação aberta para a frente "${found.title}" (${found.schedule}). Confirme sua participação.`
      );
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmitAlert = async (e: FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusFeedback(null);

    try {
      if (support.permission === 'default') {
        await requestPwaNotificationPermission();
        await refreshSupport();
      }

      if (composerMode === 'work_shift') {
        const selectedRoleObj = VOLUNTEER_ROLES.find((r) => r.id === selectedRoleId);
        const roleLabel = selectedRoleObj?.title ?? 'Escala Extraordinária';
        const targetLabel =
          shiftAudienceScope === 'role' && selectedRoleObj
            ? `Voluntários da frente: ${selectedRoleObj.title}`
            : 'Todos os voluntários inscritos';

        const created = await onDispatchAlert({
          category: 'work_shift',
          priority: shiftPriority,
          title: shiftTitle.trim() || `Nova Escala: ${roleLabel}`,
          message: shiftMessage.trim(),
          shiftRole: roleLabel,
          shiftDate,
          shiftTime: shiftTime.trim(),
          location: shiftLocation.trim(),
          spotsNeeded: Math.max(1, Number(spotsNeeded) || 1),
          targetAudienceLabel: targetLabel,
          targetVolunteersCount: matchingShiftVolunteers.length,
          createdBy: adminDisplayName,
        });

        setStatusFeedback({
          type: created.deliveredNative ? 'success' : 'warning',
          text: created.deliveredNative
            ? `Alerta de escala disparado via ${
                created.deliveryChannel === 'service-worker'
                  ? 'Service Worker do PWA'
                  : 'Notification API'
              } e publicado para os voluntários!`
            : `Alerta salvo e publicado no portal dos voluntários. Notificação nativa do navegador: ${
                created.deliveryNote || 'permissão pendente'
              }.`,
        });
      } else {
        const itemLabels = selectedProducts.map(
          (p) => `${p.name} (${p.receivedQty}/${p.targetQty} ${p.unit})`
        );

        const created = await onDispatchAlert({
          category: 'stock_emergency',
          priority: stockPriority,
          title: stockTitle.trim() || 'Emergência de Estoque · Projeto Sopão',
          message: stockMessage.trim(),
          affectedItems: itemLabels,
          location: INSTITUTION_PROFILE.address,
          targetAudienceLabel: 'Todos os voluntários e equipe de captação',
          targetVolunteersCount: volunteerApplications.length,
          createdBy: adminDisplayName,
        });

        setStatusFeedback({
          type: created.deliveredNative ? 'success' : 'warning',
          text: created.deliveredNative
            ? `Alerta de emergência de estoque disparado via ${
                created.deliveryChannel === 'service-worker'
                  ? 'Service Worker do PWA'
                  : 'Notification API'
              }!`
            : `Alerta de emergência registrado no portal e feed dos voluntários. Notificação nativa: ${
                created.deliveryNote || 'permissão pendente'
              }.`,
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (id: string) => {
    if (support.permission === 'default') {
      await requestPwaNotificationPermission();
      await refreshSupport();
    }
    const res = await onResendAlert(id);
    setStatusFeedback({
      type: res.delivered ? 'success' : 'warning',
      text: res.delivered
        ? `Notificação reenviada via ${
            res.channel === 'service-worker' ? 'Service Worker do PWA' : 'Notification API'
          }.`
        : res.reason || 'Não foi possível reenviar a notificação nativa.',
    });
  };

  const filteredAlerts = useMemo(() => {
    if (historyFilter === 'all') return alerts;
    return alerts.filter((a) => a.category === historyFilter);
  }, [alerts, historyFilter]);

  const permissionBadge = () => {
    if (support.permission === 'granted') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#14532D] border border-[#14532D]/25">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Permissão Concedida</span>
        </span>
      );
    }
    if (support.permission === 'denied') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-[#FEF2F2] px-2.5 py-1 text-xs font-semibold text-[#991B1B] border border-[#DC2626]/30">
          <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Bloqueada pelo Navegador</span>
        </span>
      );
    }
    if (support.permission === 'unsupported') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
          <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
          <span>API Não Suportada</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-300">
        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Aguardando Ativação</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Banner & Permission Controls */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#14532D]">
                <BellRing className="h-4 w-4" aria-hidden="true" />
                <span>API de Notificações Nativas do PWA</span>
              </span>
              {permissionBadge()}
            </div>
            <h2 className="mt-2 font-serif text-xl font-semibold text-slate-900">
              Central de Alertas PWA aos Voluntários
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Dispare notificações nativas pelo Service Worker do PWA para convocar voluntários em
              novas escalas de trabalho ou emitir alertas imediatos de emergência de estoque do
              sopão. Todos os alertas também são sincronizados em tempo real entre guias do portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {support.permission !== 'granted' && support.permission !== 'unsupported' && (
              <button
                type="button"
                onClick={() => void handleRequestPermission()}
                className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
              >
                <BellRing className="h-4 w-4" aria-hidden="true" />
                <span>Ativar Notificações PWA</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleTestNotification()}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md border border-[#14532D] bg-white px-4 py-2 text-xs font-semibold text-[#14532D] hover:bg-[#F0FDF4]"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Testar Notificação Nativa</span>
            </button>

            <button
              type="button"
              onClick={() => void refreshSupport()}
              aria-label="Atualizar status das notificações PWA"
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Verificar</span>
            </button>
          </div>
        </div>

        {/* Technical Capabilities Strip */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Motor Service Worker</p>
            <p className="mt-0.5 font-mono font-semibold text-slate-900">
              {support.serviceWorkerReady
                ? 'Ativo (showNotification PWA)'
                : support.serviceWorkerAvailable
                  ? 'Registrando (fallback Notification)'
                  : 'Notification API direta'}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Modo de Execução</p>
            <p className="mt-0.5 font-mono font-semibold text-slate-900">
              {support.isStandalone
                ? 'PWA Instalado (Standalone)'
                : support.isInIframe
                  ? 'Navegador (Preview Iframe)'
                  : 'Navegador Web'}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              Voluntários &amp; Itens Críticos
            </p>
            <p className="mt-0.5 font-mono font-semibold text-slate-900">
              {volunteerApplications.length} voluntário(s) · {criticalItems.length} item(ns) crítico(s)
            </p>
          </div>
        </div>

        {support.isInIframe && support.permission !== 'granted' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span>
                Alguns navegadores bloqueiam solicitações de permissão dentro de quadros (iframe).
                Para testar notificações nativas do sistema operacional, abra em nova guia.
              </span>
            </div>
            <a
              href={typeof window !== 'undefined' ? window.location.href : '/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded bg-amber-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800"
            >
              <span>Abrir em nova guia</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        )}

        {statusFeedback && (
          <div
            role={statusFeedback.type === 'error' ? 'alert' : 'status'}
            className={`mt-4 flex items-center gap-2 rounded-md border px-4 py-3 text-xs font-medium ${
              statusFeedback.type === 'success'
                ? 'border-[#14532D]/30 bg-[#F0FDF4] text-[#14532D]'
                : statusFeedback.type === 'warning'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-[#DC2626]/30 bg-[#FEF2F2] text-[#991B1B]'
            }`}
          >
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{statusFeedback.text}</span>
          </div>
        )}
      </div>

      {/* Automatic Stock Watcher Config */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9A3412]">
              Monitoramento Automático de Estoque Crítico
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Quando ativado, o sistema dispara automaticamente uma notificação PWA sempre que novos
              itens essenciais do sopão atingirem nível igual ou inferior ao limite mínimo definido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span>Limite crítico:</span>
              <select
                value={settings.criticalStockThresholdPct}
                onChange={(e) =>
                  onUpdateSettings({ criticalStockThresholdPct: Number(e.target.value) })
                }
                className="min-h-[36px] rounded border border-slate-300 bg-white px-2.5 font-mono text-xs"
              >
                <option value={10}>≤ 10% da meta</option>
                <option value={20}>≤ 20% da meta</option>
                <option value={25}>≤ 25% da meta</option>
                <option value={35}>≤ 35% da meta</option>
              </select>
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.autoStockEmergencyEnabled}
                onChange={(e) =>
                  onUpdateSettings({ autoStockEmergencyEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-[#14532D]"
              />
              <span>Alerta automático ativo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Alert Composer + Critical Items Quick Overview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <form
          onSubmit={(e) => void handleSubmitAlert(e)}
          className="rounded-lg border border-slate-200 bg-white p-6 xl:col-span-7 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-900">
                Emitir Novo Alerta PWA
              </h3>
              <p className="text-xs text-slate-500">
                Escolha o tipo de ocorrência e envie a notificação aos voluntários.
              </p>
            </div>

            <div className="inline-flex rounded-md bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setComposerMode('work_shift')}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composerMode === 'work_shift'
                    ? 'bg-[#14532D] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Nova Escala</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('stock_emergency')}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  composerMode === 'stock_emergency'
                    ? 'bg-[#9A3412] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Emergência de Estoque</span>
              </button>
            </div>
          </div>

          {composerMode === 'work_shift' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pwa-shift-role"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Frente de Trabalho
                  </label>
                  <select
                    id="pwa-shift-role"
                    value={selectedRoleId}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 bg-white px-3 text-xs text-slate-900"
                  >
                    {VOLUNTEER_ROLES.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                      </option>
                    ))}
                    <option value="custom">Escala Extraordinária / Mutirão Geral</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="pwa-shift-scope"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Público-alvo da Notificação
                  </label>
                  <select
                    id="pwa-shift-scope"
                    value={shiftAudienceScope}
                    onChange={(e) => setShiftAudienceScope(e.target.value as 'all' | 'role')}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 bg-white px-3 text-xs text-slate-900"
                  >
                    <option value="all">
                      Todos os voluntários inscritos ({volunteerApplications.length})
                    </option>
                    <option value="role" disabled={selectedRoleId === 'custom'}>
                      Apenas inscritos nesta frente (
                      {
                        volunteerApplications.filter((v) => v.roleId === selectedRoleId)
                          .length
                      }
                      )
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="pwa-shift-date"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Data da Escala
                  </label>
                  <input
                    id="pwa-shift-date"
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pwa-shift-time"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Horário / Turno
                  </label>
                  <input
                    id="pwa-shift-time"
                    type="text"
                    required
                    value={shiftTime}
                    onChange={(e) => setShiftTime(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pwa-shift-spots"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Voluntários necessários
                  </label>
                  <input
                    id="pwa-shift-spots"
                    type="number"
                    min={1}
                    value={spotsNeeded}
                    onChange={(e) => setSpotsNeeded(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="pwa-shift-location"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Local da Atividade
                  </label>
                  <input
                    id="pwa-shift-location"
                    type="text"
                    required
                    value={shiftLocation}
                    onChange={(e) => setShiftLocation(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pwa-shift-priority"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Prioridade
                  </label>
                  <select
                    id="pwa-shift-priority"
                    value={shiftPriority}
                    onChange={(e) => setShiftPriority(e.target.value as VolunteerAlertPriority)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 bg-white px-3 text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pwa-shift-title"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Título da Notificação *
                </label>
                <input
                  id="pwa-shift-title"
                  type="text"
                  required
                  value={shiftTitle}
                  onChange={(e) => setShiftTitle(e.target.value)}
                  className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="pwa-shift-message"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Mensagem aos Voluntários *
                </label>
                <textarea
                  id="pwa-shift-message"
                  rows={3}
                  required
                  value={shiftMessage}
                  onChange={(e) => setShiftMessage(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-3 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
              >
                <BellRing className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isSending
                    ? 'Disparando Notificação PWA...'
                    : `Disparar Notificação PWA de Escala (${matchingShiftVolunteers.length} inscrito(s))`}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Selecione os insumos em emergência de estoque ({selectedProductIds.length}{' '}
                    selecionado(s))
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProductIds(criticalItems.map((c) => c.product.id))
                    }
                    className="cursor-pointer text-[11px] font-semibold text-[#9A3412] hover:underline"
                  >
                    Marcar todos os críticos ({criticalItems.length})
                  </button>
                </div>

                <div className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-3">
                  {products
                    .filter((p) => p.active)
                    .map((prod) => {
                      const pct = Math.round(
                        (prod.receivedQty / Math.max(1, prod.targetQty)) * 100
                      );
                      const isCritical = pct <= settings.criticalStockThresholdPct;
                      const checked = selectedProductIds.includes(prod.id);

                      return (
                        <label
                          key={prod.id}
                          className="flex cursor-pointer items-center justify-between gap-3 py-2 text-xs"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProductSelection(prod.id)}
                              className="h-4 w-4 shrink-0 accent-[#9A3412]"
                            />
                            <span className="truncate font-medium text-slate-800">
                              {prod.name}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] tabular-nums text-slate-600">
                              {prod.receivedQty}/{prod.targetQty} {prod.unit}
                            </span>
                            {isCritical && (
                              <span className="rounded bg-[#FEF2F2] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#991B1B]">
                                {pct}%
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="pwa-stock-title"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Título do Alerta de Emergência *
                  </label>
                  <input
                    id="pwa-stock-title"
                    type="text"
                    required
                    value={stockTitle}
                    onChange={(e) => setStockTitle(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pwa-stock-priority"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nível de Urgência
                  </label>
                  <select
                    id="pwa-stock-priority"
                    value={stockPriority}
                    onChange={(e) => setStockPriority(e.target.value as VolunteerAlertPriority)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 bg-white px-3 text-xs"
                  >
                    <option value="critica">Emergência Crítica</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="pwa-stock-message"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Orientação aos Voluntários *
                </label>
                <textarea
                  id="pwa-stock-message"
                  rows={3}
                  required
                  value={stockMessage}
                  onChange={(e) => setStockMessage(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 p-3 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-60"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isSending
                    ? 'Disparando Alerta PWA...'
                    : 'Disparar Alerta PWA de Emergência de Estoque'}
                </span>
              </button>
            </div>
          )}
        </form>

        {/* Right Side: Critical Stock Radar & Target Volunteers */}
        <div className="space-y-5 xl:col-span-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#9A3412]" aria-hidden="true" />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Radar de Estoque Crítico ({criticalItems.length})
                </h3>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                Meta ≤ {settings.criticalStockThresholdPct}%
              </span>
            </div>

            {criticalItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Nenhum item ativo abaixo de {settings.criticalStockThresholdPct}% da meta no momento.
              </p>
            ) : (
              <ul className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                {criticalItems.map(({ product, percentOfTarget, severity }) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{product.name}</p>
                      <p className="text-[11px] text-slate-500">{product.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-semibold tabular-nums text-slate-900">
                        {product.receivedQty}/{product.targetQty} {product.unit}
                      </p>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          severity === 'critica'
                            ? 'bg-[#FEF2F2] text-[#991B1B]'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {severity === 'critica' ? 'Crítico' : 'Baixo'} · {percentOfTarget}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Voluntários Inscritos ({volunteerApplications.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Alcance do alerta</span>
            </div>

            {volunteerApplications.length === 0 ? (
              <p className="py-5 text-xs text-slate-500">
                Nenhuma inscrição registrada localmente ainda. Os alertas ficam disponíveis no
                Portal de Voluntariado e são notificados via PWA aos dispositivos inscritos.
              </p>
            ) : (
              <ul className="mt-3 max-h-48 divide-y divide-slate-100 overflow-y-auto text-xs">
                {volunteerApplications.slice(0, 8).map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{v.fullName}</p>
                      <p className="truncate text-[11px] text-slate-500">{v.roleTitle}</p>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 shrink-0">
                      {v.phone}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Dispatched Alerts History */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              Histórico de Notificações PWA Disparadas ({alerts.length})
            </h3>
            <p className="text-xs text-slate-500">
              Registro de convocações de escalas e emergências de estoque enviadas pelo painel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
              {(
                [
                  ['all', 'Todos'],
                  ['work_shift', 'Escalas'],
                  ['stock_emergency', 'Emergências de Estoque'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryFilter(key)}
                  className={`cursor-pointer rounded px-2.5 py-1 text-xs font-medium ${
                    historyFilter === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {alerts.length > 0 && (
              <button
                type="button"
                onClick={onClearAlerts}
                className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#DC2626]"
              >
                Limpar histórico
              </button>
            )}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Nenhum alerta PWA disparado para este filtro ainda. Utilize o formulário acima para
            notificar os voluntários.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredAlerts.map((alert) => {
              const isEmergency = alert.category === 'stock_emergency';
              return (
                <article
                  key={alert.id}
                  className={`rounded-lg border p-4 ${
                    isEmergency
                      ? 'border-[#9A3412]/30 bg-[#FFF7ED]/50'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span
                          className={`rounded px-2 py-0.5 font-semibold ${
                            isEmergency
                              ? 'bg-[#9A3412] text-white'
                              : 'bg-[#14532D] text-white'
                          }`}
                        >
                          {isEmergency ? 'Emergência de Estoque' : 'Escala de Trabalho'}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 font-mono font-medium ${
                            alert.deliveredNative
                              ? 'border-[#14532D]/30 bg-[#F0FDF4] text-[#14532D]'
                              : 'border-amber-300 bg-amber-50 text-amber-800'
                          }`}
                        >
                          {alert.deliveryChannel === 'service-worker'
                            ? 'PWA Service Worker'
                            : alert.deliveryChannel === 'window-notification'
                              ? 'Notification API'
                              : 'Feed Portal PWA'}
                        </span>
                        <span className="font-mono text-slate-500">{alert.createdAt}</span>
                        <span className="text-slate-500">· Por {alert.createdBy}</span>
                      </div>

                      <h4 className="font-serif text-base font-semibold text-slate-900">
                        {alert.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-700">{alert.message}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
                        {alert.shiftRole && (
                          <span>
                            <strong>Frente:</strong> {alert.shiftRole}
                          </span>
                        )}
                        {(alert.shiftDate || alert.shiftTime) && (
                          <span>
                            <strong>Agenda:</strong>{' '}
                            {[alert.shiftDate, alert.shiftTime].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {alert.location && (
                          <span>
                            <strong>Local:</strong> {alert.location}
                          </span>
                        )}
                        <span>
                          <strong>Público:</strong> {alert.targetAudienceLabel} (
                          {alert.targetVolunteersCount})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleResend(alert.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#14532D] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#14532D] hover:bg-[#F0FDF4]"
                      >
                        <BellRing className="h-3 w-3" aria-hidden="true" />
                        <span>Reenviar PWA</span>
                      </button>

                      <a
                        href={buildVolunteerAlertWhatsappUrl(alert)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-[#25D366] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1EBE57]"
                      >
                        <MessageCircle className="h-3 w-3" aria-hidden="true" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => onRemoveAlert(alert.id)}
                        aria-label={`Remover alerta ${alert.title}`}
                        className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-white hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
