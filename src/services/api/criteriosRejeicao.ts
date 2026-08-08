import { apiDelete, apiGet, apiPost } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { CriterioRejeicaoDto, CriterioRejeicaoPayload } from "@/types/dto/criterioRejeicao";

/** Serviço de dados do catálogo de Critérios de Rejeição (Onda 3 — Laboratório). */
export function listCriteriosRejeicao(laboratorioId?: string): Promise<CriterioRejeicaoDto[]> {
  return apiGet<CriterioRejeicaoDto[]>(endpoints.criteriosRejeicao.list, {
    params: laboratorioId ? { laboratorio_id: laboratorioId } : undefined,
  });
}

export function createCriterioRejeicao(payload: CriterioRejeicaoPayload): Promise<CriterioRejeicaoDto> {
  return apiPost<CriterioRejeicaoDto>(endpoints.criteriosRejeicao.list, payload);
}

export function deleteCriterioRejeicao(id: string): Promise<void> {
  return apiDelete<void>(endpoints.criteriosRejeicao.detail(id));
}
