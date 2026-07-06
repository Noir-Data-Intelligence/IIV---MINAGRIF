import { http, HttpResponse } from "msw";
import { rbacPermissionsFixtures } from "@/mocks/fixtures/rbacPermissions";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { AppRole } from "@/lib/permissions";
import type { PermissionEntryDto, UserRoleAssignmentDto } from "@/types/dto/rbac";

/**
 * Handlers MSW do módulo RBAC.
 *
 * As permissões operam sobre `rbacPermissionsFixtures` (array mutável próprio).
 * A lista de utilizadores REUTILIZA `usersFixtures` do módulo Utilizadores (uma
 * única fonte de verdade dos utilizadores), projectando cada `UserDto` no shape
 * consolidado `UserRoleAssignmentDto` (userId + fullName + roles). As mutações
 * de papel actuam directamente sobre `usersFixtures`, pelo que ficam coerentes
 * com o módulo Utilizadores. Tudo persiste durante a sessão (reset no refresh).
 *
 * Os paths usam o wildcard `*` inicial para casar independentemente da baseURL.
 */

const BASE = "*/api/rbac";

const toAssignment = (u: (typeof usersFixtures)[number]): UserRoleAssignmentDto => ({
  userId: u.id,
  fullName: u.fullName,
  roles: u.roles,
});

export const rbacHandlers = [
  // GET /api/rbac/permissions -> só os overrides existentes (matriz parcial)
  http.get(`${BASE}/permissions`, () => {
    return HttpResponse.json(rbacPermissionsFixtures);
  }),

  // PUT /api/rbac/permissions -> substitui o conjunto completo pelo enviado
  http.put(`${BASE}/permissions`, async ({ request }) => {
    const body = (await request.json().catch(() => [])) as PermissionEntryDto[];
    const rows = Array.isArray(body) ? body : [];
    rbacPermissionsFixtures.splice(0, rbacPermissionsFixtures.length, ...rows);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/rbac/users -> utilizadores + papéis (consolidado), ordenados por nome
  http.get(`${BASE}/users`, () => {
    const rows = [...usersFixtures]
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map(toAssignment);
    return HttpResponse.json(rows);
  }),

  // POST /api/rbac/users/:userId/roles -> adiciona papel ao utilizador
  http.post(`${BASE}/users/:userId/roles`, async ({ params, request }) => {
    const { userId } = params as { userId: string };
    const { role } = (await request.json().catch(() => ({}))) as { role?: AppRole };
    const user = usersFixtures.find((u) => u.id === userId);
    if (!user || !role) {
      return HttpResponse.json({ message: "Utilizador não encontrado." }, { status: 404 });
    }
    if (!user.roles.includes(role)) user.roles.push(role);
    return HttpResponse.json(toAssignment(user), { status: 201 });
  }),

  // DELETE /api/rbac/users/:userId/roles/:role -> remove papel do utilizador
  http.delete(`${BASE}/users/:userId/roles/:role`, ({ params }) => {
    const { userId, role } = params as { userId: string; role: AppRole };
    const user = usersFixtures.find((u) => u.id === userId);
    if (!user) {
      return HttpResponse.json({ message: "Utilizador não encontrado." }, { status: 404 });
    }
    user.roles = user.roles.filter((r) => r !== role);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default rbacHandlers;
