import { apiGet, apiPut } from "@/services/api/client";
import type { PerfilDto, PerfilUpdatePayload } from "@/types/dto/perfil";

/**
 * Serviço de dados do módulo "Meu Perfil".
 *
 * Recurso mock dedicado e independente do módulo `users` genérico (ver nota em
 * `types/dto/perfil.ts`). Usa rotas LOCAIS (não faz parte de `services/api/endpoints.ts`,
 * que é o mapa central dos módulos "de lista"), à semelhança de outros
 * recursos singulares/dedicados desta base de código.
 */
const ROUTES = {
  me: "/perfil/me",
};

export function getPerfil(): Promise<PerfilDto> {
  return apiGet<PerfilDto>(ROUTES.me);
}

export function updatePerfil(payload: PerfilUpdatePayload): Promise<PerfilDto> {
  return apiPut<PerfilDto>(ROUTES.me, payload);
}
