import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pill, Syringe, Droplets, FlaskConical, Archive, Eye, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "@/lib/format";
import {
  useArchiveProduto,
  useCreateProduto,
  useDeleteProduto,
  useProdutosList,
  useUpdateProduto,
} from "@/hooks/queries/useProdutos";
import type { ProdutoDto, ProdutoType } from "@/types/dto/produto";
import i18n from "@/i18n";
import ptProdutos from "@/i18n/locales/pt/admin/produtos.json";
import enProdutos from "@/i18n/locales/en/admin/produtos.json";

if (!i18n.hasResourceBundle("pt", "produtos"))
  i18n.addResourceBundle("pt", "produtos", ptProdutos, true, true);
if (!i18n.hasResourceBundle("en", "produtos"))
  i18n.addResourceBundle("en", "produtos", enProdutos, true, true);

const PRODUTO_TYPES: ProdutoType[] = ["vacina", "soro", "reagente"];

function buildProdutoSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    productType: z.string().refine((v) => (PRODUTO_TYPES as string[]).includes(v), t("validation.typeRequired")),
    unit: z.string().trim().min(1, t("validation.unitShort")),
    description: z.string().trim().optional(),
  });
}

type ProdutoFormValues = z.infer<ReturnType<typeof buildProdutoSchema>>;

