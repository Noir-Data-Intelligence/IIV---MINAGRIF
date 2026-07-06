/**
 * DTO do módulo Contactos — mensagens enviadas via formulário público.
 *
 * Módulo agora com leitura/administração (caixa de entrada em
 * `src/pages/admin/Mensagens.tsx`), para além da criação pública original: a
 * página pública cria uma mensagem (`ContactMessagePayload`/`ContactMessageResponse`)
 * e a caixa de entrada admin lista/actualiza/elimina (`ContactMessageDto`).
 */
export interface ContactMessagePayload {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}

/** Resposta da criação de uma mensagem de contacto. */
export interface ContactMessageResponse {
  id: string;
}

/**
 * DTO de Mensagem de Contacto — contrato exacto do JSON REST para o recurso
 * `contact-messages`, usado pela caixa de entrada admin.
 */
export interface ContactMessageDto {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  lida: boolean;
  respondida: boolean;
  createdAt: string;
}

/** Parâmetros de listagem paginada de mensagens de contacto. */
export interface ContactMessageListParams {
  page?: number;
  perPage?: number;
}
