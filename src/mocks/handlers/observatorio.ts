import { http, HttpResponse } from "msw";
import { amostrasFixtures } from "@/mocks/fixtures/amostras";
import { estacoesFixtures } from "@/mocks/fixtures/estacoes";
import { requisicoesFixtures } from "@/mocks/fixtures/requisicoes";
import { laboratoriosFixtures } from "@/mocks/fixtures/laboratorios";
import type { ObservatorioColheitaDto, ObservatorioMapaDto } from "@/types/dto/observatorio";

/**
 * Handler MSW do Observatório Veterinário Nacional (Onda 11, Fase 1) — um
 * único endpoint de leitura que agrega estações e colheitas já
 * georreferenciadas (lat/lng não nulos), espelhando
 * `ObservatorioController::mapa()`.
 */
const BASE = "*/api/observatorio/mapa";

export const observatorioHandlers = [
  http.get(BASE, () => {
    const estacoes = estacoesFixtures.filter((e) => e.latitude != null && e.longitude != null);

    const colheitas: ObservatorioColheitaDto[] = amostrasFixtures
      .filter((a) => a.latitude != null && a.longitude != null)
      .sort((a, b) => b.recebidaEm.localeCompare(a.recebidaEm))
      .map((a) => {
        const requisicao = requisicoesFixtures.find((r) => r.id === a.requisicaoId) ?? null;
        const laboratorio = requisicao
          ? laboratoriosFixtures.find((l) => l.id === requisicao.laboratorioId) ?? null
          : null;
        return {
          amostraId: a.id,
          numero: a.numero,
          tipoAmostra: a.tipoAmostra,
          latitude: a.latitude as number,
          longitude: a.longitude as number,
          status: a.status,
          recebidaEm: a.recebidaEm,
          requisicaoId: a.requisicaoId,
          laboratorioId: requisicao?.laboratorioId ?? null,
          laboratorioNome: laboratorio?.name ?? null,
        };
      });

    const body: ObservatorioMapaDto = { estacoes, colheitas };
    return HttpResponse.json(body);
  }),
];

export default observatorioHandlers;
