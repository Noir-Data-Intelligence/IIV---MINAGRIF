import { http, HttpResponse } from "msw";
import { produtosFixtures } from "@/mocks/fixtures/produtos";
import type { ProdutoDto } from "@/types/dto/produto";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Produtos.
 *
 * Operam sobre `produtosFixtures` (array mutável em memória); create/update/
 * delete/archive/restore PERSISTEM durante a sessão do browser (reset no refresh).
 * Replica a lógica de paginação/filtragem de `mocks/handlers/departamentos.ts`,
 * acrescentando o filtro `archived` e as acções de archive/restore.
 */

const BASE = "*/api/produtos";

export const produtosHandlers = [
  // GET /api/produtos -> lista paginada + filtrada, ordenada por nome
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const archivedParam = url.searchParams.get("archived");

    let rows = [...produtosFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (archivedParam !== null) {
      const archived = archivedParam === "true";
      rows = rows.filter((p) => p.isArchived === archived);
    }

    if (search) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          (p.description ?? "").toLowerCase().includes(search) ||
          p.productType.toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<ProdutoDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/produtos -> cria em memória
  http.post(`${BASE}`, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ProdutoDto>;
    const now = new Date().toISOString();
    const created: ProdutoDto = {
      id: `prod-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      productType: payload.productType ?? "vacina",
      description: payload.description ?? null,
      unit: payload.unit ?? "dose",
      isArchived: payload.isArchived ?? false,
      createdAt: now,
    };
    produtosFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // POST /api/produtos/:id/archive -> arquiva
  http.post(`${BASE}/:id/archive`, ({ params }) => {
    const { id } = params as { id: string };
    const index = produtosFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Produto não encontrado." }, { status: 404 });
    produtosFixtures[index] = { ...produtosFixtures[index], isArchived: true };
    return HttpResponse.json(produtosFixtures[index]);
  }),

  // POST /api/produtos/:id/restore -> restaura
  http.post(`${BASE}/:id/restore`, ({ params }) => {
    const { id } = params as { id: string };
    const index = produtosFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Produto não encontrado." }, { status: 404 });
    produtosFixtures[index] = { ...produtosFixtures[index], isArchived: false };
    return HttpResponse.json(produtosFixtures[index]);
  }),

  // PUT /api/produtos/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = produtosFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Produto não encontrado." }, { status: 404 });
    const payload = (await request.json().catch(() => ({}))) as Partial<ProdutoDto>;
    const updated: ProdutoDto = {
      ...produtosFixtures[index],
      ...payload,
      id: produtosFixtures[index].id,
      createdAt: produtosFixtures[index].createdAt,
    };
    produtosFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/produtos/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = produtosFixtures.findIndex((p) => p.id === id);
    if (index === -1) return HttpResponse.json({ message: "Produto não encontrado." }, { status: 404 });
    produtosFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default produtosHandlers;
