import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPerfil, updatePerfil } from "@/services/api/perfil";
import type { PerfilUpdatePayload } from "@/types/dto/perfil";

/**
 * Hooks react-query do módulo "Meu Perfil".
 *
 * Recurso singular (não paginado) — uma única query key `perfilKeys.me`,
 * à semelhança de `usePublicStats.ts`. A mutation de actualização invalida
 * essa mesma key para reflectir de imediato o registo guardado.
 */

export const perfilKeys = {
  me: ["perfil", "me"] as const,
};

export function usePerfilQuery() {
  return useQuery({
    queryKey: perfilKeys.me,
    queryFn: () => getPerfil(),
  });
}

export function useUpdatePerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PerfilUpdatePayload) => updatePerfil(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: perfilKeys.me });
    },
  });
}
