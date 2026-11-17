import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  assistedPeople: AssistedPersonRecord[];
  visitorStats: VisitorStats;
  categories: DashboardPdfCategories;
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
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

export function generateDashboardPdfReport(input: DashboardPdfInput): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  // Header Banner
  doc.setFillColor(20, 83, 45); // #14532D
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(INSTITUTION_PROFILE.legalName.toUpperCase(), marginX, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${INSTITUTION_PROFILE.popularName} · CNPJ ${INSTITUTION_PROFILE.cnpj} · CNAE ${INSTITUTION_PROFILE.cnaePrincipal}`,
    marginX,
    18
  );
  doc.text(INSTITUTION_PROFILE.fullAddress, marginX, 23.5);
  doc.text(
    `Relatório Gerencial do Dashboard · Emitido em ${generatedAt} · Visitantes do Portal: ${input.visitorStats.totalVisits} (${input.visitorStats.uniqueVisitors} únicos)`,
    marginX,
    29
  );

  let currentY = 40;

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
    const receivedCount = input.donations.filter((d) => d.status === 'Recebida').length;
    const pendingCount = input.donations.filter(
      (d) => d.status === 'Pendente' || d.status === 'Em Conferência'
    ).length;
    const canceledCount = input.donations.filter((d) => d.status === 'Cancelada').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Doações',
      `Total de registros: ${input.donations.length} | Recebidas: ${receivedCount} | Pendentes/Conferência: ${pendingCount} | Canceladas: ${canceledCount}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Data', 'Protocolo', 'Colaborador', 'Canal', 'Valor / Itens', 'Status']],
      body:
        input.donations.length > 0
          ? input.donations.map((d) => [
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
    const totalPositions = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsTotal, 0);
    const activeFilled = VOLUNTEER_ROLES.reduce((sum, r) => sum + r.spotsFilled, 0);

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Voluntários',
      `Frentes ativas: ${VOLUNTEER_ROLES.length} (${activeFilled}/${totalPositions} vagas preenchidas) | Inscrições pelo Portal: ${input.volunteerApplications.length}`
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
      head: [['Voluntário Inscrito', 'Telefone', 'Vaga Escolhida', 'Disponibilidade', 'Data']],
      body:
        input.volunteerApplications.length > 0
          ? input.volunteerApplications.map((v) => [
              v.fullName,
              v.phone,
              v.roleTitle,
              v.availability,
              v.createdAt,
            ])
          : [['—', '—', 'Nenhuma nova inscrição de voluntário registrada neste dispositivo', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [68, 64, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });

    currentY = getLastTableFinalY() + 10;
  }

  // 3. RELATÓRIOS DE RECEITAS DE DOAÇÕES
  if (input.categories.revenues) {
    const totalEntradas = input.accountingEntries
      .filter((a) => a.kind === 'Entrada')
      .reduce((acc, a) => acc + a.amountBRL, 0);
    const totalSaidas = input.accountingEntries
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
        input.accountingEntries.length > 0
          ? input.accountingEntries.map((a) => [
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
    const donePickups = input.pickups.filter((p) => p.status === 'Coletada').length;
    const scheduledOrRoute = input.pickups.filter(
      (p) => p.status === 'Agendada' || p.status === 'Em Rota'
    ).length;
    const canceledPickups = input.pickups.filter((p) => p.status === 'Cancelada').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Relatório de Número de Coletas Feitas',
      `Coletas Feitas (Concluídas): ${donePickups} | Agendadas / Em Rota: ${scheduledOrRoute} | Canceladas: ${canceledPickups} | Total Geral: ${input.pickups.length}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Data Preferencial', 'Turno', 'Colaborador', 'Endereço', 'Itens', 'Status']],
      body:
        input.pickups.length > 0
          ? input.pickups.map((p) => [
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
    const activeAssisted = input.assistedPeople.filter((p) => p.status === 'Ativa').length;

    drawSectionTitle(
      `Categoria ${sectionNum++}`,
      'Cadastro de Pessoas Assistidas pela Associação',
      `Total cadastrado: ${input.assistedPeople.length} | Ativas no programa: ${activeAssisted}`
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['Nome Completo', 'E-mail', 'Telefone', 'Bairro / Família', 'Status', 'Cadastro']],
      body:
        input.assistedPeople.length > 0
          ? input.assistedPeople.map((p) => [
              p.fullName,
              p.email,
              p.phone,
              `${p.neighborhood || 'Plácido de Castro'} (${p.householdSize ?? 1} pessoa(s))`,
              p.status,
              p.createdAt,
            ])
          : [['—', '—', '—', 'Nenhuma pessoa assistida cadastrada até o momento', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [28, 25, 23] },
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 249, 245] },
    });
  }

  // Institutional Footer on every page
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

  const filename = `relatorio-dashboard-bom-pastor-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
