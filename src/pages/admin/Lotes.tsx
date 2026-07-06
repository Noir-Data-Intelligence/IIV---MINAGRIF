import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { RowActions } from "@/components/admin/RowActions";
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
import { Plus, Boxes, FileText, Truck, Pencil, Trash2, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";


interface Product { id: string; name: string; product_type: string; unit: string; }
interface Batch {
  id: string; batch_number: string; product_id: string; quantity_produced: number;
  quantity_distributed: number; production_date: string; expiry_date: string;
  status: string; notes: string | null; products?: Product;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planeada: { label: "Planeada", variant: "outline" }, em_producao: { label: "Em Produção", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" }, suspensa: { label: "Suspensa", variant: "destructive" },
};

export default function Lotes() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [distOpen, setDistOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Batch | null>(null);
  const [editItem, setEditItem] = useState<Batch | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const [productId, setProductId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [qtyProduced, setQtyProduced] = useState("");
  const [prodDate, setProdDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("planeada");
  const [notes, setNotes] = useState("");
  const [distDest, setDistDest] = useState("");
  const [distQty, setDistQty] = useState("");
  const [distDate, setDistDate] = useState(new Date().toISOString().split("T")[0]);
  const [distNotes, setDistNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [batchRes, prodRes] = await Promise.all([
      supabase
        .from("production_batches")
        .select("*, products(id, name, product_type, unit)", { count: "exact" })
        .order("production_date", { ascending: false })
        .range(pag.from, pag.to),
      supabase.from("products").select("id, name, product_type, unit").order("name"),
    ]);
    setBatches((batchRes.data as any[]) ?? []);
    pag.setTotal(batchRes.count ?? 0);
    setProducts((prodRes.data as Product[]) ?? []);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pag.from, pag.to]);

  useEffect(() => { fetchData(); }, [fetchData]);


  const resetForm = () => { setProductId(""); setBatchNumber(""); setQtyProduced(""); setProdDate(""); setExpiryDate(""); setStatus("planeada"); setNotes(""); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("production_batches").insert({
      product_id: productId, batch_number: batchNumber, quantity_produced: parseInt(qtyProduced),
      production_date: prodDate, expiry_date: expiryDate, status, notes: notes || null,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lote criado com sucesso" }); setOpen(false); resetForm(); fetchData();
  };

  const openEdit = (b: Batch) => {
    setEditItem(b); setProductId(b.product_id); setBatchNumber(b.batch_number);
    setQtyProduced(String(b.quantity_produced)); setProdDate(b.production_date);
    setExpiryDate(b.expiry_date); setStatus(b.status); setNotes(b.notes || ""); setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("production_batches").update({
      product_id: productId, batch_number: batchNumber, quantity_produced: parseInt(qtyProduced),
      production_date: prodDate, expiry_date: expiryDate, status, notes: notes || null,
    } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lote actualizado" }); setEditOpen(false); setEditItem(null); resetForm(); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("production_batches").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lote eliminado" }); setDeleteId(null); fetchData();
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const qty = parseInt(distQty);
    const available = selectedBatch.quantity_produced - selectedBatch.quantity_distributed;
    if (qty > available) { toast({ title: "Erro", description: `Apenas ${available} unidades disponíveis.`, variant: "destructive" }); return; }
    const { error } = await supabase.from("batch_distributions").insert({ batch_id: selectedBatch.id, destination: distDest, quantity: qty, distribution_date: distDate, notes: distNotes || null } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await supabase.from("production_batches").update({ quantity_distributed: selectedBatch.quantity_distributed + qty } as any).eq("id", selectedBatch.id);
    toast({ title: "Distribuição registada" }); setDistOpen(false); setDistDest(""); setDistQty(""); setDistNotes(""); fetchData();
  };

  const generatePDF = async (batch: Batch) => {
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    const prod = batch.products;
    doc.setFont(PDF_HEADING_FONT, "bold");
    doc.setFontSize(16); doc.text("Instituto de Investigação Veterinária", 105, 20, { align: "center" });
    doc.setFontSize(11); doc.text("Relatório de Lote de Produção", 105, 28, { align: "center" });
    doc.setFont(PDF_BODY_FONT, "normal");
    doc.setFontSize(9); doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt })}`, 105, 34, { align: "center" });
    autoTable(doc, {
      startY: 42, head: [["Campo", "Valor"]],
      body: [
        ["Produto", prod?.name ?? "—"], ["Tipo", prod?.product_type ?? "—"], ["Lote", batch.batch_number],
        ["Quantidade Produzida", `${batch.quantity_produced} ${prod?.unit ?? ""}`],
        ["Quantidade Distribuída", `${batch.quantity_distributed} ${prod?.unit ?? ""}`],
        ["Disponível", `${batch.quantity_produced - batch.quantity_distributed} ${prod?.unit ?? ""}`],
        ["Data de Produção", format(new Date(batch.production_date), "dd/MM/yyyy")],
        ["Validade", format(new Date(batch.expiry_date), "dd/MM/yyyy")],
        ["Estado", statusMap[batch.status]?.label ?? batch.status], ["Notas", batch.notes || "—"],
      ],
      styles: { font: PDF_BODY_FONT },
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
    });
    doc.save(`lote-${batch.batch_number}.pdf`);
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const batchFormFields = (
    <>
      <div><Label>Produto</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger><SelectValue placeholder="Seleccionar produto" /></SelectTrigger>
          <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Nº do Lote</Label><Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Ex: LOT-2026-001" required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Qtd. Produzida</Label><Input type="number" min="1" value={qtyProduced} onChange={(e) => setQtyProduced(e.target.value)} required /></div>
        <div><Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Data de Produção</Label><Input type="date" value={prodDate} onChange={(e) => setProdDate(e.target.value)} required /></div>
        <div><Label>Validade</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required /></div>
      </div>
      <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Boxes} title="Lotes de Produção" description="Gestão de lotes e distribuição de produtos">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Novo Lote</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif">Registar Lote</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">{batchFormFields}<Button type="submit" className="w-full" disabled={!productId}>Registar Lote</Button></form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Editar Lote</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">{batchFormFields}<Button type="submit" className="w-full" disabled={!productId}>Guardar Alterações</Button></form>
        </DialogContent>
      </Dialog>

      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Registar Distribuição</DialogTitle></DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleDistribute} className="space-y-4">
              <p className="text-sm text-muted-foreground">Lote: <strong>{selectedBatch.batch_number}</strong> — Disponível: <strong>{selectedBatch.quantity_produced - selectedBatch.quantity_distributed}</strong></p>
              <div><Label>Destino</Label><Input value={distDest} onChange={(e) => setDistDest(e.target.value)} placeholder="Ex: Estação Zootécnica de Maputo" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantidade</Label><Input type="number" min="1" value={distQty} onChange={(e) => setDistQty(e.target.value)} required /></div>
                <div><Label>Data</Label><Input type="date" value={distDate} onChange={(e) => setDistDate(e.target.value)} required /></div>
              </div>
              <div><Label>Notas</Label><Textarea value={distNotes} onChange={(e) => setDistNotes(e.target.value)} /></div>
              <Button type="submit" className="w-full">Registar Distribuição</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" /> Detalhes do Lote
            </DialogTitle>
          </DialogHeader>
          {viewItem && (() => {
            const s = statusMap[viewItem.status] ?? statusMap.planeada;
            const avail = viewItem.quantity_produced - viewItem.quantity_distributed;
            return (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Nº do Lote</p>
                    <p className="font-serif text-2xl mt-0.5">{viewItem.batch_number}</p>
                    <p className="text-sm text-muted-foreground mt-1">{viewItem.products?.name ?? "—"}</p>
                  </div>
                  <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Produzida</p>
                    <p className="font-serif text-xl mt-1">{viewItem.quantity_produced}</p>
                    <p className="text-[10px] text-muted-foreground">{viewItem.products?.unit ?? "un."}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Distribuída</p>
                    <p className="font-serif text-xl mt-1">{viewItem.quantity_distributed}</p>
                    <p className="text-[10px] text-muted-foreground">{viewItem.products?.unit ?? "un."}</p>
                  </div>
                  <div className={`rounded-lg border p-3 ${avail <= 0 ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Disponível</p>
                    <p className={`font-serif text-xl mt-1 ${avail <= 0 ? "text-destructive" : "text-primary"}`}>{avail}</p>
                    <p className="text-[10px] text-muted-foreground">{viewItem.products?.unit ?? "un."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de produto</p>
                    <p className="font-medium">{viewItem.products?.product_type ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data de produção</p>
                    <p className="font-medium">{format(new Date(viewItem.production_date), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Validade</p>
                    <p className={`font-medium ${isExpired(viewItem.expiry_date) ? "text-destructive" : ""}`}>
                      {format(new Date(viewItem.expiry_date), "dd/MM/yyyy")}
                      {isExpired(viewItem.expiry_date) && <span className="ml-2 text-xs">(expirado)</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-medium">{s.label}</p>
                  </div>
                </div>

                {viewItem.notes && (
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">{viewItem.notes}</p>
                  </div>
                )}

                <AttachedDocsPanel entityType="production_batch" entityId={viewItem.id} />

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                  <OpenProcessButton
                    entityType="production_batch" entityId={viewItem.id}
                    defaultTitle={`Lote: ${viewItem.batch_number}`}
                    defaultTypeHint="Aprovação de Lote"
                  />
                  <Button variant="outline" size="sm" onClick={() => generatePDF(viewItem)}>
                    <Download className="mr-2 h-4 w-4" /> Gerar PDF
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AdminCard title="Lotes Registados" icon={Boxes} loading={loading} isEmpty={batches.length === 0} emptyMessage="Nenhum lote registado.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead><TableHead>Produto</TableHead><TableHead>Produzido</TableHead>
                <TableHead>Disponível</TableHead><TableHead>Validade</TableHead><TableHead>Estado</TableHead>
                <TableHead className="text-right w-[120px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => {
                const s = statusMap[b.status] ?? { label: b.status, variant: "outline" as const };
                const avail = b.quantity_produced - b.quantity_distributed;
                return (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setViewItem(b)}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-primary" />{b.batch_number}</div></TableCell>
                    <TableCell>{b.products?.name ?? "—"}</TableCell>
                    <TableCell>{b.quantity_produced}</TableCell>
                    <TableCell><Badge variant={avail <= 0 ? "destructive" : "secondary"}>{avail}</Badge></TableCell>
                    <TableCell><span className={isExpired(b.expiry_date) ? "text-destructive font-medium" : ""}>{format(new Date(b.expiry_date), "dd/MM/yyyy")}</span></TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        primary={{ label: "Ver detalhes", icon: Eye, onClick: () => setViewItem(b) }}
                        actions={[
                          { label: "Distribuir", icon: Truck, onClick: () => { setSelectedBatch(b); setDistOpen(true); }, disabled: avail <= 0 },
                          { label: "Gerar PDF", icon: FileText, onClick: () => generatePDF(b) },
                          { label: "Editar", icon: Pencil, onClick: () => openEdit(b) },
                          { label: "Eliminar", icon: Trash2, onClick: () => setDeleteId(b.id), destructive: true },
                        ]}
                      />
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
