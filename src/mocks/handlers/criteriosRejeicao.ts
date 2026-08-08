import { http, HttpResponse } from "msw";
import { criteriosRejeicaoFixtures } from "@/mocks/fixtures/criteriosRejeicao";
import type { CriterioRejeicaoDto, CriterioRejeicaoPayload } from "@/types/dto/criterioRejeicao";

const BASE = "*/api/criterios-rejeicao";

export const criteriosRejeicaoHandlers = [
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const laboratorioId = url.searchParams.get("laboratorio_id");

    let rows = [...criteriosRejeicaoFixtures].sort((a, b) => a.codigo.localeCompare(b.codigo));
    if (laboratorioId) rows = rows.filter((c) => c.laboratorioId === laboratorioId || c.laboratorioId === null);

    return HttpResponse.json(rows);
  }),

  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as CriterioRejeicaoPayload;
    const created: CriterioRejeicaoDto = {
      id: `crit-${Date.now()}`,
      laboratorioId: payload.laboratorioId ?? null,
      codigo: payload.codigo,
      motivo: payload.motivo,
    };
    criteriosRejeicaoFixtures.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = criteriosRejeicaoFixtures.findIndex((c) => c.id === id);
    if (index === -1) return HttpResponse.json({ message: "Critério não encontrado." }, { status: 404 });
    criteriosRejeicaoFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default criteriosRejeicaoHandlers;
