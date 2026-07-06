/**
 * DTO de Resultado Laboratorial — contrato REST do recurso `resultados`.
 *
 * Espelha a tabela Supabase `lab_results` em camelCase (analysis_id -> analysisId,
 * result_text -> resultText, concluded_at -> concludedAt). Depende de `analises`
 * via `analysisId`.
 */
export interface ResultadoDto {
  id: string;
  analysisId: string;
  resultText: string;
  concludedAt: string;
}

/** Parâmetros de listagem paginada/filtrada de resultados. */
export interface ResultadoListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
