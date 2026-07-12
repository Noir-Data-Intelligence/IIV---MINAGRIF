import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Microscope, FlaskConical, BookOpen, Wallet, Plus, Pencil, Trash2, Eye,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import {
  useInvestigacaoStats,
  useLinesList, useCreateLine, useUpdateLine, useDeleteLine,
  useProjectsList, useCreateProject, useUpdateProject, useDeleteProject,
  usePublicationsList, useCreatePublication, useUpdatePublication, useDeletePublication,
} from "@/hooks/queries/useInvestigacao";
import type {
  LineDto, LineStatus, ProjectDto, ProjectStatus, PublicationDto, PublicationType,
} from "@/types/dto/investigacao";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptInvestigacao from "@/i18n/locales/pt/admin/investigacao.json";
import enInvestigacao from "@/i18n/locales/en/admin/investigacao.json";

// Registo do namespace "investigacao" em runtime (mesmo padrão de Departamentos.tsx).
if (!i18n.hasResourceBundle("pt", "investigacao"))
  i18n.addResourceBundle("pt", "investigacao", ptInvestigacao, true, true);
if (!i18n.hasResourceBundle("en", "investigacao"))
  i18n.addResourceBundle("en", "investigacao", enInvestigacao, true, true);

const NONE = "__none__";
const LINE_STATUSES: LineStatus[] = ["activa", "suspensa", "concluida"];
const PROJECT_STATUSES: ProjectStatus[] = ["proposto", "aprovado", "em_curso", "concluido", "cancelado"];
const PUBLICATION_TYPES: PublicationType[] = ["artigo", "comunicacao", "livro", "tese", "relatorio"];

const LINE_STATUS_TONE: Record<LineStatus, string> = {
  activa: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  suspensa: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluida: "bg-muted text-muted-foreground",
};
const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  proposto: "bg-muted text-muted-foreground",
  aprovado: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  em_curso: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluido: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelado: "bg-destructive/15 text-destructive",
};

const money = (n: number | null | undefined) => `${Number(n || 0).toLocaleString("pt-PT")} AOA`;

/* ============================ Página principal ============================ */

