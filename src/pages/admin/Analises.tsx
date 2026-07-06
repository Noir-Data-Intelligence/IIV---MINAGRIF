import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { TestTubes, Eye, Pencil, Plus, Trash2, CalendarClock, Hourglass, CheckCircle2 } from "lucide-react";

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
import { ANALYSIS_STATUS } from "@/lib/domain-enums";
import {
  useAnalisesList,
  useCreateAnalise,
  useDeleteAnalise,
  useUpdateAnalise,
} from "@/hooks/queries/useAnalises";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import type { AnaliseDto, AnaliseStatus } from "@/types/dto/analise";
import i18n from "@/i18n";
import ptAnalises from "@/i18n/locales/pt/admin/analises.json";
import enAnalises from "@/i18n/locales/en/admin/analises.json";

// Namespace autónomo registado em runtime, seguindo o padrão de Laboratorios.tsx.
if (!i18n.hasResourceBundle("pt", "admin-analises"))
  i18n.addResourceBundle("pt", "admin-analises", ptAnalises, true, true);
if (!i18n.hasResourceBundle("en", "admin-analises"))
  i18n.addResourceBundle("en", "admin-analises", enAnalises, true, true);

const ANALYSIS_STATUSES: AnaliseStatus[] = ["agendada", "em_progresso", "concluida", "cancelada"];

function buildAnaliseSchema(t: TFunction) {
  return z.object({
    laboratoryId: z.string().min(1, t("validation.laboratoryRequired")),
    clientName: z.string().trim().min(2, t("validation.clientShort")),
    animalSpecies: z.string().trim().optional(),
    animalId: z.string().trim().optional(),
    sampleType: z.string().trim().min(1, t("validation.sampleRequired")),
    analysisType: z.string().trim().min(1, t("validation.analysisRequired")),
    scheduledDate: z.string().min(1, t("validation.dateRequired")),
    status: z.enum(["agendada", "em_progresso", "concluida", "cancelada"]),
    notes: z.string().trim().optional(),
  });
}

type AnaliseFormValues = z.infer<ReturnType<typeof buildAnaliseSchema>>;

