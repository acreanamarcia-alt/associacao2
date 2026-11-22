import { Search, UserCheck, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AssistedPersonRecord } from '../data/assistedPeopleStore';
import type { VolunteerApplication } from '../data/volunteersStore';

export type GlobalSearchMatch =
  | { kind: 'assisted'; record: AssistedPersonRecord }
  | { kind: 'volunteer'; record: VolunteerApplication };

interface AdminGlobalSearchBarProps {
  assistedPeople: AssistedPersonRecord[];
  volunteerApplications: VolunteerApplication[];
  onSelectAssisted: (person: AssistedPersonRecord) => void;
  onSelectVolunteer: (volunteer: VolunteerApplication) => void;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function AdminGlobalSearchBar({
  assistedPeople,
  volunteerApplications,
  onSelectAssisted,
  onSelectVolunteer,
}: AdminGlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [inspectedMatch, setInspectedMatch] = useState<GlobalSearchMatch | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setInspectedMatch(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const results = useMemo(() => {
    const raw = query.trim();
    if (!raw) {
      return {
        assisted: [] as AssistedPersonRecord[],
        volunteers: [] as VolunteerApplication[],
      };
    }

    const textQuery = normalizeText(raw);
    const digitsQuery = onlyDigits(raw);

    const assisted = assistedPeople
      .filter((person) => {
        const nameMatch = normalizeText(person.fullName).includes(textQuery);
        const cpfDigits = onlyDigits(person.cpf ?? '');
        const cpfMatch =
          Boolean(digitsQuery) && cpfDigits.length > 0 && cpfDigits.includes(digitsQuery);
        return nameMatch || cpfMatch;
      })
      .slice(0, 6);

    const volunteers = volunteerApplications
      .filter((vol) => {
        const nameMatch = normalizeText(vol.fullName).includes(textQuery);
        const cpfDigits = onlyDigits(vol.cpf ?? '');
        const cpfMatch =
          Boolean(digitsQuery) && cpfDigits.length > 0 && cpfDigits.includes(digitsQuery);
        return nameMatch || cpfMatch;
      })
      .slice(0, 6);

    return { assisted, volunteers };
  }, [query, assistedPeople, volunteerApplications]);

  const totalMatches = results.assisted.length + results.volunteers.length;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-md">
        <label htmlFor="admin-global-search" className="sr-only">
          Busca global de assistidos e voluntários por nome ou CPF
        </label>
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="admin-global-search"
            type="search"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Buscar assistido ou voluntário (Nome ou CPF)..."
            className="min-h-[38px] w-full rounded-md border border-slate-300 bg-[#FBF9F5] py-1.5 pr-8 pl-9 text-xs text-slate-900 placeholder:text-slate-500 focus:border-[#14532D] focus:bg-white focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              aria-label="Limpar busca global"
              className="absolute right-2 cursor-pointer rounded p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div
            role="region"
            aria-label="Resultados da busca global"
            className="absolute right-0 left-0 z-40 mt-1.5 max-h-[380px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
          >
            {totalMatches === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-slate-500">
                Nenhum assistido ou voluntário encontrado para{' '}
                <span className="font-semibold text-slate-800">“{query.trim()}”</span>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.assisted.length > 0 && (
                  <div className="p-2">
                    <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#14532D]">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pessoas Assistidas ({results.assisted.length})</span>
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {results.assisted.map((person) => (
                        <li key={person.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              setInspectedMatch({ kind: 'assisted', record: person });
                            }}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-[#F4F0E8]"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {person.fullName}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {person.cpf ? (
                                  <span className="font-mono tabular-nums text-slate-700">
                                    CPF {person.cpf} ·{' '}
                                  </span>
                                ) : null}
                                {person.neighborhood || 'Plácido de Castro - AC'} · {person.phone}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[11px] font-semibold ${
                                person.status === 'Ativa' ? 'text-[#16A34A]' : 'text-slate-500'
                              }`}
                            >
                              {person.status}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.volunteers.length > 0 && (
                  <div className="p-2">
                    <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#9A3412]">
                      <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Voluntários Inscritos ({results.volunteers.length})</span>
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {results.volunteers.map((vol) => (
                        <li key={vol.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              setInspectedMatch({ kind: 'volunteer', record: vol });
                            }}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-[#F4F0E8]"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {vol.fullName}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {vol.cpf ? (
                                  <span className="font-mono tabular-nums text-slate-700">
                                    CPF {vol.cpf} ·{' '}
                                  </span>
                                ) : null}
                                {vol.roleTitle} · {vol.phone}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] font-medium text-[#14532D]">
                              Ver ficha
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Ficha Rápida do Assistido / Voluntário encontrado */}
      {inspectedMatch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-search-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setInspectedMatch(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#14532D]">
                  {inspectedMatch.kind === 'assisted'
                    ? 'Pessoa Assistida · Cadastro Social'
                    : 'Voluntário Inscrito · Projeto Sopão'}
                </p>
                <h3
                  id="global-search-modal-title"
                  className="mt-1 font-serif text-xl font-semibold text-slate-900"
                >
                  {inspectedMatch.record.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMatch(null)}
                aria-label="Fechar ficha encontrada"
                className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {inspectedMatch.kind === 'assisted' ? (
              <dl className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">CPF</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {inspectedMatch.record.cpf || 'Não informado'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Telefone / WhatsApp</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {inspectedMatch.record.phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">E-mail</dt>
                  <dd className="text-slate-800">{inspectedMatch.record.email}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Bairro / Família</dt>
                  <dd className="text-right text-slate-800">
                    {inspectedMatch.record.neighborhood || 'Plácido de Castro - AC'} ·{' '}
                    {inspectedMatch.record.householdSize ?? 1} pessoa(s)
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Status</dt>
                  <dd
                    className={`font-semibold ${
                      inspectedMatch.record.status === 'Ativa'
                        ? 'text-[#16A34A]'
                        : 'text-slate-500'
                    }`}
                  >
                    {inspectedMatch.record.status}
                  </dd>
                </div>
                {inspectedMatch.record.notes && (
                  <div className="py-2.5">
                    <dt className="text-slate-500">Observações</dt>
                    <dd className="mt-1 text-slate-700">{inspectedMatch.record.notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <dl className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">CPF</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {inspectedMatch.record.cpf || 'Não informado'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Frente / Vaga</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {inspectedMatch.record.roleTitle}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Telefone / WhatsApp</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900">
                    {inspectedMatch.record.phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Disponibilidade</dt>
                  <dd className="text-right text-slate-800">
                    {inspectedMatch.record.availability}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">Data de inscrição</dt>
                  <dd className="font-mono tabular-nums text-slate-700">
                    {inspectedMatch.record.createdAt}
                  </dd>
                </div>
                {inspectedMatch.record.notes && (
                  <div className="py-2.5">
                    <dt className="text-slate-500">Observações</dt>
                    <dd className="mt-1 text-slate-700">{inspectedMatch.record.notes}</dd>
                  </div>
                )}
              </dl>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setInspectedMatch(null)}
                className="min-h-[38px] cursor-pointer rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = inspectedMatch;
                  setInspectedMatch(null);
                  if (current.kind === 'assisted') {
                    onSelectAssisted(current.record);
                  } else {
                    onSelectVolunteer(current.record);
                  }
                }}
                className="min-h-[38px] cursor-pointer rounded-md bg-[#14532D] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22]"
              >
                {inspectedMatch.kind === 'assisted'
                  ? 'Abrir no Cadastro de Assistidas'
                  : 'Abrir na Lista de Voluntários'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
