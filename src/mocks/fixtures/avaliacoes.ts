import type {
  CriteriaDto,
  CycleDto,
  EvaluationDto,
  HistoryDto,
  ScoreDto,
} from "@/types/dto/avaliacoes";

/**
 * Dados fictícios mas plausíveis do módulo Avaliações de Desempenho do IIV
 * (Instituto de Investigação Veterinária de Angola). Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * Cobre ciclos de avaliação anuais (2024/2025/2026 — este último "aberto"),
 * critérios típicos (qualidade técnica, assiduidade, trabalho em equipa,
 * iniciativa), e avaliações de colaboradores REAIS do módulo RH já migrado
 * (`fixtures/recursosHumanos.ts`, ids emp-0001..emp-0010). Os avaliadores /
 * aprovadores referem utilizadores de `fixtures/users.ts` (usr-0001..usr-0012).
 *
 * Estados variados nas avaliações para alimentar o workflow e os KPIs: uma
 * submetida (pendente de aprovação), uma aprovada, uma em rascunho, uma
 * rejeitada e duas validadas de ciclos fechados. As linhas de `HistoryDto`
 * seed reproduzem transições passadas; novas transições feitas na UI acrescentam
 * automaticamente linhas de histórico nos handlers.
 *
 * NOTA: exportados como `let`/arrays MUTÁVEIS — os handlers create/update/delete
 * e as transições de workflow operam sobre estes arrays em memória, persistindo
 * durante a sessão do browser (perde-se no refresh, comportamento esperado de um
 * mock). Os campos `*Name` (resolvidos) são preenchidos pelos handlers no
 * momento da resposta, por isso ficam a `null` aqui.
 */

// --- Ciclos ----------------------------------------------------------------

export const cyclesFixtures: CycleDto[] = [
  {
    id: "cyc-2026",
    name: "Avaliação Anual 2026",
    year: 2026,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "aberto",
    description: "Ciclo de avaliação de desempenho do exercício de 2026.",
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "cyc-2025",
    name: "Avaliação Anual 2025",
    year: 2025,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "fechado",
    description: "Ciclo de avaliação de desempenho do exercício de 2025.",
    createdAt: "2025-01-06T08:00:00.000Z",
  },
  {
    id: "cyc-2024",
    name: "Avaliação Anual 2024",
    year: 2024,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "fechado",
    description: "Ciclo de avaliação de desempenho do exercício de 2024.",
    createdAt: "2024-01-08T08:00:00.000Z",
  },
];

// --- Critérios --------------------------------------------------------------

export const criteriasFixtures: CriteriaDto[] = [
  // Ciclo 2026
  {
    id: "cri-0001",
    cycleId: "cyc-2026",
    name: "Qualidade Técnica",
    weight: 0.35,
    description: "Rigor, fiabilidade e mérito técnico-científico do trabalho realizado.",
    displayOrder: 1,
    createdAt: "2026-01-05T08:10:00.000Z",
  },
  {
    id: "cri-0002",
    cycleId: "cyc-2026",
    name: "Assiduidade e Pontualidade",
    weight: 0.15,
    description: "Cumprimento do horário e presença efectiva no posto de trabalho.",
    displayOrder: 2,
    createdAt: "2026-01-05T08:11:00.000Z",
  },
  {
    id: "cri-0003",
    cycleId: "cyc-2026",
    name: "Trabalho em Equipa",
    weight: 0.25,
    description: "Cooperação, partilha de conhecimento e espírito de entreajuda.",
    displayOrder: 3,
    createdAt: "2026-01-05T08:12:00.000Z",
  },
  {
    id: "cri-0004",
    cycleId: "cyc-2026",
    name: "Iniciativa e Inovação",
    weight: 0.25,
    description: "Proactividade, proposta de melhorias e autonomia na resolução de problemas.",
    displayOrder: 4,
    createdAt: "2026-01-05T08:13:00.000Z",
  },
  // Ciclo 2025
  {
    id: "cri-0005",
    cycleId: "cyc-2025",
    name: "Qualidade Técnica",
    weight: 0.4,
    description: "Rigor e mérito técnico-científico do trabalho realizado.",
    displayOrder: 1,
    createdAt: "2025-01-06T08:10:00.000Z",
  },
  {
    id: "cri-0006",
    cycleId: "cyc-2025",
    name: "Assiduidade e Pontualidade",
    weight: 0.2,
    description: "Cumprimento do horário e presença efectiva.",
    displayOrder: 2,
    createdAt: "2025-01-06T08:11:00.000Z",
  },
  {
    id: "cri-0007",
    cycleId: "cyc-2025",
    name: "Trabalho em Equipa",
    weight: 0.2,
    description: "Cooperação e partilha de conhecimento.",
    displayOrder: 3,
    createdAt: "2025-01-06T08:12:00.000Z",
  },
  {
    id: "cri-0008",
    cycleId: "cyc-2025",
    name: "Iniciativa e Inovação",
    weight: 0.2,
    description: "Proactividade e autonomia.",
    displayOrder: 4,
    createdAt: "2025-01-06T08:13:00.000Z",
  },
];

