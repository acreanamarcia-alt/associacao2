import { ArrowLeft, CheckCircle2, Loader2, LogOut, ShieldAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AccountProfileModal } from './components/AccountProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import {
  CommunityIntelligenceSection,
  IntelligenceTab,
  StudioPresetImage,
} from './components/CommunityIntelligenceSection';
import { DonationModal } from './components/DonationModal';
import { DonationSection } from './components/DonationSection';
import { EbookModal } from './components/EbookModal';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HistoryAndTransparency } from './components/HistoryAndTransparency';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProductionGallery } from './components/ProductionGallery';
import { TestimonialsSection } from './components/TestimonialsSection';
import { VolunteerHub } from './components/VolunteerHub';
import { WhatsAppButton } from './components/WhatsAppButton';
import {
  AdminUser,
  canEnterAdminPanel,
  fetchAdminSession,
  getRoleDefinition,
  logoutAdmin,
} from './data/adminAuthClient';
import type { DocumentaryFigure } from './data/institutionalData';
import { useVisitorStats } from './data/visitorStore';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'portal' | 'admin'>('portal');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [defaultLoginAvailable, setDefaultLoginAvailable] = useState(false);
  const [defaultEmailHint, setDefaultEmailHint] = useState<string | undefined>(undefined);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [portalAuthNotice, setPortalAuthNotice] = useState<string | null>(null);

  const [ebookOpen, setEbookOpen] = useState(false);
  const [ebookMode, setEbookMode] = useState<'viewer' | 'audio'>('viewer');
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [donateInitialTab, setDonateInitialTab] = useState<'pix' | 'monthly' | 'pickup'>('pix');
  const [requestedTab, setRequestedTab] = useState<IntelligenceTab | undefined>(undefined);
  const [requestedImage, setRequestedImage] = useState<StudioPresetImage | null>(null);

  const { stats: visitorStats } = useVisitorStats({ trackHit: true });

  const checkAdminSession = useCallback(async () => {
    setAuthChecking(true);
    try {
      const status = await fetchAdminSession();
      const sessionUser = status.user ?? status.admin ?? null;
      if (status.authenticated && sessionUser) {
        setAdminUser(sessionUser);
      } else {
        setAdminUser(null);
      }
      setDefaultLoginAvailable(Boolean(status.defaultLoginAvailable));
      setDefaultEmailHint(status.defaultEmailHint);
    } catch {
      setAdminUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  // Restaura sessão JWT ao carregar e revalida ao abrir o painel
  useEffect(() => {
    void checkAdminSession();
  }, [checkAdminSession]);

  const handleOpenAdmin = () => {
    setViewMode('admin');
    void checkAdminSession();
  };

  // Redirecionamento inteligente pós-login/cadastro baseado no nível de acesso (RBAC)
  const handleAuthenticated = (user: AdminUser) => {
    setAdminUser(user);
    if (canEnterAdminPanel(user.role)) {
      setPortalAuthNotice(null);
      setViewMode('admin');
    } else {
      setViewMode('portal');
      setPortalAuthNotice(
        `Bem-vindo(a), ${user.nome}! Você entrou com o perfil ${getRoleDefinition(user.role).shortLabel}.`
      );
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setAdminUser(null);
    setAccountModalOpen(false);
    setPortalAuthNotice(null);
    void checkAdminSession();
  };

  const handleJumpToVolunteer = () => {
    const el = document.getElementById('vagas');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openDonateModal = (tab: 'pix' | 'monthly' | 'pickup') => {
    setDonateInitialTab(tab);
    setDonateModalOpen(true);
  };

  const handleEditFigureInStudio = (fig: DocumentaryFigure) => {
    setRequestedTab('studio');
    setRequestedImage({
      src: fig.imageSrc,
      label: `${fig.number} — ${fig.title}`,
    });
    const el = document.getElementById('central-ia');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearRequestedImage = useCallback(() => {
    setRequestedImage(null);
  }, []);

  if (viewMode === 'admin') {
    if (authChecking && !adminUser) {
      return (
        <>
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF9F5] px-6 text-[#1C1917]">
            <Loader2 className="h-7 w-7 animate-spin text-[#14532D]" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-[#57534E]">
              Verificando sessão e permissões de acesso...
            </p>
          </div>
          <OfflineIndicator />
        </>
      );
    }

    if (!adminUser) {
      return (
        <>
          <AdminLoginScreen
            defaultLoginAvailable={defaultLoginAvailable}
            defaultEmailHint={defaultEmailHint}
            onAuthenticated={handleAuthenticated}
            onExitAdmin={() => setViewMode('portal')}
          />
          <OfflineIndicator />
        </>
      );
    }

    // Proteção de rota no frontend: bloqueia role "usuario" de entrar no Painel Administrativo
    if (!canEnterAdminPanel(adminUser.role)) {
      return (
        <>
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF9F5] px-6 text-[#1C1917]">
            <div className="w-full max-w-md rounded-xl border border-[#D6CEBE] bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#9A3412]/30 bg-[#FEF2F2] text-[#9A3412]">
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-4 font-serif text-xl font-semibold text-[#1C1917]">
                Acesso Restrito à Administração
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
                A conta <span className="font-mono font-medium">{adminUser.email}</span> está
                cadastrada com o nível <strong>Usuário Padrão (usuario)</strong>, que possui acesso
                apenas ao portal público e aos próprios dados.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('portal')}
                  className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Voltar ao Portal Público</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#F4F0E8]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sair e entrar com conta administrativa</span>
                </button>
              </div>
            </div>
          </div>
          <OfflineIndicator />
        </>
      );
    }

    return (
      <>
        <AdminDashboard
          adminUser={adminUser}
          onLogout={handleAdminLogout}
          onAdminUpdated={(updated) => setAdminUser(updated)}
          onExitAdmin={() => setViewMode('portal')}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917]">
      <Header
        authUser={adminUser}
        onOpenAdmin={handleOpenAdmin}
        onOpenAccount={() => setAccountModalOpen(true)}
        onJumpToVolunteer={handleJumpToVolunteer}
      />

      {portalAuthNotice && (
        <div
          role="status"
          className="border-b border-[#14532D]/20 bg-[#F0FDF4] px-6 py-2.5 text-xs text-[#14532D]"
        >
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{portalAuthNotice}</span>
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="cursor-pointer font-semibold underline underline-offset-2"
              >
                {t.portalAuth.viewAccount}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPortalAuthNotice(null)}
              aria-label={t.portalAuth.closeNotice}
              className="cursor-pointer rounded p-1 hover:bg-[#DCFCE7]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main>
        <HeroSection
          onOpenEbook={() => {
            setEbookMode('viewer');
            setEbookOpen(true);
          }}
          onOpenAudioPdf={() => {
            setEbookMode('audio');
            setEbookOpen(true);
          }}
          onJumpToVolunteer={handleJumpToVolunteer}
          onOpenDonate={() => openDonateModal('pix')}
          totalVisits={visitorStats.totalVisits}
          uniqueVisitors={visitorStats.uniqueVisitors}
        />
        <VolunteerHub />
        <DonationSection
          onOpenDonateModal={openDonateModal}
          onOpenAdmin={handleOpenAdmin}
        />
        <ProductionGallery onEditInStudio={handleEditFigureInStudio} />
        <TestimonialsSection />
        <FaqSection
          onOpenDonate={openDonateModal}
          onJumpToVolunteer={handleJumpToVolunteer}
        />
        <CommunityIntelligenceSection
          requestedTab={requestedTab}
          requestedImage={requestedImage}
          onClearRequestedImage={clearRequestedImage}
        />
        <HistoryAndTransparency
          onOpenEbook={() => {
            setEbookMode('viewer');
            setEbookOpen(true);
          }}
        />
      </main>

      <Footer
        onOpenEbook={() => {
          setEbookMode('viewer');
          setEbookOpen(true);
        }}
        onOpenAdmin={handleOpenAdmin}
      />

      <AccountProfileModal
        isOpen={accountModalOpen}
        user={adminUser}
        onClose={() => setAccountModalOpen(false)}
        onUserUpdated={(updated) => setAdminUser(updated)}
        onLogout={handleAdminLogout}
        onOpenAdmin={() => setViewMode('admin')}
      />

      <EbookModal
        isOpen={ebookOpen}
        initialMode={ebookMode}
        onClose={() => setEbookOpen(false)}
      />

      <DonationModal
        isOpen={donateModalOpen}
        initialTab={donateInitialTab}
        onClose={() => setDonateModalOpen(false)}
      />

      <WhatsAppButton variant="floating" />
      <OfflineIndicator />
    </div>
  );
}
