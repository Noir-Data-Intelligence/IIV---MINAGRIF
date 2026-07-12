import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { GraduationCap, Clock, CheckCircle2, Timer, Plus, Eye, Pencil, Trash2 } from "lucide-react";

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
import { formatDate } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useTrainingsList, useCreateTraining, useUpdateTraining, useDeleteTraining,
} from "@/hooks/queries/useFormacoes";
import type { TrainingDto, TrainingStatus } from "@/types/dto/formacoes";
import i18n from "@/i18n";
import ptFormacoes from "@/i18n/locales/pt/admin/formacoes.json";
import enFormacoes from "@/i18n/locales/en/admin/formacoes.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Departamentos.tsx.
if (!i18n.hasResourceBundle("pt", "formacoes"))
  i18n.addResourceBundle("pt", "formacoes", ptFormacoes, true, true);
if (!i18n.hasResourceBundle("en", "formacoes"))
  i18n.addResourceBundle("en", "formacoes", enFormacoes, true, true);

const STATUSES: TrainingStatus[] = ["planeada", "em_curso", "concluida", "cancelada"];

const statusVariant: Record<TrainingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  planeada: "secondary",
  em_curso: "default",
  concluida: "outline",
  cancelada: "destructive",
};

const BIG_PAGE = { page: 1, perPage: 1000 } as const;

function buildTrainingSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(3, t("validation.title")),
    trainer: z.string().trim().optional(),
    location: z.string().trim().optional(),
    startDate: z.string().min(1, t("validation.startDate")),
    endDate: z.string().min(1, t("validation.endDate")),
    hours: z
      .string()
      .trim()
      .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("validation.hours")),
    status: z.enum(["planeada", "em_curso", "concluida", "cancelada"]),
    description: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}
type TrainingFormValues = z.infer<ReturnType<typeof buildTrainingSchema>>;

export default function Formacoes() {
  const { t } = useTranslation("formacoes");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("formacoes");
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<TrainingDto | null>(null);
  const [viewItem, setViewItem] = useState<TrainingDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useTrainingsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
    status: statusFilter !== "todos" ? (statusFilter as TrainingStatus) : undefined,
  });
  const allQuery = useTrainingsList(BIG_PAGE);

  const createTraining = useCreateTraining();
  const updateTraining = useUpdateTraining();
  const deleteTraining = useDeleteTraining();

  const all = useMemo(() => allQuery.data?.data ?? [], [allQuery.data]);
  const kpis = useMemo(() => ({
    total: all.length,
    inProgress: all.filter((r) => r.status === "em_curso").length,
    completed: all.filter((r) => r.status === "concluida").length,
    totalHours: all.reduce((s, r) => s + Number(r.hours || 0), 0),
  }), [all]);

  const trainingSchema = useMemo(() => buildTrainingSchema(t), [t]);
  const initialValues = useMemo<Partial<TrainingFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            trainer: editItem.trainer ?? "",
            location: editItem.location ?? "",
            startDate: editItem.startDate,
            endDate: editItem.endDate,
            hours: String(editItem.hours),
            status: editItem.status,
            description: editItem.description ?? "",
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: trainingSchema,
    initialValues,
    defaultValues: {
      title: "", trainer: "", location: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      hours: "0", status: "planeada", description: "", notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        title: values.title,
        trainer: values.trainer?.trim() ? values.trainer.trim() : null,
        location: values.location?.trim() ? values.location.trim() : null,
        startDate: values.startDate,
        endDate: values.endDate,
        hours: Number(values.hours),
        status: values.status,
        description: values.description?.trim() ? values.description.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) await updateTraining.mutateAsync({ id: editItem.id, payload });
      else await createTraining.mutateAsync(payload);
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (r: TrainingDto) => { setEditItem(r); setFormOpen(true); };

  const columns = useMemo<ColumnDef<TrainingDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: "trainer",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.trainer")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.trainer ?? t("table.emptyCell")}</span>,
      },
      {
        accessorKey: "location",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.location")} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.location ?? t("table.emptyCell")}</span>,
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.startDate")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startDate)}</span>,
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.endDate")} />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.endDate)}</span>,
      },
      {
        accessorKey: "hours",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.hours")} />,
        cell: ({ row }) => <span className="text-sm">{row.original.hours}h</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>,
      },
    ],
    [t],
  );

  const renderRowActions = (row: TrainingDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "total", icon: GraduationCap, label: t("kpis.total"), value: kpis.total, caption: t("kpis.totalCaption"), variant: "gradient-green-gold" as const },
    { key: "inProgress", icon: Clock, label: t("kpis.inProgress"), value: kpis.inProgress, caption: t("kpis.inProgressCaption"), variant: "gradient-gold" as const },
    { key: "completed", icon: CheckCircle2, label: t("kpis.completed"), value: kpis.completed, caption: t("kpis.completedCaption"), variant: "gradient-green" as const },
    { key: "hours", icon: Timer, label: t("kpis.hours"), value: `${kpis.totalHours}h`, caption: t("kpis.hoursCaption"), variant: "gradient-teal" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={GraduationCap} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="formacoes">
          <Button onClick={openCreate}>
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
        {kpiCards.map((c) => (
          <motion.div key={c.key} variants={prefersReduced ? undefined : fadeInUp}>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="sm:w-[220px]"><SelectValue placeholder={t("filters.statusPlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{t("filters.allStatus")}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={listQuery.data?.data ?? []}
        loading={listQuery.isLoading}
        pageCount={listQuery.data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={listQuery.data?.meta.total}
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
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.title")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="trainer" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.trainer")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.location")}</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.startDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.endDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.hours")}</FormLabel>
                  <FormControl><Input type="number" min="0" step="0.5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.description")}</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
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

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteTraining.mutateAsync(deleteId);
          setDeleteId(null);
        }}
        title={t("delete.title")}
        description={t("delete.description")}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">{t("details.title")}:</span><p className="font-medium">{viewItem.title}</p></div>
                <div><span className="text-muted-foreground">{t("details.status")}:</span><p><Badge variant={statusVariant[viewItem.status]}>{t(`status.${viewItem.status}`)}</Badge></p></div>
                <div><span className="text-muted-foreground">{t("details.trainer")}:</span><p className="font-medium">{viewItem.trainer ?? t("table.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("details.location")}:</span><p className="font-medium">{viewItem.location ?? t("table.emptyCell")}</p></div>
                <div><span className="text-muted-foreground">{t("details.startDate")}:</span><p className="font-medium">{formatDate(viewItem.startDate)}</p></div>
                <div><span className="text-muted-foreground">{t("details.endDate")}:</span><p className="font-medium">{formatDate(viewItem.endDate)}</p></div>
                <div><span className="text-muted-foreground">{t("details.hours")}:</span><p className="font-medium">{viewItem.hours}h</p></div>
                <div><span className="text-muted-foreground">{t("details.createdAt")}:</span><p className="font-medium">{formatDate(viewItem.createdAt)}</p></div>
              </div>
              {viewItem.description && (
                <div><span className="text-muted-foreground">{t("details.description")}:</span><p className="font-medium mt-1">{viewItem.description}</p></div>
              )}
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
