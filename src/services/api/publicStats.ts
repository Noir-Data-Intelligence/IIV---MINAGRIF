import { apiGet } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { PublicStatsDto } from "@/types/dto/publicStats";

/**
 * Serviço de dados do resumo público de estatísticas (`LiveStats.tsx`).
 *
 * Segue o mesmo padrão de `services/api/noticias.ts`. Um único endpoint
 * agregado, consumido via polling (ver `hooks/queries/usePublicStats.ts`) em
 * vez das 4 queries brutas + Realtime que a versão Supabase fazia.
 */
export function getPublicStats(): Promise<PublicStatsDto> {
  return apiGet<PublicStatsDto>(endpoints.publicStats.summary);
}
