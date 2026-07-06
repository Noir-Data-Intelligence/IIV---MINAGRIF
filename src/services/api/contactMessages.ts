import { apiDelete, apiGet, apiPatch, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type {
  ContactMessageDto,
  ContactMessageListParams,
  ContactMessagePayload,
  ContactMessageResponse,
} from "@/types/dto/contactMessage";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Serviço de dados do módulo Contactos.
 *
 * `submitContactMessage` continua a ser usado pela página pública
 * (`src/pages/Contactos.tsx`); o backend (Laravel, Fase 4) é responsável por
 * notificar a equipa por e-mail ao processar o POST. As restantes funções
 * servem a caixa de entrada admin (`src/pages/admin/Mensagens.tsx`).
 */
export function submitContactMessage(
  payload: ContactMessagePayload,
): Promise<ContactMessageResponse> {
  return apiPost<ContactMessageResponse>(endpoints.contactMessages.create, payload);
}

/** Converte `ContactMessageListParams` em query params REST (snake_case p/ Laravel). */
function toQuery(params: ContactMessageListParams): Record<string, string | number> {
  return {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
}

export function listContactMessages(
  params: ContactMessageListParams,
): Promise<Paginated<ContactMessageDto>> {
  return apiGet<Paginated<ContactMessageDto>>(endpoints.contactMessages.list, {
    params: toQuery(params),
  });
}

export function markContactMessageRead(id: string): Promise<ContactMessageDto> {
  return apiPatch<ContactMessageDto>(endpoints.contactMessages.detail(id), { lida: true });
}

export function markContactMessageResponded(id: string): Promise<ContactMessageDto> {
  return apiPatch<ContactMessageDto>(endpoints.contactMessages.detail(id), { respondida: true });
}

export function deleteContactMessage(id: string): Promise<void> {
  return apiDelete<void>(endpoints.contactMessages.detail(id));
}
