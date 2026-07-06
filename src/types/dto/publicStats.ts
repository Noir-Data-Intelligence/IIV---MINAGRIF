/**
 * DTO do resumo público de estatísticas — contrato exacto do JSON REST para o
 * endpoint agregado `public/stats`.
 *
 * Substitui as 4 queries brutas Supabase (products/production_batches/
 * stations/quality_audits) que a `LiveStats.tsx` fazia antigamente: o backend
 * (mock hoje, Laravel amanhã) passa a expor um único endpoint já agregado,
 * consumido via polling em vez de Realtime.
 */
export interface PublicStatsDto {
  anosExperiencia: number;
  produtosPortfolio: number;
  dosesProduzidas: number;
  estacoesRegionais: number;
}
