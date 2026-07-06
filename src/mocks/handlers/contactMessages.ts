import { http, HttpResponse } from "msw";
import { contactMessagesFixtures } from "@/mocks/fixtures/contactMessages";
import type {
  ContactMessageDto,
  ContactMessagePayload,
  ContactMessageResponse,
} from "@/types/dto/contactMessage";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Contactos.
 *
 * Operam sobre `contactMessagesFixtures` (array mutável em memória): o POST
 * público (submissão do formulário de Contactos) ADICIONA a mensagem criada às
 * fixtures, para que a caixa de entrada admin (`src/pages/admin/Mensagens.tsx`)
 * a possa listar/gerir na mesma sessão do browser. GET/PATCH/DELETE servem
 * exclusivamente a caixa de entrada admin.
 */
const BASE = "*/api/contact-messages";

export const contactMessagesHandlers = [
  // GET /api/contact-messages -> lista paginada, ordenada por criação (mais recentes primeiro)
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;

    const rows = [...contactMessagesFixtures].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<ContactMessageDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /api/contact-messages -> valida presença dos campos, cria e persiste em memória
  http.post(BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<ContactMessagePayload>;

    if (!body.nome || !body.email || !body.assunto || !body.mensagem) {
      return HttpResponse.json(
        { message: "Campos obrigatórios em falta." },
        { status: 422 },
      );
    }

    const created: ContactMessageDto = {
      id: `msg-${Date.now()}`,
      nome: body.nome,
      email: body.email,
      assunto: body.assunto,
      mensagem: body.mensagem,
      lida: false,
      respondida: false,
      createdAt: new Date().toISOString(),
    };
    contactMessagesFixtures.unshift(created);

    const response: ContactMessageResponse = { id: created.id };
    return HttpResponse.json(response, { status: 201 });
  }),

  // PATCH /api/contact-messages/:id -> actualiza lida/respondida em memória
  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = contactMessagesFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Mensagem não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<
      Pick<ContactMessageDto, "lida" | "respondida">
    >;
    const updated: ContactMessageDto = {
      ...contactMessagesFixtures[index],
      ...(typeof payload.lida === "boolean" ? { lida: payload.lida } : {}),
      ...(typeof payload.respondida === "boolean" ? { respondida: payload.respondida } : {}),
    };
    contactMessagesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/contact-messages/:id -> remove em memória
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = contactMessagesFixtures.findIndex((m) => m.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Mensagem não encontrada." }, { status: 404 });
    }
    contactMessagesFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default contactMessagesHandlers;
