import type { DocumentPermissionDto } from "@/types/dto/documento";

/**
 * Permissões granulares fictícias sobre documentos. Cada permissão dirige-se a
 * um papel (`role`) OU a um departamento (`departmentId`), nunca a ambos. Os
 * `departmentId` referenciam ids reais de `mocks/fixtures/departamentos.ts`.
 *
 * O campo `department` (nome embutido) é preenchido pelo handler a partir de
 * `departamentosFixtures`, pelo que aqui fica `null`.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL (create/delete em memória).
 */
export let documentPermissionsFixtures: DocumentPermissionDto[] = [
  {
    id: "dperm-0001",
    documentId: "doc-0002",
    role: "gestor",
    departmentId: null,
    canEdit: true,
    department: null,
  },
  {
    id: "dperm-0002",
    documentId: "doc-0002",
    role: null,
    departmentId: "dep-0001",
    canEdit: false,
    department: null,
  },
  {
    id: "dperm-0003",
    documentId: "doc-0005",
    role: "tecnico",
    departmentId: null,
    canEdit: true,
    department: null,
  },
  {
    id: "dperm-0004",
    documentId: "doc-0008",
    role: null,
    departmentId: "dep-0002",
    canEdit: false,
    department: null,
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setDocumentPermissionsFixtures(next: DocumentPermissionDto[]) {
  documentPermissionsFixtures = next;
}
