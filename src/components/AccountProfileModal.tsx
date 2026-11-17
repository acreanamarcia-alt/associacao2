import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  AdminUser,
  canEnterAdminPanel,
  getRoleDefinition,
  updateAdminCredentials,
} from '../data/adminAuthClient';

interface AccountProfileModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onUserUpdated: (user: AdminUser) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export function AccountProfileModal({
  isOpen,
  user,
  onClose,
  onUserUpdated,
  onLogout,
  onOpenAdmin,
}: AccountProfileModalProps) {
  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !user) return null;

  const roleDef = getRoleDefinition(user.role);
  const canAdmin = canEnterAdminPanel(user.role);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Informe sua senha atual para salvar alterações na conta.');
      return;
    }
    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMsg('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminCredentials({
        currentPassword,
        newEmail: email.trim() || user.email,
        newPassword: newPassword.trim() || undefined,
        displayName: nome.trim() || user.nome,
      });
      onUserUpdated(updated);
      setCurrentPassword('');
      setNewPassword('');
      setSuccessMsg('Seus dados de conta foram atualizados com segurança.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Não foi possível atualizar sua conta.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#D6CEBE] bg-[#FBF9F5] p-6 text-[#1C1917] shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#14532D]/30 bg-white text-[#14532D]">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="account-modal-title"
                className="font-serif text-lg font-semibold text-[#1C1917]"
              >
                Minha Conta
              </h2>
              <p className="text-xs text-[#57534E]">
                {roleDef.label} · Status:{' '}
                <span className="font-semibold text-[#14532D]">
                  {user.status === 'ativo' ? 'Ativa' : 'Inativa'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela da conta"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#D6CEBE] bg-white text-[#57534E] hover:text-[#1C1917]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-[#E2DDD3] bg-white p-3.5 text-xs text-[#57534E]">
          <div className="flex items-center gap-2 font-semibold text-[#1C1917]">
            <ShieldCheck className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
            <span>Escopo do seu nível de acesso</span>
          </div>
          <p className="mt-1 leading-relaxed">{roleDef.description}</p>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-[#78716C]">
            Último acesso:{' '}
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
              : 'Sessão atual'}
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-3.5">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] p-3 text-xs text-[#991B1B]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-[#14532D]/30 bg-[#F0FDF4] p-3 text-xs text-[#14532D]"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="acct-nome" className="block text-xs font-semibold text-[#1C1917]">
              Nome Completo
            </label>
            <input
              id="acct-nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="acct-email" className="block text-xs font-semibold text-[#1C1917]">
              E-mail
            </label>
            <input
              id="acct-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="acct-current-password"
                className="block text-xs font-semibold text-[#1C1917]"
              >
                Senha Atual *
              </label>
              <input
                id="acct-current-password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Confirme sua senha"
                className="mt-1 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="acct-new-password"
                className="block text-xs font-semibold text-[#1C1917]"
              >
                Nova Senha (opcional)
              </label>
              <input
                id="acct-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mín. 6 caracteres"
                className="mt-1 min-h-[40px] w-full rounded-md border border-[#D6CEBE] bg-white px-3 text-sm text-[#1C1917] focus:border-[#14532D] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2DDD3] pt-4">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-[#9A3412]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#9A3412] hover:bg-[#FEF2F2]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Encerrar Sessão</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {canAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md border border-[#14532D] bg-white px-3.5 py-2 text-xs font-semibold text-[#14532D] hover:bg-[#14532D]/5"
                >
                  <span>Abrir Painel</span>
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{saving ? 'Salvando...' : 'Atualizar Dados'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
