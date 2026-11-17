import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminUser, getRoleDefinition } from '../data/adminAuthClient';
import { AssistedPersonRecord } from '../data/assistedPeopleStore';
import {
  AccountingEntry,
  DonationProductItem,
  DonationRecord,
  MonthlyDonorRecord,
  PickupScheduleRecord,
} from '../data/donationsStore';
import { INSTITUTION_PROFILE, VOLUNTEER_ROLES } from '../data/institutionalData';
import { VisitorStats } from '../data/visitorStore';
import { VolunteerApplication } from '../data/volunteersStore';

export interface DashboardPdfCategories {
  donations: boolean;
  volunteers: boolean;
  users: boolean;
  revenues: boolean;
  donatedFoods: boolean;
  pickupsCount: boolean;
  assistedPeople: boolean;
}

export interface DashboardPdfInput {
  donations: DonationRecord[];
  accountingEntries: AccountingEntry[];
  monthlyDonors: MonthlyDonorRecord[];
  products: DonationProductItem[];
  pickups: PickupScheduleRecord[];
  volunteerApplications: VolunteerApplication[];
  systemUsers?: AdminUser[];
  assistedPeople: AssistedPersonRecord[];
  visitorStats: VisitorStats;
  categories: DashboardPdfCategories;
  referenceMonth?: string; // 'all' ou 'YYYY-MM'
  generatedBy?: string;
}

