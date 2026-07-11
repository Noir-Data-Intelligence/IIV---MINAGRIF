import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type { Paginated } from "@/types/dto/paginated";
import type {
  AnimalDto,
  AnimalEventDto,
  AnimalListParams,
  HealthRecordDto,
} from "@/types/dto/animal";

/**
 * Serviço de dados do módulo Animais (+ sub-entidades eventos e saúde).
 *
 * Segue o padrão de `departamentos.ts`. Rotas declaradas localmente (ROUTES)
 * porque `endpoints.ts` está a ser editado noutro processo. Os eventos e os
 * registos sanitários são recursos aninhados sob `/animais/{id}`.
 */
const ROUTES = {
  list: "/animais",
  detail: (id: string) => `/animais/${id}`,
  events: (animalId: string) => `/animais/${animalId}/eventos`,
  health: (animalId: string) => `/animais/${animalId}/saude`,
};

function toQuery(params: AnimalListParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    page: params.page ?? 1,
    per_page: params.perPage ?? 20,
  };
  if (params.search) query.search = params.search;
  if (params.stationId) query.station_id = params.stationId;
  if (params.status) query.status = params.status;
  if (params.species) query.species = params.species;
  return query;
}

export function listAnimais(params: AnimalListParams): Promise<Paginated<AnimalDto>> {
  return apiGet<Paginated<AnimalDto>>(ROUTES.list, { params: toQuery(params) });
}

export function createAnimal(payload: Partial<AnimalDto>): Promise<AnimalDto> {
  return apiPost<AnimalDto>(ROUTES.list, payload);
}

export function updateAnimal(id: string, payload: Partial<AnimalDto>): Promise<AnimalDto> {
  return apiPut<AnimalDto>(ROUTES.detail(id), payload);
}

export function deleteAnimal(id: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(id));
}

// ---- Sub-entidade: eventos ----
export function listAnimalEvents(animalId: string): Promise<AnimalEventDto[]> {
  return apiGet<AnimalEventDto[]>(ROUTES.events(animalId));
}

export function createAnimalEvent(
  animalId: string,
  payload: Partial<AnimalEventDto>,
): Promise<AnimalEventDto> {
  return apiPost<AnimalEventDto>(ROUTES.events(animalId), payload);
}

// ---- Sub-entidade: registos sanitários ----
export function listHealthRecords(animalId: string): Promise<HealthRecordDto[]> {
  return apiGet<HealthRecordDto[]>(ROUTES.health(animalId));
}

export function createHealthRecord(
  animalId: string,
  payload: Partial<HealthRecordDto>,
): Promise<HealthRecordDto> {
  return apiPost<HealthRecordDto>(ROUTES.health(animalId), payload);
}
