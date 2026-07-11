import type { PerfilDto } from "@/types/dto/perfil";

/**
 * Registo ÚNICO e MUTÁVEL que simula "o perfil da sessão actual".
 *
 * Independente de qual conta demo está autenticada via Supabase Auth
 * (`admin@iiv.demo`, etc.) — ver nota em `types/dto/perfil.ts` sobre a
 * impossibilidade de cruzar o UUID real da sessão com os IDs fictícios do
 * módulo `users`. Nome inicial plausível, sem avatar definido.
 */
export let perfilFixture: PerfilDto = {
  id: "perfil-me",
  fullName: "Administrador do Sistema",
  phone: null,
  avatarUrl: null,
  updatedAt: "2024-01-10T09:00:00.000Z",
};

/** Substitui o registo em memória (usado pelo handler PUT). */
export function setPerfilFixture(next: PerfilDto) {
  perfilFixture = next;
}
