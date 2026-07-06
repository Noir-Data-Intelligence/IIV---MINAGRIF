import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { RowActions } from "@/components/admin/RowActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { Plus, FileText, ClipboardList, Pencil, Trash2, Eye, Download } from "lucide-react";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

interface Analysis {
  id: string; client_name: string; animal_species: string | null; animal_id: string | null;
  sample_type: string; analysis_type: string; scheduled_date: string; status: string;
}
interface Result { id: string; analysis_id: string; result_text: string; concluded_at: string; }

export default function Resultados() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewResult, setViewResult] = useState<Result | null>(null);
  const [editItem, setEditItem] = useState<Result | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState("");
  const [resultText, setResultText] = useState("");
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: aData }, { data: rData, count }] = await Promise.all([
      supabase.from("lab_analyses").select("id, client_name, animal_species, animal_id, sample_type, analysis_type, scheduled_date, status").order("scheduled_date", { ascending: false }).limit(1000),
      supabase.from("lab_results").select("*", { count: "exact" }).order("concluded_at", { ascending: false }).range(pag.from, pag.to),
    ]);
    setAnalyses((aData as Analysis[]) ?? []);
    setResults((rData as Result[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const resultAnalysisIds = new Set(results.map((r) => r.analysis_id));
  const pendingAnalyses = analyses.filter((a) => !resultAnalysisIds.has(a.id) && a.status !== "cancelada");
  const analysisMap = Object.fromEntries(analyses.map((a) => [a.id, a]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("lab_analyses").update({ status: "concluida" } as any).eq("id", selectedAnalysis);
    const { error } = await supabase.from("lab_results").insert({ analysis_id: selectedAnalysis, result_text: resultText, concluded_by: user?.id } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Resultado registado com sucesso" }); setOpen(false); setSelectedAnalysis(""); setResultText(""); fetchData();
  };

  const openEdit = (r: Result) => { setEditItem(r); setResultText(r.result_text); setEditOpen(true); };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const { error } = await supabase.from("lab_results").update({ result_text: resultText } as any).eq("id", editItem.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Resultado actualizado" }); setEditOpen(false); setEditItem(null); setResultText(""); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lab_results").delete().eq("id", deleteId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Resultado eliminado" }); setDeleteId(null); fetchData();
  };

  const generatePDF = async (result: Result) => {
    const analysis = analysisMap[result.analysis_id];
    if (!analysis) return;
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFontSize(18); doc.setFont(PDF_HEADING_FONT, "bold");
    doc.text("Instituto de Investigação Veterinária", 105, 20, { align: "center" });
    doc.setFontSize(12); doc.setFont(PDF_HEADING_FONT, "normal");
    doc.text("Relatório de Análise Laboratorial", 105, 30, { align: "center" });
    doc.setDrawColor(34, 87, 55); doc.setLineWidth(0.5); doc.line(20, 35, 190, 35);
    const info = [
      ["Cliente", analysis.client_name], ["Espécie Animal", analysis.animal_species || "N/A"],
      ["ID do Animal", analysis.animal_id || "N/A"], ["Tipo de Amostra", analysis.sample_type],
      ["Tipo de Análise", analysis.analysis_type],
      ["Data da Análise", new Date(analysis.scheduled_date).toLocaleDateString("pt-AO")],
      ["Data do Resultado", new Date(result.concluded_at).toLocaleDateString("pt-AO")],
    ];
    autoTable(doc, {
      startY: 42, head: [["Campo", "Valor"]], body: info, theme: "grid",
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
      styles: { fontSize: 10, font: PDF_BODY_FONT },
    });
    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    doc.setFontSize(12); doc.setFont(PDF_HEADING_FONT, "bold"); doc.text("Resultado:", 20, finalY + 15);
    doc.setFont(PDF_BODY_FONT, "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(result.result_text, 160), 20, finalY + 25);
    doc.setFontSize(8); doc.setTextColor(128);
    doc.text("Este documento foi gerado automaticamente pelo Sistema de Gestão do IIV.", 105, 280, { align: "center" });
    doc.save(`relatorio-analise-${analysis.client_name.replace(/\s+/g, "-")}-${analysis.scheduled_date}.pdf`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardList} title="Resultados Laboratoriais" description="Lançamento e consulta de resultados de análises">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Lançar Resultado</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Lançar Resultado de Análise</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Análise</Label>
                <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis} required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar análise pendente" /></SelectTrigger>
                  <SelectContent>{pendingAnalyses.map((a) => <SelectItem key={a.id} value={a.id}>{a.client_name} — {a.analysis_type} ({new Date(a.scheduled_date).toLocaleDateString("pt-AO")})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Resultado</Label><Textarea value={resultText} onChange={(e) => setResultText(e.target.value)} rows={5} placeholder="Descreva o resultado da análise..." required /></div>
              <Button type="submit" className="w-full">Registar Resultado</Button>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditItem(null); setResultText(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Editar Resultado</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Resultado</Label><Textarea value={resultText} onChange={(e) => setResultText(e.target.value)} rows={5} required /></div>
            <Button type="submit" className="w-full">Guardar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewResult} onOpenChange={(o) => !o && setViewResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Detalhes do Resultado
            </DialogTitle>
          </DialogHeader>
          {viewResult && (() => {
            const va = analysisMap[viewResult.analysis_id];
            return (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Cliente</p>
                    <p className="font-serif text-xl mt-0.5">{va?.client_name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground mt-1">{va?.analysis_type ?? "—"}</p>
                  </div>
                  <Badge variant="default" className="text-xs">Concluída</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Amostra</p>
                    <dl className="space-y-1.5">
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium text-right">{va?.sample_type ?? "—"}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Espécie</dt><dd className="font-medium text-right">{va?.animal_species || "—"}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ID animal</dt><dd className="font-medium text-right">{va?.animal_id || "—"}</dd></div>
                    </dl>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Datas</p>
                    <dl className="space-y-1.5">
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Agendada</dt><dd className="font-medium text-right">{va ? new Date(va.scheduled_date).toLocaleDateString("pt-AO") : "—"}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Concluída</dt><dd className="font-medium text-right">{new Date(viewResult.concluded_at).toLocaleDateString("pt-AO")}</dd></div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Resultado</p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{viewResult.result_text}</p>
                </div>

                <AttachedDocsPanel entityType="lab_result" entityId={viewResult.id} />

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                  <OpenProcessButton
                    entityType="lab_result" entityId={viewResult.id}
                    defaultTitle={`Resultado: ${(viewResult as any).analysis_id ?? ""}`.slice(0, 60)}
                    defaultTypeHint="Análise Laboratorial"
                  />
                  <Button variant="outline" size="sm" onClick={() => generatePDF(viewResult)}>
                    <Download className="mr-2 h-4 w-4" /> Gerar PDF
                  </Button>
                  <Button size="sm" onClick={() => { openEdit(viewResult); setViewResult(null); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AdminCard title="Resultados Registados" icon={ClipboardList} loading={loading} isEmpty={results.length === 0} emptyMessage="Nenhum resultado registado.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Tipo Análise</TableHead>
                <TableHead>Resultado</TableHead><TableHead className="text-right w-[120px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => {
                const a = analysisMap[r.analysis_id];
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setViewResult(r)}>
                    <TableCell>{new Date(r.concluded_at).toLocaleDateString("pt-AO")}</TableCell>
                    <TableCell className="font-medium">{a?.client_name ?? "—"}</TableCell>
                    <TableCell>{a?.analysis_type ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{r.result_text}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        primary={{ label: "Ver detalhes", icon: Eye, onClick: () => setViewResult(r) }}
                        actions={[
                          { label: "Gerar PDF", icon: FileText, onClick: () => generatePDF(r) },
                          { label: "Editar", icon: Pencil, onClick: () => openEdit(r) },
                          { label: "Eliminar", icon: Trash2, onClick: () => setDeleteId(r.id), destructive: true },
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
