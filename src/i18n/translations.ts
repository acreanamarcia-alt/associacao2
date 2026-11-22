export type LanguageCode = 'pt' | 'en' | 'es';

export interface SiteTranslations {
  languageName: string;
  nav: {
    roles: string;
    donate: string;
    baskets: string;
    production: string;
    testimonials: string;
    intel: string;
    history: string;
    panel: string;
    account: string;
    signIn: string;
    signInCreate: string;
    volunteerCta: string;
    openMenu: string;
    closeMenu: string;
    selectLanguage: string;
  };
  pwa: {
    installApp: string;
    badge: string;
    close: string;
    openNewTab: string;
  };
  whatsapp: {
    inlineTitle: string;
    floatingLine1: string;
    floatingLine2: string;
  };
  hero: {
    title: string;
    leadershipKicker: string;
    leadershipCaption1: string;
    leadershipCaption2: string;
    descriptionStart: string;
    descriptionMiddle: string;
    descriptionEnd: string;
    donateBtn: string;
    volunteerBtn: string;
    ebookBtn: string;
    audioPdfBtn: string;
    visitorKicker: string;
    visitorSubtitle: string;
    totalVisits: string;
    uniqueVisitors: string;
    fig1Tag: string;
    fig1Caption: string;
    specFoundedLabel: string;
    specFoundedSub: string;
    specCnpjLabel: string;
    specPublicLabel: string;
    specPublicValue: string;
    specPublicSub: string;
    specFomentoLabel: string;
    monthlyGoal: {
      kicker: string;
      tabMeals: string;
      tabHours: string;
      mealsUnit: string;
      hoursUnit: string;
      targetPrefix: string;
      reachedSuffix: string;
      remainingPrefix: string;
      completedLabel: string;
      breakdownMeals: string;
      breakdownHours: string;
      ctaMeals: string;
      ctaHours: string;
    };
  };
  volunteer: {
    kicker: string;
    title: string;
    subtitle: string;
    unpaidNotice: string;
    openSpotsLabel: string;
    positionsUnit: string;
    myApplicationsBtn: string;
    allCategories: string;
    allShifts: string;
    shiftPrefix: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDesc: string;
    clearFilters: string;
    spotsLeft: string;
    ofSpots: string;
    applyBtn: string;
    alreadyApplied: string;
    viewDetails: string;
    modalityLabel: string;
    scheduleLabel: string;
    locationLabel: string;
    activitiesTitle: string;
    requirementsTitle: string;
    impactTitle: string;
    formTitle: string;
    fullNameLabel: string;
    phoneLabel: string;
    availabilityLabel: string;
    notesLabel: string;
    submitApplication: string;
    whatsappDirect: string;
    submittedSuccess: string;
    removeApplication: string;
    myApplicationsTitle: string;
    close: string;
  };
  donations: {
    kicker: string;
    title: string;
    subtitle: string;
    donateNow: string;
    monthlyDonor: string;
    adminPanel: string;
    pixCnpjTitle: string;
    copyCnpj: string;
    copiedCnpj: string;
    pixPhoneTitle: string;
    pixPhoneSub: string;
    copyPhone: string;
    copiedPhone: string;
    tabProducts: string;
    tabSacoloes: string;
    tabPickup: string;
    allProductsFilter: string;
    thProduct: string;
    thCategory: string;
    thPriority: string;
    thProgress: string;
    thAction: string;
    selectForPickup: string;
    pickupFormTitle: string;
    pickupFormSubtitle: string;
    collabName: string;
    collabEmail: string;
    collabPhone: string;
    pickupAddress: string;
    preferredDate: string;
    preferredShift: string;
    selectedItemsTitle: string;
    selectedItemsSubtitle: string;
    otherItemsLabel: string;
    confirmPickupBtn: string;
    savedNotice: string;
    sendWhatsappBtn: string;
  };
  sacoloes: {
    kicker: string;
    title: string;
    lead: string;
    p1: string;
    p2: string;
    ctaPix: string;
    ctaPickup: string;
    galleryKicker: string;
    galleryRecordsSuffix: string;
    galleryTitle: string;
    galleryHint: string;
    itemsPrefix: string;
    modalSub: string;
    modalModality: string;
    modalLocation: string;
    modalComposition: string;
    modalResponsible: string;
    prevBtn: string;
    nextBtn: string;
  };
  production: {
    kicker: string;
    title: string;
    subtitle: string;
    allRecords: string;
    registerLabel: string;
    sourceLabel: string;
    frontLabel: string;
    destinationLabel: string;
    locationLabel: string;
    locationValue: string;
    editInStudio: string;
    prevBtn: string;
    nextBtn: string;
  };
  testimonials: {
    kicker: string;
    title: string;
    subtitle: string;
    allCategory: string;
    sendBtn: string;
    closeFormBtn: string;
    formTitle: string;
    formSubtitle: string;
    nameLabel: string;
    roleLabel: string;
    neighborhoodLabel: string;
    categoryLabel: string;
    quoteLabel: string;
    impactLabel: string;
    submitBtn: string;
    emptyTitle: string;
    emptySubtitle: string;
    directImpactPrefix: string;
    supportPrefix: string;
    removeLabel: string;
    thanksNotice: string;
  };
  faq: {
    kicker: string;
    title: string;
    subtitle: string;
    quickActionsTitle: string;
    quickPix: string;
    quickPickup: string;
    quickVolunteer: string;
    quickWhatsapp: string;
    allCategory: string;
  };
  intel: {
    kicker: string;
    title: string;
    subtitle: string;
    tabMaps: string;
    tabSearch: string;
    tabEditais: string;
    tabStudio: string;
  };
  history: {
    kicker: string;
    title: string;
    chaptersTitle: string;
    fullDocKicker: string;
    fullDocDesc: string;
    openEbookBtn: string;
    listenPdfBtn: string;
    timelineKicker: string;
    timelineTitle: string;
    specsKicker: string;
    specsTitle: string;
    specsDesc: string;
    locationLabel: string;
    openMaps: string;
    viewRouteMaps: string;
  };
  ebook: {
    kicker: string;
    titlePrefix: string;
    viewPdfTab: string;
    audioPdfTab: string;
    downloadPdf: string;
    newTab: string;
    closeLabel: string;
  };
  pdfAudio: {
    kicker: string;
    title: string;
    subtitle: string;
    loadOfficialBtn: string;
    uploadPdfBtn: string;
    loadedDocLabel: string;
    extracting: string;
    playBtn: string;
    resumeBtn: string;
    pauseBtn: string;
    stopBtn: string;
    speedLabel: string;
    voiceLabel: string;
    defaultVoice: string;
    progressLabel: string;
    pageLabel: string;
    ofLabel: string;
    segmentHint: string;
    emptyState: string;
    noSpeechSupport: string;
    noTextExtracted: string;
    extractError: string;
  };
  footer: {
    popularNameLabel: string;
    foundedLabel: string;
    publicUtilityLabel: string;
    addressHeader: string;
    openMaps: string;
    whatsappSuffix: string;
    partnersLabel: string;
    navHeader: string;
    linkVolunteer: string;
    linkDonate: string;
    linkBaskets: string;
    linkProduction: string;
    linkIntel: string;
    linkEbook: string;
    linkAdmin: string;
  };
  portalAuth: {
    viewAccount: string;
    closeNotice: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, SiteTranslations> = {
  pt: {
    languageName: 'Português',
    nav: {
      roles: 'Vagas',
      donate: 'Doar',
      baskets: 'Sacolões',
      production: 'Produção',
      testimonials: 'Depoimentos',
      intel: 'Editais & Mapa',
      history: 'História',
      panel: 'Painel',
      account: 'Minha Conta',
      signIn: 'Entrar',
      signInCreate: 'Entrar / Criar Conta',
      volunteerCta: 'Quero ser voluntário',
      openMenu: 'Abrir menu',
      closeMenu: 'Fechar menu',
      selectLanguage: 'Selecionar idioma',
    },
    pwa: {
      installApp: 'Instalar Aplicativo',
      badge: 'Aplicativo Instalável (PWA)',
      close: 'Fechar',
      openNewTab: 'Abrir em nova guia para instalar',
    },
    whatsapp: {
      inlineTitle: 'Fale direto pelo WhatsApp',
      floatingLine1: 'Fale direto',
      floatingLine2: 'pelo WhatsApp',
    },
    hero: {
      title:
        'Conheçam o casal missionário Teodoro e Antônia Lúcia, fundadores desse trabalho tão especial que leva acolhimento, dignidade e segurança alimentar às famílias.',
      leadershipKicker: 'Presidência em Atividade · Cozinha Comunitária',
      leadershipCaption1:
        'Em plena atividade, a presidenta da instituição, Antônia Missionária, e o vice-presidente, José Benedito, reafirmam diariamente o compromisso com o bem-estar social. Cada alimento preparado representa não apenas sustento, mas sobretudo um gesto concreto de acolhimento, dignidade e esperança para as famílias atendidas pela nossa comunidade.',
      leadershipCaption2: 'Seguimos firmes na missão de servir com amor, união e solidariedade.',
      descriptionStart:
        'Organização da Sociedade Civil fundada em 26 de fevereiro de 2019 e reconhecida como Entidade de Utilidade Pública Estadual pela',
      descriptionMiddle: '. Conhecida pela comunidade como',
      descriptionEnd:
        ', a instituição mantém produção artesanal própria de sopas nutritivas, pães caseiros, bolos e kits alimentares distribuídos gratuitamente às famílias placidianas.',
      donateBtn: 'Doar via PIX / Produtos',
      volunteerBtn: 'Ver vagas de voluntariado',
      ebookBtn: 'E-book Oficial',
      audioPdfBtn: 'Ouvir PDF',
      visitorKicker: 'Contador Oficial de Visitantes',
      visitorSubtitle: 'Acessos registrados neste portal institucional',
      totalVisits: 'Visitas totais',
      uniqueVisitors: 'Visitantes únicos',
      fig1Tag: 'FIG. 1 · ARQUIVO DOCUMENTAL DA SEDE',
      fig1Caption: 'Projeto Sopão Comunitário — Cozinha Solidária no Bairro Olaria',
      specFoundedLabel: 'Fundação Formal',
      specFoundedSub: 'Bairro Olaria · Plácido de Castro',
      specCnpjLabel: 'Registro CNPJ / PIX',
      specPublicLabel: 'Utilidade Pública',
      specPublicValue: 'Lei nº 3.809/2021',
      specPublicSub: 'Governo do Estado do Acre · DOE 24/11/21',
      specFomentoLabel: 'Fomento & Controle',
      monthlyGoal: {
        kicker: 'Acompanhamento Mensal de Impacto',
        tabMeals: 'Refeições Servidas',
        tabHours: 'Horas Voluntárias',
        mealsUnit: 'refeições',
        hoursUnit: 'horas',
        targetPrefix: 'Meta mensal:',
        reachedSuffix: 'da meta alcançada',
        remainingPrefix: 'Faltam',
        completedLabel: 'Meta mensal atingida!',
        breakdownMeals: 'Cozinha solidária, panificação e doações confirmadas no mês',
        breakdownHours: 'Turnos presenciais da equipe e novas inscrições voluntárias no mês',
        ctaMeals: 'Ajudar a servir mais refeições',
        ctaHours: 'Somar horas como voluntário',
      },
    },
    volunteer: {
      kicker: 'Central de Voluntariado · Bairro Olaria, Plácido de Castro - AC',
      title: 'Vagas abertas no Projeto Sopão',
      subtitle:
        'Inspirada no modelo de engajamento comunitário para ONGs, nossa central organiza as frentes reais de trabalho voluntário na cozinha solidária, panificação, montagem de kits, rotas de entrega e governança documental.',
      unpaidNotice:
        'Aviso importante: todas as vagas são expressamente voluntári(a)s sem qualquer tipo remuneração.',
      openSpotsLabel: 'Vagas disponíveis',
      positionsUnit: 'posições',
      myApplicationsBtn: 'Minhas inscrições',
      allCategories: 'Todas',
      allShifts: 'Todos os turnos',
      shiftPrefix: 'Turno',
      searchPlaceholder: 'Buscar atividade ou turno...',
      emptyTitle: 'Nenhuma vaga encontrada para esse filtro',
      emptyDesc:
        'Ajuste a área de atuação, o turno ou limpe a busca para visualizar todas as frentes do Projeto Sopão.',
      clearFilters: 'Limpar filtros',
      spotsLeft: 'vagas abertas',
      ofSpots: 'de',
      applyBtn: 'Candidatar-se',
      alreadyApplied: 'Inscrição registrada',
      viewDetails: 'Ver detalhes',
      modalityLabel: 'Modalidade',
      scheduleLabel: 'Horário',
      locationLabel: 'Local',
      activitiesTitle: 'Atividades da frente',
      requirementsTitle: 'Requisitos e orientações',
      impactTitle: 'Impacto comunitário',
      formTitle: 'Registrar candidatura voluntária',
      fullNameLabel: 'Nome completo *',
      phoneLabel: 'Telefone / WhatsApp *',
      availabilityLabel: 'Disponibilidade de horário',
      notesLabel: 'Observações ou experiência (opcional)',
      submitApplication: 'Confirmar inscrição voluntária',
      whatsappDirect: 'Enviar pelo WhatsApp',
      submittedSuccess: 'Sua inscrição voluntária foi registrada com sucesso!',
      removeApplication: 'Cancelar inscrição',
      myApplicationsTitle: 'Minhas inscrições voluntárias',
      close: 'Fechar',
    },
    donations: {
      kicker: 'Apoio Financeiro, Doadores Mensais & Coletas',
      title: 'Contribua via PIX, torne-se doador mensal ou agende uma coleta',
      subtitle:
        'Cada contribuição mantém a cozinha comunitária e a panificação solidária em Plácido de Castro. Apoie com doação única, assinatura mensal via PIX ou produtos da lista abaixo.',
      donateNow: 'Doar agora (PIX / Gateway)',
      monthlyDonor: 'Ser Doador Mensal',
      adminPanel: 'Painel & Contabilidade',
      pixCnpjTitle: 'Chave PIX · CNPJ Institucional',
      copyCnpj: 'Copiar CNPJ',
      copiedCnpj: 'CNPJ copiado',
      pixPhoneTitle: 'Chave PIX & WhatsApp · Telefone',
      pixPhoneSub: 'Transferência PIX ou envio de comprovantes',
      copyPhone: 'Copiar Telefone',
      copiedPhone: 'Telefone copiado',
      tabProducts: 'Lista de Produtos Aceitos',
      tabSacoloes: 'Doações de Sacolões',
      tabPickup: 'Agendar Coleta de Doações',
      allProductsFilter: 'Todos',
      thProduct: 'Produto / Insumo',
      thCategory: 'Frente',
      thPriority: 'Prioridade',
      thProgress: 'Recebido / Meta',
      thAction: 'Doar item',
      selectForPickup: 'Selecionar para coleta',
      pickupFormTitle: 'Dados do colaborador e coleta',
      pickupFormSubtitle:
        'Preencha seus dados para agendarmos a retirada pelo veículo do Projeto Sopão ou envie direto pelo WhatsApp',
      collabName: 'Nome do colaborador',
      collabEmail: 'E-mail do colaborador',
      collabPhone: 'Telefone do colaborador',
      pickupAddress: 'Endereço completo de coleta',
      preferredDate: 'Data preferencial',
      preferredShift: 'Turno preferencial',
      selectedItemsTitle: 'Produtos selecionados para doação',
      selectedItemsSubtitle: 'Informe a quantidade dos itens disponíveis para retirada.',
      otherItemsLabel: 'Outros produtos ou observações',
      confirmPickupBtn: 'Confirmar Agendamento de Coleta',
      savedNotice: 'Agendamento salvo no controle administrativo!',
      sendWhatsappBtn: 'Enviar agendamento via WhatsApp',
    },
    sacoloes: {
      kicker: 'Segurança Alimentar Direta · Entregas em Domicílio',
      title: 'Doações de Sacolões às Famílias Assistidas',
      lead:
        'Além das refeições preparadas na cozinha comunitária, o Projeto Sopão realiza a montagem e entrega direta de sacolões completos de alimentos básicos às famílias cadastradas em situação de vulnerabilidade social em Plácido de Castro (AC).',
      p1:
        'Cada sacolão é organizado com gêneros alimentícios de primeira necessidade — incluindo arroz, feijão, farinha de mandioca regional, macarrão, farinha de trigo, óleo de cozinha, açúcar, café e biscoitos — selecionados para assegurar autonomia alimentar e dignidade dentro do próprio lar.',
      p2:
        'Para alcançar moradores que enfrentam dificuldades de locomoção ou jornadas extensas de trabalho, a equipe voluntária da Associação Recanto Social Bom Pastor realiza entregas presenciais porta a porta, inclusive no período noturno, fortalecendo o vínculo comunitário e garantindo que cada cesta chegue diretamente às mãos de quem mais precisa.',
      ctaPix: 'Apoiar a montagem de sacolões via PIX',
      ctaPickup: 'Doar mantimentos para coleta',
      galleryKicker: 'Acervo de Entregas ·',
      galleryRecordsSuffix: 'registros fotográficos',
      galleryTitle: 'Registros das entregas de sacolões às famílias',
      galleryHint: 'Clique em qualquer fotografia para ampliar a visualização e ler os detalhes.',
      itemsPrefix: 'Itens:',
      modalSub: 'Doações de Sacolões',
      modalModality: 'Modalidade',
      modalLocation: 'Localidade',
      modalComposition: 'Composição',
      modalResponsible: 'Responsável',
      prevBtn: 'Anterior',
      nextBtn: 'Próxima',
    },
    production: {
      kicker: 'Capítulo 6 · Acervo Fotográfico Oficial',
      title: 'Nossa produção própria de alimentos para doação',
      subtitle:
        'Em sua sede no Bairro Olaria, voluntários e colaboradores dedicam-se ao preparo artesanal de pães caseiros, pãezinhos individuais, bolos fatiados, refeições acompanhadas de farofa temperada e o tradicional sopão comunitário.',
      allRecords: 'Todos os registros',
      registerLabel: 'Registro',
      sourceLabel: 'Fonte documental',
      frontLabel: 'Frente de produção',
      destinationLabel: 'Destinação',
      locationLabel: 'Local de preparo',
      locationValue: 'Sede Bairro Olaria · Plácido de Castro',
      editInStudio: 'Editar esta foto no Estúdio',
      prevBtn: 'Anterior',
      nextBtn: 'Próxima',
    },
    testimonials: {
      kicker: 'Vozes da Comunidade · Plácido de Castro, AC',
      title: 'Depoimentos de quem recebe o Projeto Sopão',
      subtitle:
        'Relatos diretos de mães de família, idosos e trabalhadores atendidos no Bairro Olaria e nos ramais da zona rural pelo sopão comunitário, panificação solidária e entregas semanais.',
      allCategory: 'Todos',
      sendBtn: 'Enviar depoimento',
      closeFormBtn: 'Fechar formulário',
      formTitle: 'Compartilhar experiência com o Projeto Sopão',
      formSubtitle:
        'Conte como o sopão comunitário, os pães ou as entregas apoiaram sua família ou comunidade.',
      nameLabel: 'Nome completo *',
      roleLabel: 'Vínculo ou situação familiar',
      neighborhoodLabel: 'Bairro ou comunidade',
      categoryLabel: 'Frente de atendimento',
      quoteLabel: 'Seu depoimento *',
      impactLabel: 'Resumo do apoio recebido (opcional)',
      submitBtn: 'Publicar Depoimento',
      emptyTitle: 'Nenhum depoimento registrado nesta frente ainda.',
      emptySubtitle: 'Selecione “Todos” ou envie o primeiro relato comunitário desta categoria.',
      directImpactPrefix: 'Impacto direto:',
      supportPrefix: 'Apoio:',
      removeLabel: 'Remover relato',
      thanksNotice: 'Obrigado por compartilhar seu depoimento com a comunidade.',
    },
    faq: {
      kicker: 'Dúvidas Comuns · Guia Comunitário',
      title: 'Perguntas Frequentes',
      subtitle:
        'Esclarecimentos diretos sobre os horários de produção, atendimento às famílias, chaves PIX, agendamento de coletas e inscrição de voluntários.',
      quickActionsTitle: 'Ações rápidas para colaborar',
      quickPix: 'Contribuir via PIX ou mensal',
      quickPickup: 'Agendar coleta de alimentos',
      quickVolunteer: 'Ver vagas de voluntariado',
      quickWhatsapp: 'Falar pelo WhatsApp',
      allCategory: 'Todas',
    },
    intel: {
      kicker: 'Ferramentas Inteligentes & Editais Públicos',
      title: 'Editais, Mapa Comunitário, Pesquisa & Estúdio Solidário',
      subtitle:
        'Localize pontos de apoio em Plácido de Castro, pesquise editais públicos e fundos de segurança alimentar ou personalize materiais visuais da campanha.',
      tabMaps: 'Mapa & Rotas',
      tabSearch: 'Pesquisa Social',
      tabEditais: 'Editais & Fundos',
      tabStudio: 'Estúdio Visual',
    },
    history: {
      kicker: 'Documentário Institucional & Histórico',
      title: 'Do Projeto Sopão Comunitário ao Reconhecimento e Fomento Estadual',
      chaptersTitle: 'Índice de Capítulos',
      fullDocKicker: 'Consulta integral',
      fullDocDesc:
        'Acesse o documento completo em PDF com todas as 11 páginas diagramadas para consulta documental e transparência.',
      openEbookBtn: 'Abrir E-book Oficial',
      listenPdfBtn: 'Ouvir PDF / Ler em Áudio',
      timelineKicker: 'Marcos Legais e Parcerias',
      timelineTitle: 'Linha do tempo cronológica (2019–2026)',
      specsKicker: 'Identificação Institucional',
      specsTitle: 'Ficha Técnica Oficial',
      specsDesc:
        'Dados oficiais registrados no e-book documental da Associação Recanto Social Bom Pastor.',
      locationLabel: 'Localização da Sede',
      openMaps: 'Abrir no Google Maps',
      viewRouteMaps: 'Ver rota no Google Maps',
    },
    ebook: {
      kicker: 'Edição Documental Oficial · 11 Páginas',
      titlePrefix: 'História da',
      viewPdfTab: 'Visualizar PDF',
      audioPdfTab: 'Ouvir PDF em Áudio',
      downloadPdf: 'Baixar PDF',
      newTab: 'Nova aba',
      closeLabel: 'Fechar visualizador do e-book',
    },
    pdfAudio: {
      kicker: 'Acessibilidade · Leitor de PDF em Áudio (Text-to-Speech)',
      title: 'Ouvir PDF / Ler Arquivo em Áudio',
      subtitle:
        'Carregue o E-book Histórico oficial da associação ou envie qualquer arquivo .pdf do seu dispositivo para extrair o texto e ouvir a leitura em voz alta com acompanhamento em tempo real.',
      loadOfficialBtn: 'Carregar E-book História Oficial (PDF)',
      uploadPdfBtn: 'Enviar arquivo .pdf',
      loadedDocLabel: 'Documento carregado',
      extracting: 'Extraindo texto do PDF com PDF.js...',
      playBtn: 'Reproduzir',
      resumeBtn: 'Continuar',
      pauseBtn: 'Pausar',
      stopBtn: 'Parar',
      speedLabel: 'Velocidade',
      voiceLabel: 'Idioma / Voz da leitura',
      defaultVoice: 'Voz padrão do idioma',
      progressLabel: 'Progresso',
      pageLabel: 'Página',
      ofLabel: 'de',
      segmentHint: 'Clique em qualquer trecho abaixo para iniciar a leitura a partir dele.',
      emptyState:
        'Selecione o E-book oficial da associação ou envie um arquivo .pdf para exibir e ouvir o conteúdo.',
      noSpeechSupport:
        'Seu navegador não oferece suporte à API de síntese de voz (Web Speech API).',
      noTextExtracted:
        'Nenhum texto selecionável foi encontrado neste PDF (pode ser um documento digitalizado apenas como imagem).',
      extractError: 'Não foi possível ler o arquivo PDF selecionado.',
    },
    footer: {
      popularNameLabel: 'Nome Popular:',
      foundedLabel: 'Fundação:',
      publicUtilityLabel: 'Utilidade Pública Estadual:',
      addressHeader: 'Endereço da Sede & Contato Direto',
      openMaps: 'Abrir localização da sede no Google Maps',
      whatsappSuffix: '(WhatsApp / Coletas)',
      partnersLabel: 'Parcerias e Controle Social:',
      navHeader: 'Navegação Institucional',
      linkVolunteer: 'Vagas de Voluntariado',
      linkDonate: 'Doar via PIX & Agendar Coleta',
      linkBaskets: 'Doações de Sacolões às Famílias',
      linkProduction: 'Produção Própria de Alimentos',
      linkIntel: 'Mapa, Pesquisa & Estúdio',
      linkEbook: 'E-book Documental (PDF)',
      linkAdmin: 'Painel Administrativo & Contabilidade',
    },
    portalAuth: {
      viewAccount: 'Ver Minha Conta',
      closeNotice: 'Fechar aviso',
    },
  },
  en: {
    languageName: 'English',
    nav: {
      roles: 'Volunteer',
      donate: 'Donate',
      baskets: 'Food Baskets',
      production: 'Production',
      testimonials: 'Stories',
      intel: 'Grants & Map',
      history: 'History',
      panel: 'Admin',
      account: 'My Account',
      signIn: 'Sign In',
      signInCreate: 'Sign In / Register',
      volunteerCta: 'Become a volunteer',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      selectLanguage: 'Select language',
    },
    pwa: {
      installApp: 'Install App',
      badge: 'Installable App (PWA)',
      close: 'Close',
      openNewTab: 'Open in new tab to install',
    },
    whatsapp: {
      inlineTitle: 'Chat directly on WhatsApp',
      floatingLine1: 'Chat directly',
      floatingLine2: 'on WhatsApp',
    },
    hero: {
      title:
        'Meet the missionary couple Teodoro and Antônia Lúcia, founders of this special work that brings welcome, dignity, and food security to families.',
      leadershipKicker: 'Leadership in Action · Community Kitchen',
      leadershipCaption1:
        'In full daily activity, the institution’s president, Antônia Missionária, and vice president, José Benedito, reaffirm their commitment to social well-being. Every meal prepared represents not only nourishment, but above all a concrete gesture of welcome, dignity, and hope for the families served in our community.',
      leadershipCaption2:
        'We remain steadfast in our mission to serve with love, unity, and solidarity.',
      descriptionStart:
        'Civil Society Organization founded on February 26, 2019 and recognized as a State Public Utility Entity under',
      descriptionMiddle: '. Known throughout the community as',
      descriptionEnd:
        ', the institution runs its own artisanal production of nutritious soup, homemade bread, cakes, and food kits distributed free of charge to local families.',
      donateBtn: 'Donate via PIX / Goods',
      volunteerBtn: 'View volunteer roles',
      ebookBtn: 'Official E-book',
      audioPdfBtn: 'Listen to PDF',
      visitorKicker: 'Official Visitor Counter',
      visitorSubtitle: 'Visits recorded on this institutional portal',
      totalVisits: 'Total visits',
      uniqueVisitors: 'Unique visitors',
      fig1Tag: 'FIG. 1 · HEADQUARTERS DOCUMENTARY ARCHIVE',
      fig1Caption: 'Community Soup Project — Solidarity Kitchen in Bairro Olaria',
      specFoundedLabel: 'Formal Founding',
      specFoundedSub: 'Bairro Olaria · Plácido de Castro',
      specCnpjLabel: 'CNPJ / PIX Key',
      specPublicLabel: 'Public Utility',
      specPublicValue: 'State Law nº 3.809/2021',
      specPublicSub: 'Government of Acre · Official Gazette 11/24/21',
      specFomentoLabel: 'Public Grant & Oversight',
      monthlyGoal: {
        kicker: 'Monthly Impact Tracker',
        tabMeals: 'Meals Served',
        tabHours: 'Volunteer Hours',
        mealsUnit: 'meals',
        hoursUnit: 'hours',
        targetPrefix: 'Monthly goal:',
        reachedSuffix: 'of monthly goal reached',
        remainingPrefix: 'Remaining:',
        completedLabel: 'Monthly goal reached!',
        breakdownMeals: 'Community kitchen, bakery batches, and confirmed donations this month',
        breakdownHours: 'On-site volunteer shifts and active portal sign-ups this month',
        ctaMeals: 'Help fund more meals',
        ctaHours: 'Contribute volunteer hours',
      },
    },
    volunteer: {
      kicker: 'Volunteer Hub · Bairro Olaria, Plácido de Castro - AC',
      title: 'Open volunteer positions at Projeto Sopão',
      subtitle:
        'Inspired by community engagement practices for nonprofits, our hub organizes real volunteer fronts across the solidarity kitchen, bakery, food kit assembly, delivery routes, and grant governance.',
      unpaidNotice:
        'Important notice: all positions are strictly voluntary with no financial compensation of any kind.',
      openSpotsLabel: 'Open spots',
      positionsUnit: 'positions',
      myApplicationsBtn: 'My applications',
      allCategories: 'All',
      allShifts: 'All shifts',
      shiftPrefix: 'Shift',
      searchPlaceholder: 'Search activity or shift...',
      emptyTitle: 'No positions found for this filter',
      emptyDesc:
        'Adjust the work area, shift, or clear the search input to view all Projeto Sopão volunteer fronts.',
      clearFilters: 'Clear filters',
      spotsLeft: 'open spots',
      ofSpots: 'of',
      applyBtn: 'Apply now',
      alreadyApplied: 'Application saved',
      viewDetails: 'View details',
      modalityLabel: 'Modality',
      scheduleLabel: 'Schedule',
      locationLabel: 'Location',
      activitiesTitle: 'Front activities',
      requirementsTitle: 'Requirements & guidance',
      impactTitle: 'Community impact',
      formTitle: 'Submit volunteer application',
      fullNameLabel: 'Full name *',
      phoneLabel: 'Phone / WhatsApp *',
      availabilityLabel: 'Schedule availability',
      notesLabel: 'Notes or background (optional)',
      submitApplication: 'Confirm volunteer application',
      whatsappDirect: 'Send via WhatsApp',
      submittedSuccess: 'Your volunteer application has been registered!',
      removeApplication: 'Cancel application',
      myApplicationsTitle: 'My volunteer applications',
      close: 'Close',
    },
    donations: {
      kicker: 'Financial Support, Monthly Donors & Food Pickups',
      title: 'Contribute via PIX, become a monthly donor, or schedule a pickup',
      subtitle:
        'Every contribution sustains our community kitchen and solidarity bakery in Plácido de Castro. Support with a one-time PIX gift, recurring monthly pledge, or items from the list below.',
      donateNow: 'Donate now (PIX / Gateway)',
      monthlyDonor: 'Become Monthly Donor',
      adminPanel: 'Admin & Accounting',
      pixCnpjTitle: 'PIX Key · Institutional CNPJ',
      copyCnpj: 'Copy CNPJ',
      copiedCnpj: 'CNPJ copied',
      pixPhoneTitle: 'PIX Key & WhatsApp · Phone',
      pixPhoneSub: 'PIX transfer or receipt confirmation',
      copyPhone: 'Copy Phone',
      copiedPhone: 'Phone copied',
      tabProducts: 'Accepted Products List',
      tabSacoloes: 'Food Basket Donations',
      tabPickup: 'Schedule Food Pickup',
      allProductsFilter: 'All',
      thProduct: 'Product / Supply',
      thCategory: 'Area',
      thPriority: 'Priority',
      thProgress: 'Received / Goal',
      thAction: 'Donate item',
      selectForPickup: 'Select for pickup',
      pickupFormTitle: 'Donor & pickup details',
      pickupFormSubtitle:
        'Fill in your details to schedule pickup by the Projeto Sopão vehicle or send directly via WhatsApp',
      collabName: 'Donor full name',
      collabEmail: 'Donor email',
      collabPhone: 'Donor phone',
      pickupAddress: 'Full pickup address',
      preferredDate: 'Preferred date',
      preferredShift: 'Preferred shift',
      selectedItemsTitle: 'Items selected for donation',
      selectedItemsSubtitle: 'Enter quantities available for pickup.',
      otherItemsLabel: 'Additional items or notes',
      confirmPickupBtn: 'Confirm Pickup Schedule',
      savedNotice: 'Pickup scheduled and saved to administrative tracking!',
      sendWhatsappBtn: 'Send schedule via WhatsApp',
    },
    sacoloes: {
      kicker: 'Direct Food Security · Door-to-Door Deliveries',
      title: 'Food Basket Donations for Assisted Families',
      lead:
        'In addition to hot meals prepared in our community kitchen, Projeto Sopão assembles and delivers complete basic food baskets directly to registered vulnerable families in Plácido de Castro (AC).',
      p1:
        'Each food basket includes essential staples—rice, beans, regional cassava flour, pasta, wheat flour, cooking oil, sugar, coffee, and crackers—selected to ensure food autonomy and dignity at home.',
      p2:
        'To reach residents facing mobility challenges or long work hours, the volunteer team of Associação Recanto Social Bom Pastor carries out door-to-door deliveries, including evening routes, strengthening community bonds and ensuring help reaches those most in need.',
      ctaPix: 'Sponsor food baskets via PIX',
      ctaPickup: 'Donate groceries for pickup',
      galleryKicker: 'Delivery Archive ·',
      galleryRecordsSuffix: 'photographic records',
      galleryTitle: 'Records of food basket deliveries to families',
      galleryHint: 'Click any photograph to enlarge the view and read full delivery notes.',
      itemsPrefix: 'Items:',
      modalSub: 'Food Basket Donations',
      modalModality: 'Delivery type',
      modalLocation: 'Location',
      modalComposition: 'Composition',
      modalResponsible: 'Coordinator',
      prevBtn: 'Previous',
      nextBtn: 'Next',
    },
    production: {
      kicker: 'Chapter 6 · Official Photo Archive',
      title: 'Our in-house food production for free donation',
      subtitle:
        'At its Bairro Olaria headquarters, volunteers dedicate themselves to artisanal preparation of homemade loaves, rolls, sliced cakes, savory meals with seasoned farofa, and our traditional community soup.',
      allRecords: 'All records',
      registerLabel: 'Record',
      sourceLabel: 'Documentary source',
      frontLabel: 'Production front',
      destinationLabel: 'Destination',
      locationLabel: 'Preparation site',
      locationValue: 'Bairro Olaria HQ · Plácido de Castro',
      editInStudio: 'Edit photo in Studio',
      prevBtn: 'Previous',
      nextBtn: 'Next',
    },
    testimonials: {
      kicker: 'Community Voices · Plácido de Castro, AC',
      title: 'Testimonials from families served by Projeto Sopão',
      subtitle:
        'First-hand accounts from mothers, elders, and workers assisted in Bairro Olaria and rural roads through our community soup, bakery, and weekly deliveries.',
      allCategory: 'All',
      sendBtn: 'Share testimonial',
      closeFormBtn: 'Close form',
      formTitle: 'Share your experience with Projeto Sopão',
      formSubtitle:
        'Tell us how the community soup, bread, or food deliveries supported your family or neighborhood.',
      nameLabel: 'Full name *',
      roleLabel: 'Family context or role',
      neighborhoodLabel: 'Neighborhood or community',
      categoryLabel: 'Program area',
      quoteLabel: 'Your testimonial *',
      impactLabel: 'Support summary (optional)',
      submitBtn: 'Publish Testimonial',
      emptyTitle: 'No testimonials recorded in this category yet.',
      emptySubtitle: 'Select “All” or submit the first community story for this area.',
      directImpactPrefix: 'Direct impact:',
      supportPrefix: 'Support:',
      removeLabel: 'Remove story',
      thanksNotice: 'Thank you for sharing your testimonial with the community.',
    },
    faq: {
      kicker: 'Common Questions · Community Guide',
      title: 'Frequently Asked Questions',
      subtitle:
        'Clear answers on kitchen schedules, family assistance, PIX donations, food pickups, and volunteer sign-ups.',
      quickActionsTitle: 'Quick ways to collaborate',
      quickPix: 'Donate via PIX or monthly',
      quickPickup: 'Schedule food pickup',
      quickVolunteer: 'View volunteer roles',
      quickWhatsapp: 'Message on WhatsApp',
      allCategory: 'All',
    },
    intel: {
      kicker: 'Smart Tools & Public Grants',
      title: 'Public Grants, Community Map, Research & Solidarity Studio',
      subtitle:
        'Locate partner points in Plácido de Castro, search food-security public grants, or create visual campaign materials.',
      tabMaps: 'Map & Routes',
      tabSearch: 'Social Research',
      tabEditais: 'Grants & Funds',
      tabStudio: 'Visual Studio',
    },
    history: {
      kicker: 'Institutional & Historical Documentary',
      title: 'From Community Soup Kitchen to State Recognition and Public Funding',
      chaptersTitle: 'Chapter Index',
      fullDocKicker: 'Full document',
      fullDocDesc:
        'Access the complete 11-page formatted PDF document for transparency and institutional reference.',
      openEbookBtn: 'Open Official E-book',
      listenPdfBtn: 'Listen to PDF (Audio)',
      timelineKicker: 'Legal Milestones & Partnerships',
      timelineTitle: 'Chronological timeline (2019–2026)',
      specsKicker: 'Institutional Identification',
      specsTitle: 'Official Technical Sheet',
      specsDesc:
        'Official registry details documented in the Associação Recanto Social Bom Pastor E-book.',
      locationLabel: 'Headquarters Location',
      openMaps: 'Open in Google Maps',
      viewRouteMaps: 'View route on Google Maps',
    },
    ebook: {
      kicker: 'Official Documentary Edition · 11 Pages',
      titlePrefix: 'History of',
      viewPdfTab: 'View PDF',
      audioPdfTab: 'Listen to PDF Audio',
      downloadPdf: 'Download PDF',
      newTab: 'New tab',
      closeLabel: 'Close e-book viewer',
    },
    pdfAudio: {
      kicker: 'Accessibility · Audio PDF Reader (Text-to-Speech)',
      title: 'Listen to PDF / Audio File Reader',
      subtitle:
        'Load the official Association History E-book or upload any .pdf file from your device to extract its text and listen aloud with real-time segment highlighting.',
      loadOfficialBtn: 'Load Official History E-book (PDF)',
      uploadPdfBtn: 'Upload .pdf file',
      loadedDocLabel: 'Loaded document',
      extracting: 'Extracting PDF text with PDF.js...',
      playBtn: 'Play',
      resumeBtn: 'Resume',
      pauseBtn: 'Pause',
      stopBtn: 'Stop',
      speedLabel: 'Speed',
      voiceLabel: 'Reading language / voice',
      defaultVoice: 'Default language voice',
      progressLabel: 'Progress',
      pageLabel: 'Page',
      ofLabel: 'of',
      segmentHint: 'Click any segment below to start reading from that point.',
      emptyState:
        'Select the official Association E-book or upload a .pdf file to inspect and listen to its contents.',
      noSpeechSupport:
        'Your browser does not support the Web Speech synthesis API.',
      noTextExtracted:
        'No selectable text was found in this PDF (it may be a scanned image-only document).',
      extractError: 'Could not read the selected PDF file.',
    },
    footer: {
      popularNameLabel: 'Popular Name:',
      foundedLabel: 'Founded:',
      publicUtilityLabel: 'State Public Utility:',
      addressHeader: 'Headquarters Address & Direct Contact',
      openMaps: 'Open headquarters location on Google Maps',
      whatsappSuffix: '(WhatsApp / Pickups)',
      partnersLabel: 'Partners & Social Oversight:',
      navHeader: 'Institutional Navigation',
      linkVolunteer: 'Volunteer Opportunities',
      linkDonate: 'Donate via PIX & Schedule Pickup',
      linkBaskets: 'Food Basket Donations to Families',
      linkProduction: 'In-House Food Production',
      linkIntel: 'Map, Research & Studio',
      linkEbook: 'Documentary E-book (PDF)',
      linkAdmin: 'Admin & Accounting Dashboard',
    },
    portalAuth: {
      viewAccount: 'View My Account',
      closeNotice: 'Dismiss notice',
    },
  },
  es: {
    languageName: 'Español',
    nav: {
      roles: 'Voluntariado',
      donate: 'Donar',
      baskets: 'Canastas',
      production: 'Producción',
      testimonials: 'Testimonios',
      intel: 'Convocatorias y Mapa',
      history: 'Historia',
      panel: 'Panel',
      account: 'Mi Cuenta',
      signIn: 'Ingresar',
      signInCreate: 'Ingresar / Registrarse',
      volunteerCta: 'Quiero ser voluntario',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      selectLanguage: 'Seleccionar idioma',
    },
    pwa: {
      installApp: 'Instalar Aplicación',
      badge: 'Aplicación Instalable (PWA)',
      close: 'Cerrar',
      openNewTab: 'Abrir en nueva pestaña para instalar',
    },
    whatsapp: {
      inlineTitle: 'Hablar directo por WhatsApp',
      floatingLine1: 'Hablar directo',
      floatingLine2: 'por WhatsApp',
    },
    hero: {
      title:
        'Conozcan al matrimonio misionero Teodoro y Antônia Lúcia, fundadores de esta labor tan especial que lleva acogida, dignidad y seguridad alimentaria a las familias.',
      leadershipKicker: 'Directiva en Actividad · Cocina Comunitaria',
      leadershipCaption1:
        'En plena actividad, la presidenta de la institución, Antônia Missionária, y el vicepresidente, José Benedito, reafirman diariamente su compromiso con el bienestar social. Cada alimento preparado representa no solo sustento, sino sobre todo un gesto concreto de acogida, dignidad y esperanza para las familias atendidas por nuestra comunidad.',
      leadershipCaption2: 'Seguimos firmes en la misión de servir con amor, unión y solidaridad.',
      descriptionStart:
        'Organización de la Sociedad Civil fundada el 26 de febrero de 2019 y declarada Entidad de Utilidad Pública Estatal por la',
      descriptionMiddle: '. Conocida por la comunidad como',
      descriptionEnd:
        ', la institución mantiene producción artesanal propia de sopas nutritivas, panes caseros, pasteles y kits alimentarios distribuidos gratuitamente a las familias locales.',
      donateBtn: 'Donar vía PIX / Insumos',
      volunteerBtn: 'Ver vacantes voluntarias',
      ebookBtn: 'E-book Oficial',
      audioPdfBtn: 'Escuchar PDF',
      visitorKicker: 'Contador Oficial de Visitantes',
      visitorSubtitle: 'Visitas registradas en este portal institucional',
      totalVisits: 'Visitas totales',
      uniqueVisitors: 'Visitantes únicos',
      fig1Tag: 'FIG. 1 · ARCHIVO DOCUMENTAL DE LA SEDE',
      fig1Caption: 'Proyecto Sopão Comunitario — Cocina Solidaria en Bairro Olaria',
      specFoundedLabel: 'Fundación Formal',
      specFoundedSub: 'Bairro Olaria · Plácido de Castro',
      specCnpjLabel: 'Registro CNPJ / PIX',
      specPublicLabel: 'Utilidad Pública',
      specPublicValue: 'Ley nº 3.809/2021',
      specPublicSub: 'Gobierno del Estado de Acre · DOE 24/11/21',
      specFomentoLabel: 'Fomento y Control',
      monthlyGoal: {
        kicker: 'Seguimiento Mensual de Impacto',
        tabMeals: 'Comidas Servidas',
        tabHours: 'Horas Voluntarias',
        mealsUnit: 'comidas',
        hoursUnit: 'horas',
        targetPrefix: 'Meta mensual:',
        reachedSuffix: 'de la meta alcanzada',
        remainingPrefix: 'Faltan',
        completedLabel: '¡Meta mensual alcanzada!',
        breakdownMeals: 'Cocina solidaria, panadería y donaciones confirmadas este mes',
        breakdownHours: 'Turnos presenciales del equipo y nuevas inscripciones este mes',
        ctaMeals: 'Ayudar a servir más comidas',
        ctaHours: 'Sumar horas como voluntario',
      },
    },
    volunteer: {
      kicker: 'Central de Voluntariado · Bairro Olaria, Plácido de Castro - AC',
      title: 'Vacantes abiertas en el Projeto Sopão',
      subtitle:
        'Inspirada en el modelo de participación comunitaria para ONG, nuestra central organiza las áreas reales de trabajo voluntario en cocina solidaria, panadería, armado de kits, rutas de entrega y gestión documental.',
      unpaidNotice:
        'Aviso importante: todas las vacantes son expresamente voluntarias, sin ningún tipo de remuneración.',
      openSpotsLabel: 'Cupos disponibles',
      positionsUnit: 'posiciones',
      myApplicationsBtn: 'Mis postulaciones',
      allCategories: 'Todas',
      allShifts: 'Todos los turnos',
      shiftPrefix: 'Turno',
      searchPlaceholder: 'Buscar actividad o turno...',
      emptyTitle: 'No se encontraron vacantes para este filtro',
      emptyDesc:
        'Ajuste el área de actuación, el turno o limpie la búsqueda para ver todas las áreas del Projeto Sopão.',
      clearFilters: 'Limpiar filtros',
      spotsLeft: 'cupos abiertos',
      ofSpots: 'de',
      applyBtn: 'Postularme',
      alreadyApplied: 'Inscripción registrada',
      viewDetails: 'Ver detalles',
      modalityLabel: 'Modalidad',
      scheduleLabel: 'Horario',
      locationLabel: 'Ubicación',
      activitiesTitle: 'Actividades del área',
      requirementsTitle: 'Requisitos y orientaciones',
      impactTitle: 'Impacto comunitario',
      formTitle: 'Registrar postulación voluntaria',
      fullNameLabel: 'Nombre completo *',
      phoneLabel: 'Teléfono / WhatsApp *',
      availabilityLabel: 'Disponibilidad horaria',
      notesLabel: 'Observaciones o experiencia (opcional)',
      submitApplication: 'Confirmar inscripción voluntaria',
      whatsappDirect: 'Enviar por WhatsApp',
      submittedSuccess: '¡Su inscripción voluntaria fue registrada con éxito!',
      removeApplication: 'Cancelar inscripción',
      myApplicationsTitle: 'Mis postulaciones voluntarias',
      close: 'Cerrar',
    },
    donations: {
      kicker: 'Apoyo Financiero, Donantes Mensuales y Recolección',
      title: 'Contribuya vía PIX, hágase donante mensual o programe una recolección',
      subtitle:
        'Cada contribución sostiene la cocina comunitaria y la panadería solidaria en Plácido de Castro. Apoye con una donación única, suscripción mensual vía PIX o productos de la lista.',
      donateNow: 'Donar ahora (PIX / Pasarela)',
      monthlyDonor: 'Ser Donante Mensual',
      adminPanel: 'Panel y Contabilidad',
      pixCnpjTitle: 'Clave PIX · CNPJ Institucional',
      copyCnpj: 'Copiar CNPJ',
      copiedCnpj: 'CNPJ copiado',
      pixPhoneTitle: 'Clave PIX y WhatsApp · Teléfono',
      pixPhoneSub: 'Transferencia PIX o envío de comprobantes',
      copyPhone: 'Copiar Teléfono',
      copiedPhone: 'Teléfono copiado',
      tabProducts: 'Lista de Productos Aceptados',
      tabSacoloes: 'Donaciones de Canastas',
      tabPickup: 'Programar Recolección',
      allProductsFilter: 'Todos',
      thProduct: 'Producto / Insumo',
      thCategory: 'Área',
      thPriority: 'Prioridad',
      thProgress: 'Recibido / Meta',
      thAction: 'Donar ítem',
      selectForPickup: 'Seleccionar para recolección',
      pickupFormTitle: 'Datos del colaborador y recolección',
      pickupFormSubtitle:
        'Complete sus datos para programar el retiro con el vehículo del Projeto Sopão o envíe por WhatsApp',
      collabName: 'Nombre del colaborador',
      collabEmail: 'Correo electrónico',
      collabPhone: 'Teléfono del colaborador',
      pickupAddress: 'Dirección completa para retiro',
      preferredDate: 'Fecha preferida',
      preferredShift: 'Turno preferido',
      selectedItemsTitle: 'Productos seleccionados para donar',
      selectedItemsSubtitle: 'Indique la cantidad de los artículos disponibles.',
      otherItemsLabel: 'Otros productos u observaciones',
      confirmPickupBtn: 'Confirmar Programación',
      savedNotice: '¡Programación guardada en el control administrativo!',
      sendWhatsappBtn: 'Enviar programación por WhatsApp',
    },
    sacoloes: {
      kicker: 'Seguridad Alimentaria Directa · Entregas a Domicilio',
      title: 'Donaciones de Canastas Básicas a Familias Asistidas',
      lead:
        'Además de las comidas preparadas en la cocina comunitaria, el Projeto Sopão arma y entrega directamente canastas completas de alimentos básicos a familias registradas en situación de vulnerabilidad en Plácido de Castro (AC).',
      p1:
        'Cada canasta se organiza con alimentos de primera necesidad — arroz, frijoles, harina de yuca regional, pasta, harina de trigo, aceite, azúcar, café y galletas — seleccionados para asegurar autonomía alimentaria y dignidad en el hogar.',
      p2:
        'Para llegar a vecinos con dificultades de movilidad o jornadas extensas, el equipo voluntario de la Associação Recanto Social Bom Pastor realiza entregas puerta a puerta, incluso en horario nocturno, fortaleciendo el vínculo comunitario.',
      ctaPix: 'Apoyar canastas vía PIX',
      ctaPickup: 'Donar alimentos para retiro',
      galleryKicker: 'Archivo de Entregas ·',
      galleryRecordsSuffix: 'registros fotográficos',
      galleryTitle: 'Registros de entregas de canastas a las familias',
      galleryHint: 'Haga clic en cualquier fotografía para ampliar la vista y leer los detalles.',
      itemsPrefix: 'Artículos:',
      modalSub: 'Donaciones de Canastas',
      modalModality: 'Modalidad',
      modalLocation: 'Localidad',
      modalComposition: 'Composición',
      modalResponsible: 'Responsable',
      prevBtn: 'Anterior',
      nextBtn: 'Siguiente',
    },
    production: {
      kicker: 'Capítulo 6 · Archivo Fotográfico Oficial',
      title: 'Nuestra producción propia de alimentos para donación',
      subtitle:
        'En su sede del Bairro Olaria, voluntarios elaboran artesanalmente panes caseros, panecillos individuales, pasteles en porciones, platos con farofa sazonada y el tradicional sopão comunitario.',
      allRecords: 'Todos los registros',
      registerLabel: 'Registro',
      sourceLabel: 'Fuente documental',
      frontLabel: 'Área de producción',
      destinationLabel: 'Destino',
      locationLabel: 'Lugar de elaboración',
      locationValue: 'Sede Bairro Olaria · Plácido de Castro',
      editInStudio: 'Editar esta foto en el Estudio',
      prevBtn: 'Anterior',
      nextBtn: 'Siguiente',
    },
    testimonials: {
      kicker: 'Voces de la Comunidad · Plácido de Castro, AC',
      title: 'Testimonios de quienes reciben el Projeto Sopão',
      subtitle:
        'Relatos directos de madres, adultos mayores y trabajadores atendidos en el Bairro Olaria y zonas rurales mediante el sopão comunitario, panadería y entregas semanales.',
      allCategory: 'Todos',
      sendBtn: 'Enviar testimonio',
      closeFormBtn: 'Cerrar formulario',
      formTitle: 'Compartir experiencia con el Projeto Sopão',
      formSubtitle:
        'Cuéntenos cómo el sopão comunitario, los panes o las entregas apoyaron a su familia o comunidad.',
      nameLabel: 'Nombre completo *',
      roleLabel: 'Contexto familiar o vínculo',
      neighborhoodLabel: 'Barrio o comunidad',
      categoryLabel: 'Área de atención',
      quoteLabel: 'Su testimonio *',
      impactLabel: 'Resumen del apoyo recibido (opcional)',
      submitBtn: 'Publicar Testimonio',
      emptyTitle: 'Aún no hay testimonios registrados en esta área.',
      emptySubtitle: 'Seleccione “Todos” o envíe el primer relato comunitario de esta categoría.',
      directImpactPrefix: 'Impacto directo:',
      supportPrefix: 'Apoyo:',
      removeLabel: 'Eliminar relato',
      thanksNotice: 'Gracias por compartir su testimonio con la comunidad.',
    },
    faq: {
      kicker: 'Dudas Frecuentes · Guía Comunitaria',
      title: 'Preguntas Frecuentes',
      subtitle:
        'Aclaraciones directas sobre horarios de producción, atención a familias, claves PIX, recolección de donaciones e inscripción de voluntarios.',
      quickActionsTitle: 'Acciones rápidas para colaborar',
      quickPix: 'Contribuir vía PIX o mensual',
      quickPickup: 'Programar recolección de alimentos',
      quickVolunteer: 'Ver vacantes de voluntariado',
      quickWhatsapp: 'Escribir por WhatsApp',
      allCategory: 'Todas',
    },
    intel: {
      kicker: 'Herramientas Inteligentes y Fondos Públicos',
      title: 'Convocatorias, Mapa Comunitario, Investigación y Estudio Solidario',
      subtitle:
        'Ubique puntos de apoyo en Plácido de Castro, busque convocatorias públicas de seguridad alimentaria o diseñe piezas visuales de campaña.',
      tabMaps: 'Mapa y Rutas',
      tabSearch: 'Investigación Social',
      tabEditais: 'Convocatorias y Fondos',
      tabStudio: 'Estudio Visual',
    },
    history: {
      kicker: 'Documental Institucional e Histórico',
      title: 'Del Projeto Sopão Comunitario al Reconocimiento y Fomento Estatal',
      chaptersTitle: 'Índice de Capítulos',
      fullDocKicker: 'Consulta integral',
      fullDocDesc:
        'Acceda al documento completo en PDF con sus 11 páginas maquetadas para consulta documental y transparencia.',
      openEbookBtn: 'Abrir E-book Oficial',
      listenPdfBtn: 'Escuchar PDF / Leer en Audio',
      timelineKicker: 'Hitos Legales y Alianzas',
      timelineTitle: 'Línea de tiempo cronológica (2019–2026)',
      specsKicker: 'Identificación Institucional',
      specsTitle: 'Ficha Técnica Oficial',
      specsDesc:
        'Datos oficiales registrados en el e-book documental de la Associação Recanto Social Bom Pastor.',
      locationLabel: 'Ubicación de la Sede',
      openMaps: 'Abrir en Google Maps',
      viewRouteMaps: 'Ver ruta en Google Maps',
    },
    ebook: {
      kicker: 'Edición Documental Oficial · 11 Páginas',
      titlePrefix: 'Historia de la',
      viewPdfTab: 'Visualizar PDF',
      audioPdfTab: 'Escuchar PDF en Audio',
      downloadPdf: 'Descargar PDF',
      newTab: 'Nueva pestaña',
      closeLabel: 'Cerrar visor del e-book',
    },
    pdfAudio: {
      kicker: 'Accesibilidad · Lector de PDF en Audio (Text-to-Speech)',
      title: 'Escuchar PDF / Leer Archivo en Audio',
      subtitle:
        'Cargue el E-book Histórico oficial de la asociación o suba cualquier archivo .pdf desde su dispositivo para extraer el texto y escucharlo en voz alta con resaltado en tiempo real.',
      loadOfficialBtn: 'Cargar E-book Historia Oficial (PDF)',
      uploadPdfBtn: 'Subir archivo .pdf',
      loadedDocLabel: 'Documento cargado',
      extracting: 'Extrayendo texto del PDF con PDF.js...',
      playBtn: 'Reproducir',
      resumeBtn: 'Continuar',
      pauseBtn: 'Pausar',
      stopBtn: 'Detener',
      speedLabel: 'Velocidad',
      voiceLabel: 'Idioma / Voz de lectura',
      defaultVoice: 'Voz predeterminada del idioma',
      progressLabel: 'Progreso',
      pageLabel: 'Página',
      ofLabel: 'de',
      segmentHint: 'Haga clic en cualquier fragmento para iniciar la lectura desde allí.',
      emptyState:
        'Seleccione el E-book oficial de la asociación o suba un archivo .pdf para ver y escuchar su contenido.',
      noSpeechSupport:
        'Su navegador no es compatible con la API de síntesis de voz (Web Speech API).',
      noTextExtracted:
        'No se encontró texto seleccionable en este PDF (puede ser un documento escaneado solo como imagen).',
      extractError: 'No fue posible leer el archivo PDF seleccionado.',
    },
    footer: {
      popularNameLabel: 'Nombre Popular:',
      foundedLabel: 'Fundación:',
      publicUtilityLabel: 'Utilidad Pública Estatal:',
      addressHeader: 'Dirección de la Sede y Contacto Directo',
      openMaps: 'Abrir ubicación de la sede en Google Maps',
      whatsappSuffix: '(WhatsApp / Recolección)',
      partnersLabel: 'Alianzas y Control Social:',
      navHeader: 'Navegación Institucional',
      linkVolunteer: 'Vacantes de Voluntariado',
      linkDonate: 'Donar vía PIX y Programar Retiro',
      linkBaskets: 'Donaciones de Canastas a Familias',
      linkProduction: 'Producción Propia de Alimentos',
      linkIntel: 'Mapa, Investigación y Estudio',
      linkEbook: 'E-book Documental (PDF)',
      linkAdmin: 'Panel Administrativo y Contabilidad',
    },
    portalAuth: {
      viewAccount: 'Ver Mi Cuenta',
      closeNotice: 'Cerrar aviso',
    },
  },
};
