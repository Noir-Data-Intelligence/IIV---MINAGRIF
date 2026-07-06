import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
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
import { usePagination } from "@/hooks/usePagination";
import { Plus, Rabbit, Pencil, Trash2, Eye, Activity, Stethoscope, BarChart3 } from "lucide-react";

type AnimalSex = "macho" | "femea";
type AnimalStatus = "activo" | "vendido" | "morto" | "abatido" | "transferido";

interface Station { id: string; name: string }

interface Animal {
  id: string;
  station_id: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  sex: AnimalSex;
  birth_date: string | null;
  mother_tag: string | null;
  father_tag: string | null;
  status: AnimalStatus;
  current_weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

interface AnimalEvent {
  id: string;
  animal_id: string;
  event_type: string;
  event_date: string;
  notes: string | null;
  details: any;
  created_at: string;
}

interface HealthRecord {
  id: string;
  animal_id: string;
  record_type: string;
  product_name: string | null;
  dosage: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinarian: string | null;
  record_date: string;
  next_due_date: string | null;
}

const sexLabels: Record<AnimalSex, string> = { macho: "Macho", femea: "Fêmea" };
const statusLabels: Record<AnimalStatus, string> = {
  activo: "Activo", vendido: "Vendido", morto: "Morto", abatido: "Abatido", transferido: "Transferido",
};
const statusVariant: Record<AnimalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  activo: "default", vendido: "secondary", morto: "destructive", abatido: "destructive", transferido: "outline",
};
const eventTypeLabels: Record<string, string> = {
  nascimento: "Nascimento", pesagem: "Pesagem", vacinacao: "Vacinação",
  tratamento: "Tratamento", transferencia: "Transferência", venda: "Venda",
  morte: "Morte", abate: "Abate", observacao: "Observação",
};