// --- Avaliações -------------------------------------------------------------

export const evaluationsFixtures: EvaluationDto[] = [
  {
    id: "ava-0001",
    cycleId: "cyc-2026",
    cycleName: null,
    employeeId: "emp-0001",
    employeeName: null,
    evaluatorId: "usr-0002",
    evaluatorName: null,
    evaluationDate: "2026-06-20",
    globalScore: 16.5,
    strengths: "Domínio técnico excepcional em virologia; coordenação eficaz da equipa de laboratório.",
    improvements: "Delegar mais tarefas administrativas para libertar tempo de investigação.",
    generalComments: "Colaborador de referência no departamento.",
    status: "submetida",
    submittedAt: "2026-06-21T09:30:00.000Z",
    approvedAt: null,
    approvedBy: null,
    approvedByName: null,
    rejectionReason: null,
    acknowledgedAt: null,
    createdAt: "2026-06-20T08:00:00.000Z",
  },
  {
    id: "ava-0002",
    cycleId: "cyc-2026",
    cycleName: null,
    employeeId: "emp-0002",
    employeeName: null,
    evaluatorId: "usr-0002",
    evaluatorName: null,
    evaluationDate: "2026-06-18",
    globalScore: 17.2,
    strengths: "Excelente rigor metodológico; contributo decisivo no estudo de resistência antimicrobiana.",
    improvements: "Reforçar a documentação dos protocolos para transferência de conhecimento.",
    generalComments: "Desempenho consistentemente acima do esperado.",
    status: "aprovada",
    submittedAt: "2026-06-19T10:00:00.000Z",
    approvedAt: "2026-06-24T14:15:00.000Z",
    approvedBy: "usr-0005",
    approvedByName: null,
    rejectionReason: null,
    acknowledgedAt: null,
    createdAt: "2026-06-18T08:00:00.000Z",
  },
  {
    id: "ava-0003",
    cycleId: "cyc-2026",
    cycleName: null,
    employeeId: "emp-0003",
    employeeName: null,
    evaluatorId: "usr-0009",
    evaluatorName: null,
    evaluationDate: null,
    globalScore: null,
    strengths: null,
    improvements: null,
    generalComments: null,
    status: "rascunho",
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    approvedByName: null,
    rejectionReason: null,
    acknowledgedAt: null,
    createdAt: "2026-06-28T08:00:00.000Z",
  },
  {
    id: "ava-0004",
    cycleId: "cyc-2026",
    cycleName: null,
    employeeId: "emp-0005",
    employeeName: null,
    evaluatorId: "usr-0009",
    evaluatorName: null,
    evaluationDate: "2026-06-15",
    globalScore: 11.0,
    strengths: "Boa relação com criadores no trabalho de campo.",
    improvements: "Necessário melhorar o registo atempado dos dados de inseminação.",
    generalComments: "Avaliação devolvida para revisão da fundamentação.",
    status: "rejeitada",
    submittedAt: "2026-06-16T09:00:00.000Z",
    approvedAt: null,
    approvedBy: null,
    approvedByName: null,
    rejectionReason:
      "Pontuação global não fundamentada nos comentários. Rever a justificação por critério antes de resubmeter.",
    acknowledgedAt: null,
    createdAt: "2026-06-15T08:00:00.000Z",
  },
  {
    id: "ava-0005",
    cycleId: "cyc-2025",
    cycleName: null,
    employeeId: "emp-0001",
    employeeName: null,
    evaluatorId: "usr-0002",
    evaluatorName: null,
    evaluationDate: "2025-11-28",
    globalScore: 15.8,
    strengths: "Liderança técnica e mentoria de novos técnicos.",
    improvements: "Publicar resultados da investigação com maior regularidade.",
    generalComments: "Ciclo concluído com resultado positivo.",
    status: "validada",
    submittedAt: "2025-11-29T09:00:00.000Z",
    approvedAt: "2025-12-05T11:00:00.000Z",
    approvedBy: "usr-0005",
    approvedByName: null,
    rejectionReason: null,
    acknowledgedAt: "2025-12-10T08:30:00.000Z",
    createdAt: "2025-11-28T08:00:00.000Z",
  },
  {
    id: "ava-0006",
    cycleId: "cyc-2025",
    cycleName: null,
    employeeId: "emp-0004",
    employeeName: null,
    evaluatorId: "usr-0009",
    evaluatorName: null,
    evaluationDate: "2025-11-30",
    globalScore: 14.5,
    strengths: "Dedicação e fiabilidade na análise bromatológica.",
    improvements: "Desenvolver competências em análise estatística de dados.",
    generalComments: "Bom desempenho global.",
    status: "validada",
    submittedAt: "2025-12-01T09:00:00.000Z",
    approvedAt: "2025-12-06T11:00:00.000Z",
    approvedBy: "usr-0005",
    approvedByName: null,
    rejectionReason: null,
    acknowledgedAt: "2025-12-11T08:30:00.000Z",
    createdAt: "2025-11-30T08:00:00.000Z",
  },
];

