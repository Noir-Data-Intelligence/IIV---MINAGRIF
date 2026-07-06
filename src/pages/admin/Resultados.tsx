import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList, Eye, Pencil, Plus, Trash2, FileText, Download, CheckCircle2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "@/lib/format";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import {
  useResultadosList,
  useCreateResultado,
  useDeleteResultado,
  useUpdateResultado,
} from "@/hooks/queries/useResultados";
import { useAnalisesList, useUpdateAnalise } from "@/hooks/queries/useAnalises";
import type { ResultadoDto } from "@/types/dto/resultado";
import type { AnaliseDto } from "@/types/dto/analise";
import i18n from "@/i18n";
import ptResultados from "@/i18n/locales/pt/admin/resultados.json";
import enResultados from "@/i18n/locales/en/admin/resultados.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Laboratorios.tsx.
if (!i18n.hasResourceBundle("pt", "admin-resultados"))
  i18n.addResourceBundle("pt", "admin-resultados", ptResultados, true, true);
if (!i18n.hasResourceBundle("en", "admin-resultados"))
  i18n.addResourceBundle("en", "admin-resultados", enResultados, true, true);

function buildResultadoSchema(t: TFunction) {
  return z.object({
    analysisId: z.string().min(1, t("validation.analysisRequired")),
    resultText: z.string().trim().min(1, t("validation.resultRequired")),
  });
}

type ResultadoFormValues = z.infer<ReturnType<typeof buildResultadoSchema>>;

