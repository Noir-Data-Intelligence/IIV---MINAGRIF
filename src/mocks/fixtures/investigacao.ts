import type { LineDto, ProjectDto, PublicationDto } from "@/types/dto/investigacao";

/**
 * Dados fictícios mas plausíveis da actividade científica do IIV (Instituto de
 * Investigação Veterinária de Angola). Servem os handlers MSW enquanto o backend
 * Laravel não existe. Montantes de financiamento em Kwanzas Angolanos (AOA).
 *
 * Cobre linhas de investigação reais em saúde animal (vigilância epidemiológica,
 * melhoramento genético, doenças transfronteiriças, resistência antimicrobiana),
 * projectos de I&D com financiadores plausíveis (FAO, OIE/WOAH, MINAGRIF, cooperação
 * internacional) e produção científica coerente (artigos, comunicações em
 * conferências e relatórios técnicos).
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers create/update/
 * delete operam sobre estes arrays em memória, persistindo alterações durante a
 * sessão do browser (perde-se no refresh, comportamento esperado de um mock).
 *
 * `createdBy` refere utilizadores de `fixtures/users.ts` (usr-0001..usr-0012).
 */

// --- Linhas de investigação -------------------------------------------------

export const linesFixtures: LineDto[] = [
  {
    id: "lin-0001",
    name: "Vigilância epidemiológica de doenças transfronteiriças",
    area: "Epidemiologia",
    description:
      "Monitorização e alerta precoce de doenças animais transfronteiriças (PSA, febre aftosa, peste dos pequenos ruminantes) com impacto no comércio e na segurança alimentar.",
    status: "activa",
    createdBy: "usr-0002",
    createdAt: "2023-01-20T09:00:00.000Z",
  },
  {
    id: "lin-0002",
    name: "Melhoramento genético de raças autóctones",
    area: "Genética e Reprodução",
    description:
      "Caracterização e conservação de raças bovinas e caprinas autóctones angolanas, com foco em produtividade e adaptação a ambientes áridos.",
    status: "activa",
    createdBy: "usr-0003",
    createdAt: "2023-02-14T10:30:00.000Z",
  },
  {
    id: "lin-0003",
    name: "Resistência antimicrobiana em produção pecuária",
    area: "Saúde Pública Veterinária",
    description:
      "Vigilância da resistência a antimicrobianos em bactérias de origem animal, numa perspectiva One Health.",
    status: "activa",
    createdBy: "usr-0002",
    createdAt: "2023-03-08T08:45:00.000Z",
  },
  {
    id: "lin-0004",
    name: "Diagnóstico laboratorial de doenças virais animais",
    area: "Virologia",
    description:
      "Desenvolvimento e validação de métodos moleculares e serológicos para o diagnóstico rápido de viroses de importância pecuária.",
    status: "activa",
    createdBy: "usr-0004",
    createdAt: "2023-04-19T11:15:00.000Z",
  },
  {
    id: "lin-0005",
    name: "Controlo de vectores e doenças parasitárias",
    area: "Parasitologia",
    description:
      "Estudo da distribuição de vectores (carraças, tsé-tsé) e das hemoparasitoses associadas nos efectivos pecuários nacionais.",
    status: "suspensa",
    createdBy: "usr-0005",
    createdAt: "2023-06-02T14:00:00.000Z",
  },
];

// --- Projectos de I&D -------------------------------------------------------

