import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileSearch,
  FileText,
  Landmark,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  Trash2,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { INSTITUTION_PROFILE } from '../data/institutionalData';
import { SimpleMarkdown } from './SimpleMarkdown';

export type EditaisMode =
  | 'tjac_auto'
  | 'cnae_completo'
  | 'fluxo_continuo'
  | 'leis_emendas';

interface WebSourceResult {
  title: string;
  uri: string;
}

interface EditaisReport {
  mode: EditaisMode;
  text: string;
  sources: WebSourceResult[];
  searchQueries: string[];
  updatedAt: string;
  customFilter?: string;
}

interface ParsedEditalItem {
  id: string;
  title: string;
  instituicao: string;
  tipoApoio: string;
  valor: string;
  prazo: string;
  abrangencia: string;
  requisitos: string;
  resumo: string;
  linkInfo: string;
  rawBlock: string;
}

type SavedEditalStatus = 'Em análise' | 'Separando Documentos' | 'Proposta Enviada' | 'Contemplado';

interface SavedEditalRecord extends ParsedEditalItem {
  savedAt: string;
  status: SavedEditalStatus;
}

interface EditaisCollectorPanelProps {
  variant?: 'portal' | 'admin';
}

const AUTO_SYNC_PREF_KEY = 'rsbp_tjac_auto_sync_v1';
const SAVED_EDITAIS_KEY = 'rsbp_saved_editais_v1';
const AUTO_SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 horas

const QUICK_FOCUS_PRESETS = [
  'Penas Pecuniárias TJAC Plácido de Castro e Acre',
  'Programa Cozinha Solidária MDS e compras públicas',
  'Mesa Brasil Sesc e doação de alimentos',
  'Equipamentos de cozinha industrial e panificação',
  'Fundos privados e bancos (Assaí, Banco do Brasil, Carrefour)',
];

const SPECIALIST_CRITERIA_TEXT = `Especialista em Captação de Recursos para o Terceiro Setor — foco exclusivo em segurança alimentar, assistência social e projetos comunitários (ONGs de sopão e cozinhas solidárias).

Regras de Busca e Filtragem Ativas:
1. Prioriza editais abertos agora ou com previsão de abertura nos próximos 30 dias.
2. Abrange chamadas governamentais (municipais, estaduais no Acre, TJAC penas pecuniárias, federais, emendas) e privadas (institutos, fundações empresariais, bancos, supermercados, Mesa Brasil).
3. Filtra compatibilidade estrita pelos CNAEs da associação: 94.30-8-00 (Principal), 88.00-6-00 e 94.99-5-00 — descartando oportunidades exclusivas de saúde hospitalar, esporte ou cultura pura, e priorizando oportunidades acessíveis sem barreiras impeditivas.
4. Quando não há edital novo imediato, sugere 3 instituições em fluxo contínuo (ex.: Mesa Brasil Sesc, Instituto Assaí, Fundação Banco do Brasil) com status atual.`;

function extractFirstUrl(text: string): string | null {
  const mdLink = text.match(/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/);
  if (mdLink?.[1]) return mdLink[1];
  const bare = text.match(/https?:\/\/[^\s<>()]+/);
  return bare?.[0] ? bare[0].replace(/[.,;)]+$/, '') : null;
}

function parseStructuredEditais(markdown: string): ParsedEditalItem[] {
  if (!markdown.trim()) return [];
  const blocks = markdown
    .split(/^###\s+/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const items: ParsedEditalItem[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const rawHeading = (lines[0] || '').replace(/^📌\s*/, '').trim();
    if (!rawHeading || lines.length < 2) continue;

    const getField = (pattern: RegExp): string => {
      for (const line of lines.slice(1)) {
        const match = line.match(pattern);
        if (match?.[1]) return match[1].trim();
      }
      return '';
    };

    const instituicao = getField(/\*\*Institui[çc][ãa]o Financiadora:\*\*\s*(.+)/i);
    const tipoApoio = getField(/\*\*Tipo de Apoio:\*\*\s*(.+)/i);
    const valor = getField(/\*\*Valor\s*\/\s*Benef[íi]cio:\*\*\s*(.+)/i);
    const prazo = getField(/\*\*Prazo de Inscri[çc][ãa]o:\*\*\s*(.+)/i);
    const abrangencia = getField(/\*\*Abrang[êe]ncia:\*\*\s*(.+)/i);
    const requisitos = getField(/\*\*Requisitos B[áa]sicos:\*\*\s*(.+)/i);
    const resumo = getField(/\*\*Resumo do Objeto:\*\*\s*(.+)/i);
    const linkInfo = getField(/\*\*Link\s*\/\s*Onde Encontrar:\*\*\s*(.+)/i);

    if (instituicao || tipoApoio || prazo || resumo) {
      const slug = rawHeading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 48);
      items.push({
        id: `edital-${slug || items.length}`,
        title: rawHeading,
        instituicao: instituicao || 'Consultar edital',
        tipoApoio: tipoApoio || 'Segurança alimentar / Assistência social',
        valor: valor || 'Conforme edital',
        prazo: prazo || 'Verificar portal oficial',
        abrangencia: abrangencia || 'Brasil / Acre',
        requisitos: requisitos || 'CNPJ ativo · CNAE compatível',
        resumo: resumo || 'Apoio a projetos de segurança alimentar e assistência comunitária.',
        linkInfo: linkInfo || 'Consultar portais oficiais listados abaixo',
        rawBlock: `### 📌 ${block}`,
      });
    }
  }

  return items;
}

