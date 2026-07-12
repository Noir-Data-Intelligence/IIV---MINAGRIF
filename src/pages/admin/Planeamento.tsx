import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarRange, Plus, FileText, Eye, Pencil, Trash2, Factory, Target, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { motion, useReducedMotion } from "framer-motion";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { axisTickStyle, buildChartConfig, chartColors, formatAxisNumber, NoDataOverlay } from "@/components/charts";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatNumber } from "@/lib/format";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import {
  useCreatePlano,
  useDeletePlano,
  usePlanosList,
  useUpdatePlano,
} from "@/hooks/queries/usePlaneamento";
import { useProdutosList } from "@/hooks/queries/useProdutos";
import type { PlanoDto, PlanoStatus } from "@/types/dto/plano";
import type { ProdutoDto } from "@/types/dto/produto";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptPlaneamento from "@/i18n/locales/pt/admin/planeamento.json";
import enPlaneamento from "@/i18n/locales/en/admin/planeamento.json";

if (!i18n.hasResourceBundle("pt", "planeamento")) i18n.addResourceBundle("pt", "planeamento", ptPlaneamento, true, true);
if (!i18n.hasResourceBundle("en", "planeamento")) i18n.addResourceBundle("en", "planeamento", enPlaneamento, true, true);

const PLANO_STATUSES: PlanoStatus[] = ["planeada", "em_producao", "concluida", "suspensa"];

const statusVariant: Record<PlanoStatus, "default" | "secondary" | "destructive" | "outline"> = {
  planeada: "outline",
  em_producao: "secondary",
  concluida: "default",
  suspensa: "destructive",
};

function buildPlanoSchema(t: TFunction) {
  return z.object({
    productId: z.string().min(1, t("validation.productRequired")),
    plannedQuantity: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("validation.quantityPositive")),
    actualQuantity: z.string().trim().optional(),
    plannedStart: z.string().min(1, t("validation.dateRequired")),
    plannedEnd: z.string().min(1, t("validation.dateRequired")),
    status: z.enum(["planeada", "em_producao", "concluida", "suspensa"]),
    notes: z.string().trim().optional(),
  });
}

type PlanoFormValues = z.infer<ReturnType<typeof buildPlanoSchema>>;

