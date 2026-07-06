import { http, HttpResponse } from "msw";
import { notificationsFixtures, setNotificationsFixtures } from "@/mocks/fixtures/notifications";
import type { NotificationDto } from "@/types/dto/notification";

/**
 * Handlers MSW do módulo Notificações.
 *
 * Operam sobre `notificationsFixtures` (array mutável em memória), pelo que
 * marcar-lida/eliminar/limpar PERSISTEM durante a sessão do browser (reset no
 * refresh). Sem paginação server-side: `GET` devolve sempre a lista completa,
 * ordenada por mais recente primeiro — a paginação é feita client-side pela
 * página (ver `useClientPagination`).
 *
 * Os paths usam o wildcard `*` no início (padrão recomendado pela
 * documentação MSW), tal como `mocks/handlers/departamentos.ts`.
 */

const BASE = "*/api/notifications";

export const notificationsHandlers = [
  // GET /api/notifications -> lista completa, mais recente primeiro
  http.get(BASE, () => {
    const rows = [...notificationsFixtures].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return HttpResponse.json(rows);
  }),

  // PATCH /api/notifications/:id -> marca como lida (ou aplica outro campo enviado)
  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = notificationsFixtures.findIndex((n) => n.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Notificação não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<NotificationDto>;
    const updated: NotificationDto = {
      ...notificationsFixtures[index],
      ...payload,
      id: notificationsFixtures[index].id,
      createdAt: notificationsFixtures[index].createdAt,
    };
    notificationsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // POST /api/notifications/mark-all-read -> marca todas como lidas
  http.post(`${BASE}/mark-all-read`, () => {
    setNotificationsFixtures(notificationsFixtures.map((n) => ({ ...n, read: true })));
    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /api/notifications/:id -> remove uma notificação em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = notificationsFixtures.findIndex((n) => n.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Notificação não encontrada." }, { status: 404 });
    }
    setNotificationsFixtures(notificationsFixtures.filter((n) => n.id !== id));
    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /api/notifications -> limpa todas as notificações
  http.delete(BASE, () => {
    setNotificationsFixtures([]);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default notificationsHandlers;