function readSavedEditais(): SavedEditalRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_EDITAIS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedEditalRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedEditais(items: SavedEditalRecord[]): void {
  try {
    localStorage.setItem(SAVED_EDITAIS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export function EditaisCollectorPanel({ variant = 'portal' }: EditaisCollectorPanelProps) {
  const isAdmin = variant === 'admin';

  const [mode, setMode] = useState<EditaisMode>('tjac_auto');
  const [customFilter, setCustomFilter] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SYNC_PREF_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [report, setReport] = useState<EditaisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewStyle, setViewStyle] = useState<'cards' | 'markdown'>('cards');
  const [showCriteria, setShowCriteria] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [savedEditais, setSavedEditais] = useState<SavedEditalRecord[]>(() =>
    readSavedEditais()
  );

  useEffect(() => {
    writeSavedEditais(savedEditais);
  }, [savedEditais]);

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSyncEnabled(checked);
    try {
      localStorage.setItem(AUTO_SYNC_PREF_KEY, String(checked));
    } catch {
      // Ignore storage error
    }
  };

  const runCollectEditais = useCallback(
    async (targetMode: EditaisMode, filterText?: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/gemini/editais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: targetMode,
            customFilter: filterText ?? '',
          }),
        });
        const data = (await res.json()) as EditaisReport & { error?: string };
        if (!res.ok) {
          throw new Error(
            data.error || 'Erro ao coletar editais para os CNAEs da associação.'
          );
        }
        setReport(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Falha ao consultar editais do TJAC e fontes públicas.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOrAutoCollect() {
      setError('');
      try {
        const res = await fetch(`/api/editais?mode=${encodeURIComponent(mode)}`);
        if (res.ok) {
          const data = (await res.json()) as { report: EditaisReport | null };
          if (cancelled) return;

          if (data.report) {
            setReport(data.report);
            const ageMs = Date.now() - new Date(data.report.updatedAt).getTime();
            if (autoSyncEnabled && mode === 'tjac_auto' && ageMs > AUTO_SYNC_MAX_AGE_MS) {
              await runCollectEditais(mode, customFilter);
            }
            return;
          }
        }
      } catch {
        // Proceed to automatic collection if cache read fails
      }

      if (!cancelled && autoSyncEnabled) {
        await runCollectEditais(mode, customFilter);
      }
    }

    void loadOrAutoCollect();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const parsedItems = useMemo(
    () => (report?.text ? parseStructuredEditais(report.text) : []),
    [report?.text]
  );

  const savedIds = useMemo(
    () => new Set(savedEditais.map((item) => item.id)),
    [savedEditais]
  );

  const handleToggleSaveEdital = (item: ParsedEditalItem) => {
    setSavedEditais((prev) => {
      if (prev.some((s) => s.id === item.id)) {
        return prev.filter((s) => s.id !== item.id);
      }
      const next: SavedEditalRecord = {
        ...item,
        savedAt: new Date().toISOString(),
        status: 'Em análise',
      };
      return [next, ...prev];
    });
  };

  const handleUpdateSavedStatus = (id: string, status: SavedEditalStatus) => {
    setSavedEditais((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runCollectEditais(mode, customFilter);
  };

  const handleCopyMarkdown = async () => {
    if (!report?.text) return;
    try {
      await navigator.clipboard.writeText(report.text);
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report?.text) return;
    const blob = new Blob([report.text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `editais-projeto-sopao-${mode}-${new Date()
      .toISOString()
      .slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formattedUpdatedAt = report?.updatedAt
    ? new Date(report.updatedAt).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="space-y-6">
      {/* CNAE Restriction Banner & TJAC Direct Access */}
      <div
        className={
          isAdmin
            ? 'rounded-lg border border-slate-200 bg-white p-6'
            : 'rounded-lg border border-[#D6CEBE] bg-white p-6'
        }
      >
        <div className="flex flex-col justify-between gap-4 border-b border-[#E2DDD3] pb-5 lg:flex-row lg:items-start">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#14532D]">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Captação Direcionada por CNAE · Segurança Alimentar</span>
            </p>
            <h3 className="font-serif text-xl font-semibold text-[#1C1917] sm:text-2xl">
              Coleta Automatizada de Editais e Fundos de Investimento Social
            </h3>
            <p className="max-w-3xl text-xs leading-relaxed text-[#57534E]">
              Busca ativa no Tribunal de Justiça do Estado do Acre (tjac.jus.br), chamadas
              públicas governamentais e institutos privados filtrados exclusivamente para os CNAEs
              ativos da <strong className="text-[#1C1917]">{INSTITUTION_PROFILE.legalName}</strong>{' '}
              e foco em cozinhas solidárias / Projeto Sopão.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCriteria((prev) => !prev)}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#FBF9F5]"
            >
              <FileText className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
              <span>Critérios do Especialista</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showCriteria ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <a
              href={INSTITUTION_PROFILE.tjacEditaisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-2 rounded-md border border-[#14532D] bg-[#FBF9F5] px-4 py-2 text-xs font-semibold text-[#14532D] transition-colors hover:bg-[#14532D] hover:text-white"
            >
              <Landmark className="h-4 w-4" aria-hidden="true" />
              <span>Portal de Editais TJAC</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {showCriteria && (
          <div className="mt-4 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] p-4 text-xs leading-relaxed text-[#44403C]">
            <p className="font-semibold text-[#14532D]">
              Prompt e Regras de Filtragem Aplicadas Automaticamente:
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-[#44403C]">
              {SPECIALIST_CRITERIA_TEXT}
            </pre>
          </div>
        )}

        {/* CNAE Filter Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-[#E2DDD3] bg-[#FBF9F5] p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#78716C]">
              CNAE Principal (Filtro Obrigatório)
            </p>
            <p className="mt-1 font-mono text-xs font-semibold text-[#14532D]">
              {INSTITUTION_PROFILE.cnaePrincipal}
            </p>
          </div>
          <div className="rounded-md border border-[#E2DDD3] bg-[#FBF9F5] p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#78716C]">
              CNAEs Secundários Compatíveis
            </p>
            <p className="mt-1 text-xs font-medium text-[#1C1917]">
              {INSTITUTION_PROFILE.cnaesSecundarios.join(' · ')}
            </p>
          </div>
          <div className="rounded-md border border-[#E2DDD3] bg-[#FBF9F5] p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#78716C]">
              Elegibilidade CNPJ &amp; Foco
            </p>
            <p className="mt-1 font-mono text-xs text-[#1C1917] tabular-nums">
              CNPJ {INSTITUTION_PROFILE.cnpj} · Desde {INSTITUTION_PROFILE.foundedShort}
            </p>
            <p className="mt-0.5 text-[11px] text-[#57534E]">
              {INSTITUTION_PROFILE.stateLawShort} · Segurança Alimentar / Sopão
            </p>
          </div>
        </div>

        {/* Mode Switcher & Search Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-[#E2DDD3] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Modo de coleta de editais"
              className="inline-flex flex-wrap gap-1 rounded-lg bg-[#EFEBE3] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'tjac_auto'}
                onClick={() => setMode('tjac_auto')}
                className={`cursor-pointer rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  mode === 'tjac_auto'
                    ? 'bg-[#14532D] text-white shadow-sm'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                Automático TJAC (tjac.jus.br)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'cnae_completo'}
                onClick={() => setMode('cnae_completo')}
                className={`cursor-pointer rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  mode === 'cnae_completo'
                    ? 'bg-[#14532D] text-white shadow-sm'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                Chamadas Públicas &amp; Fundos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'fluxo_continuo'}
                onClick={() => setMode('fluxo_continuo')}
                className={`cursor-pointer rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  mode === 'fluxo_continuo'
                    ? 'bg-[#14532D] text-white shadow-sm'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                Fluxo Contínuo (Sopão)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'leis_emendas'}
                onClick={() => setMode('leis_emendas')}
                className={`cursor-pointer rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${
                  mode === 'leis_emendas'
                    ? 'bg-[#14532D] text-white shadow-sm'
                    : 'text-[#44403C] hover:text-[#1C1917]'
                }`}
              >
                Cozinha Solidária &amp; Equipamentos
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#44403C]">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                className="h-4 w-4 rounded border-[#D6CEBE] accent-[#14532D]"
              />
              <span>Recebimento automático do TJAC ao abrir</span>
            </label>
          </div>

          {/* Atalhos rápidos de filtro */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#78716C] mr-1">
              Buscas rápidas:
            </span>
            {QUICK_FOCUS_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setCustomFilter(preset);
                  void runCollectEditais(mode, preset);
                }}
                className="cursor-pointer rounded border border-[#D6CEBE] bg-[#FBF9F5] px-2.5 py-1 text-[11px] font-medium text-[#44403C] transition-colors hover:border-[#14532D] hover:text-[#14532D]"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
              <input
                type="text"
                value={customFilter}
                onChange={(e) => setCustomFilter(e.target.value)}
                placeholder="Refinar busca por CNAE (ex.: penas pecuniárias Plácido de Castro, equipamentos cozinha, cestas)..."
                className="min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] py-2 pr-3.5 pl-10 text-sm text-[#1C1917]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{loading ? 'Coletando no TJAC & Web...' : 'Buscar / Atualizar Editais'}</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-[#9A3412]/30 bg-[#FEF2F2] p-3 text-xs font-medium text-[#9A3412]"
            >
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Saved / Tracked Editais Checklist (Admin convenience) */}
      {isAdmin && savedEditais.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
              <div>
                <h4 className="font-serif text-base font-semibold text-slate-900">
                  Editais Salvos para Acompanhamento da Diretoria ({savedEditais.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Controle interno de propostas e documentação em andamento.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {savedEditais.map((saved) => {
              const directUrl = extractFirstUrl(saved.linkInfo);
              return (
                <div
                  key={saved.id}
                  className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-semibold text-slate-900">
                      {saved.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {saved.instituicao} · Prazo: {saved.prazo} · {saved.valor}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      aria-label={`Status de acompanhamento de ${saved.title}`}
                      value={saved.status}
                      onChange={(e) =>
                        handleUpdateSavedStatus(
                          saved.id,
                          e.target.value as SavedEditalStatus
                        )
                      }
                      className="min-h-[34px] rounded border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800"
                    >
                      <option value="Em análise">Em análise</option>
                      <option value="Separando Documentos">Separando Documentos</option>
                      <option value="Proposta Enviada">Proposta Enviada</option>
                      <option value="Contemplado">Contemplado</option>
                    </select>

                    {directUrl && (
                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[34px] items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-xs font-medium text-[#14532D] hover:bg-slate-50"
                      >
                        <span>Portal</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleSaveEdital(saved)}
                      aria-label={`Remover ${saved.title} dos salvos`}
                      className="inline-flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Card */}
      <div
        className={
          isAdmin
            ? 'rounded-lg border border-slate-200 bg-white p-6'
            : 'rounded-lg border border-[#D6CEBE] bg-white p-6'
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
          <div className="flex items-center gap-2.5">
            <FileSearch className="h-5 w-5 text-[#14532D]" aria-hidden="true" />
            <div>
              <p className="font-serif text-lg font-semibold text-[#1C1917]">
                Editais Coletados e Filtrados pelo CNAE da Associação
              </p>
              <p className="text-xs text-[#57534E]">
                {mode === 'tjac_auto'
                  ? 'Monitoramento TJAC (tjac.jus.br) · Penas Pecuniárias e Chamadas Públicas'
                  : mode === 'fluxo_continuo'
                    ? 'Programas em Fluxo Contínuo para Cozinhas Solidárias e Segurança Alimentar'
                    : mode === 'leis_emendas'
                      ? 'Cozinha Solidária MDS, Emendas e Doação de Equipamentos'
                      : 'Editais Governamentais e Privados Compatíveis (CNAE 94.30-8-00 / 88.00-6-00)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {formattedUpdatedAt && (
              <span className="font-mono text-xs tabular-nums text-[#78716C] mr-1">
                Última coleta: {formattedUpdatedAt}
              </span>
            )}

            {report?.text && (
              <>
                {parsedItems.length > 0 && (
                  <div className="inline-flex rounded-md bg-[#EFEBE3] p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewStyle('cards')}
                      className={`cursor-pointer rounded px-2.5 py-1 font-semibold ${
                        viewStyle === 'cards'
                          ? 'bg-white text-[#1C1917] shadow-xs'
                          : 'text-[#57534E]'
                      }`}
                    >
                      Fichas ({parsedItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewStyle('markdown')}
                      className={`cursor-pointer rounded px-2.5 py-1 font-semibold ${
                        viewStyle === 'markdown'
                          ? 'bg-white text-[#1C1917] shadow-xs'
                          : 'text-[#57534E]'
                      }`}
                    >
                      Lista Completa
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1C1917] hover:bg-[#FBF9F5]"
                >
                  {copiedReport ? (
                    <Check className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{copiedReport ? 'Copiado' : 'Copiar Lista'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1C1917] hover:bg-[#FBF9F5]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Baixar .MD</span>
                </button>
              </>
            )}
          </div>
        </div>

        {loading && !report ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-sm text-[#57534E]">
            <Loader2 className="h-7 w-7 animate-spin text-[#14532D]" />
            <p className="font-medium text-[#1C1917]">
              Consultando automaticamente editais do Tribunal de Justiça do Acre e fontes
              compatíveis...
            </p>
            <p className="max-w-md text-xs text-[#78716C]">
              Filtrando oportunidades exclusivas para os CNAEs 94.30-8-00 e 88.00-6-00 da
              Associação Recanto Social Bom Pastor.
            </p>
          </div>
        ) : report?.text ? (
          <div className="mt-5 space-y-6">
            {viewStyle === 'cards' && parsedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {parsedItems.map((item) => {
                  const isSaved = savedIds.has(item.id);
                  const directUrl = extractFirstUrl(item.linkInfo);
                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-lg border border-[#D6CEBE] bg-[#FBF9F5] p-5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 border-b border-[#E2DDD3] pb-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-[#14532D]">
                              {item.instituicao} · {item.abrangencia}
                            </p>
                            <h4 className="mt-1 font-serif text-base font-semibold text-[#1C1917]">
                              {item.title}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleSaveEdital(item)}
                            className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              isSaved
                                ? 'border-[#14532D] bg-[#14532D] text-white'
                                : 'border-[#D6CEBE] bg-white text-[#1C1917] hover:border-[#14532D]'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Salvo</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Salvar</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-[#44403C]">
                          {item.resumo}
                        </p>

                        <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-[#E2DDD3] pt-3 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="text-[11px] text-[#78716C]">Tipo de Apoio</dt>
                            <dd className="font-medium text-[#1C1917]">{item.tipoApoio}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-[#78716C]">Valor / Benefício</dt>
                            <dd className="font-medium text-[#14532D]">{item.valor}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-[#78716C]">Prazo de Inscrição</dt>
                            <dd className="font-medium text-[#9A3412]">{item.prazo}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-[#78716C]">Requisitos Básicos</dt>
                            <dd className="text-[#44403C]">{item.requisitos}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2DDD3] pt-3 text-xs">
                        <span className="text-[#57534E] truncate max-w-[70%]">
                          {item.linkInfo}
                        </span>
                        {directUrl && (
                          <a
                            href={directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#14532D] hover:underline"
                          >
                            <span>Acessar</span>
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] p-5 sm:p-6">
                <SimpleMarkdown content={report.text} />
              </div>
            )}

            {report.sources.length > 0 && (
              <div className="border-t border-[#E2DDD3] pt-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  <Building2 className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                  <span>Portais e Editais Verificados na Busca ({report.sources.length})</span>
                </p>
                <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {report.sources.map((src) => (
                    <li key={src.uri}>
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-md border border-[#E2DDD3] bg-[#FBF9F5] px-3.5 py-2.5 text-xs font-medium text-[#14532D] transition-colors hover:border-[#14532D] hover:bg-white"
                      >
                        <span className="truncate">{src.title}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-[#57534E]">
            Clique em <strong className="text-[#1C1917]">Buscar / Atualizar Editais</strong> para
            iniciar a coleta automática no TJAC e nos editais compatíveis com os CNAEs da
            associação.
          </div>
        )}
      </div>
    </div>
  );
}
