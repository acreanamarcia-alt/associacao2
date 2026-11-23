import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ADMIN_ROLES,
  AdminRole,
  AdminUser,
  UserStatus,
  UsersListResponse,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '../data/adminAuthClient';
import { AssistedPersonRecord } from '../data/assistedPeopleStore';
import { DonationRecord, PickupScheduleRecord } from '../data/donationsStore';
import { VisitorStats } from '../data/visitorStore';
import { VolunteerApplication } from '../data/volunteersStore';
import { generateUsersAndVolunteersImpactPdf } from '../utils/dashboardPdfReport';

interface AdminAccessControlPanelProps {
  currentUser: AdminUser;
  volunteerApplications?: VolunteerApplication[];
  visitorStats?: VisitorStats;
  assistedPeople?: AssistedPersonRecord[];
  donations?: DonationRecord[];
  pickups?: PickupScheduleRecord[];
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'Nunca acessou';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(dt);
}

export function AdminAccessControlPanel({
  currentUser,
  volunteerApplications = [],
  visitorStats = { totalVisits: 0, uniqueVisitors: 0, updatedAt: '' },
  assistedPeople = [],
  donations = [],
  pickups = [],
}: AdminAccessControlPanelProps) {
  const [data, setData] = useState<UsersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportMonth, setExportMonth] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | AdminRole>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | UserStatus>('todos');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Create new user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('gerente');
  const [newStatus, setNewStatus] = useState<UserStatus>('ativo');
  const [creating, setCreating] = useState(false);

  // Per-row actions
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetchAdminUsers({
        q: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        page,
        pageSize,
      });
      setData(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível carregar os usuários.';
      if (/sessão|autentic|token|autoriz|401/i.test(message)) {
        setData({
          users: [currentUser],
          metrics: {
            total: 1,
            ativos: currentUser.status === 'ativo' ? 1 : 0,
            inativos: currentUser.status === 'inativo' ? 1 : 0,
            byRole: {
              admin: currentUser.role === 'admin' ? 1 : 0,
              gerente: currentUser.role === 'gerente' ? 1 : 0,
              usuario: currentUser.role === 'usuario' ? 1 : 0,
            },
          },
          pagination: {
            page: 1,
            pageSize,
            totalItems: 1,
            totalPages: 1,
          },
        });
      } else {
        setErrorMsg(message);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newNome.trim().length < 3) {
      setErrorMsg('Informe o nome completo (mínimo 3 caracteres).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A senha inicial deve possuir no mínimo 6 caracteres.');
      return;
    }

    setCreating(true);
    try {
      const created = await createAdminUser({
        nome: newNome.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        status: newStatus,
      });
      setSuccessMsg(
        `Usuário "${created.nome}" cadastrado com nível ${ADMIN_ROLES[created.role].shortLabel}.`
      );
      setNewNome('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('gerente');
      setNewStatus('ativo');
      setShowCreateForm(false);
      setPage(1);
      await loadUsers();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao cadastrar novo usuário.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (user: AdminUser, nextRole: AdminRole) => {
    if (user.role === nextRole) return;
    setErrorMsg('');
    setSuccessMsg('');
    setBusyUserId(user.id);
    try {
      const updated = await updateAdminUser(user.id, { role: nextRole });
      setSuccessMsg(
        `Nível de acesso de "${updated.nome}" alterado para ${ADMIN_ROLES[updated.role].shortLabel}.`
      );
      await loadUsers();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao atualizar nível de acesso.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus: UserStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    setErrorMsg('');
    setSuccessMsg('');
    setBusyUserId(user.id);
    try {
      const updated = await updateAdminUser(user.id, { status: nextStatus });
      setSuccessMsg(
        `Conta de "${updated.nome}" ${updated.status === 'ativo' ? 'ativada' : 'desativada'}.`
      );
      await loadUsers();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao alterar o status do usuário.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetPassword = async (e: FormEvent, user: AdminUser) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (resetPasswordValue.trim().length < 6) {
      setErrorMsg('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    setBusyUserId(user.id);
    try {
      await updateAdminUser(user.id, { newPassword: resetPasswordValue.trim() });
      setSuccessMsg(`Senha de "${user.nome}" redefinida com sucesso.`);
      setResetPasswordUserId(null);
      setResetPasswordValue('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao redefinir a senha.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    setErrorMsg('');
    setSuccessMsg('');
    setBusyUserId(user.id);
    try {
      await deleteAdminUser(user.id);
      setSuccessMsg(`Usuário "${user.nome}" removido do sistema.`);
      setConfirmDeleteUserId(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Não foi possível excluir o usuário.'
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleExportUsersAndVolunteersPdf = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setExportingPdf(true);
    try {
      const fullRes = await fetchAdminUsers({ page: 1, pageSize: 100 });
      generateUsersAndVolunteersImpactPdf({
        systemUsers: fullRes.users,
        volunteerApplications,
        assistedPeople,
        donations,
        pickups,
        visitorStats,
        referenceMonth: exportMonth,
        generatedBy: currentUser.nome || currentUser.displayName,
      });
      setSuccessMsg(
        'Relatório Mensal de Impacto (Usuários & Voluntários) exportado em PDF com sucesso.'
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o PDF de usuários e voluntários.'
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const metrics = data?.metrics ?? {
    total: 0,
    ativos: 0,
    inativos: 0,
    byRole: { admin: 0, gerente: 0, usuario: 0 },
  };
  const users = data?.users ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize,
    totalItems: 0,
    totalPages: 1,
  };

  return (
    <div className="space-y-6">
      {/* Visão Geral de Usuários por Nível de Acesso */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Total de Contas</p>
            <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {metrics.total}
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
            {metrics.ativos} ativos · {metrics.inativos} inativos
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Administradores (admin)</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#14532D]">
            {metrics.byRole.admin}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Controle total, usuários e financeiro
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Gerentes / Editores (gerente)</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {metrics.byRole.gerente}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Relatórios, aprovações, coletas e editais
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Usuários Padrão (usuario)</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
            {metrics.byRole.usuario}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Portal público e dados da própria conta
          </p>
        </div>
      </div>

      {/* Feedback de Erro / Sucesso */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-xs font-medium text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-[#14532D]/30 bg-[#F0FDF4] px-4 py-3 text-xs font-medium text-[#14532D]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Barra de Busca, Filtros e Novo Cadastro */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Gerenciamento de Usuários e Papéis (RBAC)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Altere o nível de acesso, ative/desative contas e monitore o último login.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Competência do relatório PDF"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="min-h-[40px] rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-[#14532D] focus:outline-none"
            >
              <option value="all">PDF: Todos os períodos</option>
              <option value={new Date().toISOString().slice(0, 7)}>
                PDF: Mês atual ({new Date().toISOString().slice(0, 7)})
              </option>
            </select>

            <button
              type="button"
              onClick={() => void handleExportUsersAndVolunteersPdf()}
              disabled={exportingPdf}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FBF9F5] px-3.5 py-2 text-xs font-semibold text-[#14532D] hover:bg-[#14532D] hover:text-white transition-colors disabled:opacity-60"
            >
              {exportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {exportingPdf
                  ? 'Gerando PDF...'
                  : 'Exportar PDF (Usuários & Voluntários)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm((prev) => !prev);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showCreateForm ? 'Fechar Formulário' : 'Cadastrar Usuário'}</span>
            </button>
          </div>
        </div>

        {/* Formulário de Novo Usuário */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateUser}
            className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#14532D]">
                Novo Cadastro de Acesso
              </p>
              <span className="text-[11px] text-slate-500">
                Senha armazenada com hash scrypt + salt aleatório
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label
                  htmlFor="rbac-new-nome"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Nome Completo *
                </label>
                <input
                  id="rbac-new-nome"
                  type="text"
                  required
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rbac-new-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  E-mail *
                </label>
                <input
                  id="rbac-new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nome@bompastor.org.br"
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rbac-new-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Senha Inicial *
                </label>
                <input
                  id="rbac-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rbac-new-role"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Nível de Acesso (Role)
                </label>
                <select
                  id="rbac-new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                >
                  <option value="admin">Administrador (admin)</option>
                  <option value="gerente">Gerente / Editor (gerente)</option>
                  <option value="usuario">Usuário Padrão (usuario)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="rbac-new-status"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Status Inicial
                </label>
                <select
                  id="rbac-new-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  {ADMIN_ROLES[newRole].label}:
                </span>{' '}
                {ADMIN_ROLES[newRole].description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="min-h-[38px] cursor-pointer rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{creating ? 'Salvando...' : 'Criar Conta'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Controles de Busca e Filtro */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, e-mail ou ID..."
              aria-label="Buscar usuários"
              className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#14532D] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as 'todos' | AdminRole);
                setPage(1);
              }}
              aria-label="Filtrar por nível de acesso"
              className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
            >
              <option value="todos">Todos os Níveis (Roles)</option>
              <option value="admin">Somente Administrador (admin)</option>
              <option value="gerente">Somente Gerente / Editor (gerente)</option>
              <option value="usuario">Somente Usuário Padrão (usuario)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'todos' | UserStatus);
                setPage(1);
              }}
              aria-label="Filtrar por status"
              className="min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Somente Ativos</option>
              <option value="inativo">Somente Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Nível de Acesso (Role)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Cadastro / Último Acesso</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && users.length === 0 ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <p className="font-medium text-slate-700">
                      Nenhum usuário encontrado para os filtros atuais.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setRoleFilter('todos');
                        setStatusFilter('todos');
                        setPage(1);
                      }}
                      className="mt-2 cursor-pointer text-xs font-semibold text-[#14532D] hover:underline"
                    >
                      Limpar busca e filtros
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const isBusy = busyUserId === user.id;
                  const isEditingPwd = resetPasswordUserId === user.id;
                  const isConfirmingDel = confirmDeleteUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">
                          {user.nome}
                          {isSelf && (
                            <span className="ml-2 font-mono text-[11px] font-normal text-[#14532D]">
                              · Sessão atual
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                          {user.id}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top font-mono text-[11px] text-slate-700">
                        {user.email}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <select
                          aria-label={`Alterar nível de acesso de ${user.nome}`}
                          value={user.role}
                          disabled={isBusy}
                          onChange={(e) =>
                            void handleRoleChange(user, e.target.value as AdminRole)
                          }
                          className="min-h-[36px] cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-[#14532D] focus:outline-none disabled:opacity-50"
                        >
                          <option value="admin">admin — Administrador</option>
                          <option value="gerente">gerente — Gerente / Editor</option>
                          <option value="usuario">usuario — Usuário Padrão</option>
                        </select>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <button
                          type="button"
                          disabled={isBusy || isSelf}
                          onClick={() => void handleToggleStatus(user)}
                          title={
                            isSelf
                              ? 'Não é possível desativar sua própria sessão'
                              : user.status === 'ativo'
                                ? 'Clique para desativar esta conta'
                                : 'Clique para ativar esta conta'
                          }
                          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                            user.status === 'ativo'
                              ? 'border-[#16A34A]/30 bg-[#F0FDF4] text-[#14532D] hover:bg-[#DCFCE7]'
                              : 'border-[#DC2626]/30 bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'
                          } ${isSelf ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                        >
                          {user.status === 'ativo' ? (
                            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{user.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 align-top font-mono text-[11px] tabular-nums text-slate-600">
                        <p>Criado: {formatTimestamp(user.createdAt)}</p>
                        <p className="mt-0.5 text-slate-500">
                          Último login: {formatTimestamp(user.lastLoginAt)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right">
                        {isEditingPwd ? (
                          <form
                            onSubmit={(e) => void handleResetPassword(e, user)}
                            className="inline-flex items-center justify-end gap-1.5"
                          >
                            <input
                              type="password"
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              placeholder="Nova senha (mín. 6)"
                              className="min-h-[34px] w-36 rounded border border-slate-300 px-2 text-xs focus:border-[#14532D] focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={isBusy}
                              className="min-h-[34px] cursor-pointer rounded bg-[#14532D] px-2.5 text-[11px] font-semibold text-white hover:bg-[#0F3F22]"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetPasswordUserId(null);
                                setResetPasswordValue('');
                              }}
                              className="min-h-[34px] cursor-pointer rounded border border-slate-300 bg-white px-2 text-[11px] text-slate-700"
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : isConfirmingDel ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-semibold text-[#991B1B]">
                              Excluir?
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDeleteUser(user)}
                              className="min-h-[32px] cursor-pointer rounded bg-[#DC2626] px-2.5 text-[11px] font-semibold text-white hover:bg-[#B91C1C]"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUserId(null)}
                              className="min-h-[32px] cursor-pointer rounded border border-slate-300 bg-white px-2 text-[11px] text-slate-700"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setResetPasswordUserId(user.id);
                                setResetPasswordValue('');
                                setConfirmDeleteUserId(null);
                              }}
                              title="Redefinir senha deste usuário"
                              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <KeyRound className="h-3 w-3" aria-hidden="true" />
                              <span>Senha</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy || isSelf}
                              onClick={() => {
                                setConfirmDeleteUserId(user.id);
                                setResetPasswordUserId(null);
                              }}
                              title={
                                isSelf
                                  ? 'Você não pode excluir sua própria conta'
                                  : 'Excluir usuário'
                              }
                              aria-label={`Excluir usuário ${user.nome}`}
                              className={`inline-flex min-h-[36px] items-center justify-center rounded border px-2.5 text-[11px] font-medium ${
                                isSelf
                                  ? 'cursor-not-allowed border-slate-200 text-slate-300'
                                  : 'cursor-pointer border-slate-300 text-slate-600 hover:border-[#DC2626]/40 hover:bg-[#FEF2F2] hover:text-[#DC2626]'
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <p className="font-mono tabular-nums">
            Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems}{' '}
            registro(s)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Próxima</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Matriz de Permissões RBAC */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
          <h3 className="font-serif text-base font-semibold text-slate-900">
            Política de Controle de Acesso Baseado em Papéis (RBAC)
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['admin', 'gerente', 'usuario'] as AdminRole[]).map((roleKey) => {
            const def = ADMIN_ROLES[roleKey];
            return (
              <div
                key={roleKey}
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <p className="font-mono text-xs font-semibold text-[#14532D]">
                  {def.role}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {def.shortLabel}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {def.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
