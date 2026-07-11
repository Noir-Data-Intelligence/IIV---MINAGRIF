import type {
  ExpenseDto,
  GuideDto,
  MissionDto,
  ParticipantDto,
  ReportDto,
} from "@/types/dto/missoes";

/**
 * Dados fictícios mas plausíveis das missões de serviço do IIV (Instituto de
 * Investigação Veterinária de Angola). Servem os handlers MSW enquanto o backend
 * Laravel não existe. Valores em Kwanzas Angolanos (AOA).
 *
 * Cobre tipologias realistas de deslocação de um instituto de investigação
 * veterinária: fiscalização sanitária a explorações pecuárias, colheita de
 * amostras para vigilância epidemiológica, participação em conferências
 * internacionais, cooperação com institutos congéneres e inspecção a matadouros.
 *
 * 6 missões, cada uma em estado diferente do workflow, com as suas sub-entidades
 * (guia de marcha, participantes, despesas, relatório) coerentes com o estado.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers create/update/
 * delete operam sobre estes arrays em memória, persistindo alterações durante a
 * sessão do browser (perde-se no refresh, comportamento esperado de um mock).
 *
 * `userId` refere utilizadores de `fixtures/users.ts` (usr-0001..usr-0012).
 */

// --- Missões ----------------------------------------------------------------

export let missionsFixtures: MissionDto[] = [
  {
    id: "mis-0001",
    title: "Fiscalização sanitária a explorações pecuárias no Huambo",
    destination: "Huambo",
    purpose:
      "Inspecção do estado sanitário de explorações bovinas e verificação do cumprimento das normas de biossegurança na região central.",
    startDate: "2024-03-04",
    endDate: "2024-03-09",
    status: "concluida",
    budget: 3_850_000,
    currency: "AOA",
    notes: "Missão coordenada com a Direcção Provincial dos Serviços Veterinários do Huambo.",
    createdBy: "usr-0002",
    createdAt: "2024-02-12T09:30:00.000Z",
  },
  {
    id: "mis-0002",
    title: "Colheita de amostras — vigilância de peste suína africana no Uíge",
    destination: "Uíge",
    purpose:
      "Recolha de amostras de suínos em explorações familiares para diagnóstico laboratorial de peste suína africana (PSA).",
    startDate: "2024-06-17",
    endDate: "2024-06-22",
    status: "em_curso",
    budget: 2_400_000,
    currency: "AOA",
    notes: null,
    createdBy: "usr-0002",
    createdAt: "2024-05-28T11:00:00.000Z",
  },
  {
    id: "mis-0003",
    title: "Conferência WOAH sobre saúde animal em África — Adis Abeba",
    destination: "Adis Abeba, Etiópia",
    purpose:
      "Participação na conferência regional da Organização Mundial da Saúde Animal (WOAH) e apresentação dos resultados do programa nacional de vigilância.",
    startDate: "2024-09-23",
    endDate: "2024-09-27",
    status: "aprovada",
    budget: 6_200_000,
    currency: "AOA",
    notes: "Inclui deslocação aérea internacional e alojamento por 5 noites.",
    createdBy: "usr-0005",
    createdAt: "2024-08-05T14:15:00.000Z",
  },
  {
    id: "mis-0004",
    title: "Missão de cooperação técnica com o INIAV (Portugal)",
    destination: "Lisboa, Portugal",
    purpose:
      "Estágio técnico e definição de protocolos conjuntos de diagnóstico molecular com o Instituto Nacional de Investigação Agrária e Veterinária.",
    startDate: "2024-11-11",
    endDate: "2024-11-22",
    status: "submetida",
    budget: 8_750_000,
    currency: "AOA",
    notes: null,
    createdBy: "usr-0002",
    createdAt: "2024-10-01T08:45:00.000Z",
  },
  {
    id: "mis-0005",
    title: "Inspecção a matadouro industrial em Benguela",
    destination: "Benguela",
    purpose:
      "Auditoria higio-sanitária ao matadouro industrial e verificação das condições de inspecção ante e post-mortem.",
    startDate: "2025-01-20",
    endDate: "2025-01-23",
    status: "planeada",
    budget: 1_950_000,
    currency: "AOA",
    notes: null,
    createdBy: "usr-0009",
    createdAt: "2024-12-18T10:20:00.000Z",
  },
  {
    id: "mis-0006",
    title: "Colheita de amostras de aves em Cabinda — doença de Newcastle",
    destination: "Cabinda",
    purpose:
      "Recolha de amostras em explorações avícolas para monitorização da circulação do vírus da doença de Newcastle.",
    startDate: "2024-04-15",
    endDate: "2024-04-19",
    status: "concluida",
    budget: 2_780_000,
    currency: "AOA",
    notes: "Amostras encaminhadas para o laboratório de Virologia.",
    createdBy: "usr-0002",
    createdAt: "2024-03-20T13:00:00.000Z",
  },
];