export default function Resultados() {
  const { t } = useTranslation("admin-resultados");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("resultados");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<ResultadoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ResultadoDto | null>(null);

  const { data, isLoading } = useResultadosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  // Dataset completo de resultados (para saber quais análises já têm resultado,
  // independentemente da página actual da tabela).
  const statsQuery = useResultadosList({ page: 1, perPage: 1000 });
  // Dataset completo de análises — usado para o Select de "análise elegível" e
  // para o join Cliente/Tipo de Análise nas colunas/PDF/detalhes.
  const analisesQuery = useAnalisesList({ page: 1, perPage: 500 });

  const createResultado = useCreateResultado();
  const updateResultado = useUpdateResultado();
  const deleteResultado = useDeleteResultado();
  const updateAnalise = useUpdateAnalise();

  const analises = analisesQuery.data?.data ?? [];
  const analiseMap = useMemo(() => {
    const map = new Map<string, AnaliseDto>();
    analises.forEach((a) => map.set(a.id, a));
    return map;
  }, [analises]);

  // Análises já com resultado registado (visto no dataset completo de resultados).
  const resultAnalysisIds = useMemo(
    () => new Set((statsQuery.data?.data ?? []).map((r) => r.analysisId)),
    [statsQuery.data],
  );

  // Elegíveis para novo resultado: sem resultado ainda e não canceladas — replica
  // a lógica de `pendingAnalyses` da versão Supabase original (Resultados.tsx),
  // que não restringia a análises "concluídas".
  const eligibleAnalyses = useMemo(
    () => analises.filter((a) => a.status !== "cancelada" && !resultAnalysisIds.has(a.id)),
    [analises, resultAnalysisIds],
  );

  const resultadoSchema = useMemo(() => buildResultadoSchema(t), [t]);

  const initialValues = useMemo<Partial<ResultadoFormValues> | undefined>(
    () =>
      editItem
        ? {
            analysisId: editItem.analysisId,
            resultText: editItem.resultText,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: resultadoSchema,
    initialValues,
    defaultValues: { analysisId: "", resultText: "" },
    open: formOpen,
    onSubmit: async (values) => {
      if (editItem) {
        await updateResultado.mutateAsync({ id: editItem.id, payload: { resultText: values.resultText } });
      } else {
        await createResultado.mutateAsync({ analysisId: values.analysisId, resultText: values.resultText });
        // Regista o resultado marca a análise associada como concluída (tal como na versão original).
        await updateAnalise.mutateAsync({ id: values.analysisId, payload: { status: "concluida" } });
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const openEdit = (r: ResultadoDto) => {
    setEditItem(r);
    setFormOpen(true);
  };

  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  // Análises concluídas sem resultado ainda — comparação entre as duas listas carregadas.
  const kpiConcludedWithoutResult = useMemo(
    () => analises.filter((a) => a.status === "concluida" && !resultAnalysisIds.has(a.id)).length,
    [analises, resultAnalysisIds],
  );

  const generatePDF = async (result: ResultadoDto) => {
    const analysis = analiseMap.get(result.analysisId);
    if (!analysis) return;
    await generateInstitutionalPdf({
      title: t("pdf.title"),
      filename: `relatorio-analise-${analysis.clientName.replace(/\s+/g, "-")}-${analysis.scheduledDate}`,
      sections: [
        {
          type: "table",
          head: [[t("pdf.fieldColumn"), t("pdf.valueColumn")]],
          body: [
            [t("pdf.client"), analysis.clientName],
            [t("pdf.animalSpecies"), analysis.animalSpecies || t("pdf.notAvailable")],
            [t("pdf.animalId"), analysis.animalId || t("pdf.notAvailable")],
            [t("pdf.sampleType"), analysis.sampleType],
            [t("pdf.analysisType"), analysis.analysisType],
            [t("pdf.analysisDate"), formatDate(analysis.scheduledDate)],
            [t("pdf.resultDate"), formatDate(result.concludedAt)],
          ],
        },
        {
          type: "text",
          title: t("pdf.result"),
          text: result.resultText,
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<ResultadoDto>[]>(
    () => [
      {
        accessorKey: "concludedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => formatDate(row.original.concludedAt),
      },
      {
        id: "client",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.client")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <ClipboardList className="h-4 w-4 text-primary" />
            {analiseMap.get(row.original.analysisId)?.clientName ?? t("table.emptyCell")}
          </div>
        ),
      },
      {
        id: "analysisType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.analysisType")} />,
        cell: ({ row }) => analiseMap.get(row.original.analysisId)?.analysisType ?? t("table.emptyCell"),
      },
      {
        accessorKey: "resultText",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.result")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm line-clamp-1 max-w-xs">{row.original.resultText}</span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, analiseMap],
  );

  const renderRowActions = (row: ResultadoDto) => {
    const actions: RowAction[] = [{ label: t("actions.pdf"), icon: FileText, onClick: () => generatePDF(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions primary={{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }} actions={actions} />;
  };

  const viewAnalysis = viewItem ? analiseMap.get(viewItem.analysisId) : undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardList} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="resultados">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <AdminCard
          variant="gradient-green"
          icon={ClipboardList}
          metric={kpiTotal}
          title={t("kpis.total")}
          caption={t("kpis.totalCaption")}
          stagger={1}
        />
        <AdminCard
          variant={kpiConcludedWithoutResult > 0 ? "gradient-gold" : "gradient-teal"}
          icon={CheckCircle2}
          metric={kpiConcludedWithoutResult}
          title={t("kpis.coverage")}
          caption={t("kpis.coverageCaption")}
          stagger={2}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        pageCount={data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={data?.meta.total}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        searchPlaceholder={t("table.searchPlaceholder")}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("dialog.editTitle") : t("dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            {editItem ? (
              <div className="rounded-lg border border-border/50 p-3 text-sm">
                <p className="text-xs text-muted-foreground">{t("form.labels.analysis")}</p>
                <p className="font-medium mt-0.5">
                  {analiseMap.get(editItem.analysisId)?.clientName ?? "—"} —{" "}
                  {analiseMap.get(editItem.analysisId)?.analysisType ?? "—"}
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="analysisId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.analysis")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.analysis")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eligibleAnalyses.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.clientName} — {a.analysisType} ({formatDate(a.scheduledDate)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="resultText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.resultText")}</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder={t("form.placeholders.resultText")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteResultado.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> {t("dialog.detailsTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("details.client")}</p>
                  <p className="font-serif text-xl mt-0.5">{viewAnalysis?.clientName ?? "—"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{viewAnalysis?.analysisType ?? "—"}</p>
                </div>
                <Badge variant="default" className="text-xs">
                  {t("details.concluded")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t("details.sample")}</p>
                  <dl className="space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("details.type")}</dt>
                      <dd className="font-medium text-right">{viewAnalysis?.sampleType ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("details.species")}</dt>
                      <dd className="font-medium text-right">{viewAnalysis?.animalSpecies || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("details.animalId")}</dt>
                      <dd className="font-medium text-right">{viewAnalysis?.animalId || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t("details.dates")}</p>
                  <dl className="space-y-1.5">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("details.scheduled")}</dt>
                      <dd className="font-medium text-right">
                        {viewAnalysis ? formatDate(viewAnalysis.scheduledDate) : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{t("details.concludedDate")}</dt>
                      <dd className="font-medium text-right">{formatDate(viewItem.concludedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t("details.result")}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{viewItem.resultText}</p>
              </div>

              <AttachedDocsPanel entityType="lab_result" entityId={viewItem.id} />

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                <OpenProcessButton
                  entityType="lab_result"
                  entityId={viewItem.id}
                  defaultTitle={`${t("details.client")}: ${viewAnalysis?.clientName ?? viewItem.analysisId}`.slice(0, 60)}
                  defaultTypeHint="Análise Laboratorial"
                />
                <Button variant="outline" size="sm" onClick={() => generatePDF(viewItem)}>
                  <Download className="mr-2 h-4 w-4" /> {t("actions.pdf")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    openEdit(viewItem);
                    setViewItem(null);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> {t("actions.edit")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
