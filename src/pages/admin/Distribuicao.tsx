import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Truck, FileText, Eye, Pencil, Trash2, MapPin, PackageCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { useEntityForm } from "@/hooks/useEntityForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatNumber } from "@/lib/format";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import {
  useDeleteDistribuicao,
  useDistribuicaoList,
  useUpdateDistribuicao,
} from "@/hooks/queries/useDistribuicao";
import { useLotesList } from "@/hooks/queries/useLotes";
import { useProdutosList } from "@/hooks/queries/useProdutos";
import type { DistribuicaoDto } from "@/types/dto/distribuicao";
import type { LoteDto } from "@/types/dto/lote";
import type { ProdutoDto } from "@/types/dto/produto";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptDistribuicao from "@/i18n/locales/pt/admin/distribuicao.json";
import enDistribuicao from "@/i18n/locales/en/admin/distribuicao.json";

if (!i18n.hasResourceBundle("pt", "distribuicao")) i18n.addResourceBundle("pt", "distribuicao", ptDistribuicao, true, true);
if (!i18n.hasResourceBundle("en", "distribuicao")) i18n.addResourceBundle("en", "distribuicao", enDistribuicao, true, true);

function buildDistribuicaoSchema(t: TFunction) {
  return z.object({
    destination: z.string().trim().min(2, t("validation.destinationShort")),
    quantity: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("validation.quantityPositive")),
    distributionDate: z.string().min(1, t("validation.dateRequired")),
    notes: z.string().trim().optional(),
  });
}

type DistribuicaoFormValues = z.infer<ReturnType<typeof buildDistribuicaoSchema>>;

