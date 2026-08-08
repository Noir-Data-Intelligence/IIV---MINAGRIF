import { apiGet, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { AmostraDto, AmostraListParams, RejeitarAmostraPayload } from "@/types/dto/amostra";

/**
 * Serviço de dados do módulo Amostras (Onda 3 — Laboratório). Triagem:
 * `aceitarAmostra` abre o Boletim Interno correspondente; `rejeitarAmostra`
 * exige critério + assinatura (RN "Termo de Rejeição obrigatório").
 */
function toQuery(params: AmostraListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.requisicaoId) query.requisicao_id = params.requisicaoId;
  if (params.status) query.status = params.status;
  return query;
}

export function listAmostras(params: AmostraListParams): Promise<Paginated<AmostraDto>> {
  return apiGet<Paginated<AmostraDto>>(endpoints.amostras.list, { params: toQuery(params) });
}

export function getAmostra(id: string): Promise<AmostraDto> {
  return apiGet<AmostraDto>(endpoints.amostras.detail(id));
}

export function aceitarAmostra(id: string): Promise<AmostraDto> {
  return apiPost<AmostraDto>(endpoints.amostras.aceitar(id));
}

export function rejeitarAmostra(id: string, payload: RejeitarAmostraPayload): Promise<AmostraDto> {
  return apiPost<AmostraDto>(endpoints.amostras.rejeitar(id), payload);
}
