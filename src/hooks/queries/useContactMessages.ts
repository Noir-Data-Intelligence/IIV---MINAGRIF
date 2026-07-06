import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteContactMessage,
  listContactMessages,
  markContactMessageRead,
  markContactMessageResponded,
  submitContactMessage,
} from "@/services/api/contactMessages";
import type { ContactMessageListParams, ContactMessagePayload } from "@/types/dto/contactMessage";

/**
 * Hooks react-query do módulo Contactos.
 *
 * `useSubmitContactMessage` continua sem query keys/listagem (usado só pela
 * página pública). As restantes replicam o padrão de `useDepartamentos.ts`:
 *  - `contactMessageKeys`: fábrica de query keys hierárquicas (all -> lists/details).
 *  - query para list; mutations para marcar lida/respondida/eliminar, todas a
 *    invalidar as listas no onSuccess.
 */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (payload: ContactMessagePayload) => submitContactMessage(payload),
  });
}

export const contactMessageKeys = {
  all: ["contactMessages"] as const,
  lists: () => [...contactMessageKeys.all, "list"] as const,
  list: (params: ContactMessageListParams) => [...contactMessageKeys.lists(), params] as const,
  details: () => [...contactMessageKeys.all, "detail"] as const,
  detail: (id: string) => [...contactMessageKeys.details(), id] as const,
};

export function useContactMessagesList(params: ContactMessageListParams) {
  return useQuery({
    queryKey: contactMessageKeys.list(params),
    queryFn: () => listContactMessages(params),
  });
}

export function useMarkContactMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markContactMessageRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.lists() });
    },
  });
}

export function useMarkContactMessageResponded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markContactMessageResponded(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.lists() });
    },
  });
}

export function useDeleteContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.lists() });
    },
  });
}
