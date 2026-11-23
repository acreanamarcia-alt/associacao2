import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatCpf } from '../data/assistedPeopleStore';
import {
  INSTITUTION_PROFILE,
  VOLUNTEER_ROLES,
  VolunteerRole,
} from '../data/institutionalData';
import { useVolunteerAlertsStore } from '../data/volunteerAlertsStore';
import { useVolunteersStore } from '../data/volunteersStore';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getPwaNotificationSupport,
  requestPwaNotificationPermission,
} from '../utils/pwaNotifications';
import { InstitutionalFooterStrip } from './InstitutionalFooterStrip';

const CATEGORIES: Array<'Todas' | VolunteerRole['category']> = [
  'Todas',
  'Cozinha & Panificação',
  'Triagem & Kits',
  'Logística & Entrega',
  'Governança & Projetos',
];

const SHIFTS: Array<'Todos' | VolunteerRole['shift']> = [
  'Todos',
  'Manhã',
  'Tarde',
  'Fins de Semana',
];

export function VolunteerHub() {
  const { t, pick } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | VolunteerRole['category']>(
    'Todas'
  );
  const [selectedShift, setSelectedShift] = useState<'Todos' | VolunteerRole['shift']>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState<VolunteerRole | null>(null);
  const [showMyApplications, setShowMyApplications] = useState(false);

  const { applications, addApplication, removeApplication } = useVolunteersStore();
  const {
    alerts: pwaAlerts,
    settings: pwaSettings,
    unreadCount: unreadAlertsCount,
    updateSettings: updatePwaSettings,
    markAllRead: markAllAlertsRead,
  } = useVolunteerAlertsStore();
  const [pwaPermission, setPwaPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  useEffect(() => {
    void getPwaNotificationSupport().then((info) => {
      setPwaPermission(info.permission);
    });
  }, []);

  const handleEnableVolunteerAlerts = async () => {
    const result = await requestPwaNotificationPermission();
    setPwaPermission(result);
    if (result === 'granted') {
      updatePwaSettings({ volunteerOptInEnabled: true });
    }
  };

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRole && !showMyApplications) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveRole(null);
        setShowMyApplications(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeRole, showMyApplications]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VOLUNTEER_ROLES.filter((role) => {
      const matchesCat = selectedCategory === 'Todas' || role.category === selectedCategory;
      const matchesShift = selectedShift === 'Todos' || role.shift === selectedShift;
      const matchesQuery =
        !q ||
        role.title.toLowerCase().includes(q) ||
        role.summary.toLowerCase().includes(q) ||
        role.location.toLowerCase().includes(q);
      return matchesCat && matchesShift && matchesQuery;
    });
  }, [selectedCategory, selectedShift, searchQuery]);

  const totalOpenSpots = useMemo(() => {
    return VOLUNTEER_ROLES.reduce((sum, role) => {
      const userApplied = applications.some((app) => app.roleId === role.id) ? 1 : 0;
      return sum + Math.max(0, role.spotsTotal - role.spotsFilled - userApplied);
    }, 0);
  }, [applications]);

  const openRoleDrawer = (role: VolunteerRole) => {
    setActiveRole(role);
    setAvailability(role.schedule);
    setFormError('');
    setJustSubmittedId(null);
  };

  const handleSubmitApplication = (e: FormEvent) => {
    e.preventDefault();
    if (!activeRole) return;

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 3) {
      setFormError('Informe seu nome completo para registrar a candidatura.');
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 8) {
      setFormError('Informe um telefone ou WhatsApp válido com DDD (ex.: 68 99999-9999).');
      return;
    }

    const existing = applications.find((a) => a.roleId === activeRole.id);
    if (existing) {
      setFormError('Você já possui uma inscrição ativa nesta vaga.');
      return;
    }

    const newApp = addApplication({
      roleId: activeRole.id,
      roleTitle: activeRole.title,
      fullName: trimmedName,
      cpf: cpf.trim() || undefined,
      phone: trimmedPhone,
      availability: availability.trim() || activeRole.schedule,
      notes: notes.trim(),
    });

    setJustSubmittedId(newApp.id);
    setFormError('');
    setFullName('');
    setCpf('');
    setPhone('');
    setNotes('');
  };

  const handleCancelApplication = (id: string) => {
    removeApplication(id);
  };

  const buildWhatsappHref = (roleTitle: string, applicantName?: string) => {
    const text = applicantName
      ? `Olá, Projeto Sopão! Meu nome é ${applicantName} e acabei de me inscrever na vaga de voluntariado "${roleTitle}" da Associação Recanto Social Bom Pastor.`
      : `Olá, Projeto Sopão! Gostaria de me candidatar à vaga de voluntariado "${roleTitle}" na sede do Bairro Olaria.`;
    return `https://wa.me/${INSTITUTION_PROFILE.whatsappDigits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="vagas" className="border-b border-[#E2DDD3] bg-[#FBF9F5]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="flex flex-col justify-between gap-6 border-b border-[#E2DDD3] pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
              {t.volunteer.kicker}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl">
              {t.volunteer.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#44403C]">
              {t.volunteer.subtitle}
            </p>
            <p className="mt-3 inline-block rounded border border-[#DC2626]/30 bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#DC2626]">
              {t.volunteer.unpaidNotice}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-widest text-[#78716C]">{t.volunteer.openSpotsLabel}</p>
              <p className="font-mono text-2xl font-medium tabular-nums text-[#1C1917]">
                {totalOpenSpots} {t.volunteer.positionsUnit}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleEnableVolunteerAlerts()}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                pwaPermission === 'granted' && pwaSettings.volunteerOptInEnabled
                  ? 'border-[#14532D]/30 bg-[#F0FDF4] text-[#14532D]'
                  : 'border-[#D6CEBE] bg-white text-[#1C1917] hover:border-[#14532D] hover:text-[#14532D]'
              }`}
            >
              <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {pwaPermission === 'granted' && pwaSettings.volunteerOptInEnabled
                  ? t.volunteer.pwaAlertsActive
                  : t.volunteer.pwaAlertsEnable}
              </span>
            </button>

            {applications.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMyApplications(true)}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-[#14532D] bg-white px-4 py-2 text-xs font-semibold text-[#14532D] transition-colors hover:bg-[#14532D] hover:text-white whitespace-nowrap shrink-0"
              >
                <span>{t.volunteer.myApplicationsBtn}</span>
                <span className="font-mono tabular-nums">({applications.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Coordination PWA Alerts Feed (only rendered when admin dispatched alerts) */}
        {pwaAlerts.length > 0 && unreadAlertsCount > 0 && (
          <div className="mt-6 rounded-lg border border-[#D6CEBE] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEBE3] pb-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#14532D]">
                  {t.volunteer.pwaAlertsFeedTitle} ({unreadAlertsCount})
                </p>
              </div>
              <button
                type="button"
                onClick={markAllAlertsRead}
                className="cursor-pointer text-xs font-medium text-[#57534E] hover:text-[#1C1917] hover:underline"
              >
                {t.volunteer.pwaAlertsMarkRead}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {pwaAlerts
                .filter((a) => !a.readByVolunteer)
                .slice(0, 4)
                .map((alert) => {
                  const isEmergency = alert.category === 'stock_emergency';
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-md border p-3.5 text-xs ${
                        isEmergency
                          ? 'border-[#9A3412]/30 bg-[#FFF7ED]'
                          : 'border-[#14532D]/20 bg-[#F0FDF4]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isEmergency ? 'text-[#9A3412]' : 'text-[#14532D]'
                          }`}
                        >
                          {isEmergency ? (
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{alert.title}</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#78716C]">
                          {alert.createdAt}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-[#292524]">{alert.message}</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filtrar vagas por área"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EFEBE3] p-1"
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#1C1917] shadow-sm'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {category === 'Todas' ? t.volunteer.allCategories : category}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="shift-filter">
              {t.volunteer.allShifts}
            </label>
            <select
              id="shift-filter"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as 'Todos' | VolunteerRole['shift'])}
              className="min-h-[42px] cursor-pointer rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
            >
              {SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift === 'Todos' ? t.volunteer.allShifts : `${t.volunteer.shiftPrefix}: ${shift}`}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.volunteer.searchPlaceholder}
                aria-label={t.volunteer.searchPlaceholder}
                className="min-h-[42px] w-full rounded-md border border-[#D6CEBE] bg-white py-2 pr-3 pl-9 text-xs text-[#1C1917] placeholder:text-[#78716C]"
              />
            </div>
          </div>
        </div>

        {/* Volunteer Roles List */}
        {filteredRoles.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#E2DDD3] bg-white p-10 text-center">
            <p className="font-serif text-xl font-medium text-[#1C1917]">
              {t.volunteer.emptyTitle}
            </p>
            <p className="mt-2 text-sm text-[#57534E]">
              {t.volunteer.emptyDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todas');
                setSelectedShift('Todos');
                setSearchQuery('');
              }}
              className="mt-5 inline-flex min-h-[40px] cursor-pointer items-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
            >
              {t.volunteer.clearFilters}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredRoles.map((role) => {
              const userApplication = applications.find((a) => a.roleId === role.id);
              const remaining = Math.max(
                0,
                role.spotsTotal - role.spotsFilled - (userApplication ? 1 : 0)
              );

              return (
                <article
                  key={role.id}
                  className="flex flex-col justify-between rounded-lg border border-[#E2DDD3] bg-white p-6 transition-colors duration-150 hover:border-[#C5BBA8]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                      <span className="font-medium text-[#14532D]">{role.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{role.modality}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.volunteer.shiftPrefix}: {role.shift}</span>
                    </div>

                    <h3 className="mt-2.5 font-serif text-xl font-semibold text-[#1C1917]">
                      {role.title}
                    </h3>

                    <p className="mt-2.5 text-sm leading-relaxed text-[#44403C]">{role.summary}</p>

                    <dl className="mt-5 space-y-1.5 border-t border-[#EFEBE3] pt-4 text-xs text-[#57534E]">
                      <div className="flex justify-between gap-4">
                        <dt className="text-[#78716C]">{t.volunteer.scheduleLabel}</dt>
                        <dd className="text-right font-medium text-[#1C1917]">{role.schedule}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-[#78716C]">{t.volunteer.locationLabel}</dt>
                        <dd className="text-right text-[#1C1917]">{role.location}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-[#78716C]">{t.volunteer.openSpotsLabel}</dt>
                        <dd className="text-right font-mono tabular-nums font-medium text-[#1C1917]">
                          {remaining} {t.volunteer.ofSpots} {role.spotsTotal}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#EFEBE3] pt-4">
                    {userApplication ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D]">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t.volunteer.alreadyApplied}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-[#78716C]">
                        {pick({
                          pt: 'Início imediato mediante contato',
                          en: 'Immediate start upon contact',
                          es: 'Inicio inmediato tras contacto',
                        })}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => openRoleDrawer(role)}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
                    >
                      <span>{userApplication ? t.volunteer.viewDetails : t.volunteer.applyBtn}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Volunteer Role Detail & Application Drawer */}
      {activeRole && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-drawer-title"
          className="fixed inset-0 z-50 flex justify-end bg-black/55"
          onClick={() => setActiveRole(null)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[#FBF9F5] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E2DDD3] bg-white px-6 py-4">
              <div>
                <p className="text-xs font-medium text-[#14532D]">
                  {activeRole.category} · {activeRole.modality}
                </p>
                <h3 id="role-drawer-title" className="font-serif text-xl font-semibold text-[#1C1917]">
                  {activeRole.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRole(null)}
                aria-label="Fechar detalhes da vaga"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#E2DDD3] text-[#1C1917] hover:bg-[#F5F1E8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <p className="text-sm leading-relaxed text-[#44403C]">{activeRole.summary}</p>

              <dl className="divide-y divide-[#E2DDD3] rounded-lg border border-[#E2DDD3] bg-white px-4 text-xs">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-[#78716C]">{t.volunteer.scheduleLabel}</dt>
                  <dd className="text-right font-medium text-[#1C1917]">{activeRole.schedule}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-[#78716C]">{t.volunteer.locationLabel}</dt>
                  <dd className="text-right text-[#1C1917]">{activeRole.location}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-[#78716C]">{t.volunteer.impactTitle}</dt>
                  <dd className="text-right text-[#44403C]">{activeRole.impactNote}</dd>
                </div>
              </dl>

              <div>
                <h4 className="font-serif text-base font-semibold text-[#1C1917]">
                  {t.volunteer.activitiesTitle}
                </h4>
                <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm text-[#44403C]">
                  {activeRole.activities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-serif text-base font-semibold text-[#1C1917]">
                  {t.volunteer.requirementsTitle}
                </h4>
                <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm text-[#44403C]">
                  {activeRole.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#E2DDD3] pt-6">
                {justSubmittedId || applications.some((a) => a.roleId === activeRole.id) ? (
                  <div className="rounded-lg border border-[#14532D]/30 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#14532D]"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-serif text-lg font-semibold text-[#1C1917]">
                          {t.volunteer.submittedSuccess}
                        </p>
                        <p className="mt-1 text-sm text-[#44403C]">
                          {pick({
                            pt: 'Seus dados ficaram salvos neste navegador. Para confirmar sua escala com a coordenação do Bairro Olaria, envie sua apresentação diretamente pelo WhatsApp institucional.',
                            en: 'Your details are saved in this browser. To confirm your shift with our Bairro Olaria coordinators, message us directly on the institutional WhatsApp.',
                            es: 'Sus datos quedaron guardados en este navegador. Para confirmar su turno con la coordinación del Bairro Olaria, envíe su presentación por nuestro WhatsApp institucional.',
                          })}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <a
                            href={buildWhatsappHref(
                              activeRole.title,
                              applications.find((a) => a.roleId === activeRole.id)?.fullName
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[42px] items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                          >
                            <span>{t.volunteer.whatsappDirect} ({INSTITUTION_PROFILE.phoneDisplay})</span>
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const current = applications.find((a) => a.roleId === activeRole.id);
                              if (current) handleCancelApplication(current.id);
                              setJustSubmittedId(null);
                            }}
                            className="inline-flex min-h-[42px] cursor-pointer items-center rounded-md border border-[#D6CEBE] px-4 py-2 text-xs font-medium text-[#57534E] hover:bg-[#F5F1E8]"
                          >
                            {t.volunteer.removeApplication}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitApplication} className="space-y-4">
                    <div>
                      <h4 className="font-serif text-lg font-semibold text-[#1C1917]">
                        {t.volunteer.formTitle}
                      </h4>
                      <p className="mt-2 rounded border border-[#DC2626]/35 bg-[#FEF2F2] px-3 py-2 text-[11px] font-semibold leading-snug text-[#DC2626]">
                        {t.volunteer.unpaidNotice}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="volunteer-name"
                        className="block text-xs font-medium text-[#44403C]"
                      >
                        {t.volunteer.fullNameLabel}
                      </label>
                      <input
                        id="volunteer-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex.: Maria Aparecida da Silva"
                        className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="volunteer-cpf"
                        className="block text-xs font-medium text-[#44403C]"
                      >
                        CPF
                      </label>
                      <input
                        id="volunteer-cpf"
                        type="text"
                        inputMode="numeric"
                        maxLength={14}
                        value={cpf}
                        onChange={(e) => setCpf(formatCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 font-mono text-sm text-[#1C1917]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="volunteer-phone"
                        className="block text-xs font-medium text-[#44403C]"
                      >
                        {t.volunteer.phoneLabel}
                      </label>
                      <input
                        id="volunteer-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(68) 99900-0000"
                        className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="volunteer-availability"
                        className="block text-xs font-medium text-[#44403C]"
                      >
                        {t.volunteer.availabilityLabel}
                      </label>
                      <input
                        id="volunteer-availability"
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="volunteer-notes"
                        className="block text-xs font-medium text-[#44403C]"
                      >
                        {t.volunteer.notesLabel}
                      </label>
                      <textarea
                        id="volunteer-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="..."
                        className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917]"
                      />
                    </div>

                    {formError && (
                      <p role="alert" className="text-xs font-medium text-[#9A3412]">
                        {formError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F3F22]"
                      >
                        {t.volunteer.submitApplication}
                      </button>

                      <a
                        href={buildWhatsappHref(activeRole.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-4 py-2.5 text-xs font-medium text-[#1C1917] hover:bg-[#F5F1E8]"
                      >
                        <span>{t.volunteer.whatsappDirect}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-auto">
              <InstitutionalFooterStrip variant="compact" />
            </div>
          </div>
        </div>
      )}

      {/* My Applications Drawer */}
      {showMyApplications && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="my-apps-title"
          className="fixed inset-0 z-50 flex justify-end bg-black/55"
          onClick={() => setShowMyApplications(false)}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[#FBF9F5] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2DDD3] bg-white px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#78716C]">
                  {t.volunteer.kicker}
                </p>
                <h3 id="my-apps-title" className="font-serif text-xl font-semibold text-[#1C1917]">
                  {t.volunteer.myApplicationsTitle} ({applications.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMyApplications(false)}
                aria-label={t.volunteer.close}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#E2DDD3] text-[#1C1917]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-[#E2DDD3] bg-white p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-base font-semibold text-[#1C1917]">
                        {app.roleTitle}
                      </p>
                      <p className="text-xs text-[#57534E]">
                        {app.createdAt} · {app.availability}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelApplication(app.id)}
                      aria-label={t.volunteer.removeApplication}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#E2DDD3] text-[#78716C] hover:text-[#9A3412]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#44403C]">
                    <span className="font-medium text-[#1C1917]">{app.fullName}</span> ({app.phone})
                  </p>

                  <a
                    href={buildWhatsappHref(app.roleTitle, app.fullName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline underline-offset-4"
                  >
                    <span>{t.volunteer.whatsappDirect}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <InstitutionalFooterStrip variant="compact" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
