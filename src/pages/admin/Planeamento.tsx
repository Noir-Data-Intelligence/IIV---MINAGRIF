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
import { Plus, CalendarRange, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

interface Product { id: string; name: string; product_type: string; unit: string; }
interface Plan {
  id: string; product_id: string; planned_quantity: number; actual_quantity: number | null;
  planned_start: string; planned_end: string; status: string; notes: string | null; products?: Product;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planeada: { label: "Planeada", variant: "outline" }, em_producao: { label: "Em Produção", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" }, suspensa: { label: "Suspensa", variant: "destructive" },
};

export default function Planeamento() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Plan | null>(null);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [productId, setProductId] = useState("");
  const [plannedQty, setPlannedQty] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planeada");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [planRes, prodRes] = await Promise.all([
      supabase.from("production_plans")
        .select("*, products(id, name, product_type, unit)", { count: "exact" })
        .order("planned_start", { ascending: false })
        .range(pag.from, pag.to),
      supabase.from("products").select("id, name, product_type, unit").order("name"),
    ]);
    setPlans((planRes.data as any[]) ?? []);
    pag.setTotal(planRes.count ?? 0);
    setProducts((prodRes.data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resetForm = () => { setProductId(""); setPlannedQty(""); setStartDate(""); setEndDate(""); setStatus("planeada"); setNotes(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("production_plans").insert({
      product_id: productId, planned_quantity: parseInt(plannedQty),
      planned_start: startDate, planned_end: endDate, status, notes: notes || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plano criado com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (p: Plan) => {
    setEditItem(p); setProductId(p.product_id); setPlannedQty(String(p.planned_quantity));
    setStartDate(p.planned_start); setEndDate(p.planned_end); setStatus(p.status); setNotes(p.notes || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("production_plans").update({
      product_id: productId, planned_quantity: parseInt(plannedQty),
      planned_start: startDate, planned_end: endDate, status, notes: notes || null,
    } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plano actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("production_plans").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plano eliminado" }); setDeleteId(null); fetchData();
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.setFontSize(16); doc.text("Instituto de Investigação Veterinária", 105, 20, { align: "center" });
    doc.setFontSize(11); doc.text("Relatório de Planeamento de Produção", 105, 28, { align: "center" });
    doc.setFont(PDF_BODY_FONT, "normal");
    doc.setFontSize(9); doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 105, 34, { align: "center" });
    autoTable(doc, {
      startY: 42, head: [["Produto", "Qtd. Planeada", "Qtd. Real", "Início", "Fim", "Estado"]],
      body: plans.map((p) => [
        p.products?.name ?? "—", p.planned_quantity.toString(), p.actual_quantity?.toString() ?? "—",
        format(new Date(p.planned_start), "dd/MM/yyyy"), format(new Date(p.planned_end), "dd/MM/yyyy"),
        statusMap[p.status]?.label ?? p.status,
      ]),
      styles: { font: PDF_BODY_FONT },
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
    });
    doc.save("planeamento-producao.pdf");
  };

  const formFields = (
    <>
      <div><Label>Produto</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar produto" /></SelectTrigger>
          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Quantidade Planeada</Label><Input type="number" min="1" value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Data Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
        <div><Label>Data Fim</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
      </div>
      <div><Label>Estado</Label>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={CalendarRange} title="Planeamento de Produção" description="Planificação e acompanhamento da produção">
        {plans.length > 0 && <Button variant="outline" onClick={generatePDF}><FileText className="mr-2 h-4 w-4" /> Exportar PDF</Button>}
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Plano</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Criar Plano de Produção</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!productId}>Criar Plano</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Plano</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">{formFields}<Button type="submit" className="w-full" disabled={!productId}>Guardar Alterações</Button></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">Detalhes do Plano</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Produto:</span><p className="font-medium">{viewItem.products?.name ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{viewItem.products?.product_type ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Qtd. Planeada:</span><p className="font-medium">{viewItem.planned_quantity} {viewItem.products?.unit ?? ""}</p></div>
                <div><span className="text-muted-foreground">Qtd. Real:</span><p className="font-medium">{viewItem.actual_quantity ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Início:</span><p className="font-medium">{format(new Date(viewItem.planned_start), "dd/MM/yyyy")}</p></div>
                <div><span className="text-muted-foreground">Fim:</span><p className="font-medium">{format(new Date(viewItem.planned_end), "dd/MM/yyyy")}</p></div>
                <div><span className="text-muted-foreground">Estado:</span><p><Badge variant={(statusMap[viewItem.status] ?? statusMap.planeada).variant}>{(statusMap[viewItem.status] ?? statusMap.planeada).label}</Badge></p></div>
              </div>
              {viewItem.notes && <div><span className="text-muted-foreground">Notas:</span><p className="font-medium mt-1">{viewItem.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Planos de Produção" icon={CalendarRange} loading={loading} isEmpty={plans.length === 0} emptyMessage="Nenhum plano registado.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead><TableHead>Qtd. Planeada</TableHead><TableHead>Qtd. Real</TableHead>
                <TableHead>Período</TableHead><TableHead>Estado</TableHead><TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => {
                const s = statusMap[p.status] ?? { label: p.status, variant: "outline" as const };
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-primary" />{p.products?.name ?? "—"}</div></TableCell>
                    <TableCell>{p.planned_quantity}</TableCell>
                    <TableCell>{p.actual_quantity ?? "—"}</TableCell>
                    <TableCell className="text-sm">{format(new Date(p.planned_start), "dd/MM/yyyy")} — {format(new Date(p.planned_end), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewItem(p)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
