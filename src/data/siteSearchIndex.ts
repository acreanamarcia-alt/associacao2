import {
  DOCUMENTARY_FIGURES,
  INSTITUTIONAL_CHAPTERS,
  SACOLOES_GALLERY_ITEMS,
  TIMELINE_EVENTS,
  VOLUNTEER_ROLES,
} from './institutionalData';

export type SiteSearchCategory = 'event' | 'post';

export type SiteSearchSectionId =
  | 'radio-boas-novas'
  | 'historia'
  | 'transparencia'
  | 'producao'
  | 'sacoloes'
  | 'vagas';

export interface SiteSearchItem {
  id: string;
  category: SiteSearchCategory;
  badge: string;
  dateOrPeriod: string;
  title: string;
  summary: string;
  sectionId: SiteSearchSectionId;
  targetElementId?: string;
  chapterId?: string;
  keywords: string[];
}

export interface SiteSearchNavigationDetail {
  item: SiteSearchItem;
}

export const SITE_SEARCH_NAV_EVENT = 'arsbp:navigate-search-result';

export interface LocalSearchKeyword {
  label: string;
  query: string;
}

/**
 * Curated local keyword directory covering historical milestones and activity posts.
 */
export const LOCAL_SEARCH_KEYWORDS: LocalSearchKeyword[] = [
  { label: 'Sopão Comunitário', query: 'sopão' },
  { label: 'Pães e Bolos', query: 'pães bolos' },
  { label: 'Sacolões Noturnos', query: 'sacolão' },
  { label: 'Ramal da Cajazeira', query: 'cajazeira' },
  { label: 'Fundação 2019', query: '2019 cnpj' },
  { label: 'Lei 3.809/2021', query: 'lei 3809' },
  { label: 'Convênio SEASDH', query: 'seasdh' },
  { label: 'Veículo 0 km', query: 'veículo' },
  { label: 'Editais TJAC', query: 'tjac' },
  { label: 'Farofa Temperada', query: 'farofa' },
  { label: 'Bairro Olaria', query: 'olaria' },
  { label: 'Voluntariado', query: 'voluntário' },
  { label: 'Rádio FM 96,3', query: 'radio boas novas' },
];

const TIMELINE_KEYWORD_MAP: Record<string, string[]> = {
  '26/02/2019': [
    'fundacao',
    'fundação',
    '2019',
    'cnpj',
    '33.314.701/0001-54',
    'sede',
    'bairro olaria',
    'zuila ferreira',
    'criacao',
    'registro',
    'estatuto',
    'abertura',
  ],
  '11/08/2020': [
    '2020',
    'municipal',
    'prefeitura',
    'gedeon',
    'contrato 109',
    'diario oficial',
    'doe',
    'cozinha comunitaria',
    'cooperacao',
  ],
  '22/11/2021': [
    '2021',
    'lei 3809',
    'lei 3.809',
    'utilidade publica',
    'estadual',
    'aleac',
    'gladson',
    'cameli',
    'novembro',
    'tratado de petropolis',
    'aniversario acre',
  ],
  '10/11/2023': [
    '2023',
    'seasdh',
    'fomento',
    'termo de fomento 25',
    '100 mil',
    '100.000',
    'convenio',
    'seguranca alimentar',
    'estado',
  ],
  '20/12/2023': [
    '2023',
    'veiculo',
    'carro',
    'automovel',
    'zero quilometro',
    'emenda parlamentar',
    'mara rocha',
    'camilo da silva',
    'logistica',
    'transporte',
    'zona rural',
  ],
  '2024–2026': [
    '2024',
    '2025',
    '2026',
    'tjac',
    'editais',
    'edital',
    'judiciario',
    'penas pecuniarias',
    'vara unica criminal',
    'transparencia',
    'prestacao de contas',
  ],
};

const CHAPTER_KEYWORD_MAP: Record<string, string[]> = {
  'cap-1': [
    'autobiografia',
    'criadores',
    'fundadores',
    'historia',
    'genese',
    'bairro olaria',
    'mesa vazia',
    'voluntarios',
    'inicio',
    'sopao',
  ],
  'cap-2': [
    'fundacao formal',
    '2019',
    '2020',
    'cnpj',
    'prefeitura',
    'contrato 109',
    'zona urbana',
    'zona rural',
  ],
  'cap-3': [
    'marco legislativo',
    'novembro 2021',
    'aleac',
    'lei 3809',
    'utilidade publica',
    'tratado de petropolis',
  ],
  'cap-4': [
    'fomentos',
    'seasdh',
    'termo de fomento',
    'veiculo',
    'mara rocha',
    'camilo da silva',
    'expansao',
  ],
  'cap-5': [
    'parcerias',
    'transparencia',
    'tjac',
    'editais',
    'penas pecuniarias',
    'idoneidade',
    '2024',
    '2026',
  ],
};

