import {
  ArrowLeft,
  ArrowUpRight,
  BookMarked,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  HeartHandshake,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AssistedPersonStatus,
  formatCpf,
  useAssistedPeopleStore,
} from '../data/assistedPeopleStore';
import {
  AccountingKind,
  buildAllDonationsAndPickupsWhatsappUrl,
  buildAllDonationsWhatsappUrl,
  buildAllPickupsWhatsappUrl,
  buildDonationReceiptWhatsappUrl,
  buildMonthlyDonorWhatsappUrl,
  buildPickupWhatsappUrl,
  DonationProductItem,
  DonationStatus,
  DonationType,
  MonthlyDonorStatus,
  PickupItemSelection,
  PickupStatus,
  PIX_INFO,
  ProductCategory,
  useDonationsStore,
} from '../data/donationsStore';
import {
  INSTITUTION_PROFILE,
  INSTITUTION_SPECS,
  OFFICIAL_ASSETS,
  VOLUNTEER_ROLES,
} from '../data/institutionalData';
import {
  AdminUser,
  fetchAdminUsers,
  getRoleDefinition,
  hasTabAccess,
  updateAdminCredentials,
} from '../data/adminAuthClient';
import { useVisitorStats } from '../data/visitorStore';
import { useVolunteersStore } from '../data/volunteersStore';
import {
  DashboardPdfCategories,
  exportReportElementToPdf,
  formatReferenceMonthLabel,
  generateDashboardPdfReport,
  generateUsersAndVolunteersImpactPdf,
  matchesReferenceMonth,
} from '../utils/dashboardPdfReport';
import { AdminAccessControlPanel } from './AdminAccessControlPanel';
import { AdminGlobalSearchBar } from './AdminGlobalSearchBar';
import { DashboardReportPrintable } from './DashboardReportPrintable';
import { EditaisCollectorPanel } from './EditaisCollectorPanel';
import { InstitutionalFooterStrip } from './InstitutionalFooterStrip';
import { MonthlyDonationsChart } from './MonthlyDonationsChart';
import { PWAInstallButton } from './PWAInstallButton';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  adminUser?: AdminUser | null;
  onLogout?: () => void;
  onAdminUpdated?: (user: AdminUser) => void;
}

type AdminTab =
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

