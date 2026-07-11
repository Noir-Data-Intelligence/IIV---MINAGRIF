import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCentro,
  createDose,
  createRegisto,
  createReprodutor,
  createTanque,
  deleteCentro,
  deleteDose,
  deleteRegisto,
  deleteReprodutor,
  deleteTanque,
  listCentros,
  listDoses,
  listRegistos,
  listReprodutores,
  listTanques,
  updateCentro,
  updateDose,
  updateRegisto,
  updateReprodutor,
  updateTanque,
} from "@/services/api/inseminacao";
import type {
  BreederDto,
  DoseDto,
  IACenterDto,
  InsemDto,
  TankDto,
} from "@/types/dto/inseminacao";

/**
 * Hooks react-query do módulo Inseminação Artificial.
 *
 * `inseminacaoKeys` agrupa uma sub-chave por entidade (centros/reprodutores/
 * tanques/doses/registos) para invalidação precisa após cada mutação.
 */
export const inseminacaoKeys = {
  all: ["inseminacao"] as const,
  centros: () => [...inseminacaoKeys.all, "centros"] as const,
  reprodutores: () => [...inseminacaoKeys.all, "reprodutores"] as const,
  tanques: () => [...inseminacaoKeys.all, "tanques"] as const,
  doses: () => [...inseminacaoKeys.all, "doses"] as const,
  registos: () => [...inseminacaoKeys.all, "registos"] as const,
};

// ---- Centros ----
export function useCentrosList() {
  return useQuery({ queryKey: inseminacaoKeys.centros(), queryFn: listCentros });
}
export function useCreateCentro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<IACenterDto>) => createCentro(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.centros() }),
  });
}
export function useUpdateCentro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IACenterDto> }) =>
      updateCentro(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.centros() }),
  });
}
export function useDeleteCentro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCentro(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.centros() }),
  });
}

// ---- Reprodutores ----
export function useReprodutoresList() {
  return useQuery({ queryKey: inseminacaoKeys.reprodutores(), queryFn: listReprodutores });
}
export function useCreateReprodutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BreederDto>) => createReprodutor(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.reprodutores() }),
  });
}
export function useUpdateReprodutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BreederDto> }) =>
      updateReprodutor(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.reprodutores() }),
  });
}
export function useDeleteReprodutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReprodutor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.reprodutores() }),
  });
}

// ---- Tanques ----
export function useTanquesList() {
  return useQuery({ queryKey: inseminacaoKeys.tanques(), queryFn: listTanques });
}
export function useCreateTanque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TankDto>) => createTanque(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.tanques() }),
  });
}
export function useUpdateTanque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TankDto> }) =>
      updateTanque(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.tanques() }),
  });
}
export function useDeleteTanque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTanque(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.tanques() }),
  });
}

// ---- Doses ----
export function useDosesList() {
  return useQuery({ queryKey: inseminacaoKeys.doses(), queryFn: listDoses });
}
export function useCreateDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DoseDto>) => createDose(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.doses() }),
  });
}
export function useUpdateDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DoseDto> }) =>
      updateDose(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.doses() }),
  });
}
export function useDeleteDose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDose(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.doses() }),
  });
}

// ---- Registos de inseminação ----
export function useRegistosList() {
  return useQuery({ queryKey: inseminacaoKeys.registos(), queryFn: listRegistos });
}
export function useCreateRegisto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InsemDto>) => createRegisto(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inseminacaoKeys.registos() });
      // uma inseminação consome dose -> a lista de doses pode mudar
      qc.invalidateQueries({ queryKey: inseminacaoKeys.doses() });
    },
  });
}
export function useUpdateRegisto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InsemDto> }) =>
      updateRegisto(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.registos() }),
  });
}
export function useDeleteRegisto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegisto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inseminacaoKeys.registos() }),
  });
}
