import { noticiasHandlers } from "@/mocks/handlers/noticias";
import { legislacaoHandlers } from "@/mocks/handlers/legislacao";
import { heroSlidesHandlers } from "@/mocks/handlers/heroSlides";
import { publicStatsHandlers } from "@/mocks/handlers/publicStats";
import { contactMessagesHandlers } from "@/mocks/handlers/contactMessages";

/**
 * Agregador de todos os handlers MSW.
 *
 * À medida que cada módulo migra, importa-se aqui o seu array de handlers e
 * acrescenta-se ao spread (ex: `...legislacaoHandlers`).
 */
export const handlers = [
  ...noticiasHandlers,
  ...legislacaoHandlers,
  ...heroSlidesHandlers,
  ...publicStatsHandlers,
  ...contactMessagesHandlers,
];

export default handlers;
