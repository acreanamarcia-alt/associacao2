import { TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AccountingEntry,
  DonationRecord,
  MonthlyDonorRecord,
} from '../data/donationsStore';

interface MonthlyDonationsChartProps {
  donations: DonationRecord[];
  accountingEntries: AccountingEntry[];
  monthlyDonors: MonthlyDonorRecord[];
  onNavigateTab?: (tab: 'receipts' | 'monthly-donors' | 'accounting') => void;
}

interface MonthlyChartPoint {
  monthKey: string;
  monthLabel: string;
  monthFullName: string;
  totalRecebidoBRL: number;
  doacoesMensaisBRL: number;
  emConferenciaBRL: number;
  quantidadeDoacoes: number;
}

const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const MONTH_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAxisBRL(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export function MonthlyDonationsChart({
  donations,
  accountingEntries,
  monthlyDonors,
  onNavigateTab,
}: MonthlyDonationsChartProps) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    for (const d of donations) {
      const y = Number(d.createdAt.slice(0, 4));
      if (Number.isFinite(y) && y >= 2019) years.add(y);
    }
    for (const a of accountingEntries) {
      const y = Number(a.date.slice(0, 4));
      if (Number.isFinite(y) && y >= 2019) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [donations, accountingEntries, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const activeYear = availableYears.includes(selectedYear)
    ? selectedYear
    : availableYears[0] ?? currentYear;

  const { chartData, yearTotalBRL, yearMonthlyBRL, bestMonth, activeMonthsCount, growthPct } =
    useMemo(() => {
      const donationRefs = new Set(donations.map((d) => d.referenceCode));

      const points: MonthlyChartPoint[] = MONTH_SHORT.map((label, idx) => {
        const monthStr = String(idx + 1).padStart(2, '0');
        const monthKey = `${activeYear}-${monthStr}`;

        let totalRecebidoBRL = 0;
        let doacoesMensaisBRL = 0;
        let emConferenciaBRL = 0;
        let quantidadeDoacoes = 0;

        for (const d of donations) {
          if (!d.createdAt.startsWith(monthKey)) continue;
          if (d.status === 'Cancelada') continue;
          quantidadeDoacoes += 1;

          const val = typeof d.amountBRL === 'number' ? d.amountBRL : 0;
          if (d.status === 'Recebida') {
            totalRecebidoBRL += val;
            if (d.type === 'PIX Mensal') {
              doacoesMensaisBRL += val;
            }
          } else if (d.status === 'Pendente' || d.status === 'Em Conferência') {
            emConferenciaBRL += val;
          }
        }

        // Inclui lançamentos manuais de entrada no livro-razão sem duplicar doações já vinculadas
        for (const acc of accountingEntries) {
          if (acc.kind !== 'Entrada') continue;
          if (!acc.date.startsWith(monthKey)) continue;
          if (acc.referenceCode && donationRefs.has(acc.referenceCode)) continue;

          totalRecebidoBRL += acc.amountBRL;
          quantidadeDoacoes += 1;
          if (acc.category.toLowerCase().includes('mensal')) {
            doacoesMensaisBRL += acc.amountBRL;
          }
        }

        return {
          monthKey,
          monthLabel: label,
          monthFullName: `${MONTH_FULL[idx]} / ${activeYear}`,
          totalRecebidoBRL: Number(totalRecebidoBRL.toFixed(2)),
          doacoesMensaisBRL: Number(doacoesMensaisBRL.toFixed(2)),
          emConferenciaBRL: Number(emConferenciaBRL.toFixed(2)),
          quantidadeDoacoes,
        };
      });

      const totalAno = points.reduce((acc, p) => acc + p.totalRecebidoBRL, 0);
      const totalMensalAno = points.reduce((acc, p) => acc + p.doacoesMensaisBRL, 0);
      const nonZeroMonths = points.filter((p) => p.totalRecebidoBRL > 0);
      const peak = points.reduce<MonthlyChartPoint | null>(
        (best, p) =>
          p.totalRecebidoBRL > (best?.totalRecebidoBRL ?? 0) ? p : best,
        null
      );

      let pctChange: number | null = null;
      if (nonZeroMonths.length >= 2) {
        const last = nonZeroMonths[nonZeroMonths.length - 1];
        const prev = nonZeroMonths[nonZeroMonths.length - 2];
        if (prev.totalRecebidoBRL > 0) {
          pctChange =
            ((last.totalRecebidoBRL - prev.totalRecebidoBRL) / prev.totalRecebidoBRL) *
            100;
        }
      }

      return {
        chartData: points,
        yearTotalBRL: totalAno,
        yearMonthlyBRL: totalMensalAno,
        bestMonth: peak,
        activeMonthsCount: nonZeroMonths.length,
        growthPct: pctChange,
      };
    }, [donations, accountingEntries, activeYear]);

  const activeMonthlyProjection = useMemo(
    () =>
      monthlyDonors
        .filter((m) => m.status !== 'Pausado')
        .reduce((acc, m) => acc + m.monthlyAmountBRL, 0),
    [monthlyDonors]
  );

  const avgMonthlyBRL =
    activeMonthsCount > 0 ? yearTotalBRL / activeMonthsCount : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 xl:col-span-12">
      {/* Cabeçalho e filtro de ano */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
              Análise de Crescimento · Evolução Anual ({activeYear})
            </p>
          </div>
          <h2 className="mt-1 font-serif text-lg font-semibold text-slate-900">
            Evolução das Doações Mensais ao Longo do Ano
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Acompanhamento mês a mês das receitas confirmadas, recorrência PIX mensal e valores
            em conferência.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="chart-year-select"
            className="text-xs font-medium text-slate-600"
          >
            Ano de referência:
          </label>
          <select
            id="chart-year-select"
            value={activeYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="min-h-[36px] rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 tabular-nums focus:border-[#14532D] focus:outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha de métricas consolidadas do gráfico */}
      <div className="mt-5 grid grid-cols-1 gap-4 border-b border-slate-100 pb-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Total Recebido em {activeYear}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#14532D]">
            {formatBRL(yearTotalBRL)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
            {activeMonthsCount} {activeMonthsCount === 1 ? 'mês com entrada' : 'meses com entradas'}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            PIX Mensal Liquidado ({activeYear})
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#D97706]">
            {formatBRL(yearMonthlyBRL)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
            Projeção ativa atual: {formatBRL(activeMonthlyProjection)}/mês
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Média por Mês Ativo
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">
            {formatBRL(avgMonthlyBRL)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {bestMonth && bestMonth.totalRecebidoBRL > 0
              ? `Pico em ${bestMonth.monthLabel}: ${formatBRL(bestMonth.totalRecebidoBRL)}`
              : 'Sem pico registrado no ano'}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Variação Recente
          </p>
          <p
            className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
              growthPct === null
                ? 'text-slate-600'
                : growthPct >= 0
                  ? 'text-[#16A34A]'
                  : 'text-[#DC2626]'
            }`}
          >
            {growthPct === null
              ? '—'
              : `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1).replace('.', ',')}%`}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Comparativo entre os 2 últimos meses com movimento
          </p>
        </div>
      </div>

      {/* Área do Gráfico Recharts */}
      <div className="mt-6">
        {yearTotalBRL === 0 &&
          chartData.every((p) => p.emConferenciaBRL === 0) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span>
                Os valores financeiros de {activeYear} estão zerados (R$ 0,00). A curva será
                traçada automaticamente conforme doações ou lançamentos forem confirmados.
              </span>
              {onNavigateTab && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('receipts')}
                    className="cursor-pointer rounded bg-[#14532D] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0F3F22]"
                  >
                    Registrar Doação
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('monthly-donors')}
                    className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Doadores Mensais
                  </button>
                </div>
              )}
            </div>
          )}

        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 18, left: 6, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatAxisBRL}
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0]?.payload as MonthlyChartPoint | undefined;
                  if (!point) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs shadow-md">
                      <p className="font-serif text-sm font-semibold text-slate-900">
                        {point.monthFullName}
                      </p>
                      <div className="mt-2 space-y-1 font-mono tabular-nums">
                        <p className="flex items-center justify-between gap-4 text-[#14532D]">
                          <span>Total Recebido:</span>
                          <span className="font-semibold">
                            {formatBRL(point.totalRecebidoBRL)}
                          </span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-[#D97706]">
                          <span>PIX Mensal:</span>
                          <span className="font-semibold">
                            {formatBRL(point.doacoesMensaisBRL)}
                          </span>
                        </p>
                        <p className="flex items-center justify-between gap-4 text-[#0284C7]">
                          <span>Em Conferência:</span>
                          <span className="font-semibold">
                            {formatBRL(point.emConferenciaBRL)}
                          </span>
                        </p>
                        <p className="border-t border-slate-100 pt-1 text-[11px] text-slate-500">
                          Registros no mês: {point.quantidadeDoacoes}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Line
                type="monotone"
                dataKey="totalRecebidoBRL"
                name="Total Recebido (R$)"
                stroke="#14532D"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#14532D', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#14532D', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="doacoesMensaisBRL"
                name="Doações Mensais PIX (R$)"
                stroke="#D97706"
                strokeWidth={2}
                dot={{ r: 3, fill: '#D97706', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="emConferenciaBRL"
                name="Em Conferência / Pendente (R$)"
                stroke="#0284C7"
                strokeWidth={1.75}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: '#0284C7', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