export interface MonthlyUsersVolunteersPdfInput {
  systemUsers: AdminUser[];
  volunteerApplications: VolunteerApplication[];
  assistedPeople?: AssistedPersonRecord[];
  donations?: DonationRecord[];
  pickups?: PickupScheduleRecord[];
  visitorStats: VisitorStats;
  referenceMonth?: string; // 'all' ou 'YYYY-MM'
  generatedBy?: string;
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Nunca acessou';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatReferenceMonthLabel(referenceMonth?: string): string {
  if (!referenceMonth || referenceMonth === 'all') {
    return 'Todos os períodos acumulados';
  }
  const match = /^(\d{4})-(\d{2})$/.exec(referenceMonth);
  if (!match) return referenceMonth;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const dt = new Date(year, monthIdx, 1);
  if (Number.isNaN(dt.getTime())) return referenceMonth;
  const formatted = dt.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function matchesReferenceMonth(
  dateStr: string | null | undefined,
  referenceMonth?: string
): boolean {
  if (!referenceMonth || referenceMonth === 'all') return true;
  if (!dateStr) return false;
  // ISO string YYYY-MM-DD...
  if (dateStr.startsWith(referenceMonth)) return true;
  // Brazilian date DD/MM/YYYY
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dateStr);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}` === referenceMonth;
  }
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return false;
  const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  return ym === referenceMonth;
}

function drawInstitutionalPdfHeader(
  doc: jsPDF,
  titleSubtitle: string,
  metaLine: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  doc.setFillColor(20, 83, 45); // #14532D
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text(INSTITUTION_PROFILE.legalName.toUpperCase(), marginX, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.text(
    `${INSTITUTION_PROFILE.popularName} · CNPJ ${INSTITUTION_PROFILE.cnpj} · CNAE ${INSTITUTION_PROFILE.cnaePrincipal}`,
    marginX,
    17.5
  );
  doc.text(titleSubtitle, marginX, 23.2);
  doc.text(metaLine, marginX, 29);
}

function applyInstitutionalPdfFooters(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 221, 211);
    doc.line(marginX, pageHeight - 16, pageWidth - marginX, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(
      `${INSTITUTION_PROFILE.legalName} (${INSTITUTION_PROFILE.popularName}) · CNPJ ${INSTITUTION_PROFILE.cnpj} · ${INSTITUTION_PROFILE.stateLawShort}`,
      marginX,
      pageHeight - 11
    );
    doc.text(
      `${INSTITUTION_PROFILE.fullAddress} · Tel: ${INSTITUTION_PROFILE.phoneDisplay}`,
      marginX,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 9, {
      align: 'right',
    });
  }
}

/**
 * Strips or normalizes modern CSS color functions (oklch/oklab/color-mix) inside cloned stylesheets
 * so html2canvas renders cleanly even when Tailwind v4 is loaded on the host document.
 */
function sanitizeClonedStylesForHtml2Canvas(clonedDoc: Document) {
  const styleNodes = clonedDoc.querySelectorAll('style');
  styleNodes.forEach((styleNode) => {
    const css = styleNode.textContent;
    if (!css) return;
    if (css.includes('oklch(') || css.includes('oklab(') || css.includes('color-mix(')) {
      styleNode.textContent = css
        .replace(/oklch\([^)]*\)/g, '#1c1917')
        .replace(/oklab\([^)]*\)/g, '#1c1917')
        .replace(/color-mix\([^;{}]*\)/g, '#1c1917');
    }
  });
}

export async function exportReportElementToPdf(
  element: HTMLElement,
  options?: { filename?: string }
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#FFFFFF',
    logging: false,
    windowWidth: element.scrollWidth,
    onclone: (clonedDoc) => {
      sanitizeClonedStylesForHtml2Canvas(clonedDoc);
    },
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidthMm = doc.internal.pageSize.getWidth();
  const pageHeightMm = doc.internal.pageSize.getHeight();
  const marginXMm = 8;
  const marginTopMm = 8;
  const marginBottomMm = 18;
  const printableWidthMm = pageWidthMm - marginXMm * 2;
  const printableHeightMm = pageHeightMm - marginTopMm - marginBottomMm;

  const pxPerMm = canvas.width / printableWidthMm;
  const sliceHeightPx = Math.floor(printableHeightMm * pxPerMm);

  const slices: Array<{ dataUrl: string; heightMm: number }> = [];
  let offsetY = 0;

  while (offsetY < canvas.height) {
    const chunkHeightPx = Math.min(sliceHeightPx, canvas.height - offsetY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = chunkHeightPx;

    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        chunkHeightPx,
        0,
        0,
        canvas.width,
        chunkHeightPx
      );
    }

    slices.push({
      dataUrl: pageCanvas.toDataURL('image/png', 1.0),
      heightMm: chunkHeightPx / pxPerMm,
    });
    offsetY += chunkHeightPx;
  }

  const totalPages = Math.max(1, slices.length);

  slices.forEach((slice, index) => {
    if (index > 0) {
      doc.addPage();
    }
    doc.addImage(
      slice.dataUrl,
      'PNG',
      marginXMm,
      marginTopMm,
      printableWidthMm,
      slice.heightMm,
      undefined,
      'FAST'
    );

    doc.setDrawColor(226, 221, 211);
    doc.line(marginXMm, pageHeightMm - 14, pageWidthMm - marginXMm, pageHeightMm - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(
      `${INSTITUTION_PROFILE.legalName} (${INSTITUTION_PROFILE.popularName}) · CNPJ ${INSTITUTION_PROFILE.cnpj} · ${INSTITUTION_PROFILE.stateLawShort}`,
      marginXMm,
      pageHeightMm - 9.5
    );
    doc.text(
      `${INSTITUTION_PROFILE.fullAddress} · Tel: ${INSTITUTION_PROFILE.phoneDisplay}`,
      marginXMm,
      pageHeightMm - 5.5
    );
    doc.text(`Página ${index + 1} de ${totalPages}`, pageWidthMm - marginXMm, pageHeightMm - 7.5, {
      align: 'right',
    });
  });

  const filename =
    options?.filename ??
    `relatorio-dashboard-bom-pastor-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Relatório Mensal de Impacto focado em Usuários do Sistema (RBAC) e Voluntários (jsPDF + jspdf-autotable).
 */