export default function Planeamento() {
  const { t } = useTranslation("planeamento");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("planeamento");
  const prefersReducedMotion = useReducedMotion();
  const statusLabel = (s: string) => t(`status.${s}`, { defaultValue: s });

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PlanoDto | null>(null);
  const [viewItem, setViewItem] = useState<PlanoDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = usePlanosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const statsQuery = usePlanosList({ page: 1, perPage: 1000 });
  const produtosQuery = useProdutosList({ page: 1, perPage: 1000 });

  const produtoMap = useMemo(() => {
    const map = new Map<string, ProdutoDto>();
    (produtosQuery.data?.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [produtosQuery.data]);
  const produtos = produtosQuery.data?.data ?? [];
  const productName = (id: string) => produtoMap.get(id)?.name ?? t("table.emptyCell");

  const createPlano = useCreatePlano();
  const updatePlano = useUpdatePlano();
  const deletePlano = useDeletePlano();

  const allPlans = useMemo(() => statsQuery.data?.data ?? [], [statsQuery.data]);

  const stats = useMemo(
    () => ({
      total: allPlans.length,
      inProgress: allPlans.filter((p) => p.status === "em_producao").length,
      planned: allPlans.reduce((sum, p) => sum + p.plannedQuantity, 0),
      actual: allPlans.reduce((sum, p) => sum + (p.actualQuantity ?? 0), 0),
    }),
    [allPlans],
  );

  // Gráfico "Planeado vs Real": agrega por produto (soma de metas e produção real).
  const chartData = useMemo(() => {
    const byProduct = new Map<string, { name: string; planned: number; actual: number }>();
    for (const p of allPlans) {
      const entry = byProduct.get(p.productId) ?? { name: productName(p.productId), planned: 0, actual: 0 };
      entry.planned += p.plannedQuantity;
      entry.actual += p.actualQuantity ?? 0;
      byProduct.set(p.productId, entry);
    }
    return Array.from(byProduct.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPlans, produtoMap]);

  const chartConfig = useMemo(
    () => buildChartConfig(["planned", "actual"], { planned: t("chart.planned"), actual: t("chart.actual") }),
    [t],
  );

  const planoSchema = useMemo(() => buildPlanoSchema(t), [t]);

  const initialValues = useMemo<Partial<PlanoFormValues> | undefined>(
    () =>
      editItem
        ? {
            productId: editItem.productId,
            plannedQuantity: String(editItem.plannedQuantity),
            actualQuantity: editItem.actualQuantity != null ? String(editItem.actualQuantity) : "",
            plannedStart: editItem.plannedStart,
            plannedEnd: editItem.plannedEnd,
            status: editItem.status,
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: planoSchema,
    initialValues,
    defaultValues: {
      productId: "",
      plannedQuantity: "",
      actualQuantity: "",
      plannedStart: "",
      plannedEnd: "",
      status: "planeada",
      notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const actual = values.actualQuantity?.trim();
      const payload = {
        productId: values.productId,
        plannedQuantity: parseInt(values.plannedQuantity, 10),
        actualQuantity: actual ? parseInt(actual, 10) : null,
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
        status: values.status,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) {
        await updatePlano.mutateAsync({ id: editItem.id, payload });
      } else {
        await createPlano.mutateAsync(payload);
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
  const openEdit = (p: PlanoDto) => {
    setEditItem(p);
    setFormOpen(true);
  };

  const generatePDF = async () => {
    await generateInstitutionalPdf({
      title: t("pdf.title"),
      filename: "planeamento-producao",
      sections: [
        {
          type: "table",
          head: [[t("pdf.product"), t("pdf.plannedQuantity"), t("pdf.actualQuantity"), t("pdf.start"), t("pdf.end"), t("pdf.status")]],
          body: allPlans.map((p) => [
            productName(p.productId),
            formatNumber(p.plannedQuantity),
            p.actualQuantity != null ? formatNumber(p.actualQuantity) : "—",
            formatDate(p.plannedStart),
            formatDate(p.plannedEnd),
            statusLabel(p.status),
          ]),
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<PlanoDto>[]>(
    () => [
      {
        id: "product",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.product")} />,
        cell: ({ row }) => (
          <span className="font-medium flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            {productName(row.original.productId)}
          </span>
        ),
      },
      {
        accessorKey: "plannedQuantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.plannedQuantity")} />,
        cell: ({ row }) => formatNumber(row.original.plannedQuantity),
      },
      {
        accessorKey: "actualQuantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.actualQuantity")} />,
        cell: ({ row }) => (row.original.actualQuantity != null ? formatNumber(row.original.actualQuantity) : t("table.emptyCell")),
      },
      {
        id: "period",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.period")} />,
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDate(row.original.plannedStart)} — {formatDate(row.original.plannedEnd)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{statusLabel(row.original.status)}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, produtoMap],
  );

  const renderRowActions = (row: PlanoDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "total", icon: CalendarRange, label: t("kpi.total"), value: formatNumber(stats.total), caption: t("kpi.totalCaption"), variant: "gradient-green" as const },
    { key: "inProgress", icon: Factory, label: t("kpi.inProgress"), value: formatNumber(stats.inProgress), caption: t("kpi.inProgressCaption"), variant: "gradient-teal" as const },
    { key: "planned", icon: Target, label: t("kpi.planned"), value: formatNumber(stats.planned), caption: t("kpi.plannedCaption"), variant: "gradient-gold" as const },
    { key: "actual", icon: CheckCircle2, label: t("kpi.actual"), value: formatNumber(stats.actual), caption: t("kpi.actualCaption"), variant: "gradient-green-gold" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={CalendarRange} title={t("page.title")} description={t("page.description")}>
        {allPlans.length > 0 && (
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="mr-2 h-4 w-4" /> {t("actions.exportPdf")}
          </Button>
        )}
        <WriteGuard module="planeamento">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {kpiCards.map((c) => (
          <motion.div key={c.key} variants={prefersReducedMotion ? undefined : fadeInUp}>
            <AdminCard
              title={c.label}
              icon={c.icon}
              metric={c.value}
              caption={c.caption}
              variant={c.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      <Card className="glass-card shadow-elegant rounded-xl hover-lift animate-fade-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold font-serif">{t("chart.title")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("chart.subtitle")}</p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} />
                <YAxis type="category" dataKey="name" width={150} tick={axisTickStyle} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="planned" name={t("chart.planned")} fill={chartColors[0]} radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" name={t("chart.actual")} fill={chartColors[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <NoDataOverlay message={t("chart.empty")} height={320} />
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
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
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.product")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.placeholders.product")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {produtos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.plannedQuantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.actualQuantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder={t("form.placeholders.actualQuantity")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.startDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plannedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.endDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLANO_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.notes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => {
        if (!deleteId) return;
        await deletePlano.mutateAsync(deleteId);
        setDeleteId(null);
      }} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("details.product")}:</span>
                  <p className="font-medium">{productName(viewItem.productId)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p><Badge variant={statusVariant[viewItem.status]}>{statusLabel(viewItem.status)}</Badge></p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.plannedQuantity")}:</span>
                  <p className="font-medium">{formatNumber(viewItem.plannedQuantity)} {produtoMap.get(viewItem.productId)?.unit ?? ""}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.actualQuantity")}:</span>
                  <p className="font-medium">{viewItem.actualQuantity != null ? formatNumber(viewItem.actualQuantity) : t("table.emptyCell")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.start")}:</span>
                  <p className="font-medium">{formatDate(viewItem.plannedStart)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.end")}:</span>
                  <p className="font-medium">{formatDate(viewItem.plannedEnd)}</p>
                </div>
              </div>
              {viewItem.notes && (
                <div>
                  <span className="text-muted-foreground">{t("details.notes")}:</span>
                  <p className="font-medium mt-1">{viewItem.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
