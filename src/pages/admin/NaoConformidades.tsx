import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, AlertTriangle, Pencil, Trash2, Eye } from "lucide-react";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";
import { format } from "date-fns";

interface NC {
  id: string; title: string; description: string; severity: string; status: string;
  corrective_action: string | null; deadline: string | null; resolved_at: string | null;
  department_id: string | null; audit_id: string | null;
  departments?: { name: string } | null; quality_audits?: { title: string } | null;
}

const sevMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  menor: { label: "Menor", variant: "secondary" }, maior: { label: "Maior", variant: "default" }, critica: { label: "Crítica", variant: "destructive" },
};
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberta: { label: "Aberta", variant: "destructive" }, em_resolucao: { label: "Em Resolução", variant: "secondary" },
  resolvida: { label: "Resolvida", variant: "default" }, encerrada: { label: "Encerrada", variant: "outline" },
};

export default function NaoConformidades() {
  const [ncs, setNcs] = useState<NC[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [audits, setAudits] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<NC | null>(null);
  const [editItem, setEditItem] = useState<NC | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("menor");
  const [statusVal, setStatusVal] = useState("aberta");
  const [deptId, setDeptId] = useState("");
  const [auditId, setAuditId] = useState("");
  const [corrective, setCorrective] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [ncRes, dRes, aRes] = await Promise.all([
      supabase.from("nonconformities")
        .select("*, departments(name), quality_audits(title)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(pag.from, pag.to),
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("quality_audits").select("id, title").order("title"),
    ]);
    setNcs((ncRes.data as any[]) ?? []);
    pag.setTotal(ncRes.count ?? 0);
    setDepartments((dRes.data as any[]) ?? []);
    setAudits((aRes.data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setTitle(""); setDescription(""); setSeverity("menor"); setStatusVal("aberta"); setDeptId(""); setAuditId(""); setCorrective(""); setDeadline(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("nonconformities").insert({
      title, description, severity, department_id: deptId || null,
      audit_id: auditId || null, corrective_action: corrective || null, deadline: deadline || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Não-conformidade registada" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (nc: NC) => {
    setEditItem(nc); setTitle(nc.title); setDescription(nc.description); setSeverity(nc.severity);
    setStatusVal(nc.status); setDeptId(nc.department_id || ""); setAuditId(nc.audit_id || "");
    setCorrective(nc.corrective_action || ""); setDeadline(nc.deadline || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const update: any = {
      title, description, severity, status: statusVal,
      department_id: deptId || null, audit_id: auditId || null,
      corrective_action: corrective || null, deadline: deadline || null,
    };
    if (statusVal === "resolvida" && editItem.status !== "resolvida") update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("nonconformities").update(update).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Não-conformidade actualizada" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("nonconformities").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Não-conformidade eliminada" }); setDeleteId(null); fetchData();
  };

  const formFields = (
    <>
      <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Gravidade</Label>
          <Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="menor">Menor</SelectItem><SelectItem value="maior">Maior</SelectItem><SelectItem value="critica">Crítica</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Prazo</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Departamento</Label>
          <Select value={deptId} onValueChange={setDeptId}><SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
            <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Auditoria</Label>
          <Select value={auditId} onValueChange={setAuditId}><SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
            <SelectContent>{audits.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Acção Correctiva</Label><Textarea value={corrective} onChange={(e) => setCorrective(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={AlertTriangle} title="Não-Conformidades" description="Registo e acompanhamento de não-conformidades">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova NC</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Registar Não-Conformidade</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full">Registar</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Editar Não-Conformidade</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {formFields}
            <div><Label>Estado</Label>
              <Select value={statusVal} onValueChange={setStatusVal}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Detalhes da Não-Conformidade</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Título:</span><p className="font-medium">{viewItem.title}</p></div>
                <div><span className="text-muted-foreground">Gravidade:</span><p><Badge variant={(sevMap[viewItem.severity] ?? sevMap.menor).variant}>{(sevMap[viewItem.severity] ?? sevMap.menor).label}</Badge></p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={(statusMap[viewItem.status] ?? statusMap.aberta).variant}>{(statusMap[viewItem.status] ?? statusMap.aberta).label}</Badge></p></div>
                <div><span className="text-muted-foreground">Departamento:</span><p className="font-medium">{viewItem.departments?.name ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Auditoria:</span><p className="font-medium">{viewItem.quality_audits?.title ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Prazo:</span><p className="font-medium">{viewItem.deadline ? format(new Date(viewItem.deadline), "dd/MM/yyyy") : "—"}</p></div>
                <div><span className="text-muted-foreground">Resolvida em:</span><p className="font-medium">{viewItem.resolved_at ? format(new Date(viewItem.resolved_at), "dd/MM/yyyy") : "—"}</p></div>
              </div>
              <div><span className="text-muted-foreground">Descrição:</span><p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.description}</p></div>
              {viewItem.corrective_action && <div><span className="text-muted-foreground">Acção Correctiva:</span><p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.corrective_action}</p></div>}

              <AttachedDocsPanel entityType="nonconformity" entityId={viewItem.id} />

              <div className="flex justify-end pt-2 border-t border-border/40">
                <OpenProcessButton
                  entityType="nonconformity" entityId={viewItem.id}
                  defaultTitle={`NC: ${viewItem.title}`}
                  defaultTypeHint="Não Conformidade"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Não-Conformidades Registadas" icon={AlertTriangle} loading={loading} isEmpty={ncs.length === 0} emptyMessage="Nenhuma não-conformidade registada.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead><TableHead>Gravidade</TableHead><TableHead>Estado</TableHead>
                <TableHead>Departamento</TableHead><TableHead>Prazo</TableHead><TableHead className="w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncs.map((nc) => {
                const sev = sevMap[nc.severity] ?? { label: nc.severity, variant: "secondary" as const };
                const st = statusMap[nc.status] ?? { label: nc.status, variant: "outline" as const };
                const overdue = nc.deadline && !nc.resolved_at && new Date(nc.deadline) < new Date();
                return (
                  <TableRow key={nc.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><AlertTriangle className={`h-4 w-4 ${nc.severity === "critica" ? "text-destructive" : "text-secondary"}`} />{nc.title}</div></TableCell>
                    <TableCell><Badge variant={sev.variant}>{sev.label}</Badge></TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{nc.departments?.name ?? "—"}</TableCell>
                    <TableCell>{nc.deadline ? <span className={overdue ? "text-destructive font-medium" : ""}>{format(new Date(nc.deadline), "dd/MM/yyyy")}</span> : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewItem(nc)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(nc)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(nc.id)}><Trash2 className="h-4 w-4" /></Button>
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
