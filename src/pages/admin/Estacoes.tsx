import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Layers, MapPin, Pencil, Plus, Power, Trash2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateEstacao,
  useDeleteEstacao,
  useEstacoesList,
  useUpdateEstacao,
} from "@/hooks/queries/useEstacoes";
import type { EstacaoDto, StationType } from "@/types/dto/estacao";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptEstacoes from "@/i18n/locales/pt/admin/estacoes.json";
import enEstacoes from "@/i18n/locales/en/admin/estacoes.json";

// Namespace "estacoes" registado em runtime, guardado por `hasResourceBundle`
// (mesmo padrão de Departamentos.tsx — mantém a página autónoma).
if (!i18n.hasResourceBundle("pt", "estacoes"))
  i18n.addResourceBundle("pt", "estacoes", ptEstacoes, true, true);
if (!i18n.hasResourceBundle("en", "estacoes"))
  i18n.addResourceBundle("en", "estacoes", enEstacoes, true, true);

const STATION_TYPES: StationType[] = ["zootecnica", "experimental", "campo"];

function buildEstacaoSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    stationType: z.enum(["zootecnica", "experimental", "campo"], {
      errorMap: () => ({ message: t("validation.typeRequired") }),
    }),
    location: z.string().trim().optional(),
    description: z.string().trim().optional(),
    isActive: z.boolean(),
  });
}

type EstacaoFormValues = z.infer<ReturnType<typeof buildEstacaoSchema>>;

export default function Estacoes() {
  const { t, i18n: i18nInstance } = useTranslation("estacoes");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("estacoes");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<EstacaoDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EstacaoDto | null>(null);

  const { data, isLoading } = useEstacoesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  // Query separada (dataset amplo) para KPIs agregados, independente da página.
  const { data: statsData } = useEstacoesList({ page: 1, perPage: 100 });

  const createEstacao = useCreateEstacao();
  const updateEstacao = useUpdateEstacao();
  const deleteEstacao = useDeleteEstacao();

  const estacaoSchema = useMemo(() => buildEstacaoSchema(t), [t]);

  const initialValues = useMemo<Partial<EstacaoFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name,
            stationType: editItem.stationType,
            location: editItem.location ?? "",
            description: editItem.description ?? "",
            isActive: editItem.isActive,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: estacaoSchema,
    initialValues,
    defaultValues: { name: "", stationType: undefined, location: "", description: "", isActive: true },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        stationType: values.stationType,
        location: values.location?.trim() ? values.location.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
      };
      if (editItem) {
        await updateEstacao.mutateAsync({ id: editItem.id, payload });
      } else {
        await createEstacao.mutateAsync(payload);
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

  const openEdit = (s: EstacaoDto) => {
    setEditItem(s);
    setFormOpen(true);
  };

  const stats = useMemo(() => {
    const rows = statsData?.data ?? [];
    return {
      total: statsData?.meta.total ?? rows.length,
      active: rows.filter((s) => s.isActive).length,
      types: new Set(rows.map((s) => s.stationType)).size,
    };
  }, [statsData]);

  const columns = useMemo<ColumnDef<EstacaoDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <span className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "stationType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => <Badge variant="secondary">{t(`types.${row.original.stationType}`)}</Badge>,
      },
      {
        accessorKey: "location",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.location")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.location || t("table.emptyCell")}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "destructive"}>
            {row.original.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: EstacaoDto) => {
    const actions: RowAction[] = [
      { label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) },
    ];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={MapPin} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="estacoes">
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
          <AdminCard variant="gradient-green-gold" icon={MapPin} metric={stats.total} title={t("kpi.total")} caption={t("kpi.totalCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Power} metric={stats.active} title={t("kpi.active")} caption={t("kpi.activeCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={Layers} metric={stats.types} title={t("kpi.types")} caption={t("kpi.typesCaption")} />
        </motion.div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stationType"
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
                        {STATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`types.${type}`)}
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.location")} {...field} value={field.value ?? ""} />
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
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel className="mb-0">{t("form.labels.active")}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
          await deleteEstacao.mutateAsync(deleteId);
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
                  <p className="font-medium">{t(`types.${viewItem.stationType}`)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.location")}:</span>
                  <p className="font-medium">{viewItem.location || t("table.emptyCell")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={viewItem.isActive ? "default" : "destructive"}>
                      {viewItem.isActive ? t("status.active") : t("status.inactive")}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.createdAt")}:</span>
                  <p className="font-medium">
                    {new Date(viewItem.createdAt).toLocaleDateString(
                      i18nInstance.language === "en" ? "en-GB" : "pt-AO",
                    )}
                  </p>
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
