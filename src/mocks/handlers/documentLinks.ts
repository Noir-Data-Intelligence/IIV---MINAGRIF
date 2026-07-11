import { http, HttpResponse } from "msw";
import { documentLinksFixtures } from "@/mocks/fixtures/documentLinks";
import { documentosFixtures } from "@/mocks/fixtures/documentos";
import type { DocumentLinkDto } from "@/types/dto/documento";

/**
 * Handlers MSW do recurso `document-links` — ligações de documentos a entidades
 * genéricas (auditorias, lotes, não-conformidades, resultados, ...), consumidas
 * pelo componente partilhado `AttachedDocsPanel`.
 *
 * A listagem embute um resumo do documento ligado (`document`), resolvido em
 * tempo real a partir de `documentosFixtures` para nunca dessincronizar do
 * título/currentVersionId actuais.
 *
 * Operam sobre `documentLinksFixtures` (array mutável; reset no refresh).
 */
const BASE = "*/api/document-links";

/** Enriquece um link com o resumo do documento associado (join em memória). */
function withDocument(link: DocumentLinkDto): DocumentLinkDto {
  const doc = documentosFixtures.find((d) => d.id === link.documentId);
  return {
    ...link,
    document: doc
      ? { id: doc.id, title: doc.title, currentVersionId: doc.currentVersionId }
      : null,
  };
}

export const documentLinksHandlers = [
  // GET /api/document-links?entity_type=X&entity_id=Y -> ligações da entidade
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get("entity_type") ?? "";
    const entityId = url.searchParams.get("entity_id") ?? "";

    const rows = documentLinksFixtures
      .filter((l) => l.entityType === entityType && l.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withDocument);

    return HttpResponse.json(rows);
  }),

  // POST /api/document-links -> cria ligação
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<DocumentLinkDto>;
    const created: DocumentLinkDto = {
      id: `dlink-${Date.now()}`,
      documentId: payload.documentId ?? "",
      entityType: payload.entityType ?? "",
      entityId: payload.entityId ?? "",
      createdBy: payload.createdBy ?? null,
      createdAt: new Date().toISOString(),
      document: null,
    };
    documentLinksFixtures.unshift(created);
    return HttpResponse.json(withDocument(created), { status: 201 });
  }),

  // DELETE /api/document-links/:id -> remove ligação
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = documentLinksFixtures.findIndex((l) => l.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Ligação não encontrada." }, { status: 404 });
    }
    documentLinksFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default documentLinksHandlers;
