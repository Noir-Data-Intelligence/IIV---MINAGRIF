/**
 * DTO de Departamento — contrato exacto do JSON REST para o recurso `departamentos`.
 *
 * Espelha a estrutura organizacional do instituto (tabela Supabase `departments`),
 * mantendo os nomes de campo em camelCase tal como o backend Laravel os devolverá
 * (via API Resources). A migração Supabase -> Laravel troca `parent_id`/`created_at`
 * (snake_case) por `parentId`/`createdAt` — a (de)serialização, se necessária, faz-se
 * na camada de serviço.
 */
export interface DepartamentoDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
}

/** Parâmetros de listagem paginada/filtrada de departamentos. */
export interface DepartamentoListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
