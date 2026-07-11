/**
 * DTO de Auditoria — contrato exacto do JSON REST para o recurso `auditorias`.
 *
 * Espelha a tabela Supabase `quality_audits`, mas em camelCase tal como o backend
 * Laravel os devolverá via API Resources (`audit_type` -> `auditType`,
 * `scheduled_date` -> `scheduledDate`, etc.). Os nomes de departamento/laboratório
 * são devolvidos já resolvidos (`departmentName`/`laboratoryName`) — tal como uma
 * API Resource faria `whenLoaded('department')->name` —, evitando ao cliente ter de
 * fazer um segundo pedido só para mostrar a etiqueta.
 */
export interface AuditoriaDto {
  id: string;
  title: string;
  auditType: string;
  auditor: string;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  findings: string | null;
  recommendations: string | null;
  departmentId: string | null;
  laboratoryId: string | null;
  departmentName: string | null;
  laboratoryName: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de auditorias. */
export interface AuditoriaListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