export const projectsFixtures: ProjectDto[] = [
  {
    id: "prj-0001",
    lineId: "lin-0001",
    title: "Vigilância da Peste Suína Africana (PSA) na região norte",
    objectives:
      "Determinar a seroprevalência da PSA em suínos de criação familiar nas províncias do Uíge e Zaire e mapear focos activos para orientar medidas de contenção.",
    status: "em_curso",
    startDate: "2024-01-15",
    endDate: "2025-12-31",
    fundingSource: "FAO — Programa de Emergência",
    fundingAmount: 45000000,
    currency: "AOA",
    partners: "FAO, Direcção Nacional de Pecuária, IIV",
    createdBy: "usr-0002",
    createdAt: "2023-11-30T09:00:00.000Z",
  },
  {
    id: "prj-0002",
    lineId: "lin-0001",
    title: "Programa nacional de controlo da Febre Aftosa",
    objectives:
      "Estabelecer zonas de vigilância e definir um plano nacional de vacinação faseada contra a febre aftosa em bovinos, alinhado com as directrizes da WOAH.",
    status: "aprovado",
    startDate: "2024-06-01",
    endDate: "2027-05-31",
    fundingSource: "MINAGRIF / WOAH",
    fundingAmount: 120000000,
    currency: "AOA",
    partners: "MINAGRIF, WOAH, Laboratórios provinciais",
    createdBy: "usr-0001",
    createdAt: "2024-02-10T10:30:00.000Z",
  },
  {
    id: "prj-0003",
    lineId: "lin-0002",
    title: "Melhoramento genético do bovino Africander em Angola",
    objectives:
      "Avaliar parâmetros produtivos e reprodutivos do bovino Africander e implementar um núcleo de selecção com recurso a inseminação artificial.",
    status: "em_curso",
    startDate: "2023-09-01",
    endDate: "2026-08-31",
    fundingSource: "Cooperação Angola–Portugal (IPAD)",
    fundingAmount: 68000000,
    currency: "AOA",
    partners: "Estação Zootécnica da Humpata, ISCED-Huíla",
    createdBy: "usr-0003",
    createdAt: "2023-07-18T08:45:00.000Z",
  },
  {
    id: "prj-0004",
    lineId: "lin-0004",
    title: "Caracterização molecular de estirpes do vírus da Doença de Newcastle",
    objectives:
      "Isolar e genotipar estirpes do vírus da Doença de Newcastle circulantes em aviários de pequena escala para apoiar a selecção de vacinas adequadas.",
    status: "concluido",
    startDate: "2022-03-01",
    endDate: "2023-10-31",
    fundingSource: "Orçamento Geral do Estado",
    fundingAmount: 22000000,
    currency: "AOA",
    partners: "IIV, Universidade Agostinho Neto",
    createdBy: "usr-0004",
    createdAt: "2022-01-25T11:15:00.000Z",
  },
  {
    id: "prj-0005",
    lineId: "lin-0003",
    title: "Monitorização da resistência antimicrobiana em aves de capoeira",
    objectives:
      "Caracterizar perfis de resistência de Escherichia coli e Salmonella spp. isoladas de aves de capoeira e avicultura industrial na região de Luanda-Bengo.",
    status: "proposto",
    startDate: null,
    endDate: null,
    fundingSource: "Fundo Nacional de Ciência e Inovação",
    fundingAmount: 18000000,
    currency: "AOA",
    partners: "IIV, INIP",
    createdBy: "usr-0002",
    createdAt: "2024-04-05T09:20:00.000Z",
  },
  {
    id: "prj-0006",
    lineId: "lin-0005",
    title: "Cartografia de vectores da Tripanossomíase animal africana",
    objectives:
      "Mapear a distribuição da mosca tsé-tsé e a prevalência de Trypanosoma spp. em bovinos nas províncias do leste, integrando dados geoespaciais.",
    status: "em_curso",
    startDate: "2023-05-01",
    endDate: "2025-04-30",
    fundingSource: "PATTEC / União Africana",
    fundingAmount: 54000000,
    currency: "AOA",
    partners: "União Africana (PATTEC), IIV, Governo Provincial do Moxico",
    createdBy: "usr-0005",
    createdAt: "2023-03-14T14:00:00.000Z",
  },
];

// --- Publicações ------------------------------------------------------------

