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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Dna, Pencil, Trash2, Building2, Droplet, FlaskConical, Activity, AlertTriangle } from "lucide-react";

type BreederStatus = "activo" | "inactivo" | "baixado";
type InseminationResult = "pendente" | "confirmada" | "falhou";
type SemenQuality = "A" | "B" | "C";

interface IACenter { id: string; name: string; location: string | null; responsible_user_id: string | null; notes: string | null; is_active: boolean }
interface Breeder { id: string; center_id: string; tag: string; name: string | null; species: string; breed: string | null; birth_date: string | null; status: BreederStatus; notes: string | null }
interface Tank { id: string; center_id: string; code: string; capacity_l: number; current_level_l: number; min_level_l: number; last_refill_date: string | null; notes: string | null }
interface Dose { id: string; breeder_id: string; tank_id: string | null; collection_date: string; quantity: number; available_quantity: number; quality_grade: SemenQuality | null; notes: string | null }
interface Insem { id: string; animal_id: string; dose_id: string | null; technician_id: string | null; insemination_date: string; result: InseminationResult; pregnancy_confirmed_at: string | null; expected_birth_date: string | null; notes: string | null }
interface Animal { id: string; tag: string; species: string }

const resultLabels: Record<InseminationResult, string> = { pendente: "Pendente", confirmada: "Confirmada", falhou: "Falhou" };
const resultVariant: Record<InseminationResult, "default" | "secondary" | "destructive" | "outline"> = { pendente: "outline", confirmada: "default", falhou: "destructive" };
const statusLabels: Record<BreederStatus, string> = { activo: "Activo", inactivo: "Inactivo", baixado: "Baixado" };

