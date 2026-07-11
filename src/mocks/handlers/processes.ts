import { http, HttpResponse } from "msw";
import {
  processEventsFixtures,
  processesFixtures,
  processStepsFixtures,
} from "@/mocks/fixtures/processes";
import { processAttachmentsFixtures } from "@/mocks/fixtures/processAttachments";
import { processTypeStepsFixtures } from "@/mocks/fixtures/processTypes";
import { documentosFixtures } from "@/mocks/fixtures/documentos";
import type {
  CreateProcessEventInput,
  CreateProcessInput,
  ProcessDto,
  ProcessEventDto,
  ProcessStepDto,
  ProcessTransitionInput,
  UpdateProcessStepInput,
} from "@/types/dto/process";
import type {
  CreateProcessAttachmentInput,
  ProcessAttachmentDto,
} from "@/types/dto/processAttachment";
import type { Paginated } from "@/types/dto/paginated";

/**
 * Handlers MSW do módulo Processos (+ sub-recursos etapas e eventos).
 *
 * Modelado em `mocks/handlers/animais.ts`. As rotas mais específicas
 * (`/processos/stats`, `/processos/:id/etapas`, `/processos/:id/eventos`) são
 * registadas ANTES de `/processos/:id` para a especificidade ser respeitada
 * (senão "stats" seria capturado como um :id). Todos operam sobre os arrays
 * mutáveis em memória.
 *
 * O POST /processos replica, do lado do servidor, o fluxo que o código Supabase
 * antigo fazia no cliente: cria o processo, instancia as etapas a partir do
 * tipo, activa a primeira (status "em_curso") e regista o evento "aberto".
 */
const BASE = "*/api/processos";
const DAY_MS = 86_400_000;

function generateCode(): string {
  const year = new Date().getFullYear();
  const seq = String(processesFixtures.length + 1).padStart(4, "0");
  return `PRC-${year}-${seq}`;
}

