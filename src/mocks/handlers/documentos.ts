import { http, HttpResponse } from "msw";
import {
  docCategoriesFixtures,
  documentosFixtures,
  docVersionsFixtures,
} from "@/mocks/fixtures/documentos";
import { documentLinksFixtures } from "@/mocks/fixtures/documentLinks";
import { documentPermissionsFixtures } from "@/mocks/fixtures/documentPermissions";
import type {
  DocumentoDto,
  DocVersionDto,
  DocVersionPayload,
} from "@/types/dto/documento";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo de Gestão Documental — recurso `documentos` (CRUD +
 * workflow de estado), as suas `versions` e o catálogo `document-categories`.
 * As ligações (`document-links`) e permissões (`document-permissions`) têm
 * handlers próprios (ficheiros separados).
 *
 * Operam sobre os arrays mutáveis de `fixtures/documentos.ts`, pelo que as
 * escritas PERSISTEM durante a sessão do browser (reset no refresh).
 *
 * Simulação de upload: não há storage real. A página gera um `filePath`
 * fictício e envia apenas os metadados do ficheiro (nome/tamanho/tipo) no
 * payload da versão — aqui apenas se persistem esses metadados.
 */

const BASE = "*/api/documentos";
const CATEGORIES = "*/api/document-categories";

export const documentosHandlers = [
  // GET /api/document-categories -> catálogo simples (array, não paginado)
  http.get(CATEGORIES, () => {
    const rows = [...docCategoriesFixtures].sort((a, b) => a.sortOrder - b.sortOrder);
    return HttpResponse.json(rows);
  }),

  // GET /api/documentos/:id/versions -> versões do documento (desc por número)
  http.get(`${BASE}/:id/versions`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = docVersionsFixtures
      .filter((v) => v.documentId === id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return HttpResponse.json(rows);
  }),

  // POST /api/documentos/:id/versions -> cria nova versão + actualiza o documento
  http.post(`${BASE}/:id/versions`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const docIndex = documentosFixtures.findIndex((d) => d.id === id);
    if (docIndex === -1) {
      return HttpResponse.json({ message: "Documento não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as DocVersionPayload;
    const existing = docVersionsFixtures.filter((v) => v.documentId === id);
    const nextNumber = existing.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
    const now = new Date().toISOString();
    const created: DocVersionDto = {
      id: `docv-${Date.now()}`,
      documentId: id,
      versionNumber: nextNumber,
      filePath: payload.filePath ?? `documents/${id}/v${nextNumber}/ficheiro.bin`,
      fileName: payload.fileName ?? null,
      fileSize: payload.fileSize ?? null,
      mimeType: payload.mimeType ?? null,
      changeNotes: payload.changeNotes ?? `Versão ${nextNumber}`,
      uploadedBy: payload.uploadedBy ?? documentosFixtures[docIndex].ownerId,
      createdAt: now,
    };
    docVersionsFixtures.unshift(created);
    // Uma nova versão passa a ser a corrente e devolve o documento a rascunho.
    documentosFixtures[docIndex] = {
      ...documentosFixtures[docIndex],
      currentVersionId: created.id,
      status: "rascunho",
      updatedAt: now,
    };
    return HttpResponse.json(created, { status: 201 });
  }),

  // GET /api/documentos -> lista paginada + filtrada (search/status/categoria)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const categoryId = url.searchParams.get("category_id") ?? "";

    let rows = [...documentosFixtures].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    if (search) {
      rows = rows.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          (d.description ?? "").toLowerCase().includes(search) ||
          d.tags.some((t) => t.toLowerCase().includes(search)),
      );
    }
    if (status) rows = rows.filter((d) => d.status === status);
    if (categoryId) rows = rows.filter((d) => d.categoryId === categoryId);

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<DocumentoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/documentos -> cria documento (sem versão; a versão inicial é um POST separado)
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<DocumentoDto>;
    const now = new Date().toISOString();
    const created: DocumentoDto = {
      id: `doc-${Date.now()}`,
      title: payload.title ?? "Sem título",
      description: payload.description ?? null,
      categoryId: payload.categoryId ?? null,
      ownerId: payload.ownerId ?? "usr-0001",
      status: payload.status ?? "rascunho",
      visibility: payload.visibility ?? "publico",
      expiryDate: payload.expiryDate ?? null,
      tags: payload.tags ?? [],
      currentVersionId: null,
      createdAt: now,
      updatedAt: now,
    };
    documentosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // GET /api/documentos/:id -> detalhe
  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const doc = documentosFixtures.find((d) => d.id === id);
    if (!doc) return HttpResponse.json({ message: "Documento não encontrado." }, { status: 404 });
    return HttpResponse.json(doc);
  }),

  // PUT /api/documentos/:id -> actualiza metadados e/ou estado (workflow)
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = documentosFixtures.findIndex((d) => d.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Documento não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<DocumentoDto>;
    const updated: DocumentoDto = {
      ...documentosFixtures[index],
      ...payload,
      // Campos imutáveis pelo cliente.
      id: documentosFixtures[index].id,
      createdAt: documentosFixtures[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    documentosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/documentos/:id -> remove documento + versões, ligações e permissões
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = documentosFixtures.findIndex((d) => d.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Documento não encontrado." }, { status: 404 });
    }
    documentosFixtures.splice(index, 1);
    // Cascata: remover em memória tudo o que depende deste documento.
    removeWhere(docVersionsFixtures, (v) => v.documentId === id);
    removeWhere(documentLinksFixtures, (l) => l.documentId === id);
    removeWhere(documentPermissionsFixtures, (p) => p.documentId === id);
    return new HttpResponse(null, { status: 204 });
  }),
];

/** Remove in-place todos os elementos que satisfazem o predicado. */
function removeWhere<T>(arr: T[], pred: (item: T) => boolean) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) arr.splice(i, 1);
  }
}

export default documentosHandlers;
