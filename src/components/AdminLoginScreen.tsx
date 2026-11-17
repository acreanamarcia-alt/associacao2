import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  AdminUser,
  canEnterAdminPanel,
  loginAdmin,
  registerUserAccount,
} from '../data/adminAuthClient';
import { INSTITUTION_PROFILE, OFFICIAL_ASSETS } from '../data/institutionalData';
import { InstitutionalFooterStrip } from './InstitutionalFooterStrip';

interface AdminLoginScreenProps {
  defaultLoginAvailable?: boolean;
  defaultEmailHint?: string;
  initialMode?: 'login' | 'register';
  onAuthenticated: (user: AdminUser) => void;
  onExitAdmin: () => void;
}

export function AdminLoginScreen({
  defaultLoginAvailable = false,
  defaultEmailHint = 'admin@bompastor.org.br',
  initialMode = 'login',
  onAuthenticated,
  onExitAdmin,
}: AdminLoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login fields
  const [email, setEmail] = useState(defaultLoginAvailable ? defaultEmailHint : '');
  const [password, setPassword] = useState('');

  // Register fields
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showFirstAccessHelp, setShowFirstAccessHelp] = useState(false);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }
    if (!password) {
      setErrorMsg('Informe sua senha de acesso.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginAdmin(cleanEmail, password, rememberSession);
      setSuccessMsg(
        canEnterAdminPanel(user.role)
          ? `Acesso autorizado (${user.role}). Redirecionando para o Painel Administrativo...`
          : `Bem-vindo(a), ${user.nome}. Redirecionando para o Portal...`
      );
      window.setTimeout(() => onAuthenticated(user), 250);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível validar suas credenciais.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNome = regNome.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (cleanNome.length < 3) {
      setErrorMsg('Informe seu nome completo (mínimo 3 caracteres).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await registerUserAccount(
        cleanNome,
        cleanEmail,
        regPassword,
        rememberSession
      );
      setSuccessMsg(
        `Conta criada com perfil Usuário Padrão. Redirecionando ${created.nome} para o Portal...`
      );
      window.setTimeout(() => onAuthenticated(created), 350);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir seu cadastro.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillInitialCredentials = () => {
    setMode('login');
    setEmail(defaultEmailHint || 'admin@bompastor.org.br');
    setPassword('BomPastor@2026');
    setErrorMsg('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Barra superior limpa */}
      <header className="border-b border-[#D6CEBE] bg-[#FBF9F5]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={OFFICIAL_ASSETS.logo}
              alt={`Logo oficial ${INSTITUTION_PROFILE.legalName}`}
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded-full border border-[#14532D]/30 bg-white object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-bold text-[#14532D]">
                {INSTITUTION_PROFILE.legalName}
              </p>
              <p className="text-xs text-[#57534E]">
                Autenticação &amp; Controle de Acesso · {INSTITUTION_PROFILE.popularName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitAdmin}
            className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-semibold text-[#1C1917] transition-colors hover:bg-[#F4F0E8] whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Voltar ao Portal Público</span>
          </button>
        </div>
      </header>

      {/* Conteúdo central de Login e Cadastro */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-xl border border-[#D6CEBE] bg-white p-7 sm:p-9">
          <div className="border-b border-[#E2DDD3] pb-5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
              Controle de Acesso RBAC · CNPJ {INSTITUTION_PROFILE.cnpj}
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#1C1917]">
              {mode === 'login' ? 'Acessar Conta ou Painel' : 'Criar Nova Conta'}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#57534E]">
              {mode === 'login'
                ? 'Administradores e gerentes acessam o painel completo; usuários padrão são direcionados ao portal com sua conta ativa.'
                : 'Cadastre-se gratuitamente para acompanhar sua conta. Novas contas iniciam com o nível Usuário Padrão.'}
            </p>

            {/* Alternador de Modo Login / Cadastro */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-[#F4F0E8] p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`min-h-[38px] cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`min-h-[38px] cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Criar Conta
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] p-3.5 text-xs text-[#991B1B]"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]"
                aria-hidden="true"
              />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mt-5 flex items-start gap-2.5 rounded-md border border-[#14532D]/30 bg-[#F0FDF4] p-3.5 text-xs text-[#14532D]"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="auth-login-email"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  E-mail
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@bompastor.org.br"
                    className="min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] pr-3.5 pl-10 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-login-password"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Senha
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] pr-11 pl-10 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-[#57534E] hover:bg-[#E8E2D5] hover:text-[#1C1917]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#44403C]">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D6CEBE] accent-[#14532D]"
                  />
                  <span>Manter sessão neste dispositivo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>Entrar</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="auth-reg-nome"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  Nome Completo
                </label>
                <div className="relative mt-1.5">
                  <User
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-reg-nome"
                    type="text"
                    autoComplete="name"
                    required
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] pr-3.5 pl-10 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-reg-email"
                  className="block text-xs font-semibold text-[#1C1917]"
                >
                  E-mail
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] pr-3.5 pl-10 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="auth-reg-password"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Senha *
                  </label>
                  <input
                    id="auth-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-reg-confirm"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Confirmar Senha *
                  </label>
                  <input
                    id="auth-reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="mt-1.5 min-h-[44px] w-full rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-[#44403C]">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D6CEBE] accent-[#14532D]"
                  />
                  <span>Mostrar senhas</span>
                </label>

                <span className="inline-flex items-center gap-1 text-[11px] text-[#57534E]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                  <span>Nível: usuario</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F3F22] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    <span>Concluir Cadastro</span>
                  </>
                )}
              </button>
            </form>
          )}

          {defaultLoginAvailable && mode === 'login' && (
            <div className="mt-6 border-t border-[#E2DDD3] pt-4">
              <button
                type="button"
                onClick={() => setShowFirstAccessHelp((prev) => !prev)}
                className="cursor-pointer text-xs font-semibold text-[#14532D] hover:underline"
              >
                {showFirstAccessHelp
                  ? 'Ocultar instruções de primeiro acesso'
                  : 'Primeiro acesso? Consultar credenciais iniciais do administrador'}
              </button>

              {showFirstAccessHelp && (
                <div className="mt-3 space-y-2 rounded-md border border-[#E2DDD3] bg-[#FBF9F5] p-3.5 text-xs text-[#44403C]">
                  <p className="font-semibold text-[#1C1917]">
                    Credenciais iniciais de Administrador (altere após entrar na aba Dados
                    Corporativos):
                  </p>
                  <div className="space-y-1 font-mono text-[11px] tabular-nums text-[#1C1917]">
                    <p>E-mail: {defaultEmailHint || 'admin@bompastor.org.br'}</p>
                    <p>Senha padrão: BomPastor@2026</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillInitialCredentials}
                    className="inline-flex cursor-pointer items-center rounded border border-[#14532D]/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#14532D] hover:bg-[#14532D]/5"
                  >
                    Preencher campos automaticamente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <InstitutionalFooterStrip variant="admin" />
    </div>
  );
}
