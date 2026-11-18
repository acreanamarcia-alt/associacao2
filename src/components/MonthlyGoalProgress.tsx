import { ArrowUpRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAssistedPeopleStore } from '../data/assistedPeopleStore';
import { useDonationsStore } from '../data/donationsStore';
import { VOLUNTEER_ROLES } from '../data/institutionalData';
import { useVolunteersStore } from '../data/volunteersStore';
import { useLanguage } from '../i18n/LanguageContext';

export type ImpactMetricType = 'meals' | 'hours';

interface MonthlyGoalProgressProps {
  onOpenDonate: () => void;
  onJumpToVolunteer: () => void;
}

const MEALS_MONTHLY_TARGET = 1500;
const HOURS_MONTHLY_TARGET = 640;

function formatMonthLabel(date: Date, lang: 'pt' | 'en' | 'es'): string {
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  const raw = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatNumber(value: number, lang: 'pt' | 'en' | 'es'): string {
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  return Math.round(value).toLocaleString(locale);
}

export function MonthlyGoalProgress({
  onOpenDonate,
  onJumpToVolunteer,
}: MonthlyGoalProgressProps) {
  const { lang, t } = useLanguage();
  const { donations, pickups, monthlyDonors } = useDonationsStore();
  const { applications } = useVolunteersStore();
  const { assistedPeople } = useAssistedPeopleStore();

  const [activeMetric, setActiveMetric] = useState<ImpactMetricType>('meals');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();

    let calendarMealsBaseline = 0;
    let calendarHoursBaseline = 0;

    for (let d = 1; d <= dayOfMonth; d += 1) {
      const dow = new Date(year, month, d).getDay();
      if (dow === 1 || dow === 3 || dow === 5) {
        // Panificação solidária (segunda, quarta, sexta)
        calendarMealsBaseline += 50;
        calendarHoursBaseline += 24;
      } else if (dow === 2 || dow === 4) {
        // Preparo do sopão comunitário (terça e quinta)
        calendarMealsBaseline += 120;
        calendarHoursBaseline += 34;
      } else if (dow === 6) {
        // Distribuição urbana e rural aos sábados
        calendarMealsBaseline += 90;
        calendarHoursBaseline += 26;
      }
    }

    const receivedDonationsImpact = donations.reduce((sum, item) => {
      if (item.status !== 'Recebida') return sum;
      if (item.amountBRL && item.amountBRL > 0) {
        return sum + Math.max(5, Math.round(item.amountBRL / 10));
      }
      return sum + 20;
    }, 0);

    const collectedPickupsImpact =
      pickups.filter((p) => p.status === 'Coletada').length * 40;

    const activeDonorsImpact =
      monthlyDonors.filter((m) => m.status === 'Em dia').length * 12;

    const assistedImpact =
      assistedPeople.filter((p) => p.status === 'Ativa').length * 4;

    const mealsServed =
      calendarMealsBaseline +
      receivedDonationsImpact +
      collectedPickupsImpact +
      activeDonorsImpact +
      assistedImpact;

    const activeCoreVolunteers = VOLUNTEER_ROLES.reduce(
      (sum, role) => sum + role.spotsFilled,
      0
    );
    const shiftEfficiencyFactor = Math.max(0.85, activeCoreVolunteers / 21);
    const portalVolunteerHours = applications.length * 14;

    const volunteerHoursReached =
      Math.round(calendarHoursBaseline * shiftEfficiencyFactor) + portalVolunteerHours;

    return {
      monthLabel: formatMonthLabel(now, lang),
      meals: {
        current: mealsServed,
        target: MEALS_MONTHLY_TARGET,
        percent: Math.min(100, Math.round((mealsServed / MEALS_MONTHLY_TARGET) * 100)),
        rawRatio: Math.min(1, mealsServed / MEALS_MONTHLY_TARGET),
        remaining: Math.max(0, MEALS_MONTHLY_TARGET - mealsServed),
      },
      hours: {
        current: volunteerHoursReached,
        target: HOURS_MONTHLY_TARGET,
        percent: Math.min(
          100,
          Math.round((volunteerHoursReached / HOURS_MONTHLY_TARGET) * 100)
        ),
        rawRatio: Math.min(1, volunteerHoursReached / HOURS_MONTHLY_TARGET),
        remaining: Math.max(0, HOURS_MONTHLY_TARGET - volunteerHoursReached),
      },
    };
  }, [lang, donations, pickups, monthlyDonors, assistedPeople, applications]);

  const currentData = activeMetric === 'meals' ? metrics.meals : metrics.hours;
  const companionData = activeMetric === 'meals' ? metrics.hours : metrics.meals;

  const currentUnit =
    activeMetric === 'meals'
      ? t.hero.monthlyGoal.mealsUnit
      : t.hero.monthlyGoal.hoursUnit;
  const companionUnit =
    activeMetric === 'meals'
      ? t.hero.monthlyGoal.hoursUnit
      : t.hero.monthlyGoal.mealsUnit;
  const companionTitle =
    activeMetric === 'meals'
      ? t.hero.monthlyGoal.tabHours
      : t.hero.monthlyGoal.tabMeals;

  const breakdownText =
    activeMetric === 'meals'
      ? t.hero.monthlyGoal.breakdownMeals
      : t.hero.monthlyGoal.breakdownHours;

  const ctaText =
    activeMetric === 'meals'
      ? t.hero.monthlyGoal.ctaMeals
      : t.hero.monthlyGoal.ctaHours;

  const scaleRatio = mounted ? currentData.rawRatio : 0;
  const isGoalReached = currentData.remaining === 0;

  return (
    <div className="mt-8 rounded-lg border border-[#D6CEBE] bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#EFEBE3] pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
            <span className="font-semibold uppercase tracking-widest text-[#14532D]">
              {t.hero.monthlyGoal.kicker}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#1C1917]">{metrics.monthLabel}</span>
          </div>
          <p className="mt-1 text-xs text-[#57534E]">{breakdownText}</p>
        </div>

        <div
          role="tablist"
          aria-label={t.hero.monthlyGoal.kicker}
          className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#F4F0E8] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMetric === 'meals'}
            onClick={() => setActiveMetric('meals')}
            className={`min-h-[36px] cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeMetric === 'meals'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {t.hero.monthlyGoal.tabMeals}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMetric === 'hours'}
            onClick={() => setActiveMetric('hours')}
            className={`min-h-[36px] cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeMetric === 'hours'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            {t.hero.monthlyGoal.tabHours}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#1C1917] sm:text-3xl">
              {formatNumber(currentData.current, lang)}
            </span>
            <span className="font-mono text-sm tabular-nums text-[#57534E]">
              / {formatNumber(currentData.target, lang)} {currentUnit}
            </span>
          </div>

          <div className="flex items-baseline gap-2 text-right">
            <span className="font-mono text-xl font-bold tabular-nums text-[#14532D] sm:text-2xl">
              {currentData.percent}%
            </span>
            <span className="text-xs font-medium text-[#57534E]">
              {t.hero.monthlyGoal.reachedSuffix}
            </span>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={currentData.target}
          aria-valuenow={currentData.current}
          aria-label={`${
            activeMetric === 'meals'
              ? t.hero.monthlyGoal.tabMeals
              : t.hero.monthlyGoal.tabHours
          }: ${currentData.percent}%`}
          className="relative mt-3 h-3.5 w-full overflow-hidden rounded-full bg-[#EFEBE3]"
        >
          <div
            className={`h-full w-full origin-left rounded-full transition-transform duration-500 ease-out ${
              activeMetric === 'meals' ? 'bg-[#14532D]' : 'bg-[#9A3412]'
            }`}
            style={{ transform: `scaleX(${scaleRatio})` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-white/55"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/55"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-white/55"
          />
        </div>

        <div className="mt-3.5 flex flex-col justify-between gap-2 text-xs text-[#57534E] sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-[#1C1917]">
              {isGoalReached
                ? t.hero.monthlyGoal.completedLabel
                : `${t.hero.monthlyGoal.remainingPrefix} ${formatNumber(
                    currentData.remaining,
                    lang
                  )} ${currentUnit}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {companionTitle}:{' '}
              <strong className="font-mono font-medium text-[#1C1917]">
                {formatNumber(companionData.current, lang)} /{' '}
                {formatNumber(companionData.target, lang)} {companionUnit}
              </strong>{' '}
              ({companionData.percent}%)
            </span>
          </div>

          <button
            type="button"
            onClick={activeMetric === 'meals' ? onOpenDonate : onJumpToVolunteer}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 font-semibold text-[#14532D] transition-colors hover:text-[#0F3F22] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
