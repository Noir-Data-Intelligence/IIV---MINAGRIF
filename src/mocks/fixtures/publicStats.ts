import type { PublicStatsDto } from "@/types/dto/publicStats";

/**
 * Valores fixos mas realistas para o resumo público de estatísticas
 * (`LiveStats.tsx`), enquanto o backend Laravel não existe.
 *
 * `anosExperiencia` não é fixado aqui: é calculado dinamicamente pelo handler
 * (`mocks/handlers/publicStats.ts`) a partir do ano actual menos 1965, tal
 * como o componente já fazia antes da migração — assim mantém-se sempre
 * correcto independentemente da data em que a app corre.
 */
export const ANO_FUNDACAO_IIV = 1965;

export const publicStatsFixtures: Omit<PublicStatsDto, "anosExperiencia"> = {
  produtosPortfolio: 4,
  dosesProduzidas: 27000,
  estacoesRegionais: 4,
};

export default publicStatsFixtures;
