import { apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { InqueritoSatisfacaoDto, InqueritoSatisfacaoPayload } from "@/types/dto/inqueritoSatisfacao";

/** FM-SQ-066 — só o envio está exposto no frontend por agora (entidade desacoplada pós-entrega). */
export function submitInqueritoSatisfacao(payload: InqueritoSatisfacaoPayload): Promise<InqueritoSatisfacaoDto> {
  return apiPost<InqueritoSatisfacaoDto>(endpoints.inqueritosSatisfacao.list, payload);
}
