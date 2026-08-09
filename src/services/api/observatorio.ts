import { apiGet } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import type { ObservatorioMapaDto } from "@/types/dto/observatorio";

/**
 * Serviço de dados do Observatório Veterinário Nacional (Onda 11, Fase 1) —
 * um único endpoint de leitura, sem CRUD.
 */
export function getObservatorioMapa(): Promise<ObservatorioMapaDto> {
  return apiGet<ObservatorioMapaDto>(endpoints.observatorio.mapa);
}
