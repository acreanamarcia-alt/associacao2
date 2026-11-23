import { CheckCircle2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AccountProfileModal } from './components/AccountProfileModal';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';
import {
  ChristmasGreetingBanner,
  ChristmasSectionDivider,
  ChristmasSnowfall,
} from './components/ChristmasThemeElements';
import {
  CommunityIntelligenceSection,
  IntelligenceTab,
  StudioPresetImage,
} from './components/CommunityIntelligenceSection';
import { CHRISTMAS_ROOT_CLASS, CHRISTMAS_THEME_ENABLED } from './config/christmasTheme';
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
import { RadioBoasNovasBanner } from './components/RadioBoasNovasBanner';
import { TestimonialsSection } from './components/TestimonialsSection';
import { VolunteerHub } from './components/VolunteerHub';
import { WhatsAppButton } from './components/WhatsAppButton';
import {
  AdminUser,
  fetchAdminSession,
  logoutAdmin,
} from './data/adminAuthClient';
import type { DocumentaryFigure } from './data/institutionalData';
import { useVisitorStats } from './data/visitorStore';
import { useLanguage } from './i18n/LanguageContext';

const OPEN_ADMIN_USER: AdminUser = {
  id: 'usr-admin-root',
  nome: 'Diretoria · Projeto Sopão',
  displayName: 'Diretoria · Projeto Sopão',
  email: 'pastorac@gmail.com',
  role: 'admin',
  status: 'ativo',
  active: true,
  isDefaultPassword: false,
  createdAt: '',
  updatedAt: '',
  lastLoginAt: null,
};

export default function App() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'portal' | 'admin'>('portal');
  const [requestedAdminTab, setRequestedAdminTab] = useState<AdminTab | undefined>(undefined);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
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
    try {
      const status = await fetchAdminSession();
      const sessionUser = status.user ?? status.admin ?? null;
      if (status.authenticated && sessionUser) {
        setAdminUser(sessionUser);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    }
  }, []);

  // Restaura sessão opcional ao carregar
  useEffect(() => {
    void checkAdminSession();
  }, [checkAdminSession]);

  // Ativa/desativa a classe global .tema-natal no elemento raiz
  useEffect(() => {
    if (CHRISTMAS_THEME_ENABLED) {
      document.documentElement.classList.add(CHRISTMAS_ROOT_CLASS);
    } else {
      document.documentElement.classList.remove(CHRISTMAS_ROOT_CLASS);
    }
  }, []);

  const handleOpenAdmin = () => {
    setRequestedAdminTab(undefined);
    setViewMode('admin');
  };

  const handleOpenAdminRadio = () => {
    setRequestedAdminTab('radio');
    setViewMode('admin');
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
    return (
      <>
        <AdminDashboard
          adminUser={adminUser ?? OPEN_ADMIN_USER}
          initialTab={requestedAdminTab}
          onLogout={adminUser ? handleAdminLogout : undefined}
          onAdminUpdated={(updated) => setAdminUser(updated)}
          onExitAdmin={() => {
            setRequestedAdminTab(undefined);
            setViewMode('portal');
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917]">
      <ChristmasSnowfall />
      <ChristmasGreetingBanner />
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
        <ChristmasSectionDivider />
        <RadioBoasNovasBanner onOpenAdminRadio={handleOpenAdminRadio} />
        <ChristmasSectionDivider />
        <VolunteerHub />
        <ChristmasSectionDivider />
        <DonationSection
          onOpenDonateModal={openDonateModal}
          onOpenAdmin={handleOpenAdmin}
        />
        <ChristmasSectionDivider />
        <ProductionGallery onEditInStudio={handleEditFigureInStudio} />
        <ChristmasSectionDivider />
        <TestimonialsSection />
        <ChristmasSectionDivider />
        <FaqSection
          onOpenDonate={openDonateModal}
          onJumpToVolunteer={handleJumpToVolunteer}
        />
        <ChristmasSectionDivider />
        <CommunityIntelligenceSection
          requestedTab={requestedTab}
          requestedImage={requestedImage}
          onClearRequestedImage={clearRequestedImage}
        />
        <ChristmasSectionDivider />
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
