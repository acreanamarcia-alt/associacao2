import { useCallback, useEffect, useState } from 'react';

export type DonationType = 'PIX' | 'PIX Mensal' | 'Gateway Cartão/Boleto' | 'Produtos';
export type DonationStatus = 'Recebida' | 'Pendente' | 'Em Conferência' | 'Cancelada';
export type PickupStatus = 'Agendada' | 'Em Rota' | 'Coletada' | 'Cancelada';
export type MonthlyDonorStatus = 'Em dia' | 'Aguardando PIX' | 'Pausado';
export type AccountingKind = 'Entrada' | 'Saída';
export type ProductCategory =
  | 'Insumos do Sopão'
  | 'Panificação Solidária'
  | 'Porcionamento & Kits'
  | 'Higiene & Limpeza';

export interface DonationProductItem {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  priority: 'Prioritário' | 'Contínuo' | 'Estável';
  targetQty: number;
  receivedQty: number;
  active: boolean;
}

export interface DonationRecord {
  id: string;
  createdAt: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  type: DonationType;
  amountBRL?: number;
  itemsSummary?: string;
  referenceCode: string;
  status: DonationStatus;
  notes?: string;
}

export interface MonthlyDonorRecord {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  monthlyAmountBRL: number;
  dueDay: number;
  pixChannel: 'CNPJ 33.314.701/0001-54' | 'Telefone +55 68 9958-7200';
  status: MonthlyDonorStatus;
  lastPaidMonth: string; // YYYY-MM or ''
  totalContributedBRL: number;
  notes?: string;
}

export interface AccountingEntry {
  id: string;
  date: string;
  kind: AccountingKind;
  category: string;
  description: string;
  amountBRL: number;
  referenceCode: string;
  reconciled: boolean;
}

