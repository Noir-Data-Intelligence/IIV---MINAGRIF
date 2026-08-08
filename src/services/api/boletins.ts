import { apiGet, apiPost, apiPut } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { Paginated } from "@/types/dto/paginated";
import type { BoletimInternoDto, BoletimListParams } from "@/types/dto/boletim";

/**
 * Serviço de dados do módulo Boletins (Onda 3 — Laboratório). `validar`
 * regista uma assinatura de validação — ao atingir o número de validadores
 * exigido pela disciplina (`laboratorios.validadorCount`), o backend aprova
 * automaticamente o boletim (RN "validação dupla/tripla").
 */
function toQuery(params: BoletimListParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.status) query.status = params.status;
  return query;
}

export function listBoletins(params: BoletimListParams): Promise<Paginated<BoletimInternoDto>> {
  return apiGet<Paginated<BoletimInternoDto>>(endpoints.boletins.list, { params: toQuery(params) });
}

export function getBoletim(id: string): Promise<BoletimInternoDto> {
  return apiGet<BoletimInternoDto>(endpoints.boletins.detail(id));
}

export function registarResultado(id: string, resultado: Record<string, unknown>): Promise<BoletimInternoDto> {
  return apiPut<BoletimInternoDto>(endpoints.boletins.resultado(id), { resultado });
}

export function validarBoletim(id: string): Promise<BoletimInternoDto> {
  return apiPost<BoletimInternoDto>(endpoints.boletins.validar(id));
}

export function comunicarBoletim(id: string): Promise<BoletimInternoDto> {
  return apiPost<BoletimInternoDto>(endpoints.boletins.comunicar(id));
}