// --- Guias de marcha (0..1 por missão) --------------------------------------

export let guidesFixtures: GuideDto[] = [
  {
    id: "gui-0001",
    missionId: "mis-0001",
    guideNumber: "GM-2024-0031",
    issueDate: "2024-03-01",
    perDiem: 45_000,
    transport: "Viatura de serviço IIV-1042 (Toyota Land Cruiser)",
    notes: "Abastecimento a cargo do instituto. Regresso previsto a 09/03.",
    createdAt: "2024-03-01T09:00:00.000Z",
  },
  {
    id: "gui-0002",
    missionId: "mis-0002",
    guideNumber: "GM-2024-0074",
    issueDate: "2024-06-14",
    perDiem: 40_000,
    transport: "Viatura de serviço IIV-1108",
    notes: null,
    createdAt: "2024-06-14T10:30:00.000Z",
  },
  {
    id: "gui-0003",
    missionId: "mis-0003",
    guideNumber: "GM-2024-0121",
    issueDate: "2024-09-18",
    perDiem: 120_000,
    transport: "Voo TAAG DTA-078 (Luanda–Adis Abeba)",
    notes: "Missão internacional. Per diem em conformidade com a tabela de ajudas de custo no estrangeiro.",
    createdAt: "2024-09-18T08:00:00.000Z",
  },
  {
    id: "gui-0006",
    missionId: "mis-0006",
    guideNumber: "GM-2024-0048",
    issueDate: "2024-04-12",
    perDiem: 42_000,
    transport: "Viatura de serviço IIV-1042",
    notes: null,
    createdAt: "2024-04-12T09:15:00.000Z",
  },
];

// --- Participantes (N por missão) -------------------------------------------

export let participantsFixtures: ParticipantDto[] = [
  // mis-0001
  { id: "par-0001", missionId: "mis-0001", userId: "usr-0002", fullName: null, role: "Chefe de missão", perDiem: 45_000, createdAt: "2024-02-15T09:00:00.000Z" },
  { id: "par-0002", missionId: "mis-0001", userId: "usr-0003", fullName: null, role: "Técnico", perDiem: 40_000, createdAt: "2024-02-15T09:05:00.000Z" },
  { id: "par-0003", missionId: "mis-0001", userId: "usr-0006", fullName: null, role: "Apoio", perDiem: 35_000, createdAt: "2024-02-15T09:10:00.000Z" },
  // mis-0002
  { id: "par-0004", missionId: "mis-0002", userId: "usr-0003", fullName: null, role: "Chefe de missão", perDiem: 40_000, createdAt: "2024-05-30T09:00:00.000Z" },
  { id: "par-0005", missionId: "mis-0002", userId: "usr-0011", fullName: null, role: "Técnico", perDiem: 38_000, createdAt: "2024-05-30T09:05:00.000Z" },
  // mis-0003
  { id: "par-0006", missionId: "mis-0003", userId: "usr-0005", fullName: null, role: "Chefe de delegação", perDiem: 120_000, createdAt: "2024-08-10T09:00:00.000Z" },
  { id: "par-0007", missionId: "mis-0003", userId: "usr-0002", fullName: null, role: "Investigador", perDiem: 110_000, createdAt: "2024-08-10T09:05:00.000Z" },
  // mis-0004
  { id: "par-0008", missionId: "mis-0004", userId: "usr-0002", fullName: null, role: "Chefe de missão", perDiem: 130_000, createdAt: "2024-10-02T09:00:00.000Z" },
  { id: "par-0009", missionId: "mis-0004", userId: "usr-0004", fullName: null, role: "Técnico de laboratório", perDiem: 120_000, createdAt: "2024-10-02T09:05:00.000Z" },
  // mis-0005
  { id: "par-0010", missionId: "mis-0005", userId: "usr-0009", fullName: null, role: "Chefe de missão", perDiem: 42_000, createdAt: "2024-12-19T09:00:00.000Z" },
  // mis-0006
  { id: "par-0011", missionId: "mis-0006", userId: "usr-0003", fullName: null, role: "Chefe de missão", perDiem: 42_000, createdAt: "2024-03-22T09:00:00.000Z" },
  { id: "par-0012", missionId: "mis-0006", userId: "usr-0007", fullName: null, role: "Apoio", perDiem: 36_000, createdAt: "2024-03-22T09:05:00.000Z" },
];

