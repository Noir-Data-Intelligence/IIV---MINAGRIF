import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  ClipboardCheck, Plus, Pencil, Trash2, Eye, Award, Users, Send, Star,
  Check, X, RotateCcw, ShieldCheck, History, FileText,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUsersList } from "@/hooks/queries/useUsers";
import { useEmployeesTransversalList } from "@/hooks/queries/useRecursosHumanosTransversal";
import { useEmployeesLaboratorioList } from "@/hooks/queries/useRecursosHumanosLaboratorio";
import {
  useCyclesList, useCreateCycle, useUpdateCycle, useDeleteCycle,
  useCriteriasList, useCreateCriteria, useUpdateCriteria, useDeleteCriteria,
  useEvaluationsList, useEvaluation, useEvaluationStats,
  useCreateEvaluation, useUpdateEvaluation, useDeleteEvaluation,
  useScores, useHistory,
  useSubmitEvaluation, useApproveEvaluation, useRejectEvaluation,
  useValidateEvaluation, useReopenEvaluation,
} from "@/hooks/queries/useAvaliacoes";
import type {
  CriteriaDto, CycleDto, CycleStatus, EvaluationDto, EvaluationStatus,
} from "@/types/dto/avaliacoes";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptAvaliacoes from "@/i18n/locales/pt/admin/avaliacoes.json";
import enAvaliacoes from "@/i18n/locales/en/admin/avaliacoes.json";

// Registo do namespace "avaliacoes" em runtime (mesmo padrão de Departamentos.tsx).
if (!i18n.hasResourceBundle("pt", "avaliacoes"))
  i18n.addResourceBundle("pt", "avaliacoes", ptAvaliacoes, true, true);
if (!i18n.hasResourceBundle("en", "avaliacoes"))
  i18n.addResourceBundle("en", "avaliacoes", enAvaliacoes, true, true);

const CYCLE_STATUSES: CycleStatus[] = ["planeado", "aberto", "fechado"];

const STATUS_TONE: Record<EvaluationStatus, string> = {
  rascunho: "bg-muted text-muted-foreground",
  submetida: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  aprovada: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejeitada: "bg-destructive/15 text-destructive",
  validada: "bg-primary/15 text-primary",
};

/* ============================ Schemas ============================ */

function buildCycleSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    year: z.coerce.number().int().min(2000).max(2100),
    startDate: z.string().min(1, t("validation.datesRequired")),
    endDate: z.string().min(1, t("validation.datesRequired")),
    status: z.enum(["planeado", "aberto", "fechado"]),
    description: z.string().trim().optional(),
  });
}
type CycleFormValues = z.infer<ReturnType<typeof buildCycleSchema>>;

function buildCriteriaSchema(t: TFunction) {
  return z.object({
    cycleId: z.string().min(1, t("validation.cycleRequired")),
    name: z.string().trim().min(2, t("validation.nameShort")),
    weight: z.coerce.number().min(0),
    displayOrder: z.coerce.number().int().min(0),
    description: z.string().trim().optional(),
  });
}
type CriteriaFormValues = z.infer<ReturnType<typeof buildCriteriaSchema>>;

function buildEvaluationSchema(t: TFunction) {
  return z.object({
    cycleId: z.string().min(1, t("validation.cycleRequired")),
    employeeId: z.string().min(1, t("validation.employeeRequired")),
    evaluatorId: z.string().optional(),
    evaluationDate: z.string().optional(),
    globalScore: z.string().optional(),
    strengths: z.string().trim().optional(),
    improvements: z.string().trim().optional(),
    generalComments: z.string().trim().optional(),
  });
}
type EvaluationFormValues = z.infer<ReturnType<typeof buildEvaluationSchema>>;

/* ============================ Página ============================ */

