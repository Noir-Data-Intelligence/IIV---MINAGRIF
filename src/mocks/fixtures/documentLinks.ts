import type { DocumentLinkDto } from "@/types/dto/documento";

/**
 * Ligações fictícias de documentos a entidades genéricas do sistema. Os
 * `entityType` correspondem aos usados pelo componente partilhado
 * `AttachedDocsPanel` nas páginas já migradas: "audit" (Auditorias),
 * "production_batch" (Lotes), "nonconformity" (Não-Conformidades) e
 * "lab_result" (Resultados). Os `entityId` e `documentId` referenciam ids
 * reais das respectivas fixtures.
 *
 * O campo `document` (resumo embutido) é preenchido dinamicamente pelo handler
 * a partir de `documentosFixtures`, pelo que aqui fica `null` — evita duplicar
 * (e dessincronizar) o título/currentVersionId.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL (create/delete em memória).
 */
export let documentLinksFixtures: DocumentLinkDto[] = [
  {
    id: "dlink-0001",
    documentId: "doc-0001",
    entityType: "lab_result",
    entityId: "res-0001",
    createdBy: "usr-0003",
    createdAt: "2026-03-01T10:00:00.000Z",
    document: null,
  },
  {
    id: "dlink-0002",
    documentId: "doc-0007",
    entityType: "audit",
    entityId: "aud-0001",
    createdBy: "usr-0002",
    createdAt: "2026-02-20T09:30:00.000Z",
    document: null,
  },
  {
    id: "dlink-0003",
    documentId: "doc-0004",
    entityType: "nonconformity",
    entityId: "nc-0001",
    createdBy: "usr-0001",
    createdAt: "2026-04-11T14:15:00.000Z",
    document: null,
  },
  {
    id: "dlink-0004",
    documentId: "doc-0008",
    entityType: "production_batch",
    entityId: "lote-0001",
    createdBy: "usr-0011",
    createdAt: "2025-11-05T08:45:00.000Z",
    document: null,
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setDocumentLinksFixtures(next: DocumentLinkDto[]) {
  documentLinksFixtures = next;
}
