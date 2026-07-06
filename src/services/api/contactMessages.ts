import { apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { ContactMessagePayload, ContactMessageResponse } from "@/types/dto/contactMessage";

/**
 * Serviço de dados do módulo Contactos.
 *
 * Módulo apenas de escrita: a página pública (`src/pages/Contactos.tsx`) envia
 * a mensagem por aqui; o backend (Laravel, Fase 4) é responsável por notificar
 * a equipa por e-mail ao processar o POST. Sem listagem/admin nesta fase.
 */
export function submitContactMessage(
  payload: ContactMessagePayload,
): Promise<ContactMessageResponse> {
  return apiPost<ContactMessageResponse>(endpoints.contactMessages.create, payload);
}
