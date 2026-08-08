import { apiGet, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { RequisicaoDto, RequisicaoListParams, RequisicaoPayload } from "@/types/dto/requisicao";

/**
 * Serviço de dados do módulo Requisições (Onda 3 — Laboratório).
 *
 * Segue o padrão de `services/api/noticias.ts`: assenta nos helpers de
 * `client.ts` e nas rotas de `endpoints.ts`. `createRequisicao` cria a
 * requisição e o lote de amostras associado numa única chamada (RN "anexo
 * para lotes").
 */
function toQuery(params: RequisicaoListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.laboratorioId) query.laboratorio_id = params.laboratorioId;
  if (params.search) query.search = params.search;
  return query;
}

export function listRequisicoes(params: RequisicaoListParams): Promise<Paginated<RequisicaoDto>> {
  return apiGet<Paginated<RequisicaoDto>>(endpoints.requisicoes.list, { params: toQuery(params) });
}

export function getRequisicao(id: string): Promise<RequisicaoDto> {
  return apiGet<RequisicaoDto>(endpoints.requisicoes.detail(id));
}

export function createRequisicao(payload: RequisicaoPayload): Promise<RequisicaoDto> {
  return apiPost<RequisicaoDto>(endpoints.requisicoes.list, payload);
}
