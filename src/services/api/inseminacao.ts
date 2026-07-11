import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api/client";
import type {
  BreederDto,
  DoseDto,
  IACenterDto,
  InsemDto,
  TankDto,
} from "@/types/dto/inseminacao";

/**
 * Serviço de dados do módulo Inseminação Artificial (5 sub-recursos).
 *
 * Segue o padrão de `animais.ts`. Rotas declaradas localmente (ROUTES) porque
 * `endpoints.ts` está a ser editado noutro processo. Os sub-recursos vivem sob
 * o prefixo `/inseminacao/{centros|reprodutores|tanques|doses|registos}`.
 *
 * As listagens devolvem arrays simples (não paginadas): a página apresenta cada
 * entidade num separador sem paginação, tal como o ecrã Supabase original.
 */
const ROUTES = {
  centros: "/inseminacao/centros",
  centro: (id: string) => `/inseminacao/centros/${id}`,
  reprodutores: "/inseminacao/reprodutores",
  reprodutor: (id: string) => `/inseminacao/reprodutores/${id}`,
  tanques: "/inseminacao/tanques",
  tanque: (id: string) => `/inseminacao/tanques/${id}`,
  doses: "/inseminacao/doses",
  dose: (id: string) => `/inseminacao/doses/${id}`,
  registos: "/inseminacao/registos",
  registo: (id: string) => `/inseminacao/registos/${id}`,
};

// ---- Centros ----
export const listCentros = () => apiGet<IACenterDto[]>(ROUTES.centros);
export const createCentro = (payload: Partial<IACenterDto>) =>
  apiPost<IACenterDto>(ROUTES.centros, payload);
export const updateCentro = (id: string, payload: Partial<IACenterDto>) =>
  apiPut<IACenterDto>(ROUTES.centro(id), payload);
export const deleteCentro = (id: string) => apiDelete<void>(ROUTES.centro(id));

// ---- Reprodutores ----
export const listReprodutores = () => apiGet<BreederDto[]>(ROUTES.reprodutores);
export const createReprodutor = (payload: Partial<BreederDto>) =>
  apiPost<BreederDto>(ROUTES.reprodutores, payload);
export const updateReprodutor = (id: string, payload: Partial<BreederDto>) =>
  apiPut<BreederDto>(ROUTES.reprodutor(id), payload);
export const deleteReprodutor = (id: string) => apiDelete<void>(ROUTES.reprodutor(id));

// ---- Tanques ----
export const listTanques = () => apiGet<TankDto[]>(ROUTES.tanques);
export const createTanque = (payload: Partial<TankDto>) =>
  apiPost<TankDto>(ROUTES.tanques, payload);
export const updateTanque = (id: string, payload: Partial<TankDto>) =>
  apiPut<TankDto>(ROUTES.tanque(id), payload);
export const deleteTanque = (id: string) => apiDelete<void>(ROUTES.tanque(id));

// ---- Doses ----
export const listDoses = () => apiGet<DoseDto[]>(ROUTES.doses);
export const createDose = (payload: Partial<DoseDto>) => apiPost<DoseDto>(ROUTES.doses, payload);
export const updateDose = (id: string, payload: Partial<DoseDto>) =>
  apiPut<DoseDto>(ROUTES.dose(id), payload);
export const deleteDose = (id: string) => apiDelete<void>(ROUTES.dose(id));

// ---- Registos de inseminação ----
export const listRegistos = () => apiGet<InsemDto[]>(ROUTES.registos);
export const createRegisto = (payload: Partial<InsemDto>) =>
  apiPost<InsemDto>(ROUTES.registos, payload);
export const updateRegisto = (id: string, payload: Partial<InsemDto>) =>
  apiPut<InsemDto>(ROUTES.registo(id), payload);
export const deleteRegisto = (id: string) => apiDelete<void>(ROUTES.registo(id));