// --- Despesas (prestação de contas) -----------------------------------------

export let expensesFixtures: ExpenseDto[] = [
  // mis-0001 (concluída — várias despesas)
  { id: "exp-0001", missionId: "mis-0001", category: "transporte", description: "Combustível e portagens", amount: 320_000, currency: "AOA", expenseDate: "2024-03-04", receiptUrl: null, createdAt: "2024-03-04T18:00:00.000Z" },
  { id: "exp-0002", missionId: "mis-0001", category: "alojamento", description: "Hotel (5 noites, 3 quartos)", amount: 1_050_000, currency: "AOA", expenseDate: "2024-03-05", receiptUrl: null, createdAt: "2024-03-05T18:00:00.000Z" },
  { id: "exp-0003", missionId: "mis-0001", category: "alimentacao", description: "Refeições da equipa", amount: 480_000, currency: "AOA", expenseDate: "2024-03-06", receiptUrl: null, createdAt: "2024-03-06T18:00:00.000Z" },
  { id: "exp-0004", missionId: "mis-0001", category: "outro", description: "Material de colheita e consumíveis", amount: 165_000, currency: "AOA", expenseDate: "2024-03-07", receiptUrl: null, createdAt: "2024-03-07T18:00:00.000Z" },
  // mis-0002 (em curso — despesas parciais)
  { id: "exp-0005", missionId: "mis-0002", category: "combustivel", description: "Abastecimento viatura", amount: 210_000, currency: "AOA", expenseDate: "2024-06-17", receiptUrl: null, createdAt: "2024-06-17T18:00:00.000Z" },
  { id: "exp-0006", missionId: "mis-0002", category: "alojamento", description: "Pensão (2 noites)", amount: 260_000, currency: "AOA", expenseDate: "2024-06-18", receiptUrl: null, createdAt: "2024-06-18T18:00:00.000Z" },
  // mis-0006 (concluída)
  { id: "exp-0007", missionId: "mis-0006", category: "transporte", description: "Combustível", amount: 280_000, currency: "AOA", expenseDate: "2024-04-15", receiptUrl: null, createdAt: "2024-04-15T18:00:00.000Z" },
  { id: "exp-0008", missionId: "mis-0006", category: "alojamento", description: "Hotel (4 noites, 2 quartos)", amount: 640_000, currency: "AOA", expenseDate: "2024-04-16", receiptUrl: null, createdAt: "2024-04-16T18:00:00.000Z" },
  { id: "exp-0009", missionId: "mis-0006", category: "alimentacao", description: "Refeições", amount: 300_000, currency: "AOA", expenseDate: "2024-04-17", receiptUrl: null, createdAt: "2024-04-17T18:00:00.000Z" },
];

// --- Relatórios finais (0..1 por missão) ------------------------------------

export let reportsFixtures: ReportDto[] = [
  {
    id: "rep-0001",
    missionId: "mis-0001",
    reportDate: "2024-03-12",
    summary:
      "Foram inspeccionadas 14 explorações bovinas. Detectados 3 casos de incumprimento das normas de biossegurança, com recomendações emitidas no local.",
    outcomes:
      "Emitidas 3 notificações de correcção e agendada reinspecção. Recolhidas 22 amostras para despiste de brucelose.",
    status: "aprovado",
    submittedBy: "usr-0002",
    approvedBy: "usr-0005",
    approvedAt: "2024-03-18T10:00:00.000Z",
    createdAt: "2024-03-12T16:00:00.000Z",
  },
  {
    id: "rep-0006",
    missionId: "mis-0006",
    reportDate: "2024-04-22",
    summary:
      "Recolhidas amostras em 9 explorações avícolas do município de Cabinda para monitorização da doença de Newcastle.",
    outcomes: "48 amostras encaminhadas para o laboratório de Virologia. Aguardam resultados serológicos.",
    status: "submetido",
    submittedBy: "usr-0003",
    approvedBy: null,
    approvedAt: null,
    createdAt: "2024-04-22T15:30:00.000Z",
  },
];

// --- Setters (usados pelos handlers de escrita) -----------------------------

export function setMissionsFixtures(next: MissionDto[]) {
  missionsFixtures = next;
}
export function setGuidesFixtures(next: GuideDto[]) {
  guidesFixtures = next;
}
export function setParticipantsFixtures(next: ParticipantDto[]) {
  participantsFixtures = next;
}
export function setExpensesFixtures(next: ExpenseDto[]) {
  expensesFixtures = next;
}
export function setReportsFixtures(next: ReportDto[]) {
  reportsFixtures = next;
}
