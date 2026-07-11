import { http, HttpResponse } from "msw";
import {
  processTypesFixtures,
  processTypeStepsFixtures,
} from "@/mocks/fixtures/processTypes";
import type { ProcessTypeDto, ProcessTypeStepDto } from "@/types/dto/processType";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Tipos de Processo (+ sub-recurso etapas-padrão).
 *
 * Modelado em `mocks/handlers/animais.ts`. As rotas do sub-recurso aninhado
 * (`/processos-tipos/:typeId/etapas`) são registadas ANTES das rotas de detalhe
 * do tipo, para que a especificidade dos paths seja respeitada pelo MSW.
 * Todos operam sobre os arrays mutáveis em memória.
 */
const BASE = "*/api/processos-tipos";

export const processTypesHandlers = [
  // ---- Sub-recurso: etapas-padrão ----
  // GET /processos-tipos/:typeId/etapas -> lista ordenada por orderIndex
  http.get(`${BASE}/:typeId/etapas`, ({ params }) => {
    const { typeId } = params as { typeId: string };
    const rows = processTypeStepsFixtures
      .filter((s) => s.processTypeId === typeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return HttpResponse.json(rows);
  }),

  // POST /processos-tipos/:typeId/etapas -> adiciona no fim (orderIndex = nº actual + 1)
  http.post(`${BASE}/:typeId/etapas`, async ({ params, request }) => {
    const { typeId } = params as { typeId: string };
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessTypeStepDto>;
    const existing = processTypeStepsFixtures.filter((s) => s.processTypeId === typeId);
    const created: ProcessTypeStepDto = {
      id: `pstep-${Date.now()}`,
      processTypeId: typeId,
      orderIndex: payload.orderIndex ?? existing.length + 1,
      name: payload.name ?? "Nova etapa",
      defaultRole: payload.defaultRole ?? null,
      slaDays: payload.slaDays ?? null,
    };
    processTypeStepsFixtures.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // POST /processos-tipos/:typeId/etapas/reordenar -> aplica nova ordem por lista de ids
  http.post(`${BASE}/:typeId/etapas/reordenar`, async ({ params, request }) => {
    const { typeId } = params as { typeId: string };
    const { orderedIds } = (await request.json().catch(() => ({}))) as { orderedIds?: string[] };
    if (Array.isArray(orderedIds)) {
      orderedIds.forEach((id, i) => {
        const step = processTypeStepsFixtures.find(
          (s) => s.id === id && s.processTypeId === typeId,
        );
        if (step) step.orderIndex = i + 1;
      });
    }
    const rows = processTypeStepsFixtures
      .filter((s) => s.processTypeId === typeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return HttpResponse.json(rows);
  }),

  // PUT /processos-tipos/:typeId/etapas/:stepId -> actualiza etapa
  http.put(`${BASE}/:typeId/etapas/:stepId`, async ({ params, request }) => {
    const { stepId } = params as { typeId: string; stepId: string };
    const index = processTypeStepsFixtures.findIndex((s) => s.id === stepId);
    if (index === -1) {
      return HttpResponse.json({ message: "Etapa não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessTypeStepDto>;
    const updated: ProcessTypeStepDto = {
      ...processTypeStepsFixtures[index],
      ...payload,
      id: processTypeStepsFixtures[index].id,
      processTypeId: processTypeStepsFixtures[index].processTypeId,
    };
    processTypeStepsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /processos-tipos/:typeId/etapas/:stepId -> remove etapa
  http.delete(`${BASE}/:typeId/etapas/:stepId`, ({ params }) => {
    const { stepId } = params as { typeId: string; stepId: string };
    const index = processTypeStepsFixtures.findIndex((s) => s.id === stepId);
    if (index === -1) {
      return HttpResponse.json({ message: "Etapa não encontrada." }, { status: 404 });
    }
    processTypeStepsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Recurso principal: tipos de processo ----
  // GET /processos-tipos -> lista paginada + filtrada, ordenada por nome
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const activeOnly = url.searchParams.get("active_only") === "true";

    let rows = [...processTypesFixtures].sort((a, b) => a.name.localeCompare(b.name));

    if (activeOnly) rows = rows.filter((t) => t.isActive);
    if (search) {
      rows = rows.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          (t.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<ProcessTypeDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /processos-tipos -> cria em memória
  http.post(BASE, async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessTypeDto>;
    const created: ProcessTypeDto = {
      id: `ptype-${Date.now()}`,
      name: payload.name ?? "Sem nome",
      description: payload.description ?? null,
      icon: payload.icon ?? null,
      slaDays: payload.slaDays ?? null,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
    };
    processTypesFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /processos-tipos/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = processTypesFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Tipo de processo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessTypeDto>;
    const updated: ProcessTypeDto = {
      ...processTypesFixtures[index],
      ...payload,
      id: processTypesFixtures[index].id,
      createdAt: processTypesFixtures[index].createdAt,
    };
    processTypesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /processos-tipos/:id -> remove o tipo e as suas etapas-padrão
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = processTypesFixtures.findIndex((t) => t.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Tipo de processo não encontrado." }, { status: 404 });
    }
    processTypesFixtures.splice(index, 1);
    // Remove em cascata as etapas-padrão associadas.
    for (let i = processTypeStepsFixtures.length - 1; i >= 0; i--) {
      if (processTypeStepsFixtures[i].processTypeId === id) {
        processTypeStepsFixtures.splice(i, 1);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

export default processTypesHandlers;
