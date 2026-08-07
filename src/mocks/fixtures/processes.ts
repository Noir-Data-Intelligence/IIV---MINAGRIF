import type { ProcessDto, ProcessEventDto, ProcessStepDto } from "@/types/dto/process";

/**
 * Dados fictícios mas realistas de instâncias do workflow de processos do
 * IIV/MINAGRIF, e das suas sub-entidades (etapas instanciadas e eventos).
 * Servem os handlers MSW enquanto o backend Laravel não existe.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers de escrita
 * (create/update/delete) operam sobre estes arrays em memória, persistindo
 * durante a sessão do browser (reset no refresh).
 *
 * O `requesterId` usa o UUID do utilizador autenticado quando disponível; nos
 * dados-semente usa-se um placeholder plausível.
 */
const SEED_USER = "00000000-0000-0000-0000-000000000001";

export let processesFixtures: ProcessDto[] = [
  {
    id: "proc-0001",
    code: "PRC-2026-0001",
    typeId: "ptype-0001",
    title: "Parecer sobre importação de bovinos da Namíbia",
    description:
      "Pedido de parecer técnico relativo às condições sanitárias para importação de 120 bovinos reprodutores.",
    requesterId: SEED_USER,
    status: "em_curso",
    priority: "alta",
    dueDate: "2026-07-20",
    openedAt: "2026-07-01T08:30:00.000Z",
    closedAt: null,
    currentStepId: "prstep-0002",
    linkedEntityType: null,
    linkedEntityId: null,
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "proc-0002",
    code: "PRC-2026-0002",
    typeId: "ptype-0002",
    title: "Licenciamento sanitário — Aviário Kilamba",
    description: "Licenciamento sanitário de novo estabelecimento avícola no Kilamba, com capacidade para 30.000 aves.",
    requesterId: SEED_USER,
    status: "em_curso",
    priority: "normal",
    dueDate: "2026-08-05",
    openedAt: "2026-06-25T10:00:00.000Z",
    closedAt: null,
    currentStepId: null,
    linkedEntityType: null,
    linkedEntityId: null,
    createdAt: "2026-06-25T10:00:00.000Z",
  },
  {
    id: "proc-0003",
    code: "PRC-2026-0003",
    typeId: "ptype-0003",
    title: "NC — Desvio de temperatura na câmara frigorífica",
    description: "Não conformidade detectada em auditoria: registo de temperatura fora do intervalo definido na câmara 2.",
    requesterId: SEED_USER,
    status: "aberto",
    priority: "urgente",
    dueDate: "2026-06-30",
    openedAt: "2026-06-20T14:15:00.000Z",
    closedAt: null,
    currentStepId: null,
    linkedEntityType: "audit",
    linkedEntityId: "aud-0001",
    createdAt: "2026-06-20T14:15:00.000Z",
  },
  {
    id: "proc-0004",
    code: "PRC-2026-0004",
    typeId: "ptype-0004",
    title: "Aprovação do lote VAC-2026-014 (vacina anti-rábica)",
    description: "Controlo de qualidade e libertação do lote 014 de vacina anti-rábica produzido em Junho.",
    requesterId: SEED_USER,
    status: "concluido",
    priority: "normal",
    dueDate: "2026-06-15",
    openedAt: "2026-06-05T09:00:00.000Z",
    closedAt: "2026-06-14T16:30:00.000Z",
    currentStepId: null,
    linkedEntityType: "lote",
    linkedEntityId: "lot-0014",
    createdAt: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "proc-0005",
    code: "PRC-2026-0005",
    typeId: "ptype-0005",
    title: "Requisição de reagentes para o laboratório de Virologia",
    description: "Pedido de reagentes ELISA e consumíveis para a campanha de vigilância da peste suína africana.",
    requesterId: SEED_USER,
    status: "aberto",
    priority: "baixa",
    dueDate: null,
    openedAt: "2026-07-04T11:20:00.000Z",
    closedAt: null,
    currentStepId: null,
    linkedEntityType: null,
    linkedEntityId: null,
    createdAt: "2026-07-04T11:20:00.000Z",
  },
  {
    id: "proc-0006",
    code: "PRC-2026-0006",
    typeId: "ptype-0001",
    title: "Parecer sobre surto de Newcastle no Bengo",
    description: "Avaliação técnica das medidas de contenção adoptadas face ao surto de doença de Newcastle na província do Bengo.",
    requesterId: SEED_USER,
    status: "cancelado",
    priority: "alta",
    dueDate: "2026-05-30",
    openedAt: "2026-05-10T08:00:00.000Z",
    closedAt: "2026-05-18T10:00:00.000Z",
    currentStepId: null,
    linkedEntityType: null,
    linkedEntityId: null,
    createdAt: "2026-05-10T08:00:00.000Z",
  },
];

/**
 * Etapas instanciadas (apenas para o proc-0001, a título ilustrativo — os
 * restantes processos-semente não têm etapas explícitas). Os processos criados
 * em runtime recebem as suas etapas geradas pelo handler de criação.
 */
export let processStepsFixtures: ProcessStepDto[] = [
  {
    id: "prstep-0001",
    processId: "proc-0001",
    typeStepId: "pstep-0001",
    orderIndex: 1,
    name: "Recepção e triagem",
    assigneeRole: "recepcionista",
    status: "concluida",
    startedAt: "2026-07-01T08:30:00.000Z",
    dueAt: "2026-07-03T08:30:00.000Z",
    completedAt: "2026-07-02T15:00:00.000Z",
    notes: "Documentação completa; encaminhado para análise técnica.",
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "prstep-0002",
    processId: "proc-0001",
    typeStepId: "pstep-0002",
    orderIndex: 2,
    name: "Análise técnica",
    assigneeRole: "tecnico",
    status: "em_curso",
    startedAt: "2026-07-02T15:00:00.000Z",
    dueAt: "2026-07-09T15:00:00.000Z",
    completedAt: null,
    notes: null,
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "prstep-0003",
    processId: "proc-0001",
    typeStepId: "pstep-0003",
    orderIndex: 3,
    name: "Revisão e validação",
    assigneeRole: "diretor",
    status: "pendente",
    startedAt: null,
    dueAt: null,
    completedAt: null,
    notes: null,
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "prstep-0004",
    processId: "proc-0001",
    typeStepId: "pstep-0004",
    orderIndex: 4,
    name: "Emissão do parecer",
    assigneeRole: "director-laboratorio",
    status: "pendente",
    startedAt: null,
    dueAt: null,
    completedAt: null,
    notes: null,
    createdAt: "2026-07-01T08:30:00.000Z",
  },
];

export let processEventsFixtures: ProcessEventDto[] = [
  {
    id: "prev-0001",
    processId: "proc-0001",
    actorId: SEED_USER,
    eventType: "aberto",
    payload: { title: "Parecer sobre importação de bovinos da Namíbia" },
    createdAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "prev-0002",
    processId: "proc-0001",
    actorId: SEED_USER,
    eventType: "etapa_concluida",
    payload: { step: "Recepção e triagem" },
    createdAt: "2026-07-02T15:00:00.000Z",
  },
];

export function setProcessesFixtures(next: ProcessDto[]) {
  processesFixtures = next;
}
export function setProcessStepsFixtures(next: ProcessStepDto[]) {
  processStepsFixtures = next;
}
export function setProcessEventsFixtures(next: ProcessEventDto[]) {
  processEventsFixtures = next;
}
