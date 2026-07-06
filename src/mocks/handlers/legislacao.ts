import { http, HttpResponse } from "msw";
import { legislacaoFixtures } from "@/mocks/fixtures/legislacao";
import type { LegislacaoDto } from "@/types/dto/legislacao";

/**
 * Handlers MSW do módulo Legislação.
 *
 * Lista simples (sem paginação/envelope), tal como `listLegislacao` em
 * `services/api/legislacao.ts` espera. Segue o mesmo estilo de
 * `mocks/handlers/noticias.ts`: paths com wildcard `*` para casar
 * independentemente do host/porta configurado em `VITE_API_URL`.
 */

const BASE = "*/api/legislacao";

function toBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

export const legislacaoHandlers = [
  // GET /api/legislacao -> lista filtrada (tipo/search/published)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo") ?? "";
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const published = toBool(url.searchParams.get("published"));

    // Ordenação idêntica à página actual: `.order("num")`.
    let rows = [...legislacaoFixtures].sort((a, b) =>
      a.num.localeCompare(b.num, undefined, { numeric: true }),
    );

    if (tipo) {
      rows = rows.filter((l) => l.tipo === tipo);
    }
    if (search) {
      rows = rows.filter(
        (l) =>
          l.titulo.toLowerCase().includes(search) ||
          (l.descricao ?? "").toLowerCase().includes(search),
      );
    }
    if (typeof published === "boolean") {
      rows = rows.filter((l) => l.published === published);
    }

    return HttpResponse.json(rows satisfies LegislacaoDto[]);
  }),

  // GET /api/legislacao/:slug -> item ou 404
  http.get(`${BASE}/:slug`, ({ params }) => {
    const { slug } = params as { slug: string };
    const item = legislacaoFixtures.find((l) => l.slug === slug || l.id === slug);
    if (!item) {
      return HttpResponse.json({ message: "Diploma não encontrado." }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),
];

export default legislacaoHandlers;
