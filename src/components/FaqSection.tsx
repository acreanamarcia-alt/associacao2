import { ArrowUpRight, ChevronDown, HeartHandshake, MessageCircle, Truck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PIX_INFO } from '../data/donationsStore';
import { INSTITUTION_PROFILE } from '../data/institutionalData';
import { useLanguage } from '../i18n/LanguageContext';

type FaqCategory =
  | 'Todas'
  | 'Funcionamento'
  | 'Como Colaborar'
  | 'Voluntariado'
  | 'Transparência';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'Todas'>;
  question: string;
  answer: string;
  actionLabel?: string;
  onActionType?: 'donate-pix' | 'donate-pickup' | 'volunteer' | 'maps';
}

interface FaqSectionProps {
  onOpenDonate?: (tab: 'pix' | 'monthly' | 'pickup') => void;
  onJumpToVolunteer?: () => void;
}

const FAQ_CATEGORIES: FaqCategory[] = [
  'Todas',
  'Funcionamento',
  'Como Colaborar',
  'Voluntariado',
  'Transparência',
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Funcionamento',
    question: 'Como funciona o Projeto Sopão e quem é atendido pela associação?',
    answer:
      `A ${INSTITUTION_PROFILE.legalName} prepara e distribui gratuitamente refeições nutritivas (sopão comunitário), pães caseiros, bolos fatiados e kits alimentares com farofa temperada. O atendimento prioriza famílias em situação de vulnerabilidade social, idosos, crianças e trabalhadores do Bairro Olaria, Centro e comunidades rurais de ${INSTITUTION_PROFILE.cityState}.`,
  },
  {
    id: 'faq-2',
    category: 'Funcionamento',
    question: 'Quais são os dias, horários e local de preparo e entrega?',
    answer:
      `As atividades acontecem na sede comunitária (${INSTITUTION_PROFILE.fullAddress}). A panificação solidária ocorre às segundas, quartas e sextas-feiras pela manhã (06h30 às 10h30); o preparo e porcionamento do sopão ocorrem às terças e quintas-feiras (14h00 às 19h00); e as rotas de distribuição urbana e rural acontecem aos sábados (08h00 às 12h00) com apoio do veículo oficial da entidade.`,
    actionLabel: 'Ver localização da sede no Google Maps',
    onActionType: 'maps',
  },
  {
    id: 'faq-3',
    category: 'Como Colaborar',
    question: 'Como posso fazer uma doação financeira via PIX ou me tornar doador mensal?',
    answer:
      `Você pode contribuir com qualquer valor via PIX utilizando as duas chaves oficiais da associação: CNPJ ${PIX_INFO.pixKey} ou Telefone ${PIX_INFO.pixPhoneDisplay}. Também é possível registrar uma doação mensal recorrente pelo portal e enviar o comprovante/recibo diretamente para o WhatsApp institucional ${INSTITUTION_PROFILE.phoneDisplay}.`,
    actionLabel: 'Abrir opções de doação PIX',
    onActionType: 'donate-pix',
  },
  {
    id: 'faq-4',
    category: 'Como Colaborar',
    question: 'Quais alimentos posso doar e como agendar a coleta na minha casa ou comércio?',
    answer:
      `Recebemos gêneros não perecíveis (arroz, feijão, macarrão, farinha de trigo, farinha de mandioca, óleo, sal, temperos), legumes, verduras frescas, proteínas e embalagens descartáveis higienizadas. Você pode entregar diretamente na sede do Bairro Olaria ou solicitar a retirada gratuita com o veículo da associação agendando pelo portal.`,
    actionLabel: 'Agendar coleta de alimentos',
    onActionType: 'donate-pickup',
  },
  {
    id: 'faq-5',
    category: 'Voluntariado',
    question: 'Como me inscrever para trabalhar como voluntário e existe remuneração?',
    answer:
      'Basta escolher uma das frentes na seção de vagas (Cozinha & Panificação, Triagem & Kits, Logística & Entrega ou Governança & Projetos) e preencher o cadastro. Não é obrigatória experiência prévia na cozinha ou padaria — voluntários veteranos orientam cada etapa. Ressaltamos que todas as vagas são expressamente voluntárias, sem qualquer tipo de remuneração.',
    actionLabel: 'Ver frentes de voluntariado abertas',
    onActionType: 'volunteer',
  },
  {
    id: 'faq-6',
    category: 'Transparência',
    question: 'Como a associação garante a transparência e a regularidade das doações?',
    answer:
      `Fundada em ${INSTITUTION_PROFILE.foundedAt} sob CNPJ ${INSTITUTION_PROFILE.cnpj}, a entidade possui título de Utilidade Pública Estadual pela ${INSTITUTION_PROFILE.stateLaw}, registro regular junto à SEASDH (${INSTITUTION_PROFILE.fomento}) e habilitação em editais do Poder Judiciário (${INSTITUTION_PROFILE.judiciary}), mantendo prestação de contas documental e controle comunitário contínuo.`,
  },
];