// --- Pontuações por critério ------------------------------------------------

export const scoresFixtures: ScoreDto[] = [
  // ava-0001 (ciclo 2026)
  { id: "sco-0001", evaluationId: "ava-0001", criteriaId: "cri-0001", score: 17, comment: "Trabalho técnico sólido." },
  { id: "sco-0002", evaluationId: "ava-0001", criteriaId: "cri-0002", score: 18, comment: null },
  { id: "sco-0003", evaluationId: "ava-0001", criteriaId: "cri-0003", score: 16, comment: "Boa articulação com a equipa." },
  { id: "sco-0004", evaluationId: "ava-0001", criteriaId: "cri-0004", score: 15, comment: null },
  // ava-0002 (ciclo 2026)
  { id: "sco-0005", evaluationId: "ava-0002", criteriaId: "cri-0001", score: 18, comment: "Rigor exemplar." },
  { id: "sco-0006", evaluationId: "ava-0002", criteriaId: "cri-0002", score: 17, comment: null },
  { id: "sco-0007", evaluationId: "ava-0002", criteriaId: "cri-0003", score: 18, comment: null },
  { id: "sco-0008", evaluationId: "ava-0002", criteriaId: "cri-0004", score: 16, comment: "Propôs melhorias de protocolo." },
  // ava-0005 (ciclo 2025)
  { id: "sco-0009", evaluationId: "ava-0005", criteriaId: "cri-0005", score: 16, comment: null },
  { id: "sco-0010", evaluationId: "ava-0005", criteriaId: "cri-0006", score: 17, comment: null },
  { id: "sco-0011", evaluationId: "ava-0005", criteriaId: "cri-0007", score: 15, comment: null },
  { id: "sco-0012", evaluationId: "ava-0005", criteriaId: "cri-0008", score: 15, comment: null },
];

// --- Histórico de transições ------------------------------------------------

export const historyFixtures: HistoryDto[] = [
  // ava-0002: criada -> submetida -> aprovada
  {
    id: "his-0001",
    evaluationId: "ava-0002",
    actorId: "usr-0002",
    actorName: null,
    action: "criou",
    fromStatus: null,
    toStatus: "rascunho",
    comment: null,
    changes: null,
    createdAt: "2026-06-18T08:00:00.000Z",
  },
  {
    id: "his-0002",
    evaluationId: "ava-0002",
    actorId: "usr-0002",
    actorName: null,
    action: "submeteu",
    fromStatus: "rascunho",
    toStatus: "submetida",
    comment: null,
    changes: null,
    createdAt: "2026-06-19T10:00:00.000Z",
  },
  {
    id: "his-0003",
    evaluationId: "ava-0002",
    actorId: "usr-0005",
    actorName: null,
    action: "aprovou",
    fromStatus: "submetida",
    toStatus: "aprovada",
    comment: "Aprovada pela Direcção.",
    changes: null,
    createdAt: "2026-06-24T14:15:00.000Z",
  },
  // ava-0001: criada -> submetida
  {
    id: "his-0004",
    evaluationId: "ava-0001",
    actorId: "usr-0002",
    actorName: null,
    action: "submeteu",
    fromStatus: "rascunho",
    toStatus: "submetida",
    comment: null,
    changes: null,
    createdAt: "2026-06-21T09:30:00.000Z",
  },
  // ava-0004: submetida -> rejeitada
  {
    id: "his-0005",
    evaluationId: "ava-0004",
    actorId: "usr-0005",
    actorName: null,
    action: "rejeitou",
    fromStatus: "submetida",
    toStatus: "rejeitada",
    comment: "Pontuação global não fundamentada nos comentários.",
    changes: null,
    createdAt: "2026-06-17T10:30:00.000Z",
  },
  // ava-0005: submetida -> aprovada -> validada
  {
    id: "his-0006",
    evaluationId: "ava-0005",
    actorId: "usr-0002",
    actorName: null,
    action: "submeteu",
    fromStatus: "rascunho",
    toStatus: "submetida",
    comment: null,
    changes: null,
    createdAt: "2025-11-29T09:00:00.000Z",
  },
  {
    id: "his-0007",
    evaluationId: "ava-0005",
    actorId: "usr-0005",
    actorName: null,
    action: "aprovou",
    fromStatus: "submetida",
    toStatus: "aprovada",
    comment: null,
    changes: null,
    createdAt: "2025-12-05T11:00:00.000Z",
  },
  {
    id: "his-0008",
    evaluationId: "ava-0005",
    actorId: "usr-0001",
    actorName: null,
    action: "validou",
    fromStatus: "aprovada",
    toStatus: "validada",
    comment: "Reconhecida pelo colaborador.",
    changes: null,
    createdAt: "2025-12-10T08:30:00.000Z",
  },
];