export const publicationsFixtures: PublicationDto[] = [
  {
    id: "pub-0001",
    projectId: "prj-0004",
    type: "artigo",
    title:
      "Molecular characterization of Newcastle disease virus strains circulating in backyard poultry in Angola",
    authors: ["Mateus, A.", "Cabral, J.", "Silva, M. F.", "Domingos, P."],
    year: 2023,
    venue: "Tropical Animal Health and Production",
    doi: "10.1007/s11250-023-03612-4",
    url: "https://doi.org/10.1007/s11250-023-03612-4",
    createdBy: "usr-0004",
    createdAt: "2023-11-12T09:00:00.000Z",
  },
  {
    id: "pub-0002",
    projectId: "prj-0001",
    type: "artigo",
    title:
      "Seroprevalence and risk factors of African Swine Fever in smallholder pig farms of northern Angola",
    authors: ["Domingos, P.", "Mateus, A.", "Neto, F. C."],
    year: 2024,
    venue: "Preventive Veterinary Medicine",
    doi: "10.1016/j.prevetmed.2024.106145",
    url: "https://doi.org/10.1016/j.prevetmed.2024.106145",
    createdBy: "usr-0002",
    createdAt: "2024-05-20T10:30:00.000Z",
  },
  {
    id: "pub-0003",
    projectId: "prj-0006",
    type: "comunicacao",
    title:
      "Spatial distribution of tsetse flies and animal trypanosomiasis prevalence in eastern Angola",
    authors: ["Kwenda, S.", "Silva, M. F.", "António, L."],
    year: 2024,
    venue: "12th Conference of the African Union PATTEC, Nairobi",
    doi: null,
    url: null,
    createdBy: "usr-0005",
    createdAt: "2024-09-03T08:45:00.000Z",
  },
  {
    id: "pub-0004",
    projectId: "prj-0003",
    type: "artigo",
    title:
      "Reproductive performance of Africander cattle under semi-arid conditions in southern Angola",
    authors: ["Cabral, J.", "Neto, F. C.", "Chivukuvuku, D."],
    year: 2024,
    venue: "Livestock Science",
    doi: "10.1016/j.livsci.2024.105498",
    url: "https://doi.org/10.1016/j.livsci.2024.105498",
    createdBy: "usr-0003",
    createdAt: "2024-07-08T11:15:00.000Z",
  },
  {
    id: "pub-0005",
    projectId: "prj-0005",
    type: "comunicacao",
    title:
      "Antimicrobial resistance profiles of Escherichia coli from poultry in the Luanda-Bengo region: preliminary findings",
    authors: ["Domingos, P.", "Mateus, A."],
    year: 2024,
    venue: "III Jornadas Científicas do IIV, Luanda",
    doi: null,
    url: null,
    createdBy: "usr-0002",
    createdAt: "2024-11-15T14:00:00.000Z",
  },
  {
    id: "pub-0006",
    projectId: "prj-0002",
    type: "relatorio",
    title:
      "Relatório técnico: proposta de zonas de vigilância para o controlo da febre aftosa em Angola",
    authors: ["Comissão Técnica de Febre Aftosa", "IIV"],
    year: 2024,
    venue: "Instituto de Investigação Veterinária (relatório interno)",
    doi: null,
    url: null,
    createdBy: "usr-0001",
    createdAt: "2024-08-28T09:20:00.000Z",
  },
  {
    id: "pub-0007",
    projectId: null,
    type: "artigo",
    title:
      "One Health surveillance of zoonotic pathogens at the wildlife-livestock interface in Angola: a scoping review",
    authors: ["Silva, M. F.", "Mateus, A.", "Kwenda, S.", "Domingos, P."],
    year: 2023,
    venue: "One Health",
    doi: "10.1016/j.onehlt.2023.100587",
    url: "https://doi.org/10.1016/j.onehlt.2023.100587",
    createdBy: "usr-0002",
    createdAt: "2023-09-30T13:40:00.000Z",
  },
  {
    id: "pub-0008",
    projectId: "prj-0004",
    type: "tese",
    title:
      "Epidemiologia molecular da Doença de Newcastle em sistemas avícolas familiares (Dissertação de Mestrado)",
    authors: ["Cabral, J."],
    year: 2023,
    venue: "Universidade Agostinho Neto — Faculdade de Medicina Veterinária",
    doi: null,
    url: null,
    createdBy: "usr-0004",
    createdAt: "2023-12-05T08:30:00.000Z",
  },
];