export default function Distribuicao() {
  const { t } = useTranslation("distribuicao");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("distribuicao");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<DistribuicaoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewItem, setViewItem] = useState<DistribuicaoDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useDistribuicaoList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const statsQuery = useDistribuicaoList({ page: 1, perPage: 1000 });
  const lotesQuery = useLotesList({ page: 1, perPage: 1000 });
  const produtosQuery = useProdutosList({ page: 1, perPage: 1000 });

  const loteMap = useMemo(() => {
    const map = new Map<string, LoteDto>();
    (lotesQuery.data?.data ?? []).forEach((l) => map.set(l.id, l));
    return map;
  }, [lotesQuery.data]);
  const produtoMap = useMemo(() => {
    const map = new Map<string, ProdutoDto>();
    (produtosQuery.data?.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [produtosQuery.data]);

  // Resolução transitiva: distribuição -> lote -> produto.
  const batchNumber = (d: DistribuicaoDto) => loteMap.get(d.batchId)?.batchNumber ?? t("table.emptyCell");
  const productOf = (d: DistribuicaoDto) => {
    const lote = loteMap.get(d.batchId);
    return lote ? produtoMap.get(lote.productId) : undefined;
  };
  const productName = (d: DistribuicaoDto) => productOf(d)?.name ?? t("table.emptyCell");
  const unitOf = (d: DistribuicaoDto) => productOf(d)?.unit ?? "";

  const updateDistribuicao = useUpdateDistribuicao();
  const deleteDistribuicao = useDeleteDistribuicao();

  const allDistribuicoes = useMemo(() => statsQuery.data?.data ?? [], [statsQuery.data]);

  const stats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const inMonth = allDistribuicoes.filter((d) => {
      const dt = new Date(d.distributionDate);
      return dt.getFullYear() === y && dt.getMonth() === m;
    });
    return {
      month: inMonth.reduce((sum, d) => sum + d.quantity, 0),
      destinations: new Set(allDistribuicoes.map((d) => d.destination.trim().toLowerCase())).size,
      total: allDistribuicoes.length,
    };
  }, [allDistribuicoes]);

  const distribuicaoSchema = useMemo(() => buildDistribuicaoSchema(t), [t]);

  const initialValues = useMemo<Partial<DistribuicaoFormValues> | undefined>(
    () =>
      editItem
        ? {
            destination: editItem.destination,
            quantity: String(editItem.quantity),
            distributionDate: editItem.distributionDate,
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: distribuicaoSchema,
    initialValues,
    defaultValues: { destination: "", quantity: "", distributionDate: "", notes: "" },
    open: formOpen,
    onSubmit: async (values) => {
      if (!editItem) return;
      await updateDistribuicao.mutateAsync({
        id: editItem.id,
        payload: {
          destination: values.destination,
          quantity: parseInt(values.quantity, 10),
          distributionDate: values.distributionDate,
          notes: values.notes?.trim() ? values.notes.trim() : null,
        },
      });
    },
    successMessage: t("toast.updateSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openEdit = (d: DistribuicaoDto) => {
    setEditItem(d);
    setFormOpen(true);
  };

  const generatePDF = async () => {
    await generateInstitutionalPdf({
      title: t("pdf.title"),
      filename: "distribuicao",
      sections: [
        {
          type: "table",
          head: [[t("pdf.batch"), t("pdf.product"), t("pdf.destination"), t("pdf.quantity"), t("pdf.date")]],
          body: allDistribuicoes.map((d) => [
            batchNumber(d),
            productName(d),
            d.destination,
            `${formatNumber(d.quantity)} ${unitOf(d)}`.trim(),
            formatDate(d.distributionDate),
          ]),
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<DistribuicaoDto>[]>(
    () => [
      {
        id: "batch",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.batch")} />,
        cell: ({ row }) => (
          <span className="font-medium flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            {batchNumber(row.original)}
          </span>
        ),
      },
      {
        id: "product",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.product")} />,
        cell: ({ row }) => productName(row.original),
      },
      {
        accessorKey: "destination",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.destination")} />,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.quantity")} />,
        cell: ({ row }) => `${formatNumber(row.original.quantity)} ${unitOf(row.original)}`.trim(),
      },
      {
        accessorKey: "distributionDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => formatDate(row.original.distributionDate),
      },
      {
        accessorKey: "notes",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.notes")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm max-w-xs truncate block">
            {row.original.notes || t("table.emptyCell")}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, loteMap, produtoMap],
  );

  const renderRowActions = (row: DistribuicaoDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "month", icon: PackageCheck, label: t("kpi.month"), value: formatNumber(stats.month), caption: t("kpi.monthCaption"), variant: "gradient-green" as const },
    { key: "destinations", icon: MapPin, label: t("kpi.destinations"), value: formatNumber(stats.destinations), caption: t("kpi.destinationsCaption"), variant: "gradient-teal" as const },
    { key: "total", icon: Truck, label: t("kpi.total"), value: formatNumber(stats.total), caption: t("kpi.totalCaption"), variant: "gradient-gold" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Truck} title={t("page.title")} description={t("page.description")}>
        {allDistribuicoes.length > 0 && (
          <Button variant="outline" onClick={generatePDF}>
            <FileText className="mr-2 h-4 w-4" /> {t("actions.exportPdf")}
          </Button>
        )}
      </AdminPageHeader>

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
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
        title={t("dialog.editTitle")}
        form={entityForm}
        submitLabel={t("form.submitEdit")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.destination")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.quantity")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="distributionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.date")}</FormLabel>
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
        await deleteDistribuicao.mutateAsync(deleteId);
        setDeleteId(null);
      }} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("details.batch")}:</span>
                  <p className="font-medium">{batchNumber(viewItem)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.product")}:</span>
                  <p className="font-medium">{productName(viewItem)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.destination")}:</span>
                  <p className="font-medium">{viewItem.destination}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.quantity")}:</span>
                  <p className="font-medium">{formatNumber(viewItem.quantity)} {unitOf(viewItem)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.date")}:</span>
                  <p className="font-medium">{formatDate(viewItem.distributionDate)}</p>
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
