import { useQuery } from "@tanstack/react-query";
import { getObservatorioMapa } from "@/services/api/observatorio";

export const observatorioKeys = {
  all: ["observatorio"] as const,
  mapa: () => [...observatorioKeys.all, "mapa"] as const,
};

export function useObservatorioMapa() {
  return useQuery({
    queryKey: observatorioKeys.mapa(),
    queryFn: () => getObservatorioMapa(),
  });
}
