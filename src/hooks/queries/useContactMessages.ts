import { useMutation } from "@tanstack/react-query";
import { submitContactMessage } from "@/services/api/contactMessages";
import type { ContactMessagePayload } from "@/types/dto/contactMessage";

/**
 * Hook react-query do módulo Contactos.
 *
 * Só mutation de criação (sem query keys/listagem a invalidar). O componente
 * trata do sucesso/erro com `try/catch` à volta de `mutateAsync()` (ou via
 * `onSuccess`/`onError` passados a `.mutate()`, à escolha de quem consome).
 */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: (payload: ContactMessagePayload) => submitContactMessage(payload),
  });
}