export default function Investigacao() {
  const { t } = useTranslation("investigacao");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("investigacao");
  const prefersReduced = useReducedMotion();

  const { data: stats } = useInvestigacaoStats();

  const kpiCards = [
    { key: "lines", icon: FlaskConical, label: t("kpi.lines"), value: stats?.totalLines ?? 0, variant: "gradient-green-gold" as const },
    { key: "projects", icon: Microscope, label: t("kpi.projects"), value: stats?.activeProjects ?? 0, variant: "glass" as const },
    { key: "publications", icon: BookOpen, label: t("kpi.publications"), value: stats?.totalPublications ?? 0, variant: "glass" as const },
    { key: "funding", icon: Wallet, label: t("kpi.funding"), value: money(stats?.totalFunding ?? 0), variant: "glass" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Microscope} title={t("page.title")} description={t("page.description")} />

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
              variant={c.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      <Tabs defaultValue="projectos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projectos">{t("tabs.projects")}</TabsTrigger>
          <TabsTrigger value="linhas">{t("tabs.lines")}</TabsTrigger>
          <TabsTrigger value="publicacoes">{t("tabs.publications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="projectos">
          <ProjectsTab canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="linhas">
          <LinesTab canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="publicacoes">
          <PublicationsTab canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================ Detalhe genérico ============================ */

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

/* =============================== Linhas =============================== */

function buildLineSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    area: z.string().trim().optional(),
    description: z.string().trim().optional(),
    status: z.enum(["activa", "suspensa", "concluida"]),
  });
}
type LineFormValues = z.infer<ReturnType<typeof buildLineSchema>>;

function LinesTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation("investigacao");
  const { user } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LineDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<LineDto | null>(null);

  const { data, isLoading } = useLinesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createLine = useCreateLine();
  const updateLine = useUpdateLine();
  const deleteLine = useDeleteLine();

  const schema = useMemo(() => buildLineSchema(t), [t]);
  const initialValues = useMemo<Partial<LineFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name,
            area: editItem.area ?? "",
            description: editItem.description ?? "",
            status: editItem.status,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: { name: "", area: "", description: "", status: "activa" },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        area: values.area?.trim() ? values.area.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        status: values.status,
        ...(editItem ? {} : { createdBy: user?.id ?? null }),
      };
      if (editItem) await updateLine.mutateAsync({ id: editItem.id, payload });
      else await createLine.mutateAsync(payload);
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const columns = useMemo<ColumnDef<LineDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("lines.table.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "area",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("lines.table.area")} />,
        cell: ({ row }) => row.original.area || t("table.emptyCell"),
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("lines.table.description")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-1 max-w-md">
            {row.original.description || t("table.emptyCell")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("lines.table.status")} />,
        cell: ({ row }) => (
          <Badge className={LINE_STATUS_TONE[row.original.status]}>{t(`lineStatus.${row.original.status}`)}</Badge>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: LineDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => { setEditItem(row); setFormOpen(true); } });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="investigacao">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newLine")}
          </Button>
        </WriteGuard>
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
        searchPlaceholder={t("lines.table.searchPlaceholder")}
        emptyMessage={t("lines.table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("lines.dialog.editTitle") : t("lines.dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("lines.form.labels.name")}</FormLabel>
                <FormControl><Input placeholder={t("lines.form.placeholders.name")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="area" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lines.form.labels.area")}</FormLabel>
                  <FormControl><Input placeholder={t("lines.form.placeholders.area")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("lines.form.labels.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LINE_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`lineStatus.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("lines.form.labels.description")}</FormLabel>
                <FormControl><Textarea placeholder={t("lines.form.placeholders.description")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteLine.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">{t("lines.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <DetailField label={t("details.name")} value={viewItem.name} />
              <div className="grid grid-cols-2 gap-3">
                <DetailField label={t("details.area")} value={viewItem.area || t("table.emptyCell")} />
                <DetailField label={t("details.status")} value={<Badge className={LINE_STATUS_TONE[viewItem.status]}>{t(`lineStatus.${viewItem.status}`)}</Badge>} />
              </div>
              {viewItem.description && <DetailField label={t("details.description")} value={viewItem.description} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =============================== Projectos =============================== */

function buildProjectSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(3, t("validation.titleShort")),
    lineId: z.string(),
    objectives: z.string().trim().optional(),
    status: z.enum(["proposto", "aprovado", "em_curso", "concluido", "cancelado"]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    fundingSource: z.string().trim().optional(),
    fundingAmount: z.coerce.number().min(0).optional(),
    partners: z.string().trim().optional(),
  });
}
type ProjectFormValues = z.infer<ReturnType<typeof buildProjectSchema>>;

function ProjectsTab({ canEdit }: { canEdit: boolean }) {
  const { t, i18n: i18nInstance } = useTranslation("investigacao");
  const { user } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<ProjectDto | null>(null);

  const { data, isLoading } = useProjectsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  // Linhas para resolver nomes e alimentar o select do formulário.
  const { data: linesData } = useLinesList({ perPage: 100 });
  const lines = linesData?.data ?? [];
  const lineName = (id: string | null) => lines.find((l) => l.id === id)?.name ?? t("table.emptyCell");

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const schema = useMemo(() => buildProjectSchema(t), [t]);
  const initialValues = useMemo<Partial<ProjectFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            lineId: editItem.lineId ?? NONE,
            objectives: editItem.objectives ?? "",
            status: editItem.status,
            startDate: editItem.startDate ?? "",
            endDate: editItem.endDate ?? "",
            fundingSource: editItem.fundingSource ?? "",
            fundingAmount: editItem.fundingAmount ?? 0,
            partners: editItem.partners ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: {
      title: "", lineId: NONE, objectives: "", status: "proposto",
      startDate: "", endDate: "", fundingSource: "", fundingAmount: 0, partners: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        title: values.title,
        lineId: values.lineId && values.lineId !== NONE ? values.lineId : null,
        objectives: values.objectives?.trim() ? values.objectives.trim() : null,
        status: values.status,
        startDate: values.startDate?.trim() ? values.startDate : null,
        endDate: values.endDate?.trim() ? values.endDate : null,
        fundingSource: values.fundingSource?.trim() ? values.fundingSource.trim() : null,
        fundingAmount: values.fundingAmount ? Number(values.fundingAmount) : null,
        currency: "AOA",
        partners: values.partners?.trim() ? values.partners.trim() : null,
        ...(editItem ? {} : { createdBy: user?.id ?? null }),
      };
      if (editItem) await updateProject.mutateAsync({ id: editItem.id, payload });
      else await createProject.mutateAsync(payload);
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const localeDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(i18nInstance.language === "en" ? "en-GB" : "pt-AO") : "—";

  const columns = useMemo<ColumnDef<ProjectDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("projects.table.title")} />,
        cell: ({ row }) => <span className="font-medium line-clamp-1 max-w-sm">{row.original.title}</span>,
      },
      {
        id: "line",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("projects.table.line")} />,
        cell: ({ row }) => <span className="text-muted-foreground">{lineName(row.original.lineId)}</span>,
      },
      {
        id: "period",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("projects.table.period")} />,
        cell: ({ row }) => <span className="text-xs">{localeDate(row.original.startDate)} → {localeDate(row.original.endDate)}</span>,
      },
      {
        accessorKey: "fundingAmount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("projects.table.funding")} />,
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.fundingSource || t("table.emptyCell")}
            {row.original.fundingAmount ? ` · ${money(row.original.fundingAmount)}` : ""}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("projects.table.status")} />,
        cell: ({ row }) => (
          <Badge className={PROJECT_STATUS_TONE[row.original.status]}>{t(`projectStatus.${row.original.status}`)}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18nInstance.language, lines],
  );

  const renderRowActions = (row: ProjectDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => { setEditItem(row); setFormOpen(true); } });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="investigacao">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newProject")}
          </Button>
        </WriteGuard>
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
        searchPlaceholder={t("projects.table.searchPlaceholder")}
        emptyMessage={t("projects.table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("projects.dialog.editTitle") : t("projects.dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.form.labels.title")}</FormLabel>
                <FormControl><Input placeholder={t("projects.form.placeholders.title")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="lineId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.line")}</FormLabel>
                  <Select value={field.value || NONE} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("projects.form.noLine")}</SelectItem>
                      {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`projectStatus.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.startDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.endDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fundingSource" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.fundingSource")}</FormLabel>
                  <FormControl><Input placeholder={t("projects.form.placeholders.fundingSource")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fundingAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.form.labels.fundingAmount")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="objectives" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.form.labels.objectives")}</FormLabel>
                <FormControl><Textarea placeholder={t("projects.form.placeholders.objectives")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="partners" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.form.labels.partners")}</FormLabel>
                <FormControl><Input placeholder={t("projects.form.placeholders.partners")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteProject.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">{t("projects.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <DetailField label={t("details.title")} value={viewItem.title} />
              <div className="grid grid-cols-2 gap-3">
                <DetailField label={t("details.line")} value={lineName(viewItem.lineId)} />
                <DetailField label={t("details.status")} value={<Badge className={PROJECT_STATUS_TONE[viewItem.status]}>{t(`projectStatus.${viewItem.status}`)}</Badge>} />
                <DetailField label={t("details.period")} value={`${localeDate(viewItem.startDate)} → ${localeDate(viewItem.endDate)}`} />
                <DetailField label={t("details.fundingAmount")} value={viewItem.fundingAmount ? money(viewItem.fundingAmount) : t("table.emptyCell")} />
              </div>
              {viewItem.fundingSource && <DetailField label={t("details.fundingSource")} value={viewItem.fundingSource} />}
              {viewItem.objectives && <DetailField label={t("details.objectives")} value={viewItem.objectives} />}
              {viewItem.partners && <DetailField label={t("details.partners")} value={viewItem.partners} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =============================== Publicações =============================== */

function buildPublicationSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(3, t("validation.titleShort")),
    type: z.enum(["artigo", "comunicacao", "livro", "tese", "relatorio"]),
    authorsText: z.string().trim().optional(),
    year: z.coerce.number().int().min(0).optional(),
    venue: z.string().trim().optional(),
    doi: z.string().trim().optional(),
    url: z.string().trim().optional(),
    projectId: z.string(),
  });
}
type PublicationFormValues = z.infer<ReturnType<typeof buildPublicationSchema>>;

function PublicationsTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation("investigacao");
  const { user } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PublicationDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<PublicationDto | null>(null);

  const { data, isLoading } = usePublicationsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  // Projectos para resolver nomes e alimentar o select do formulário.
  const { data: projectsData } = useProjectsList({ perPage: 100 });
  const projects = projectsData?.data ?? [];
  const projectTitle = (id: string | null) => projects.find((p) => p.id === id)?.title ?? t("table.emptyCell");

  const createPublication = useCreatePublication();
  const updatePublication = useUpdatePublication();
  const deletePublication = useDeletePublication();

  const schema = useMemo(() => buildPublicationSchema(t), [t]);
  const initialValues = useMemo<Partial<PublicationFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            type: editItem.type,
            authorsText: editItem.authors.join(", "),
            year: editItem.year ?? 0,
            venue: editItem.venue ?? "",
            doi: editItem.doi ?? "",
            url: editItem.url ?? "",
            projectId: editItem.projectId ?? NONE,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: {
      title: "", type: "artigo", authorsText: "", year: new Date().getFullYear(),
      venue: "", doi: "", url: "", projectId: NONE,
    },
    open: formOpen,
    onSubmit: async (values) => {
      const authors = (values.authorsText || "").split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        title: values.title,
        type: values.type,
        authors,
        year: values.year ? Number(values.year) : null,
        venue: values.venue?.trim() ? values.venue.trim() : null,
        doi: values.doi?.trim() ? values.doi.trim() : null,
        url: values.url?.trim() ? values.url.trim() : null,
        projectId: values.projectId && values.projectId !== NONE ? values.projectId : null,
        ...(editItem ? {} : { createdBy: user?.id ?? null }),
      };
      if (editItem) await updatePublication.mutateAsync({ id: editItem.id, payload });
      else await createPublication.mutateAsync(payload);
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const columns = useMemo<ColumnDef<PublicationDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("publications.table.title")} />,
        cell: ({ row }) => <span className="font-medium line-clamp-2 max-w-sm">{row.original.title}</span>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("publications.table.type")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`pubType.${row.original.type}`)}</Badge>,
      },
      {
        accessorKey: "year",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("publications.table.year")} />,
        cell: ({ row }) => row.original.year ?? t("table.emptyCell"),
      },
      {
        accessorKey: "venue",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("publications.table.venue")} />,
        cell: ({ row }) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{row.original.venue || t("table.emptyCell")}</span>,
      },
      {
        accessorKey: "doi",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("publications.table.doi")} />,
        cell: ({ row }) =>
          row.original.doi ? (
            <a
              href={row.original.url || `https://doi.org/${row.original.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {row.original.doi}
            </a>
          ) : (
            t("table.emptyCell")
          ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: PublicationDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => { setEditItem(row); setFormOpen(true); } });
      actions.push({ label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="investigacao">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newPublication")}
          </Button>
        </WriteGuard>
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
        searchPlaceholder={t("publications.table.searchPlaceholder")}
        emptyMessage={t("publications.table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("publications.dialog.editTitle") : t("publications.dialog.createTitle")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("publications.form.labels.title")}</FormLabel>
                <FormControl><Textarea placeholder={t("publications.form.placeholders.title")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("publications.form.labels.type")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PUBLICATION_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t(`pubType.${ty}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("publications.form.labels.year")}</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? 0} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="authorsText" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("publications.form.labels.authors")}</FormLabel>
                <FormControl><Input placeholder={t("publications.form.placeholders.authors")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="venue" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("publications.form.labels.venue")}</FormLabel>
                <FormControl><Input placeholder={t("publications.form.placeholders.venue")} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="doi" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("publications.form.labels.doi")}</FormLabel>
                  <FormControl><Input placeholder={t("publications.form.placeholders.doi")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("publications.form.labels.url")}</FormLabel>
                  <FormControl><Input placeholder={t("publications.form.placeholders.url")} {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="projectId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("publications.form.labels.project")}</FormLabel>
                <Select value={field.value || NONE} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("publications.form.noProject")}</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deletePublication.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">{t("publications.dialog.detailsTitle")}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3">
              <DetailField label={t("details.title")} value={viewItem.title} />
              <div className="grid grid-cols-2 gap-3">
                <DetailField label={t("details.type")} value={<Badge variant="outline">{t(`pubType.${viewItem.type}`)}</Badge>} />
                <DetailField label={t("details.year")} value={viewItem.year ?? t("table.emptyCell")} />
              </div>
              <DetailField label={t("details.authors")} value={viewItem.authors.length ? viewItem.authors.join(", ") : t("table.emptyCell")} />
              {viewItem.venue && <DetailField label={t("details.venue")} value={viewItem.venue} />}
              <DetailField label={t("details.project")} value={projectTitle(viewItem.projectId)} />
              {viewItem.doi && (
                <DetailField
                  label={t("details.doi")}
                  value={<a href={viewItem.url || `https://doi.org/${viewItem.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{viewItem.doi}</a>}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