export function FaqSection({ onOpenDonate, onJumpToVolunteer }: FaqSectionProps) {
  const { t, lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('Todas');
  const [openId, setOpenId] = useState<string>('faq-1');

  const localizedFaqItems = useMemo(() => {
    if (lang === 'pt') return FAQ_ITEMS;
    if (lang === 'en') {
      return [
        {
          ...FAQ_ITEMS[0],
          question: 'How does Projeto Sopão work and who is assisted by the association?',
          answer: `${INSTITUTION_PROFILE.legalName} prepares and distributes nutritious meals (community soup), homemade bread, sliced cakes, and food kits with seasoned farofa free of charge. Assistance prioritizes vulnerable families, elders, children, and workers in Bairro Olaria, Centro, and rural areas of ${INSTITUTION_PROFILE.cityState}.`,
        },
        {
          ...FAQ_ITEMS[1],
          question: 'What are the preparation and delivery days, times, and location?',
          answer: `Activities take place at our community headquarters (${INSTITUTION_PROFILE.fullAddress}). Solidarity bakery runs Mondays, Wednesdays, and Fridays (06:30–10:30); soup preparation happens Tuesdays and Thursdays (14:00–19:00); and urban/rural delivery routes run Saturdays (08:00–12:00) using the association vehicle.`,
          actionLabel: 'View headquarters on Google Maps',
        },
        {
          ...FAQ_ITEMS[2],
          question: 'How can I donate via PIX or become a monthly donor?',
          answer: `You can donate any amount via PIX using our two official keys: CNPJ ${PIX_INFO.pixKey} or Phone ${PIX_INFO.pixPhoneDisplay}. You can also pledge a recurring monthly gift on this portal and send receipts directly to WhatsApp ${INSTITUTION_PROFILE.phoneDisplay}.`,
          actionLabel: 'Open PIX donation options',
        },
        {
          ...FAQ_ITEMS[3],
          question: 'Which food items can I donate and how do I schedule a pickup?',
          answer: `We accept non-perishable staples (rice, beans, pasta, wheat flour, cassava flour, cooking oil, salt, spices), fresh vegetables, proteins, and sanitized disposable containers. Drop off at Bairro Olaria HQ or request free vehicle pickup through the portal.`,
          actionLabel: 'Schedule food pickup',
        },
        {
          ...FAQ_ITEMS[4],
          question: 'How do I apply as a volunteer and is there any financial pay?',
          answer: `Choose a work front in the Volunteer section and submit the form. Prior kitchen or bakery experience is not required—senior volunteers guide every step. All positions are strictly voluntary with no financial compensation.`,
          actionLabel: 'View open volunteer roles',
        },
        {
          ...FAQ_ITEMS[5],
          question: 'How does the association ensure transparency and compliance?',
          answer: `Founded on ${INSTITUTION_PROFILE.foundedAt} under CNPJ ${INSTITUTION_PROFILE.cnpj}, the organization holds State Public Utility status (${INSTITUTION_PROFILE.stateLaw}), active SEASDH registration (${INSTITUTION_PROFILE.fomento}), and Judiciary grant clearance (${INSTITUTION_PROFILE.judiciary}), maintaining continuous financial and community oversight.`,
        },
      ];
    }
    return [
      {
        ...FAQ_ITEMS[0],
        question: '¿Cómo funciona el Projeto Sopão y a quién atiende la asociación?',
        answer: `${INSTITUTION_PROFILE.legalName} prepara y distribuye gratuitamente comidas nutritivas (sopão comunitario), panes caseros, pasteles y kits alimentarios con farofa. La atención prioriza a familias en vulnerabilidad, adultos mayores, niños y trabajadores del Bairro Olaria, Centro y comunidades rurales de ${INSTITUTION_PROFILE.cityState}.`,
      },
      {
        ...FAQ_ITEMS[1],
        question: '¿Cuáles son los días, horarios y lugar de preparación y entrega?',
        answer: `Las actividades se realizan en la sede comunitaria (${INSTITUTION_PROFILE.fullAddress}). La panadería funciona lunes, miércoles y viernes (06:30 a 10:30); el sopão se prepara martes y jueves (14:00 a 19:00); y las rutas de entrega urbana y rural se realizan los sábados (08:00 a 12:00).`,
        actionLabel: 'Ver ubicación en Google Maps',
      },
      {
        ...FAQ_ITEMS[2],
        question: '¿Cómo puedo donar vía PIX o hacerme donante mensual?',
        answer: `Puede contribuir con cualquier valor vía PIX usando nuestras dos claves oficiales: CNPJ ${PIX_INFO.pixKey} o Teléfono ${PIX_INFO.pixPhoneDisplay}. También puede registrar un aporte mensual en el portal y enviar el comprobante al WhatsApp ${INSTITUTION_PROFILE.phoneDisplay}.`,
        actionLabel: 'Abrir opciones de donación PIX',
      },
      {
        ...FAQ_ITEMS[3],
        question: '¿Qué alimentos puedo donar y cómo programar el retiro a domicilio?',
        answer: `Recibimos alimentos no perecederos (arroz, frijoles, pasta, harina de trigo, harina de yuca, aceite, sal, condimentos), verduras frescas, proteínas y envases desechables higiénicos. Puede entregar en la sede o solicitar retiro gratuito en nuestro portal.`,
        actionLabel: 'Programar recolección de alimentos',
      },
      {
        ...FAQ_ITEMS[4],
        question: '¿Cómo inscribirme como voluntario y existe remuneración?',
        answer: `Elija un área en la sección de Vacantes y complete el formulario. No se requiere experiencia previa en cocina o panadería; voluntarios veteranos orientan cada etapa. Todas las vacantes son estrictamente voluntarias y no remuneradas.`,
        actionLabel: 'Ver áreas de voluntariado abiertas',
      },
      {
        ...FAQ_ITEMS[5],
        question: '¿Cómo garantiza la asociación la transparencia de las donaciones?',
        answer: `Fundada el ${INSTITUTION_PROFILE.foundedAt} con CNPJ ${INSTITUTION_PROFILE.cnpj}, la entidad cuenta con Utilidad Pública Estatal (${INSTITUTION_PROFILE.stateLaw}), registro vigente en SEASDH (${INSTITUTION_PROFILE.fomento}) y habilitación ante el Poder Judicial (${INSTITUTION_PROFILE.judiciary}), con rendición de cuentas continua.`,
      },
    ];
  }, [lang]);

  const categoryLabel = (cat: FaqCategory) => {
    if (cat === 'Todas') return t.faq.allCategory;
    if (lang === 'en') {
      if (cat === 'Funcionamento') return 'Operations';
      if (cat === 'Como Colaborar') return 'How to Help';
      if (cat === 'Voluntariado') return 'Volunteering';
      if (cat === 'Transparência') return 'Transparency';
    }
    if (lang === 'es') {
      if (cat === 'Funcionamento') return 'Funcionamiento';
      if (cat === 'Como Colaborar') return 'Cómo Colaborar';
      if (cat === 'Voluntariado') return 'Voluntariado';
      if (cat === 'Transparência') return 'Transparencia';
    }
    return cat;
  };

  const visibleItems = useMemo(() => {
    if (selectedCategory === 'Todas') return localizedFaqItems;
    return localizedFaqItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, localizedFaqItems]);

  const handleAction = (type: FaqItem['onActionType']) => {
    if (!type) return;
    if (type === 'donate-pix') {
      onOpenDonate?.('pix');
    } else if (type === 'donate-pickup') {
      onOpenDonate?.('pickup');
    } else if (type === 'volunteer') {
      onJumpToVolunteer?.();
    } else if (type === 'maps') {
      const anchor = document.createElement('a');
      anchor.href = INSTITUTION_PROFILE.googleMapsUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    }
  };

  const whatsappQuestionUrl = `https://wa.me/${INSTITUTION_PROFILE.whatsappDigits}?text=${encodeURIComponent(
    'Olá! Gostaria de tirar uma dúvida sobre o funcionamento e formas de colaborar com o Projeto Sopão.'
  )}`;

  return (
    <section id="faq" className="border-b border-[#E2DDD3] bg-[#F4F0E8]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Coluna esquerda: cabeçalho editorial e atalhos úteis */}
          <div className="lg:col-span-4">
            <p className="text-xs font-medium uppercase tracking-widest text-[#14532D]">
              {t.faq.kicker}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              {t.faq.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#44403C]">
              {t.faq.subtitle}
            </p>

            <div className="mt-6 space-y-2.5 border-t border-[#D6CEBE] pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                {t.faq.quickActionsTitle}
              </p>

              <button
                type="button"
                onClick={() => onOpenDonate?.('pix')}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-left text-xs font-semibold text-[#1C1917] transition-colors hover:border-[#14532D] hover:text-[#14532D]"
              >
                <span className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
                  <span>{t.faq.quickPix}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onOpenDonate?.('pickup')}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-left text-xs font-semibold text-[#1C1917] transition-colors hover:border-[#14532D] hover:text-[#14532D]"
              >
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
                  <span>{t.faq.quickPickup}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onJumpToVolunteer}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-between rounded-md border border-[#D6CEBE] bg-white px-4 py-2 text-left text-xs font-semibold text-[#1C1917] transition-colors hover:border-[#14532D] hover:text-[#14532D]"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#14532D]" aria-hidden="true" />
                  <span>{t.faq.quickVolunteer}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <a
                href={whatsappQuestionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[42px] w-full items-center justify-between rounded-md bg-[#14532D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F3F22]"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{t.faq.quickWhatsapp} {INSTITUTION_PROFILE.phoneDisplay}</span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Coluna direita: filtro por tema e acordeão */}
          <div className="lg:col-span-8">
            <div
              role="tablist"
              aria-label={t.faq.title}
              className="mb-5 flex flex-wrap items-center gap-1 rounded-lg bg-[#E8E2D5] p-1"
            >
              {FAQ_CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedCategory(category);
                      const firstMatch =
                        category === 'Todas'
                          ? localizedFaqItems[0]
                          : localizedFaqItems.find((item) => item.category === category);
                      if (firstMatch) {
                        setOpenId(firstMatch.id);
                      }
                    }}
                    className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-white text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {categoryLabel(category)}
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-[#E2DDD3] overflow-hidden rounded-xl border border-[#D6CEBE] bg-white">
              {visibleItems.map((item, idx) => {
                const isOpen = openId === item.id;
                const panelId = `faq-panel-${item.id}`;
                const buttonId = `faq-button-${item.id}`;
                return (
                  <div key={item.id}>
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenId(isOpen ? '' : item.id)}
                        className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-[#FBF9F5]"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-[#78716C] tabular-nums">
                            0{idx + 1} · {categoryLabel(item.category)}
                          </p>
                          <p className="mt-0.5 font-serif text-base font-semibold text-[#1C1917] sm:text-lg">
                            {item.question}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-[#57534E] transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#14532D]' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>

                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="border-t border-[#F1EDE4] bg-[#FBF9F5] px-6 py-5"
                      >
                        <p className="max-w-3xl text-sm leading-relaxed text-[#44403C]">
                          {item.answer}
                        </p>

                        {item.actionLabel && item.onActionType && (
                          <button
                            type="button"
                            onClick={() => handleAction(item.onActionType)}
                            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline"
                          >
                            <span>{item.actionLabel}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
