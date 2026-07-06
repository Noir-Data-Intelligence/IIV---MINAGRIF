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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wallet, TrendingUp, TrendingDown, Pencil, Trash2, Receipt, FolderTree, Target } from "lucide-react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/admin/TablePagination";

type AccountType = "receita" | "despesa";
type TxStatus = "pendente" | "pago" | "cancelado";

interface Account { id: string; code: string; name: string; type: AccountType; description: string | null; is_active: boolean }
interface Transaction {
  id: string; account_id: string; department_id: string | null; type: AccountType;
  amount: number; currency: string; transaction_date: string; description: string;
  reference: string | null; status: TxStatus; notes: string | null;
}
interface Budget { id: string; year: number; account_id: string; department_id: string | null; planned_amount: number; notes: string | null }
interface Dept { id: string; name: string }

const STATUS_OPTIONS: { value: TxStatus; label: string }[] = [
  { value: "pago", label: "Pago" }, { value: "pendente", label: "Pendente" }, { value: "cancelado", label: "Cancelado" },
];

export default function Financeiro() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("financeiro");

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [kpis, setKpis] = useState({ receitas: 0, despesas: 0, saldo: 0, pendentes: 0 });
  // Para % de execução orçamental, mantemos um snapshot leve (só montantes pagos por conta/depto/ano)
  const [paidTxs, setPaidTxs] = useState<Pick<Transaction, "account_id" | "department_id" | "amount" | "transaction_date">[]>([]);

  const [accountOpen, setAccountOpen] = useState(false);
  const [accountEdit, setAccountEdit] = useState<Account | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txEdit, setTxEdit] = useState<Transaction | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<{ table: string; id: string } | null>(null);

  const txsPag = usePagination(20);

  const loadAll = async () => {
    setLoading(true);
    const [a, b, d] = await Promise.all([
      supabase.from("financial_accounts").select("*").order("code"),
      supabase.from("budgets").select("*").order("year", { ascending: false }),
      supabase.from("departments").select("id,name").order("name"),
    ]);
    if (a.data) setAccounts(a.data as Account[]);
    if (b.data) setBudgets(b.data as Budget[]);
    if (d.data) setDepts(d.data as Dept[]);
    setLoading(false);
  };

  const loadTxs = async () => {
    const { data, count } = await supabase
      .from("financial_transactions")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .range(txsPag.from, txsPag.to);
    setTxs((data as Transaction[]) ?? []);
    txsPag.setTotal(count ?? 0);
  };

  const loadKpisAndPaid = async () => {
    // Carrega APENAS colunas leves para calcular KPIs e execução orçamental.
    const { data: kpiRows } = await supabase
      .from("financial_transactions")
      .select("amount,type,status");
    const rows = (kpiRows ?? []) as { amount: number; type: AccountType; status: TxStatus }[];
    const paid = rows.filter((t) => t.status === "pago");
    const receitas = paid.filter((t) => t.type === "receita").reduce((s, t) => s + Number(t.amount), 0);
    const despesas = paid.filter((t) => t.type === "despesa").reduce((s, t) => s + Number(t.amount), 0);
    const pendentes = rows.filter((t) => t.status === "pendente").reduce((s, t) => s + Number(t.amount), 0);
    setKpis({ receitas, despesas, saldo: receitas - despesas, pendentes });

    const { data: paidRows } = await supabase
      .from("financial_transactions")
      .select("account_id,department_id,amount,transaction_date")
      .eq("status", "pago");
    setPaidTxs((paidRows as any) ?? []);
  };

  useEffect(() => { loadAll(); loadKpisAndPaid(); }, []);
  useEffect(() => { loadTxs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [txsPag.page, txsPag.pageSize]);

  const accountsPag = useClientPagination(accounts, 20);
  const budgetsPag = useClientPagination(budgets, 20);

  const accountLabel = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    return a ? `${a.code} — ${a.name}` : "—";
  };
  const deptName = (id: string | null) => id ? (depts.find((d) => d.id === id)?.name ?? "—") : "—";
  const fmt = (n: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

  const saveAccount = async (form: Partial<Account>) => {
    if (!form.code || !form.name || !form.type) return toast({ title: "Código, nome e tipo obrigatórios", variant: "destructive" });
    const payload = { code: form.code, name: form.name, type: form.type, description: form.description || null, is_active: form.is_active ?? true };
    const { error } = accountEdit
      ? await supabase.from("financial_accounts").update(payload).eq("id", accountEdit.id)
      : await supabase.from("financial_accounts").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: accountEdit ? "Conta actualizada" : "Conta criada" });
    setAccountOpen(false); setAccountEdit(null); loadAll();
  };

  const saveTx = async (form: Partial<Transaction>) => {
    if (!form.account_id || !form.amount || !form.description) return toast({ title: "Conta, montante e descrição obrigatórios", variant: "destructive" });
    const acc = accounts.find((a) => a.id === form.account_id);
    const payload: any = {
      account_id: form.account_id, department_id: form.department_id || null,
      type: form.type || acc?.type || "despesa",
      amount: Number(form.amount), currency: form.currency || "AOA",
      transaction_date: form.transaction_date || new Date().toISOString().slice(0, 10),
      description: form.description, reference: form.reference || null,
      status: form.status || "pago", notes: form.notes || null,
    };
    if (!txEdit) payload.recorded_by = user?.id;
    const { error } = txEdit
      ? await supabase.from("financial_transactions").update(payload).eq("id", txEdit.id)
      : await supabase.from("financial_transactions").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: txEdit ? "Movimento actualizado" : "Movimento registado" });
    setTxOpen(false); setTxEdit(null); loadTxs(); loadKpisAndPaid();
  };

  const saveBudget = async (form: Partial<Budget>) => {
    if (!form.year || !form.account_id || form.planned_amount == null) return toast({ title: "Ano, conta e valor obrigatórios", variant: "destructive" });
    const payload = { year: Number(form.year), account_id: form.account_id, department_id: form.department_id || null, planned_amount: Number(form.planned_amount), notes: form.notes || null };
    const { error } = budgetEdit
      ? await supabase.from("budgets").update(payload).eq("id", budgetEdit.id)
      : await supabase.from("budgets").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: budgetEdit ? "Orçamento actualizado" : "Orçamento criado" });
    setBudgetOpen(false); setBudgetEdit(null); loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(deleteId.table as any).delete().eq("id", deleteId.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null);
    loadAll();
    if (deleteId.table === "financial_transactions") { loadTxs(); loadKpisAndPaid(); }
  };

  // Budget execution (sum tx by year+account+dept) — usa paidTxs (snapshot leve).
  const executedFor = (b: Budget) => {
    return paidTxs
      .filter((t) => t.account_id === b.account_id && (b.department_id ? t.department_id === b.department_id : true) && new Date(t.transaction_date).getFullYear() === b.year)
      .reduce((s, t) => s + Number(t.amount), 0);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Wallet} title="Financeiro" description="Receitas, despesas, contas e orçamentos institucionais." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={TrendingUp} title="Receitas" metric={fmt(kpis.receitas)} stagger={1} />
        <AdminCard variant="glass" icon={TrendingDown} title="Despesas" metric={fmt(kpis.despesas)} stagger={2} />
        <AdminCard variant="glass" icon={Wallet} title="Saldo" metric={fmt(kpis.saldo)} stagger={3} />
        <AdminCard variant="glass" icon={Receipt} title="Pendentes" metric={fmt(kpis.pendentes)} stagger={4} />
      </div>

      <Tabs defaultValue="movimentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movimentos"><Receipt className="h-4 w-4 mr-1" /> Movimentos</TabsTrigger>
          <TabsTrigger value="contas"><FolderTree className="h-4 w-4 mr-1" /> Contas</TabsTrigger>
          <TabsTrigger value="orcamentos"><Target className="h-4 w-4 mr-1" /> Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentos">
          <AdminCard title="Movimentos financeiros" loading={loading} isEmpty={!loading && txsPag.total === 0} emptyMessage="Sem movimentos registados.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setTxEdit(null); setTxOpen(true); }} disabled={accounts.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo Movimento</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Conta</TableHead><TableHead>Departamento</TableHead>
                <TableHead>Tipo</TableHead><TableHead>Montante</TableHead><TableHead>Descrição</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.transaction_date}</TableCell>
                    <TableCell className="text-xs">{accountLabel(t.account_id)}</TableCell>
                    <TableCell>{deptName(t.department_id)}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "receita" ? "default" : "outline"}>
                        {t.type === "receita" ? "Receita" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell className={t.type === "receita" ? "text-primary font-medium" : "text-destructive font-medium"}>{fmt(Number(t.amount))}</TableCell>
                    <TableCell className="max-w-[260px] truncate" title={t.description}>{t.description}</TableCell>
                    <TableCell><Badge variant="outline">{STATUS_OPTIONS.find((s) => s.value === t.status)?.label}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setTxEdit(t); setTxOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "financial_transactions", id: t.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={txsPag.page} pageSize={txsPag.pageSize} total={txsPag.total} totalPages={txsPag.totalPages} canPrev={txsPag.canPrev} canNext={txsPag.canNext} onPageChange={txsPag.setPage} onPageSizeChange={txsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        <TabsContent value="contas">
          <AdminCard title="Plano de contas" loading={loading} isEmpty={!loading && accounts.length === 0} emptyMessage="Sem contas registadas.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setAccountEdit(null); setAccountOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Activa</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {accountsPag.pageItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell><Badge variant={a.type === "receita" ? "default" : "outline"}>{a.type}</Badge></TableCell>
                    <TableCell>{a.is_active ? "Sim" : "Não"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setAccountEdit(a); setAccountOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "financial_accounts", id: a.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={accountsPag.page} pageSize={accountsPag.pageSize} total={accountsPag.total} totalPages={accountsPag.totalPages} canPrev={accountsPag.canPrev} canNext={accountsPag.canNext} onPageChange={accountsPag.setPage} onPageSizeChange={accountsPag.setPageSize} />
          </AdminCard>
        </TabsContent>

        <TabsContent value="orcamentos">
          <AdminCard title="Orçamentos" loading={loading} isEmpty={!loading && budgets.length === 0} emptyMessage="Sem orçamentos registados.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setBudgetEdit(null); setBudgetOpen(true); }} disabled={accounts.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo Orçamento</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Ano</TableHead><TableHead>Conta</TableHead><TableHead>Departamento</TableHead>
                <TableHead>Planeado</TableHead><TableHead>Executado</TableHead><TableHead>% Execução</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {budgetsPag.pageItems.map((b) => {
                  const exec = executedFor(b);
                  const pct = Number(b.planned_amount) > 0 ? Math.round((exec / Number(b.planned_amount)) * 100) : 0;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.year}</TableCell>
                      <TableCell className="text-xs">{accountLabel(b.account_id)}</TableCell>
                      <TableCell>{deptName(b.department_id)}</TableCell>
                      <TableCell>{fmt(Number(b.planned_amount))}</TableCell>
                      <TableCell>{fmt(exec)}</TableCell>
                      <TableCell><Badge variant={pct > 100 ? "destructive" : "outline"}>{pct}%</Badge></TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => { setBudgetEdit(b); setBudgetOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "budgets", id: b.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination page={budgetsPag.page} pageSize={budgetsPag.pageSize} total={budgetsPag.total} totalPages={budgetsPag.totalPages} canPrev={budgetsPag.canPrev} canNext={budgetsPag.canNext} onPageChange={budgetsPag.setPage} onPageSizeChange={budgetsPag.setPageSize} />
          </AdminCard>
        </TabsContent>
      </Tabs>

      <AccountDialog open={accountOpen} onOpenChange={(v) => { setAccountOpen(v); if (!v) setAccountEdit(null); }} account={accountEdit} onSave={saveAccount} />
      <TxDialog open={txOpen} onOpenChange={(v) => { setTxOpen(v); if (!v) setTxEdit(null); }} tx={txEdit} accounts={accounts} depts={depts} onSave={saveTx} />
      <BudgetDialog open={budgetOpen} onOpenChange={(v) => { setBudgetOpen(v); if (!v) setBudgetEdit(null); }} budget={budgetEdit} accounts={accounts} depts={depts} onSave={saveBudget} />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Apagar registo?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function AccountDialog({ open, onOpenChange, account, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; account: Account | null; onSave: (f: Partial<Account>) => void }) {
  const [form, setForm] = useState<Partial<Account>>({});
  useEffect(() => { setForm(account ?? { type: "despesa", is_active: true }); }, [account, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{account ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Código *</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ex.: 6.01" /></div>
            <div><Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AccountType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TxDialog({ open, onOpenChange, tx, accounts, depts, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; tx: Transaction | null; accounts: Account[]; depts: Dept[]; onSave: (f: Partial<Transaction>) => void }) {
  const [form, setForm] = useState<Partial<Transaction>>({});
  useEffect(() => { setForm(tx ?? { status: "pago", currency: "AOA", transaction_date: new Date().toISOString().slice(0, 10) }); }, [tx, open]);
  const acc = accounts.find((a) => a.id === form.account_id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{tx ? "Editar Movimento" : "Novo Movimento"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Conta *</Label>
            <Select value={form.account_id} onValueChange={(v) => {
              const a = accounts.find((x) => x.id === v);
              setForm({ ...form, account_id: v, type: a?.type ?? form.type });
            }}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Tipo</Label>
            <Select value={form.type ?? acc?.type} onValueChange={(v) => setForm({ ...form, type: v as AccountType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data</Label><Input type="date" value={form.transaction_date || ""} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} /></div>
          <div><Label>Montante *</Label><Input type="number" step="0.01" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          <div><Label>Moeda</Label><Input value={form.currency || "AOA"} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>Departamento</Label>
            <Select value={form.department_id ?? "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TxStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Descrição *</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2"><Label>Referência</Label><Input value={form.reference || ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Nº de factura, recibo, etc." /></div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BudgetDialog({ open, onOpenChange, budget, accounts, depts, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; budget: Budget | null; accounts: Account[]; depts: Dept[]; onSave: (f: Partial<Budget>) => void }) {
  const [form, setForm] = useState<Partial<Budget>>({});
  useEffect(() => { setForm(budget ?? { year: new Date().getFullYear(), planned_amount: 0 }); }, [budget, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{budget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Ano *</Label><Input type="number" value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
            <div><Label>Valor planeado *</Label><Input type="number" step="0.01" value={form.planned_amount ?? 0} onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Conta *</Label>
            <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Departamento</Label>
            <Select value={form.department_id ?? "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
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
