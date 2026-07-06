/**
 * DTO do módulo Contactos — mensagens enviadas via formulário público.
 *
 * Módulo apenas de escrita (não há listagem/admin nesta fase): a página
 * pública cria uma mensagem e o backend trata da notificação da equipa.
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
