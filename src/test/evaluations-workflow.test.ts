import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests for the Performance Evaluation workflow.
 *
 * Validates submission, approval, rejection, reopening and acknowledgement
 * against the real Supabase database using demo users. RLS policies are
 * exercised end-to-end (no service role).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `sb-test-${role}-${Math.random()}` },
  });
  const { error } = await client.auth.signInWithPassword({
    email: USERS[role].email,
    password: USERS[role].password,
  });
  if (error) throw new Error(`Login as ${role} failed: ${error.message}`);
  return client;
}

describe("Evaluation workflow (integration)", () => {
  let admin: SupabaseClient;
  let gestor: SupabaseClient;
  let diretor: SupabaseClient;
  let colaborador: SupabaseClient;
  let tecnico: SupabaseClient;

  let cycleId: string;
  let evaluationId: string;

  beforeAll(async () => {
    [admin, gestor, diretor, colaborador, tecnico] = await Promise.all([
      signedClient("admin"),
      signedClient("gestor"),
      signedClient("diretor"),
      signedClient("colaborador"),
      signedClient("tecnico"),
    ]);

    // Admin creates a dedicated test cycle.
    const year = new Date().getFullYear();
    const { data, error } = await admin
      .from("evaluation_cycles")
      .insert({
        name: `Test Cycle ${Date.now()}`,
        year,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        status: "ativo",
        created_by: USERS.admin.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    cycleId = data!.id;
  }, 30000);

  afterAll(async () => {
    if (cycleId) {
      // Cascade deletes evaluation + history + scores.
      await admin.from("evaluation_cycles").delete().eq("id", cycleId);
    }
    await Promise.all([
      admin?.auth.signOut(),
      gestor?.auth.signOut(),
      diretor?.auth.signOut(),
      colaborador?.auth.signOut(),
      tecnico?.auth.signOut(),
    ]);
  });

  it("gestor can create a draft evaluation; colaborador cannot", async () => {
    const denied = await colaborador.from("employee_evaluations").insert({
      cycle_id: cycleId,
      employee_id: USERS.colaborador.id,
      evaluator_id: USERS.gestor.id,
      status: "rascunho",
    });
    expect(denied.error).not.toBeNull();

    const { data, error } = await gestor
      .from("employee_evaluations")
      .insert({
        cycle_id: cycleId,
        employee_id: USERS.colaborador.id,
        evaluator_id: USERS.gestor.id,
        status: "rascunho",
        global_score: 14,
      })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("rascunho");
    evaluationId = data!.id;
  });

  it("creates a history row automatically on insert (audit trigger)", async () => {
    const { data, error } = await gestor
      .from("evaluation_history")
      .select("action, to_status")
      .eq("evaluation_id", evaluationId);
    expect(error).toBeNull();
    expect(data?.some((h) => h.action === "criada" && h.to_status === "rascunho")).toBe(true);
  });

  it("colaborador (subject) can read own evaluation but técnico (outsider) cannot", async () => {
    const own = await colaborador.from("employee_evaluations").select("id").eq("id", evaluationId).maybeSingle();
    expect(own.error).toBeNull();
    expect(own.data?.id).toBe(evaluationId);

    const outsider = await tecnico.from("employee_evaluations").select("id").eq("id", evaluationId).maybeSingle();
    expect(outsider.error).toBeNull();
    expect(outsider.data).toBeNull();
  });

  it("gestor submits the evaluation (rascunho → submetida) and history is logged", async () => {
    const { data, error } = await gestor
      .from("employee_evaluations")
      .update({ status: "submetida", submitted_at: new Date().toISOString() })
      .eq("id", evaluationId)
      .select("status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("submetida");

    const { data: hist } = await gestor
      .from("evaluation_history")
      .select("action")
      .eq("evaluation_id", evaluationId)
      .eq("action", "submetida");
    expect(hist?.length).toBeGreaterThanOrEqual(1);
  });

  it("colaborador cannot approve; diretor rejects with reason then gestor resubmits", async () => {
    const denied = await colaborador
      .from("employee_evaluations")
      .update({ status: "aprovada" })
      .eq("id", evaluationId)
      .select();
    // Either explicit error or no rows updated.
    expect(denied.error || (denied.data?.length ?? 0) === 0).toBeTruthy();

    const rej = await diretor
      .from("employee_evaluations")
      .update({ status: "rejeitada", rejection_reason: "Faltam evidências" })
      .eq("id", evaluationId)
      .select("status, rejection_reason")
      .single();
    expect(rej.error).toBeNull();
    expect(rej.data?.status).toBe("rejeitada");
    expect(rej.data?.rejection_reason).toBe("Faltam evidências");

    // Gestor edits and resubmits.
    const edit = await gestor
      .from("employee_evaluations")
      .update({ global_score: 16, status: "submetida", submitted_at: new Date().toISOString() })
      .eq("id", evaluationId)
      .select("status, global_score")
      .single();
    expect(edit.error).toBeNull();
    expect(edit.data?.status).toBe("submetida");
    expect(Number(edit.data?.global_score)).toBe(16);
  });

  it("diretor approves; colaborador can then acknowledge (and only once)", async () => {
    const appr = await diretor
      .from("employee_evaluations")
      .update({ status: "aprovada", approved_by: USERS.diretor.id, approved_at: new Date().toISOString() })
      .eq("id", evaluationId)
      .select("status")
      .single();
    expect(appr.error).toBeNull();
    expect(appr.data?.status).toBe("aprovada");

    const ack = await colaborador
      .from("employee_evaluations")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", evaluationId)
      .select("acknowledged_at")
      .single();
    expect(ack.error).toBeNull();
    expect(ack.data?.acknowledged_at).toBeTruthy();

    // A second acknowledgement attempt should hit the RLS guard (acknowledged_at IS NULL) → 0 rows.
    const second = await colaborador
      .from("employee_evaluations")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", evaluationId)
      .select();
    expect(second.error || (second.data?.length ?? 0) === 0).toBeTruthy();
  });

  it("diretor can reopen (aprovada → rascunho)", async () => {
    const { data, error } = await diretor
      .from("employee_evaluations")
      .update({ status: "rascunho", approved_by: null, approved_at: null })
      .eq("id", evaluationId)
      .select("status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("rascunho");

    const { data: hist } = await diretor
      .from("evaluation_history")
      .select("action, from_status, to_status")
      .eq("evaluation_id", evaluationId)
      .order("created_at", { ascending: false })
      .limit(1);
    expect(hist?.[0]?.action).toBe("reaberta");
    expect(hist?.[0]?.from_status).toBe("aprovada");
    expect(hist?.[0]?.to_status).toBe("rascunho");
  });

  it("full audit trail contains the expected sequence of actions", async () => {
    const { data, error } = await admin
      .from("evaluation_history")
      .select("action")
      .eq("evaluation_id", evaluationId)
      .order("created_at", { ascending: true });
    expect(error).toBeNull();
    const actions = (data ?? []).map((h: any) => h.action);
    // Expect at least: criada → submetida → rejeitada → submetida → aprovada → reaberta
    for (const expected of ["criada", "submetida", "rejeitada", "submetida", "aprovada", "reaberta"]) {
      const idx = actions.indexOf(expected);
      expect(idx, `missing action "${expected}" in ${JSON.stringify(actions)}`).toBeGreaterThanOrEqual(0);
      actions.splice(0, idx + 1); // enforce ordering by consuming
    }
  });
});
