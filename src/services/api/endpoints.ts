/**
 * Mapa central de rotas REST — fonte única de verdade das URLs da API.
 *
 * Todas as URLs são RELATIVAS à baseURL (`VITE_API_URL`, ex.
 * "http://localhost:8081/api"), por isso NÃO incluem o prefixo `/api`.
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

  // --- Módulos futuros (contrato documentado, ainda sem implementação) -----
  //
  // GERAL
  //   heroSlides:    "/hero-slides"           (+ detail /{id})
  //   mensagens:     "/mensagens"             (+ detail /{id})
  //   notificacoes:  "/notificacoes"          (+ detail /{id})
  //   utilizadores:  "/utilizadores"          (+ detail /{id})
  //   departamentos: "/departamentos"         (+ detail /{id})
  //   rbac:          "/rbac/roles", "/rbac/permissions" (PUT matriz papel x módulo)
  //
  // LABORATÓRIO
  //   laboratorios:  "/laboratorios"
  //   analises:      "/analises"
  //   resultados:    "/resultados"
  //   insumos:       "/insumos"
  //
  // PRODUÇÃO
  //   produtos:      "/produtos"
  //   lotes:         "/lotes"
  //   planeamento:   "/planeamento"
  //   distribuicao:  "/distribuicao"
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
