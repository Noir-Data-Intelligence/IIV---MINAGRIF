import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Beef, Milk, Egg, CalendarClock, Plus, Eye, Pencil, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatNumber } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useEstacoesList } from "@/hooks/queries/useEstacoes";
import {
  useProducaoList, useCreateProducao, useUpdateProducao, useDeleteProducao,
} from "@/hooks/queries/usePecuaria";
import { PRODUCT_TYPES, type ProdDto, type ProductType } from "@/types/dto/pecuaria";
import i18n from "@/i18n";
import ptPecuaria from "@/i18n/locales/pt/admin/pecuaria.json";
import enPecuaria from "@/i18n/locales/en/admin/pecuaria.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Financeiro.tsx.
if (!i18n.hasResourceBundle("pt", "pecuaria"))
  i18n.addResourceBundle("pt", "pecuaria", ptPecuaria, true, true);
if (!i18n.hasResourceBundle("en", "pecuaria"))
  i18n.addResourceBundle("en", "pecuaria", enPecuaria, true, true);

const BIG_PAGE = { page: 1, perPage: 1000 } as const;

function buildProdSchema(t: TFunction) {
  return z.object({
    stationId: z.string().min(1, t("validation.station")),
    productType: z.enum(["Leite", "Ovos", "Carne", "Mel", "Outro"]),
    productionDate: z.string().min(1, t("validation.date")),
    quantity: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("validation.quantity")),
    unit: z.string().trim().min(1),
    recordedBy: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type ProdFormValues = z.infer<ReturnType<typeof buildProdSchema>>;

export default function ProducaoPecuaria() {
  const { t } = useTranslation("pecuaria");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("pecuaria");
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProdDto | null>(null);
  const [viewItem, setViewItem] = useState<ProdDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const producaoQuery = useProducaoList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
    productType: typeFilter !== "todos" ? (typeFilter as ProductType) : undefined,
  });
  const producaoAll = useProducaoList(BIG_PAGE);
  const estacoesQuery = useEstacoesList(BIG_PAGE);

  const createProducao = useCreateProducao();
  const updateProducao = useUpdateProducao();
  const deleteProducao = useDeleteProducao();

  const estacoes = useMemo(() => estacoesQuery.data?.data ?? [], [estacoesQuery.data]);
  const stationMap = useMemo(() => new Map(estacoes.map((s) => [s.id, s])), [estacoes]);
  const stationName = (id: string) => stationMap.get(id)?.name ?? t("common.emptyCell");

  // --- KPIs (dataset completo) ---
  const kpis = useMemo(() => {
    const rows = producaoAll.data?.data ?? [];
    const now = new Date();
    const inMonth = rows.filter((r) => {
      const d = new Date(r.productionDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const milk = rows.filter((r) => r.productType === "Leite").reduce((s, r) => s + Number(r.quantity || 0), 0);
    const eggs = rows.filter((r) => r.productType === "Ovos").reduce((s, r) => s + Number(r.quantity || 0), 0);
    return { total: rows.length, monthCount: inMonth.length, milk, eggs };
  }, [producaoAll.data]);

  // --- Form ---
  const prodSchema = useMemo(() => buildProdSchema(t), [t]);
  const initialValues = useMemo<Partial<ProdFormValues> | undefined>(
    () =>
      editItem
        ? {
            stationId: editItem.stationId,
            productType: editItem.productType,
            productionDate: editItem.productionDate,
            quantity: String(editItem.quantity),
            unit: editItem.unit,
            recordedBy: editItem.recordedBy ?? "",
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );
  const entityForm = useEntityForm({
    schema: prodSchema,
    initialValues,
    defaultValues: {
      stationId: "", productType: "Leite",
      productionDate: new Date().toISOString().slice(0, 10),
      quantity: "", unit: "kg", recordedBy: "", notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        stationId: values.stationId,
        productType: values.productType,
        productionDate: values.productionDate,
        quantity: Number(values.quantity),
        unit: values.unit,
        recordedBy: values.recordedBy?.trim() ? values.recordedBy.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) await updateProducao.mutateAsync({ id: editItem.id, payload });
      else await createProducao.mutateAsync(payload);
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (p: ProdDto) => { setEditItem(p); setFormOpen(true); };

  const columns = useMemo<ColumnDef<ProdDto>[]>(
    () => [
      {
        accessorKey: "productionDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.productionDate)}</span>,
      },
      {
        id: "station",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.station")} />,
        cell: ({ row }) => <span className="text-sm">{stationName(row.original.stationId)}</span>,
      },
      {
        accessorKey: "productType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.product")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`type.${row.original.productType}`)}</Badge>,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.quantity")} />,
        cell: ({ row }) => <span className="font-medium">{formatNumber(row.original.quantity)} {row.original.unit}</span>,
      },
      {
        accessorKey: "recordedBy",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.recordedBy")} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.recordedBy ?? t("common.emptyCell")}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, stationMap],
  );

  const renderRowActions = (row: ProdDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "total", icon: Beef, label: t("kpis.total"), value: formatNumber(kpis.total), caption: t("kpis.totalCaption"), variant: "gradient-green-gold" as const },
    { key: "month", icon: CalendarClock, label: t("kpis.month"), value: formatNumber(kpis.monthCount), caption: t("kpis.monthCaption"), variant: "gradient-green" as const },
    { key: "milk", icon: Milk, label: t("kpis.milk"), value: `${formatNumber(kpis.milk)} L`, caption: t("kpis.milkCaption"), variant: "gradient-teal" as const },
    { key: "eggs", icon: Egg, label: t("kpis.eggs"), value: formatNumber(kpis.eggs), caption: t("kpis.eggsCaption"), variant: "gradient-gold" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Beef} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="pecuaria">
          <Button onClick={openCreate} disabled={estacoes.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      {/* KPIs */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : "hidden"}
        animate={prefersReduced ? undefined : "visible"}
      >
        {kpiCards.map((c, i) => (
          <motion.div key={c.key} variants={prefersReduced ? undefined : fadeInUp}>
            <AdminCard
              title={c.label}
              icon={c.icon}
              metric={c.value}
              caption={c.caption}
              variant={c.variant}
              stagger={(i + 1) as 1 | 2 | 3 | 4}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Filtro + tabela */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder={t("filters.typePlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t("filters.allTypes")}</SelectItem>
            {PRODUCT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`type.${ty}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={producaoQuery.data?.data ?? []}
        loading={producaoQuery.isLoading}
        pageCount={producaoQuery.data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={producaoQuery.data?.meta.total}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        searchPlaceholder={t("table.searchPlaceholder")}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      {/* Dialog criar/editar */}
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
            <FormField control={form.control} name="stationId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.station")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {estacoes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="productType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.productType")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PRODUCT_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`type.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="productionDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.date")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.quantity")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.unit")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="recordedBy" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.recordedBy")}</FormLabel>
                <FormControl><Input placeholder={t("form.recordedByPlaceholder")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.notes")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      {/* Delete */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteProducao.mutateAsync(deleteId);
          setDeleteId(null);
        }}
        title={t("delete.title")}
        description={t("delete.description")}
      />

      {/* Detalhes */}
      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("details.station")}:</span><p className="font-medium">{stationName(viewItem.stationId)}</p></div>
                <div><span className="text-muted-foreground">{t("details.product")}:</span><p><Badge variant="outline">{t(`type.${viewItem.productType}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("details.date")}:</span><p className="font-medium">{formatDate(viewItem.productionDate)}</p></div>
                <div><span className="text-muted-foreground">{t("details.quantity")}:</span><p className="font-medium">{formatNumber(viewItem.quantity)} {viewItem.unit}</p></div>
                <div><span className="text-muted-foreground">{t("details.recordedBy")}:</span><p className="font-medium">{viewItem.recordedBy ?? t("common.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("details.createdAt")}:</span><p className="font-medium">{formatDate(viewItem.createdAt)}</p></div>
              </div>
              {viewItem.notes && (
                <div><span className="text-muted-foreground">{t("details.notes")}:</span><p className="font-medium mt-1">{viewItem.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