export default function Analises() {
  const { t, i18n: i18nInstance } = useTranslation("admin-analises");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("analises");
  const statusLabel = (s: string) => t(`status.${s}`, { defaultValue: s });

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<AnaliseDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<AnaliseDto | null>(null);

  const { data, isLoading } = useAnalisesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const laboratoriosQuery = useLaboratoriosList({ page: 1, perPage: 100 });

  const createAnalise = useCreateAnalise();
  const updateAnalise = useUpdateAnalise();
  const deleteAnalise = useDeleteAnalise();

  const laboratorios = laboratoriosQuery.data?.data ?? [];
  const labNameMap = useMemo(() => {
    const map = new Map<string, string>();
    laboratorios.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [laboratorios]);

  const analiseSchema = useMemo(() => buildAnaliseSchema(t), [t]);

  const initialValues = useMemo<Partial<AnaliseFormValues> | undefined>(
    () =>
      editItem
        ? {
            laboratoryId: editItem.laboratoryId,
            clientName: editItem.clientName,
            animalSpecies: editItem.animalSpecies ?? "",
            animalId: editItem.animalId ?? "",
            sampleType: editItem.sampleType,
            analysisType: editItem.analysisType,
            scheduledDate: editItem.scheduledDate,
            status: editItem.status,
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: analiseSchema,
    initialValues,
    defaultValues: {
      laboratoryId: "",
      clientName: "",
      animalSpecies: "",
      animalId: "",
      sampleType: "",
      analysisType: "",
      scheduledDate: "",
      status: "agendada",
      notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload: Partial<AnaliseDto> = {
        laboratoryId: values.laboratoryId,
        clientName: values.clientName,
        animalSpecies: values.animalSpecies?.trim() ? values.animalSpecies.trim() : null,
        animalId: values.animalId?.trim() ? values.animalId.trim() : null,
        sampleType: values.sampleType,
        analysisType: values.analysisType,
        scheduledDate: values.scheduledDate,
        status: values.status,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      if (editItem) {
        await updateAnalise.mutateAsync({ id: editItem.id, payload });
      } else {
        await createAnalise.mutateAsync(payload);
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

  const openEdit = (a: AnaliseDto) => {
    setEditItem(a);
    setFormOpen(true);
  };

  // KPIs — total vem do meta.total (dataset completo); agendadas/em progresso/concluídas
  // derivam da página carregada, tal como kpiActive/kpiTypes fazem em Laboratorios.tsx.
  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiScheduled = useMemo(() => rows.filter((a) => a.status === "agendada").length, [rows]);
  const kpiInProgress = useMemo(() => rows.filter((a) => a.status === "em_progresso").length, [rows]);
  const kpiConcluded = useMemo(() => rows.filter((a) => a.status === "concluida").length, [rows]);

  const columns = useMemo<ColumnDef<AnaliseDto>[]>(
    () => [
      {
        accessorKey: "scheduledDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => formatDate(row.original.scheduledDate),
      },
      {
        id: "laboratory",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.laboratory")} />,
        cell: ({ row }) => labNameMap.get(row.original.laboratoryId) ?? t("table.emptyCell"),
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.client")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <TestTubes className="h-4 w-4 text-primary" />
            {row.original.clientName}
          </div>
        ),
      },
      {
        accessorKey: "animalSpecies",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.species")} />,
        cell: ({ row }) => row.original.animalSpecies || t("table.emptyCell"),
      },
      {
        accessorKey: "analysisType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.analysisType")} />,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => {
          const st = ANALYSIS_STATUS[row.original.status] ?? ANALYSIS_STATUS.agendada;
          return <Badge variant={st.variant}>{statusLabel(row.original.status)}</Badge>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, labNameMap],
  );

  const renderRowActions = (row: AnaliseDto) => {
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
      <AdminPageHeader icon={TestTubes} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="analises">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard
          variant="gradient-green"
          icon={TestTubes}
          metric={kpiTotal}
          title={t("kpis.total")}
          caption={t("kpis.totalCaption")}
          stagger={1}
        />
        <AdminCard
          variant="gradient-teal"
          icon={CalendarClock}
          metric={kpiScheduled}
          title={t("kpis.scheduled")}
          caption={t("kpis.scheduledCaption")}
          stagger={2}
        />
        <AdminCard
          variant="gradient-gold"
          icon={Hourglass}
          metric={kpiInProgress}
          title={t("kpis.inProgress")}
          caption={t("kpis.inProgressCaption")}
          stagger={3}
        />
        <AdminCard
          variant="gradient-green-gold"
          icon={CheckCircle2}
          metric={kpiConcluded}
          title={t("kpis.concluded")}
          caption={t("kpis.concludedCaption")}
          stagger={4}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.clientName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.clientName")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="animalSpecies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.animalSpecies")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.animalSpecies")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="animalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.animalId")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.animalId")} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sampleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.sampleType")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.sampleType")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="analysisType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.analysisType")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.analysisType")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.scheduledDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {editItem && (
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
                        {ANALYSIS_STATUSES.map((s) => (
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
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.placeholders.notes")} {...field} value={field.value ?? ""} />
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
          await deleteAnalise.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("dialog.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">{t("details.laboratory")}:</span>
                  <p className="font-medium">{labNameMap.get(viewItem.laboratoryId) ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.scheduledDate")}:</span>
                  <p className="font-medium">
                    {formatDate(viewItem.scheduledDate, i18nInstance.language === "en" ? "en" : "pt")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.clientName")}:</span>
                  <p className="font-medium">{viewItem.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.animalSpecies")}:</span>
                  <p className="font-medium">{viewItem.animalSpecies || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.animalId")}:</span>
                  <p className="font-medium">{viewItem.animalId || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.sampleType")}:</span>
                  <p className="font-medium">{viewItem.sampleType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.analysisType")}:</span>
                  <p className="font-medium">{viewItem.analysisType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={(ANALYSIS_STATUS[viewItem.status] ?? ANALYSIS_STATUS.agendada).variant}>
                      {statusLabel(viewItem.status)}
                    </Badge>
                  </p>
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
