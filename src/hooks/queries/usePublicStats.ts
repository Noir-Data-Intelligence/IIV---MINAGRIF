import { useQuery } from "@tanstack/react-query";
import { getPublicStats } from "@/services/api/publicStats";

/**
 * Hook react-query do resumo público de estatísticas (`LiveStats.tsx`).
 *
 * Substitui a subscrição Supabase Realtime por polling: `refetchInterval` de
 * 15s mantém os números "ao vivo" sem WebSocket, decisão de arquitectura já
 * tomada no plano de modernização (ver PLANO-ATUALIZACAO-FRONTEND.txt).
 */

export const publicStatsKeys = {
  all: ["publicStats"] as const,
};

export function usePublicStats() {
  return useQuery({
    queryKey: publicStatsKeys.all,
    queryFn: () => getPublicStats(),
    refetchInterval: 15000,
  });
}
