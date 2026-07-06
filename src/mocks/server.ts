import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";

/**
 * Servidor MSW para Node — destinado a testes (vitest). Não é usado em runtime
 * do browser. Uso típico num setup de testes:
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */
export const server = setupServer(...handlers);

export default server;