export default function Produtos() {
  const { t, i18n: i18nInstance } = useTranslation("produtos");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("produtos");
  const typeLabel = (type: string) => t(`types.${type}`, { defaultValue: type });

  const [tab, setTab] = useState("active");
  const [activePagination, setActivePagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [archivedPagination, setArchivedPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [activeSearch, setActiveSearch] = useState("");
  const [archivedSearch, setArchivedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProdutoDto | null>(null);
  const [viewItem, setViewItem] = useState<ProdutoDto | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeQuery = useProdutosList({
    page: activePagination.pageIndex + 1,
    perPage: activePagination.pageSize,
    search: activeSearch || undefined,
    archived: false,
  });
  const archivedQuery = useProdutosList({
    page: archivedPagination.pageIndex + 1,
    perPage: archivedPagination.pageSize,
    search: archivedSearch || undefined,
    archived: true,
  });
  // Agregação para os KPIs (todos os produtos, activos e arquivados).
  const statsQuery = useProdutosList({ page: 1, perPage: 1000 });

  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();
  const archiveProduto = useArchiveProduto();

  const stats = useMemo(() => {
    const all = statsQuery.data?.data ?? [];
    const active = all.filter((p) => !p.isArchived);
    return {
      activeTotal: active.length,
      vaccines: active.filter((p) => p.productType === "vacina").length,
      sera: active.filter((p) => p.productType === "soro").length,
      reagents: active.filter((p) => p.productType === "reagente").length,
      archived: all.filter((p) => p.isArchived).length,
    };
  }, [statsQuery.data]);

  const produtoSchema = useMemo(() => buildProdutoSchema(t), [t]);

  const initialValues = useMemo<Partial<ProdutoFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name,
            productType: editItem.productType,
            unit: editItem.unit,
            description: editItem.description ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: produtoSchema,
    initialValues,
    defaultValues: { name: "", productType: "", unit: "dose", description: "" },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        productType: values.productType as ProdutoType,
        unit: values.unit,
        description: values.description?.trim() ? values.description.trim() : null,
      };
      if (editItem) {
        await updateProduto.mutateAsync({ id: editItem.id, payload });
      } else {
        await createProduto.mutateAsync(payload);
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
  const openEdit = (p: ProdutoDto) => {
    setEditItem(p);
    setFormOpen(true);
  };

  const baseColumns = useMemo<ColumnDef<ProdutoDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <span className="font-medium flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "productType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {typeLabel(row.original.productType)}
          </Badge>
        ),
      },
      {
        accessorKey: "unit",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.unit")} />,
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.description")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm max-w-xs truncate block">
            {row.original.description || t("table.emptyCell")}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const renderActiveRowActions = (row: ProdutoDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Archive,
        destructive: true,
        onClick: () => setArchiveId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  const renderArchivedRowActions = (row: ProdutoDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({
        label: t("actions.restore"),
        icon: RotateCcw,
        onClick: () => archiveProduto.mutate({ id: row.id, archived: false }),
      });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "activeTotal", icon: Pill, label: t("kpi.activeTotal"), value: stats.activeTotal, caption: t("kpi.activeCaption"), variant: "gradient-green" as const },
    { key: "vaccines", icon: Syringe, label: t("kpi.vaccines"), value: stats.vaccines, variant: "gradient-teal" as const },
    { key: "sera", icon: Droplets, label: t("kpi.sera"), value: stats.sera, variant: "gradient-gold" as const },
    { key: "reagents", icon: FlaskConical, label: t("kpi.reagents"), value: stats.reagents, variant: "gradient-green-gold" as const },
    { key: "archived", icon: Archive, label: t("kpi.archived"), value: stats.archived, caption: t("kpi.archivedCaption"), variant: "glass" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Pill} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="produtos">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((c, i) => (
          <AdminCard
            key={c.key}
            title={c.label}
            icon={c.icon}
            metric={c.value}
            caption={c.caption}
            variant={c.variant}
            stagger={(i + 1) as 1 | 2 | 3 | 4 | 5}
          />
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">
            {t("tabs.active")} ({statsQuery.data ? stats.activeTotal : activeQuery.data?.meta.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="mr-1 h-4 w-4" />
            {t("tabs.archived")} ({statsQuery.data ? stats.archived : archivedQuery.data?.meta.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <DataTable
            columns={baseColumns}
            data={activeQuery.data?.data ?? []}
            loading={activeQuery.isLoading}
            pageCount={activeQuery.data?.meta.lastPage ?? 0}
            pagination={activePagination}
            onPaginationChange={setActivePagination}
            rowCount={activeQuery.data?.meta.total}
            globalFilter={activeSearch}
            onGlobalFilterChange={setActiveSearch}
            searchPlaceholder={t("table.searchPlaceholder")}
            emptyMessage={t("table.empty")}
            renderRowActions={renderActiveRowActions}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <DataTable
            columns={baseColumns}
            data={archivedQuery.data?.data ?? []}
            loading={archivedQuery.isLoading}
            pageCount={archivedQuery.data?.meta.lastPage ?? 0}
            pagination={archivedPagination}
            onPaginationChange={setArchivedPagination}
            rowCount={archivedQuery.data?.meta.total}
            globalFilter={archivedSearch}
            onGlobalFilterChange={setArchivedSearch}
            searchPlaceholder={t("table.searchPlaceholder")}
            emptyMessage={t("table.emptyArchived")}
            renderRowActions={renderArchivedRowActions}
          />
        </TabsContent>
      </Tabs>

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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.placeholders.type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUTO_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {typeLabel(type)}
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.unit")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.unit")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.placeholders.description")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!archiveId}
        onOpenChange={(o) => !o && setArchiveId(null)}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={async () => {
          if (!archiveId) return;
          await archiveProduto.mutateAsync({ id: archiveId, archived: true });
          setArchiveId(null);
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteProduto.mutateAsync(deleteId);
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
                  <span className="text-muted-foreground">{t("details.type")}:</span>
                  <p className="font-medium">{typeLabel(viewItem.productType)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.unit")}:</span>
                  <p className="font-medium">{viewItem.unit}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.createdAt")}:</span>
                  <p className="font-medium">{formatDate(viewItem.createdAt, i18nInstance.language)}</p>
                </div>
              </div>
              {viewItem.description && (
                <div>
                  <span className="text-muted-foreground">{t("details.description")}:</span>
                  <p className="font-medium mt-1">{viewItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
