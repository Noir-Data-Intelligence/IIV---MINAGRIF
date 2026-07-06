import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, TestTubes, Pencil, Trash2, Eye } from "lucide-react";


interface Lab { id: string; name: string; }
interface Analysis {
  id: string; laboratory_id: string; client_name: string; animal_species: string | null;
  animal_id: string | null; sample_type: string; analysis_type: string;
  scheduled_date: string; status: string; notes: string | null; created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  agendada: { label: "Agendada", variant: "secondary" },
  em_progresso: { label: "Em Progresso", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

export default function Analises() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Analysis | null>(null);
  const [viewItem, setViewItem] = useState<Analysis | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [labId, setLabId] = useState("");
  const [clientName, setClientName] = useState("");
  const [animalSpecies, setAnimalSpecies] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [statusVal, setStatusVal] = useState("agendada");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [analysesRes, labsRes] = await Promise.all([
      supabase
        .from("lab_analyses")
        .select("*", { count: "exact" })
        .order("scheduled_date", { ascending: false })
        .range(pag.from, pag.to),
      supabase.from("laboratories").select("id, name").order("name"),
    ]);
    setAnalyses((analysesRes.data as Analysis[]) ?? []);
    pag.setTotal(analysesRes.count ?? 0);
    setLabs((labsRes.data as Lab[]) ?? []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pag.from, pag.to]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const labNameMap = Object.fromEntries(labs.map((l) => [l.id, l.name]));


  const resetForm = () => {
    setLabId(""); setClientName(""); setAnimalSpecies(""); setAnimalId("");
    setSampleType(""); setAnalysisType(""); setScheduledDate(""); setNotes(""); setStatusVal("agendada");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("lab_analyses").insert({
      laboratory_id: labId, requested_by: user?.id, client_name: clientName,
      animal_species: animalSpecies || null, animal_id: animalId || null,
      sample_type: sampleType, analysis_type: analysisType, scheduled_date: scheduledDate, notes: notes || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Análise agendada com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (a: Analysis) => {
    setEditItem(a); setLabId(a.laboratory_id); setClientName(a.client_name);
    setAnimalSpecies(a.animal_species || ""); setAnimalId(a.animal_id || "");
    setSampleType(a.sample_type); setAnalysisType(a.analysis_type);
    setScheduledDate(a.scheduled_date); setNotes(a.notes || ""); setStatusVal(a.status);
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("lab_analyses").update({
      laboratory_id: labId, client_name: clientName, animal_species: animalSpecies || null,
      animal_id: animalId || null, sample_type: sampleType, analysis_type: analysisType,
      scheduled_date: scheduledDate, notes: notes || null, status: statusVal,
    } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Análise actualizada" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lab_analyses").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Análise eliminada" }); setDeleteId(null); fetchData();
  };

  const formFields = (
    <>
      <div>
        <Label>Laboratório</Label>
        <Select value={labId} onValueChange={setLabId} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar laboratório" /></SelectTrigger>
          <SelectContent>{labs.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Nome do Cliente</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do proprietário" required /></div>
        <div><Label>Espécie Animal</Label><Input value={animalSpecies} onChange={(e) => setAnimalSpecies(e.target.value)} placeholder="Ex: Bovino, Suíno" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>ID do Animal</Label><Input value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="Identificação" /></div>
        <div><Label>Tipo de Amostra</Label><Input value={sampleType} onChange={(e) => setSampleType(e.target.value)} placeholder="Ex: Sangue, Tecido" required /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Tipo de Análise</Label><Input value={analysisType} onChange={(e) => setAnalysisType(e.target.value)} placeholder="Ex: PCR, Cultura" required /></div>
        <div><Label>Data Agendada</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required /></div>
      </div>
      <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais" /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={TestTubes} title="Análises Laboratoriais" description="Agendamento e acompanhamento de análises">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Agendar Análise</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-serif">Agendar Nova Análise</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {formFields}
              <Button type="submit" className="w-full">Agendar Análise</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">Editar Análise</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {formFields}
            <div>
              <Label>Estado</Label>
              <Select value={statusVal} onValueChange={setStatusVal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">Detalhes da Análise</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Laboratório:</span><p className="font-medium">{labNameMap[viewItem.laboratory_id] ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Data Agendada:</span><p className="font-medium">{new Date(viewItem.scheduled_date).toLocaleDateString("pt-AO")}</p></div>
                <div><span className="text-muted-foreground">Cliente:</span><p className="font-medium">{viewItem.client_name}</p></div>
                <div><span className="text-muted-foreground">Espécie Animal:</span><p className="font-medium">{viewItem.animal_species || "—"}</p></div>
                <div><span className="text-muted-foreground">ID do Animal:</span><p className="font-medium">{viewItem.animal_id || "—"}</p></div>
                <div><span className="text-muted-foreground">Tipo de Amostra:</span><p className="font-medium">{viewItem.sample_type}</p></div>
                <div><span className="text-muted-foreground">Tipo de Análise:</span><p className="font-medium">{viewItem.analysis_type}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={(statusMap[viewItem.status] ?? statusMap.agendada).variant}>{(statusMap[viewItem.status] ?? statusMap.agendada).label}</Badge></p></div>
              </div>
              {viewItem.notes && <div><span className="text-muted-foreground">Observações:</span><p className="font-medium mt-1">{viewItem.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Lista de Análises" icon={TestTubes} loading={loading} isEmpty={analyses.length === 0} emptyMessage="Nenhuma análise registada.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Laboratório</TableHead><TableHead>Cliente</TableHead>
                <TableHead>Espécie</TableHead><TableHead>Tipo Análise</TableHead><TableHead>Estado</TableHead><TableHead className="w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((a) => {
                const st = statusMap[a.status] ?? statusMap.agendada;
                return (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.scheduled_date).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell>{labNameMap[a.laboratory_id] ?? "—"}</TableCell>
                    <TableCell className="font-medium">{a.client_name}</TableCell>
                    <TableCell>{a.animal_species || "—"}</TableCell>
                    <TableCell>{a.analysis_type}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewItem(a)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
