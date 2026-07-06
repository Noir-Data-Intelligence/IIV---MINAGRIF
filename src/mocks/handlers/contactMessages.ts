import { http, HttpResponse } from "msw";
import type { ContactMessagePayload, ContactMessageResponse } from "@/types/dto/contactMessage";

/**
 * Handlers MSW do módulo Contactos.
 *
 * Só criação (sem listagem/admin nesta fase): valida minimamente a presença
 * dos campos e devolve um id gerado. Não persiste em fixtures — não há UI de
 * listagem a alimentar. A notificação por e-mail à equipa (feita hoje, em
 * produção, pela edge function Supabase `send-transactional-email`) passa a
 * ser responsabilidade do backend Laravel ao processar este POST; o mock não
 * a simula.
 */
const BASE = "*/api/contact-messages";

export const contactMessagesHandlers = [
  // POST /api/contact-messages -> valida presença dos campos e devolve { id }
  http.post(BASE, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<ContactMessagePayload>;

    if (!body.nome || !body.email || !body.assunto || !body.mensagem) {
      return HttpResponse.json(
        { message: "Campos obrigatórios em falta." },
        { status: 422 },
      );
    }

    const response: ContactMessageResponse = { id: crypto.randomUUID() };
    return HttpResponse.json(response, { status: 201 });
  }),
];

export default contactMessagesHandlers;