export default function Avaliacoes() {
  const { t, i18n: i18nInstance } = useTranslation("avaliacoes");
  const { canWrite, role } = useUserRole();
  const { user } = useAuth();
  const canEdit = canWrite("avaliacoes");
  const isApprover = role === "admin" || role === "diretor";
  const prefersReduced = useReducedMotion();

  const [tab, setTab] = useState("avaliacoes");
  const { data: stats } = useEvaluationStats();

  // Opções partilhadas para os Selects (listas "completas", não paginadas na UI).
  const { data: cyclesAll } = useCyclesList({ perPage: 100 });
  const { data: employeesTransversalAll } = useEmployeesTransversalList({ perPage: 100 });
  const { data: employeesLaboratorioAll } = useEmployeesLaboratorioList({ perPage: 100 });
  const { data: usersAll } = useUsersList({});
  const cycleOptions = cyclesAll?.data ?? [];
  const employeeOptions = [...(employeesTransversalAll?.data ?? []), ...(employeesLaboratorioAll?.data ?? [])];
  const userOptions = usersAll ?? [];

  const kpiCards = [
    { key: "cycle", icon: Award, label: t("kpi.activeCycle"), value: stats?.activeCycleName ?? "—", variant: "gradient-green-gold" as const },
    { key: "total", icon: Users, label: t("kpi.total"), value: stats?.total ?? 0, variant: "glass" as const },
    { key: "pending", icon: Send, label: t("kpi.pending"), value: stats?.pending ?? 0, variant: "glass" as const },
    { key: "avg", icon: Star, label: t("kpi.avgScore"), value: stats?.avgScore != null ? stats.avgScore : "—", variant: "glass" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardCheck} title={t("page.title")} description={t("page.description")} />

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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="avaliacoes">{t("tabs.evaluations")}</TabsTrigger>
          <TabsTrigger value="ciclos">{t("tabs.cycles")}</TabsTrigger>
          <TabsTrigger value="criterios">{t("tabs.criterias")}</TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacoes" className="pt-4">
          <EvaluationsTab
            canEdit={canEdit}
            isApprover={isApprover}
            currentUserId={user?.id ?? null}
            cycleOptions={cycleOptions}
            employeeOptions={employeeOptions}
            userOptions={userOptions}
            locale={i18nInstance.language}
          />
        </TabsContent>

        <TabsContent value="ciclos" className="pt-4">
          <CyclesTab canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="criterios" className="pt-4">
          <CriteriasTab canEdit={canEdit} cycleOptions={cycleOptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================ Tab: Avaliações ============================ */

function EvaluationsTab({
  canEdit, isApprover, currentUserId, cycleOptions, employeeOptions, userOptions, locale,
}: {
  canEdit: boolean;
  isApprover: boolean;
  currentUserId: string | null;
  cycleOptions: CycleDto[];
  employeeOptions: { id: string; fullName: string }[];
  userOptions: { id: string; fullName: string }[];
  locale: string;
}) {
  const { t } = useTranslation("avaliacoes");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EvaluationDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useEvaluationsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();
  const deleteEvaluation = useDeleteEvaluation();

  const schema = useMemo(() => buildEvaluationSchema(t), [t]);
  const initialValues = useMemo<Partial<EvaluationFormValues> | undefined>(
    () =>
      editItem
        ? {
            cycleId: editItem.cycleId,
            employeeId: editItem.employeeId,
            evaluatorId: editItem.evaluatorId ?? "",
            evaluationDate: editItem.evaluationDate ?? "",
            globalScore: editItem.globalScore != null ? String(editItem.globalScore) : "",
            strengths: editItem.strengths ?? "",
            improvements: editItem.improvements ?? "",
            generalComments: editItem.generalComments ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: {
      cycleId: "", employeeId: "", evaluatorId: currentUserId ?? "",
      evaluationDate: "", globalScore: "", strengths: "", improvements: "", generalComments: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const gs = values.globalScore && values.globalScore.trim() !== "" ? Number(values.globalScore) : null;
      const payload = {
        cycleId: values.cycleId,
        employeeId: values.employeeId,
        evaluatorId: values.evaluatorId?.trim() ? values.evaluatorId : (currentUserId ?? null),
        evaluationDate: values.evaluationDate?.trim() ? values.evaluationDate : null,
        globalScore: gs,
        strengths: values.strengths?.trim() ? values.strengths.trim() : null,
        improvements: values.improvements?.trim() ? values.improvements.trim() : null,
        generalComments: values.generalComments?.trim() ? values.generalComments.trim() : null,
      };
      if (editItem) {
        await updateEvaluation.mutateAsync({ id: editItem.id, payload });
      } else {
        await createEvaluation.mutateAsync(payload);
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (e: EvaluationDto) => { setEditItem(e); setFormOpen(true); };

  const localeDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "pt-AO") : "—";

  const columns = useMemo<ColumnDef<EvaluationDto>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.employee")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.employeeName ?? "—"}</span>,
      },
      {
        accessorKey: "evaluatorName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.evaluator")} />,
        cell: ({ row }) => row.original.evaluatorName ?? "—",
      },
      {
        accessorKey: "cycleName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.cycle")} />,
        cell: ({ row }) => <span className="text-xs">{row.original.cycleName ?? "—"}</span>,
      },
      {
        accessorKey: "evaluationDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.date")} />,
        cell: ({ row }) => <span className="text-xs">{localeDate(row.original.evaluationDate)}</span>,
      },
      {
        accessorKey: "globalScore",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.score")} />,
        cell: ({ row }) => row.original.globalScore ?? "—",
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("evaluationsTable.status")} />,
        cell: ({ row }) => (
          <Badge className={STATUS_TONE[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  const renderRowActions = (row: EvaluationDto) => {
    const actions: RowAction[] = [
      { label: t("actions.view"), icon: Eye, onClick: () => setDetailId(row.id) },
    ];
    if (canEdit) {
      if (row.status === "rascunho" || row.status === "rejeitada") {
        actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      }
      actions.push({
        label: t("actions.delete"), icon: Trash2, destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions primary={{ label: t("actions.view"), icon: Eye, onClick: () => setDetailId(row.id) }} actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="avaliacoes">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newEvaluation")}
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
        searchPlaceholder={t("evaluationsTable.searchPlaceholder")}
        emptyMessage={t("evaluationsTable.empty")}
        renderRowActions={renderRowActions}
      />

      {/* Criar / editar avaliação */}
      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("dialog.editEvaluation") : t("dialog.createEvaluation")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cycleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.evaluation.cycle")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("form.evaluation.selectPlaceholder")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cycleOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.evaluation.employee")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("form.evaluation.selectPlaceholder")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeOptions.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evaluatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.evaluation.evaluator")}</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("form.evaluation.selectPlaceholder")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="evaluationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.evaluation.date")}</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="globalScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.evaluation.globalScore")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min={0} max={20} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.evaluation.strengths")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="improvements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.evaluation.improvements")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="generalComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.evaluation.generalComments")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs text-muted-foreground">{t("form.evaluation.draftHint")}</p>
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
          await deleteEvaluation.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      {/* Detalhe / drill-down */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailId && (
            <EvaluationDetail
              evaluationId={detailId}
              canEdit={canEdit}
              isApprover={isApprover}
              currentUserId={currentUserId}
              locale={locale}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ Detalhe da avaliação ============================ */

function EvaluationDetail({
  evaluationId, canEdit, isApprover, currentUserId, locale,
}: {
  evaluationId: string;
  canEdit: boolean;
  isApprover: boolean;
  currentUserId: string | null;
  locale: string;
}) {
  const { t } = useTranslation("avaliacoes");
  const { toast } = useToast();

  const { data: ev, isLoading } = useEvaluation(evaluationId);
  const { data: criteriasPage } = useCriteriasList(ev ? { cycleId: ev.cycleId, perPage: 100 } : { perPage: 100 });
  const criterias = criteriasPage?.data ?? [];
  const { data: scores = [] } = useScores(evaluationId);
  const { data: history = [], isLoading: historyLoading } = useHistory(evaluationId);

  const submit = useSubmitEvaluation(evaluationId);
  const approve = useApproveEvaluation(evaluationId);
  const reject = useRejectEvaluation(evaluationId);
  const validate = useValidateEvaluation(evaluationId);
  const reopen = useReopenEvaluation(evaluationId);

  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const localeDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "pt-AO") : "—";
  const localeDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString(locale === "en" ? "en-GB" : "pt-PT") : "—";

  const run = async (fn: () => Promise<unknown>, successKey: string) => {
    try {
      await fn();
      toast({ title: t(successKey) });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) return toast({ title: t("toast.reasonRequired"), variant: "destructive" });
    await run(() => reject.mutateAsync({ actorId: currentUserId, reason: rejectReason }), "toast.rejectSuccess");
    setRejecting(false);
    setRejectReason("");
  };

  if (isLoading || !ev) {
    return <div className="p-8 text-center text-muted-foreground">{t("detail.loading")}</div>;
  }

  const cycleCriterias = [...criterias].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-serif">
          <FileText className="h-5 w-5" />
          {t("detail.title")} — {ev.employeeName ?? "—"}
          <Badge className={STATUS_TONE[ev.status]}>{t(`status.${ev.status}`)}</Badge>
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="resumo">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="resumo">{t("detail.resumo")}</TabsTrigger>
          <TabsTrigger value="notas">{t("detail.notas")}</TabsTrigger>
          <TabsTrigger value="historico"><History className="h-4 w-4 mr-1" /> {t("detail.historico")}</TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo" className="space-y-3 pt-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("detail.date")} value={localeDate(ev.evaluationDate)} />
            <Field label={t("detail.globalScore")} value={ev.globalScore != null ? String(ev.globalScore) : "—"} />
            <Field label={t("detail.submittedAt")} value={localeDateTime(ev.submittedAt)} />
            <Field label={t("detail.approvedAt")} value={localeDateTime(ev.approvedAt)} />
            <Field label={t("detail.approvedBy")} value={ev.approvedByName ?? "—"} />
            <Field label={t("detail.acknowledgedAt")} value={localeDateTime(ev.acknowledgedAt)} />
          </div>

          {ev.rejectionReason && (
            <div className="border border-destructive/30 bg-destructive/10 rounded-md p-3">
              <p className="font-medium text-destructive text-sm">{t("detail.rejectionReason")}</p>
              <p className="text-sm">{ev.rejectionReason}</p>
            </div>
          )}
          <Block title={t("detail.strengths")} text={ev.strengths} />
          <Block title={t("detail.improvements")} text={ev.improvements} />
          <Block title={t("detail.generalComments")} text={ev.generalComments} />

          {/* Workflow de aprovação */}
          {(canEdit || isApprover) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {canEdit && (ev.status === "rascunho" || ev.status === "rejeitada") && (
                <Button onClick={() => run(() => submit.mutateAsync({ actorId: currentUserId }), "toast.submitSuccess")}>
                  <Send className="h-4 w-4 mr-1" /> {t("actions.submit")}
                </Button>
              )}
              {isApprover && ev.status === "submetida" && !rejecting && (
                <>
                  <Button onClick={() => run(() => approve.mutateAsync({ actorId: currentUserId }), "toast.approveSuccess")}>
                    <Check className="h-4 w-4 mr-1" /> {t("actions.approve")}
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(true)}>
                    <X className="h-4 w-4 mr-1" /> {t("actions.reject")}
                  </Button>
                </>
              )}
              {canEdit && ev.status === "aprovada" && (
                <Button variant="secondary" onClick={() => run(() => validate.mutateAsync({ actorId: currentUserId }), "toast.validateSuccess")}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> {t("actions.validate")}
                </Button>
              )}
              {isApprover && (ev.status === "aprovada" || ev.status === "validada" || ev.status === "rejeitada") && (
                <Button variant="outline" onClick={() => run(() => reopen.mutateAsync({ actorId: currentUserId }), "toast.reopenSuccess")}>
                  <RotateCcw className="h-4 w-4 mr-1" /> {t("actions.reopen")}
                </Button>
              )}
            </div>
          )}

          {/* Formulário inline de rejeição */}
          {rejecting && (
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <Label className="text-destructive">{t("reject.title")}</Label>
              <p className="text-xs text-muted-foreground">{t("reject.description")}</p>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("reject.placeholder")} rows={3} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRejecting(false); setRejectReason(""); }}>{t("reject.cancel")}</Button>
                <Button variant="destructive" size="sm" onClick={doReject}>
                  <X className="h-4 w-4 mr-1" /> {t("reject.confirm")}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* NOTAS POR CRITÉRIO */}
        <TabsContent value="notas" className="pt-4">
          {cycleCriterias.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("detail.noCriteria")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("detail.criteria")}</TableHead>
                  <TableHead>{t("detail.weight")}</TableHead>
                  <TableHead>{t("detail.score")}</TableHead>
                  <TableHead>{t("detail.comment")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycleCriterias.map((c) => {
                  const s = scores.find((x) => x.criteriaId === c.id);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.weight}</TableCell>
                      <TableCell>{s?.score ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s?.comment ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="pt-4">
          {historyLoading ? (
            <p className="text-sm text-muted-foreground py-4">{t("detail.loading")}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("detail.noHistory")}</p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-4">
              {history.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{localeDateTime(h.createdAt)}</span>
                    <span>·</span>
                    <span>{h.actorName ?? "—"}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <Badge variant="outline" className="mr-2">
                      {t(`historyAction.${h.action}`, { defaultValue: h.action })}
                    </Badge>
                    {h.fromStatus && h.toStatus && h.fromStatus !== h.toStatus && (
                      <span className="text-muted-foreground">
                        {t(`status.${h.fromStatus}`)} → <strong className="text-foreground">{t(`status.${h.toStatus}`)}</strong>
                      </span>
                    )}
                  </div>
                  {h.comment && <p className="text-sm mt-1 italic">"{h.comment}"</p>}
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded p-2">{text}</p>
    </div>
  );
}

/* ============================ Tab: Ciclos ============================ */

function CyclesTab({ canEdit }: { canEdit: boolean }) {
  const { t, i18n: i18nInstance } = useTranslation("avaliacoes");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CycleDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCyclesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const deleteCycle = useDeleteCycle();

  const schema = useMemo(() => buildCycleSchema(t), [t]);
  const initialValues = useMemo<Partial<CycleFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name, year: editItem.year,
            startDate: editItem.startDate, endDate: editItem.endDate,
            status: editItem.status, description: editItem.description ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: {
      name: "", year: new Date().getFullYear(), startDate: "", endDate: "",
      status: "planeado", description: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        year: Number(values.year),
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        description: values.description?.trim() ? values.description.trim() : null,
      };
      if (editItem) await updateCycle.mutateAsync({ id: editItem.id, payload });
      else await createCycle.mutateAsync(payload);
    },
    successMessage: t("toast.cycleSaved"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const localeDate = (d: string) => new Date(d).toLocaleDateString(i18nInstance.language === "en" ? "en-GB" : "pt-AO");

  const columns = useMemo<ColumnDef<CycleDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("cyclesTable.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "year",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("cyclesTable.year")} />,
      },
      {
        id: "period",
        header: () => <span>{t("cyclesTable.period")}</span>,
        cell: ({ row }) => <span className="text-xs">{localeDate(row.original.startDate)} → {localeDate(row.original.endDate)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("cyclesTable.status")} />,
        cell: ({ row }) => <Badge variant="outline">{t(`cycleStatus.${row.original.status}`)}</Badge>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18nInstance.language],
  );

  const renderRowActions = (row: CycleDto) => {
    if (!canEdit) return null;
    const actions: RowAction[] = [
      { label: t("actions.edit"), icon: Pencil, onClick: () => { setEditItem(row); setFormOpen(true); } },
      { label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) },
    ];
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="avaliacoes">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newCycle")}
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
        searchPlaceholder={t("cyclesTable.searchPlaceholder")}
        emptyMessage={t("cyclesTable.empty")}
        renderRowActions={canEdit ? renderRowActions : undefined}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("dialog.editCycle") : t("dialog.createCycle")}
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
                  <FormLabel>{t("form.cycle.name")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.cycle.year")}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.cycle.startDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.cycle.endDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                  <FormLabel>{t("form.cycle.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CYCLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`cycleStatus.${s}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.cycle.description")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
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
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCycle.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

/* ============================ Tab: Critérios ============================ */

function CriteriasTab({ canEdit, cycleOptions }: { canEdit: boolean; cycleOptions: CycleDto[] }) {
  const { t } = useTranslation("avaliacoes");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CriteriaDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCriteriasList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const createCriteria = useCreateCriteria();
  const updateCriteria = useUpdateCriteria();
  const deleteCriteria = useDeleteCriteria();

  const cycleNameOf = (id: string) => cycleOptions.find((c) => c.id === id)?.name ?? "—";

  const schema = useMemo(() => buildCriteriaSchema(t), [t]);
  const initialValues = useMemo<Partial<CriteriaFormValues> | undefined>(
    () =>
      editItem
        ? {
            cycleId: editItem.cycleId, name: editItem.name, weight: editItem.weight,
            displayOrder: editItem.displayOrder, description: editItem.description ?? "",
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema,
    initialValues,
    defaultValues: { cycleId: "", name: "", weight: 1, displayOrder: 0, description: "" },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        cycleId: values.cycleId,
        name: values.name,
        weight: Number(values.weight),
        displayOrder: Number(values.displayOrder),
        description: values.description?.trim() ? values.description.trim() : null,
      };
      if (editItem) await updateCriteria.mutateAsync({ id: editItem.id, payload });
      else await createCriteria.mutateAsync(payload);
    },
    successMessage: t("toast.criteriaSaved"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const columns = useMemo<ColumnDef<CriteriaDto>[]>(
    () => [
      {
        accessorKey: "cycleId",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("criteriasTable.cycle")} />,
        cell: ({ row }) => <span className="text-xs">{cycleNameOf(row.original.cycleId)}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("criteriasTable.name")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "weight",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("criteriasTable.weight")} />,
      },
      {
        accessorKey: "displayOrder",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("criteriasTable.order")} />,
      },
      {
        accessorKey: "description",
        header: () => <span>{t("criteriasTable.description")}</span>,
        cell: ({ row }) => <span className="text-xs text-muted-foreground max-w-md truncate block">{row.original.description ?? "—"}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, cycleOptions],
  );

  const renderRowActions = (row: CriteriaDto) => {
    if (!canEdit) return null;
    const actions: RowAction[] = [
      { label: t("actions.edit"), icon: Pencil, onClick: () => { setEditItem(row); setFormOpen(true); } },
      { label: t("actions.delete"), icon: Trash2, destructive: true, onClick: () => setDeleteId(row.id) },
    ];
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <WriteGuard module="avaliacoes">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.newCriteria")}
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
        searchPlaceholder={t("criteriasTable.searchPlaceholder")}
        emptyMessage={t("criteriasTable.empty")}
        renderRowActions={canEdit ? renderRowActions : undefined}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? t("dialog.editCriteria") : t("dialog.createCriteria")}
        form={entityForm}
        submitLabel={editItem ? t("form.submitEdit") : t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
      >
        {(form) => (
          <>
            <FormField
              control={form.control}
              name="cycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.criteria.cycle")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("form.criteria.selectPlaceholder")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cycleOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                  <FormLabel>{t("form.criteria.name")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.criteria.weight")}</FormLabel>
                    <FormControl><Input type="number" step="0.05" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.criteria.order")}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
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
                  <FormLabel>{t("form.criteria.description")}</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl>
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
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCriteria.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