export default function Animais() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const writable = canWrite("animais");
  const { toast } = useToast();
  const pag = usePagination(20);

  const [stations, setStations] = useState<Station[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStation, setFilterStation] = useState<string>("__all");
  const [filterSpecies, setFilterSpecies] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("__all");

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Animal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Animal | null>(null);

  // form
  const [stationId, setStationId] = useState("");
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<AnimalSex | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [motherTag, setMotherTag] = useState("");
  const [fatherTag, setFatherTag] = useState("");
  const [status, setStatus] = useState<AnimalStatus>("activo");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  // detail tabs
  const [events, setEvents] = useState<AnimalEvent[]>([]);
  const [health, setHealth] = useState<HealthRecord[]>([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [eventType, setEventType] = useState("observacao");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventNotes, setEventNotes] = useState("");
  const [healthType, setHealthType] = useState("vacina");
  const [healthProduct, setHealthProduct] = useState("");
  const [healthDosage, setHealthDosage] = useState("");
  const [healthDiagnosis, setHealthDiagnosis] = useState("");
  const [healthTreatment, setHealthTreatment] = useState("");
  const [healthVet, setHealthVet] = useState("");
  const [healthDate, setHealthDate] = useState(new Date().toISOString().slice(0, 10));
  const [healthNext, setHealthNext] = useState("");

  const fetchStations = async () => {
    const { data } = await supabase.from("stations").select("id, name").order("name");
    setStations((data as Station[]) ?? []);
  };

  const fetchAnimals = async () => {
    setLoading(true);
    let q = supabase.from("animals" as any).select("*", { count: "exact" }).order("tag").range(pag.from, pag.to);
    if (filterStation !== "__all") q = q.eq("station_id", filterStation);
    if (filterStatus !== "__all") q = q.eq("status", filterStatus);
    if (filterSpecies.trim()) q = q.ilike("species", `%${filterSpecies.trim()}%`);
    const { data, count, error } = await q;
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    setAnimals(((data as any) as Animal[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchStations(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchAnimals(); /* eslint-disable-next-line */ }, [pag.page, pag.pageSize, filterStation, filterStatus, filterSpecies]);

  const kpis = useMemo(() => {
    const total = pag.total;
    const activos = animals.filter((a) => a.status === "activo").length;
    const machos = animals.filter((a) => a.sex === "macho" && a.status === "activo").length;
    const femeas = animals.filter((a) => a.sex === "femea" && a.status === "activo").length;
    return { total, activos, machos, femeas };
  }, [animals, pag.total]);

  const resetForm = () => {
    setStationId(""); setTag(""); setName(""); setSpecies(""); setBreed("");
    setSex(""); setBirthDate(""); setMotherTag(""); setFatherTag("");
    setStatus("activo"); setWeight(""); setNotes("");
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sex) return;
    const payload: any = {
      station_id: stationId, tag, name: name || null, species, breed: breed || null,
      sex, birth_date: birthDate || null, mother_tag: motherTag || null,
      father_tag: fatherTag || null, status,
      current_weight_kg: weight ? Number(weight) : null, notes: notes || null,
      created_by: user?.id ?? null,
    };
    const { error } = await supabase.from("animals" as any).insert(payload);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Animal cadastrado" });
    setOpen(false); resetForm(); fetchAnimals();
  };

  const openEdit = (a: Animal) => {
    setEditItem(a);
    setStationId(a.station_id); setTag(a.tag); setName(a.name || "");
    setSpecies(a.species); setBreed(a.breed || ""); setSex(a.sex);
    setBirthDate(a.birth_date || ""); setMotherTag(a.mother_tag || "");
    setFatherTag(a.father_tag || ""); setStatus(a.status);
    setWeight(a.current_weight_kg?.toString() || ""); setNotes(a.notes || "");
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !sex) return;
    const payload: any = {
      station_id: stationId, tag, name: name || null, species, breed: breed || null,
      sex, birth_date: birthDate || null, mother_tag: motherTag || null,
      father_tag: fatherTag || null, status,
      current_weight_kg: weight ? Number(weight) : null, notes: notes || null,
    };
    const { error } = await supabase.from("animals" as any).update(payload).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Animal actualizado" });
    setEditItem(null); resetForm(); fetchAnimals();
  };

  const submitDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("animals" as any).delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Animal eliminado" });
    setDeleteId(null); fetchAnimals();
  };

  const loadDetail = async (a: Animal) => {
    setViewItem(a);
    const [{ data: ev }, { data: hr }] = await Promise.all([
      supabase.from("animal_events" as any).select("*").eq("animal_id", a.id).order("event_date", { ascending: false }),
      supabase.from("animal_health_records" as any).select("*").eq("animal_id", a.id).order("record_date", { ascending: false }),
    ]);
    setEvents(((ev as any) as AnimalEvent[]) ?? []);
    setHealth(((hr as any) as HealthRecord[]) ?? []);
  };

  const submitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewItem) return;
    const { error } = await supabase.from("animal_events" as any).insert({
      animal_id: viewItem.id, event_type: eventType, event_date: eventDate,
      notes: eventNotes || null, recorded_by: user?.id ?? null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Evento registado" });
    setEventOpen(false); setEventNotes(""); loadDetail(viewItem);
  };

  const submitHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewItem) return;
    const { error } = await supabase.from("animal_health_records" as any).insert({
      animal_id: viewItem.id, record_type: healthType,
      product_name: healthProduct || null, dosage: healthDosage || null,
      diagnosis: healthDiagnosis || null, treatment: healthTreatment || null,
      veterinarian: healthVet || null, record_date: healthDate,
      next_due_date: healthNext || null, recorded_by: user?.id ?? null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Registo sanitário criado" });
    setHealthOpen(false);
    setHealthProduct(""); setHealthDosage(""); setHealthDiagnosis(""); setHealthTreatment(""); setHealthVet(""); setHealthNext("");
    loadDetail(viewItem);
  };

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Label>Estação</Label>
        <Select value={stationId} onValueChange={setStationId} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar estação" /></SelectTrigger>
          <SelectContent>
            {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Brinco / Tag</Label><Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex: BR-001" required /></div>
      <div><Label>Nome (opcional)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Espécie</Label><Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ex: Bovino" required /></div>
      <div><Label>Raça</Label><Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Ex: Nelore" /></div>
      <div>
        <Label>Sexo</Label>
        <Select value={sex} onValueChange={(v) => setSex(v as AnimalSex)} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="macho">Macho</SelectItem>
            <SelectItem value="femea">Fêmea</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Data de nascimento</Label><Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
      <div><Label>Brinco da mãe</Label><Input value={motherTag} onChange={(e) => setMotherTag(e.target.value)} /></div>
      <div><Label>Brinco do pai</Label><Input value={fatherTag} onChange={(e) => setFatherTag(e.target.value)} /></div>
      <div>
        <Label>Estado</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as AnimalStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Peso actual (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Rabbit} title="Animais" description="Rastreabilidade individual de animais nas estações zootécnicas">
        {writable && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Animal</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-serif">Cadastrar Animal</DialogTitle></DialogHeader>
              <form onSubmit={submitCreate} className="space-y-4">
                {formFields}
                <Button type="submit" className="w-full" disabled={!stationId || !sex || !tag || !species}>Criar</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </AdminPageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-serif font-bold">{kpis.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Activos (página)</p>
          <p className="text-2xl font-serif font-bold text-primary">{kpis.activos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Machos</p>
          <p className="text-2xl font-serif font-bold">{kpis.machos}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Fêmeas</p>
          <p className="text-2xl font-serif font-bold">{kpis.femeas}</p>
        </div>
      </div>

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Editar Animal</DialogTitle></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            {formFields}
            <Button type="submit" className="w-full" disabled={!stationId || !sex}>Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={submitDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Rabbit className="h-5 w-5 text-primary" />
              {viewItem?.tag} {viewItem?.name && <span className="text-muted-foreground font-normal">— {viewItem.name}</span>}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <Tabs defaultValue="ficha" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ficha"><BarChart3 className="mr-1 h-4 w-4" /> Ficha</TabsTrigger>
                <TabsTrigger value="eventos"><Activity className="mr-1 h-4 w-4" /> Eventos ({events.length})</TabsTrigger>
                <TabsTrigger value="saude"><Stethoscope className="mr-1 h-4 w-4" /> Saúde ({health.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="ficha" className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Espécie:</span><p className="font-medium">{viewItem.species}</p></div>
                  <div><span className="text-muted-foreground">Raça:</span><p className="font-medium">{viewItem.breed || "—"}</p></div>
                  <div><span className="text-muted-foreground">Sexo:</span><p className="font-medium">{sexLabels[viewItem.sex]}</p></div>
                  <div><span className="text-muted-foreground">Nascimento:</span><p className="font-medium">{viewItem.birth_date ? new Date(viewItem.birth_date).toLocaleDateString("pt-AO") : "—"}</p></div>
                  <div><span className="text-muted-foreground">Mãe:</span><p className="font-medium">{viewItem.mother_tag || "—"}</p></div>
                  <div><span className="text-muted-foreground">Pai:</span><p className="font-medium">{viewItem.father_tag || "—"}</p></div>
                  <div><span className="text-muted-foreground">Peso:</span><p className="font-medium">{viewItem.current_weight_kg ? `${viewItem.current_weight_kg} kg` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={statusVariant[viewItem.status]}>{statusLabels[viewItem.status]}</Badge></p></div>
                </div>
                {viewItem.notes && <div><span className="text-muted-foreground">Observações:</span><p className="font-medium mt-1">{viewItem.notes}</p></div>}
              </TabsContent>

              <TabsContent value="eventos" className="space-y-3">
                {writable && (
                  <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Novo evento</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-serif">Registar evento</DialogTitle></DialogHeader>
                      <form onSubmit={submitEvent} className="space-y-3">
                        <div>
                          <Label>Tipo</Label>
                          <Select value={eventType} onValueChange={setEventType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Data</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /></div>
                        <div><Label>Notas</Label><Textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} /></div>
                        <Button type="submit" className="w-full">Registar</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem eventos registados.</p>
                ) : (
                  <div className="space-y-2">
                    {events.map((e) => (
                      <div key={e.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="secondary">{eventTypeLabels[e.event_type] || e.event_type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString("pt-AO")}</span>
                        </div>
                        {e.notes && <p className="text-sm">{e.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saude" className="space-y-3">
                {writable && (
                  <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Novo registo</Button></DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="font-serif">Registo sanitário</DialogTitle></DialogHeader>
                      <form onSubmit={submitHealth} className="space-y-3">
                        <div>
                          <Label>Tipo</Label>
                          <Select value={healthType} onValueChange={setHealthType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vacina">Vacina</SelectItem>
                              <SelectItem value="tratamento">Tratamento</SelectItem>
                              <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                              <SelectItem value="desparasitacao">Desparasitação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Produto</Label><Input value={healthProduct} onChange={(e) => setHealthProduct(e.target.value)} /></div>
                          <div><Label>Dosagem</Label><Input value={healthDosage} onChange={(e) => setHealthDosage(e.target.value)} /></div>
                        </div>
                        <div><Label>Diagnóstico</Label><Textarea value={healthDiagnosis} onChange={(e) => setHealthDiagnosis(e.target.value)} /></div>
                        <div><Label>Tratamento</Label><Textarea value={healthTreatment} onChange={(e) => setHealthTreatment(e.target.value)} /></div>
                        <div><Label>Veterinário</Label><Input value={healthVet} onChange={(e) => setHealthVet(e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Data</Label><Input type="date" value={healthDate} onChange={(e) => setHealthDate(e.target.value)} required /></div>
                          <div><Label>Próxima data</Label><Input type="date" value={healthNext} onChange={(e) => setHealthNext(e.target.value)} /></div>
                        </div>
                        <Button type="submit" className="w-full">Guardar</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                {health.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem registos sanitários.</p>
                ) : (
                  <div className="space-y-2">
                    {health.map((h) => (
                      <div key={h.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Badge variant="secondary">{h.record_type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(h.record_date).toLocaleDateString("pt-AO")}</span>
                        </div>
                        {h.product_name && <p><span className="text-muted-foreground">Produto:</span> {h.product_name} {h.dosage && `(${h.dosage})`}</p>}
                        {h.diagnosis && <p><span className="text-muted-foreground">Diagnóstico:</span> {h.diagnosis}</p>}
                        {h.treatment && <p><span className="text-muted-foreground">Tratamento:</span> {h.treatment}</p>}
                        {h.veterinarian && <p className="text-xs text-muted-foreground">Veterinário: {h.veterinarian}</p>}
                        {h.next_due_date && <p className="text-xs text-primary">Próxima: {new Date(h.next_due_date).toLocaleDateString("pt-AO")}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Animais Cadastrados" icon={Rabbit} loading={loading} isEmpty={animals.length === 0} emptyMessage="Nenhum animal cadastrado.">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={filterStation} onValueChange={setFilterStation}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Estação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas as estações</SelectItem>
              {stations.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos estados</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filtrar por espécie..."
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="sm:w-56"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brinco</TableHead>
              <TableHead>Espécie/Raça</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Estação</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-28">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {animals.map((a) => {
              const st = stations.find((s) => s.id === a.station_id);
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Rabbit className="h-4 w-4 text-primary" />
                      <div>
                        <p>{a.tag}</p>
                        {a.name && <p className="text-xs text-muted-foreground">{a.name}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{a.species}</p>
                    {a.breed && <p className="text-xs text-muted-foreground">{a.breed}</p>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{sexLabels[a.sex]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{st?.name || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant[a.status]}>{statusLabels[a.status]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => loadDetail(a)}><Eye className="h-4 w-4" /></Button>
                      {writable && <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>}
                      {writable && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          canPrev={pag.canPrev}
          canNext={pag.canNext}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>
    </div>
  );
}