export default function Inseminacao() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("inseminacao");

  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<IACenter[]>([]);
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [insems, setInsems] = useState<Insem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);

  // dialogs
  const [centerOpen, setCenterOpen] = useState(false);
  const [centerEdit, setCenterEdit] = useState<IACenter | null>(null);
  const [breederOpen, setBreederOpen] = useState(false);
  const [breederEdit, setBreederEdit] = useState<Breeder | null>(null);
  const [tankOpen, setTankOpen] = useState(false);
  const [tankEdit, setTankEdit] = useState<Tank | null>(null);
  const [doseOpen, setDoseOpen] = useState(false);
  const [doseEdit, setDoseEdit] = useState<Dose | null>(null);
  const [insemOpen, setInsemOpen] = useState(false);
  const [insemEdit, setInsemEdit] = useState<Insem | null>(null);

  const [deleteId, setDeleteId] = useState<{ table: string; id: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [c, b, t, d, i, a] = await Promise.all([
      supabase.from("ia_centers").select("*").order("name"),
      supabase.from("breeders").select("*").order("tag"),
      supabase.from("nitrogen_tanks").select("*").order("code"),
      supabase.from("semen_doses").select("*").order("collection_date", { ascending: false }),
      supabase.from("insemination_records").select("*").order("insemination_date", { ascending: false }),
      supabase.from("animals").select("id,tag,species").order("tag"),
    ]);
    if (c.data) setCenters(c.data as IACenter[]);
    if (b.data) setBreeders(b.data as Breeder[]);
    if (t.data) setTanks(t.data as Tank[]);
    if (d.data) setDoses(d.data as Dose[]);
    if (i.data) setInsems(i.data as Insem[]);
    if (a.data) setAnimals(a.data as Animal[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // KPIs
  const kpis = useMemo(() => {
    const totalDoses = doses.reduce((s, d) => s + (d.available_quantity || 0), 0);
    const lowTanks = tanks.filter((t) => t.current_level_l <= t.min_level_l).length;
    const confirmed = insems.filter((i) => i.result === "confirmada").length;
    const evaluated = insems.filter((i) => i.result !== "pendente").length;
    const rate = evaluated > 0 ? Math.round((confirmed / evaluated) * 100) : 0;
    return { totalDoses, lowTanks, rate, activeBreeders: breeders.filter((b) => b.status === "activo").length };
  }, [doses, tanks, insems, breeders]);

  const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? "—";
  const breederTag = (id: string) => breeders.find((b) => b.id === id)?.tag ?? "—";
  const tankCode = (id: string | null) => (id ? tanks.find((t) => t.id === id)?.code ?? "—" : "—");
  const animalTag = (id: string) => animals.find((a) => a.id === id)?.tag ?? "—";

  // ============ Save handlers ============
  const saveCenter = async (form: Partial<IACenter>) => {
    const payload = { name: form.name!, location: form.location || null, notes: form.notes || null, is_active: form.is_active ?? true };
    const { error } = centerEdit
      ? await supabase.from("ia_centers").update(payload).eq("id", centerEdit.id)
      : await supabase.from("ia_centers").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: centerEdit ? "Centro actualizado" : "Centro criado" });
    setCenterOpen(false); setCenterEdit(null); loadAll();
  };

  const saveBreeder = async (form: Partial<Breeder>) => {
    if (!form.center_id || !form.tag || !form.species) return toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
    const payload = {
      center_id: form.center_id, tag: form.tag, name: form.name || null, species: form.species,
      breed: form.breed || null, birth_date: form.birth_date || null, status: form.status || "activo", notes: form.notes || null,
    };
    const { error } = breederEdit
      ? await supabase.from("breeders").update(payload).eq("id", breederEdit.id)
      : await supabase.from("breeders").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: breederEdit ? "Reprodutor actualizado" : "Reprodutor criado" });
    setBreederOpen(false); setBreederEdit(null); loadAll();
  };

  const saveTank = async (form: Partial<Tank>) => {
    if (!form.center_id || !form.code) return toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
    const payload = {
      center_id: form.center_id, code: form.code,
      capacity_l: Number(form.capacity_l) || 0, current_level_l: Number(form.current_level_l) || 0,
      min_level_l: Number(form.min_level_l) || 0, last_refill_date: form.last_refill_date || null, notes: form.notes || null,
    };
    const { error } = tankEdit
      ? await supabase.from("nitrogen_tanks").update(payload).eq("id", tankEdit.id)
      : await supabase.from("nitrogen_tanks").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: tankEdit ? "Tanque actualizado" : "Tanque criado" });
    setTankOpen(false); setTankEdit(null); loadAll();
  };

  const saveDose = async (form: Partial<Dose>) => {
    if (!form.breeder_id) return toast({ title: "Reprodutor obrigatório", variant: "destructive" });
    const qty = Number(form.quantity) || 0;
    const payload = {
      breeder_id: form.breeder_id, tank_id: form.tank_id || null,
      collection_date: form.collection_date || new Date().toISOString().slice(0, 10),
      quantity: qty, available_quantity: Number(form.available_quantity ?? qty) || 0,
      quality_grade: (form.quality_grade as SemenQuality) || "A", notes: form.notes || null,
    };
    const { error } = doseEdit
      ? await supabase.from("semen_doses").update(payload).eq("id", doseEdit.id)
      : await supabase.from("semen_doses").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: doseEdit ? "Dose actualizada" : "Dose registada" });
    setDoseOpen(false); setDoseEdit(null); loadAll();
  };

  const saveInsem = async (form: Partial<Insem>) => {
    if (!form.animal_id) return toast({ title: "Animal obrigatório", variant: "destructive" });
    const payload = {
      animal_id: form.animal_id, dose_id: form.dose_id || null,
      technician_id: user?.id || null,
      insemination_date: form.insemination_date || new Date().toISOString().slice(0, 10),
      result: (form.result as InseminationResult) || "pendente",
      pregnancy_confirmed_at: form.pregnancy_confirmed_at || null,
      expected_birth_date: form.expected_birth_date || null,
      notes: form.notes || null,
    };
    const { error } = insemEdit
      ? await supabase.from("insemination_records").update(payload).eq("id", insemEdit.id)
      : await supabase.from("insemination_records").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: insemEdit ? "Inseminação actualizada" : "Inseminação registada" });
    setInsemOpen(false); setInsemEdit(null); loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(deleteId.table as any).delete().eq("id", deleteId.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Registo apagado" });
    setDeleteId(null); loadAll();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Dna} title="Inseminação Artificial" description="Gestão de centros, reprodutores, doses, tanques e inseminações." />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Building2} title="Reprodutores Activos" metric={kpis.activeBreeders} stagger={1} />
        <AdminCard variant="glass" icon={FlaskConical} title="Doses Disponíveis" metric={kpis.totalDoses} stagger={2} />
        <AdminCard variant="glass" icon={Activity} title="Taxa de Concepção" metric={`${kpis.rate}%`} stagger={3} />
        <AdminCard variant={kpis.lowTanks > 0 ? "gradient-gold" : "glass"} icon={AlertTriangle} title="Tanques N₂ baixos" metric={kpis.lowTanks} stagger={4} />
      </div>

      <Tabs defaultValue="centros" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="centros"><Building2 className="h-4 w-4 mr-1" /> Centros</TabsTrigger>
          <TabsTrigger value="reprodutores"><Dna className="h-4 w-4 mr-1" /> Reprodutores</TabsTrigger>
          <TabsTrigger value="tanques"><Droplet className="h-4 w-4 mr-1" /> Tanques N₂</TabsTrigger>
          <TabsTrigger value="doses"><FlaskConical className="h-4 w-4 mr-1" /> Doses</TabsTrigger>
          <TabsTrigger value="inseminacoes"><Activity className="h-4 w-4 mr-1" /> Inseminações</TabsTrigger>
        </TabsList>

        {/* ============ CENTROS ============ */}
        <TabsContent value="centros">
          <AdminCard title="Centros de Inseminação" loading={loading} isEmpty={!loading && centers.length === 0}
            emptyMessage="Sem centros registados.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setCenterEdit(null); setCenterOpen(true); }} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Novo Centro
                </Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Localização</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {centers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.location ?? "—"}</TableCell>
                    <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Activo" : "Inactivo"}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setCenterEdit(c); setCenterOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "ia_centers", id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        {/* ============ REPRODUTORES ============ */}
        <TabsContent value="reprodutores">
          <AdminCard title="Reprodutores" loading={loading} isEmpty={!loading && breeders.length === 0}
            emptyMessage="Sem reprodutores registados.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setBreederEdit(null); setBreederOpen(true); }} size="sm" disabled={centers.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Reprodutor
                </Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Brinco</TableHead><TableHead>Nome</TableHead><TableHead>Espécie</TableHead>
                <TableHead>Raça</TableHead><TableHead>Centro</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {breeders.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.tag}</TableCell>
                    <TableCell>{b.name ?? "—"}</TableCell>
                    <TableCell>{b.species}</TableCell>
                    <TableCell>{b.breed ?? "—"}</TableCell>
                    <TableCell>{centerName(b.center_id)}</TableCell>
                    <TableCell><Badge variant={b.status === "activo" ? "default" : "secondary"}>{statusLabels[b.status]}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setBreederEdit(b); setBreederOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "breeders", id: b.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        {/* ============ TANQUES ============ */}
        <TabsContent value="tanques">
          <AdminCard title="Tanques de Azoto Líquido" loading={loading} isEmpty={!loading && tanks.length === 0}
            emptyMessage="Sem tanques registados.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setTankEdit(null); setTankOpen(true); }} size="sm" disabled={centers.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Tanque
                </Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Centro</TableHead><TableHead>Capacidade (L)</TableHead>
                <TableHead>Nível Actual</TableHead><TableHead>Última Recarga</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {tanks.map((t) => {
                  const low = t.current_level_l <= t.min_level_l;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.code}</TableCell>
                      <TableCell>{centerName(t.center_id)}</TableCell>
                      <TableCell>{t.capacity_l}</TableCell>
                      <TableCell>{t.current_level_l} L</TableCell>
                      <TableCell>{t.last_refill_date ?? "—"}</TableCell>
                      <TableCell>{low ? <Badge variant="destructive">N₂ baixo</Badge> : <Badge variant="default">OK</Badge>}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => { setTankEdit(t); setTankOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "nitrogen_tanks", id: t.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        {/* ============ DOSES ============ */}
        <TabsContent value="doses">
          <AdminCard title="Doses de Sémen" loading={loading} isEmpty={!loading && doses.length === 0}
            emptyMessage="Sem doses registadas.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setDoseEdit(null); setDoseOpen(true); }} size="sm" disabled={breeders.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Dose
                </Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Reprodutor</TableHead><TableHead>Tanque</TableHead>
                <TableHead>Quantidade</TableHead><TableHead>Disponível</TableHead><TableHead>Qualidade</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {doses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.collection_date}</TableCell>
                    <TableCell className="font-mono">{breederTag(d.breeder_id)}</TableCell>
                    <TableCell>{tankCode(d.tank_id)}</TableCell>
                    <TableCell>{d.quantity}</TableCell>
                    <TableCell>{d.available_quantity}</TableCell>
                    <TableCell><Badge variant="outline">{d.quality_grade ?? "—"}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setDoseEdit(d); setDoseOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "semen_doses", id: d.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        {/* ============ INSEMINAÇÕES ============ */}
        <TabsContent value="inseminacoes">
          <AdminCard title="Registos de Inseminação" loading={loading} isEmpty={!loading && insems.length === 0}
            emptyMessage="Sem inseminações registadas.">
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button onClick={() => { setInsemEdit(null); setInsemOpen(true); }} size="sm" disabled={animals.length === 0}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Inseminação
                </Button>
              )}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Animal</TableHead><TableHead>Dose</TableHead>
                <TableHead>Resultado</TableHead><TableHead>Confirmação</TableHead><TableHead>Parto previsto</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {insems.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.insemination_date}</TableCell>
                    <TableCell className="font-mono">{animalTag(i.animal_id)}</TableCell>
                    <TableCell className="font-mono">{i.dose_id ? breederTag(doses.find((d) => d.id === i.dose_id)?.breeder_id ?? "") : "—"}</TableCell>
                    <TableCell><Badge variant={resultVariant[i.result]}>{resultLabels[i.result]}</Badge></TableCell>
                    <TableCell>{i.pregnancy_confirmed_at ?? "—"}</TableCell>
                    <TableCell>{i.expected_birth_date ?? "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setInsemEdit(i); setInsemOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId({ table: "insemination_records", id: i.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>
      </Tabs>

      {/* ============ DIALOGS ============ */}
      <CenterDialog open={centerOpen} onOpenChange={(o) => { setCenterOpen(o); if (!o) setCenterEdit(null); }} initial={centerEdit} onSave={saveCenter} />
      <BreederDialog open={breederOpen} onOpenChange={(o) => { setBreederOpen(o); if (!o) setBreederEdit(null); }} initial={breederEdit} centers={centers} onSave={saveBreeder} />
      <TankDialog open={tankOpen} onOpenChange={(o) => { setTankOpen(o); if (!o) setTankEdit(null); }} initial={tankEdit} centers={centers} onSave={saveTank} />
      <DoseDialog open={doseOpen} onOpenChange={(o) => { setDoseOpen(o); if (!o) setDoseEdit(null); }} initial={doseEdit} breeders={breeders} tanks={tanks} onSave={saveDose} />
      <InsemDialog open={insemOpen} onOpenChange={(o) => { setInsemOpen(o); if (!o) setInsemEdit(null); }} initial={insemEdit} animals={animals} doses={doses} breeders={breeders} onSave={saveInsem} />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Apagar registo?"
        description="Esta acção é irreversível."
      />
    </div>
  );
}

