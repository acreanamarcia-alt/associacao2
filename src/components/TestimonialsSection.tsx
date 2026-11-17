import { CheckCircle2, MessageSquarePlus, Quote, Trash2, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import {
  TestimonialCategory,
  useTestimonialsStore,
} from '../data/testimonialsStore';

const CATEGORIES: Array<'Todos' | TestimonialCategory> = [
  'Todos',
  'Sopão Comunitário',
  'Pães & Bolos',
  'Entregas & Kits',
];

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 || partsLengthOk(p));
  if (parts.length === 0) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function partsLengthOk(word: string): boolean {
  const lower = word.toLowerCase();
  return !['da', 'de', 'do', 'das', 'dos', 'e'].includes(lower);
}

export function TestimonialsSection() {
  const { testimonials, addTestimonial, removeTestimonial } = useTestimonialsStore();
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | TestimonialCategory>('Todos');
  const [formOpen, setFormOpen] = useState(false);

  const [personName, setPersonName] = useState('');
  const [roleOrContext, setRoleOrContext] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [category, setCategory] = useState<TestimonialCategory>('Sopão Comunitário');
  const [quote, setQuote] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
  const [formError, setFormError] = useState('');
  const [submitNotice, setSubmitNotice] = useState('');

  const filteredTestimonials = useMemo(() => {
    if (selectedCategory === 'Todos') return testimonials;
    return testimonials.filter((item) => item.category === selectedCategory);
  }, [testimonials, selectedCategory]);

  const featuredTestimonial = filteredTestimonials[0] ?? null;
  const secondaryTestimonials = filteredTestimonials.slice(1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitNotice('');

    if (personName.trim().length < 3) {
      setFormError('Informe o nome completo ou como deseja ser identificado(a).');
      return;
    }
    if (quote.trim().length < 20) {
      setFormError('Escreva um relato com pelo menos 20 caracteres sobre sua experiência.');
      return;
    }

    addTestimonial({
      personName,
      roleOrContext,
      neighborhood,
      category,
      quote,
      impactSummary,
    });

    setPersonName('');
    setRoleOrContext('');
    setNeighborhood('');
    setCategory('Sopão Comunitário');
    setQuote('');
    setImpactSummary('');
    setFormOpen(false);
    setSelectedCategory('Todos');
    setSubmitNotice('Obrigado por compartilhar seu depoimento com a comunidade.');
  };

  return (
    <section id="depoimentos" className="border-b border-[#E2DDD3] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        {/* Cabeçalho editorial da seção */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#E2DDD3] pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
              Vozes da Comunidade · Plácido de Castro, AC
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              Depoimentos de quem recebe o Projeto Sopão
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#44403C]">
              Relatos diretos de mães de família, idosos e trabalhadores atendidos no Bairro
              Olaria e nos ramais da zona rural pelo sopão comunitário, panificação solidária e
              entregas semanais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Filtrar depoimentos por frente de atendimento"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F4F0E8] p-1"
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-white text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setFormOpen((prev) => !prev);
                setFormError('');
                setSubmitNotice('');
              }}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-md border border-[#14532D] bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
            >
              {formOpen ? (
                <>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Fechar formulário</span>
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Enviar depoimento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notificação de confirmação */}
        {submitNotice && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2.5 rounded-lg border border-[#14532D]/25 bg-[#F0FDF4] px-4 py-3 text-xs font-medium text-[#14532D]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitNotice}</span>
          </div>
        )}

        {/* Formulário interativo para novo depoimento comunitário */}
        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-xl border border-[#D6CEBE] bg-[#FBF9F5] p-6 sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2DDD3] pb-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                  Compartilhar experiência com o Projeto Sopão
                </h3>
                <p className="mt-1 text-xs text-[#57534E]">
                  Conte como o sopão comunitário, os pães ou as entregas apoiaram sua família ou
                  comunidade.
                </p>
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
              >
                {formError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="dep-name"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Nome completo *
                </label>
                <input
                  id="dep-name"
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ex.: Dona Raimunda Lima"
                  className="mt-1.5 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="dep-role"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Vínculo ou situação familiar
                </label>
                <input
                  id="dep-role"
                  type="text"
                  value={roleOrContext}
                  onChange={(e) => setRoleOrContext(e.target.value)}
                  placeholder="Ex.: Mãe de 2 filhos · Autônoma"
                  className="mt-1.5 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="dep-neighborhood"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Bairro ou comunidade
                </label>
                <input
                  id="dep-neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex.: Bairro Olaria · Plácido de Castro"
                  className="mt-1.5 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="dep-category"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Frente de atendimento
                </label>
                <select
                  id="dep-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TestimonialCategory)}
                  className="mt-1.5 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                >
                  <option value="Sopão Comunitário">Sopão Comunitário</option>
                  <option value="Pães & Bolos">Pães &amp; Bolos</option>
                  <option value="Entregas & Kits">Entregas &amp; Kits</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label
                  htmlFor="dep-quote"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Seu depoimento *
                </label>
                <textarea
                  id="dep-quote"
                  rows={3}
                  required
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Descreva como o acolhimento e os alimentos do Projeto Sopão ajudaram sua família..."
                  className="mt-1.5 w-full rounded-md border border-[#D6CEBE] bg-white p-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="dep-impact"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Resumo do apoio recebido (opcional)
                </label>
                <input
                  id="dep-impact"
                  type="text"
                  value={impactSummary}
                  onChange={(e) => setImpactSummary(e.target.value)}
                  placeholder="Ex.: Refeição garantida para 4 pessoas"
                  className="mt-1.5 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
                />
                <button
                  type="submit"
                  className="mt-4 inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  Publicar Depoimento
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Estado vazio caso filtro não tenha registros */}
        {!featuredTestimonial ? (
          <div className="mt-10 rounded-xl border border-[#E2DDD3] bg-[#FBF9F5] p-10 text-center">
            <p className="font-serif text-lg font-medium text-[#1C1917]">
              Nenhum depoimento registrado nesta frente ainda.
            </p>
            <p className="mt-1 text-sm text-[#57534E]">
              Selecione “Todos” ou envie o primeiro relato comunitário desta categoria.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {/* Depoimento em destaque editorial */}
            <article className="rounded-xl border border-[#D6CEBE] bg-[#FBF9F5] p-7 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4 text-xs text-[#57534E]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#14532D]">
                    {featuredTestimonial.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredTestimonial.neighborhood}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{featuredTestimonial.assistedSince}</span>
                </div>

                {featuredTestimonial.isUserSubmitted && (
                  <button
                    type="button"
                    onClick={() => removeTestimonial(featuredTestimonial.id)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-[#9A3412] hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Remover relato</span>
                  </button>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-9">
                  <Quote
                    className="h-7 w-7 text-[#9A3412]/70"
                    aria-hidden="true"
                  />
                  <blockquote className="mt-3 font-serif text-xl leading-relaxed italic text-[#1C1917] sm:text-2xl">
                    “{featuredTestimonial.quote}”
                  </blockquote>
                </div>

                <div className="border-t border-[#E2DDD3] pt-5 lg:col-span-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#14532D]/25 bg-[#14532D]/10 font-serif text-sm font-bold text-[#14532D]"
                    >
                      {getInitials(featuredTestimonial.personName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-base font-semibold text-[#1C1917]">
                        {featuredTestimonial.personName}
                      </p>
                      <p className="text-xs text-[#57534E]">
                        {featuredTestimonial.roleOrContext}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-[#44403C]">
                    <span className="font-semibold text-[#1C1917]">Impacto direto: </span>
                    {featuredTestimonial.impactSummary}
                  </p>
                </div>
              </div>
            </article>

            {/* Grade secundária de depoimentos */}
            {secondaryTestimonials.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {secondaryTestimonials.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-[#E2DDD3] bg-[#FBF9F5] p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#14532D]">
                            {item.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.neighborhood}</span>
                        </div>

                        {item.isUserSubmitted && (
                          <button
                            type="button"
                            onClick={() => removeTestimonial(item.id)}
                            aria-label={`Remover depoimento de ${item.personName}`}
                            className="cursor-pointer text-[#9A3412] hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <blockquote className="mt-4 font-serif text-base leading-relaxed text-[#1C1917]">
                        “{item.quote}”
                      </blockquote>
                    </div>

                    <div className="mt-6 border-t border-[#E2DDD3] pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D6CEBE] bg-white font-serif text-xs font-bold text-[#14532D]"
                          >
                            {getInitials(item.personName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-serif text-sm font-semibold text-[#1C1917]">
                              {item.personName}
                            </p>
                            <p className="truncate text-xs text-[#57534E]">
                              {item.roleOrContext}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-[#78716C] tabular-nums">
                          {item.assistedSince}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-[#44403C]">
                        <span className="font-medium text-[#1C1917]">Apoio: </span>
                        {item.impactSummary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
