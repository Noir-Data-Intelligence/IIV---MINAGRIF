import { noticiasHandlers } from "@/mocks/handlers/noticias";

/**
 * Agregador de todos os handlers MSW.
 *
 * À medida que cada módulo migra, importa-se aqui o seu array de handlers e
 * acrescenta-se ao spread (ex: `...legislacaoHandlers`).
 */
export const handlers = [...noticiasHandlers];

export default handlers;