/* ===== Sub-components (dialog forms) ===== */

function CenterDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: IACenter | null; onSave: (f: Partial<IACenter>) => void }) {
  const [form, setForm] = useState<Partial<IACenter>>({});
  useEffect(() => { setForm(initial ?? { is_active: true }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar centro" : "Novo centro"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Localização</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>Gravar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BreederDialog({ open, onOpenChange, initial, centers, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Breeder | null; centers: IACenter[]; onSave: (f: Partial<Breeder>) => void }) {
  const [form, setForm] = useState<Partial<Breeder>>({});
  useEffect(() => { setForm(initial ?? { status: "activo" }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar reprodutor" : "Novo reprodutor"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Brinco *</Label><Input value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></div>
          <div><Label>Nome</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Espécie *</Label><Input value={form.species ?? ""} onChange={(e) => setForm({ ...form, species: e.target.value })} /></div>
          <div><Label>Raça</Label><Input value={form.breed ?? ""} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></div>
          <div className="col-span-2">
            <Label>Centro *</Label>
            <Select value={form.center_id} onValueChange={(v) => setForm({ ...form, center_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data Nascimento</Label><Input type="date" value={form.birth_date ?? ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status ?? "activo"} onValueChange={(v) => setForm({ ...form, status: v as BreederStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem><SelectItem value="inactivo">Inactivo</SelectItem><SelectItem value="baixado">Baixado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Gravar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TankDialog({ open, onOpenChange, initial, centers, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Tank | null; centers: IACenter[]; onSave: (f: Partial<Tank>) => void }) {
  const [form, setForm] = useState<Partial<Tank>>({});
  useEffect(() => { setForm(initial ?? {}); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar tanque" : "Novo tanque"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Código *</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div>
            <Label>Centro *</Label>
            <Select value={form.center_id} onValueChange={(v) => setForm({ ...form, center_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Capacidade (L)</Label><Input type="number" step="0.1" value={form.capacity_l ?? ""} onChange={(e) => setForm({ ...form, capacity_l: Number(e.target.value) })} /></div>
          <div><Label>Nível Actual (L)</Label><Input type="number" step="0.1" value={form.current_level_l ?? ""} onChange={(e) => setForm({ ...form, current_level_l: Number(e.target.value) })} /></div>
          <div><Label>Nível Mínimo (L)</Label><Input type="number" step="0.1" value={form.min_level_l ?? ""} onChange={(e) => setForm({ ...form, min_level_l: Number(e.target.value) })} /></div>
          <div><Label>Última Recarga</Label><Input type="date" value={form.last_refill_date ?? ""} onChange={(e) => setForm({ ...form, last_refill_date: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Gravar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DoseDialog({ open, onOpenChange, initial, breeders, tanks, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Dose | null; breeders: Breeder[]; tanks: Tank[]; onSave: (f: Partial<Dose>) => void }) {
  const [form, setForm] = useState<Partial<Dose>>({});
  useEffect(() => { setForm(initial ?? { quality_grade: "A" }); }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar dose" : "Nova dose"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Reprodutor *</Label>
            <Select value={form.breeder_id} onValueChange={(v) => setForm({ ...form, breeder_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>{breeders.map((b) => <SelectItem key={b.id} value={b.id}>{b.tag} — {b.species}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Tanque</Label>
            <Select value={form.tank_id ?? "none"} onValueChange={(v) => setForm({ ...form, tank_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sem tanque" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem tanque</SelectItem>
                {tanks.map((t) => <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data de Colheita</Label><Input type="date" value={form.collection_date ?? ""} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} /></div>
          <div>
            <Label>Qualidade</Label>
            <Select value={form.quality_grade ?? "A"} onValueChange={(v) => setForm({ ...form, quality_grade: v as SemenQuality })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Quantidade</Label><Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value), available_quantity: form.available_quantity ?? Number(e.target.value) })} /></div>
          <div><Label>Disponível</Label><Input type="number" value={form.available_quantity ?? 0} onChange={(e) => setForm({ ...form, available_quantity: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Gravar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InsemDialog({ open, onOpenChange, initial, animals, doses, breeders, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Insem | null; animals: Animal[]; doses: Dose[]; breeders: Breeder[]; onSave: (f: Partial<Insem>) => void }) {
  const [form, setForm] = useState<Partial<Insem>>({});
  useEffect(() => { setForm(initial ?? { result: "pendente" }); }, [initial, open]);
  const breederTag = (id: string) => breeders.find((b) => b.id === id)?.tag ?? "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar inseminação" : "Nova inseminação"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Animal (fêmea) *</Label>
            <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>{animals.map((a) => <SelectItem key={a.id} value={a.id}>{a.tag} — {a.species}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Dose</Label>
            <Select value={form.dose_id ?? "none"} onValueChange={(v) => setForm({ ...form, dose_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sem dose" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem dose</SelectItem>
                {doses.filter((d) => d.available_quantity > 0).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.collection_date} · {breederTag(d.breeder_id)} ({d.available_quantity} disp.)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Data</Label><Input type="date" value={form.insemination_date ?? ""} onChange={(e) => setForm({ ...form, insemination_date: e.target.value })} /></div>
          <div>
            <Label>Resultado</Label>
            <Select value={form.result ?? "pendente"} onValueChange={(v) => setForm({ ...form, result: v as InseminationResult })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="confirmada">Confirmada</SelectItem><SelectItem value="falhou">Falhou</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Gravidez confirmada em</Label><Input type="date" value={form.pregnancy_confirmed_at ?? ""} onChange={(e) => setForm({ ...form, pregnancy_confirmed_at: e.target.value })} /></div>
          <div><Label>Parto previsto</Label><Input type="date" value={form.expected_birth_date ?? ""} onChange={(e) => setForm({ ...form, expected_birth_date: e.target.value })} /></div>
          <div className="col-span-2"><Label>Notas</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)}>Gravar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
