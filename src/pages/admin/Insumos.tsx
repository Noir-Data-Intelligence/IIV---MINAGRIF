import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Package, Eye, Pencil, Plus, Trash2, AlertTriangle, CalendarClock } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "@/lib/format";
import {
  useInsumosList,
  useCreateInsumo,
  useDeleteInsumo,
  useUpdateInsumo,
} from "@/hooks/queries/useInsumos";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import type { InsumoDto } from "@/types/dto/insumo";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptInsumos from "@/i18n/locales/pt/admin/insumos.json";
import enInsumos from "@/i18n/locales/en/admin/insumos.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Laboratorios.tsx.
if (!i18n.hasResourceBundle("pt", "admin-insumos"))
  i18n.addResourceBundle("pt", "admin-insumos", ptInsumos, true, true);
if (!i18n.hasResourceBundle("en", "admin-insumos"))
  i18n.addResourceBundle("en", "admin-insumos", enInsumos, true, true);

const EXPIRY_WINDOW_DAYS = 30;

function buildInsumoSchema(t: TFunction) {
  return z.object({
    laboratoryId: z.string().min(1, t("validation.laboratoryRequired")),
    name: z.string().trim().min(2, t("validation.nameShort")),
    quantity: z
      .string()
      .trim()
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, t("validation.quantityInvalid")),
    unit: z.string().trim().optional(),
    minStock: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0), t("validation.minStockInvalid")),
    expiryDate: z.string().trim().optional(),
  });
}

type InsumoFormValues = z.infer<ReturnType<typeof buildInsumoSchema>>;

function isLowStock(item: InsumoDto): boolean {
  return item.quantity <= item.minStock;
}

function isExpired(item: InsumoDto): boolean {
  return !!item.expiryDate && new Date(item.expiryDate) < new Date();
}

function isExpiringSoon(item: InsumoDto): boolean {
  if (!item.expiryDate) return false;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 86400000);
  return new Date(item.expiryDate) <= windowEnd;
}

export default function Insumos() {
  const { t, i18n: i18nInstance } = useTranslation("admin-insumos");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("insumos");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<InsumoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<InsumoDto | null>(null);

  const { data, isLoading } = useInsumosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  // Dataset completo, para os KPIs de stock baixo/validade não dependerem da página actual.
  const statsQuery = useInsumosList({ page: 1, perPage: 1000 });
  const laboratoriosQuery = useLaboratoriosList({ page: 1, perPage: 100 });

  const createInsumo = useCreateInsumo();
  const updateInsumo = useUpdateInsumo();
  const deleteInsumo = useDeleteInsumo();

  const laboratorios = laboratoriosQuery.data?.data ?? [];
  const labNameMap = useMemo(() => {
    const map = new Map<string, string>();
    laboratorios.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [laboratorios]);

  const insumoSchema = useMemo(() => buildInsumoSchema(t), [t]);

  const initialValues = useMemo<Partial<InsumoFormValues> | undefined>(
    () =>
      editItem
        ? {
            laboratoryId: editItem.laboratoryId,
            name: editItem.name,
            quantity: String(editItem.quantity),
            unit: editItem.unit,
            minStock: String(editItem.minStock),
            expiryDate: editItem.expiryDate ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: insumoSchema,
    initialValues,
    defaultValues: {
      laboratoryId: "",
      name: "",
      quantity: "",
      unit: "unidade",
      minStock: "",
      expiryDate: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload: Partial<InsumoDto> = {
        laboratoryId: values.laboratoryId,
        name: values.name,
        quantity: Number(values.quantity),
        unit: values.unit?.trim() || "unidade",
        minStock: values.minStock?.trim() ? Number(values.minStock) : 0,
        expiryDate: values.expiryDate?.trim() ? values.expiryDate.trim() : null,
      };
      if (editItem) {
        await updateInsumo.mutateAsync({ id: editItem.id, payload });
      } else {
        await createInsumo.mutateAsync(payload);
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

  const openEdit = (s: InsumoDto) => {
    setEditItem(s);
    setFormOpen(true);
  };

  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const statsRows = statsQuery.data?.data ?? [];
  const kpiLowStock = useMemo(() => statsRows.filter(isLowStock).length, [statsRows]);
  const kpiExpiringSoon = useMemo(() => statsRows.filter(isExpiringSoon).length, [statsRows]);

  const renderStatusBadge = (item: InsumoDto) => {
    if (isExpired(item)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> {t("state.expired")}
        </Badge>
      );
    }
    if (isLowStock(item)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> {t("state.lowStock")}
        </Badge>
      );
    }
    return <Badge variant="default">{t("state.ok")}</Badge>;
  };

  const columns = useMemo<ColumnDef<InsumoDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4 text-primary" />
            {row.original.name}
          </div>
        ),
      },
      {
        id: "laboratory",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.laboratory")} />,
        cell: ({ row }) => labNameMap.get(row.original.laboratoryId) ?? t("table.emptyCell"),
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.quantity")} />,
        cell: ({ row }) => (
          <span className={isLowStock(row.original) ? "text-destructive font-medium" : ""}>
            {row.original.quantity} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.expiryDate")} />,
        cell: ({ row }) => (
          <span className={isExpired(row.original) ? "text-destructive font-medium" : ""}>
            {row.original.expiryDate ? formatDate(row.original.expiryDate) : t("table.emptyCell")}
          </span>
        ),
      },
      {
        id: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => renderStatusBadge(row.original),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, labNameMap],
  );

  const renderRowActions = (row: InsumoDto) => {
    const actions: RowAction[] = [];
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

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Package} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="insumos">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-green"
            icon={Package}
            metric={kpiTotal}
            title={t("kpis.total")}
            caption={t("kpis.totalCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant={kpiLowStock > 0 ? "gradient-gold" : "glass"}
            icon={AlertTriangle}
            metric={kpiLowStock}
            title={t("kpis.lowStock")}
            caption={t("kpis.lowStockCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant={kpiExpiringSoon > 0 ? "gradient-gold" : "glass"}
            icon={CalendarClock}
            metric={kpiExpiringSoon}
            title={t("kpis.expiring")}
            caption={t("kpis.expiringCaption")}
          />
        </motion.div>
      </motion.div>

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
            <FormField
              control={form.control}
              name="laboratoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.laboratory")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.placeholders.laboratory")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {laboratorios.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.quantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.unit")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.unit")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.minStock")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.expiryDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
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
          await deleteInsumo.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("details.name")}:</span>
                  <p className="font-medium">{viewItem.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.laboratory")}:</span>
                  <p className="font-medium">{labNameMap.get(viewItem.laboratoryId) ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.quantity")}:</span>
                  <p className="font-medium">
                    {viewItem.quantity} {viewItem.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.minStock")}:</span>
                  <p className="font-medium">
                    {viewItem.minStock} {viewItem.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.expiryDate")}:</span>
                  <p className="font-medium">{viewItem.expiryDate ? formatDate(viewItem.expiryDate) : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>{renderStatusBadge(viewItem)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
