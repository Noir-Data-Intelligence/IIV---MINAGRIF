/**
 * DTO de Perfil — contrato exacto do JSON REST para o recurso "o meu perfil".
 *
 * Recurso SEPARADO do módulo `users` genérico (ver `types/dto/user.ts`): este
 * representa os dados de negócio (nome, telefone, avatar) do utilizador
 * ACTUALMENTE AUTENTICADO, identificado via Supabase Auth (`useAuth()`), que
 * fica fora do âmbito desta migração. Como os IDs fictícios de `users` (ex:
 * `usr-0001`) não correspondem aos UUIDs reais da sessão Supabase, não há
 * forma de cruzar os dois — daí este DTO/fixture/handler dedicados, que
 * simulam sempre "o perfil da sessão actual" independentemente de qual conta
 * demo está autenticada.
 */
export interface PerfilDto {
  id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  updatedAt: string;
}

/** Payload de actualização — todos os campos opcionais (PUT parcial). */
export interface PerfilUpdatePayload {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}
