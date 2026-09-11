import { apiDelete, apiGet, apiPost } from "@/services/api/client";
import type { AddLaboratorioTecnicoPayload, LaboratorioTecnicoDto } from "@/types/dto/laboratorioTecnico";

/**
 * Serviço de dados da equipa de Técnicos por laboratório.
 * Replica o padrão de `laboratorios.ts`: assenta nos helpers de `client.ts`
 * e nunca conhece o axios nem o MSW directamente.
 */
const ROUTES = {
  list: (laboratorioId: string) => `/laboratorios/${laboratorioId}/tecnicos`,
  detail: (laboratorioId: string, userId: string) => `/laboratorios/${laboratorioId}/tecnicos/${userId}`,
};

export function listLaboratorioTecnicos(laboratorioId: string): Promise<LaboratorioTecnicoDto[]> {
  return apiGet<LaboratorioTecnicoDto[]>(ROUTES.list(laboratorioId));
}

export function addLaboratorioTecnico(
  laboratorioId: string,
  payload: AddLaboratorioTecnicoPayload,
): Promise<LaboratorioTecnicoDto> {
  return apiPost<LaboratorioTecnicoDto>(ROUTES.list(laboratorioId), payload);
}

export function removeLaboratorioTecnico(laboratorioId: string, userId: string): Promise<void> {
  return apiDelete<void>(ROUTES.detail(laboratorioId, userId));
}
