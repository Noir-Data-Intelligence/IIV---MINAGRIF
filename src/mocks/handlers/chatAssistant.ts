import { http, HttpResponse } from "msw";

/**
 * Handler MSW do Assistente (chat). Substitui a Edge Function Supabase
 * `supabase/functions/chat-assistant` (ver ChatWidget.tsx) por uma resposta
 * simulada, no mesmo formato SSE (`data: {"choices":[{"delta":{...}}]}`) que
 * o parser do cliente já espera — não altera a lógica de streaming.
 *
 * Sem LLM real: devolve uma resposta fixa, "escrita" em chunks pequenos para
 * simular streaming. Fica documentado como trabalho futuro (rota Laravel a
 * fazer proxy para um provedor de LLM) em PLANO-BACKEND-LARAVEL.txt.
 */

const MOCK_REPLY =
  "Esta é uma resposta simulada do assistente (modo mock). " +
  "Quando o backend Laravel estiver disponível, esta rota passa a fazer proxy " +
  "para um modelo de IA real, mantendo o mesmo formato de streaming.";

function sseChunk(content: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

export const chatAssistantHandlers = [
  http.post("*/api/chat-assistant", async () => {
    const words = MOCK_REPLY.split(" ");
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const word of words) {
          controller.enqueue(encoder.encode(sseChunk(`${word} `)));
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
];

export default chatAssistantHandlers;
