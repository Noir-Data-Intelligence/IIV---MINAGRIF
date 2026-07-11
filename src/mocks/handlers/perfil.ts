import { http, HttpResponse } from "msw";
import { perfilFixture, setPerfilFixture } from "@/mocks/fixtures/perfil";
import type { PerfilDto, PerfilUpdatePayload } from "@/types/dto/perfil";

/**
 * Handlers MSW do módulo "Meu Perfil".
 *
 * Recurso singular: apenas GET/PUT sobre `/perfil/me`, operando sobre
 * `perfilFixture` (registo único mutável em memória — persiste durante a
 * sessão do browser, reset no refresh). Segue o mesmo padrão de path com
 * wildcard usado em `mocks/handlers/departamentos.ts`.
 */

const BASE = "*/api/perfil/me";

export const perfilHandlers = [
  // GET /api/perfil/me -> devolve o registo actual
  http.get(BASE, () => {
    return HttpResponse.json(perfilFixture);
  }),

  // PUT /api/perfil/me -> actualiza em memória
  http.put(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as PerfilUpdatePayload;
    const updated: PerfilDto = {
      ...perfilFixture,
      ...payload,
      // id é imutável pelo cliente.
      id: perfilFixture.id,
      updatedAt: new Date().toISOString(),
    };
    setPerfilFixture(updated);
    return HttpResponse.json(updated);
  }),
];

export default perfilHandlers;