const FIGURE_KEYWORD_MAP: Record<string, string[]> = {
  'fig-1': ['sopao', 'sopa', 'refeicao quente', 'legumes', 'proteinas', 'caldeirao'],
  'fig-2': ['paes caseiros', 'pao', 'fornada', 'padaria', 'formas metalicas'],
  'fig-3': ['paes', 'assadeiras', 'larga escala', 'bairro olaria'],
  'fig-4': ['mosaico', 'panificacao', 'fornadas', 'voluntarios', 'producao'],
  'fig-5': ['paezinhos', 'cafe da manha', 'lanche', 'triagem'],
  'fig-6': ['bolos', 'bolo caseiro', 'criancas', 'idosos', 'fornada'],
  'fig-7': ['farofa', 'farofa temperada', 'potes', 'porcionamento'],
  'fig-8': ['logistica', 'distribuicao', 'entrega', 'zona rural', 'zona urbana'],
  'fig-9': ['mesa comunitaria', 'panelas', 'refeicoes quentes', 'farofa'],
  'fig-10': ['mutirao', 'sede', 'idosos', 'cestas basicas', 'vestuario', 'roupas'],
  'fig-11': ['bancada', 'cestas basicas', 'paes embalados', 'triagem'],
  'fig-12': ['festa', 'dia das criancas', 'ramal da cajazeira', 'bujari', 'bolo confeitado', 'brinquedos'],
  'fig-13': ['homenagem', 'irma leda', 'ramal da cajazeira', 'extensao rural', 'ramais'],
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const SITE_SEARCH_ITEMS: SiteSearchItem[] = [
  {
    id: 'radio-boas-novas-voz-missionaria',
    category: 'post',
    badge: 'Rádio Boas Novas FM 96,3',
    dateOrPeriod: 'Série Voz Missionária',
    title: 'Missionário Teodoro — Programa Voz da Assembleia de Deus',
    summary:
      'Ouça o programa Voz da Assembleia de Deus com a série Voz Missionária através do aplicativo da Rádio Boas Novas FM 96,3 (voxhdstore.com.br/radioboasnovasfm963).',
    sectionId: 'radio-boas-novas',
    targetElementId: 'radio-boas-novas',
    keywords: [
      'radio',
      'boas novas',
      '96.3',
      'fm',
      'voz da assembleia de deus',
      'voz missionaria',
      'missionario teodoro',
      'teodoro',
      'aplicativo',
      'voxhdstore',
    ],
  },
  // Eventos históricos da linha do tempo
  ...TIMELINE_EVENTS.map((event, index): SiteSearchItem => ({
    id: `timeline-${index + 1}`,
    category: 'event',
    badge: 'Marco Histórico',
    dateOrPeriod: event.date,
    title: event.title,
    summary: `${event.instrument} — ${event.description}`,
    sectionId: 'transparencia',
    targetElementId: `timeline-event-${index + 1}`,
    keywords: [
      event.date,
      event.instrument,
      ...(TIMELINE_KEYWORD_MAP[event.date] ?? []),
    ],
  })),

  // Capítulos da história institucional
  ...INSTITUTIONAL_CHAPTERS.map((chapter): SiteSearchItem => ({
    id: `chapter-${chapter.id}`,
    category: 'event',
    badge: chapter.index,
    dateOrPeriod: chapter.subtitle,
    title: chapter.title,
    summary: chapter.paragraphs[0] ?? chapter.subtitle,
    sectionId: 'historia',
    targetElementId: 'historia',
    chapterId: chapter.id,
    keywords: [
      chapter.index,
      chapter.subtitle,
      'ebook',
      'historia',
      'capitulo',
      ...(CHAPTER_KEYWORD_MAP[chapter.id] ?? []),
    ],
  })),

  // Postagens documentais da produção própria e ações comunitárias
  ...DOCUMENTARY_FIGURES.map((fig): SiteSearchItem => ({
    id: `figure-${fig.id}`,
    category: 'post',
    badge: `${fig.number} · ${fig.category}`,
    dateOrPeriod: fig.chapterRef,
    title: fig.title,
    summary: fig.caption,
    sectionId: 'producao',
    targetElementId: `gallery-${fig.id}`,
    keywords: [
      fig.number,
      fig.category,
      fig.destination,
      fig.accessionId,
      ...(FIGURE_KEYWORD_MAP[fig.id] ?? []),
    ],
  })),

  // Postagens das entregas noturnas / domiciliares de sacolões
  ...SACOLOES_GALLERY_ITEMS.map((item): SiteSearchItem => ({
    id: `sacolao-${item.id}`,
    category: 'post',
    badge: `Sacolões · ${item.registerNumber}`,
    dateOrPeriod: item.periodLabel,
    title: item.title,
    summary: `${item.caption} (${item.itemsSummary})`,
    sectionId: 'sacoloes',
    targetElementId: item.id,
    keywords: [
      'sacolao',
      'sacoloes',
      'cesta basica',
      'entrega noturna',
      'domicilio',
      'porta a porta',
      'arroz',
      'feijao',
      'farinha de mandioca',
      item.locationLabel,
      item.itemsSummary,
    ],
  })),

  // Frentes de atividades voluntárias
  ...VOLUNTEER_ROLES.map((role): SiteSearchItem => ({
    id: `volunteer-${role.id}`,
    category: 'post',
    badge: `Atividade Voluntária · ${role.category}`,
    dateOrPeriod: role.schedule,
    title: role.title,
    summary: role.summary,
    sectionId: 'vagas',
    targetElementId: 'vagas',
    keywords: [
      'voluntario',
      'voluntariado',
      'vagas',
      role.category,
      role.shift,
      role.location,
      ...role.activities,
    ],
  })),
];

export function searchSiteContent(query: string): SiteSearchItem[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: Array<{ item: SiteSearchItem; score: number }> = [];

  for (const item of SITE_SEARCH_ITEMS) {
    const titleNorm = normalizeSearchText(item.title);
    const badgeNorm = normalizeSearchText(item.badge);
    const periodNorm = normalizeSearchText(item.dateOrPeriod);
    const summaryNorm = normalizeSearchText(item.summary);
    const keywordsNorm = item.keywords.map(normalizeSearchText);

    const searchableBlob = [
      titleNorm,
      badgeNorm,
      periodNorm,
      summaryNorm,
      ...keywordsNorm,
    ].join(' ');

    const allTokensMatch = tokens.every((token) => searchableBlob.includes(token));
    if (!allTokensMatch) {
      continue;
    }

    let score = 0;

    if (titleNorm.includes(normalizedQuery)) score += 45;
    if (keywordsNorm.some((kw) => kw === normalizedQuery)) score += 40;
    if (keywordsNorm.some((kw) => kw.includes(normalizedQuery))) score += 28;
    if (periodNorm.includes(normalizedQuery)) score += 22;
    if (summaryNorm.includes(normalizedQuery)) score += 12;

    for (const token of tokens) {
      if (titleNorm.includes(token)) score += 14;
      if (keywordsNorm.some((kw) => kw.includes(token))) score += 10;
      if (badgeNorm.includes(token) || periodNorm.includes(token)) score += 8;
      if (summaryNorm.includes(token)) score += 4;
    }

    // Slight boost for timeline historical milestones & documentary posts
    if (item.category === 'event') score += 2;

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((entry) => entry.item);
}

export function dispatchSiteSearchNavigation(item: SiteSearchItem): void {
  if (typeof window === 'undefined') return;

  if (item.sectionId === 'sacoloes') {
    window.location.hash = '#sacoloes';
  }

  window.dispatchEvent(
    new CustomEvent<SiteSearchNavigationDetail>(SITE_SEARCH_NAV_EVENT, {
      detail: { item },
    })
  );

  // Give React one frame to switch tabs/chapters/filters before scrolling
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const target =
        (item.targetElementId && document.getElementById(item.targetElementId)) ||
        document.getElementById(
          item.sectionId === 'sacoloes' ? 'sacoloes-panel' : item.sectionId
        ) ||
        document.getElementById('doacoes');

      if (!target) return;

      target.scrollIntoView({
        behavior: 'smooth',
        block: item.targetElementId && item.targetElementId !== item.sectionId ? 'center' : 'start',
      });

      if (item.targetElementId && item.targetElementId !== item.sectionId) {
        target.classList.add(
          'ring-2',
          'ring-[#14532D]',
          'ring-offset-2',
          'transition-shadow'
        );
        window.setTimeout(() => {
          target.classList.remove('ring-2', 'ring-[#14532D]', 'ring-offset-2');
        }, 2600);
      }
    }, 80);
  });
}
