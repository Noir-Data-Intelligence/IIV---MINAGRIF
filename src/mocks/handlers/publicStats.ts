import { http, HttpResponse } from "msw";
import { ANO_FUNDACAO_IIV, publicStatsFixtures } from "@/mocks/fixtures/publicStats";
import type { PublicStatsDto } from "@/types/dto/publicStats";

/**
 * Handler MSW do resumo público de estatísticas (`LiveStats.tsx`).
 *
 * Segue o mesmo padrão de `mocks/handlers/noticias.ts`. `anosExperiencia` é
 * calculado dinamicamente (ano actual - ANO_FUNDACAO_IIV) para que o valor
 * devolvido esteja sempre correcto, tal como o componente original fazia.
 */

const BASE = "*/api/public/stats";

export const publicStatsHandlers = [
  // GET /api/public/stats -> resumo agregado de estatísticas públicas
  http.get(BASE, () => {
    const body: PublicStatsDto = {
      anosExperiencia: new Date().getFullYear() - ANO_FUNDACAO_IIV,
      ...publicStatsFixtures,
    };
    return HttpResponse.json(body);
  }),
];

export default publicStatsHandlers;