export interface PickupItemSelection {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface PickupScheduleRecord {
  id: string;
  createdAt: string;
  collaboratorName: string;
  collaboratorEmail: string;
  collaboratorPhone: string;
  pickupAddress: string;
  preferredDate: string;
  preferredShift: 'Manhã (08h–12h)' | 'Tarde (14h–18h)' | 'Sábado (08h–12h)';
  items: PickupItemSelection[];
  customItemsText?: string;
  status: PickupStatus;
  notes?: string;
}

export const PIX_INFO = {
  keyType: 'CNPJ',
  pixKey: '33.314.701/0001-54',
  pixPhoneDisplay: '+55 68 9958-7200',
  pixPhoneKey: '+556899587200',
  beneficiary: 'Associação Recanto Social Bom Pastor',
  city: 'Plácido de Castro - AC',
  bankLabel: 'Conta Institucional OSC · Projeto Sopão',
  pickupWhatsappDigits: '556899587200',
  pickupWhatsappDisplay: '+55 68 9958-7200',
};

export const INITIAL_PRODUCTS: DonationProductItem[] = [
  {
    id: 'prod-arroz',
    name: 'Arroz tipo 1',
    category: 'Insumos do Sopão',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 200,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-feijao',
    name: 'Feijão carioca ou preto',
    category: 'Insumos do Sopão',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 120,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-macarrao',
    name: 'Macarrão para sopa',
    category: 'Insumos do Sopão',
    unit: 'pct 500g',
    priority: 'Contínuo',
    targetQty: 150,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-proteina',
    name: 'Carne bovina ou frango',
    category: 'Insumos do Sopão',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 100,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-legumes',
    name: 'Legumes frescos (batata, cenoura, abóbora)',
    category: 'Insumos do Sopão',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 180,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-trigo',
    name: 'Farinha de trigo especial',
    category: 'Panificação Solidária',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 250,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-acucar',
    name: 'Açúcar cristal',
    category: 'Panificação Solidária',
    unit: 'kg',
    priority: 'Contínuo',
    targetQty: 100,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-fermento',
    name: 'Fermento biológico seco',
    category: 'Panificação Solidária',
    unit: 'unid 500g',
    priority: 'Contínuo',
    targetQty: 30,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-margarina',
    name: 'Margarina ou óleo de soja',
    category: 'Panificação Solidária',
    unit: 'unid',
    priority: 'Contínuo',
    targetQty: 80,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-farinha-mandioca',
    name: 'Farinha de mandioca (para farofa)',
    category: 'Porcionamento & Kits',
    unit: 'kg',
    priority: 'Prioritário',
    targetQty: 90,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-potes',
    name: 'Potes descartáveis com tampa (500ml)',
    category: 'Porcionamento & Kits',
    unit: 'pct 50 unid',
    priority: 'Prioritário',
    targetQty: 40,
    receivedQty: 0,
    active: true,
  },
  {
    id: 'prod-higiene',
    name: 'Detergente, álcool 70% e luvas descartáveis',
    category: 'Higiene & Limpeza',
    unit: 'kit',
    priority: 'Estável',
    targetQty: 35,
    receivedQty: 0,
    active: true,
  },
];

const INITIAL_DONATIONS: DonationRecord[] = [];

const INITIAL_MONTHLY_DONORS: MonthlyDonorRecord[] = [];

const INITIAL_ACCOUNTING: AccountingEntry[] = [];

const INITIAL_PICKUPS: PickupScheduleRecord[] = [];

const KEY_PRODUCTS = 'rsbp_donation_products_v2';
const KEY_DONATIONS = 'rsbp_donation_records_v2';
const KEY_PICKUPS = 'rsbp_pickup_schedules_v2';
const KEY_MONTHLY_DONORS = 'rsbp_monthly_donors_v2';
const KEY_ACCOUNTING = 'rsbp_accounting_entries_v2';
const SYNC_EVENT = 'rsbp-donations-sync';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function buildPixPayload(
  amountBRL?: number,
  keyOption: 'cnpj' | 'phone' = 'cnpj'
): string {
  const key = keyOption === 'phone' ? PIX_INFO.pixPhoneKey : '33314701000154';
  const keySub = `0014br.gov.bcb.pix01${String(key.length).padStart(2, '0')}${key}`;
  const tag26 = `26${String(keySub.length).padStart(2, '0')}${keySub}`;
  const amount = amountBRL && amountBRL > 0 ? amountBRL.toFixed(2) : '';
  const amountTag = amount ? `54${String(amount.length).padStart(2, '0')}${amount}` : '';
  return [
    '000201',
    tag26,
    '52040000',
    '5303986',
    amountTag,
    '5802BR',
    '5925RECANTO SOCIAL BOM PASTOR',
    '6016PLACIDO DE CASTRO',
    '62070503***',
    '6304A1B2',
  ].join('');
}

export function buildPickupWhatsappUrl(pickup: {
  collaboratorName: string;
  collaboratorEmail: string;
  collaboratorPhone: string;
  pickupAddress: string;
  preferredDate: string;
  preferredShift: string;
  items: PickupItemSelection[];
  customItemsText?: string;
}): string {
  const itemsList = pickup.items
    .map((i) => `- ${i.productName}: ${i.quantity} ${i.unit}`)
    .join('\n');
  const customLine = pickup.customItemsText?.trim()
    ? `\n- Outros itens: ${pickup.customItemsText.trim()}`
    : '';

  const message = [
    '*AGENDAMENTO DE COLETA DE DOAÇÕES — PROJETO SOPÃO*',
    `Colaborador(a): ${pickup.collaboratorName}`,
    `E-mail: ${pickup.collaboratorEmail}`,
    `Telefone: ${pickup.collaboratorPhone}`,
    `Endereço de coleta: ${pickup.pickupAddress}`,
    `Data e turno: ${pickup.preferredDate} · ${pickup.preferredShift}`,
    '',
    '*Lista de produtos para recebimento:*',
    itemsList || '- A combinar no momento da coleta',
    customLine,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function buildMonthlyDonorWhatsappUrl(donor: {
  name: string;
  monthlyAmountBRL: number;
  dueDay: number;
  pixChannel: string;
}): string {
  const message = [
    '*ADESÃO / RECIBO DE DOADOR MENSAL — PROJETO SOPÃO*',
    'Associação Recanto Social Bom Pastor · CNPJ 33.314.701/0001-54',
    `Doador(a): ${donor.name}`,
    `Valor mensal via PIX: R$ ${donor.monthlyAmountBRL.toFixed(2).replace('.', ',')}`,
    `Dia de contribuição: Todo dia ${String(donor.dueDay).padStart(2, '0')}`,
    `Chave PIX escolhida: ${donor.pixChannel}`,
  ].join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function buildAssociationWhatsappUrl(customMessage?: string): string {
  const text =
    customMessage ??
    'Olá! Gostaria de falar com a Associação Recanto Social Bom Pastor (Projeto Sopão) sobre doações, voluntariado ou coletas.';
  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(text)}`;
}

export function buildDonationReceiptWhatsappUrl(donation: {
  referenceCode: string;
  createdAt: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  type: DonationType;
  amountBRL?: number;
  itemsSummary?: string;
  status: DonationStatus;
  notes?: string;
}): string {
  const valueLine =
    typeof donation.amountBRL === 'number'
      ? `Valor doado: R$ ${donation.amountBRL.toFixed(2).replace('.', ',')}`
      : `Itens doados: ${donation.itemsSummary || 'Produtos alimentícios / insumos'}`;

  const message = [
    '*RECIBO DE DOAÇÃO — PROJETO SOPÃO*',
    'Associação Recanto Social Bom Pastor · CNPJ 33.314.701/0001-54',
    `Protocolo: ${donation.referenceCode}`,
    `Data: ${donation.createdAt}`,
    `Colaborador(a): ${donation.donorName}`,
    `E-mail: ${donation.donorEmail}`,
    `Telefone: ${donation.donorPhone}`,
    `Modalidade: ${donation.type}`,
    valueLine,
    `Status: ${donation.status}`,
    donation.notes ? `Observações: ${donation.notes}` : '',
    '',
    'Rua Zuila Ferreira de Freitas, nº 933, Bairro Olaria, Plácido de Castro - AC',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function buildAllDonationsWhatsappUrl(donations: DonationRecord[]): string {
  if (donations.length === 0) {
    return buildAssociationWhatsappUrl(
      '*RECIBOS DE DOAÇÕES — PROJETO SOPÃO*\nNenhuma doação registrada no painel administrativo até o momento.'
    );
  }

  const lines = donations.slice(0, 20).map((d, idx) => {
    const valueText =
      typeof d.amountBRL === 'number'
        ? `R$ ${d.amountBRL.toFixed(2).replace('.', ',')}`
        : d.itemsSummary || 'Produtos';
    return `${idx + 1}. [${d.referenceCode}] ${d.donorName} · ${d.type} · ${valueText} (${d.status}) - ${d.createdAt}`;
  });

  const extra =
    donations.length > 20
      ? `\n... e mais ${donations.length - 20} recibo(s) registrado(s) no painel.`
      : '';

  const message = [
    '*ENVIO DE RECIBOS DE DOAÇÕES — PROJETO SOPÃO*',
    'Associação Recanto Social Bom Pastor · CNPJ 33.314.701/0001-54',
    `Total de recibos: ${donations.length}`,
    '',
    ...lines,
    extra,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function buildAllPickupsWhatsappUrl(pickups: PickupScheduleRecord[]): string {
  if (pickups.length === 0) {
    return buildAssociationWhatsappUrl(
      '*AGENDAMENTOS DE COLETAS — PROJETO SOPÃO*\nNenhum agendamento de coleta cadastrado no painel até o momento.'
    );
  }

  const lines = pickups.slice(0, 15).map((p, idx) => {
    const items =
      p.items.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(', ') ||
      p.customItemsText ||
      'A combinar';
    return `${idx + 1}. ${p.collaboratorName} (${p.collaboratorPhone}) · ${p.preferredDate} (${p.preferredShift}) · End: ${p.pickupAddress} · Itens: ${items} [${p.status}]`;
  });

  const extra =
    pickups.length > 15
      ? `\n... e mais ${pickups.length - 15} agendamento(s) no painel.`
      : '';

  const message = [
    '*AGENDAMENTOS DE COLETAS — PROJETO SOPÃO*',
    'Associação Recanto Social Bom Pastor · CNPJ 33.314.701/0001-54',
    `Total de coletas: ${pickups.length}`,
    '',
    ...lines,
    extra,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}

export function buildAllDonationsAndPickupsWhatsappUrl(
  donations: DonationRecord[],
  pickups: PickupScheduleRecord[]
): string {
  const donLines =
    donations.length > 0
      ? donations.slice(0, 12).map((d, idx) => {
          const val =
            typeof d.amountBRL === 'number'
              ? `R$ ${d.amountBRL.toFixed(2).replace('.', ',')}`
              : d.itemsSummary || 'Produtos';
          return `${idx + 1}. [${d.referenceCode}] ${d.donorName} · ${d.type} · ${val} (${d.status})`;
        })
      : ['Nenhuma doação registrada no momento.'];

  const pickupLines =
    pickups.length > 0
      ? pickups.slice(0, 12).map((p, idx) => {
          const items =
            p.items.map((it) => `${it.quantity} ${it.unit} ${it.productName}`).join(', ') ||
            p.customItemsText ||
            'A combinar';
          return `${idx + 1}. ${p.collaboratorName} · ${p.preferredDate} (${p.preferredShift}) · ${p.pickupAddress} · ${items} [${p.status}]`;
        })
      : ['Nenhum agendamento de coleta registrado no momento.'];

  const message = [
    '*RELATÓRIO DE RECIBOS E COLETAS — PROJETO SOPÃO*',
    'Associação Recanto Social Bom Pastor · CNPJ 33.314.701/0001-54',
    '',
    `*RECIBOS DE DOAÇÕES (${donations.length}):*`,
    ...donLines,
    donations.length > 12 ? `... (+${donations.length - 12} doações)` : '',
    '',
    `*AGENDAMENTOS DE COLETAS (${pickups.length}):*`,
    ...pickupLines,
    pickups.length > 12 ? `... (+${pickups.length - 12} coletas)` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${PIX_INFO.pickupWhatsappDigits}?text=${encodeURIComponent(message)}`;
}


export function useDonationsStore() {
  const [products, setProducts] = useState<DonationProductItem[]>(() =>
    readStorage(KEY_PRODUCTS, INITIAL_PRODUCTS)
  );
  const [donations, setDonations] = useState<DonationRecord[]>(() =>
    readStorage(KEY_DONATIONS, INITIAL_DONATIONS)
  );
  const [pickups, setPickups] = useState<PickupScheduleRecord[]>(() =>
    readStorage(KEY_PICKUPS, INITIAL_PICKUPS)
  );
  const [monthlyDonors, setMonthlyDonors] = useState<MonthlyDonorRecord[]>(() =>
    readStorage(KEY_MONTHLY_DONORS, INITIAL_MONTHLY_DONORS)
  );
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>(() =>
    readStorage(KEY_ACCOUNTING, INITIAL_ACCOUNTING)
  );

  useEffect(() => {
    const sync = () => {
      setProducts(readStorage(KEY_PRODUCTS, INITIAL_PRODUCTS));
      setDonations(readStorage(KEY_DONATIONS, INITIAL_DONATIONS));
      setPickups(readStorage(KEY_PICKUPS, INITIAL_PICKUPS));
      setMonthlyDonors(readStorage(KEY_MONTHLY_DONORS, INITIAL_MONTHLY_DONORS));
      setAccountingEntries(readStorage(KEY_ACCOUNTING, INITIAL_ACCOUNTING));
    };
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const appendAccountingIfMissing = useCallback(
    (entry: Omit<AccountingEntry, 'id'>) => {
      const current = readStorage<AccountingEntry[]>(KEY_ACCOUNTING, INITIAL_ACCOUNTING);
      if (current.some((a) => a.referenceCode === entry.referenceCode)) return;
      const next: AccountingEntry[] = [{ ...entry, id: `acc-${Date.now()}` }, ...current];
      setAccountingEntries(next);
      writeStorage(KEY_ACCOUNTING, next);
    },
    []
  );

  const addDonation = useCallback(
    (entry: Omit<DonationRecord, 'id' | 'createdAt' | 'referenceCode'>) => {
      const current = readStorage<DonationRecord[]>(KEY_DONATIONS, INITIAL_DONATIONS);
      const today = new Date().toISOString().slice(0, 10);
      const prefix =
        entry.type === 'PIX'
          ? 'PIX'
          : entry.type === 'PIX Mensal'
            ? 'PIXM'
            : entry.type === 'Produtos'
              ? 'PROD'
              : 'GW';
      const referenceCode = `${prefix}-${today.replace(/-/g, '')}-${String(
        current.length + 1
      ).padStart(2, '0')}`;
      const newRecord: DonationRecord = {
        ...entry,
        id: `don-${Date.now()}`,
        createdAt: today,
        referenceCode,
      };
      const next = [newRecord, ...current];
      setDonations(next);
      writeStorage(KEY_DONATIONS, next);

      if (newRecord.status === 'Recebida' && typeof newRecord.amountBRL === 'number') {
        appendAccountingIfMissing({
          date: today,
          kind: 'Entrada',
          category:
            newRecord.type === 'PIX Mensal'
              ? 'Doador Mensal PIX'
              : newRecord.type === 'PIX'
                ? 'Doação Avulsa PIX'
                : 'Gateway Cartão/Boleto',
          description: `Doação confirmada — ${newRecord.donorName}`,
          amountBRL: newRecord.amountBRL,
          referenceCode,
          reconciled: true,
        });
      }

      return newRecord;
    },
    [appendAccountingIfMissing]
  );

  const updateDonationStatus = useCallback(
    (id: string, status: DonationStatus) => {
      const current = readStorage<DonationRecord[]>(KEY_DONATIONS, INITIAL_DONATIONS);
      const target = current.find((d) => d.id === id);
      const next = current.map((d) => (d.id === id ? { ...d, status } : d));
      setDonations(next);
      writeStorage(KEY_DONATIONS, next);

      if (
        status === 'Recebida' &&
        target &&
        typeof target.amountBRL === 'number' &&
        target.amountBRL > 0
      ) {
        appendAccountingIfMissing({
          date: new Date().toISOString().slice(0, 10),
          kind: 'Entrada',
          category:
            target.type === 'PIX Mensal'
              ? 'Doador Mensal PIX'
              : target.type === 'PIX'
                ? 'Doação Avulsa PIX'
                : 'Gateway Cartão/Boleto',
          description: `Doação liquidada — ${target.donorName}`,
          amountBRL: target.amountBRL,
          referenceCode: target.referenceCode,
          reconciled: true,
        });
      }
    },
    [appendAccountingIfMissing]
  );

  const deleteDonation = useCallback((id: string) => {
    const current = readStorage<DonationRecord[]>(KEY_DONATIONS, INITIAL_DONATIONS);
    const next = current.filter((d) => d.id !== id);
    setDonations(next);
    writeStorage(KEY_DONATIONS, next);
  }, []);

  const addMonthlyDonor = useCallback(
    (
      donor: Omit<
        MonthlyDonorRecord,
        'id' | 'createdAt' | 'status' | 'lastPaidMonth' | 'totalContributedBRL'
      > & { paidFirstMonthNow?: boolean }
    ) => {
      const current = readStorage<MonthlyDonorRecord[]>(
        KEY_MONTHLY_DONORS,
        INITIAL_MONTHLY_DONORS
      );
      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      const paidNow = Boolean(donor.paidFirstMonthNow);

      const newDonor: MonthlyDonorRecord = {
        id: `md-${Date.now()}`,
        createdAt: today,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        monthlyAmountBRL: donor.monthlyAmountBRL,
        dueDay: donor.dueDay,
        pixChannel: donor.pixChannel,
        status: paidNow ? 'Em dia' : 'Aguardando PIX',
        lastPaidMonth: paidNow ? currentMonth : '',
        totalContributedBRL: paidNow ? donor.monthlyAmountBRL : 0,
        notes: donor.notes,
      };

      const next = [newDonor, ...current];
      setMonthlyDonors(next);
      writeStorage(KEY_MONTHLY_DONORS, next);

      if (paidNow) {
        const ref = `PIXM-${today.replace(/-/g, '')}-${String(current.length + 1).padStart(2, '0')}`;
        appendAccountingIfMissing({
          date: today,
          kind: 'Entrada',
          category: 'Doador Mensal PIX',
          description: `Adesão mensal ${currentMonth} — ${newDonor.name} (${newDonor.pixChannel})`,
          amountBRL: newDonor.monthlyAmountBRL,
          referenceCode: ref,
          reconciled: true,
        });
      }

      return newDonor;
    },
    [appendAccountingIfMissing]
  );

  const confirmMonthlyDonorPayment = useCallback(
    (id: string) => {
      const current = readStorage<MonthlyDonorRecord[]>(
        KEY_MONTHLY_DONORS,
        INITIAL_MONTHLY_DONORS
      );
      const target = current.find((m) => m.id === id);
      if (!target) return;

      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);

      const next = current.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Em dia' as MonthlyDonorStatus,
              lastPaidMonth: currentMonth,
              totalContributedBRL: m.totalContributedBRL + m.monthlyAmountBRL,
            }
          : m
      );
      setMonthlyDonors(next);
      writeStorage(KEY_MONTHLY_DONORS, next);

      const refCode = `PIXM-${currentMonth.replace('-', '')}-${id.slice(-4)}-${Date.now()
        .toString()
        .slice(-3)}`;

      appendAccountingIfMissing({
        date: today,
        kind: 'Entrada',
        category: 'Doador Mensal PIX',
        description: `Mensalidade ${currentMonth} — ${target.name} (${target.pixChannel})`,
        amountBRL: target.monthlyAmountBRL,
        referenceCode: refCode,
        reconciled: true,
      });

      // Also mirror into DonationRecord receipts
      const currentDonations = readStorage<DonationRecord[]>(KEY_DONATIONS, INITIAL_DONATIONS);
      const mirroredDonation: DonationRecord = {
        id: `don-md-${Date.now()}`,
        createdAt: today,
        donorName: target.name,
        donorEmail: target.email,
        donorPhone: target.phone,
        type: 'PIX Mensal',
        amountBRL: target.monthlyAmountBRL,
        referenceCode: refCode,
        status: 'Recebida',
        notes: `Mensalidade ${currentMonth} via ${target.pixChannel}`,
      };
      const nextDonations = [mirroredDonation, ...currentDonations];
      setDonations(nextDonations);
      writeStorage(KEY_DONATIONS, nextDonations);
    },
    [appendAccountingIfMissing]
  );

  const updateMonthlyDonorStatus = useCallback((id: string, status: MonthlyDonorStatus) => {
    const current = readStorage<MonthlyDonorRecord[]>(
      KEY_MONTHLY_DONORS,
      INITIAL_MONTHLY_DONORS
    );
    const next = current.map((m) => (m.id === id ? { ...m, status } : m));
    setMonthlyDonors(next);
    writeStorage(KEY_MONTHLY_DONORS, next);
  }, []);

  const deleteMonthlyDonor = useCallback((id: string) => {
    const current = readStorage<MonthlyDonorRecord[]>(
      KEY_MONTHLY_DONORS,
      INITIAL_MONTHLY_DONORS
    );
    const next = current.filter((m) => m.id !== id);
    setMonthlyDonors(next);
    writeStorage(KEY_MONTHLY_DONORS, next);
  }, []);

  const addAccountingEntry = useCallback(
    (entry: Omit<AccountingEntry, 'id' | 'referenceCode'> & { referenceCode?: string }) => {
      const current = readStorage<AccountingEntry[]>(KEY_ACCOUNTING, INITIAL_ACCOUNTING);
      const code =
        entry.referenceCode?.trim() ||
        `${entry.kind === 'Entrada' ? 'ENT' : 'SAI'}-${entry.date.replace(/-/g, '')}-${String(
          current.length + 1
        ).padStart(2, '0')}`;
      const newAcc: AccountingEntry = {
        id: `acc-${Date.now()}`,
        date: entry.date,
        kind: entry.kind,
        category: entry.category,
        description: entry.description,
        amountBRL: entry.amountBRL,
        referenceCode: code,
        reconciled: entry.reconciled,
      };
      const next = [newAcc, ...current];
      setAccountingEntries(next);
      writeStorage(KEY_ACCOUNTING, next);
      return newAcc;
    },
    []
  );

  const toggleReconcileEntry = useCallback((id: string) => {
    const current = readStorage<AccountingEntry[]>(KEY_ACCOUNTING, INITIAL_ACCOUNTING);
    const next = current.map((a) => (a.id === id ? { ...a, reconciled: !a.reconciled } : a));
    setAccountingEntries(next);
    writeStorage(KEY_ACCOUNTING, next);
  }, []);

  const deleteAccountingEntry = useCallback((id: string) => {
    const current = readStorage<AccountingEntry[]>(KEY_ACCOUNTING, INITIAL_ACCOUNTING);
    const next = current.filter((a) => a.id !== id);
    setAccountingEntries(next);
    writeStorage(KEY_ACCOUNTING, next);
  }, []);

  const addPickupSchedule = useCallback(
    (entry: Omit<PickupScheduleRecord, 'id' | 'createdAt' | 'status'>) => {
      const currentPickups = readStorage<PickupScheduleRecord[]>(
        KEY_PICKUPS,
        INITIAL_PICKUPS
      );
      const today = new Date().toISOString().slice(0, 10);
      const newPickup: PickupScheduleRecord = {
        ...entry,
        id: `col-${Date.now()}`,
        createdAt: today,
        status: 'Agendada',
      };
      const nextPickups = [newPickup, ...currentPickups];
      setPickups(nextPickups);
      writeStorage(KEY_PICKUPS, nextPickups);

      const summaryParts = entry.items.map(
        (item) => `${item.quantity} ${item.unit} ${item.productName}`
      );
      if (entry.customItemsText?.trim()) {
        summaryParts.push(entry.customItemsText.trim());
      }
      const currentDonations = readStorage<DonationRecord[]>(
        KEY_DONATIONS,
        INITIAL_DONATIONS
      );
      const linkedDonation: DonationRecord = {
        id: `don-col-${Date.now()}`,
        createdAt: today,
        donorName: entry.collaboratorName,
        donorEmail: entry.collaboratorEmail,
        donorPhone: entry.collaboratorPhone,
        type: 'Produtos',
        itemsSummary: summaryParts.join(', ') || 'Coleta agendada de alimentos',
        referenceCode: `COL-${today.replace(/-/g, '')}-${String(
          currentDonations.length + 1
        ).padStart(2, '0')}`,
        status: 'Pendente',
        notes: `Coleta agendada para ${entry.preferredDate} (${entry.preferredShift}) em ${entry.pickupAddress}.`,
      };
      const nextDonations = [linkedDonation, ...currentDonations];
      setDonations(nextDonations);
      writeStorage(KEY_DONATIONS, nextDonations);

      return newPickup;
    },
    []
  );

  const updatePickupStatus = useCallback((id: string, status: PickupStatus) => {
    const current = readStorage<PickupScheduleRecord[]>(KEY_PICKUPS, INITIAL_PICKUPS);
    const target = current.find((p) => p.id === id);
    const next = current.map((p) => (p.id === id ? { ...p, status } : p));
    setPickups(next);
    writeStorage(KEY_PICKUPS, next);

    if (status === 'Coletada' && target && target.status !== 'Coletada') {
      const currentProducts = readStorage<DonationProductItem[]>(
        KEY_PRODUCTS,
        INITIAL_PRODUCTS
      );
      const nextProducts = currentProducts.map((prod) => {
        const matched = target.items.find((i) => i.productId === prod.id);
        if (!matched) return prod;
        return { ...prod, receivedQty: prod.receivedQty + matched.quantity };
      });
      setProducts(nextProducts);
      writeStorage(KEY_PRODUCTS, nextProducts);
    }
  }, []);

  const addProductItem = useCallback(
    (item: Omit<DonationProductItem, 'id' | 'receivedQty' | 'active'>) => {
      const current = readStorage<DonationProductItem[]>(KEY_PRODUCTS, INITIAL_PRODUCTS);
      const newProd: DonationProductItem = {
        ...item,
        id: `prod-${Date.now()}`,
        receivedQty: 0,
        active: true,
      };
      const next = [newProd, ...current];
      setProducts(next);
      writeStorage(KEY_PRODUCTS, next);
      return newProd;
    },
    []
  );

  const updateProductItem = useCallback(
    (id: string, patch: Partial<DonationProductItem>) => {
      const current = readStorage<DonationProductItem[]>(KEY_PRODUCTS, INITIAL_PRODUCTS);
      const next = current.map((p) => (p.id === id ? { ...p, ...patch } : p));
      setProducts(next);
      writeStorage(KEY_PRODUCTS, next);
    },
    []
  );

  const resetAllFinancialData = useCallback(() => {
    const zeroedProducts = INITIAL_PRODUCTS.map((p) => ({ ...p, receivedQty: 0 }));
    setProducts(zeroedProducts);
    setDonations([]);
    setPickups([]);
    setMonthlyDonors([]);
    setAccountingEntries([]);
    try {
      localStorage.setItem(KEY_PRODUCTS, JSON.stringify(zeroedProducts));
      localStorage.setItem(KEY_DONATIONS, JSON.stringify([]));
      localStorage.setItem(KEY_PICKUPS, JSON.stringify([]));
      localStorage.setItem(KEY_MONTHLY_DONORS, JSON.stringify([]));
      localStorage.setItem(KEY_ACCOUNTING, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent(SYNC_EVENT));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
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
  };
}
