import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  Plane, Plus, Pencil, Trash2, Eye, Calendar, Wallet, Clock, Send, Check, X,
  FileText, Download, AlertTriangle, Upload,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUsersList } from "@/hooks/queries/useUsers";
import {
  useMissionsList, useMission, useMissionStats, useCreateMission, useUpdateMission, useDeleteMission,
  useSubmitMission, useApproveMission, useRejectMission,
  useParticipants, useCreateParticipant, useDeleteParticipant,
  useGuide, useUpsertGuide,
  useExpenses, useCreateExpense, useDeleteExpense,
  useReport, useUpsertReport, useApproveReport,
} from "@/hooks/queries/useMissoes";
import type {
  MissionDto, MissionStatus, ExpenseCategory,
} from "@/types/dto/missoes";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { generateMissionGuidePdf } from "@/lib/missionGuidePdf";
import i18n from "@/i18n";
import ptMissoes from "@/i18n/locales/pt/admin/missoes.json";
import enMissoes from "@/i18n/locales/en/admin/missoes.json";

// Registo do namespace "missoes" em runtime (mesmo padrão de Departamentos.tsx).
if (!i18n.hasResourceBundle("pt", "missoes"))
  i18n.addResourceBundle("pt", "missoes", ptMissoes, true, true);
if (!i18n.hasResourceBundle("en", "missoes"))
  i18n.addResourceBundle("en", "missoes", enMissoes, true, true);

const MISSION_STATUSES: MissionStatus[] = [
  "planeada", "submetida", "aprovada", "em_curso", "concluida", "cancelada",
];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "transporte", "alojamento", "alimentacao", "combustivel", "outro",
];

const STATUS_TONE: Record<MissionStatus, string> = {
  planeada: "bg-muted text-muted-foreground",
  submetida: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  aprovada: "bg-primary/15 text-primary",
  em_curso: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  concluida: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelada: "bg-destructive/15 text-destructive",
};

const money = (n: number, c: string) => `${Number(n || 0).toLocaleString("pt-PT")} ${c}`;

/** Schema zod reconstruído por idioma via `t()` (padrão de Departamentos.tsx). */
function buildMissionSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(3, t("validation.titleShort")),
    destination: z.string().trim().min(2, t("validation.destinationShort")),
    purpose: z.string().trim().optional(),
    startDate: z.string().min(1, t("validation.datesRequired")),
    endDate: z.string().min(1, t("validation.datesRequired")),
    status: z.enum(["planeada", "submetida", "aprovada", "em_curso", "concluida", "cancelada"]),
    budget: z.coerce.number().min(0),
    currency: z.string().trim().min(1),
    notes: z.string().trim().optional(),
  });
}
type MissionFormValues = z.infer<ReturnType<typeof buildMissionSchema>>;

