export type AdminRole = 'admin' | 'gerente' | 'usuario';
export type UserStatus = 'ativo' | 'inativo';

export type AdminTabKey =
  | 'overview'
  | 'receipts'
  | 'monthly-donors'
  | 'accounting'
  | 'pickups'
  | 'products'
  | 'assisted'
  | 'reports'
  | 'editais'
  | 'users'
  | 'corporate';

export interface AdminRoleDefinition {
  role: AdminRole;
  label: string;
  shortLabel: string;
  description: string;
  allowedTabs: AdminTabKey[];
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canResetFinancial: boolean;
  canApproveContent: boolean;
}

export const ADMIN_ROLES: Record<AdminRole, AdminRoleDefinition> = {
  admin: {
    role: 'admin',
    label: 'Administrador (admin)',
    shortLabel: 'Administrador',
    description:
      'Acesso total ao sistema, gerenciamento de usuários, níveis de acesso, contabilidade, reset financeiro e configurações.',
    allowedTabs: [
      'overview',
      'accounting',
      'monthly-donors',
      'receipts',
      'pickups',
      'products',
      'assisted',
      'reports',
      'editais',
      'users',
      'corporate',
    ],
    canAccessAdminPanel: true,
    canManageUsers: true,
    canResetFinancial: true,
    canApproveContent: true,
  },
  gerente: {
    role: 'gerente',
    label: 'Gerente / Editor (gerente)',
    shortLabel: 'Gerente / Editor',
    description:
      'Acesso a relatórios PDF, aprovação/conferência de doações, coletas, produtos, pessoas assistidas, editais e dados operacionais.',
    allowedTabs: [
      'overview',
      'receipts',
      'monthly-donors',
      'pickups',
      'products',
      'assisted',
      'reports',
      'editais',
      'corporate',
    ],
    canAccessAdminPanel: true,
    canManageUsers: false,
    canResetFinancial: false,
    canApproveContent: true,
  },
  usuario: {
    role: 'usuario',
    label: 'Usuário Padrão (usuario)',
    shortLabel: 'Usuário',
    description:
      'Acesso limitado ao portal público e gerenciamento apenas dos dados da própria conta (sem acesso às abas administrativas).',
    allowedTabs: [],
    canAccessAdminPanel: false,
    canManageUsers: false,
    canResetFinancial: false,
    canApproveContent: false,
  },
};

export function getRoleDefinition(role?: AdminRole | string | null): AdminRoleDefinition {
  if (role === 'admin') return ADMIN_ROLES.admin;
  if (role === 'gerente') return ADMIN_ROLES.gerente;
  return ADMIN_ROLES.usuario;
}

export function canEnterAdminPanel(role?: AdminRole | null): boolean {
  return role === 'admin' || role === 'gerente';
}

export function hasTabAccess(role: AdminRole | undefined, tab: AdminTabKey): boolean {
  const def = getRoleDefinition(role);
  return def.allowedTabs.includes(tab);
}

export interface AdminUser {
  id: string;
  nome: string;
  displayName: string;
  email: string;
  role: AdminRole;
  status: UserStatus;
  active: boolean;
  isDefaultPassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AdminSessionStatus {
  authenticated: boolean;
  user?: AdminUser;
  admin?: AdminUser;
  defaultLoginAvailable?: boolean;
  defaultEmailHint?: string;
}

export interface UsersListResponse {
  users: AdminUser[];
  metrics: {
    total: number;
    ativos: number;
    inativos: number;
    byRole: {
      admin: number;
      gerente: number;
      usuario: number;
    };
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const TOKEN_LOCAL_KEY = 'arsbp_admin_token_local_v1';
const TOKEN_SESSION_KEY = 'arsbp_admin_token_session_v1';

export function getStoredAdminToken(): string | null {
  try {
    return (
      window.sessionStorage.getItem(TOKEN_SESSION_KEY) ||
      window.localStorage.getItem(TOKEN_LOCAL_KEY)
    );
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string, remember: boolean): void {
  try {
    window.sessionStorage.setItem(TOKEN_SESSION_KEY, token);
    if (remember) {
      window.localStorage.setItem(TOKEN_LOCAL_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_LOCAL_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAdminToken(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_SESSION_KEY);
    window.localStorage.removeItem(TOKEN_LOCAL_KEY);
  } catch {
    // Ignore storage errors
  }
}

function buildAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : {
        'Content-Type': 'application/json',
      };
}

export async function fetchAuthSession(): Promise<AdminSessionStatus> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    return { authenticated: false };
  }
  const data = (await res.json()) as AdminSessionStatus;
  if (!data.authenticated) {
    clearStoredAdminToken();
  }
  return data;
}

export const fetchAdminSession = fetchAuthSession;

export async function registerUserAccount(
  nome: string,
  email: string,
  password: string,
  remember = true
): Promise<AdminUser> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ nome, email, password }),
  });

  const data = (await res.json()) as {
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    error?: string;
  };

  if (!res.ok || !data.authenticated || !data.user || !data.token) {
    throw new Error(data.error || 'Não foi possível concluir o cadastro.');
  }

  setStoredAdminToken(data.token, remember);
  return data.user;
}

export async function loginAdmin(
  email: string,
  password: string,
  remember: boolean
): Promise<AdminUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    admin?: AdminUser;
    error?: string;
  };

  const loggedUser = data.user ?? data.admin;
  if (!res.ok || !data.authenticated || !loggedUser || !data.token) {
    throw new Error(data.error || 'Não foi possível validar o login.');
  }

  setStoredAdminToken(data.token, remember);
  return loggedUser;
}

export async function logoutAdmin(): Promise<void> {
  clearStoredAdminToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Ignore network error on logout
  }
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newEmail: string;
  newPassword?: string;
  displayName?: string;
}): Promise<AdminUser> {
  const res = await fetch('/api/auth/credentials', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({
      ...input,
      nome: input.displayName,
    }),
  });

  const data = (await res.json()) as {
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    admin?: AdminUser;
    error?: string;
  };

  const updated = data.user ?? data.admin;
  if (!res.ok || !data.authenticated || !updated || !data.token) {
    throw new Error(data.error || 'Não foi possível atualizar as credenciais.');
  }

  const keepLocal = Boolean(window.localStorage.getItem(TOKEN_LOCAL_KEY));
  setStoredAdminToken(data.token, keepLocal);
  return updated;
}

export async function fetchAdminUsers(params?: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<UsersListResponse> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.role && params.role !== 'todos') qs.set('role', params.role);
  if (params?.status && params.status !== 'todos') qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));

  const res = await fetch(`/api/admin/users?${qs.toString()}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });
  const data = (await res.json()) as UsersListResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao carregar usuários cadastrados.');
  }
  return data;
}

export async function createAdminUser(input: {
  nome: string;
  email: string;
  password: string;
  role: AdminRole;
  status: UserStatus;
}): Promise<AdminUser> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { user?: AdminUser; error?: string };
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'Não foi possível cadastrar o usuário.');
  }
  return data.user;
}

export async function updateAdminUser(
  id: string,
  input: {
    nome?: string;
    email?: string;
    role?: AdminRole;
    status?: UserStatus;
    newPassword?: string;
  }
): Promise<AdminUser> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { user?: AdminUser; error?: string };
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'Não foi possível atualizar o usuário.');
  }
  return data.user;
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível excluir o usuário.');
  }
}