export function AdminDashboard({
  onExitAdmin,
  adminUser,
  onLogout,
  onAdminUpdated,
}: AdminDashboardProps) {
  const {
    products,
    donations,
    pickups,
    monthlyDonors,
    accountingEntries,
    addDonation,
    updateDonationStatus,
    deleteDonation,
    addMonthlyDonor,
    confirmMonthlyDonorPayment,
    updateMonthlyDonorStatus,
    deleteMonthlyDonor,
    addAccountingEntry,
    toggleReconcileEntry,
    deleteAccountingEntry,
    addPickupSchedule,
    updatePickupStatus,
    addProductItem,
    updateProductItem,
    resetAllFinancialData,
  } = useDonationsStore();

  const {
    assistedPeople,
    addAssistedPerson,
    updateAssistedPersonStatus,
    deleteAssistedPerson,
  } = useAssistedPeopleStore();
  const { applications: volunteerApplications, removeApplication } = useVolunteersStore();
  const { stats: visitorStats } = useVisitorStats();

  const roleDef = getRoleDefinition(adminUser?.role);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const safeActiveTab: AdminTab = hasTabAccess(adminUser?.role, activeTab)
    ? activeTab
    : 'overview';
  const [confirmResetFinancial, setConfirmResetFinancial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | DonationStatus>('Todas');
  const [typeFilter, setTypeFilter] = useState<'Todos' | DonationType>('Todos');

  // Security & Credentials state
  const [secCurrentPassword, setSecCurrentPassword] = useState('');
  const [secNewEmail, setSecNewEmail] = useState(
    adminUser?.email ?? 'admin@bompastor.org.br'
  );
  const [secDisplayName, setSecDisplayName] = useState(
    adminUser?.nome ?? adminUser?.displayName ?? 'Diretoria · Projeto Sopão'
  );
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [secSaving, setSecSaving] = useState(false);
  const [secError, setSecError] = useState('');
  const [secSuccess, setSecSuccess] = useState('');

  // Assisted people state
  const [assistedSearch, setAssistedSearch] = useState('');
  const [assistedStatusFilter, setAssistedStatusFilter] = useState<
    'Todas' | AssistedPersonStatus
  >('Todas');
  const [assistFullName, setAssistFullName] = useState('');
  const [assistCpf, setAssistCpf] = useState('');
  const [assistEmail, setAssistEmail] = useState('');
  const [assistPhone, setAssistPhone] = useState('');
  const [assistNeighborhood, setAssistNeighborhood] = useState('');
  const [assistHouseholdSize, setAssistHouseholdSize] = useState('1');
  const [assistNotes, setAssistNotes] = useState('');
  const [assistError, setAssistError] = useState('');

  // PDF Report category selection, monthly scope & html2canvas refs
  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const reportOffscreenRef = useRef<HTMLDivElement>(null);
  const [systemUsers, setSystemUsers] = useState<AdminUser[]>([]);
  const [reportMonth, setReportMonth] = useState<string>('all');
  const [pdfCategories, setPdfCategories] = useState<DashboardPdfCategories>({
    donations: true,
    volunteers: true,
    users: true,
    revenues: true,
    donatedFoods: true,
    pickupsCount: true,
    assistedPeople: true,
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');

  useEffect(() => {
    if (!adminUser) return;
    let cancelled = false;
    fetchAdminUsers({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!cancelled) {
          setSystemUsers(res.users);
        }
      })
      .catch(() => {
        // Ignora silenciosamente caso usuário não tenha permissão de leitura
      });
    return () => {
      cancelled = true;
    };
  }, [adminUser, safeActiveTab]);

  // Monthly Donors filters & form
  const [monthlyFilter, setMonthlyFilter] = useState<'Todos' | MonthlyDonorStatus>('Todos');
  const [monthlySearch, setMonthlySearch] = useState('');
  const [showNewMonthlyForm, setShowNewMonthlyForm] = useState(false);
  const [mdName, setMdName] = useState('');
  const [mdEmail, setMdEmail] = useState('');
  const [mdPhone, setMdPhone] = useState('');
  const [mdAmount, setMdAmount] = useState('50');
  const [mdDueDay, setMdDueDay] = useState(10);
  const [mdPixChannel, setMdPixChannel] = useState<
    'CNPJ 33.314.701/0001-54' | 'Telefone +55 68 9958-7200'
  >('Telefone +55 68 9958-7200');
  const [mdPaidNow, setMdPaidNow] = useState(false);

  // Accounting filters & form
  const [accKindFilter, setAccKindFilter] = useState<'Todos' | AccountingKind>('Todos');
  const [accSearch, setAccSearch] = useState('');
  const [showNewAccForm, setShowNewAccForm] = useState(false);
  const [accKind, setAccKind] = useState<AccountingKind>('Entrada');
  const [accCategory, setAccCategory] = useState('Doação Avulsa PIX');
  const [accDescription, setAccDescription] = useState('');
  const [accAmount, setAccAmount] = useState('');
  const [accDate, setAccDate] = useState(new Date().toISOString().slice(0, 10));
  const [accRefCode, setAccRefCode] = useState('');

  // Manual donation receipt form
  const [showNewReceiptForm, setShowNewReceiptForm] = useState(false);
  const [newDonorName, setNewDonorName] = useState('');
  const [newDonorEmail, setNewDonorEmail] = useState('');
  const [newDonorPhone, setNewDonorPhone] = useState('');
  const [newDonationType, setNewDonationType] = useState<DonationType>('PIX');
  const [newAmountBRL, setNewAmountBRL] = useState('');
  const [newItemsSummary, setNewItemsSummary] = useState('');
  const [newDonationNotes, setNewDonationNotes] = useState('');

  // Admin pickup schedule creation state
  const [showNewPickupForm, setShowNewPickupForm] = useState(false);
  const [collabName, setCollabName] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabPhone, setCollabPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('2026-11-20');
  const [preferredShift, setPreferredShift] = useState<
    'Manhã (08h–12h)' | 'Tarde (14h–18h)' | 'Sábado (08h–12h)'
  >('Manhã (08h–12h)');
  const [pickupQuantities, setPickupQuantities] = useState<Record<string, number>>({});
  const [pickupCustomItems, setPickupCustomItems] = useState('');

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newProductCat, setNewProductCat] = useState<ProductCategory>('Insumos do Sopão');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductPriority, setNewProductPriority] =
    useState<DonationProductItem['priority']>('Prioritário');
  const [newProductTarget, setNewProductTarget] = useState('50');

  const metrics = useMemo(() => {
    const confirmedBRL = donations
      .filter((d) => d.status === 'Recebida' && typeof d.amountBRL === 'number')
      .reduce((acc, d) => acc + (d.amountBRL ?? 0), 0);

    const pendingBRL = donations
      .filter(
        (d) =>
          (d.status === 'Pendente' || d.status === 'Em Conferência') &&
          typeof d.amountBRL === 'number'
      )
      .reduce((acc, d) => acc + (d.amountBRL ?? 0), 0);

    const receivedCount = donations.filter((d) => d.status === 'Recebida').length;
    const pendingPickups = pickups.filter(
      (p) => p.status === 'Agendada' || p.status === 'Em Rota'
    ).length;

    const totalProductUnits = products.reduce((acc, p) => acc + p.receivedQty, 0);

    const activeMonthly = monthlyDonors.filter((m) => m.status !== 'Pausado');
    const monthlyExpectedMRR = activeMonthly.reduce((acc, m) => acc + m.monthlyAmountBRL, 0);
    const monthlyPaidCount = monthlyDonors.filter((m) => m.status === 'Em dia').length;

    const totalEntradas = accountingEntries
      .filter((a) => a.kind === 'Entrada')
      .reduce((acc, a) => acc + a.amountBRL, 0);
    const totalSaidas = accountingEntries
      .filter((a) => a.kind === 'Saída')
      .reduce((acc, a) => acc + a.amountBRL, 0);
    const netBalance = totalEntradas - totalSaidas;
    const reconciledCount = accountingEntries.filter((a) => a.reconciled).length;

    const byType = {
      pix: donations.filter((d) => d.type === 'PIX' || d.type === 'PIX Mensal').length,
      gateway: donations.filter((d) => d.type === 'Gateway Cartão/Boleto').length,
      products: donations.filter((d) => d.type === 'Produtos').length,
    };

    return {
      confirmedBRL,
      pendingBRL,
      receivedCount,
      pendingPickups,
      totalProductUnits,
      activeMonthlyCount: activeMonthly.length,
      monthlyExpectedMRR,
      monthlyPaidCount,
      totalEntradas,
      totalSaidas,
      netBalance,
      reconciledCount,
      byType,
    };
  }, [donations, pickups, products, monthlyDonors, accountingEntries]);

  const filteredDonations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return donations.filter((d) => {
      const matchesStatus = statusFilter === 'Todas' || d.status === statusFilter;
      const matchesType = typeFilter === 'Todos' || d.type === typeFilter;
      const matchesQuery =
        !q ||
        d.donorName.toLowerCase().includes(q) ||
        d.referenceCode.toLowerCase().includes(q) ||
        (d.itemsSummary ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesType && matchesQuery;
    });
  }, [donations, statusFilter, typeFilter, searchQuery]);

  const filteredMonthlyDonors = useMemo(() => {
    const q = monthlySearch.trim().toLowerCase();
    return monthlyDonors.filter((m) => {
      const matchesStatus = monthlyFilter === 'Todos' || m.status === monthlyFilter;
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q);
      return matchesStatus && matchesQ;
    });
  }, [monthlyDonors, monthlyFilter, monthlySearch]);

  const filteredAccounting = useMemo(() => {
    const q = accSearch.trim().toLowerCase();
    return accountingEntries.filter((a) => {
      const matchesKind = accKindFilter === 'Todos' || a.kind === accKindFilter;
      const matchesQ =
        !q ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.referenceCode.toLowerCase().includes(q);
      return matchesKind && matchesQ;
    });
  }, [accountingEntries, accKindFilter, accSearch]);

  const handleExportAccountingCsv = () => {
    const header = ['Data', 'Tipo', 'Categoria', 'Descricao', 'Documento', 'Valor_BRL', 'Conciliado'];
    const rows = filteredAccounting.map((a) => [
      a.date,
      a.kind,
      `"${a.category.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      a.referenceCode,
      (a.kind === 'Saída' ? -a.amountBRL : a.amountBRL).toFixed(2),
      a.reconciled ? 'Sim' : 'Nao',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balancete-contabil-bom-pastor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredAssistedPeople = useMemo(() => {
    const q = assistedSearch.trim().toLowerCase();
    const qDigits = assistedSearch.replace(/\D/g, '');
    return assistedPeople.filter((p) => {
      const matchesStatus = assistedStatusFilter === 'Todas' || p.status === assistedStatusFilter;
      const cpfDigits = (p.cpf ?? '').replace(/\D/g, '');
      const matchesQ =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        (p.cpf ?? '').toLowerCase().includes(q) ||
        (Boolean(qDigits) && cpfDigits.includes(qDigits)) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.neighborhood ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesQ;
    });
  }, [assistedPeople, assistedStatusFilter, assistedSearch]);

  const completedPickupsCount = useMemo(
    () => pickups.filter((p) => p.status === 'Coletada').length,
    [pickups]
  );

  const handleDownloadPdf = async (
    customCategories?: DashboardPdfCategories,
    mode: 'html2canvas' | 'autotable' = 'html2canvas'
  ) => {
    const cats = customCategories ?? pdfCategories;
    const anySelected = Object.values(cats).some(Boolean);
    if (!anySelected) {
      setPdfNotice('Selecione ao menos uma categoria para gerar o arquivo PDF.');
      return;
    }

    const generatedBy = adminUser?.nome || adminUser?.displayName;

    if (mode === 'autotable') {
      setPdfNotice('');
      generateDashboardPdfReport({
        donations,
        accountingEntries,
        monthlyDonors,
        products,
        pickups,
        volunteerApplications,
        systemUsers,
        assistedPeople,
        visitorStats,
        categories: cats,
        referenceMonth: reportMonth,
        generatedBy,
      });
      setPdfNotice(
        `Relatório PDF vetorial (${formatReferenceMonthLabel(reportMonth)}) gerado e baixado com sucesso!`
      );
      return;
    }

    const targetEl =
      safeActiveTab === 'reports' ? reportPreviewRef.current : reportOffscreenRef.current;

    if (!targetEl) {
      generateDashboardPdfReport({
        donations,
        accountingEntries,
        monthlyDonors,
        products,
        pickups,
        volunteerApplications,
        systemUsers,
        assistedPeople,
        visitorStats,
        categories: cats,
        referenceMonth: reportMonth,
        generatedBy,
      });
      setPdfNotice('Relatório PDF gerado e baixado com sucesso!');
      return;
    }

    setIsGeneratingPdf(true);
    setPdfNotice('');
    try {
      const monthSuffix =
        reportMonth && reportMonth !== 'all'
          ? reportMonth
          : new Date().toISOString().slice(0, 10);
      await exportReportElementToPdf(targetEl, {
        filename: `relatorio-dashboard-bom-pastor-${monthSuffix}.pdf`,
      });
      setPdfNotice(
        `Relatório PDF (${formatReferenceMonthLabel(reportMonth)}) gerado e baixado com sucesso!`
      );
    } catch (err) {
      setPdfNotice(
        `Não foi possível capturar a pré-visualização visual (${
          err instanceof Error ? err.message : 'erro inesperado'
        }). Tente o botão PDF Vetorial.`
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadUsersAndVolunteersPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfNotice('');
    try {
      let latestUsers = systemUsers;
      try {
        const res = await fetchAdminUsers({ page: 1, pageSize: 100 });
        latestUsers = res.users;
        setSystemUsers(res.users);
      } catch {
        // Fallback para lista em memória
      }

      generateUsersAndVolunteersImpactPdf({
        systemUsers: latestUsers,
        volunteerApplications,
        assistedPeople,
        donations,
        pickups,
        visitorStats,
        referenceMonth: reportMonth,
        generatedBy: adminUser?.nome || adminUser?.displayName,
      });

      setPdfNotice(
        `Relatório Mensal de Impacto: Usuários & Voluntários (${formatReferenceMonthLabel(reportMonth)}) exportado em PDF!`
      );
    } catch (err) {
      setPdfNotice(
        err instanceof Error
          ? err.message
          : 'Erro ao exportar relatório PDF de usuários e voluntários.'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddAssistedSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = assistFullName.trim();
    const trimmedEmail = assistEmail.trim();
    const trimmedPhone = assistPhone.trim();

    if (trimmedName.length < 3) {
      setAssistError('Informe o nome completo da pessoa assistida.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setAssistError('Informe um e-mail válido para contato.');
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 8) {
      setAssistError('Informe um telefone ou WhatsApp válido com DDD.');
      return;
    }

    addAssistedPerson({
      fullName: trimmedName,
      cpf: assistCpf.trim() || undefined,
      email: trimmedEmail,
      phone: trimmedPhone,
      neighborhood: assistNeighborhood.trim() || 'Plácido de Castro - AC',
      householdSize: Math.max(1, Number(assistHouseholdSize) || 1),
      notes: assistNotes.trim(),
    });

    setAssistError('');
    setAssistFullName('');
    setAssistCpf('');
    setAssistEmail('');
    setAssistPhone('');
    setAssistNeighborhood('');
    setAssistHouseholdSize('1');
    setAssistNotes('');
  };

  const handleExportAssistedCsv = () => {
    const header = ['Data_Cadastro', 'Nome', 'CPF', 'Email', 'Telefone', 'Bairro', 'Pessoas_Familia', 'Status', 'Observacoes'];
    const rows = filteredAssistedPeople.map((p) => [
      p.createdAt,
      `"${p.fullName.replace(/"/g, '""')}"`,
      p.cpf ?? '',
      p.email,
      p.phone,
      `"${(p.neighborhood ?? '').replace(/"/g, '""')}"`,
      String(p.householdSize ?? 1),
      p.status,
      `"${(p.notes ?? '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pessoas-assistidas-bom-pastor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (safeActiveTab === 'accounting') {
      handleExportAccountingCsv();
      return;
    }
    if (safeActiveTab === 'assisted') {
      handleExportAssistedCsv();
      return;
    }
    const header = [
      'Protocolo',
      'Data',
      'Colaborador',
      'Email',
      'Telefone',
      'Tipo',
      'Valor_BRL',
      'Itens',
      'Status',
    ];
    const rows = filteredDonations.map((d) => [
      d.referenceCode,
      d.createdAt,
      `"${d.donorName.replace(/"/g, '""')}"`,
      d.donorEmail,
      d.donorPhone,
      d.type,
      d.amountBRL ? d.amountBRL.toFixed(2) : '',
      `"${(d.itemsSummary ?? '').replace(/"/g, '""')}"`,
      d.status,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doacoes-recanto-bom-pastor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddManualReceipt = (e: FormEvent) => {
    e.preventDefault();
    addDonation({
      donorName: newDonorName.trim(),
      donorEmail: newDonorEmail.trim() || 'nao-informado@local.org',
      donorPhone: newDonorPhone.trim() || '(68) não informado',
      type: newDonationType,
      amountBRL:
        newDonationType !== 'Produtos' ? Number(newAmountBRL.replace(',', '.')) || 0 : undefined,
      itemsSummary: newDonationType === 'Produtos' ? newItemsSummary.trim() : undefined,
      status: 'Recebida',
      notes: newDonationNotes.trim() || 'Recebimento registrado manualmente pela administração.',
    });
    setNewDonorName('');
    setNewDonorEmail('');
    setNewDonorPhone('');
    setNewAmountBRL('');
    setNewItemsSummary('');
    setNewDonationNotes('');
    setShowNewReceiptForm(false);
  };

  const handleAddMonthlyDonorSubmit = (e: FormEvent) => {
    e.preventDefault();
    addMonthlyDonor({
      name: mdName.trim(),
      email: mdEmail.trim() || 'nao-informado@local.org',
      phone: mdPhone.trim(),
      monthlyAmountBRL: Math.max(10, Number(mdAmount.replace(',', '.')) || 50),
      dueDay: mdDueDay,
      pixChannel: mdPixChannel,
      paidFirstMonthNow: mdPaidNow,
    });
    setMdName('');
    setMdEmail('');
    setMdPhone('');
    setMdAmount('50');
    setMdPaidNow(false);
    setShowNewMonthlyForm(false);
  };

  const handleAddAccountingSubmit = (e: FormEvent) => {
    e.preventDefault();
    addAccountingEntry({
      date: accDate,
      kind: accKind,
      category: accCategory.trim(),
      description: accDescription.trim(),
      amountBRL: Math.max(0.01, Number(accAmount.replace(',', '.')) || 0),
      referenceCode: accRefCode.trim(),
      reconciled: true,
    });
    setAccDescription('');
    setAccAmount('');
    setAccRefCode('');
    setShowNewAccForm(false);
  };

  const handleAdminCreatePickup = (e: FormEvent) => {
    e.preventDefault();
    const selectedItems: PickupItemSelection[] = products
      .filter((p) => p.active && (pickupQuantities[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: pickupQuantities[p.id],
        unit: p.unit,
      }));

    addPickupSchedule({
      collaboratorName: collabName.trim(),
      collaboratorEmail: collabEmail.trim(),
      collaboratorPhone: collabPhone.trim(),
      pickupAddress: pickupAddress.trim(),
      preferredDate,
      preferredShift,
      items: selectedItems,
      customItemsText: pickupCustomItems.trim(),
    });

    setCollabName('');
    setCollabEmail('');
    setCollabPhone('');
    setPickupAddress('');
    setPickupQuantities({});
    setPickupCustomItems('');
    setShowNewPickupForm(false);
  };

  const handleAddProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    addProductItem({
      name: newProductName.trim(),
      category: newProductCat,
      unit: newProductUnit.trim() || 'kg',
      priority: newProductPriority,
      targetQty: Math.max(1, Number(newProductTarget) || 50),
    });
    setNewProductName('');
  };

  const handleUpdateCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setSecError('');
    setSecSuccess('');

    if (!secCurrentPassword) {
      setSecError('Informe sua senha atual para autorizar a alteração.');
      return;
    }
    if (secNewPassword && secNewPassword.length < 6) {
      setSecError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (secNewPassword !== secConfirmPassword) {
      setSecError('A confirmação da nova senha não confere.');
      return;
    }

    setSecSaving(true);
    try {
      const updated = await updateAdminCredentials({
        currentPassword: secCurrentPassword,
        newEmail: secNewEmail,
        newPassword: secNewPassword || undefined,
        displayName: secDisplayName,
      });
      onAdminUpdated?.(updated);
      setSecCurrentPassword('');
      setSecNewPassword('');
      setSecConfirmPassword('');
      setSecSuccess(
        'Credenciais administrativas atualizadas e salvas com segurança.'
      );
    } catch (err) {
      setSecError(
        err instanceof Error
          ? err.message
          : 'Erro ao atualizar credenciais administrativas.'
      );
    } finally {
      setSecSaving(false);
    }
  };

  const tabTitle: Record<AdminTab, string> = {
    overview: 'Dashboard & Contabilidade Geral',
    receipts: 'Controle de Recebimento de Doações',
    'monthly-donors': 'Banco de Doadores Mensais (PIX)',
    accounting: 'Contabilidade & Balancete',
    pickups: 'Agendamento de Coleta de Doações',
    products: 'Lista de Produtos para Recebimento',
    assisted: 'Cadastro de Pessoas Assistidas',
    reports: 'Relatórios em PDF do Dashboard',
    editais: 'Coleta de Editais (CNAE & TJAC)',
    users: 'Usuários & Níveis de Acesso (RBAC)',
    corporate: 'Dados Corporativos & Localização da Sede',
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Left Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white lg:flex">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
            <img
              src={OFFICIAL_ASSETS.logo}
              alt="Logo Projeto Sopão Acre"
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded-full border border-[#14532D]/30 bg-white object-cover"
            />
            <div className="min-w-0">
              <p className="font-serif text-sm font-bold leading-snug text-[#14532D]">
                Associação Recanto Social Bom Pastor
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Painel · {roleDef.shortLabel}
              </p>
            </div>
          </div>

          <nav aria-label="Menu do painel administrativo" className="space-y-1 p-3">
            {hasTabAccess(adminUser?.role, 'overview') && (
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'overview'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dashboard Geral</span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'accounting') && (
              <button
                type="button"
                onClick={() => setActiveTab('accounting')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'accounting'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookMarked className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Contabilidade</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {accountingEntries.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'monthly-donors') && (
              <button
                type="button"
                onClick={() => setActiveTab('monthly-donors')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'monthly-donors'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Doadores Mensais</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {monthlyDonors.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'receipts') && (
              <button
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'receipts'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Recebimento de Doações</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {donations.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'pickups') && (
              <button
                type="button"
                onClick={() => setActiveTab('pickups')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'pickups'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Agendamento de Coleta</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {pickups.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'products') && (
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'products'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Lista de Produtos</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {products.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'assisted') && (
              <button
                type="button"
                onClick={() => setActiveTab('assisted')}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'assisted'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Pessoas Assistidas</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums opacity-80">
                  {assistedPeople.length}
                </span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'reports') && (
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'reports'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Relatórios PDF</span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'editais') && (
              <button
                type="button"
                onClick={() => setActiveTab('editais')}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'editais'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Editais</span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'users') && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'users'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCog className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Usuários &amp; Acessos</span>
              </button>
            )}

            {hasTabAccess(adminUser?.role, 'corporate') && (
              <button
                type="button"
                onClick={() => setActiveTab('corporate')}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  safeActiveTab === 'corporate'
                    ? 'bg-[#14532D] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dados Corporativos</span>
              </button>
            )}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="rounded-md border border-[#14532D]/20 bg-[#14532D]/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#14532D]">
              Visitantes do Portal
            </p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
              {visitorStats.totalVisits.toLocaleString('pt-BR')} visitas
            </p>
            <p className="font-mono text-[11px] tabular-nums text-slate-500">
              {visitorStats.uniqueVisitors.toLocaleString('pt-BR')} visitantes únicos
            </p>
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="font-medium text-slate-800">Chaves PIX Oficiais</p>
            <p className="font-mono tabular-nums">CNPJ: {PIX_INFO.pixKey}</p>
            <p className="font-mono tabular-nums">Tel: {PIX_INFO.pixPhoneDisplay}</p>
          </div>
          <PWAInstallButton variant="sidebar" />
          {adminUser && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
              <p className="font-semibold text-slate-800 truncate">
                {adminUser.nome || adminUser.displayName}
              </p>
              <p className="text-slate-500 truncate">{adminUser.email}</p>
              <p className="mt-0.5 font-mono text-[10px] text-[#14532D]">
                Nível: {roleDef.shortLabel} ({adminUser.role})
              </p>
            </div>
          )}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onExitAdmin}
              className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Voltar ao Portal Público</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-[38px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#9A3412]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#9A3412] hover:bg-[#FEF2F2]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Encerrar Sessão</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">
              Administração / {roleDef.shortLabel} / {tabTitle[safeActiveTab]}
            </p>
            <h1 className="font-serif text-xl font-semibold text-slate-900">
              {tabTitle[safeActiveTab]}
            </h1>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
            <AdminGlobalSearchBar
              assistedPeople={assistedPeople}
              volunteerApplications={volunteerApplications}
              onSelectAssisted={(person) => {
                setAssistedStatusFilter('Todas');
                setAssistedSearch(person.cpf || person.fullName);
                setActiveTab('assisted');
              }}
              onSelectVolunteer={() => {
                setActiveTab('reports');
              }}
            />
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Portal</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-[#9A3412]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#FEF2F2] lg:hidden"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sair</span>
              </button>
            )}

            {roleDef.canResetFinancial &&
              (confirmResetFinancial ? (
                <div className="flex items-center gap-1.5 rounded-md border border-[#9A3412]/40 bg-[#FEF2F2] px-2.5 py-1">
                  <span className="text-[11px] font-medium text-[#9A3412]">
                    Zerar todos os valores?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllFinancialData();
                      setConfirmResetFinancial(false);
                    }}
                    className="cursor-pointer rounded bg-[#9A3412] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#7C2D12]"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetFinancial(false)}
                    className="cursor-pointer rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmResetFinancial(true)}
                  className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#9A3412]" aria-hidden="true" />
                  <span>Zerar Valores</span>
                </button>
              ))}

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={() =>
                handleDownloadPdf({
                  donations: true,
                  volunteers: true,
                  users: true,
                  revenues: true,
                  donatedFoods: true,
                  pickupsCount: true,
                  assistedPeople: true,
                })
              }
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FBF9F5] px-3.5 py-1.5 text-xs font-semibold text-[#14532D] hover:bg-[#14532D] hover:text-white whitespace-nowrap shrink-0 transition-colors disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Relatório PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {safeActiveTab === 'accounting'
                  ? 'Exportar Balancete CSV'
                  : safeActiveTab === 'assisted'
                    ? 'Exportar Assistidas CSV'
                    : 'Exportar CSV'}
              </span>
            </button>

            {hasTabAccess(adminUser?.role, 'accounting') && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('accounting');
                  setShowNewAccForm(true);
                }}
                className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Novo Lançamento Contábil</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-100 p-2 lg:hidden">
          {(
            [
              ['overview', 'Dashboard'],
              ['accounting', 'Contabilidade'],
              ['monthly-donors', 'Mensalistas'],
              ['receipts', 'Recebimentos'],
              ['pickups', 'Coletas'],
              ['products', 'Produtos'],
              ['assisted', 'Assistidas'],
              ['reports', 'Relatórios PDF'],
              ['editais', 'Editais TJAC'],
              ['users', 'Usuários & RBAC'],
              ['corporate', 'Corporativo'],
            ] as Array<[AdminTab, string]>
          )
            .filter(([id]) => hasTabAccess(adminUser?.role, id))
            .map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                  safeActiveTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
        </div>

        <main className="flex-1 space-y-6 p-6">
          {adminUser?.isDefaultPassword && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span>
                  Você acessou com a senha inicial padrão. Recomendamos definir sua própria
                  senha administrativa.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('corporate')}
                className="cursor-pointer rounded bg-amber-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800"
              >
                Alterar E-mail e Senha
              </button>
            </div>
          )}

          {/* KPI Summary Strip (Visitors + Accounting + Monthly Donors + Operations) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-lg border border-[#14532D]/30 bg-[#14532D] p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/80">Contador de Visitantes</p>
                <Eye className="h-4 w-4 text-white/80" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
                {visitorStats.totalVisits.toLocaleString('pt-BR')}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-white/80">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{visitorStats.uniqueVisitors.toLocaleString('pt-BR')} visitantes únicos</span>
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Saldo Líquido Contábil</p>
              <p
                className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                  metrics.netBalance >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                R$ {metrics.netBalance.toFixed(2).replace('.', ',')}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                Entradas R$ {metrics.totalEntradas.toFixed(2).replace('.', ',')} · Saídas R${' '}
                {metrics.totalSaidas.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Receita Mensal Recorrente (PIX)</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#14532D]">
                R$ {metrics.monthlyExpectedMRR.toFixed(2).replace('.', ',')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.activeMonthlyCount} doadores ativos ({metrics.monthlyPaidCount} em dia)
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Doações em Conferência</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#D97706]">
                R$ {metrics.pendingBRL.toFixed(2).replace('.', ',')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.receivedCount} doações liquidadas
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Coletas &amp; Produtos Recebidos</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
                {metrics.pendingPickups} rotas · {metrics.totalProductUnits} unid
              </p>
              <p className="mt-1 text-xs text-slate-500">
                WhatsApp coletas: {PIX_INFO.pickupWhatsappDisplay}
              </p>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {safeActiveTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <MonthlyDonationsChart
                donations={donations}
                accountingEntries={accountingEntries}
                monthlyDonors={monthlyDonors}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />

              <div className="rounded-lg border border-slate-200 bg-white p-6 xl:col-span-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Resumo Contábil do Período
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('accounting')}
                    className="cursor-pointer text-xs font-semibold text-[#14532D] hover:underline"
                  >
                    Abrir Livro-Razão
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Consolidado entre entradas (PIX, mensalistas, editais) e despesas da cozinha.
                </p>

                <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-200 text-xs">
                  <div className="flex justify-between py-3">
                    <dt className="text-slate-600">Total de Entradas (Receitas)</dt>
                    <dd className="font-mono font-semibold tabular-nums text-[#16A34A]">
                      + R$ {metrics.totalEntradas.toFixed(2).replace('.', ',')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-slate-600">Total de Saídas (Despesas Operacionais)</dt>
                    <dd className="font-mono font-semibold tabular-nums text-[#DC2626]">
                      - R$ {metrics.totalSaidas.toFixed(2).replace('.', ',')}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="font-semibold text-slate-900">Saldo em Caixa</dt>
                    <dd className="font-mono font-bold tabular-nums text-slate-900">
                      R$ {metrics.netBalance.toFixed(2).replace('.', ',')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 space-y-3">
                  <p className="text-xs font-medium text-slate-700">
                    Canais de Entrada de Doações
                  </p>
                  {[
                    {
                      label: 'PIX (Avulso & Mensal)',
                      count: metrics.byType.pix,
                      color: 'bg-[#14532D]',
                    },
                    {
                      label: 'Gateway Cartão / Boleto',
                      count: metrics.byType.gateway,
                      color: 'bg-[#9A3412]',
                    },
                    {
                      label: 'Produtos & Coletas',
                      count: metrics.byType.products,
                      color: 'bg-slate-700',
                    },
                  ].map((bar) => {
                    const pct = Math.round((bar.count / Math.max(1, donations.length)) * 100);
                    return (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-700">{bar.label}</span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {bar.count} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-100">
                          <div className={`h-full ${bar.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 xl:col-span-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-slate-900">
                      Últimos Lançamentos Contábeis
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Entradas de PIX, mensalidades e saídas operacionais da sede no Bairro Olaria.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('accounting')}
                    className="cursor-pointer text-xs font-semibold text-[#14532D] hover:underline"
                  >
                    Ver contabilidade completa
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 pr-3 font-medium">Data</th>
                        <th className="py-2.5 pr-3 font-medium">Descrição</th>
                        <th className="py-2.5 pr-3 font-medium">Categoria</th>
                        <th className="py-2.5 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountingEntries.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-slate-500">
                            Nenhum lançamento financeiro registrado (valores zerados em R$ 0,00).
                          </td>
                        </tr>
                      ) : (
                        accountingEntries.slice(0, 6).map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-3 pr-3 font-mono tabular-nums text-slate-600">
                              {a.date}
                            </td>
                            <td className="py-3 pr-3 font-medium text-slate-900">{a.description}</td>
                            <td className="py-3 pr-3 text-slate-600">{a.category}</td>
                            <td
                              className={`py-3 text-right font-mono font-semibold tabular-nums ${
                                a.kind === 'Entrada' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {a.kind === 'Entrada' ? '+' : '-'} R${' '}
                              {a.amountBRL.toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTABILIDADE & BALANCETE */}
          {safeActiveTab === 'accounting' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Livro-Razão &amp; Prestação de Contas
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Toda doação PIX confirmada ou mensalidade liquidada entra automaticamente neste
                    balancete. Conciliados: {metrics.reconciledCount} de {accountingEntries.length}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewAccForm((prev) => !prev)}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{showNewAccForm ? 'Ocultar formulário' : 'Registrar Entrada / Saída'}</span>
                </button>
              </div>

              {showNewAccForm && (
                <form
                  onSubmit={handleAddAccountingSubmit}
                  className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-12"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">Tipo</label>
                    <select
                      value={accKind}
                      onChange={(e) => {
                        const nextKind = e.target.value as AccountingKind;
                        setAccKind(nextKind);
                        setAccCategory(
                          nextKind === 'Entrada' ? 'Doação Avulsa PIX' : 'Insumos do Sopão'
                        );
                      }}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    >
                      <option value="Entrada">Entrada (+)</option>
                      <option value="Saída">Saída (-)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700">Categoria</label>
                    <input
                      type="text"
                      required
                      value={accCategory}
                      onChange={(e) => setAccCategory(e.target.value)}
                      placeholder="Ex.: Insumos do Sopão"
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">Descrição</label>
                    <input
                      type="text"
                      required
                      value={accDescription}
                      onChange={(e) => setAccDescription(e.target.value)}
                      placeholder="Ex.: Compra de legumes e proteínas semanais"
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={accAmount}
                      onChange={(e) => setAccAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700">Data</label>
                    <input
                      type="date"
                      value={accDate}
                      onChange={(e) => setAccDate(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-slate-700">
                      Documento / Nota Fiscal (opcional)
                    </label>
                    <input
                      type="text"
                      value={accRefCode}
                      onChange={(e) => setAccRefCode(e.target.value)}
                      placeholder="Ex.: NF-00440 ou Comprovante PIX"
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div className="flex items-end sm:col-span-4">
                    <button
                      type="submit"
                      className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Gravar Lançamento Contábil
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
                  {(['Todos', 'Entrada', 'Saída'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setAccKindFilter(k)}
                      className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium ${
                        accKindFilter === k
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {k === 'Todos' ? 'Todos os lançamentos' : `${k}s`}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={accSearch}
                    onChange={(e) => setAccSearch(e.target.value)}
                    placeholder="Buscar descrição, categoria ou NF..."
                    className="min-h-[38px] w-64 rounded border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Doc / Ref</th>
                      <th className="px-4 py-3 font-medium">Categoria</th>
                      <th className="px-4 py-3 font-medium">Descrição</th>
                      <th className="px-4 py-3 text-right font-medium">Valor (R$)</th>
                      <th className="px-4 py-3 text-right font-medium">Conciliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounting.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                          Nenhum lançamento contábil registrado (balancete zerado em R$ 0,00).
                        </td>
                      </tr>
                    ) : (
                      filteredAccounting.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono tabular-nums text-slate-600">
                            {entry.date}
                          </td>
                          <td className="px-4 py-3 font-mono tabular-nums text-slate-700">
                            {entry.referenceCode}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{entry.category}</td>
                          <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                              entry.kind === 'Entrada' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                            }`}
                          >
                            {entry.kind === 'Entrada' ? '+' : '-'} R${' '}
                            {entry.amountBRL.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleReconcileEntry(entry.id)}
                                className={`cursor-pointer text-xs font-semibold ${
                                  entry.reconciled ? 'text-[#16A34A]' : 'text-[#D97706]'
                                }`}
                              >
                                {entry.reconciled ? 'Conciliado' : 'Pendente'}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAccountingEntry(entry.id)}
                                aria-label={`Excluir lançamento ${entry.referenceCode}`}
                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BANCO DE DOADORES MENSAIS */}
          {safeActiveTab === 'monthly-donors' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Banco de Doadores Mensais (Recorrência PIX)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Controle de mantenedores mensais via PIX CNPJ ({PIX_INFO.pixKey}) ou PIX
                    Telefone ({PIX_INFO.pixPhoneDisplay}). Ao confirmar o PIX do mês, o valor entra
                    automaticamente na contabilidade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewMonthlyForm((prev) => !prev)}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{showNewMonthlyForm ? 'Ocultar formulário' : 'Cadastrar Doador Mensal'}</span>
                </button>
              </div>

              {showNewMonthlyForm && (
                <form
                  onSubmit={handleAddMonthlyDonorSubmit}
                  className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">
                      Nome do doador mensal
                    </label>
                    <input
                      type="text"
                      required
                      value={mdName}
                      onChange={(e) => setMdName(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">E-mail</label>
                    <input
                      type="email"
                      value={mdEmail}
                      onChange={(e) => setMdEmail(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={mdPhone}
                      onChange={(e) => setMdPhone(e.target.value)}
                      placeholder="(68) 99900-0000"
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700">
                      Valor Mensal PIX (R$)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      required
                      value={mdAmount}
                      onChange={(e) => setMdAmount(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Dia vencimento
                    </label>
                    <select
                      value={mdDueDay}
                      onChange={(e) => setMdDueDay(Number(e.target.value))}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    >
                      <option value={5}>Dia 05</option>
                      <option value={10}>Dia 10</option>
                      <option value={15}>Dia 15</option>
                      <option value={20}>Dia 20</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-medium text-slate-700">
                      Chave PIX escolhida
                    </label>
                    <select
                      value={mdPixChannel}
                      onChange={(e) =>
                        setMdPixChannel(
                          e.target.value as
                            | 'CNPJ 33.314.701/0001-54'
                            | 'Telefone +55 68 9958-7200'
                        )
                      }
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    >
                      <option value="Telefone +55 68 9958-7200">
                        Telefone +55 68 9958-7200
                      </option>
                      <option value="CNPJ 33.314.701/0001-54">CNPJ 33.314.701/0001-54</option>
                    </select>
                  </div>

                  <div className="flex items-end sm:col-span-3">
                    <button
                      type="submit"
                      className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Salvar Doador Mensal
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 sm:col-span-12">
                    <input
                      type="checkbox"
                      checked={mdPaidNow}
                      onChange={(e) => setMdPaidNow(e.target.checked)}
                      className="h-4 w-4 accent-[#14532D]"
                    />
                    <span>Já recebeu o PIX deste mês (lançar na contabilidade agora)</span>
                  </label>
                </form>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1">
                  {(['Todos', 'Em dia', 'Aguardando PIX', 'Pausado'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMonthlyFilter(st)}
                      className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium ${
                        monthlyFilter === st
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={monthlySearch}
                    onChange={(e) => setMonthlySearch(e.target.value)}
                    placeholder="Buscar doador mensal..."
                    className="min-h-[38px] rounded border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Doador Mensal</th>
                      <th className="px-4 py-3 font-medium">Chave PIX / Dia</th>
                      <th className="px-4 py-3 text-right font-medium">Valor Mensal</th>
                      <th className="px-4 py-3 text-right font-medium">Total Acumulado</th>
                      <th className="px-4 py-3 font-medium">Status Mês</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMonthlyDonors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                          Nenhum doador mensal cadastrado (valores zerados em R$ 0,00).
                        </td>
                      </tr>
                    ) : (
                      filteredMonthlyDonors.map((donor) => (
                        <tr key={donor.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{donor.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {donor.email} · {donor.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-mono text-slate-800">{donor.pixChannel}</p>
                            <p className="text-[11px] text-slate-500">
                              Todo dia {String(donor.dueDay).padStart(2, '0')} · Último:{' '}
                              {donor.lastPaidMonth || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                            R$ {donor.monthlyAmountBRL.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                            R$ {donor.totalContributedBRL.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Status do doador ${donor.name}`}
                              value={donor.status}
                              onChange={(e) =>
                                updateMonthlyDonorStatus(
                                  donor.id,
                                  e.target.value as MonthlyDonorStatus
                                )
                              }
                              className={`rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium ${
                                donor.status === 'Em dia'
                                  ? 'text-[#16A34A]'
                                  : donor.status === 'Pausado'
                                    ? 'text-slate-500'
                                    : 'text-[#D97706]'
                              }`}
                            >
                              <option value="Em dia">Em dia</option>
                              <option value="Aguardando PIX">Aguardando PIX</option>
                              <option value="Pausado">Pausado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => confirmMonthlyDonorPayment(donor.id)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#14532D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0F3F22]"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Confirmar PIX</span>
                              </button>
                              <a
                                href={buildMonthlyDonorWhatsappUrl(donor)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp para ${donor.name}`}
                                className="inline-flex items-center rounded border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => deleteMonthlyDonor(donor.id)}
                                aria-label={`Remover doador mensal ${donor.name}`}
                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPTS CONTROL */}
          {safeActiveTab === 'receipts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Controle de Recebimento de Doações
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Confirme transferências PIX, pagamentos de checkout, entregas de produtos e
                    envie os recibos diretamente para o WhatsApp da associação.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={buildAllDonationsWhatsappUrl(filteredDonations)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1EBE57]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Enviar Todos os Recibos WhatsApp</span>
                  </a>
                  <a
                    href={buildAllDonationsAndPickupsWhatsappUrl(donations, pickups)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#25D366] bg-white px-3.5 py-2 text-xs font-semibold text-[#14532D] hover:bg-[#F0FDF4]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
                    <span>Recibos + Coletas WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowNewReceiptForm((prev) => !prev)}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Registrar Recebimento</span>
                  </button>
                </div>
              </div>

              {showNewReceiptForm && (
                <form
                  onSubmit={handleAddManualReceipt}
                  className="rounded-lg border border-slate-200 bg-white p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      Novo Registro de Recebimento
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewReceiptForm(false)}
                      className="cursor-pointer text-xs text-slate-500 hover:text-slate-900"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nome do colaborador
                      </label>
                      <input
                        type="text"
                        required
                        value={newDonorName}
                        onChange={(e) => setNewDonorName(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">E-mail</label>
                      <input
                        type="email"
                        value={newDonorEmail}
                        onChange={(e) => setNewDonorEmail(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Telefone</label>
                      <input
                        type="tel"
                        value={newDonorPhone}
                        onChange={(e) => setNewDonorPhone(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Modalidade</label>
                      <select
                        value={newDonationType}
                        onChange={(e) => setNewDonationType(e.target.value as DonationType)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      >
                        <option value="PIX">PIX</option>
                        <option value="PIX Mensal">PIX Mensal</option>
                        <option value="Gateway Cartão/Boleto">Gateway Cartão/Boleto</option>
                        <option value="Produtos">Produtos</option>
                      </select>
                    </div>

                    {newDonationType === 'Produtos' ? (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Descrição dos produtos recebidos
                        </label>
                        <input
                          type="text"
                          required
                          value={newItemsSummary}
                          onChange={(e) => setNewItemsSummary(e.target.value)}
                          placeholder="Ex.: 20 kg Farinha de trigo, 10 kg Açúcar"
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newAmountBRL}
                          onChange={(e) => setNewAmountBRL(e.target.value)}
                          placeholder="100.00"
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">Observações</label>
                    <input
                      type="text"
                      value={newDonationNotes}
                      onChange={(e) => setNewDonationNotes(e.target.value)}
                      className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] cursor-pointer items-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Salvar Recebimento
                  </button>
                </form>
              )}

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1">
                  {(['Todas', 'Recebida', 'Em Conferência', 'Pendente', 'Cancelada'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                          statusFilter === st
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'Todos' | DonationType)}
                    aria-label="Filtrar por tipo de doação"
                    className="min-h-[38px] rounded border border-slate-300 bg-white px-3 text-xs text-slate-800"
                  >
                    <option value="Todos">Todos os canais</option>
                    <option value="PIX">PIX</option>
                    <option value="PIX Mensal">PIX Mensal</option>
                    <option value="Gateway Cartão/Boleto">Gateway Cartão/Boleto</option>
                    <option value="Produtos">Produtos</option>
                  </select>

                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar colaborador ou protocolo..."
                      className="min-h-[38px] rounded border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Data / Protocolo</th>
                      <th className="px-4 py-3 font-medium">Colaborador &amp; Contato</th>
                      <th className="px-4 py-3 font-medium">Canal</th>
                      <th className="px-4 py-3 text-right font-medium">Valor / Produtos</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                          Nenhuma doação registrada (valores financeiros zerados em R$ 0,00).
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-mono font-medium tabular-nums text-slate-900">
                              {d.referenceCode}
                            </p>
                            <p className="font-mono text-[11px] tabular-nums text-slate-500">
                              {d.createdAt}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{d.donorName}</p>
                            <p className="text-[11px] text-slate-500">
                              {d.donorEmail} · {d.donorPhone}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{d.type}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                            {typeof d.amountBRL === 'number'
                              ? `R$ ${d.amountBRL.toFixed(2).replace('.', ',')}`
                              : d.itemsSummary}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Alterar status da doação ${d.referenceCode}`}
                              value={d.status}
                              onChange={(e) =>
                                updateDonationStatus(d.id, e.target.value as DonationStatus)
                              }
                              className={`rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium ${
                                d.status === 'Recebida'
                                  ? 'text-[#16A34A]'
                                  : d.status === 'Cancelada'
                                    ? 'text-[#DC2626]'
                                    : 'text-[#D97706]'
                              }`}
                            >
                              <option value="Recebida">Recebida</option>
                              <option value="Em Conferência">Em Conferência</option>
                              <option value="Pendente">Pendente</option>
                              <option value="Cancelada">Cancelada</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={buildDonationReceiptWhatsappUrl(d)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Enviar recibo ${d.referenceCode} pelo WhatsApp`}
                                className="inline-flex items-center gap-1 rounded bg-[#25D366] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1EBE57]"
                              >
                                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                                <span>Recibo WhatsApp</span>
                              </a>
                              {d.status !== 'Recebida' && (
                                <button
                                  type="button"
                                  onClick={() => updateDonationStatus(d.id, 'Recebida')}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#14532D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0F3F22]"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Confirmar</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteDonation(d.id)}
                                aria-label={`Excluir registro ${d.referenceCode}`}
                                className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AGENDAMENTO DE COLETA DE DOAÇÕES */}
          {safeActiveTab === 'pickups' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Agenda de Coletas — Veículo Institucional
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cadastre coletas com nome, e-mail, telefone e lista de produtos ou envie a
                    confirmação diretamente para o WhatsApp{' '}
                    <span className="font-mono font-medium text-slate-800">
                      {PIX_INFO.pickupWhatsappDisplay}
                    </span>
                    .
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={buildAllPickupsWhatsappUrl(pickups)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1EBE57]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Enviar Todas as Coletas WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowNewPickupForm((prev) => !prev)}
                    className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {showNewPickupForm ? 'Ocultar formulário' : 'Novo Agendamento de Coleta'}
                    </span>
                  </button>
                </div>
              </div>

              {showNewPickupForm && (
                <form
                  onSubmit={handleAdminCreatePickup}
                  className="grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-white p-6 lg:grid-cols-12"
                >
                  <div className="space-y-3 lg:col-span-6">
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      Dados do colaborador
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nome do colaborador
                      </label>
                      <input
                        type="text"
                        required
                        value={collabName}
                        onChange={(e) => setCollabName(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          E-mail do colaborador
                        </label>
                        <input
                          type="email"
                          required
                          value={collabEmail}
                          onChange={(e) => setCollabEmail(e.target.value)}
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Telefone do colaborador
                        </label>
                        <input
                          type="tel"
                          required
                          value={collabPhone}
                          onChange={(e) => setCollabPhone(e.target.value)}
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Endereço de coleta
                      </label>
                      <input
                        type="text"
                        required
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Data</label>
                        <input
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Turno</label>
                        <select
                          value={preferredShift}
                          onChange={(e) =>
                            setPreferredShift(
                              e.target.value as
                                | 'Manhã (08h–12h)'
                                | 'Tarde (14h–18h)'
                                | 'Sábado (08h–12h)'
                            )
                          }
                          className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                        >
                          <option value="Manhã (08h–12h)">Manhã (08h–12h)</option>
                          <option value="Tarde (14h–18h)">Tarde (14h–18h)</option>
                          <option value="Sábado (08h–12h)">Sábado (08h–12h)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 lg:col-span-6">
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      Lista de produtos para recebimento
                    </h3>
                    <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200 px-3">
                      {products
                        .filter((p) => p.active)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={pickupQuantities[item.id] || ''}
                                placeholder="0"
                                onChange={(e) =>
                                  setPickupQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Math.max(0, Number(e.target.value) || 0),
                                  }))
                                }
                                className="h-8 w-14 rounded border border-slate-300 px-2 text-right font-mono tabular-nums"
                              />
                              <span className="w-14 text-slate-500">{item.unit}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <input
                      type="text"
                      value={pickupCustomItems}
                      onChange={(e) => setPickupCustomItems(e.target.value)}
                      placeholder="Outros itens para coleta..."
                      className="min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                    />
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button
                        type="submit"
                        className="inline-flex min-h-[40px] cursor-pointer items-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Salvar Agendamento
                      </button>
                      <a
                        href={buildPickupWhatsappUrl({
                          collaboratorName: collabName || 'Colaborador',
                          collaboratorEmail: collabEmail || 'Não informado',
                          collaboratorPhone: collabPhone || 'Não informado',
                          pickupAddress: pickupAddress || 'Plácido de Castro - AC',
                          preferredDate,
                          preferredShift,
                          items: products
                            .filter((p) => (pickupQuantities[p.id] ?? 0) > 0)
                            .map((p) => ({
                              productId: p.id,
                              productName: p.name,
                              quantity: pickupQuantities[p.id],
                              unit: p.unit,
                            })),
                          customItemsText: pickupCustomItems,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#14532D] px-4 py-2 text-xs font-semibold text-[#14532D]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Enviar p/ WhatsApp {PIX_INFO.pickupWhatsappDisplay}</span>
                      </a>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pickups.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-xs text-slate-500 lg:col-span-2">
                    Nenhum agendamento de coleta cadastrado até o momento.
                  </div>
                ) : (
                  pickups.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs tabular-nums text-slate-500">
                              {p.preferredDate} · {p.preferredShift}
                            </p>
                            <h3 className="mt-1 font-serif text-lg font-semibold text-slate-900">
                              {p.collaboratorName}
                            </h3>
                            <p className="text-xs text-slate-600">
                              {p.collaboratorEmail} ·{' '}
                              <span className="font-mono tabular-nums">{p.collaboratorPhone}</span>
                            </p>
                          </div>

                          <select
                            aria-label={`Status da coleta de ${p.collaboratorName}`}
                            value={p.status}
                            onChange={(e) =>
                              updatePickupStatus(p.id, e.target.value as PickupStatus)
                            }
                            className={`rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold ${
                              p.status === 'Coletada'
                                ? 'text-[#16A34A]'
                                : p.status === 'Cancelada'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#D97706]'
                            }`}
                          >
                            <option value="Agendada">Agendada</option>
                            <option value="Em Rota">Em Rota</option>
                            <option value="Coletada">Coletada</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                        </div>

                        <p className="mt-3 text-xs text-slate-700">
                          <strong className="font-medium text-slate-900">Endereço:</strong>{' '}
                          {p.pickupAddress}
                        </p>

                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                            Produtos da coleta
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-800">
                            {p.items.map((it) => (
                              <li key={it.productId} className="flex justify-between">
                                <span>{it.productName}</span>
                                <span className="font-mono tabular-nums font-medium">
                                  {it.quantity} {it.unit}
                                </span>
                              </li>
                            ))}
                            {p.customItemsText && (
                              <li className="text-slate-600">Outros: {p.customItemsText}</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <a
                          href={buildPickupWhatsappUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            Enviar agendamento WhatsApp ({PIX_INFO.pickupWhatsappDisplay})
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>

                        {p.status !== 'Coletada' && (
                          <button
                            type="button"
                            onClick={() => updatePickupStatus(p.id, 'Coletada')}
                            className="cursor-pointer text-xs font-semibold text-[#16A34A] hover:underline"
                          >
                            Marcar como Coletada
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PRODUCT LIST MANAGEMENT */}
          {safeActiveTab === 'products' && (
            <div className="space-y-5">
              <form
                onSubmit={handleAddProduct}
                className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-12 sm:items-end"
              >
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-700">
                    Novo produto para recebimento
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ex.: Óleo de soja 900ml"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-slate-700">Categoria</label>
                  <select
                    value={newProductCat}
                    onChange={(e) => setNewProductCat(e.target.value as ProductCategory)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  >
                    <option value="Insumos do Sopão">Insumos do Sopão</option>
                    <option value="Panificação Solidária">Panificação Solidária</option>
                    <option value="Porcionamento & Kits">Porcionamento &amp; Kits</option>
                    <option value="Higiene & Limpeza">Higiene &amp; Limpeza</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Unidade</label>
                  <input
                    type="text"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700">Meta</label>
                  <input
                    type="number"
                    min={1}
                    value={newProductTarget}
                    onChange={(e) => setNewProductTarget(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-2 font-mono text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                  >
                    Adicionar item
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Produto</th>
                      <th className="px-4 py-3 font-medium">Categoria</th>
                      <th className="px-4 py-3 font-medium">Prioridade</th>
                      <th className="px-4 py-3 text-right font-medium">Recebido</th>
                      <th className="px-4 py-3 text-right font-medium">Meta</th>
                      <th className="px-4 py-3 text-right font-medium">Visível ao público</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{prod.name}</td>
                        <td className="px-4 py-3 text-slate-600">{prod.category}</td>
                        <td className="px-4 py-3">
                          <select
                            aria-label={`Prioridade de ${prod.name}`}
                            value={prod.priority}
                            onChange={(e) =>
                              updateProductItem(prod.id, {
                                priority: e.target.value as DonationProductItem['priority'],
                              })
                            }
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            <option value="Prioritário">Prioritário</option>
                            <option value="Contínuo">Contínuo</option>
                            <option value="Estável">Estável</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                          {prod.receivedQty} {prod.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                          {prod.targetQty} {prod.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => updateProductItem(prod.id, { active: !prod.active })}
                            className={`cursor-pointer text-xs font-semibold ${
                              prod.active ? 'text-[#16A34A]' : 'text-slate-400'
                            }`}
                          >
                            {prod.active ? 'Ativo na lista' : 'Pausado'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6B: CADASTRO DE PESSOAS ASSISTIDAS PELA ASSOCIAÇÃO */}
          {safeActiveTab === 'assisted' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Cadastro de Pessoas Assistidas pela Associação
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Registro nominal das pessoas e famílias atendidas pelo Projeto Sopão (nome,
                    e-mail, telefone e acompanhamento comunitário).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded bg-slate-100 px-3 py-1.5 font-mono font-semibold text-slate-800">
                    Total: {assistedPeople.length} cadastrada(s)
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleAddAssistedSubmit}
                className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-12"
              >
                <div className="sm:col-span-3">
                  <label
                    htmlFor="assist-full-name"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Nome completo *
                  </label>
                  <input
                    id="assist-full-name"
                    type="text"
                    required
                    value={assistFullName}
                    onChange={(e) => setAssistFullName(e.target.value)}
                    placeholder="Ex.: Francisca das Chagas Lima"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="assist-cpf"
                    className="block text-xs font-medium text-slate-700"
                  >
                    CPF
                  </label>
                  <input
                    id="assist-cpf"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={assistCpf}
                    onChange={(e) => setAssistCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="assist-email"
                    className="block text-xs font-medium text-slate-700"
                  >
                    E-mail *
                  </label>
                  <input
                    id="assist-email"
                    type="email"
                    required
                    value={assistEmail}
                    onChange={(e) => setAssistEmail(e.target.value)}
                    placeholder="pessoa.assistida@email.com"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="assist-phone"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="assist-phone"
                    type="tel"
                    required
                    value={assistPhone}
                    onChange={(e) => setAssistPhone(e.target.value)}
                    placeholder="(68) 99900-0000"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="assist-neighborhood"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Bairro / Comunidade
                  </label>
                  <input
                    id="assist-neighborhood"
                    type="text"
                    value={assistNeighborhood}
                    onChange={(e) => setAssistNeighborhood(e.target.value)}
                    placeholder="Ex.: Bairro Olaria"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="assist-household"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Nº na família
                  </label>
                  <input
                    id="assist-household"
                    type="number"
                    min={1}
                    value={assistHouseholdSize}
                    onChange={(e) => setAssistHouseholdSize(e.target.value)}
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 font-mono text-sm"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="assist-notes"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Observações de atendimento
                  </label>
                  <input
                    id="assist-notes"
                    type="text"
                    value={assistNotes}
                    onChange={(e) => setAssistNotes(e.target.value)}
                    placeholder="Ex.: Retirada de kits semanais / idoso"
                    className="mt-1 min-h-[40px] w-full rounded border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="flex items-end sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Cadastrar</span>
                  </button>
                </div>

                {assistError && (
                  <p role="alert" className="text-xs font-medium text-[#DC2626] sm:col-span-12">
                    {assistError}
                  </p>
                )}
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
                  {(['Todas', 'Ativa', 'Inativa'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAssistedStatusFilter(st)}
                      className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium ${
                        assistedStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={assistedSearch}
                    onChange={(e) => setAssistedSearch(e.target.value)}
                    placeholder="Buscar nome, CPF, e-mail ou telefone..."
                    className="min-h-[38px] w-64 rounded border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 font-medium">Nome Completo / CPF</th>
                      <th className="px-4 py-3 font-medium">E-mail</th>
                      <th className="px-4 py-3 font-medium">Telefone</th>
                      <th className="px-4 py-3 font-medium">Bairro / Família</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssistedPeople.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-xs text-slate-500">
                          Nenhuma pessoa assistida cadastrada até o momento.
                        </td>
                      </tr>
                    ) : (
                      filteredAssistedPeople.map((person) => (
                        <tr key={person.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{person.fullName}</p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {person.cpf ? `CPF: ${person.cpf} · ` : ''}Cadastro: {person.createdAt}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{person.email}</td>
                          <td className="px-4 py-3 font-mono tabular-nums text-slate-800">
                            {person.phone}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <p>{person.neighborhood || 'Plácido de Castro - AC'}</p>
                            <p className="text-[11px] text-slate-500">
                              {person.householdSize ?? 1} pessoa(s) na família
                              {person.notes ? ` · ${person.notes}` : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Status de ${person.fullName}`}
                              value={person.status}
                              onChange={(e) =>
                                updateAssistedPersonStatus(
                                  person.id,
                                  e.target.value as AssistedPersonStatus
                                )
                              }
                              className={`rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold ${
                                person.status === 'Ativa' ? 'text-[#16A34A]' : 'text-slate-500'
                              }`}
                            >
                              <option value="Ativa">Ativa</option>
                              <option value="Inativa">Inativa</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => deleteAssistedPerson(person.id)}
                              aria-label={`Remover cadastro de ${person.fullName}`}
                              className="cursor-pointer rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#DC2626]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6C: RELATÓRIOS PDF DO DASHBOARD POR CATEGORIA */}
          {safeActiveTab === 'reports' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
                      Exportação Oficial em Arquivo PDF · jsPDF + jspdf-autotable + html2canvas
                    </p>
                    <h2 className="mt-1 font-serif text-xl font-semibold text-slate-900">
                      Relatórios Mensais de Impacto &amp; Dashboard
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Exporte relatórios mensais de Usuários (RBAC) e Voluntários ou selecione as
                      categorias do painel para gerar documentos oficiais A4 em PDF.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={() => void handleDownloadUsersAndVolunteersPdf()}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <FileDown className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>PDF: Usuários &amp; Voluntários (Impacto Mensal)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={() => handleDownloadPdf(undefined, 'html2canvas')}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-[#14532D] bg-[#FBF9F5] px-4 py-2.5 text-xs font-semibold text-[#14532D] hover:bg-[#F4F0E8] disabled:opacity-60"
                    >
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      <span>Exportar Geral (Visual A4)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={() => handleDownloadPdf(undefined, 'autotable')}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>PDF Vetorial (Tabelas)</span>
                    </button>
                  </div>
                </div>

                {/* Seletor de Mês de Referência para Relatórios Mensais */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-semibold text-slate-700">
                      Competência do Relatório:
                    </span>
                    <button
                      type="button"
                      onClick={() => setReportMonth('all')}
                      className={`min-h-[36px] cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors ${
                        reportMonth === 'all'
                          ? 'border-[#14532D] bg-[#14532D] text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Todos os períodos
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMonth(new Date().toISOString().slice(0, 7))}
                      className={`min-h-[36px] cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors ${
                        reportMonth === new Date().toISOString().slice(0, 7)
                          ? 'border-[#14532D] bg-[#14532D] text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Mês atual ({new Date().toISOString().slice(0, 7)})
                    </button>
                    <input
                      type="month"
                      aria-label="Selecionar mês de referência do relatório"
                      value={reportMonth === 'all' ? '' : reportMonth}
                      onChange={(e) => setReportMonth(e.target.value || 'all')}
                      className="min-h-[36px] rounded-md border border-slate-300 bg-white px-2.5 font-mono text-xs text-slate-800 focus:border-[#14532D] focus:outline-none"
                    />
                  </div>

                  <p className="font-mono text-xs tabular-nums text-slate-500">
                    Período ativo: {formatReferenceMonthLabel(reportMonth)}
                  </p>
                </div>
              </div>

              {pdfNotice && (
                <div className="rounded-md border border-[#14532D]/30 bg-[#F4F0E8] px-4 py-3 text-xs font-medium text-[#14532D]">
                  {pdfNotice}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    {
                      key: 'users',
                      title: 'Usuários do Sistema (RBAC)',
                      metric: `${
                        systemUsers.filter((u) => matchesReferenceMonth(u.createdAt, reportMonth))
                          .length
                      } conta(s) no período`,
                      detail: `${systemUsers.filter((u) => u.status === 'ativo').length} ativas · ${
                        systemUsers.filter((u) => u.role === 'admin').length
                      } admin / ${
                        systemUsers.filter((u) => u.role === 'gerente').length
                      } gerente / ${
                        systemUsers.filter((u) => u.role === 'usuario').length
                      } usuário`,
                    },
                    {
                      key: 'volunteers',
                      title: 'Relatório de Voluntários',
                      metric: `${VOLUNTEER_ROLES.length} frentes · ${
                        volunteerApplications.filter((v) =>
                          matchesReferenceMonth(v.createdAt, reportMonth)
                        ).length
                      } inscrição(ões)`,
                      detail: `${VOLUNTEER_ROLES.reduce(
                        (s, r) => s + r.spotsFilled,
                        0
                      )}/${VOLUNTEER_ROLES.reduce((s, r) => s + r.spotsTotal, 0)} posições ocupadas`,
                    },
                    {
                      key: 'donations',
                      title: 'Relatório de Doações',
                      metric: `${
                        donations.filter((d) => matchesReferenceMonth(d.createdAt, reportMonth))
                          .length
                      } registro(s)`,
                      detail: `${metrics.receivedCount} liquidadas · Pendentes R$ ${metrics.pendingBRL
                        .toFixed(2)
                        .replace('.', ',')}`,
                    },
                    {
                      key: 'revenues',
                      title: 'Relatórios de Receitas de Doações',
                      metric: `R$ ${metrics.totalEntradas.toFixed(2).replace('.', ',')}`,
                      detail: `Saldo líquido R$ ${metrics.netBalance
                        .toFixed(2)
                        .replace('.', ',')} · MRR PIX R$ ${metrics.monthlyExpectedMRR
                        .toFixed(2)
                        .replace('.', ',')}`,
                    },
                    {
                      key: 'donatedFoods',
                      title: 'Relatórios de Comidas Doadas',
                      metric: `${metrics.totalProductUnits} unid/kg recebidas`,
                      detail: `${products.length} tipos de alimentos/insumos monitorados`,
                    },
                    {
                      key: 'pickupsCount',
                      title: 'Número de Coletas Feitas',
                      metric: `${completedPickupsCount} coleta(s) feita(s)`,
                      detail: `${metrics.pendingPickups} agendada(s)/em rota · ${pickups.length} total`,
                    },
                    {
                      key: 'assistedPeople',
                      title: 'Cadastro de Pessoas Assistidas',
                      metric: `${
                        assistedPeople.filter((p) =>
                          matchesReferenceMonth(p.createdAt, reportMonth)
                        ).length
                      } pessoa(s)`,
                      detail: `${assistedPeople.filter((p) => p.status === 'Ativa').length} ativa(s) no acompanhamento`,
                    },
                  ] as Array<{
                    key: keyof DashboardPdfCategories;
                    title: string;
                    metric: string;
                    detail: string;
                  }>
                ).map((cat) => {
                  const checked = pdfCategories[cat.key];
                  return (
                    <label
                      key={cat.key}
                      className={`flex cursor-pointer flex-col justify-between rounded-lg border p-5 transition-colors ${
                        checked
                          ? 'border-[#14532D] bg-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-base font-semibold text-slate-900">
                            {cat.title}
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-[#14532D]">
                            {cat.metric}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setPdfCategories((prev) => ({
                              ...prev,
                              [cat.key]: e.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 accent-[#14532D]"
                        />
                      </div>
                      <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                        {cat.detail}
                      </p>
                    </label>
                  );
                })}
              </div>

              {/* Quick table of registered volunteers inside Reports view */}
              {volunteerApplications.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Voluntários Inscritos via Portal ({volunteerApplications.length})
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-medium">Nome</th>
                          <th className="py-2 pr-3 font-medium">CPF</th>
                          <th className="py-2 pr-3 font-medium">Telefone</th>
                          <th className="py-2 pr-3 font-medium">Vaga</th>
                          <th className="py-2 pr-3 font-medium">Disponibilidade</th>
                          <th className="py-2 text-right font-medium">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {volunteerApplications.map((v) => (
                          <tr key={v.id}>
                            <td className="py-2.5 pr-3 font-medium text-slate-900">{v.fullName}</td>
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-600">
                              {v.cpf || '—'}
                            </td>
                            <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-700">
                              {v.phone}
                            </td>
                            <td className="py-2.5 pr-3 text-slate-700">{v.roleTitle}</td>
                            <td className="py-2.5 pr-3 text-slate-600">{v.availability}</td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => removeApplication(v.id)}
                                aria-label={`Remover voluntário ${v.fullName}`}
                                className="cursor-pointer rounded p-1 text-slate-400 hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Live A4 Printable Preview captured by html2canvas + jsPDF */}
              <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Pré-visualização A4 do Documento (Captura html2canvas + jsPDF)
                  </p>
                  <button
                    type="button"
                    disabled={isGeneratingPdf}
                    onClick={() => handleDownloadPdf(undefined, 'html2canvas')}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-[#14532D] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
                  >
                    <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Baixar este documento em PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded border border-slate-300 bg-white shadow-sm">
                  <div className="mx-auto w-[794px]">
                    <DashboardReportPrintable
                      ref={reportPreviewRef}
                      donations={donations}
                      accountingEntries={accountingEntries}
                      monthlyDonors={monthlyDonors}
                      products={products}
                      pickups={pickups}
                      volunteerApplications={volunteerApplications}
                      systemUsers={systemUsers}
                      assistedPeople={assistedPeople}
                      visitorStats={visitorStats}
                      categories={pdfCategories}
                      referenceMonth={reportMonth}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: COLETA DE EDITAIS (CNAE & TJAC) */}
          {safeActiveTab === 'editais' && <EditaisCollectorPanel variant="admin" />}

          {/* TAB 8: USUÁRIOS E NÍVEIS DE ACESSO (RBAC - SOMENTE ADMIN) */}
          {safeActiveTab === 'users' && roleDef.canManageUsers && adminUser && (
            <AdminAccessControlPanel
              currentUser={adminUser}
              volunteerApplications={volunteerApplications}
              visitorStats={visitorStats}
              assistedPeople={assistedPeople}
              donations={donations}
              pickups={pickups}
            />
          )}

          {/* TAB 9: DADOS CORPORATIVOS & LOCALIZAÇÃO DA SEDE */}
          {safeActiveTab === 'corporate' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
                  Ficha Corporativa Oficial
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-slate-900">
                  {INSTITUTION_PROFILE.legalName}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Dados oficiais, CNAE de atuação e chaves financeiras registradas para controle
                  institucional.
                </p>

                <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-200 text-xs">
                  {INSTITUTION_SPECS.map((spec) => (
                    <div key={spec.label} className="py-3">
                      <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                        {spec.label}
                      </dt>
                      <dd
                        className={`mt-1 text-slate-900 ${
                          spec.mono ? 'font-mono font-medium tabular-nums' : 'font-medium'
                        }`}
                      >
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                  <div className="py-3">
                    <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                      Chaves PIX Oficiais
                    </dt>
                    <dd className="mt-1 font-mono font-medium tabular-nums text-slate-900">
                      CNPJ: {PIX_INFO.pixKey} · Telefone: {PIX_INFO.pixPhoneDisplay}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 lg:col-span-6">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
                        Localização da Associação
                      </p>
                      <h2 className="mt-1 font-serif text-xl font-semibold text-slate-900">
                        Mapa da Sede · Bairro Olaria
                      </h2>
                    </div>

                    <a
                      href={INSTITUTION_PROFILE.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22]"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Abrir no Google Maps</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{INSTITUTION_PROFILE.fullAddress}</p>

                  <a
                    href={INSTITUTION_PROFILE.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative mt-4 block overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={OFFICIAL_ASSETS.headquartersMapImage}
                      alt={`Mapa da sede da ${INSTITUTION_PROFILE.legalName} em ${INSTITUTION_PROFILE.fullAddress}`}
                      referrerPolicy="no-referrer"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ver localização exata no Google Maps</span>
                    </span>
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <span>Comarca de Plácido de Castro · Estado do Acre</span>
                  <a
                    href={INSTITUTION_PROFILE.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#14532D] hover:underline"
                  >
                    <span>Link direto Google Maps</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Segurança & Alteração de E-mail e Senha do Administrador */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-12">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#14532D]">
                      Segurança de Acesso ao Painel
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-slate-900">
                      Alterar E-mail e Senha do Administrador
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Mantenha o acesso restrito da diretoria protegido com senha pessoal
                      (criptografia scrypt no servidor).
                    </p>
                  </div>
                  {adminUser && (
                    <div className="text-right text-xs text-slate-600">
                      <p className="font-medium text-slate-900">
                        {adminUser.nome || adminUser.displayName}
                      </p>
                      <p className="font-mono text-[11px]">{adminUser.email}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleUpdateCredentials} className="mt-5 space-y-4">
                  {secError && (
                    <div
                      role="alert"
                      className="rounded-md border border-[#DC2626]/30 bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
                    >
                      {secError}
                    </div>
                  )}
                  {secSuccess && (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-md border border-[#14532D]/30 bg-[#F0FDF4] px-3.5 py-2.5 text-xs font-medium text-[#14532D]"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{secSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label
                        htmlFor="sec-display-name"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Identificação
                      </label>
                      <input
                        id="sec-display-name"
                        type="text"
                        value={secDisplayName}
                        onChange={(e) => setSecDisplayName(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sec-email"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        E-mail de Login *
                      </label>
                      <input
                        id="sec-email"
                        type="email"
                        required
                        value={secNewEmail}
                        onChange={(e) => setSecNewEmail(e.target.value)}
                        className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sec-current-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Senha Atual *
                      </label>
                      <input
                        id="sec-current-password"
                        type="password"
                        required
                        value={secCurrentPassword}
                        onChange={(e) => setSecCurrentPassword(e.target.value)}
                        placeholder="Obrigatória para salvar"
                        className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sec-new-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Nova Senha (opcional)
                      </label>
                      <input
                        id="sec-new-password"
                        type="password"
                        value={secNewPassword}
                        onChange={(e) => setSecNewPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sec-confirm-password"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Confirmar Nova Senha
                      </label>
                      <input
                        id="sec-confirm-password"
                        type="password"
                        value={secConfirmPassword}
                        onChange={(e) => setSecConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="mt-1 min-h-[40px] w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-[#14532D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={secSaving}
                      className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60"
                    >
                      {secSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {secSaving ? 'Salvando...' : 'Atualizar Credenciais de Login'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* Offscreen A4 printable container for instant html2canvas + jsPDF export from any admin tab */}
        {safeActiveTab !== 'reports' && (
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: '-12000px',
              top: 0,
              pointerEvents: 'none',
            }}
          >
            <DashboardReportPrintable
              ref={reportOffscreenRef}
              donations={donations}
              accountingEntries={accountingEntries}
              monthlyDonors={monthlyDonors}
              products={products}
              pickups={pickups}
              volunteerApplications={volunteerApplications}
              systemUsers={systemUsers}
              assistedPeople={assistedPeople}
              visitorStats={visitorStats}
              categories={{
                donations: true,
                volunteers: true,
                users: true,
                revenues: true,
                donatedFoods: true,
                pickupsCount: true,
                assistedPeople: true,
              }}
              referenceMonth={reportMonth}
            />
          </div>
        )}

        <InstitutionalFooterStrip variant="admin" />
      </div>
    </div>
  );
}
