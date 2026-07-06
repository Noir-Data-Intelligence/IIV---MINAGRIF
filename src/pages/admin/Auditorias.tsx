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
import { Plus, ClipboardCheck, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";

interface Department { id: string; name: string; }
interface Laboratory { id: string; name: string; }
interface Audit {
  id: string; title: string; audit_type: string; auditor: string;
  scheduled_date: string; completed_date: string | null; status: string;
  findings: string | null; recommendations: string | null;
  department_id: string | null; laboratory_id: string | null;
  departments?: Department | null; laboratories?: Laboratory | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planeada: { label: "Planeada", variant: "outline" }, em_curso: { label: "Em Curso", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" }, cancelada: { label: "Cancelada", variant: "destructive" },
};
const typeLabels: Record<string, string> = { interna: "Interna", externa: "Externa", ISO: "ISO" };

export default function Auditorias() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Audit | null>(null);
  const [editItem, setEditItem] = useState<Audit | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [title, setTitle] = useState("");
  const [auditType, setAuditType] = useState("");
  const [auditor, setAuditor] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [deptId, setDeptId] = useState("");
  const [labId, setLabId] = useState("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [statusVal, setStatusVal] = useState("planeada");

  const fetchData = async () => {
    setLoading(true);
    const [aRes, dRes, lRes] = await Promise.all([
      supabase.from("quality_audits")
        .select("*, departments(id, name), laboratories(id, name)", { count: "exact" })
        .order("scheduled_date", { ascending: false })
        .range(pag.from, pag.to),
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("laboratories").select("id, name").order("name"),
    ]);
    setAudits((aRes.data as any[]) ?? []);
    pag.setTotal(aRes.count ?? 0);
    setDepartments((dRes.data as Department[]) ?? []);
    setLaboratories((lRes.data as Laboratory[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setTitle(""); setAuditType(""); setAuditor(""); setScheduledDate(""); setDeptId(""); setLabId(""); setFindings(""); setRecommendations(""); setStatusVal("planeada"); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("quality_audits").insert({
      title, audit_type: auditType, auditor, scheduled_date: scheduledDate,
      department_id: deptId || null, laboratory_id: labId || null,
      findings: findings || null, recommendations: recommendations || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Auditoria criada com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (a: Audit) => {
    setEditItem(a); setTitle(a.title); setAuditType(a.audit_type); setAuditor(a.auditor);
    setScheduledDate(a.scheduled_date); setDeptId(a.department_id || ""); setLabId(a.laboratory_id || "");
    setFindings(a.findings || ""); setRecommendations(a.recommendations || ""); setStatusVal(a.status); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const update: any = {
      title, audit_type: auditType, auditor, scheduled_date: scheduledDate,
      department_id: deptId || null, laboratory_id: labId || null,
      findings: findings || null, recommendations: recommendations || null, status: statusVal,
    };
    if (statusVal === "concluida" && editItem.status !== "concluida") update.completed_date = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("quality_audits").update(update).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Auditoria actualizada" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("quality_audits").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Auditoria eliminada" }); setDeleteId(null); fetchData();
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.setFontSize(16); doc.text("Instituto de Investigação Veterinária", 105, 20, { align: "center" });
    doc.setFontSize(11); doc.text("Relatório de Auditorias", 105, 28, { align: "center" });
    doc.setFont(PDF_BODY_FONT, "normal");
    doc.setFontSize(9); doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 105, 34, { align: "center" });
    autoTable(doc, {
      startY: 42, head: [["Título", "Tipo", "Auditor", "Data", "Estado"]],
      body: audits.map((a) => [a.title, typeLabels[a.audit_type] || a.audit_type, a.auditor, format(new Date(a.scheduled_date), "dd/MM/yyyy"), statusMap[a.status]?.label ?? a.status]),
      styles: { font: PDF_BODY_FONT },
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
    });
    doc.save("auditorias.pdf");
  };

  const formFields = (
    <>
      <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Tipo</Label>
          <Select value={auditType} onValueChange={setAuditType} required>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent><SelectItem value="interna">Interna</SelectItem><SelectItem value="externa">Externa</SelectItem><SelectItem value="ISO">ISO</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Data</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required /></div>
      </div>
      <div><Label>Auditor</Label><Input value={auditor} onChange={(e) => setAuditor(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Departamento</Label>
          <Select value={deptId} onValueChange={setDeptId}><SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
            <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Laboratório</Label>
          <Select value={labId} onValueChange={setLabId}><SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
            <SelectContent>{laboratories.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Constatações</Label><Textarea value={findings} onChange={(e) => setFindings(e.target.value)} /></div>
      <div><Label>Recomendações</Label><Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardCheck} title="Auditorias" description="Gestão de auditorias internas, externas e ISO">
        {audits.length > 0 && <Button variant="outline" onClick={generatePDF}><FileText className="mr-2 h-4 w-4" /> PDF</Button>}
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Nova Auditoria</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Criar Auditoria</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!auditType}>Criar Auditoria</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Editar Auditoria</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {formFields}
            <div><Label>Estado</Label>
              <Select value={statusVal} onValueChange={setStatusVal}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!auditType}>Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Detalhes da Auditoria</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Título:</span><p className="font-medium">{viewItem.title}</p></div>
                <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{typeLabels[viewItem.audit_type] || viewItem.audit_type}</p></div>
                <div><span className="text-muted-foreground">Auditor:</span><p className="font-medium">{viewItem.auditor}</p></div>
                <div><span className="text-muted-foreground">Data Agendada:</span><p className="font-medium">{format(new Date(viewItem.scheduled_date), "dd/MM/yyyy")}</p></div>
                <div><span className="text-muted-foreground">Data Conclusão:</span><p className="font-medium">{viewItem.completed_date ? format(new Date(viewItem.completed_date), "dd/MM/yyyy") : "—"}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={(statusMap[viewItem.status] ?? statusMap.planeada).variant}>{(statusMap[viewItem.status] ?? statusMap.planeada).label}</Badge></p></div>
                <div><span className="text-muted-foreground">Departamento:</span><p className="font-medium">{viewItem.departments?.name ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Laboratório:</span><p className="font-medium">{viewItem.laboratories?.name ?? "—"}</p></div>
              </div>
              {viewItem.findings && <div><span className="text-muted-foreground">Constatações:</span><p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.findings}</p></div>}
              {viewItem.recommendations && <div><span className="text-muted-foreground">Recomendações:</span><p className="font-medium mt-1 whitespace-pre-wrap">{viewItem.recommendations}</p></div>}

              <AttachedDocsPanel entityType="audit" entityId={viewItem.id} />

              <div className="flex justify-end pt-2 border-t border-border/40">
                <OpenProcessButton
                  entityType="audit" entityId={viewItem.id}
                  defaultTitle={`Auditoria: ${viewItem.title}`}
                  defaultTypeHint="Parecer Técnico"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Auditorias Registadas" icon={ClipboardCheck} loading={loading} isEmpty={audits.length === 0} emptyMessage="Nenhuma auditoria registada.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Auditor</TableHead>
                <TableHead>Data</TableHead><TableHead>Estado</TableHead><TableHead className="w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((a) => {
                const s = statusMap[a.status] ?? { label: a.status, variant: "outline" as const };
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" />{a.title}</div></TableCell>
                    <TableCell><Badge variant="secondary">{typeLabels[a.audit_type] || a.audit_type}</Badge></TableCell>
                    <TableCell>{a.auditor}</TableCell>
                    <TableCell>{format(new Date(a.scheduled_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
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
