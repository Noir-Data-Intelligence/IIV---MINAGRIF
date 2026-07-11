import { http, HttpResponse } from "msw";
import { documentPermissionsFixtures } from "@/mocks/fixtures/documentPermissions";
import { departamentosFixtures } from "@/mocks/fixtures/departamentos";
import type { DocumentPermissionDto } from "@/types/dto/documento";

/**
 * Handlers MSW do recurso `document-permissions` — permissões granulares por
 * papel OU departamento sobre um documento, consumidas pelo componente
 * `DocumentPermissionsPanel`.
 *
 * A listagem embute o nome do departamento (`department`), resolvido em tempo
 * real a partir de `departamentosFixtures`.
 *
 * Operam sobre `documentPermissionsFixtures` (array mutável; reset no refresh).
 */
const BASE = "*/api/document-permissions";

/** Enriquece uma permissão com o nome do departamento (join em memória). */
function withDepartment(perm: DocumentPermissionDto): DocumentPermissionDto {
  if (!perm.departmentId) return { ...perm, department: null };
  const dep = departamentosFixtures.find((d) => d.id === perm.departmentId);
  return { ...perm, department: dep ? { name: dep.name } : null };
}

export const documentPermissionsHandlers = [
  // GET /api/document-permissions?document_id=X -> permissões do documento
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const documentId = url.searchParams.get("document_id") ?? "";
    const rows = documentPermissionsFixtures
      .filter((p) => p.documentId === documentId)
      .map(withDepartment);
    return HttpResponse.json(rows);
  }),

  // POST /api/document-permissions -> cria permissão
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<DocumentPermissionDto>;
    const created: DocumentPermissionDto = {
      id: `dperm-${Date.now()}`,
      documentId: payload.documentId ?? "",
      role: payload.role ?? null,
      departmentId: payload.departmentId ?? null,
      canEdit: payload.canEdit ?? false,
      department: null,
    };
    documentPermissionsFixtures.unshift(created);
    return HttpResponse.json(withDepartment(created), { status: 201 });
  }),

  // DELETE /api/document-permissions/:id -> remove permissão
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = documentPermissionsFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Permissão não encontrada." }, { status: 404 });
    }
    documentPermissionsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default documentPermissionsHandlers;