export function generateUsersAndVolunteersImpactPdf(
  input: MonthlyUsersVolunteersPdfInput
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const periodLabel = formatReferenceMonthLabel(input.referenceMonth);

  const filteredUsers = input.systemUsers.filter((u) =>
    matchesReferenceMonth(u.createdAt, input.referenceMonth)
  );
  const filteredVolunteers = input.volunteerApplications.filter((v) =>
    matchesReferenceMonth(v.createdAt, input.referenceMonth)
  );
  const filteredAssisted = (input.assistedPeople ?? []).filter((a) =>
    matchesReferenceMonth(a.createdAt, input.referenceMonth)
  );
  const filteredDonations = (input.donations ?? []).filter((d) =>
    matchesReferenceMonth(d.createdAt, input.referenceMonth)
  );
  const filteredPickups = (input.pickups ?? []).filter((p) =>
    matchesReferenceMonth(p.preferredDate || p.createdAt, input.referenceMonth)
  );

  drawInstitutionalPdfHeader(
    doc,
    `Relatório Mensal de Impacto: Usuários & Voluntários · Competência: ${periodLabel}`,
    `Emitido em ${generatedAt}${input.generatedBy ? ` · Responsável: ${input.generatedBy}` : ''} · Visitantes: ${input.visitorStats.totalVisits.toLocaleString('pt-BR')}`
  );

  let currentY = 42;

  const ensureSpace = (neededMm: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + neededMm > pageHeight - 24) {
      doc.addPage();
      currentY = 18;
    }
  };

  const getLastTableFinalY = (): number => {
    const withAuto = doc as unknown as { lastAutoTable?: { finalY?: number } };
    return withAuto.lastAutoTable?.finalY ?? currentY + 10;
  };

  const drawSectionBanner = (tag: string, title: string, subtitle: string) => {
    ensureSpace(24);
    doc.setFillColor(244, 240, 232);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(20, 83, 45);
    doc.line(marginX, currentY, marginX, currentY + 14);

    doc.setTextColor(20, 83, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(tag.toUpperCase(), marginX + 4, currentY + 5);

    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, marginX + 4, currentY + 10.5);

    currentY += 17;
    if (subtitle) {
      doc.setTextColor(87, 83, 78);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(subtitle, marginX, currentY);
      currentY += 5;
    }
  };

  const activeUsersCount = input.systemUsers.filter((u) => u.status === 'ativo').length;
  const adminCount = input.systemUsers.filter((u) => u.role === 'admin').length;
  const gerenteCount = input.systemUsers.filter((u) => u.role === 'gerente').length;
  const usuarioCount = input.systemUsers.filter((u) => u.role === 'usuario').length;
  const totalPositions = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsTotal, 0);
  const filledPositions = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsFilled, 0);

  drawSectionBanner(
    'Síntese Executiva',
    `Indicadores de Impacto Social e Governança (${periodLabel})`,
    'Consolidação de contas cadastradas por nível de acesso (RBAC) e engajamento voluntário no Projeto Sopão.'
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Indicador de Impacto / Governança', 'No Período Selecionado', 'Total Acumulado']],
    body: [
      [
        'Contas de Usuários Cadastradas (RBAC)',
        String(filteredUsers.length),
        `${input.systemUsers.length} (${activeUsersCount} ativas)`,
      ],
      [
        'Distribuição por Papéis (Admin / Gerente / Usuário)',
        `${filteredUsers.filter((u) => u.role === 'admin').length} / ${filteredUsers.filter((u) => u.role === 'gerente').length} / ${filteredUsers.filter((u) => u.role === 'usuario').length}`,
        `${adminCount} / ${gerenteCount} / ${usuarioCount}`,
      ],
      [
        'Inscrições de Voluntários pelo Portal',
        String(filteredVolunteers.length),
        String(input.volunteerApplications.length),
      ],
      [
        'Frentes Operacionais de Voluntariado (Vagas)',
        `${VOLUNTEER_ROLES.length} frentes ativas`,
        `${filledPositions}/${totalPositions} vagas preenchidas`,
      ],
      [
        'Pessoas Assistidas Acompanhadas',
        String(filteredAssisted.length),
        String((input.assistedPeople ?? []).length),
      ],
      [
        'Doações e Coletas Registradas',
        `${filteredDonations.length} doações · ${filteredPickups.length} coletas`,
        `${(input.donations ?? []).length} doações · ${(input.pickups ?? []).length} coletas`,
      ],
    ],
    styles: { fontSize: 8.2, cellPadding: 2.4, textColor: [28, 25, 23] },
    headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 249, 245] },
  });

  currentY = getLastTableFinalY() + 10;

  // Seção 1: Usuários do Sistema (RBAC)
  const usersToRender =
    input.referenceMonth && input.referenceMonth !== 'all'
      ? filteredUsers
      : input.systemUsers;

  drawSectionBanner(
    'Seção 01 · Controle de Acesso',
    'Usuários Cadastrados no Sistema (RBAC)',
    `Exibindo ${usersToRender.length} conta(s) · Ativas no sistema: ${activeUsersCount} de ${input.systemUsers.length}`
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Nome Completo', 'E-mail', 'Nível (Role)', 'Status', 'Cadastro', 'Último Acesso']],
    body:
      usersToRender.length > 0
        ? usersToRender.map((u) => [
            u.nome || u.displayName,
            u.email,
            `${getRoleDefinition(u.role).shortLabel} (${u.role})`,
            u.status === 'ativo' ? 'Ativo' : 'Inativo',
            formatShortDateTime(u.createdAt),
            formatShortDateTime(u.lastLoginAt),
          ])
        : [
            [
              '—',
              '—',
              `Nenhum novo usuário cadastrado na competência ${periodLabel}`,
              '—',
              '—',
              '—',
            ],
          ],
    styles: { fontSize: 7.8, cellPadding: 2.2, textColor: [28, 25, 23] },
    headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 249, 245] },
  });

  currentY = getLastTableFinalY() + 10;

  // Seção 2: Voluntários Inscritos
  const volunteersToRender =
    input.referenceMonth && input.referenceMonth !== 'all'
      ? filteredVolunteers
      : input.volunteerApplications;

  drawSectionBanner(
    'Seção 02 · Engajamento Comunitário',
    'Voluntários Inscritos pelo Portal',
    `Total na competência: ${volunteersToRender.length} inscrição(ões) · Todas as vagas são expressamente voluntárias sem remuneração.`
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Voluntário', 'E-mail', 'Telefone / WhatsApp', 'Vaga Escolhida', 'Disponibilidade', 'Data']],
    body:
      volunteersToRender.length > 0
        ? volunteersToRender.map((v) => [
            v.fullName,
            v.email || '—',
            v.phone,
            v.roleTitle,
            v.availability,
            formatShortDateTime(v.createdAt),
          ])
        : [
            [
              '—',
              '—',
              '—',
              `Nenhuma nova inscrição de voluntário registrada na competência ${periodLabel}`,
              '—',
              '—',
            ],
          ],
    styles: { fontSize: 7.8, cellPadding: 2.2, textColor: [28, 25, 23] },
    headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 249, 245] },
  });

  currentY = getLastTableFinalY() + 10;

  // Seção 3: Quadro de Frentes de Voluntariado
  drawSectionBanner(
    'Seção 03 · Quadro de Frentes Ativas',
    'Frentes e Turnos de Voluntariado do Projeto Sopão',
    `Distribuição oficial das ${VOLUNTEER_ROLES.length} frentes operacionais (${filledPositions}/${totalPositions} vagas preenchidas).`
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Frente de Atuação', 'Categoria', 'Turno / Horário', 'Vagas Preenchidas']],
    body: VOLUNTEER_ROLES.map((r) => [
      r.title,
      r.category,
      `${r.shift} (${r.schedule})`,
      `${r.spotsFilled}/${r.spotsTotal}`,
    ]),
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
    headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 249, 245] },
  });

  applyInstitutionalPdfFooters(doc);

  const monthSlug =
    input.referenceMonth && input.referenceMonth !== 'all'
      ? input.referenceMonth
      : new Date().toISOString().slice(0, 7);
  doc.save(`relatorio-impacto-usuarios-voluntarios-${monthSlug}.pdf`);
}

