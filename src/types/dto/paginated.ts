/**
 * Envelope de paginação genérico, espelhando a forma de resposta paginada do
 * Laravel (via API Resources em camelCase). Todos os endpoints de listagem
 * devolvem `Paginated<T>`.
 */
export interface PaginatedMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}
