import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Boxes, Plus, Eye, Truck, FileText, Pencil, Trash2, CalendarClock, PackageCheck, Download } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate, formatNumber } from "@/lib/format";
import { generateInstitutionalPdf } from "@/lib/generateInstitutionalPdf";
import {
  useCreateLote,
  useDeleteLote,
  useLotesList,
  useUpdateLote,
} from "@/hooks/queries/useLotes";
import { useCreateDistribuicao } from "@/hooks/queries/useDistribuicao";
import { useProdutosList } from "@/hooks/queries/useProdutos";
import type { LoteDto, LoteStatus } from "@/types/dto/lote";
import type { ProdutoDto } from "@/types/dto/produto";
import { AttachedDocsPanel } from "@/components/admin/AttachedDocsPanel";
import { OpenProcessButton } from "@/components/admin/OpenProcessButton";
import i18n from "@/i18n";
import ptLotes from "@/i18n/locales/pt/admin/lotes.json";
import enLotes from "@/i18n/locales/en/admin/lotes.json";

if (!i18n.hasResourceBundle("pt", "lotes")) i18n.addResourceBundle("pt", "lotes", ptLotes, true, true);
if (!i18n.hasResourceBundle("en", "lotes")) i18n.addResourceBundle("en", "lotes", enLotes, true, true);

const LOTE_STATUSES: LoteStatus[] = ["planeada", "em_producao", "concluida", "suspensa"];

const statusVariant: Record<LoteStatus, "default" | "secondary" | "destructive" | "outline"> = {
  planeada: "outline",
  em_producao: "secondary",
  concluida: "default",
  suspensa: "destructive",
};

function buildLoteSchema(t: TFunction) {
  return z.object({
    productId: z.string().min(1, t("validation.productRequired")),
    batchNumber: z.string().trim().min(3, t("validation.batchShort")),
    quantityProduced: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, t("validation.quantityPositive")),
    status: z.enum(["planeada", "em_producao", "concluida", "suspensa"]),
    productionDate: z.string().min(1, t("validation.dateRequired")),
    expiryDate: z.string().min(1, t("validation.dateRequired")),
    notes: z.string().trim().optional(),
  });
}

type LoteFormValues = z.infer<ReturnType<typeof buildLoteSchema>>;

