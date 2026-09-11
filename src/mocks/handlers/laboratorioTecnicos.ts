import { http, HttpResponse } from "msw";
import { laboratorioTecnicosFixtures } from "@/mocks/fixtures/laboratorioTecnicos";
import { usersFixtures } from "@/mocks/fixtures/users";
import type { LaboratorioTecnicoDto } from "@/types/dto/laboratorioTecnico";

/**
 * Handlers MSW da equipa de Técnicos por laboratório.
 * Opera sobre `laboratorioTecnicosFixtures` (objecto mutável em memória),
 * resolvendo `fullName`/`email` a partir de `usersFixtures` (join simulado).
 */
const BASE = "*/api/laboratorios/:laboratorioId/tecnicos";

function resolve(laboratorioId: string, userId: string, funcao: string | null): LaboratorioTecnicoDto | null {
  const user = usersFixtures.find((u) => u.id === userId);
  if (!user) return null;
  return { userId: user.id, fullName: user.fullName, email: user.email, funcao };
}

export const laboratorioTecnicosHandlers = [
  http.get(BASE, ({ params }) => {
    const { laboratorioId } = params as { laboratorioId: string };
    const rows = laboratorioTecnicosFixtures[laboratorioId] ?? [];
    const data = rows
      .map((r) => resolve(laboratorioId, r.userId, r.funcao))
      .filter((r): r is LaboratorioTecnicoDto => r !== null);
    return HttpResponse.json(data);
  }),

  http.post(BASE, async ({ params, request }) => {
    const { laboratorioId } = params as { laboratorioId: string };
    const payload = (await request.json().catch(() => ({}))) as { userId?: string; funcao?: string | null };
    if (!payload.userId) {
      return HttpResponse.json({ message: "userId é obrigatório." }, { status: 422 });
    }
    const rows = laboratorioTecnicosFixtures[laboratorioId] ?? [];
    const existing = rows.find((r) => r.userId === payload.userId);
    if (existing) {
      existing.funcao = payload.funcao ?? existing.funcao;
    } else {
      rows.push({ userId: payload.userId, funcao: payload.funcao ?? null });
    }
    laboratorioTecnicosFixtures[laboratorioId] = rows;
    const created = resolve(laboratorioId, payload.userId, payload.funcao ?? existing?.funcao ?? null);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${BASE}/:userId`, ({ params }) => {
    const { laboratorioId, userId } = params as { laboratorioId: string; userId: string };
    const rows = laboratorioTecnicosFixtures[laboratorioId] ?? [];
    laboratorioTecnicosFixtures[laboratorioId] = rows.filter((r) => r.userId !== userId);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default laboratorioTecnicosHandlers;