export default function Missoes() {
  const { t, i18n: i18nInstance } = useTranslation("missoes");
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("missoes");
  const prefersReduced = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MissionDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useMissionsList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });
  const { data: stats } = useMissionStats();

  const createMission = useCreateMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();

  const missionSchema = useMemo(() => buildMissionSchema(t), [t]);

  const initialValues = useMemo<Partial<MissionFormValues> | undefined>(
    () =>
      editItem
        ? {
            title: editItem.title,
            destination: editItem.destination,
            purpose: editItem.purpose ?? "",
            startDate: editItem.startDate,
            endDate: editItem.endDate,
            status: editItem.status,
            budget: editItem.budget,
            currency: editItem.currency,
            notes: editItem.notes ?? "",
          }
        : undefined,
    [editItem],
  );

  const today = new Date().toISOString().slice(0, 10);
  const entityForm = useEntityForm({
    schema: missionSchema,
    initialValues,
    defaultValues: {
      title: "", destination: "", purpose: "",
      startDate: today, endDate: today,
      status: "planeada", budget: 0, currency: "AOA", notes: "",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        title: values.title,
        destination: values.destination,
        purpose: values.purpose?.trim() ? values.purpose.trim() : null,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        budget: Number(values.budget) || 0,
        currency: values.currency,
        notes: values.notes?.trim() ? values.notes.trim() : null,
        ...(editItem ? {} : { createdBy: user?.id ?? null }),
      };
      if (editItem) {
        await updateMission.mutateAsync({ id: editItem.id, payload });
      } else {
        await createMission.mutateAsync(payload);
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (m: MissionDto) => { setEditItem(m); setFormOpen(true); };

  const localeDate = (d: string) =>
    new Date(d).toLocaleDateString(i18nInstance.language === "en" ? "en-GB" : "pt-AO");

  const columns = useMemo<ColumnDef<MissionDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.title")} />,
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: "destination",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.destination")} />,
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.startDate")} />,
        cell: ({ row }) => localeDate(row.original.startDate),
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.endDate")} />,
        cell: ({ row }) => localeDate(row.original.endDate),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge className={STATUS_TONE[row.original.status]}>{t(`status.${row.original.status}`)}</Badge>
        ),
      },
      {
        accessorKey: "budget",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.budget")} />,
        cell: ({ row }) => money(row.original.budget, row.original.currency),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18nInstance.language],
  );

  const renderRowActions = (row: MissionDto) => {
    const actions: RowAction[] = [
      { label: t("actions.view"), icon: Eye, onClick: () => setDetailId(row.id) },
    ];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"), icon: Trash2, destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  const kpiCards = [
    { key: "total", icon: Plane, label: t("kpi.total"), value: stats?.total ?? 0, variant: "gradient-green-gold" as const },
    { key: "active", icon: Calendar, label: t("kpi.active"), value: stats?.emCurso ?? 0, variant: "glass" as const },
    { key: "pending", icon: Clock, label: t("kpi.pending"), value: stats?.pendentes ?? 0, variant: "glass" as const },
    { key: "budget", icon: Wallet, label: t("kpi.budget"), value: money(stats?.totalBudget ?? 0, "AOA"), variant: "glass" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Plane} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="missoes">
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

      {/* Criar / editar missão */}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.title")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.destination")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.destination")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.startDate")}</FormLabel>
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
                    <FormLabel>{t("form.labels.endDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {MISSION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.budget")}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.currency")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.purpose")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.placeholders.purpose")} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        title={t("dialog.deleteTitle")}
        description={t("dialog.deleteDescription")}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMission.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      {/* Detalhe / drill-down */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailId && <MissionDetail missionId={detailId} canEdit={canEdit} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================ Detalhe da missão ============================ */

function MissionDetail({ missionId, canEdit }: { missionId: string; canEdit: boolean }) {
  const { t, i18n: i18nInstance } = useTranslation("missoes");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: mission, isLoading } = useMission(missionId);
  const submit = useSubmitMission(missionId);
  const approve = useApproveMission(missionId);
  const reject = useRejectMission(missionId);

  const localeDate = (d: string) =>
    new Date(d).toLocaleDateString(i18nInstance.language === "en" ? "en-GB" : "pt-AO");

  const runTransition = async (
    fn: () => Promise<unknown>,
    successKey: string,
  ) => {
    try {
      await fn();
      toast({ title: t(successKey) });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };

  if (isLoading || !mission) {
    return <div className="p-8 text-center text-muted-foreground">…</div>;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-serif">
          <Plane className="h-5 w-5" />
          {mission.title}
          <Badge className={STATUS_TONE[mission.status]}>{t(`status.${mission.status}`)}</Badge>
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="resumo">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="resumo">{t("tabs.summary")}</TabsTrigger>
          <TabsTrigger value="participantes">{t("tabs.participants")}</TabsTrigger>
          <TabsTrigger value="guia">{t("tabs.guide")}</TabsTrigger>
          <TabsTrigger value="contas">{t("tabs.accountability")}</TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo" className="space-y-3 pt-4">
          <DetailField label={t("details.destination")} value={mission.destination} />
          <DetailField label={t("details.purpose")} value={mission.purpose || "—"} />
          <div className="grid grid-cols-2 gap-3">
            <DetailField label={t("details.startDate")} value={localeDate(mission.startDate)} />
            <DetailField label={t("details.endDate")} value={localeDate(mission.endDate)} />
            <DetailField label={t("details.budget")} value={money(mission.budget, mission.currency)} />
            <DetailField label={t("details.status")} value={t(`status.${mission.status}`)} />
          </div>
          {mission.notes && <DetailField label={t("details.notes")} value={mission.notes} />}

          {canEdit && (mission.status === "planeada" || mission.status === "submetida") && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {mission.status === "planeada" && (
                <Button onClick={() => runTransition(() => submit.mutateAsync({ actorId: user?.id ?? null }), "toast.submitSuccess")}>
                  <Send className="h-4 w-4 mr-1" /> {t("actions.submit")}
                </Button>
              )}
              {mission.status === "submetida" && (
                <>
                  <Button onClick={() => runTransition(() => approve.mutateAsync({ actorId: user?.id ?? null }), "toast.approveSuccess")}>
                    <Check className="h-4 w-4 mr-1" /> {t("actions.approve")}
                  </Button>
                  <Button variant="outline" onClick={() => runTransition(() => reject.mutateAsync({ actorId: user?.id ?? null }), "toast.rejectSuccess")}>
                    <X className="h-4 w-4 mr-1" /> {t("actions.reject")}
                  </Button>
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* PARTICIPANTES */}
        <TabsContent value="participantes" className="pt-4">
          <ParticipantsTab missionId={missionId} currency={mission.currency} canEdit={canEdit} />
        </TabsContent>

        {/* GUIA */}
        <TabsContent value="guia" className="pt-4">
          <GuideTab mission={mission} canEdit={canEdit} />
        </TabsContent>

        {/* CONTAS */}
        <TabsContent value="contas" className="pt-4">
          <AccountabilityTab mission={mission} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm">{value}</p>
    </div>
  );
}

/* --------------------------- Participantes --------------------------- */

function ParticipantsTab({ missionId, currency, canEdit }: {
  missionId: string; currency: string; canEdit: boolean;
}) {
  const { t } = useTranslation("missoes");
  const { toast } = useToast();
  const { data: participants = [] } = useParticipants(missionId);
  const { data: users = [] } = useUsersList({});
  const createParticipant = useCreateParticipant(missionId);
  const deleteParticipant = useDeleteParticipant(missionId);

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [perDiem, setPerDiem] = useState(0);

  const add = async () => {
    if (!userId) return toast({ title: t("toast.selectUser"), variant: "destructive" });
    try {
      await createParticipant.mutateAsync({ userId, role: role || t("participants.unknownUser"), perDiem });
      toast({ title: t("toast.participantAdded") });
      setUserId(""); setRole(""); setPerDiem(0);
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };
  const remove = async (id: string) => {
    await deleteParticipant.mutateAsync(id);
    toast({ title: t("toast.participantRemoved") });
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border bg-muted/30">
          <div className="col-span-5">
            <Label>{t("participants.user")}</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder={t("participants.selectUser")} /></SelectTrigger>
              <SelectContent>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4">
            <Label>{t("participants.role")}</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("participants.rolePlaceholder")} />
          </div>
          <div className="col-span-2">
            <Label>{t("participants.perDiem")}</Label>
            <Input type="number" value={perDiem} onChange={(e) => setPerDiem(Number(e.target.value))} />
          </div>
          <div className="col-span-1">
            <Button onClick={add} size="icon" aria-label={t("actions.add")}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("participants.name")}</TableHead>
            <TableHead>{t("participants.role")}</TableHead>
            <TableHead>{t("participants.perDiem")}</TableHead>
            {canEdit && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length === 0 && (
            <TableRow><TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-4">{t("participants.empty")}</TableCell></TableRow>
          )}
          {participants.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.fullName || t("participants.unknownUser")}</TableCell>
              <TableCell>{p.role}</TableCell>
              <TableCell>{money(p.perDiem, currency)}</TableCell>
              {canEdit && (
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label={t("actions.delete")}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* --------------------------- Guia de Marcha --------------------------- */

function GuideTab({ mission, canEdit }: { mission: MissionDto; canEdit: boolean }) {
  const { t } = useTranslation("missoes");
  const { toast } = useToast();
  const { data: guide } = useGuide(mission.id);
  const { data: participants = [] } = useParticipants(mission.id);
  const upsertGuide = useUpsertGuide(mission.id);

  const locked =
    mission.status !== "aprovada" && mission.status !== "em_curso" && mission.status !== "concluida";

  const [form, setForm] = useState<{
    guideNumber: string; issueDate: string; perDiem: number; transport: string; notes: string;
  } | null>(null);

  // Sincroniza o formulário com a guia carregada (ou valores por omissão).
  const effective = form ?? {
    guideNumber: guide?.guideNumber ?? `GM-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    issueDate: guide?.issueDate ?? new Date().toISOString().slice(0, 10),
    perDiem: guide?.perDiem ?? 0,
    transport: guide?.transport ?? "",
    notes: guide?.notes ?? "",
  };

  const patch = (p: Partial<typeof effective>) => setForm({ ...effective, ...p });

  const save = async () => {
    if (!effective.guideNumber) return toast({ title: t("toast.guideNumberRequired"), variant: "destructive" });
    try {
      await upsertGuide.mutateAsync({
        guideNumber: effective.guideNumber,
        issueDate: effective.issueDate,
        perDiem: Number(effective.perDiem) || 0,
        transport: effective.transport || null,
        notes: effective.notes || null,
      });
      toast({ title: t("toast.guideSaved") });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };

  const downloadPdf = async () => {
    await generateMissionGuidePdf({
      mission: {
        title: mission.title, destination: mission.destination, purpose: mission.purpose,
        start_date: mission.startDate, end_date: mission.endDate,
        budget: mission.budget, currency: mission.currency,
      },
      guide: {
        guide_number: effective.guideNumber,
        issue_date: effective.issueDate,
        per_diem: Number(effective.perDiem) || 0,
        transport: effective.transport || null,
        notes: effective.notes || null,
      },
      participants: participants.map((p) => ({
        full_name: p.fullName || "—", role: p.role, per_diem: Number(p.perDiem) || 0,
      })),
    });
  };

  if (locked) {
    return (
      <div className="p-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md shadow-amber-500/30">
          <AlertTriangle className="h-4 w-4" />
        </span>
        {t("guide.locked")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("guide.number")}</Label>
          <Input value={effective.guideNumber} onChange={(e) => patch({ guideNumber: e.target.value })} disabled={!canEdit} />
        </div>
        <div>
          <Label>{t("guide.issueDate")}</Label>
          <Input type="date" value={effective.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} disabled={!canEdit} />
        </div>
        <div>
          <Label>{t("guide.perDiem")}</Label>
          <Input type="number" value={effective.perDiem} onChange={(e) => patch({ perDiem: Number(e.target.value) })} disabled={!canEdit} />
        </div>
        <div>
          <Label>{t("guide.transport")}</Label>
          <Input value={effective.transport} onChange={(e) => patch({ transport: e.target.value })} disabled={!canEdit} placeholder={t("guide.transportPlaceholder")} />
        </div>
      </div>
      <div>
        <Label>{t("guide.notes")}</Label>
        <Textarea value={effective.notes} onChange={(e) => patch({ notes: e.target.value })} disabled={!canEdit} />
      </div>
      <div className="flex gap-2">
        {canEdit && (
          <Button onClick={save}><FileText className="h-4 w-4 mr-1" /> {t("actions.save")}</Button>
        )}
        <Button variant="outline" onClick={downloadPdf}>
          <Download className="h-4 w-4 mr-1" /> {t("actions.generatePdf")}
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- Prestação de Contas --------------------------- */

function AccountabilityTab({ mission, canEdit }: { mission: MissionDto; canEdit: boolean }) {
  const { t } = useTranslation("missoes");
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: expenses = [] } = useExpenses(mission.id);
  const { data: report } = useReport(mission.id);
  const createExpense = useCreateExpense(mission.id);
  const deleteExpense = useDeleteExpense(mission.id);
  const upsertReport = useUpsertReport(mission.id);
  const approveReport = useApproveReport(mission.id);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const budget = Number(mission.budget || 0);
  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const overspent = total > budget && budget > 0;

  const [exp, setExp] = useState<{
    category: ExpenseCategory; description: string; amount: number; expenseDate: string;
  }>({ category: "transporte", description: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) });

  const addExpense = async () => {
    if (!exp.amount || Number(exp.amount) <= 0) return toast({ title: t("toast.invalidAmount"), variant: "destructive" });
    try {
      await createExpense.mutateAsync({
        category: exp.category,
        description: exp.description || null,
        amount: Number(exp.amount),
        currency: mission.currency,
        expenseDate: exp.expenseDate,
      });
      toast({ title: t("toast.expenseAdded") });
      setExp({ category: "transporte", description: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };
  const removeExpense = async (id: string) => {
    await deleteExpense.mutateAsync(id);
    toast({ title: t("toast.expenseRemoved") });
  };

  const [rep, setRep] = useState<{ summary: string; outcomes: string } | null>(null);
  const effectiveRep = rep ?? { summary: report?.summary ?? "", outcomes: report?.outcomes ?? "" };
  const reportApproved = report?.status === "aprovado";

  const saveReport = async (submitting: boolean) => {
    try {
      await upsertReport.mutateAsync({
        reportDate: report?.reportDate ?? new Date().toISOString().slice(0, 10),
        summary: effectiveRep.summary || null,
        outcomes: effectiveRep.outcomes || null,
        status: submitting ? "submetido" : "rascunho",
        submittedBy: user?.id ?? null,
      });
      toast({ title: submitting ? t("toast.reportSubmitted") : t("toast.reportSaved") });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };
  const doApproveReport = async () => {
    try {
      await approveReport.mutateAsync({ actorId: user?.id ?? null });
      toast({ title: t("toast.reportApproved") });
    } catch (err) {
      toast({ title: t("toast.error"), description: (err as Error)?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs orçamentais */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">{t("accountability.budget")}</p>
          <p className="text-lg font-semibold">{money(budget, mission.currency)}</p>
        </div>
        <div className="p-4 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">{t("accountability.spent")}</p>
          <p className={`text-lg font-semibold ${overspent ? "text-destructive" : ""}`}>{money(total, mission.currency)}</p>
        </div>
        <div className="p-4 rounded-md border bg-muted/30">
          <p className="text-xs text-muted-foreground">{t("accountability.balance")}</p>
          <p className={`text-lg font-semibold ${overspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {money(budget - total, mission.currency)}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{t("accountability.execution")}</span>
          <span className={overspent ? "text-destructive font-semibold" : ""}>{pct}%{overspent && ` ${t("accountability.overspent")}`}</span>
        </div>
        <Progress value={pct} className={overspent ? "[&>div]:bg-destructive" : ""} />
      </div>

      {/* Despesas */}
      <div>
        <h4 className="font-semibold mb-2">{t("accountability.expenses")}</h4>
        {canEdit && (
          <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border bg-muted/30 mb-3">
            <div className="col-span-3">
              <Label>{t("accountability.category")}</Label>
              <Select value={exp.category} onValueChange={(v) => setExp({ ...exp, category: v as ExpenseCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`expenseCategory.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Label>{t("accountability.description")}</Label>
              <Input value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>{t("accountability.amount")}</Label>
              <Input type="number" step="0.01" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <Label>{t("accountability.date")}</Label>
              <Input type="date" value={exp.expenseDate} onChange={(e) => setExp({ ...exp, expenseDate: e.target.value })} />
            </div>
            <div className="col-span-1">
              <Button onClick={addExpense} size="icon" aria-label={t("actions.add")}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("accountability.date")}</TableHead>
              <TableHead>{t("accountability.category")}</TableHead>
              <TableHead>{t("accountability.description")}</TableHead>
              <TableHead>{t("accountability.amount")}</TableHead>
              {canEdit && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow><TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground py-4">{t("accountability.emptyExpenses")}</TableCell></TableRow>
            )}
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.expenseDate}</TableCell>
                <TableCell><Badge variant="outline">{t(`expenseCategory.${e.category}`)}</Badge></TableCell>
                <TableCell>{e.description || "—"}</TableCell>
                <TableCell>{money(e.amount, e.currency)}</TableCell>
                {canEdit && (
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => removeExpense(e.id)} aria-label={t("actions.delete")}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Relatório final */}
      <div>
        <h4 className="font-semibold mb-2">{t("accountability.report")}</h4>
        {reportApproved && (
          <div className="mb-2 p-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm">
            {t("accountability.reportApproved")}
          </div>
        )}
        {report?.status === "submetido" && (
          <div className="mb-2 p-2 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-sm">
            {t("accountability.reportSubmitted")}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <Label>{t("accountability.summary")}</Label>
            <Textarea rows={3} value={effectiveRep.summary} disabled={!canEdit || reportApproved}
              onChange={(e) => setRep({ ...effectiveRep, summary: e.target.value })} />
          </div>
          <div>
            <Label>{t("accountability.outcomes")}</Label>
            <Textarea rows={3} value={effectiveRep.outcomes} disabled={!canEdit || reportApproved}
              onChange={(e) => setRep({ ...effectiveRep, outcomes: e.target.value })} />
          </div>
          {canEdit && !reportApproved && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => saveReport(false)}>
                <Upload className="h-4 w-4 mr-1" /> {t("actions.saveDraft")}
              </Button>
              <Button onClick={() => saveReport(true)}>
                <Send className="h-4 w-4 mr-1" /> {t("actions.submitReport")}
              </Button>
              {report?.status === "submetido" && (
                <Button variant="secondary" onClick={doApproveReport}>
                  <Check className="h-4 w-4 mr-1" /> {t("actions.approveReport")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
