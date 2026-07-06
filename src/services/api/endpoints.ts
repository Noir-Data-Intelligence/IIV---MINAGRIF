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

  // --- LABORATÓRIO ---------------------------------------------------------
  laboratorios: {
    list: "/laboratorios",
    detail: (id: string) => `/laboratorios/${id}`,
  },
  analises: {
    list: "/analises",
    detail: (id: string) => `/analises/${id}`,
  },
  insumos: {
    list: "/insumos",
    detail: (id: string) => `/insumos/${id}`,
  },
  resultados: {
    list: "/resultados",
    detail: (id: string) => `/resultados/${id}`,
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

  // --- Módulos futuros (contrato documentado, ainda sem implementação) -----
  //
  // GERAL
  //   mensagens:     "/mensagens"             (+ detail /{id})
  //   notificacoes:  "/notificacoes"          (+ detail /{id})
  //   utilizadores:  "/utilizadores"          (+ detail /{id})
  //   departamentos: "/departamentos"         (+ detail /{id})
  //
  // QUALIDADE
  //   estacoes:          "/estacoes"
  //   auditorias:        "/auditorias"
  //   naoConformidades:  "/nao-conformidades"
  //   animais:           "/animais"
  //   inseminacao:       "/inseminacao/{centros|reprodutores|tanques}"
  //   logs:              "/logs"
  //
  // RECURSOS & PRODUÇÃO
  //   stock:             "/stock/{itens|localizacoes|movimentos}"
  //   agricultura:       "/agricultura"
  //   producaoPecuaria:  "/producao-pecuaria"
  //
  // GESTÃO
  //   documentos:  "/documentos" (+ /versions, /permissions)
  //   processos:   "/processos"  (+ /etapas)
  //
  // FINANCEIRO & PATRIMÓNIO
  //   contas:       "/contas"
  //   orcamentos:   "/orcamentos"
  //   activos:      "/activos"
  //   manutencoes:  "/manutencoes"
  //   (KPIs agregados dedicados: ex. "/financeiro/resumo")
  //
  // PESSOAS & MISSÕES
  //   rhColaboradores: "/rh/colaboradores"
  //   missoes:         "/missoes" (+ /aprovar, /guia-marcha, /prestacao-contas)
  //   formacoes:       "/formacoes"
  //
  // INVESTIGAÇÃO & BI
  //   linhasPesquisa: "/linhas-pesquisa"
  //   publicacoes:    "/publicacoes"
  //   avaliacoes:     "/avaliacoes" (+ /aprovar)
  //   bi:             "/bi/institucional"
  //
  // AUTH (ver secção 3.2)
  //   login:      "/login"   (POST)
  //   logout:     "/logout"  (POST)
  //   user:       "/user"    (GET)
  //   csrfCookie: "/sanctum/csrf-cookie" (fora do prefixo /api, se cookie-based)
} as const;

export default endpoints;
