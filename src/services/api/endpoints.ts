/**
 * Mapa central de rotas REST — fonte única de verdade das URLs da API.
 *
 * Todas as URLs são RELATIVAS à baseURL (`VITE_API_URL`, por omissão "/api" —
 * relativo de propósito, para funcionar em qualquer porta local; em produção
 * com o backend Laravel real, aponta para o URL absoluto da API), por isso NÃO
 * incluem o prefixo `/api`.
 * Ex.: endpoints.noticias.list === "/noticias" -> pedido a ".../api/noticias".
 *
 * Por agora só o módulo `noticias` tem implementação real (serviço + handlers
 * MSW). Os restantes estão aqui documentados para fixar o contrato completo que
 * a modernização vai replicar módulo a módulo (ver PLANO-ATUALIZACAO-FRONTEND.txt
 * secção 3.1.4). À medida que cada módulo migrar, acrescenta-se a respectiva
 * entrada real seguindo exactamente o padrão de `noticias`.
 */
export const endpoints = {
  // --- AUTENTICAÇÃO ---------------------------------------------------------
  auth: {
    login: "/login",
    logout: "/logout",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    changePassword: "/user/password",
    user: "/user",
  },
  chatAssistant: {
    send: "/chat-assistant",
  },

  // --- GERAL --------------------------------------------------------------
  noticias: {
    list: "/noticias",
    detail: (id: string) => `/noticias/${id}`,
  },
  legislacao: {
    list: "/legislacao",
    detail: (id: string) => `/legislacao/${id}`,
  },
  departamentos: {
    list: "/departamentos",
    detail: (id: string) => `/departamentos/${id}`,
  },
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
  },
  rbac: {
    permissions: "/rbac/permissions",
    users: "/rbac/users",
    userRole: (userId: string, role: string) => `/rbac/users/${userId}/roles/${role}`,
  },
  heroSlides: {
    list: "/hero-slides",
    /** Listagem admin (todos os slides, publicados ou não, paginada). */
    admin: "/hero-slides/admin",
    detail: (id: string) => `/hero-slides/${id}`,
  },
  publicStats: {
    summary: "/public/stats",
  },
  contactMessages: {
    create: "/contact-messages",
    list: "/contact-messages",
    detail: (id: string) => `/contact-messages/${id}`,
  },
  notifications: {
    list: "/notifications",
    detail: (id: string) => `/notifications/${id}`,
    markAllRead: "/notifications/mark-all-read",
  },
  perfil: {
    me: "/perfil/me",
  },
  dashboardPrefs: {
    me: "/dashboard-prefs/me",
  },
  dashboardAlertAcks: {
    list: "/dashboard-alert-acks",
    detail: (metricKey: string) => `/dashboard-alert-acks/${metricKey}`,
  },
  dashboardAlertHistory: {
    list: "/dashboard-alert-history",
    detail: (id: string) => `/dashboard-alert-history/${id}`,
  },

  // --- LABORATÓRIO ---------------------------------------------------------
  // Onda 3: domínio real da REQ-005 (requisições em lote -> amostras ->
  // boletins), substitui o antigo par analises/resultados (CRUD genérico
  // herdado do Supabase) — ver SIG-IIV-MEMORIA-PROJETO.md secção 15.
  laboratorios: {
    list: "/laboratorios",
    detail: (id: string) => `/laboratorios/${id}`,
  },
  requisicoes: {
    list: "/requisicoes",
    detail: (id: string) => `/requisicoes/${id}`,
  },
  amostras: {
    list: "/amostras",
    detail: (id: string) => `/amostras/${id}`,
    aceitar: (id: string) => `/amostras/${id}/aceitar`,
    rejeitar: (id: string) => `/amostras/${id}/rejeitar`,
  },
  boletins: {
    list: "/boletins",
    detail: (id: string) => `/boletins/${id}`,
    resultado: (id: string) => `/boletins/${id}/resultado`,
    validar: (id: string) => `/boletins/${id}/validar`,
    comunicar: (id: string) => `/boletins/${id}/comunicar`,
  },
  criteriosRejeicao: {
    list: "/criterios-rejeicao",
    detail: (id: string) => `/criterios-rejeicao/${id}`,
  },
  inqueritosSatisfacao: {
    list: "/inqueritos-satisfacao",
  },
  insumos: {
    list: "/insumos",
    detail: (id: string) => `/insumos/${id}`,
  },

  // --- QUALIDADE ------------------------------------------------------------
  estacoes: {
    list: "/estacoes",
    detail: (id: string) => `/estacoes/${id}`,
  },
  auditorias: {
    list: "/auditorias",
    detail: (id: string) => `/auditorias/${id}`,
  },
  naoConformidades: {
    list: "/nao-conformidades",
    detail: (id: string) => `/nao-conformidades/${id}`,
  },
  logs: {
    list: "/logs",
  },
  animais: {
    list: "/animais",
    detail: (id: string) => `/animais/${id}`,
    events: (animalId: string) => `/animais/${animalId}/eventos`,
    health: (animalId: string) => `/animais/${animalId}/saude`,
  },
  inseminacao: {
    centros: "/inseminacao/centros",
    centro: (id: string) => `/inseminacao/centros/${id}`,
    reprodutores: "/inseminacao/reprodutores",
    reprodutor: (id: string) => `/inseminacao/reprodutores/${id}`,
    tanques: "/inseminacao/tanques",
    tanque: (id: string) => `/inseminacao/tanques/${id}`,
    doses: "/inseminacao/doses",
    dose: (id: string) => `/inseminacao/doses/${id}`,
    registos: "/inseminacao/registos",
    registo: (id: string) => `/inseminacao/registos/${id}`,
  },

  // --- PRODUÇÃO -------------------------------------------------------------
  produtos: {
    list: "/produtos",
    detail: (id: string) => `/produtos/${id}`,
    archive: (id: string) => `/produtos/${id}/archive`,
    restore: (id: string) => `/produtos/${id}/restore`,
  },
  lotes: {
    list: "/lotes",
    detail: (id: string) => `/lotes/${id}`,
  },
  planeamento: {
    list: "/planeamento",
    detail: (id: string) => `/planeamento/${id}`,
  },
  distribuicao: {
    list: "/distribuicao",
    detail: (id: string) => `/distribuicao/${id}`,
  },

  // --- GESTÃO -----------------------------------------------------------
  documentos: {
    list: "/documentos",
    detail: (id: string) => `/documentos/${id}`,
    versions: (id: string) => `/documentos/${id}/versions`,
  },
  documentCategories: {
    list: "/document-categories",
  },
  documentLinks: {
    list: "/document-links",
    detail: (id: string) => `/document-links/${id}`,
  },
  documentPermissions: {
    list: "/document-permissions",
    detail: (id: string) => `/document-permissions/${id}`,
  },
  processosTipos: {
    list: "/processos-tipos",
    detail: (id: string) => `/processos-tipos/${id}`,
    steps: (typeId: string) => `/processos-tipos/${typeId}/etapas`,
    step: (typeId: string, stepId: string) => `/processos-tipos/${typeId}/etapas/${stepId}`,
  },
  processos: {
    list: "/processos",
    detail: (id: string) => `/processos/${id}`,
    stats: "/processos/stats",
    steps: (id: string) => `/processos/${id}/etapas`,
    events: (id: string) => `/processos/${id}/eventos`,
    advance: (id: string) => `/processos/${id}/avancar`,
    return: (id: string) => `/processos/${id}/devolver`,
    cancel: (id: string) => `/processos/${id}/cancelar`,
    attachments: (id: string) => `/processos/${id}/anexos`,
    attachment: (id: string, attachmentId: string) => `/processos/${id}/anexos/${attachmentId}`,
  },

  // --- FINANCEIRO & PATRIMÓNIO ------------------------------------------
  contas: {
    list: "/contas",
    detail: (id: string) => `/contas/${id}`,
  },
  lancamentos: {
    list: "/lancamentos",
    detail: (id: string) => `/lancamentos/${id}`,
  },
  orcamentos: {
    list: "/orcamentos",
    detail: (id: string) => `/orcamentos/${id}`,
  },
  // Dualidade obrigatória (ver SIG-IIV-MEMORIA-PROJETO.md secção 6): activos
  // central vs de estação são esquemas separados, nunca um único `/activos`.
  patrimonioCentral: {
    list: "/patrimonio-central",
    detail: (id: string) => `/patrimonio-central/${id}`,
    manutencoes: "/patrimonio-central/manutencoes",
    manutencao: (id: string) => `/patrimonio-central/manutencoes/${id}`,
  },
  patrimonioEstacao: {
    list: "/patrimonio-estacao",
    detail: (id: string) => `/patrimonio-estacao/${id}`,
    manutencoes: "/patrimonio-estacao/manutencoes",
    manutencao: (id: string) => `/patrimonio-estacao/manutencoes/${id}`,
  },

  // --- PESSOAS & MISSÕES ------------------------------------------------
  // Dualidade obrigatória (ver SIG-IIV-MEMORIA-PROJETO.md secção 6): RH
  // transversal vs laboratorial são esquemas separados, nunca um único `/rh`.
  rhTransversal: {
    colaboradores: "/rh-transversal/colaboradores",
    colaborador: (id: string) => `/rh-transversal/colaboradores/${id}`,
    contratos: "/rh-transversal/contratos",
    contrato: (id: string) => `/rh-transversal/contratos/${id}`,
    ausencias: "/rh-transversal/ausencias",
    ausencia: (id: string) => `/rh-transversal/ausencias/${id}`,
  },
  rhLaboratorio: {
    colaboradores: "/rh-laboratorio/colaboradores",
    colaborador: (id: string) => `/rh-laboratorio/colaboradores/${id}`,
    contratos: "/rh-laboratorio/contratos",
    contrato: (id: string) => `/rh-laboratorio/contratos/${id}`,
    ausencias: "/rh-laboratorio/ausencias",
    ausencia: (id: string) => `/rh-laboratorio/ausencias/${id}`,
  },
  formacoes: {
    list: "/formacoes",
    detail: (id: string) => `/formacoes/${id}`,
  },
  missoes: {
    list: "/missoes",
    detail: (id: string) => `/missoes/${id}`,
    stats: "/missoes/stats",
    submit: (id: string) => `/missoes/${id}/submeter`,
    approve: (id: string) => `/missoes/${id}/aprovar`,
    reject: (id: string) => `/missoes/${id}/rejeitar`,
    participants: (id: string) => `/missoes/${id}/participantes`,
    participant: (id: string, pid: string) => `/missoes/${id}/participantes/${pid}`,
    guide: (id: string) => `/missoes/${id}/guia`,
    expenses: (id: string) => `/missoes/${id}/despesas`,
    expense: (id: string, eid: string) => `/missoes/${id}/despesas/${eid}`,
    report: (id: string) => `/missoes/${id}/relatorio`,
    approveReport: (id: string) => `/missoes/${id}/relatorio/aprovar`,
  },

  // --- RECURSOS & PRODUÇÃO -----------------------------------------------
  stock: {
    itens: "/stock/itens",
    item: (id: string) => `/stock/itens/${id}`,
    localizacoes: "/stock/localizacoes",
    localizacao: (id: string) => `/stock/localizacoes/${id}`,
    movimentos: "/stock/movimentos",
    movimento: (id: string) => `/stock/movimentos/${id}`,
  },
  culturas: {
    list: "/culturas",
    detail: (id: string) => `/culturas/${id}`,
  },
  campos: {
    list: "/campos",
    detail: (id: string) => `/campos/${id}`,
  },
  colheitas: {
    list: "/colheitas",
    detail: (id: string) => `/colheitas/${id}`,
  },
  producaoPecuaria: {
    list: "/producao-pecuaria",
    detail: (id: string) => `/producao-pecuaria/${id}`,
  },

  // --- INVESTIGAÇÃO & BI --------------------------------------------------
  investigacao: {
    stats: "/investigacao/stats",
    lines: "/investigacao/linhas",
    line: (id: string) => `/investigacao/linhas/${id}`,
    projects: "/investigacao/projectos",
    project: (id: string) => `/investigacao/projectos/${id}`,
    publications: "/investigacao/publicacoes",
    publication: (id: string) => `/investigacao/publicacoes/${id}`,
  },
  avaliacoes: {
    cycles: "/avaliacoes/ciclos",
    cycle: (id: string) => `/avaliacoes/ciclos/${id}`,
    criterias: "/avaliacoes/criterios",
    criteria: (id: string) => `/avaliacoes/criterios/${id}`,
    list: "/avaliacoes",
    detail: (id: string) => `/avaliacoes/${id}`,
    stats: "/avaliacoes/stats",
    scores: (id: string) => `/avaliacoes/${id}/pontuacoes`,
    history: (id: string) => `/avaliacoes/${id}/historico`,
    submit: (id: string) => `/avaliacoes/${id}/submeter`,
    approve: (id: string) => `/avaliacoes/${id}/aprovar`,
    reject: (id: string) => `/avaliacoes/${id}/rejeitar`,
    validate: (id: string) => `/avaliacoes/${id}/validar`,
    reopen: (id: string) => `/avaliacoes/${id}/reabrir`,
  },
  // Observatório Veterinário Nacional (Onda 11) — só a Fase 1 (mapa
  // georreferenciado de estações + colheitas). Fases 2/3 (indicadores
  // sanitários, zonas/focos) ficam por construir.
  observatorio: {
    mapa: "/observatorio/mapa",
  },

  // --- Módulos futuros (contrato documentado, ainda sem implementação) -----
  //
  // GERAL
  //   mensagens:     "/mensagens"             (+ detail /{id})
  //   notificacoes:  "/notificacoes"          (+ detail /{id})
  //   utilizadores:  "/utilizadores"          (+ detail /{id})
  //   departamentos: "/departamentos"         (+ detail /{id})
  //
  // QUALIDADE — migrado por completo, ver secção QUALIDADE acima
  //
  // RECURSOS & PRODUÇÃO — migrado por completo, ver secção acima
  //
  // GESTÃO — migrado por completo, ver secção GESTÃO acima
  //
  // FINANCEIRO & PATRIMÓNIO — migrado por completo, ver secção acima
  //
  // PESSOAS & MISSÕES — migrado por completo, ver secção acima
  //
  // INVESTIGAÇÃO & BI — migrado por completo, ver secção acima (BI é só
  //   agregação de leitura sobre os módulos já migrados, sem endpoints próprios)
  //
  // AUTH — migrado por completo, ver bloco `auth` acima (secção 3.2 do PLANO).
  //   Em modo mock não há `GET /sanctum/csrf-cookie` real (cookie-based Sanctum
  //   é simulado por um token Bearer em localStorage — ver `src/lib/http.ts`).
} as const;

export default endpoints;
