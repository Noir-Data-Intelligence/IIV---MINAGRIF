import { http, HttpResponse } from "msw";
import { logsFixtures } from "@/mocks/fixtures/logs";
import type { LogDto } from "@/types/dto/log";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Logs de Actividade.
 *
 * Só-leitura (visualizador de auditoria — sem create/update/delete), ao
 * contrário de `mocks/handlers/departamentos.ts`. Opera sobre
 * `logsFixtures` (array constante, nunca mutado) e replica a lógica de
 * paginação/filtragem dos restantes módulos.
 *
 * O path usa o wildcard `*` no início (padrão recomendado pela documentação
 * MSW) para casar independentemente da baseURL exacta configurada em http.ts.
 */

const BASE = "*/api/logs";

export const logsHandlers = [
  // GET /api/logs -> lista paginada + filtrada (action/entity_type/date range), mais recente primeiro
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const action = (url.searchParams.get("action") ?? "").trim();
    const entityType = (url.searchParams.get("entity_type") ?? "").trim();
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");

    let rows = [...logsFixtures].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (action) rows = rows.filter((l) => l.action === action);
    if (entityType) rows = rows.filter((l) => l.entityType === entityType);
    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((l) => new Date(l.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((l) => new Date(l.createdAt) <= to);
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<LogDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),
];

export default logsHandlers;
