/**
 * DTO de Não-Conformidade — contrato exacto do JSON REST para o recurso
 * `nao-conformidades`.
 *
 * Espelha a tabela Supabase `nonconformities`, mas em camelCase tal como o backend
 * Laravel os devolverá via API Resources (`corrective_action` -> `correctiveAction`,
 * `resolved_at` -> `resolvedAt`, `audit_id` -> `auditId`, etc.). Os nomes de
 * departamento/auditoria são devolvidos já resolvidos (`departmentName`/`auditTitle`)
 * — tal como uma API Resource faria `whenLoaded('department')->name` —, evitando ao
 * cliente ter de fazer um segundo pedido só para mostrar a etiqueta.
 */
export interface NaoConformidadeDto {
  id: string;
  title: string;
  description: string;
  /** menor | maior | critica (ver SEVERITY_LEVEL em lib/domain-enums.ts). */
  severity: string;
  /** aberta | em_resolucao | resolvida | encerrada (ver NC_STATUS). */
  status: string;
  correctiveAction: string | null;
  deadline: string | null;
  resolvedAt: string | null;
  departmentId: string | null;
  auditId: string | null;
  departmentName: string | null;
  auditTitle: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de não-conformidades. */
export interface NaoConformidadeListParams {
  page?: number;
  perPage?: number;
  search?: string;
  severity?: string;
  status?: string;
  departmentId?: string;
  auditId?: string;
}
