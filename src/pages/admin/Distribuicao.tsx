import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Truck, FileText, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

interface Distribution {
  id: string; destination: string; quantity: number; distribution_date: string;
  notes: string | null; batch_id: string;
  production_batches?: { batch_number: string; products?: { name: string; unit: string } };
}

export default function Distribuicao() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Distribution | null>(null);
  const [editItem, setEditItem] = useState<Distribution | null>(null);
  const [destination, setDestination] = useState("");
  const [quantity, setQuantity] = useState("");
  const [distDate, setDistDate] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("batch_distributions")
      .select("*, production_batches(batch_number, products(name, unit))", { count: "exact" })
      .order("distribution_date", { ascending: false })
      .range(pag.from, pag.to);
    setDistributions((data as any[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const openEdit = (d: Distribution) => {
    setEditItem(d); setDestination(d.destination); setQuantity(String(d.quantity));
    setDistDate(d.distribution_date); setNotes(d.notes || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("batch_distributions").update({
      destination, quantity: parseInt(quantity), distribution_date: distDate, notes: notes || null,
    } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Distribuição actualizada" }); setEditOpen(false); setEditItem(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("batch_distributions").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Distribuição eliminada" }); setDeleteId(null); fetchData();
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.setFontSize(16); doc.text("Instituto de Investigação Veterinária", 105, 20, { align: "center" });
    doc.setFontSize(11); doc.text("Relatório de Distribuição", 105, 28, { align: "center" });
    doc.setFont(PDF_BODY_FONT, "normal");
    doc.setFontSize(9); doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 105, 34, { align: "center" });
    autoTable(doc, {
      startY: 42, head: [["Lote", "Produto", "Destino", "Quantidade", "Data"]],
      body: distributions.map((d) => [
        d.production_batches?.batch_number ?? "—", d.production_batches?.products?.name ?? "—",
        d.destination, `${d.quantity} ${d.production_batches?.products?.unit ?? ""}`,
        format(new Date(d.distribution_date), "dd/MM/yyyy"),
      ]),
      styles: { font: PDF_BODY_FONT },
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
    });
    doc.save("distribuicao.pdf");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Truck} title="Distribuição" description="Histórico de distribuição de produtos">
        {distributions.length > 0 && <Button variant="outline" onClick={generatePDF}><FileText className="mr-2 h-4 w-4" /> Exportar PDF</Button>}
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Distribuição</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Destino</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
              <div><Label>Data</Label><Input type="date" value={distDate} onChange={(e) => setDistDate(e.target.value)} required /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Detalhes da Distribuição</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Lote:</span><p className="font-medium">{viewItem.production_batches?.batch_number ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Produto:</span><p className="font-medium">{viewItem.production_batches?.products?.name ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Destino:</span><p className="font-medium">{viewItem.destination}</p></div>
                <div><span className="text-muted-foreground">Quantidade:</span><p className="font-medium">{viewItem.quantity} {viewItem.production_batches?.products?.unit ?? ""}</p></div>
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{format(new Date(viewItem.distribution_date), "dd/MM/yyyy")}</p></div>
              </div>
              {viewItem.notes && <div><span className="text-muted-foreground">Notas:</span><p className="font-medium mt-1">{viewItem.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard title="Histórico de Distribuição" icon={Truck} loading={loading} isEmpty={distributions.length === 0} emptyMessage="Nenhuma distribuição registada.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead><TableHead>Produto</TableHead><TableHead>Destino</TableHead>
                <TableHead>Quantidade</TableHead><TableHead>Data</TableHead><TableHead>Notas</TableHead><TableHead className="w-24">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />{d.production_batches?.batch_number ?? "—"}</div></TableCell>
                  <TableCell>{d.production_batches?.products?.name ?? "—"}</TableCell>
                  <TableCell>{d.destination}</TableCell>
                  <TableCell>{d.quantity} {d.production_batches?.products?.unit ?? ""}</TableCell>
                  <TableCell>{format(new Date(d.distribution_date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{d.notes || "—"}</TableCell>
                  <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewItem(d)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
