import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests for Missions ↔ BPM workflow and Accountability (Prestação de Contas).
 *
 * Validates against the real database (RLS enforced, no service role):
 *   - Only authorized roles can create missions / submit for approval (open BPM process).
 *   - BPM process completion auto-syncs mission status to "aprovada" via trigger.
 *   - Mission expenses can only be inserted by the recorder; updated/deleted by recorder or admin.
 *   - Mission reports can be submitted by any authenticated user but only updated by author/gestor/diretor/admin.
 *   - Mission guides are write-restricted to admin/gestor/diretor.
 *   - Outsiders without write permission are blocked by RLS.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const MISSION_PROCESS_TYPE_ID = "e7421af3-3ed6-410e-b331-106be13e9d68";

const USERS = {
  admin: { email: "admin@iiv.demo", password: "admin123", id: "b1ad5cd7-5842-4347-914a-8a28255e64ba" },
  gestor: { email: "gestor@iiv.demo", password: "gestor123", id: "a0038b5a-78fc-4dc6-9289-d607d9f3e2f7" },
  diretor: { email: "diretor@iiv.demo", password: "diretor123", id: "7d34f6ab-8bed-4615-bf37-130cc2bcb5a7" },
  colaborador: { email: "colaborador@iiv.demo", password: "colaborador123", id: "33ee1d95-ba2c-4e9e-a921-3c79be249d72" },
  tecnico: { email: "tecnico@iiv.demo", password: "tecnico123", id: "0ffcae8d-1a23-4488-96c4-d7c540090751" },
} as const;

type RoleKey = keyof typeof USERS;

async function signedClient(role: RoleKey): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: `sb-test-mission-${role}-${Math.random()}`,
    },
  });
  const { error } = await client.auth.signInWithPassword({
    email: USERS[role].email,
    password: USERS[role].password,
  });
  if (error) throw new Error(`Login ${role} falhou: ${error.message}`);
  return client;
}

