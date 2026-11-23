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
  | 'notifications'
  | 'radio'
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
      'notifications',
      'radio',
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
      'notifications',
      'radio',
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
  needsAdminSetup?: boolean;
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

// Mantém o token Bearer apenas em memória JS (cookies HttpOnly/Partitioned mantêm a sessão no servidor)
let inMemoryAuthToken: string | null = null;

export function getStoredAdminToken(): string | null {
  return inMemoryAuthToken;
}

export function setStoredAdminToken(token: string, _remember?: boolean): void {
  inMemoryAuthToken = token;
}

export function clearStoredAdminToken(): void {
  inMemoryAuthToken = null;
}

function buildAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return token
    ? {
        'Content-Type': 'application/json',
        'X-Requested-With': 'ARSBP-Portal',
        Authorization: `Bearer ${token}`,
      }
    : {
        'Content-Type': 'application/json',
        'X-Requested-With': 'ARSBP-Portal',
      };
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
    );
  }
}

async function safeParseApiResponse<T>(res: Response): Promise<T> {
  const rawText = await res.text();
  const trimmed = rawText.trim();

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(`O servidor retornou erro HTTP ${res.status} sem detalhes.`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    if (res.status === 404 || /the page could not be found/i.test(trimmed)) {
      throw new Error(
        'O serviço de autenticação (/api) não está disponível neste endereço (Erro 404). Verifique se você está acessando a URL do aplicativo com servidor ativo.'
      );
    }
    throw new Error(
      `Resposta inesperada do servidor de autenticação (HTTP ${res.status}). Tente novamente em instantes.`
    );
  }
}

export async function fetchAuthSession(): Promise<AdminSessionStatus> {
  try {
    const res = await safeFetch('/api/auth/me', {
      method: 'GET',
      headers: buildAuthHeaders(),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      return { authenticated: false };
    }
    const data = await safeParseApiResponse<AdminSessionStatus>(res);
    if (!data.authenticated) {
      clearStoredAdminToken();
    }
    return data;
  } catch {
    return { authenticated: false };
  }
}

export const fetchAdminSession = fetchAuthSession;

export async function setupInitialAdminAccount(input: {
  nome?: string;
  email: string;
  password: string;
}): Promise<AdminUser> {
  const res = await safeFetch('/api/auth/setup', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });

  const data = await safeParseApiResponse<{
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    admin?: AdminUser;
    error?: string;
  }>(res);

  const createdAdmin = data.user ?? data.admin;
  if (!res.ok || !data.authenticated || !createdAdmin || !data.token) {
    throw new Error(data.error || 'Não foi possível concluir a configuração do administrador.');
  }

  setStoredAdminToken(data.token);
  return createdAdmin;
}

export async function registerUserAccount(
  nome: string,
  email: string,
  password: string,
  remember = true
): Promise<AdminUser> {
  const res = await safeFetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'ARSBP-Portal',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ nome, email, password }),
  });

  const data = await safeParseApiResponse<{
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    error?: string;
  }>(res);

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
  const res = await safeFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'ARSBP-Portal',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password }),
  });

  const data = await safeParseApiResponse<{
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    admin?: AdminUser;
    error?: string;
  }>(res);

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
      headers: {
        'X-Requested-With': 'ARSBP-Portal',
      },
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
  const res = await safeFetch('/api/auth/credentials', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({
      ...input,
      nome: input.displayName,
    }),
  });

  const data = await safeParseApiResponse<{
    authenticated?: boolean;
    token?: string;
    user?: AdminUser;
    admin?: AdminUser;
    error?: string;
  }>(res);

  const updated = data.user ?? data.admin;
  if (!res.ok || !data.authenticated || !updated || !data.token) {
    throw new Error(data.error || 'Não foi possível atualizar as credenciais.');
  }

  setStoredAdminToken(data.token);
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

  const res = await safeFetch(`/api/admin/users?${qs.toString()}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });
  const data = await safeParseApiResponse<UsersListResponse & { error?: string }>(res);
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
  const res = await safeFetch('/api/admin/users', {
    method: 'POST',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });
  const data = await safeParseApiResponse<{ user?: AdminUser; error?: string }>(res);
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
  const res = await safeFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(input),
  });
  const data = await safeParseApiResponse<{ user?: AdminUser; error?: string }>(res);
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'Não foi possível atualizar o usuário.');
  }
  return data.user;
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await safeFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
    credentials: 'same-origin',
  });
  const data = await safeParseApiResponse<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível excluir o usuário.');
  }
}