export function generateDashboardPdfReport(input: DashboardPdfInput): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const periodLabel = formatReferenceMonthLabel(input.referenceMonth);

  drawInstitutionalPdfHeader(
    doc,
    `Relatório Gerencial do Dashboard · Competência: ${periodLabel}`,
    `Emitido em ${generatedAt}${input.generatedBy ? ` · Responsável: ${input.generatedBy}` : ''} · Visitantes: ${input.visitorStats.totalVisits} (${input.visitorStats.uniqueVisitors} únicos)`
  );

  let currentY = 42;

  const ensureSpace = (neededMm: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + neededMm > pageHeight - 24) {
      doc.addPage();
      currentY = 18;
    }
  };

  const drawSectionTitle = (indexLabel: string, title: string, subtitle: string) => {
    ensureSpace(22);
    doc.setFillColor(244, 240, 232); // #F4F0E8
    doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(20, 83, 45);
    doc.line(marginX, currentY, marginX, currentY + 14);

    doc.setTextColor(20, 83, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(indexLabel.toUpperCase(), marginX + 4, currentY + 5);

    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, marginX + 4, currentY + 10.5);

    currentY += 17;
    if (subtitle) {
      doc.setTextColor(87, 83, 78);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(subtitle, marginX, currentY);
      currentY += 5;
    }
  };

  const getLastTableFinalY = (): number => {
    const withAuto = doc as unknown as { lastAutoTable?: { finalY?: number } };
    return withAuto.lastAutoTable?.finalY ?? currentY + 10;
  };

  let sectionNum = 1;

  // 1. RELATÓRIO DE DOAÇÕES
  if (input.categories.donations) {
    const scopedDonations = input.donations.filter((d) =>
      matchesReferenceMonth(d.createdAt, input.referenceMonth)
    );
    const receivedCount = scopedDonations.filter((d) => d.status === 'Recebida').length;
    const pendingCount = scopedDonations.filter(
      (d) => d.status === 'Pendente' || d.status === 'Em Conferência'
    ).length;
    const canceledCount = scopedDonations.filter((d) => d.status === 'Cancelada').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Doações',
      `Total no período: ${scopedDonations.length} | Recebidas: ${receivedCount} | Pendentes/Conferência: ${pendingCount} | Canceladas: ${canceledCount}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Data', 'Protocolo', 'Colaborador', 'Canal', 'Valor / Itens', 'Status']],
      body:
        scopedDonations.length > 0
          ? scopedDonations.map((d) => [
              d.createdAt,
              d.referenceCode,
              d.donorName,
              d.type,
              typeof d.amountBRL === 'number' ? formatBRL(d.amountBRL) : d.itemsSummary || '—',
              d.status,
            ])
          : [['—', '—', 'Nenhuma doação registrada no período (valores zerados)', '—', 'R$ 0,00', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 2. RELATÓRIO DE VOLUNTÁRIOS
  if (input.categories.volunteers) {
    const scopedVolunteers = input.volunteerApplications.filter((v) =>
      matchesReferenceMonth(v.createdAt, input.referenceMonth)
    );
    const totalPositions = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsTotal, 0);
    const activeFilled = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsFilled, 0);

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Voluntários',
      `Frentes ativas: ${VOLUNTEER_ROLES.length} (${activeFilled}/${totalPositions} vagas preenchidas) | Inscrições no período: ${scopedVolunteers.length}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Frente de Atuação', 'Categoria', 'Turno / Horário', 'Vagas']],
      body: VOLUNTEER_ROLES.map((r) => [
        r.title,
        r.category,
        `${r.shift} (${r.schedule})`,
        `${r.spotsFilled}/${r.spotsTotal}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 5;
    ensureSpace(20);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Voluntário Inscrito', 'E-mail', 'Telefone', 'Vaga Escolhida', 'Disponibilidade', 'Data']],
      body:
        scopedVolunteers.length > 0
          ? scopedVolunteers.map((v) => [
              v.fullName,
              v.email || '—',
              v.phone,
              v.roleTitle,
              v.availability,
              formatShortDateTime(v.createdAt),
            ])
          : [['—', '—', '—', 'Nenhuma nova inscrição de voluntário registrada neste período', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 2B. RELATÓRIO DE USUÁRIOS DO SISTEMA (RBAC)
  if (input.categories.users) {
    const allUsers = input.systemUsers ?? [];
    const scopedUsers = allUsers.filter((u) =>
      matchesReferenceMonth(u.createdAt, input.referenceMonth)
    );
    const activeCount = scopedUsers.filter((u) => u.status === 'ativo').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Usuários Cadastrados e Níveis de Acesso (RBAC)',
      `Contas no período: ${scopedUsers.length} (Ativas: ${activeCount}) | Total acumulado na base: ${allUsers.length}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Nome Completo', 'E-mail', 'Nível (Role)', 'Status', 'Cadastro', 'Último Acesso']],
      body:
        scopedUsers.length > 0
          ? scopedUsers.map((u) => [
              u.nome || u.displayName,
              u.email,
              `${getRoleDefinition(u.role).shortLabel} (${u.role})`,
              u.status === 'ativo' ? 'Ativo' : 'Inativo',
              formatShortDateTime(u.createdAt),
              formatShortDateTime(u.lastLoginAt),
            ])
          : [['—', '—', '—', 'Nenhum usuário cadastrado neste período', '—', '—']],
      styles: { fontSize: 7.8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 3. RELATÓRIOS DE RECEITAS DE DOAÇÕES
  if (input.categories.revenues) {
    const scopedAcc = input.accountingEntries.filter((a) =>
      matchesReferenceMonth(a.date, input.referenceMonth)
    );
    const totalEntradas = scopedAcc
      .filter((a) => a.kind === 'Entrada')
      .reduce((acc, a) => acc + a.amountBRL, 0);
    const totalSaidas = scopedAcc
      .filter((a) => a.kind === 'Saída')
      .reduce((acc, a) => acc + a.amountBRL, 0);
    const saldoLiquido = totalEntradas - totalSaidas;
    const mrr = input.monthlyDonors
      .filter((m) => m.status !== 'Pausado')
      .reduce((acc, m) => acc + m.monthlyAmountBRL, 0);

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Receitas de Doações & Contabilidade',
      `Receitas (Entradas): ${formatBRL(totalEntradas)} | Despesas (Saídas): ${formatBRL(totalSaidas)} | Saldo: ${formatBRL(saldoLiquido)} | MRR PIX Mensal: ${formatBRL(mrr)}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Data', 'Doc / Ref', 'Tipo', 'Categoria', 'Descrição', 'Valor']],
      body:
        scopedAcc.length > 0
          ? scopedAcc.map((a) => [
              a.date,
              a.referenceCode,
              a.kind,
              a.category,
              a.description,
              `${a.kind === 'Entrada' ? '+' : '-'} ${formatBRL(a.amountBRL)}`,
            ])
          : [['—', '—', '—', '—', 'Nenhuma receita ou lançamento contábil registrado (R$ 0,00)', 'R$ 0,00']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 4. RELATÓRIOS DE COMIDAS DOADAS
  if (input.categories.donatedFoods) {
    const totalFoodUnits = input.products.reduce((sum, p) => sum + p.receivedQty, 0);
    const foodDonations = input.donations.filter((d) => d.type === 'Produtos');

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Comidas e Insumos Doados',
      `Total recebido em estoque de doações: ${totalFoodUnits} unidades/kg | Registros de entrega de alimentos: ${foodDonations.length}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Alimento / Insumo', 'Categoria', 'Unidade', 'Qtd. Doada', 'Meta', 'Prioridade']],
      body: input.products.map((p) => [
        p.name,
        p.category,
        p.unit,
        String(p.receivedQty),
        String(p.targetQty),
        p.priority,
      ]),
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 5. NÚMERO DE COLETAS FEITAS
  if (input.categories.pickupsCount) {
    const scopedPickups = input.pickups.filter((p) =>
      matchesReferenceMonth(p.preferredDate || p.createdAt, input.referenceMonth)
    );
    const donePickups = scopedPickups.filter((p) => p.status === 'Coletada').length;
    const scheduledOrRoute = scopedPickups.filter(
      (p) => p.status === 'Agendada' || p.status === 'Em Rota'
    ).length;
    const canceledPickups = scopedPickups.filter((p) => p.status === 'Cancelada').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Número de Coletas Feitas',
      `Coletas Feitas (Concluídas): ${donePickups} | Agendadas / Em Rota: ${scheduledOrRoute} | Canceladas: ${canceledPickups} | Total no Período: ${scopedPickups.length}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Data Preferencial', 'Turno', 'Colaborador', 'Endereço', 'Itens', 'Status']],
      body:
        scopedPickups.length > 0
          ? scopedPickups.map((p) => [
              p.preferredDate,
              p.preferredShift,
              p.collaboratorName,
              p.pickupAddress,
              p.items.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(', ') ||
                p.customItemsText ||
                '—',
              p.status,
            ])
          : [['—', '—', 'Nenhuma coleta realizada ou agendada no período (0 coletas)', '—', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 6. PESSOAS ASSISTIDAS PELA ASSOCIAÇÃO
  if (input.categories.assistedPeople) {
    const scopedAssisted = input.assistedPeople.filter((p) =>
      matchesReferenceMonth(p.createdAt, input.referenceMonth)
    );
    const activeAssisted = scopedAssisted.filter((p) => p.status === 'Ativa').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Cadastro de Pessoas Assistidas pela Associação',
      `Total no período: ${scopedAssisted.length} | Ativas no programa: ${activeAssisted}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Nome Completo', 'E-mail', 'Telefone', 'Bairro / Família', 'Status', 'Cadastro']],
      body:
        scopedAssisted.length > 0
          ? scopedAssisted.map((p) => [
              p.fullName,
              p.email,
              p.phone,
              `${p.neighborhood || 'Plácido de Castro'} (${p.householdSize ?? 1} pessoa(s))`,
              p.status,
              p.createdAt,
            ])
          : [['—', '—', '—', 'Nenhuma pessoa assistida cadastrada neste período', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });
  }

  applyInstitutionalPdfFooters(doc);

  const suffix =
    input.referenceMonth && input.referenceMonth !== 'all'
      ? input.referenceMonth
      : new Date().toISOString().slice(0, 10);
  doc.save(`relatorio-dashboard-bom-pastor-${suffix}.pdf`);
}
