import { useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Play, FileDown, AlertCircle, CheckCircle2, Contrast, Ruler, RefreshCw } from "lucide-react";
import { auditRoute, summarise, type RouteAuditResult } from "@/lib/a11yAudit";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ensurePdfFonts, PDF_HEADING_FONT, PDF_BODY_FONT } from "@/lib/pdfFonts";

const ROUTES: { path: string; label: string; group: "Público" | "Admin" }[] = [
  { path: "/", label: "Início", group: "Público" },
  { path: "/sobre", label: "Sobre", group: "Público" },
  { path: "/servicos", label: "Serviços", group: "Público" },
  { path: "/noticias", label: "Notícias", group: "Público" },
  { path: "/legislacao", label: "Legislação", group: "Público" },
  { path: "/contactos", label: "Contactos", group: "Público" },
  { path: "/admin", label: "Painel", group: "Admin" },
  { path: "/admin/utilizadores", label: "Utilizadores", group: "Admin" },
  { path: "/admin/laboratorios", label: "Laboratórios", group: "Admin" },
  { path: "/admin/analises", label: "Análises", group: "Admin" },
  { path: "/admin/resultados", label: "Resultados", group: "Admin" },
  { path: "/admin/lotes", label: "Lotes", group: "Admin" },
  { path: "/admin/planeamento", label: "Planeamento", group: "Admin" },
  { path: "/admin/distribuicao", label: "Distribuição", group: "Admin" },
  { path: "/admin/auditorias", label: "Auditorias", group: "Admin" },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: "Desktop (1440×900)" },
  mobile: { width: 390, height: 844, label: "Mobile (390×844)" },
} as const;
type ViewportKey = keyof typeof VIEWPORTS;

const impactColor: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  serious: "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  moderate: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  minor: "bg-muted text-muted-foreground border-border",
};

