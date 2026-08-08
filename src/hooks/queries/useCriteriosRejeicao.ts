import { useQuery } from "@tanstack/react-query";
import { listCriteriosRejeicao } from "@/services/api/criteriosRejeicao";

export const criterioRejeicaoKeys = {
  all: ["criterios-rejeicao"] as const,
  list: (laboratorioId?: string) => [...criterioRejeicaoKeys.all, laboratorioId ?? "geral"] as const,
};

export function useCriteriosRejeicaoList(laboratorioId?: string) {
  return useQuery({
    queryKey: criterioRejeicaoKeys.list(laboratorioId),
    queryFn: () => listCriteriosRejeicao(laboratorioId),
  });
}