/** Etapas de um processo ordenadas por `orderIndex`. */
function stepsOf(processId: string): ProcessStepDto[] {
  return processStepsFixtures
    .filter((s) => s.processId === processId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Etapa activa: a apontada por `currentStepId`, ou a primeira "em_curso". */
function currentStepOf(process: ProcessDto, steps: ProcessStepDto[]): ProcessStepDto | undefined {
  return (
    steps.find((s) => s.id === process.currentStepId) ??
    steps.find((s) => s.status === "em_curso")
  );
}

/** Regista um evento no historial (topo da lista). */
function pushEvent(
  processId: string,
  actorId: string | null,
  eventType: string,
  payload: Record<string, unknown> | null,
): ProcessEventDto {
  const event: ProcessEventDto = {
    id: `prev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    processId,
    actorId,
    eventType,
    payload,
    createdAt: new Date().toISOString(),
  };
  processEventsFixtures.unshift(event);
  return event;
}

/** Resume um documento ligado (para embeber num anexo), ou null. */
function documentSummary(documentId: string | null): ProcessAttachmentDto["document"] {
  if (!documentId) return null;
  const doc = documentosFixtures.find((d) => d.id === documentId);
  return doc ? { id: doc.id, title: doc.title, currentVersionId: doc.currentVersionId } : null;
}

export const processesHandlers = [
  // GET /processos/stats -> KPIs agregados
  http.get(`${BASE}/stats`, () => {
    const today = new Date().toISOString().slice(0, 10);
    const abertos = processesFixtures.filter((p) => p.status === "aberto").length;
    const emCurso = processesFixtures.filter((p) => p.status === "em_curso").length;
    const concluidos = processesFixtures.filter((p) => p.status === "concluido").length;
    const atrasados = processesFixtures.filter(
      (p) =>
        (p.status === "aberto" || p.status === "em_curso") &&
        p.dueDate !== null &&
        p.dueDate < today,
    ).length;
    return HttpResponse.json({ abertos, emCurso, concluidos, atrasados });
  }),

  // GET /processos/:id/etapas -> etapas instanciadas do processo
  http.get(`${BASE}/:id/etapas`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = processStepsFixtures
      .filter((s) => s.processId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return HttpResponse.json(rows);
  }),

  // GET /processos/:id/eventos -> historial de eventos do processo
  http.get(`${BASE}/:id/eventos`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = processEventsFixtures
      .filter((e) => e.processId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(rows);
  }),

  // GET /processos/:id/anexos -> anexos do processo (com resumo do doc ligado)
  http.get(`${BASE}/:id/anexos`, ({ params }) => {
    const { id } = params as { id: string };
    const rows = processAttachmentsFixtures
      .filter((a) => a.processId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => ({ ...a, document: documentSummary(a.documentId) }));
    return HttpResponse.json(rows);
  }),

  // GET /processos/:id -> detalhe de um processo
  http.get(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const found = processesFixtures.find((p) => p.id === id);
    if (!found) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  // GET /processos -> lista paginada + filtrada, ordenada por data de abertura desc
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("per_page") ?? "20") || 20;
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const status = url.searchParams.get("status") ?? "";
    const typeId = url.searchParams.get("type_id") ?? "";
    const requesterId = url.searchParams.get("requester_id") ?? "";

    let rows = [...processesFixtures].sort((a, b) => b.openedAt.localeCompare(a.openedAt));

    if (status) rows = rows.filter((p) => p.status === status);
    if (typeId) rows = rows.filter((p) => p.typeId === typeId);
    if (requesterId) rows = rows.filter((p) => p.requesterId === requesterId);
    if (search) {
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          (p.description ?? "").toLowerCase().includes(search),
      );
    }

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const data = rows.slice(start, start + perPage);

    const body: Paginated<ProcessDto> = {
      data,
      meta: { currentPage: page, perPage, total, lastPage },
    };
    return HttpResponse.json(body);
  }),

  // POST /processos -> cria o processo, instancia etapas do tipo e regista abertura
  http.post(BASE, async ({ request }) => {
    const input = (await request.json().catch(() => ({}))) as Partial<CreateProcessInput>;
    const now = new Date().toISOString();
    const processId = `proc-${Date.now()}`;

    const created: ProcessDto = {
      id: processId,
      code: generateCode(),
      typeId: input.typeId ?? "",
      title: input.title ?? "Sem título",
      description: input.description ?? null,
      requesterId: input.requesterId ?? "",
      status: "aberto",
      priority: input.priority ?? "normal",
      dueDate: input.dueDate ?? null,
      openedAt: now,
      closedAt: null,
      currentStepId: null,
      linkedEntityType: input.linkedEntityType ?? null,
      linkedEntityId: input.linkedEntityId ?? null,
      createdAt: now,
    };

    // Instancia as etapas a partir das etapas-padrão do tipo.
    const typeSteps = processTypeStepsFixtures
      .filter((s) => s.processTypeId === created.typeId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const newSteps: ProcessStepDto[] = typeSteps.map((s, i) => ({
      id: `prstep-${Date.now()}-${i}`,
      processId,
      typeStepId: s.id,
      orderIndex: s.orderIndex,
      name: s.name,
      assigneeRole: s.defaultRole,
      status: i === 0 ? "em_curso" : "pendente",
      startedAt: i === 0 ? now : null,
      dueAt: s.slaDays ? new Date(Date.now() + s.slaDays * DAY_MS).toISOString() : null,
      completedAt: null,
      notes: null,
      createdAt: now,
    }));

    if (newSteps.length > 0) {
      processStepsFixtures.push(...newSteps);
      created.currentStepId = newSteps[0].id;
      created.status = "em_curso";
    }

    processesFixtures.unshift(created);

    // Regista o evento de abertura.
    const openedEvent: ProcessEventDto = {
      id: `prev-${Date.now()}`,
      processId,
      actorId: created.requesterId || null,
      eventType: "aberto",
      payload: {
        title: created.title,
        ...(created.linkedEntityType ? { source: created.linkedEntityType } : {}),
      },
      createdAt: now,
    };
    processEventsFixtures.unshift(openedEvent);

    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /processos/:id -> actualiza em memória
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = processesFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as Partial<ProcessDto>;
    const updated: ProcessDto = {
      ...processesFixtures[index],
      ...payload,
      id: processesFixtures[index].id,
      code: processesFixtures[index].code,
      createdAt: processesFixtures[index].createdAt,
    };
    processesFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /processos/:id -> remove o processo e as suas sub-entidades
  http.delete(`${BASE}/:id`, ({ params }) => {
    const { id } = params as { id: string };
    const index = processesFixtures.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    processesFixtures.splice(index, 1);
    for (let i = processStepsFixtures.length - 1; i >= 0; i--) {
      if (processStepsFixtures[i].processId === id) processStepsFixtures.splice(i, 1);
    }
    for (let i = processEventsFixtures.length - 1; i >= 0; i--) {
      if (processEventsFixtures[i].processId === id) processEventsFixtures.splice(i, 1);
    }
    for (let i = processAttachmentsFixtures.length - 1; i >= 0; i--) {
      if (processAttachmentsFixtures[i].processId === id) processAttachmentsFixtures.splice(i, 1);
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // PUT /processos/:id/etapas/:stepId -> actualiza uma etapa (parecer/estado)
  http.put(`${BASE}/:id/etapas/:stepId`, async ({ params, request }) => {
    const { id, stepId } = params as { id: string; stepId: string };
    const index = processStepsFixtures.findIndex(
      (s) => s.id === stepId && s.processId === id,
    );
    if (index === -1) {
      return HttpResponse.json({ message: "Etapa não encontrada." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as UpdateProcessStepInput;
    const updated: ProcessStepDto = {
      ...processStepsFixtures[index],
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.startedAt !== undefined ? { startedAt: payload.startedAt } : {}),
      ...(payload.completedAt !== undefined ? { completedAt: payload.completedAt } : {}),
    };
    processStepsFixtures[index] = updated;
    return HttpResponse.json(updated);
  }),

  // POST /processos/:id/eventos -> regista um evento avulso (ex: comentário)
  http.post(`${BASE}/:id/eventos`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!processesFixtures.some((p) => p.id === id)) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as CreateProcessEventInput;
    const created = pushEvent(
      id,
      payload.actorId ?? null,
      payload.eventType ?? "comentario",
      payload.payload ?? null,
    );
    return HttpResponse.json(created, { status: 201 });
  }),

  // POST /processos/:id/avancar -> conclui a etapa actual e activa a próxima
  http.post(`${BASE}/:id/avancar`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const pIndex = processesFixtures.findIndex((p) => p.id === id);
    if (pIndex === -1) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const process = processesFixtures[pIndex];
    const steps = stepsOf(id);
    const current = currentStepOf(process, steps);
    if (!current) {
      return HttpResponse.json({ message: "Sem etapa activa." }, { status: 409 });
    }
    const payload = (await request.json().catch(() => ({}))) as ProcessTransitionInput;
    const now = new Date().toISOString();
    const notes = payload.notes?.trim() ? payload.notes.trim() : null;

    // Conclui a etapa actual.
    const curIdx = processStepsFixtures.findIndex((s) => s.id === current.id);
    processStepsFixtures[curIdx] = {
      ...current,
      status: "concluida",
      completedAt: now,
      notes: notes ?? current.notes,
    };

    // Próxima etapa ainda por concluir.
    const next = steps.find(
      (s) => s.orderIndex > current.orderIndex && s.status !== "concluida",
    );

    if (next) {
      const nextIdx = processStepsFixtures.findIndex((s) => s.id === next.id);
      processStepsFixtures[nextIdx] = { ...next, status: "em_curso", startedAt: now };
      processesFixtures[pIndex] = { ...process, currentStepId: next.id, status: "em_curso" };
      pushEvent(id, payload.actorId ?? null, "avancado", {
        step: current.name,
        next: next.name,
        ...(notes ? { notes } : {}),
      });
    } else {
      // Não há mais etapas: fecha o processo.
      processesFixtures[pIndex] = {
        ...process,
        status: "concluido",
        closedAt: now,
        currentStepId: null,
      };
      pushEvent(id, payload.actorId ?? null, "fechado", {
        step: current.name,
        ...(notes ? { notes } : {}),
      });
    }
    return HttpResponse.json(processesFixtures[pIndex]);
  }),

  // POST /processos/:id/devolver -> devolve à etapa anterior
  http.post(`${BASE}/:id/devolver`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const pIndex = processesFixtures.findIndex((p) => p.id === id);
    if (pIndex === -1) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const process = processesFixtures[pIndex];
    const steps = stepsOf(id);
    const current = currentStepOf(process, steps);
    if (!current) {
      return HttpResponse.json({ message: "Sem etapa activa." }, { status: 409 });
    }
    const prev = [...steps]
      .reverse()
      .find((s) => s.orderIndex < current.orderIndex);
    if (!prev) {
      return HttpResponse.json({ message: "Sem etapa anterior." }, { status: 409 });
    }
    const payload = (await request.json().catch(() => ({}))) as ProcessTransitionInput;
    const now = new Date().toISOString();
    const notes = payload.notes?.trim() ? payload.notes.trim() : null;

    const curIdx = processStepsFixtures.findIndex((s) => s.id === current.id);
    processStepsFixtures[curIdx] = {
      ...current,
      status: "devolvida",
      notes: notes ?? current.notes,
    };
    const prevIdx = processStepsFixtures.findIndex((s) => s.id === prev.id);
    processStepsFixtures[prevIdx] = {
      ...prev,
      status: "em_curso",
      startedAt: now,
      completedAt: null,
    };
    processesFixtures[pIndex] = { ...process, currentStepId: prev.id, status: "em_curso" };
    pushEvent(id, payload.actorId ?? null, "devolvido", {
      step: current.name,
      to: prev.name,
      ...(notes ? { notes } : {}),
    });
    return HttpResponse.json(processesFixtures[pIndex]);
  }),

  // POST /processos/:id/cancelar -> cancela o processo
  http.post(`${BASE}/:id/cancelar`, async ({ params, request }) => {
    const { id } = params as { id: string };
    const pIndex = processesFixtures.findIndex((p) => p.id === id);
    if (pIndex === -1) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as ProcessTransitionInput;
    const now = new Date().toISOString();
    const reason = payload.notes?.trim() ? payload.notes.trim() : null;
    processesFixtures[pIndex] = {
      ...processesFixtures[pIndex],
      status: "cancelado",
      closedAt: now,
    };
    pushEvent(id, payload.actorId ?? null, "cancelado", reason ? { reason } : null);
    return HttpResponse.json(processesFixtures[pIndex]);
  }),

  // POST /processos/:id/anexos -> anexa documento existente ou upload simulado
  http.post(`${BASE}/:id/anexos`, async ({ params, request }) => {
    const { id } = params as { id: string };
    if (!processesFixtures.some((p) => p.id === id)) {
      return HttpResponse.json({ message: "Processo não encontrado." }, { status: 404 });
    }
    const payload = (await request.json().catch(() => ({}))) as CreateProcessAttachmentInput;
    const documentId = payload.documentId ?? null;
    const created: ProcessAttachmentDto = {
      id: `patt-${Date.now()}`,
      processId: id,
      label: payload.label?.trim() || "Anexo",
      filePath: documentId ? null : payload.filePath ?? null,
      documentId,
      uploadedBy: payload.uploadedBy ?? null,
      createdAt: new Date().toISOString(),
      document: documentSummary(documentId),
    };
    processAttachmentsFixtures.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // DELETE /processos/:id/anexos/:attachmentId -> remove um anexo
  http.delete(`${BASE}/:id/anexos/:attachmentId`, ({ params }) => {
    const { attachmentId } = params as { id: string; attachmentId: string };
    const index = processAttachmentsFixtures.findIndex((a) => a.id === attachmentId);
    if (index === -1) {
      return HttpResponse.json({ message: "Anexo não encontrado." }, { status: 404 });
    }
    processAttachmentsFixtures.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

export default processesHandlers;
