import { setupWorker } from "msw/browser";
import { handlers } from "@/mocks/handlers";

/**
 * Service worker MSW para o browser. Arrancado condicionalmente em
 * src/main.tsx quando `VITE_API_MOCK === "true"`.
 */
export const worker = setupWorker(...handlers);

export default worker;
