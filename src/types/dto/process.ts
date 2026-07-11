import type { AppRole } from "@/lib/permissions";

/**
 * DTOs do módulo Processos — contrato do JSON REST para o recurso `processes`
 * (instâncias do workflow administrativo) e as suas sub-entidades `processSteps`
 * (etapas instanciadas) e `processEvents` (historial de eventos).
 *
 * Espelham as tabelas Supabase `processes`, `process_steps` e `process_events`,
 * com os campos já em camelCase tal como o backend Laravel os devolverá.
 * FK `typeId` aponta para o módulo Tipos de Processo. Os campos
 * `linkedEntityType`/`linkedEntityId` ligam o processo à entidade de origem
 * (ex: uma auditoria, um lote), preenchidos pelo `OpenProcessButton`.
 */
export type ProcessStatus = "aberto" | "em_curso" | "concluido" | "cancelado";
export type ProcessPriority = "baixa" | "normal" | "alta" | "urgente";
export type ProcessStepStatus = "pendente" | "em_curso" | "concluida" | "rejeitada" | "devolvida";

export interface ProcessDto {
  id: string;
  /** Código legível gerado no servidor (ex: "PRC-2026-0001"). */
  code: string;
  typeId: string;
  title: string;
  description: string | null;
  requesterId: string;
  status: ProcessStatus;
  priority: ProcessPriority;
  /** Prazo-limite (YYYY-MM-DD), ou null. */
  dueDate: string | null;
  openedAt: string;
  closedAt: string | null;
  /** Etapa actualmente activa (FK -> processSteps), ou null se ainda sem etapas. */
  currentStepId: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  createdAt: string;
}

/** Etapa instanciada de um processo (cópia viva de uma processTypeStep). */
export interface ProcessStepDto {
  id: string;
  processId: string;
  /** Etapa-padrão de origem (FK -> processTypeSteps), ou null se criada à mão. */
  typeStepId: string | null;
  orderIndex: number;
  name: string;
  assigneeRole: AppRole | null;
  status: ProcessStepStatus;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  /** Parecer/nota registada nesta etapa ao avançar ou devolver. */
  notes: string | null;
  createdAt: string;
}

/** Evento do historial de um processo (abertura, transição de etapa, etc). */
export interface ProcessEventDto {
  id: string;
  processId: string;
  actorId: string | null;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de processos. */
export interface ProcessListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: ProcessStatus;
  typeId?: string;
  /** Filtra pelos processos abertos por um dado utilizador ("os meus"). */
  requesterId?: string;
}

/** KPIs agregados do painel de processos. */
export interface ProcessStatsDto {
  abertos: number;
  emCurso: number;
  concluidos: number;
  atrasados: number;
}

/**
 * Payload de criação de um processo. O servidor (mock MSW / futuro Laravel)
 * é responsável por: gerar o `code`, instanciar os `processSteps` a partir das
 * etapas-padrão do tipo, activar a primeira etapa (status "em_curso") e registar
 * o evento "aberto". O cliente só envia esta intenção.
 */
export interface CreateProcessInput {
  typeId: string;
  title: string;
  description?: string | null;
  priority: ProcessPriority;
  dueDate?: string | null;
  requesterId: string;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}

/** Campos actualizáveis de uma etapa (parecer/estado, via PUT). */
export interface UpdateProcessStepInput {
  status?: ProcessStepStatus;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

/**
 * Payload das transições de workflow (avançar/devolver/cancelar). O servidor
 * (mock MSW / futuro Laravel) faz toda a lógica de estado: conclui/reactiva as
 * etapas, actualiza o `currentStepId`/`status` do processo e regista os eventos.
 * O cliente só envia a intenção (nota do actor + quem a executou).
 */
export interface ProcessTransitionInput {
  /** Parecer/justificação a guardar na etapa e no evento. */
  notes?: string | null;
  actorId?: string | null;
}

/** Payload de registo de um evento avulso no historial (ex: comentário). */
export interface CreateProcessEventInput {
  eventType: string;
  payload?: Record<string, unknown> | null;
  actorId?: string | null;
}
