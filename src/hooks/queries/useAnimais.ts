import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnimal,
  createAnimalEvent,
  createHealthRecord,
  deleteAnimal,
  listAnimais,
  listAnimalEvents,
  listHealthRecords,
  updateAnimal,
} from "@/services/api/animais";
import type {
  AnimalDto,
  AnimalEventDto,
  AnimalListParams,
  HealthRecordDto,
} from "@/types/dto/animal";

/**
 * Hooks react-query do módulo Animais.
 *
 * `animalKeys` inclui, além de list/detail, sub-chaves para as sub-entidades
 * (eventos/saúde) de cada animal, para invalidação precisa após registo.
 */
export const animalKeys = {
  all: ["animais"] as const,
  lists: () => [...animalKeys.all, "list"] as const,
  list: (params: AnimalListParams) => [...animalKeys.lists(), params] as const,
  details: () => [...animalKeys.all, "detail"] as const,
  detail: (id: string) => [...animalKeys.details(), id] as const,
  events: (animalId: string) => [...animalKeys.detail(animalId), "eventos"] as const,
  health: (animalId: string) => [...animalKeys.detail(animalId), "saude"] as const,
};

export function useAnimaisList(params: AnimalListParams) {
  return useQuery({
    queryKey: animalKeys.list(params),
    queryFn: () => listAnimais(params),
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AnimalDto>) => createAnimal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: animalKeys.lists() });
    },
  });
}

export function useUpdateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AnimalDto> }) =>
      updateAnimal(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: animalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: animalKeys.detail(updated.id) });
    },
  });
}

export function useDeleteAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnimal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: animalKeys.lists() });
    },
  });
}

// ---- Sub-entidade: eventos ----
export function useAnimalEvents(animalId: string | null) {
  return useQuery({
    queryKey: animalKeys.events(animalId ?? "none"),
    queryFn: () => listAnimalEvents(animalId as string),
    enabled: !!animalId,
  });
}

export function useCreateAnimalEvent(animalId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AnimalEventDto>) =>
      createAnimalEvent(animalId as string, payload),
    onSuccess: () => {
      if (animalId) queryClient.invalidateQueries({ queryKey: animalKeys.events(animalId) });
    },
  });
}

// ---- Sub-entidade: registos sanitários ----
export function useHealthRecords(animalId: string | null) {
  return useQuery({
    queryKey: animalKeys.health(animalId ?? "none"),
    queryFn: () => listHealthRecords(animalId as string),
    enabled: !!animalId,
  });
}

export function useCreateHealthRecord(animalId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<HealthRecordDto>) =>
      createHealthRecord(animalId as string, payload),
    onSuccess: () => {
      if (animalId) queryClient.invalidateQueries({ queryKey: animalKeys.health(animalId) });
    },
  });
}