export default function Lotes() {
  const { t } = useTranslation("lotes");
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("lotes");
  const statusLabel = (s: string) => t(`status.${s}`, { defaultValue: s });

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LoteDto | null>(null);
  const [viewItem, setViewItem] = useState<LoteDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dialog de "distribuir" — ligado ao módulo Distribuição (ver reporte).
  const [distOpen, setDistOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<LoteDto | null>(null);
  const [distDest, setDistDest] = useState("");
  const [distQty, setDistQty] = useState("");
  const [distDate, setDistDate] = useState(new Date().toISOString().slice(0, 10));
  const [distNotes, setDistNotes] = useState("");

  const { data, isLoading } = useLotesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const statsQuery = useLotesList({ page: 1, perPage: 1000 });
  const produtosQuery = useProdutosList({ page: 1, perPage: 1000 });

  const produtoMap = useMemo(() => {
    const map = new Map<string, ProdutoDto>();
    (produtosQuery.data?.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [produtosQuery.data]);
  const produtos = produtosQuery.data?.data ?? [];

  const createLote = useCreateLote();
  const updateLote = useUpdateLote();
  const deleteLote = useDeleteLote();
  const createDistribuicao = useCreateDistribuicao();

  const stats = useMemo(() => {
    const all = statsQuery.data?.data ?? [];
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    return {
      active: all.filter((l) => l.status === "em_producao" || l.status === "planeada").length,
      produced: all.reduce((sum, l) => sum + l.quantityProduced, 0),
      expiring: all.filter((l) => {
        const d = new Date(l.expiryDate);
        return d >= now && d <= in30;
      }).length,
    };
  }, [statsQuery.data]);

  const loteSchema = useMemo(() => buildLoteSchema(t), [t]);

  const initialValues = useMemo<Partial<LoteFormValues> | undefined>(
    () =>
      editItem
        ? {
            productId: editItem.productId,
            batchNumber: editItem.batchNumber,
            quantityProduced: String(editItem.quantityProduced),
            status: editItem.status,
            productionDate: editItem.productionDate,
            expiryDate: editItem.expiryDate,
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: loteSchema,
    initialValues,
    defaultValues: {
      productId: "",
      batchNumber: "",
      quantityProduced: "",
      status: "planeada",
      productionDate: "",
      expiryDate: "",
      notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        productId: values.productId,
        batchNumber: values.batchNumber,
        quantityProduced: parseInt(values.quantityProduced, 10),
        status: values.status,
        productionDate: values.productionDate,
        expiryDate: values.expiryDate,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) {
        await updateLote.mutateAsync({ id: editItem.id, payload });
      } else {
        await createLote.mutateAsync(payload);
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
  const openEdit = (l: LoteDto) => {
    setEditItem(l);
    setFormOpen(true);
  };
  const openDistribute = (l: LoteDto) => {
    setSelectedBatch(l);
    setDistDest("");
    setDistQty("");
    setDistDate(new Date().toISOString().slice(0, 10));
    setDistNotes("");
    setDistOpen(true);
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const qty = parseInt(distQty, 10);
    const available = selectedBatch.quantityProduced - selectedBatch.quantityDistributed;
    if (!Number.isFinite(qty) || qty <= 0) return;
    if (qty > available) {
      toast({ title: t("toast.error"), description: t("distribute.overAvailable", { count: available }), variant: "destructive" });
      return;
    }
    try {
      await createDistribuicao.mutateAsync({
        batchId: selectedBatch.id,
        destination: distDest,
        quantity: qty,
        distributionDate: distDate,
        notes: distNotes.trim() ? distNotes.trim() : null,
      });
      await updateLote.mutateAsync({
        id: selectedBatch.id,
        payload: { quantityDistributed: selectedBatch.quantityDistributed + qty },
      });
      toast({ title: t("distribute.success") });
      setDistOpen(false);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const generatePDF = async (lote: LoteDto) => {
    const prod = produtoMap.get(lote.productId);
    const unit = prod?.unit ?? "";
    await generateInstitutionalPdf({
      title: t("pdf.title"),
      filename: `lote-${lote.batchNumber}`,
      sections: [
        {
          type: "table",
          head: [[t("pdf.field"), t("pdf.value")]],
          body: [
            [t("table.product"), prod?.name ?? "—"],
            [t("details.productType"), prod?.productType ?? "—"],
            [t("details.batchNumber"), lote.batchNumber],
            [t("details.produced"), `${lote.quantityProduced} ${unit}`.trim()],
            [t("details.distributed"), `${lote.quantityDistributed} ${unit}`.trim()],
            [t("details.available"), `${lote.quantityProduced - lote.quantityDistributed} ${unit}`.trim()],
            [t("details.productionDate"), formatDate(lote.productionDate)],
            [t("details.expiryDate"), formatDate(lote.expiryDate)],
            [t("details.status"), statusLabel(lote.status)],
            [t("details.notes"), lote.notes || "—"],
          ],
        },
      ],
    });
  };

  const columns = useMemo<ColumnDef<LoteDto>[]>(
    () => [
      {
        accessorKey: "batchNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.batch")} />,
        cell: ({ row }) => (
          <span className="font-medium flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            {row.original.batchNumber}
          </span>
        ),
      },
      {
        id: "product",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.product")} />,
        cell: ({ row }) => produtoMap.get(row.original.productId)?.name ?? t("table.emptyCell"),
      },
      {
        accessorKey: "quantityProduced",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.produced")} />,
        cell: ({ row }) => formatNumber(row.original.quantityProduced),
      },
      {
        id: "available",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.available")} />,
        cell: ({ row }) => {
          const avail = row.original.quantityProduced - row.original.quantityDistributed;
          return <Badge variant={avail <= 0 ? "destructive" : "secondary"}>{formatNumber(avail)}</Badge>;
        },
      },
      {
        accessorKey: "expiryDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.expiry")} />,
        cell: ({ row }) => (
          <span className={isExpired(row.original.expiryDate) ? "text-destructive font-medium" : ""}>
            {formatDate(row.original.expiryDate)}
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

  const renderRowActions = (row: LoteDto) => {
    const avail = row.quantityProduced - row.quantityDistributed;
    const actions: RowAction[] = [{ label: t("actions.pdf"), icon: FileText, onClick: () => generatePDF(row) }];
    if (canEdit) {
      actions.unshift({ label: t("actions.distribute"), icon: Truck, onClick: () => openDistribute(row), disabled: avail <= 0 });
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions primary={{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }} actions={actions} />;
  };

  const kpiCards = [
    { key: "active", icon: Boxes, label: t("kpi.active"), value: formatNumber(stats.active), caption: t("kpi.activeCaption"), variant: "gradient-green" as const },
    { key: "produced", icon: PackageCheck, label: t("kpi.produced"), value: formatNumber(stats.produced), caption: t("kpi.producedCaption"), variant: "gradient-teal" as const },
    {
      key: "expiring",
      icon: CalendarClock,
      label: t("kpi.expiring"),
      value: formatNumber(stats.expiring),
      caption: t("kpi.expiringCaption"),
      variant: (stats.expiring > 0 ? "gradient-gold" : "glass") as "gradient-gold" | "glass",
    },
  ];

  const distAvailable = selectedBatch ? selectedBatch.quantityProduced - selectedBatch.quantityDistributed : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Boxes} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="lotes">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {kpiCards.map((c, i) => (
          <AdminCard
            key={c.key}
            title={c.label}
            icon={c.icon}
            metric={c.value}
            caption={c.caption}
            variant={c.variant}
            stagger={(i + 1) as 1 | 2 | 3}
          />
        ))}
      </div>

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
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.batchNumber")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.batchNumber")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.quantityProduced")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        {LOTE_STATUSES.map((s) => (
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.productionDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.expiryDate")}</FormLabel>
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

      {/* Distribuir — acção ligada ao módulo Distribuição */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.distributeTitle")}</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <form onSubmit={handleDistribute} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("distribute.batchLabel")}: <strong>{selectedBatch.batchNumber}</strong> — {t("distribute.available")}:{" "}
                <strong>{formatNumber(distAvailable)}</strong>
              </p>
              <div>
                <Label>{t("distribute.destination")}</Label>
                <Input value={distDest} onChange={(e) => setDistDest(e.target.value)} placeholder={t("distribute.destinationPlaceholder")} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("distribute.quantity")}</Label>
                  <Input type="number" min="1" max={distAvailable} value={distQty} onChange={(e) => setDistQty(e.target.value)} required />
                </div>
                <div>
                  <Label>{t("distribute.date")}</Label>
                  <Input type="date" value={distDate} onChange={(e) => setDistDate(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>{t("distribute.notes")}</Label>
                <Textarea value={distNotes} onChange={(e) => setDistNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                {t("distribute.submit")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={async () => {
        if (!deleteId) return;
        await deleteLote.mutateAsync(deleteId);
        setDeleteId(null);
      }} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" /> {t("dialog.detailsTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (() => {
            const prod = produtoMap.get(viewItem.productId);
            const avail = viewItem.quantityProduced - viewItem.quantityDistributed;
            return (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/40">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("details.batchNumber")}</p>
                    <p className="font-serif text-2xl mt-0.5">{viewItem.batchNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">{prod?.name ?? "—"}</p>
                  </div>
                  <Badge variant={statusVariant[viewItem.status]} className="text-xs">{statusLabel(viewItem.status)}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("details.produced")}</p>
                    <p className="font-serif text-xl mt-1">{formatNumber(viewItem.quantityProduced)}</p>
                    <p className="text-[10px] text-muted-foreground">{prod?.unit ?? "un."}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("details.distributed")}</p>
                    <p className="font-serif text-xl mt-1">{formatNumber(viewItem.quantityDistributed)}</p>
                    <p className="text-[10px] text-muted-foreground">{prod?.unit ?? "un."}</p>
                  </div>
                  <div className={`rounded-lg border p-3 ${avail <= 0 ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("details.available")}</p>
                    <p className={`font-serif text-xl mt-1 ${avail <= 0 ? "text-destructive" : "text-primary"}`}>{formatNumber(avail)}</p>
                    <p className="text-[10px] text-muted-foreground">{prod?.unit ?? "un."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.productType")}</p>
                    <p className="font-medium">{prod?.productType ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.productionDate")}</p>
                    <p className="font-medium">{formatDate(viewItem.productionDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.expiryDate")}</p>
                    <p className={`font-medium ${isExpired(viewItem.expiryDate) ? "text-destructive" : ""}`}>
                      {formatDate(viewItem.expiryDate)}
                      {isExpired(viewItem.expiryDate) && <span className="ml-2 text-xs">{t("details.expired")}</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.status")}</p>
                    <p className="font-medium">{statusLabel(viewItem.status)}</p>
                  </div>
                </div>

                {viewItem.notes && (
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("details.notes")}</p>
                    <p className="text-sm whitespace-pre-wrap">{viewItem.notes}</p>
                  </div>
                )}

                <AttachedDocsPanel entityType="production_batch" entityId={viewItem.id} />

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40 flex-wrap">
                  <OpenProcessButton
                    entityType="production_batch"
                    entityId={viewItem.id}
                    defaultTitle={`${t("details.batchNumber")}: ${viewItem.batchNumber}`}
                    defaultTypeHint="Aprovação de Lote"
                  />
                  <Button variant="outline" size="sm" onClick={() => generatePDF(viewItem)}>
                    <Download className="mr-2 h-4 w-4" /> {t("actions.pdf")}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
