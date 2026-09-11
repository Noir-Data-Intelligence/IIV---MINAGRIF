import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addLaboratorioTecnico,
  listLaboratorioTecnicos,
  removeLaboratorioTecnico,
} from "@/services/api/laboratorioTecnicos";
import type { AddLaboratorioTecnicoPayload } from "@/types/dto/laboratorioTecnico";

/** Hooks react-query da equipa de Técnicos por laboratório (padrão de `useLaboratorios.ts`). */
export const laboratorioTecnicoKeys = {
  all: (laboratorioId: string) => ["laboratorios", laboratorioId, "tecnicos"] as const,
};

export function useLaboratorioTecnicos(laboratorioId: string | undefined) {
  return useQuery({
    queryKey: laboratorioTecnicoKeys.all(laboratorioId ?? ""),
    queryFn: () => listLaboratorioTecnicos(laboratorioId as string),
    enabled: !!laboratorioId,
  });
}

export function useAddLaboratorioTecnico(laboratorioId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddLaboratorioTecnicoPayload) => addLaboratorioTecnico(laboratorioId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratorioTecnicoKeys.all(laboratorioId) });
    },
  });
}

export function useRemoveLaboratorioTecnico(laboratorioId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeLaboratorioTecnico(laboratorioId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratorioTecnicoKeys.all(laboratorioId) });
    },
  });
}
