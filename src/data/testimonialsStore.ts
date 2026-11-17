import { useEffect, useState } from 'react';

export type TestimonialCategory =
  | 'Sopão Comunitário'
  | 'Pães & Bolos'
  | 'Entregas & Kits';

export interface BeneficiaryTestimonial {
  id: string;
  personName: string;
  roleOrContext: string;
  neighborhood: string;
  category: TestimonialCategory;
  assistedSince: string;
  quote: string;
  impactSummary: string;
  isUserSubmitted?: boolean;
  createdAt: string;
}

const TESTIMONIALS_STORAGE_KEY = 'arsbp_beneficiary_testimonials_v1';

export const INITIAL_TESTIMONIALS: BeneficiaryTestimonial[] = [
  {
    id: 'dep-1',
    personName: 'Maria Raimunda da Silva',
    roleOrContext: 'Mãe de 3 filhos · Dona de casa',
    neighborhood: 'Bairro Olaria · Plácido de Castro',
    category: 'Sopão Comunitário',
    assistedSince: 'Atendida desde 2021',
    quote:
      'Quando o trabalho faltou aqui em casa, eu não sabia como garantir a janta das crianças no fim da tarde. Toda terça e quinta o sopão quente da associação chega com verdura, carne e muito respeito, sem humilhação nenhuma.',
    impactSummary: 'Refeição noturna garantida para 4 pessoas da família',
    createdAt: '2025-02-14T18:00:00.000Z',
  },
  {
    id: 'dep-2',
    personName: 'Seu Antônio Pereira Mendes',
    roleOrContext: 'Aposentado · Morador antigo',
    neighborhood: 'Rua Zuila Ferreira de Freitas · Olaria',
    category: 'Pães & Bolos',
    assistedSince: 'Atendido desde 2022',
    quote:
      'Moro sozinho e o dinheiro da aposentadoria vai quase todo em remédio. Os pães caseiros e os pedaços de bolo que os voluntários assam de manhã fazem toda a diferença no meu café da manhã e no lanche da tarde.',
    impactSummary: 'Pães caseiros e bolos entregues semanalmente',
    createdAt: '2025-03-08T10:30:00.000Z',
  },
  {
    id: 'dep-3',
    personName: 'Francisca das Chagas Oliveira',
    roleOrContext: 'Trabalhadora diarista · Responsável por 2 netos',
    neighborhood: 'Comunidade Ramal Linha 1 · Zona Rural',
    category: 'Entregas & Kits',
    assistedSince: 'Atendida desde 2024',
    quote:
      'Antes era muito difícil vir do ramal até a cidade buscar ajuda. Depois que o projeto passou a vir de carro nas rotas de sábado, recebemos as marmitas, a farofa temperada e os pães direto na porteira de casa.',
    impactSummary: 'Atendimento domiciliar em rota rural de sábado',
    createdAt: '2025-06-19T12:15:00.000Z',
  },
  {
    id: 'dep-4',
    personName: 'Josenildo Ferreira Costa',
    roleOrContext: 'Trabalhador autônomo em recuperação de saúde',
    neighborhood: 'Bairro Centro · Plácido de Castro',
    category: 'Sopão Comunitário',
    assistedSince: 'Atendido desde 2023',
    quote:
      'Passei quatro meses sem conseguir fazer serviço pesado por causa de uma cirurgia. Os voluntários do Bom Pastor não só garantiram a alimentação da minha casa, mas me acolheram com palavra amiga toda semana.',
    impactSummary: 'Apoio alimentar contínuo durante período de convalescença',
    createdAt: '2025-09-02T19:00:00.000Z',
  },
  {
    id: 'dep-5',
    personName: 'Luciana Souza do Nascimento',
    roleOrContext: 'Costureira comunitária · Mãe solo',
    neighborhood: 'Conjunto Habitacional · Plácido de Castro',
    category: 'Pães & Bolos',
    assistedSince: 'Atendida desde 2023',
    quote:
      'Meus filhos esperam os pãezinhos individuais e o bolo fatiado que vêm nos kits. Saber que existe uma cozinha limpa, organizada e feita por vizinhos de bem traz tranquilidade para a gente seguir lutando.',
    impactSummary: 'Kits matinais e lanches escolares complementares',
    createdAt: '2026-01-20T09:40:00.000Z',
  },
];

function readCustomTestimonials(): BeneficiaryTestimonial[] {
  try {
    const raw = window.localStorage.getItem(TESTIMONIALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BeneficiaryTestimonial[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomTestimonials(items: BeneficiaryTestimonial[]): void {
  try {
    window.localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage error
  }
}

export function useTestimonialsStore() {
  const [customItems, setCustomItems] = useState<BeneficiaryTestimonial[]>(() =>
    readCustomTestimonials()
  );

  useEffect(() => {
    writeCustomTestimonials(customItems);
  }, [customItems]);

  const testimonials = [...customItems, ...INITIAL_TESTIMONIALS];

  const addTestimonial = (input: {
    personName: string;
    roleOrContext: string;
    neighborhood: string;
    category: TestimonialCategory;
    quote: string;
    impactSummary?: string;
  }) => {
    const newEntry: BeneficiaryTestimonial = {
      id: `dep-user-${Date.now()}`,
      personName: input.personName.trim(),
      roleOrContext: input.roleOrContext.trim() || 'Família beneficiada',
      neighborhood: input.neighborhood.trim() || 'Plácido de Castro - AC',
      category: input.category,
      assistedSince: `Enviado em ${new Date().toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      })}`,
      quote: input.quote.trim(),
      impactSummary:
        input.impactSummary?.trim() || `Depoimento comunitário · ${input.category}`,
      isUserSubmitted: true,
      createdAt: new Date().toISOString(),
    };
    setCustomItems((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const removeTestimonial = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    testimonials,
    addTestimonial,
    removeTestimonial,
  };
}