describe("Mission BPM + Accountability workflow (integration)", () => {
  let admin: SupabaseClient;
  let gestor: SupabaseClient;
  let diretor: SupabaseClient;
  let tecnico: SupabaseClient;
  let colaborador: SupabaseClient;

  let missionId: string;
  let processId: string;

  beforeAll(async () => {
    [admin, gestor, diretor, tecnico, colaborador] = await Promise.all([
      signedClient("admin"),
      signedClient("gestor"),
      signedClient("diretor"),
      signedClient("tecnico"),
      signedClient("colaborador"),
    ]);
  }, 30000);

  afterAll(async () => {
    if (missionId) {
      // Cleanup cascades from missions/processes.
      await admin.from("mission_expenses").delete().eq("mission_id", missionId);
      await admin.from("mission_reports").delete().eq("mission_id", missionId);
      await admin.from("mission_guides").delete().eq("mission_id", missionId);
      await admin.from("mission_participants").delete().eq("mission_id", missionId);
      if (processId) await admin.from("processes").delete().eq("id", processId);
      await admin.from("missions").delete().eq("id", missionId);
    }
    await Promise.all([
      admin?.auth.signOut(),
      gestor?.auth.signOut(),
      diretor?.auth.signOut(),
      tecnico?.auth.signOut(),
      colaborador?.auth.signOut(),
    ]);
  });

  it("colaborador NÃO pode criar missão; gestor pode", async () => {
    const denied = await colaborador.from("missions").insert({
      title: "Bloqueada",
      destination: "Luanda",
      start_date: "2026-07-01",
      end_date: "2026-07-02",
      purpose: "teste",
      status: "planeada",
      created_by: USERS.colaborador.id,
    });
    expect(denied.error).not.toBeNull();

    const { data, error } = await gestor
      .from("missions")
      .insert({
        title: `Missão Teste ${Date.now()}`,
        destination: "Huambo",
        start_date: "2026-07-10",
        end_date: "2026-07-12",
        purpose: "Visita técnica",
        budget: 50000,
        status: "planeada",
        created_by: USERS.gestor.id,
      })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("planeada");
    missionId = data!.id;
  });

  it("gestor submete a missão criando processo BPM ligado", async () => {
    const { data: proc, error: procErr } = await gestor
      .from("processes")
      .insert({
        title: "Aprovação de Missão de Serviço",
        type_id: MISSION_PROCESS_TYPE_ID,
        requester_id: USERS.gestor.id,
        status: "em_curso",
        priority: "normal",
        mission_id: missionId,
      })
      .select("id, status, mission_id")
      .single();
    expect(procErr).toBeNull();
    expect(proc?.mission_id).toBe(missionId);
    processId = proc!.id;

    const upd = await gestor
      .from("missions")
      .update({ status: "submetida" })
      .eq("id", missionId)
      .select("status")
      .single();
    expect(upd.error).toBeNull();
    expect(upd.data?.status).toBe("submetida");
  });

  it("trigger sincroniza: processo concluído → missão aprovada", async () => {
    const { error } = await admin
      .from("processes")
      .update({ status: "concluido" })
      .eq("id", processId);
    expect(error).toBeNull();

    const { data } = await admin
      .from("missions")
      .select("status")
      .eq("id", missionId)
      .single();
    expect(data?.status).toBe("aprovada");
  });

  it("apenas admin/gestor/diretor podem criar guia de marcha; técnico é bloqueado", async () => {
    const denied = await tecnico.from("mission_guides").insert({
      mission_id: missionId,
      issued_by: USERS.tecnico.id,
      guide_number: `GM-T-${Date.now()}`,
      issue_date: "2026-07-10",
    });
    expect(denied.error).not.toBeNull();

    const ok = await gestor
      .from("mission_guides")
      .insert({
        mission_id: missionId,
        issued_by: USERS.gestor.id,
        guide_number: `GM-${Date.now()}`,
        issue_date: "2026-07-10",
        transport: "Viatura institucional",
      })
      .select("id")
      .single();
    expect(ok.error).toBeNull();
    expect(ok.data?.id).toBeTruthy();
  });

  it("despesas: recorder pode inserir; outro user não pode editar/eliminar despesa alheia", async () => {
    // Colaborador não tem permissão de insert (apenas admin/gestor/tecnico).
    const blocked = await colaborador.from("mission_expenses").insert({
      mission_id: missionId,
      description: "Almoço",
      amount: 5000,
      recorded_by: USERS.colaborador.id,
    });
    expect(blocked.error).not.toBeNull();

    // recorded_by deve corresponder a auth.uid().
    const wrongOwner = await tecnico.from("mission_expenses").insert({
      mission_id: missionId,
      description: "Combustível",
      amount: 8000,
      recorded_by: USERS.gestor.id, // não é o auth.uid()
    });
    expect(wrongOwner.error).not.toBeNull();

    const ok = await tecnico
      .from("mission_expenses")
      .insert({
        mission_id: missionId,
        description: "Combustível",
        amount: 8000,
        recorded_by: USERS.tecnico.id,
      })
      .select("id")
      .single();
    expect(ok.error).toBeNull();
    const expenseId = ok.data!.id;

    // Gestor (não é recorder) não pode editar despesa do técnico.
    const updDenied = await gestor
      .from("mission_expenses")
      .update({ amount: 9999 })
      .eq("id", expenseId)
      .select();
    expect(updDenied.error || (updDenied.data?.length ?? 0) === 0).toBeTruthy();

    // Técnico (recorder) pode editar.
    const updOk = await tecnico
      .from("mission_expenses")
      .update({ amount: 8500 })
      .eq("id", expenseId)
      .select("amount")
      .single();
    expect(updOk.error).toBeNull();
    expect(Number(updOk.data?.amount)).toBe(8500);

    // Admin pode eliminar.
    const del = await admin.from("mission_expenses").delete().eq("id", expenseId);
    expect(del.error).toBeNull();
  });

  it("relatório: técnico submete; apenas autor/gestor/diretor/admin podem actualizar", async () => {
    const ins = await tecnico
      .from("mission_reports")
      .insert({
        mission_id: missionId,
        submitted_by: USERS.tecnico.id,
        summary: "Resumo da missão",
        outcomes: "Objectivos atingidos",
      })
      .select("id")
      .single();
    expect(ins.error).toBeNull();
    const reportId = ins.data!.id;

    // Colaborador (alheio) não consegue actualizar.
    const denied = await colaborador
      .from("mission_reports")
      .update({ summary: "hack" })
      .eq("id", reportId)
      .select();
    expect(denied.error || (denied.data?.length ?? 0) === 0).toBeTruthy();

    // Autor pode actualizar.
    const okAuthor = await tecnico
      .from("mission_reports")
      .update({ summary: "Resumo revisto" })
      .eq("id", reportId)
      .select("summary")
      .single();
    expect(okAuthor.error).toBeNull();
    expect(okAuthor.data?.summary).toBe("Resumo revisto");

    // Diretor (papel) também pode.
    const okDir = await diretor
      .from("mission_reports")
      .update({ outcomes: "Validado pela direcção" })
      .eq("id", reportId)
      .select("outcomes")
      .single();
    expect(okDir.error).toBeNull();
  });

  it("cancelar processo reverte missão para planeada (se ainda submetida)", async () => {
    // Re-submeter para testar o caminho de cancelamento.
    await admin.from("missions").update({ status: "submetida" }).eq("id", missionId);
    const { data: proc2 } = await gestor
      .from("processes")
      .insert({
        title: "Aprovação Missão (segundo ciclo)",
        type_id: MISSION_PROCESS_TYPE_ID,
        requester_id: USERS.gestor.id,
        status: "em_curso",
        priority: "normal",
        mission_id: missionId,
      })
      .select("id")
      .single();
    const proc2Id = proc2!.id;

    await admin.from("processes").update({ status: "cancelado" }).eq("id", proc2Id);

    const { data } = await admin.from("missions").select("status").eq("id", missionId).single();
    expect(data?.status).toBe("planeada");

    await admin.from("processes").delete().eq("id", proc2Id);
  });
});
