import type { AppRole } from "@/lib/permissions";

/**
 * DTOs do módulo Tipos de Processo — contrato do JSON REST para o recurso
 * `processTypes` (tipos de processo do workflow administrativo) e a sua
 * sub-entidade `processTypeSteps` (etapas-padrão de cada tipo).
 *
 * Espelham as tabelas Supabase `process_types` e `process_type_steps`, com os
 * campos já em camelCase tal como o backend Laravel os devolverá. As etapas são
 * um sub-recurso aninhado sob `/processos-tipos/{id}/etapas`, seguindo o mesmo
 * padrão de `/animais/{id}/eventos`.
 */
export interface ProcessTypeDto {
  id: string;
  name: string;
  description: string | null;
  /** Nome do ícone lucide associado ao tipo (ex: "FileCheck"), ou null. */
  icon: string | null;
  /** SLA global do tipo, em dias. */
  slaDays: number | null;
  isActive: boolean;
  createdAt: string;
}

/** Etapa-padrão de um tipo de processo (define o workflow que será instanciado). */
export interface ProcessTypeStepDto {
  id: string;
  processTypeId: string;
  orderIndex: number;
  name: string;
  /** Papel responsável por omissão desta etapa (herdado para os process_steps). */
  defaultRole: AppRole | null;
  slaDays: number | null;
}

/** Parâmetros de listagem paginada/filtrada de tipos de processo. */
export interface ProcessTypeListParams {
  page?: number;
  perPage?: number;
  search?: string;
  /** Quando verdadeiro, devolve apenas os tipos activos (para Selects de criação). */
  activeOnly?: boolean;
}
