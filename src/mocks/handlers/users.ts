import { http, HttpResponse } from "msw";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { UpdateUserPayload, UserDto } from "@/types/dto/user";
import type { AppRole } from "@/lib/permissions";

/**
 * Handlers MSW do módulo Utilizadores.
 *
 * Ao contrário de `departamentos.ts`, este endpoint NÃO pagina no servidor —
 * devolve sempre o array completo (já filtrado por `search`/`role`/`departmentId`),
 * espelhando `listUsers()`. A página aplica paginação client-side sobre o
 * resultado (ver comentário em `Utilizadores.tsx`).
 *
 * Opera sobre `usersFixtures` (array mutável em memória): update/delete
 * persistem durante a sessão do browser (reset no refresh).
 */

const BASE = "*/api/users";

export const usersHandlers = [
  // GET /api/users -> lista filtrada por nome/telefone, papel e departamento
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const role = url.searchParams.get("role") ?? "";
    const departmentId = url.searchParams.get("departmentId") ?? "";

    let rows = [...usersFixtures].sort((a, b) => a.fullName.localeCompare(b.fullName));

    if (search) {
      rows = rows.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          (u.phone ?? "").toLowerCase().includes(search),
      );
    }
    if (role) {
      rows = rows.filter((u) => u.roles.includes(role as AppRole));
    }
    if (departmentId) {
      rows = rows.filter((u) => u.departmentIds.includes(departmentId));
    }

    return HttpResponse.json(rows);
  }),

  // PUT /api/users/:id -> actualiza em memória (nome/telefone/papéis/departamentos)
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = usersFixtures.findIndex((u) => u.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Utilizador não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as UpdateUserPayload;
    const current = usersFixtures[index];
    const updated: UserDto = {
      ...current,
      fullName: payload.fullName !== undefined ? payload.fullName : current.fullName,
      phone: payload.phone !== undefined ? payload.phone : current.phone,
      roles: payload.roles !== undefined ? payload.roles : current.roles,
      departmentIds: payload.departmentIds !== undefined ? payload.departmentIds : current.departmentIds,
      // id/createdAt são imutáveis pelo cliente.
      id: current.id,
      createdAt: current.createdAt,
    };
    usersFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/users/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = usersFixtures.findIndex((u) => u.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Utilizador não encontrado." }, { status: 404 });
    }
    usersFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default usersHandlers;