export default function Acessibilidade() {
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState<string>("");
  const [results, setResults] = useState<RouteAuditResult[]>([]);
  const sandboxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const summary = useMemo(() => summarise(results), [results]);
  const totalIssues = summary.total;

  const handleRun = async () => {
    if (!sandboxRef.current) return;
    setRunning(true);
    setResults([]);
    setProgress(0);
    const out: RouteAuditResult[] = [];
    const vp = VIEWPORTS[viewport];
    for (let i = 0; i < ROUTES.length; i++) {
      const r = ROUTES[i];
      setCurrent(`${r.label} (${r.path})`);
      try {
        const res = await auditRoute(r.path, r.label, sandboxRef.current, vp);
        out.push(res);
        setResults([...out]);
      } catch (e) {
        // continue
      }
      setProgress(Math.round(((i + 1) / ROUTES.length) * 100));
    }
    setCurrent("");
    setRunning(false);
    toast({ title: "Auditoria concluída", description: `${ROUTES.length} rotas analisadas em ${vp.label}.` });
  };

  const exportPDF = async () => {
    if (results.length === 0) {
      toast({ title: "Sem resultados", description: "Execute uma auditoria primeiro.", variant: "destructive" });
      return;
    }
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    doc.setFontSize(18); doc.setFont(PDF_HEADING_FONT, "bold");
    doc.text("Relatório de Acessibilidade", 105, 20, { align: "center" });
    doc.setFontSize(11); doc.setFont(PDF_BODY_FONT, "normal");
    doc.text(`Viewport: ${VIEWPORTS[viewport].label}`, 105, 28, { align: "center" });
    doc.text(`Gerado em ${new Date().toLocaleString("pt-AO")}`, 105, 34, { align: "center" });
    doc.setDrawColor(34, 87, 55); doc.setLineWidth(0.5); doc.line(20, 38, 190, 38);

    autoTable(doc, {
      startY: 44,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de ocorrências", String(summary.total)],
        ["Contraste", String(summary.contraste)],
        ["Tamanho / alvos", String(summary.tamanho)],
        ["Outras", String(summary.outro)],
        ["Críticas", String(summary.critical)],
        ["Sérias", String(summary.serious)],
        ["Moderadas", String(summary.moderate)],
        ["Menores", String(summary.minor)],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
      styles: { fontSize: 10, font: PDF_BODY_FONT },
    });

    let y = (doc as any).lastAutoTable?.finalY ?? 80;
    for (const r of results) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setFont(PDF_HEADING_FONT, "bold");
      doc.text(`${r.label} — ${r.path}`, 20, y + 10);
      doc.setFontSize(9); doc.setFont(PDF_BODY_FONT, "normal");
      doc.setTextColor(110);
      doc.text(
        r.error
          ? `Erro: ${r.error}`
          : `${r.violations.length} regras falhadas · ${r.passCount} aprovadas · ${r.incompleteCount} incertas · ${r.durationMs} ms`,
        20, y + 15,
      );
      doc.setTextColor(0);

      const rows = r.violations.map((v) => [
        v.id,
        v.impact ?? "—",
        v.category,
        `${v.nodes.length}`,
        v.help.slice(0, 70),
      ]);
      if (rows.length > 0) {
        autoTable(doc, {
          startY: y + 18,
          head: [["Regra", "Impacto", "Categoria", "Nós", "Descrição"]],
          body: rows,
          theme: "striped",
          headStyles: { fillColor: [34, 87, 55], font: PDF_HEADING_FONT, fontStyle: "bold" },
          styles: { fontSize: 8, font: PDF_BODY_FONT, cellPadding: 1.5 },
          columnStyles: { 4: { cellWidth: 80 } },
        });
        y = (doc as any).lastAutoTable?.finalY ?? y + 20;
      } else {
        y += 20;
      }
    }

    doc.setFontSize(8); doc.setTextColor(128);
    doc.text("Auditoria automatizada (axe-core / WCAG 2.1 AA) — Sistema de Gestão IIV.", 105, 287, { align: "center" });
    doc.save(`relatorio-acessibilidade-${viewport}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShieldCheck}
        title="Auditoria de Acessibilidade"
        description="Análise automática de contraste, tamanhos e regras WCAG 2.1 AA em todas as rotas do portal."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select value={viewport} onValueChange={(v: ViewportKey) => setViewport(v)} disabled={running}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">{VIEWPORTS.desktop.label}</SelectItem>
              <SelectItem value="mobile">{VIEWPORTS.mobile.label}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRun} disabled={running}>
            {running ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "A executar..." : "Executar auditoria"}
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={results.length === 0 || running}>
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </AdminPageHeader>

      {running && (
        <AdminCard>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">A analisar: {current || "..."}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </AdminCard>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminCard
          variant="gradient-green-gold"
          metric={totalIssues}
          title="Ocorrências totais"
          caption={`${results.length}/${ROUTES.length} rotas`}
        />
        <AdminCard variant="glass" metric={summary.contraste} title="Contraste" caption="color-contrast" />
        <AdminCard variant="glass" metric={summary.tamanho} title="Tamanhos / alvos" caption="target-size, viewport" />
        <AdminCard
          variant="glass"
          metric={summary.critical + summary.serious}
          title="Críticas + Sérias"
          caption={`${summary.critical} críticas`}
        />
      </div>

      <AdminCard
        title="Resultados por rota"
        icon={ShieldCheck}
        isEmpty={results.length === 0 && !running}
        emptyMessage="Execute uma auditoria para começar."
      >
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas ({totalIssues})</TabsTrigger>
            <TabsTrigger value="contraste">
              <Contrast className="mr-1.5 h-3.5 w-3.5" /> Contraste ({summary.contraste})
            </TabsTrigger>
            <TabsTrigger value="tamanho">
              <Ruler className="mr-1.5 h-3.5 w-3.5" /> Tamanhos ({summary.tamanho})
            </TabsTrigger>
          </TabsList>

          {(["all", "contraste", "tamanho"] as const).map((tab) => (
            <TabsContent value={tab} key={tab} className="mt-4">
              <Accordion type="multiple" className="space-y-2">
                {results.map((r) => {
                  const filtered = tab === "all"
                    ? r.violations
                    : r.violations.filter((v) => v.category === tab);
                  const count = filtered.reduce((s, v) => s + (v.nodes.length || 1), 0);
                  return (
                    <AccordionItem
                      key={r.path}
                      value={r.path}
                      className="border border-border/60 rounded-lg px-3 bg-card/40"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {r.error ? (
                              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                            ) : count === 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium truncate">{r.label}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{r.path}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.error && <Badge variant="destructive" className="text-[10px]">erro</Badge>}
                            <Badge variant="outline" className="text-[10px]">{count} ocorr.</Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        {r.error ? (
                          <p className="text-sm text-destructive">{r.error}</p>
                        ) : filtered.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhuma ocorrência nesta categoria.</p>
                        ) : (
                          <div className="space-y-3">
                            {filtered.map((v) => (
                              <div key={v.id} className="rounded-md border border-border/60 p-3 bg-background/40">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold font-serif">{v.help}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      <code className="text-[11px]">{v.id}</code> · {v.description}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] shrink-0 ${impactColor[v.impact ?? "minor"]}`}
                                  >
                                    {v.impact ?? "—"}
                                  </Badge>
                                </div>
                                <ul className="mt-2 space-y-1.5">
                                  {v.nodes.map((n, i) => (
                                    <li key={i} className="text-[11px] bg-muted/40 rounded p-2 font-mono break-all">
                                      <span className="text-muted-foreground">{n.target}</span>
                                      {n.failureSummary && (
                                        <div className="mt-1 font-sans text-muted-foreground">{n.failureSummary}</div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <a
                                  href={v.helpUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block mt-2 text-[11px] text-primary hover:underline"
                                >
                                  Ver guia da regra →
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </AdminCard>

      {/* Hidden iframe sandbox where routes are loaded for scanning */}
      <div ref={sandboxRef} aria-hidden="true" className="sr-only" />
    </div>
  );
}
