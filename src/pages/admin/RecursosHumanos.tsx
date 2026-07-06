import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Pencil, Trash2, FileText, CalendarOff } from "lucide-react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/admin/TablePagination";

interface Employee {
  id: string; user_id: string | null; employee_number: string; full_name: string;
  national_id: string | null; phone: string | null; email: string | null;
  department_id: string | null; hire_date: string | null; is_active: boolean;
  qualifications: string | null; notes: string | null;
}
interface Contract {
  id: string; employee_id: string; contract_type: string; position: string;
  start_date: string; end_date: string | null; salary: number; currency: string;
  is_active: boolean; notes: string | null;
}
interface Leave {
  id: string; employee_id: string; leave_type: string;
  start_date: string; end_date: string; days: number | null;
  status: string; reason: string | null; created_by: string | null;
}
interface Department { id: string; name: string }

const CONTRACT_TYPES = ["efectivo", "termo_certo", "termo_incerto", "prestacao_servicos", "estagio"];
const LEAVE_TYPES = ["ferias", "doenca", "maternidade", "paternidade", "luto", "sem_vencimento", "outro"];
const LEAVE_STATUS = ["pendente", "aprovada", "rejeitada", "concluida"];

export default function RecursosHumanos() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("rh");

  const [tab, setTab] = useState("employees");
  const [loading, setLoading] = useState(true);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);

  const [empOpen, setEmpOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [delEmp, setDelEmp] = useState<string | null>(null);

  const [conOpen, setConOpen] = useState(false);
  const [editCon, setEditCon] = useState<Contract | null>(null);
  const [delCon, setDelCon] = useState<string | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [editLeave, setEditLeave] = useState<Leave | null>(null);
  const [delLeave, setDelLeave] = useState<string | null>(null);

  const leavesPag = usePagination(20);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  const load = async () => {
    setLoading(true);
    const [e, c, d] = await Promise.all([
      supabase.from("employees").select("*").order("full_name").limit(500),
      supabase.from("employee_contracts").select("*").order("start_date", { ascending: false }).limit(500),
      supabase.from("departments").select("id,name").order("name"),
    ]);
    if (e.data) setEmps(e.data as Employee[]);
    if (c.data) setContracts(c.data as Contract[]);
    if (d.data) setDepts(d.data as Department[]);
    setLoading(false);
  };

  const loadLeaves = async () => {
    const { data, count } = await supabase
      .from("employee_leaves")
      .select("*", { count: "exact" })
      .order("start_date", { ascending: false })
      .range(leavesPag.from, leavesPag.to);
    setLeaves((data as Leave[]) ?? []);
    leavesPag.setTotal(count ?? 0);
    const { count: pending } = await supabase
      .from("employee_leaves")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");
    setPendingLeaves(pending ?? 0);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadLeaves(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [leavesPag.page, leavesPag.pageSize]);

  const kpis = useMemo(() => ({
    total: emps.length,
    active: emps.filter((e) => e.is_active).length,
    activeContracts: contracts.filter((c) => c.is_active).length,
    pendingLeaves,
  }), [emps, contracts, pendingLeaves]);

  const empsPag = useClientPagination(emps, 20);
  const contractsPag = useClientPagination(contracts, 20);

  const empName = (id: string) => emps.find((e) => e.id === id)?.full_name ?? "—";
  const deptName = (id: string | null) => depts.find((d) => d.id === id)?.name ?? "—";

  const saveEmp = async (f: Partial<Employee>) => {
    if (!f.full_name || !f.employee_number) return toast({ title: "Preencha nº e nome", variant: "destructive" });
    const payload: any = {
      employee_number: f.employee_number, full_name: f.full_name,
      national_id: f.national_id || null, phone: f.phone || null, email: f.email || null,
      department_id: f.department_id || null, hire_date: f.hire_date || null,
      is_active: f.is_active ?? true, qualifications: f.qualifications || null, notes: f.notes || null,
    };
    const { error } = editEmp
      ? await supabase.from("employees").update(payload).eq("id", editEmp.id)
      : await supabase.from("employees").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: editEmp ? "Colaborador actualizado" : "Colaborador criado" });
    setEmpOpen(false); setEditEmp(null); load();
  };

  const saveCon = async (f: Partial<Contract>) => {
    if (!f.employee_id || !f.position || !f.start_date) return toast({ title: "Preencha colaborador, cargo e início", variant: "destructive" });
    const payload: any = {
      employee_id: f.employee_id, contract_type: (f.contract_type || "efectivo") as any,
      position: f.position, start_date: f.start_date, end_date: f.end_date || null,
      salary: Number(f.salary) || 0, currency: f.currency || "AOA",
      is_active: f.is_active ?? true, notes: f.notes || null,
      ...(editCon ? {} : { created_by: user?.id || null }),
    };
    const { error } = editCon
      ? await supabase.from("employee_contracts").update(payload).eq("id", editCon.id)
      : await supabase.from("employee_contracts").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: editCon ? "Contrato actualizado" : "Contrato criado" });
    setConOpen(false); setEditCon(null); load();
  };

  const saveLeave = async (f: Partial<Leave>) => {
    if (!f.employee_id || !f.start_date || !f.end_date) return toast({ title: "Preencha colaborador e datas", variant: "destructive" });
    const days = Math.max(1, Math.round((new Date(f.end_date).getTime() - new Date(f.start_date).getTime()) / 86400000) + 1);
    const payload: any = {
      employee_id: f.employee_id, leave_type: (f.leave_type || "ferias") as any,
      start_date: f.start_date, end_date: f.end_date, days,
      status: (f.status || "pendente") as any, reason: f.reason || null,
      created_by: user?.id || null,
    };
    const { error } = editLeave
      ? await supabase.from("employee_leaves").update(payload).eq("id", editLeave.id)
      : await supabase.from("employee_leaves").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: editLeave ? "Ausência actualizada" : "Ausência registada" });
    setLeaveOpen(false); setEditLeave(null); loadLeaves();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Users} title="Recursos Humanos" description="Ficha de colaboradores, contratos, férias e ausências." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Users} title="Colaboradores" metric={kpis.total} stagger={1} />
        <AdminCard variant="glass" icon={Users} title="Activos" metric={kpis.active} stagger={2} />
        <AdminCard variant="glass" icon={FileText} title="Contratos activos" metric={kpis.activeContracts} stagger={3} />
        <AdminCard variant="glass" icon={CalendarOff} title="Ausências pendentes" metric={kpis.pendingLeaves} stagger={4} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="employees">Colaboradores</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="leaves">Férias & Ausências</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4 space-y-3">
          {canEdit && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditEmp(null); setEmpOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Colaborador</Button>
            </div>
          )}
          <AdminCard title="Colaboradores"
            loading={loading} isEmpty={!loading && emps.length === 0} emptyMessage="Sem colaboradores.">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nº</TableHead><TableHead>Nome</TableHead><TableHead>Departamento</TableHead>
                <TableHead>Telefone</TableHead><TableHead>Admissão</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {empsPag.pageItems.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_number}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{deptName(e.department_id)}</TableCell>
                    <TableCell>{e.phone ?? "—"}</TableCell>
                    <TableCell>{e.hire_date ?? "—"}</TableCell>
                    <TableCell>
                      {e.is_active
                        ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Activo</Badge>
                        : <Badge variant="outline">Inactivo</Badge>}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setEditEmp(e); setEmpOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDelEmp(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={empsPag.page} pageSize={empsPag.pageSize} total={empsPag.total} totalPages={empsPag.totalPages} canPrev={empsPag.canPrev} canNext={empsPag.canNext} onPageChange={empsPag.setPage} onPageSizeChange={empsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4 space-y-3">
          {canEdit && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditCon(null); setConOpen(true); }} disabled={emps.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
            </div>
          )}
          <AdminCard title="Contratos"
            loading={loading} isEmpty={!loading && contracts.length === 0} emptyMessage="Sem contratos.">

            <Table>
              <TableHeader><TableRow>
                <TableHead>Colaborador</TableHead><TableHead>Cargo</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead>Salário</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {contractsPag.pageItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{empName(c.employee_id)}</TableCell>
                    <TableCell>{c.position}</TableCell>
                    <TableCell><Badge variant="outline">{c.contract_type}</Badge></TableCell>
                    <TableCell>{c.start_date}</TableCell>
                    <TableCell>{c.end_date ?? "—"}</TableCell>
                    <TableCell>{Number(c.salary).toLocaleString("pt-PT")} {c.currency}</TableCell>
                    <TableCell>
                      {c.is_active
                        ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Activo</Badge>
                        : <Badge variant="outline">Cessado</Badge>}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setEditCon(c); setConOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDelCon(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={contractsPag.page} pageSize={contractsPag.pageSize} total={contractsPag.total} totalPages={contractsPag.totalPages} canPrev={contractsPag.canPrev} canNext={contractsPag.canNext} onPageChange={contractsPag.setPage} onPageSizeChange={contractsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditLeave(null); setLeaveOpen(true); }} disabled={emps.length === 0}><Plus className="h-4 w-4 mr-1" /> Nova Ausência</Button>
          </div>
          <AdminCard title="Férias & Ausências"
            loading={loading} isEmpty={!loading && leavesPag.total === 0} emptyMessage="Sem ausências registadas.">

            <Table>
              <TableHeader><TableRow>
                <TableHead>Colaborador</TableHead><TableHead>Tipo</TableHead>
                <TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead>Dias</TableHead><TableHead>Estado</TableHead>
                <TableHead className="w-24">Acções</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{empName(l.employee_id)}</TableCell>
                    <TableCell><Badge variant="outline">{l.leave_type}</Badge></TableCell>
                    <TableCell>{l.start_date}</TableCell>
                    <TableCell>{l.end_date}</TableCell>
                    <TableCell>{l.days ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={
                        l.status === "aprovada" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" :
                        l.status === "rejeitada" ? "bg-destructive/15 text-destructive" :
                        l.status === "concluida" ? "bg-primary/15 text-primary" :
                        "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }>{l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {(canEdit || l.created_by === user?.id) && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => { setEditLeave(l); setLeaveOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          {canEdit && <Button size="icon" variant="ghost" onClick={() => setDelLeave(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={leavesPag.page} pageSize={leavesPag.pageSize} total={leavesPag.total} totalPages={leavesPag.totalPages} canPrev={leavesPag.canPrev} canNext={leavesPag.canNext} onPageChange={leavesPag.setPage} onPageSizeChange={leavesPag.setPageSize} />
          </AdminCard>
        </TabsContent>
      </Tabs>

      <EmpDialog open={empOpen} onOpenChange={(v) => { setEmpOpen(v); if (!v) setEditEmp(null); }} row={editEmp} depts={depts} onSave={saveEmp} />
      <ConDialog open={conOpen} onOpenChange={(v) => { setConOpen(v); if (!v) setEditCon(null); }} row={editCon} emps={emps} onSave={saveCon} />
      <LeaveDialog open={leaveOpen} onOpenChange={(v) => { setLeaveOpen(v); if (!v) setEditLeave(null); }} row={editLeave} emps={emps} canApprove={canEdit} onSave={saveLeave} />

      <DeleteConfirmDialog open={!!delEmp} onOpenChange={(o) => !o && setDelEmp(null)}
        title="Apagar colaborador?" description="Esta acção é permanente."
        onConfirm={async () => { if (!delEmp) return; await supabase.from("employees").delete().eq("id", delEmp); setDelEmp(null); load(); }} />
      <DeleteConfirmDialog open={!!delCon} onOpenChange={(o) => !o && setDelCon(null)}
        title="Apagar contrato?" description="Esta acção é permanente."
        onConfirm={async () => { if (!delCon) return; await supabase.from("employee_contracts").delete().eq("id", delCon); setDelCon(null); load(); }} />
      <DeleteConfirmDialog open={!!delLeave} onOpenChange={(o) => !o && setDelLeave(null)}
        title="Apagar ausência?" description="Esta acção é permanente."
        onConfirm={async () => { if (!delLeave) return; await supabase.from("employee_leaves").delete().eq("id", delLeave); setDelLeave(null); loadLeaves(); }} />
    </div>
  );
}

function EmpDialog({ open, onOpenChange, row, depts, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Employee | null; depts: Department[]; onSave: (f: Partial<Employee>) => void;
}) {
  const [form, setForm] = useState<Partial<Employee>>({});
  useEffect(() => { setForm(row ?? { is_active: true }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{row ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nº Mecanográfico *</Label><Input value={form.employee_number || ""} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} /></div>
          <div><Label>Nome Completo *</Label><Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>BI</Label><Input value={form.national_id || ""} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Departamento</Label>
            <Select value={form.department_id || ""} onValueChange={(v) => setForm({ ...form, department_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data de admissão</Label><Input type="date" value={form.hire_date || ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
          <div className="col-span-2"><Label>Qualificações</Label><Textarea value={form.qualifications || ""} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <Label>Activo</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConDialog({ open, onOpenChange, row, emps, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Contract | null; emps: Employee[]; onSave: (f: Partial<Contract>) => void;
}) {
  const [form, setForm] = useState<Partial<Contract>>({});
  useEffect(() => { setForm(row ?? { contract_type: "efectivo", currency: "AOA", is_active: true, start_date: new Date().toISOString().slice(0, 10) }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Colaborador *</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cargo *</Label><Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Início *</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><Label>Salário</Label><Input type="number" step="0.01" value={form.salary ?? 0} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></div>
            <div><Label>Moeda</Label><Input value={form.currency || "AOA"} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <Label>Contrato activo</Label>
          </div>
          <div><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaveDialog({ open, onOpenChange, row, emps, canApprove, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; row: Leave | null; emps: Employee[]; canApprove: boolean; onSave: (f: Partial<Leave>) => void;
}) {
  const [form, setForm] = useState<Partial<Leave>>({});
  useEffect(() => {
    setForm(row ?? {
      leave_type: "ferias", status: "pendente",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
    });
  }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Ausência" : "Nova Ausência"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Colaborador *</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {canApprove && (
              <div><Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAVE_STATUS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Início *</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Fim *</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div><Label>Motivo</Label><Textarea value={form.reason || ""} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
