import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type { TrainingDto, TrainingListParams } from "@/types/dto/formacoes";

/**
 * Serviço de dados do módulo Formações.
 *
 * Assenta nos helpers de `client.ts` e nunca conhece o axios nem o MSW
 * directamente — os hooks só falam com estas funções.
 *
 * Rotas declaradas localmente (ver nota em `recursosHumanos.ts`) — consolidar em
 * `endpoints.ts` (entrada `formacoes`) no final.
 */
const ROUTES = {
  formacoes: "/formacoes",
  formacao: (id: string) => `/formacoes/${id}`,
};

function toQuery(params: TrainingListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  return query;
}

export function listTrainings(params: TrainingListParams): Promise<Paginated<TrainingDto>> {
  return apiGet<Paginated<TrainingDto>>(ROUTES.formacoes, { params: toQuery(params) });
}

export function createTraining(payload: Partial<TrainingDto>): Promise<TrainingDto> {
  return apiPost<TrainingDto>(ROUTES.formacoes, payload);
}

export function updateTraining(id: string, payload: Partial<TrainingDto>): Promise<TrainingDto> {
  return apiPut<TrainingDto>(ROUTES.formacao(id), payload);
}

export function deleteTraining(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.formacao(id));
}
