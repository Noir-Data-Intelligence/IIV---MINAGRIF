/**
 * DTO de Laboratório — contrato exacto do JSON REST para o recurso `laboratorios`.
 *
 * Espelha a tabela Supabase `laboratories` (name/type/description/is_active/created_at),
 * mas em camelCase tal como o backend Laravel os devolverá via API Resources
 * (`is_active` -> `isActive`, `created_at` -> `createdAt`).
 */
export interface LaboratorioDto {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de laboratórios. */
export interface LaboratorioListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
