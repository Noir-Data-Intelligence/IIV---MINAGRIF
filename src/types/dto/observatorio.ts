import type { AmostraStatus } from "@/types/dto/amostra";
import type { EstacaoDto } from "@/types/dto/estacao";

/**
 * DTO de Colheita do Observatório — subconjunto geo-relevante de `Amostra`
 * devolvido por `GET /observatorio/mapa`, espelha
 * `App\Http\Resources\ObservatorioColheitaResource` (Onda 11, Fase 1).
 * Não é o `AmostraDto` completo (sem boletim/rejeição, irrelevantes numa
 * vista de mapa).
 */
export interface ObservatorioColheitaDto {
  amostraId: string;
  numero: string;
  tipoAmostra: string;
  latitude: number;
  longitude: number;
  status: AmostraStatus;
  recebidaEm: string;
  requisicaoId: string;
  laboratorioId: string | null;
  laboratorioNome: string | null;
}

/**
 * Resposta de `GET /observatorio/mapa` — só estações e colheitas com
 * coordenadas registadas (lat/lng não nulos). Fases 2 (indicadores
 * sanitários territoriais) e 3 (zonas/focos, vigilância em tempo real)
 * ficam deliberadamente por construir (ver SIG-IIV-MEMORIA-PROJETO.md
 * secção 15).
 */
export interface ObservatorioMapaDto {
  estacoes: EstacaoDto[];
  colheitas: ObservatorioColheitaDto[];
}
