import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { FlaskConical, Eye, Pencil, Plus, Trash2, CheckCircle2, Layers, Users, X, ShieldCheck } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateLaboratorio,
  useDeleteLaboratorio,
  useLaboratoriosList,
  useUpdateLaboratorio,
} from "@/hooks/queries/useLaboratorios";
import {
  useAddLaboratorioTecnico,
  useLaboratorioTecnicos,
  useRemoveLaboratorioTecnico,
} from "@/hooks/queries/useLaboratorioTecnicos";
import { useUsersList } from "@/hooks/queries/useUsers";
import type { LaboratorioDto } from "@/types/dto/laboratorio";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptLaboratorios from "@/i18n/locales/pt/admin/laboratorios.json";
import enLaboratorios from "@/i18n/locales/en/admin/laboratorios.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav),
// seguindo o padrão de Departamentos.tsx.
if (!i18n.hasResourceBundle("pt", "admin-laboratorios"))
  i18n.addResourceBundle("pt", "admin-laboratorios", ptLaboratorios, true, true);
if (!i18n.hasResourceBundle("en", "admin-laboratorios"))
  i18n.addResourceBundle("en", "admin-laboratorios", enLaboratorios, true, true);

const LAB_TYPES = [
  "bacteriologia", "virologia", "parasitologia", "serologia",
  "biologia_molecular", "bromatologia", "patologia", "outro",
] as const;

const SLA_RULE_TYPES = [
  "horas_desde_entrada", "horas_desde_entrada_diferenciado", "dias_uteis", "gate_qualidade",
] as const;
const SLA_SEVERITIES = ["warning", "destructive"] as const;
const NO_SLA_RULE = "__none__";

function buildLaboratorioSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    type: z.string().refine((v) => (LAB_TYPES as readonly string[]).includes(v), t("validation.typeRequired")),
    description: z.string().trim().optional(),
    validadorCount: z.coerce.number().int().min(1).max(5),
    slaHoras: z.coerce.number().int().min(1).optional(),
    isActive: z.boolean(),
    slaRuleType: z.union([z.enum(SLA_RULE_TYPES), z.literal(NO_SLA_RULE)]).optional(),
    slaHorasNegativo: z.coerce.number().int().min(1).optional(),
    slaDias: z.coerce.number().int().min(1).optional(),
    slaActive: z.boolean(),
    slaSeverity: z.enum(SLA_SEVERITIES),
  });
}

type LaboratorioFormValues = z.infer<ReturnType<typeof buildLaboratorioSchema>>;

export default function Laboratorios() {
  const { t, i18n: i18nInstance } = useTranslation("admin-laboratorios");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("laboratorios");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<LaboratorioDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LaboratorioDto | null>(null);
  const [teamItem, setTeamItem] = useState<LaboratorioDto | null>(null);
  const [newTecnicoUserId, setNewTecnicoUserId] = useState("");
  const [newTecnicoFuncao, setNewTecnicoFuncao] = useState("");

  const { data, isLoading } = useLaboratoriosList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const createLaboratorio = useCreateLaboratorio();
  const updateLaboratorio = useUpdateLaboratorio();
  const deleteLaboratorio = useDeleteLaboratorio();

  // ---- Equipa de Técnicos + Validadores Nomeados (pedido do cliente:
  // "gestão de equipas" + "atribuição do validador final pelo Chefe de
  // Secção") — dialog próprio, mutações imediatas (não batched no form). ----
  const tecnicosQuery = useLaboratorioTecnicos(teamItem?.id);
  const addTecnico = useAddLaboratorioTecnico(teamItem?.id ?? "");
  const removeTecnico = useRemoveLaboratorioTecnico(teamItem?.id ?? "");
  const { data: allUsers } = useUsersList({});
  const team = tecnicosQuery.data ?? [];
  const teamUserIds = new Set(team.map((m) => m.userId));
  const candidateUsers = (allUsers ?? []).filter(
    (u) => (u.roles.includes("tecnico") || u.roles.includes("director-laboratorio")) && !teamUserIds.has(u.id),
  );
  const validadoresNomeados = teamItem?.validadoresNomeados ?? [];

  const toggleValidadorNomeado = async (userId: string) => {
    if (!teamItem) return;
    const next = validadoresNomeados.includes(userId)
      ? validadoresNomeados.filter((id) => id !== userId)
      : [...validadoresNomeados, userId];
    const updated = await updateLaboratorio.mutateAsync({ id: teamItem.id, payload: { validadoresNomeados: next } });
    setTeamItem(updated);
  };

  const laboratorioSchema = useMemo(() => buildLaboratorioSchema(t), [t]);

  const initialValues = useMemo<Partial<LaboratorioFormValues> | undefined>(
    () =>
      editItem
        ? {
            name: editItem.name,
            type: editItem.type ?? "",
            description: editItem.description ?? "",
            validadorCount: editItem.validadorCount,
            slaHoras: editItem.slaHoras ?? undefined,
            isActive: editItem.isActive,
            slaRuleType: editItem.slaRuleType ?? NO_SLA_RULE,
            slaHorasNegativo: editItem.slaHorasNegativo ?? undefined,
            slaDias: editItem.slaDias ?? undefined,
            slaActive: editItem.slaActive,
            slaSeverity: editItem.slaSeverity,
          }
        : undefined,
    [editItem],
  );

  const entityForm = useEntityForm({
    schema: laboratorioSchema,
    initialValues,
    defaultValues: {
      name: "", type: "", description: "", validadorCount: 2, isActive: true,
      slaRuleType: NO_SLA_RULE, slaActive: true, slaSeverity: "warning",
    },
    open: formOpen,
    onSubmit: async (values) => {
      const slaRuleType = values.slaRuleType === NO_SLA_RULE ? null : (values.slaRuleType ?? null);
      const payload = {
        name: values.name,
        type: values.type,
        description: values.description?.trim() ? values.description.trim() : null,
        validadorCount: values.validadorCount,
        slaHoras: values.slaHoras ?? null,
        isActive: values.isActive,
        slaRuleType,
        slaHorasNegativo: slaRuleType === "horas_desde_entrada_diferenciado" ? (values.slaHorasNegativo ?? null) : null,
        slaDias: slaRuleType === "dias_uteis" ? (values.slaDias ?? null) : null,
        slaActive: values.slaActive,
        slaSeverity: values.slaSeverity,
      };
      if (editItem) {
        await updateLaboratorio.mutateAsync({ id: editItem.id, payload });
      } else {
        await createLaboratorio.mutateAsync(payload);
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

  const openEdit = (l: LaboratorioDto) => {
    setEditItem(l);
    setFormOpen(true);
  };

  // KPIs — total vem do meta.total (dataset completo); activos/tipos derivam da
  // página carregada. Com pageSize 20 e o volume actual, a página cobre todo o
  // conjunto; para datasets grandes seria preferível um endpoint de resumo.
  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiActive = useMemo(() => rows.filter((l) => l.isActive).length, [rows]);
  const kpiTypes = useMemo(() => new Set(rows.map((l) => l.type)).size, [rows]);

  const columns = useMemo<ColumnDef<LaboratorioDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.code")} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <FlaskConical className="h-4 w-4 text-primary" />
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.type")} />,
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.type ? t(`types.${row.original.type}`, { defaultValue: row.original.type }) : "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "validadorCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.validadorCount")} />,
        cell: ({ row }) => <Badge variant="outline">{row.original.validadorCount}</Badge>,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "destructive"}>
            {row.original.isActive ? t("table.active") : t("table.inactive")}
          </Badge>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.description")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm line-clamp-1 max-w-xs">
            {row.original.description || t("table.emptyCell")}
          </span>
        ),
      },
    ],
    [t],
  );

  const renderRowActions = (row: LaboratorioDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => setViewItem(row) }];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({ label: t("actions.manageTeam"), icon: Users, onClick: () => setTeamItem(row) });
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
      <AdminPageHeader icon={FlaskConical} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="laboratorios">
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
            icon={FlaskConical}
            metric={kpiTotal}
            title={t("kpis.total")}
            caption={t("kpis.totalCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-teal"
            icon={CheckCircle2}
            metric={kpiActive}
            title={t("kpis.active")}
            caption={t("kpis.activeCaption")}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard
            variant="gradient-gold"
            icon={Layers}
            metric={kpiTypes}
            title={t("kpis.types")}
            caption={t("kpis.typesCaption")}
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
            {editItem && (
              <div>
                <FormLabel>{t("form.labels.code")}</FormLabel>
                <Input value={editItem.code} disabled />
              </div>
            )}
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
            <FormField
              control={form.control}
              name="type"
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
                      {LAB_TYPES.map((lt) => (
                        <SelectItem key={lt} value={lt}>
                          {t(`types.${lt}`)}
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
                name="validadorCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.validadorCount")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slaHoras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.slaHoras")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder={t("form.placeholders.slaHoras")} {...field} value={field.value ?? ""} />
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

            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">{t("form.sections.sla")}</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slaRuleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.slaRuleType")}</FormLabel>
                      <Select value={field.value ?? NO_SLA_RULE} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.placeholders.slaRuleType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_SLA_RULE}>{t("form.placeholders.slaRuleType")}</SelectItem>
                          {SLA_RULE_TYPES.map((rt) => (
                            <SelectItem key={rt} value={rt}>
                              {t(`form.slaRuleTypes.${rt}`)}
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
                  name="slaSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.slaSeverity")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SLA_SEVERITIES.map((sv) => (
                            <SelectItem key={sv} value={sv}>
                              {t(`form.slaSeverities.${sv}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {form.watch("slaRuleType") === "horas_desde_entrada_diferenciado" && (
                <FormField
                  control={form.control}
                  name="slaHorasNegativo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.slaHorasNegativo")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder={t("form.placeholders.slaHorasNegativo")} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch("slaRuleType") === "dias_uteis" && (
                <FormField
                  control={form.control}
                  name="slaDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.slaDias")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder={t("form.placeholders.slaDias")} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="slaActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">{t("form.labels.slaActive")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">{t("form.labels.isActive")}</FormLabel>
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
          await deleteLaboratorio.mutateAsync(deleteId);
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
                  <span className="text-muted-foreground">{t("details.code")}:</span>
                  <p className="font-medium font-mono">{viewItem.code}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.name")}:</span>
                  <p className="font-medium">{viewItem.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.type")}:</span>
                  <p className="font-medium">{viewItem.type ? t(`types.${viewItem.type}`, { defaultValue: viewItem.type }) : "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.status")}:</span>
                  <p>
                    <Badge variant={viewItem.isActive ? "default" : "destructive"}>
                      {viewItem.isActive ? t("table.active") : t("table.inactive")}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("details.validadorCount")}:</span>
                  <p className="font-medium">{viewItem.validadorCount}</p>
                </div>
                {viewItem.slaHoras && (
                  <div>
                    <span className="text-muted-foreground">{t("details.slaHoras")}:</span>
                    <p className="font-medium">{viewItem.slaHoras}h</p>
                  </div>
                )}
                {viewItem.slaRuleType && (
                  <div>
                    <span className="text-muted-foreground">{t("details.slaRuleType")}:</span>
                    <p className="font-medium">{t(`form.slaRuleTypes.${viewItem.slaRuleType}`)}</p>
                  </div>
                )}
                {viewItem.slaRuleType && (
                  <div>
                    <span className="text-muted-foreground">{t("details.slaActive")}:</span>
                    <p>
                      <Badge variant={viewItem.slaActive ? "default" : "outline"}>
                        {viewItem.slaActive ? t("table.active") : t("table.inactive")}
                      </Badge>
                    </p>
                  </div>
                )}
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

      <Dialog
        open={!!teamItem}
        onOpenChange={(o) => {
          if (!o) {
            setTeamItem(null);
            setNewTecnicoUserId("");
            setNewTecnicoFuncao("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{t("team.title", { name: teamItem?.name })}</DialogTitle>
          </DialogHeader>
          {teamItem && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">{t("team.membersTitle")}</p>
                {team.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("team.empty")}</p>
                )}
                <div className="space-y-2">
                  {team.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between gap-2 rounded-md border p-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.funcao || member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTecnico.mutate(member.userId)}
                        aria-label={t("team.remove")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={newTecnicoUserId} onValueChange={setNewTecnicoUserId}>
                    <SelectTrigger className="sm:flex-1">
                      <SelectValue placeholder={t("team.selectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="sm:w-40"
                    placeholder={t("team.funcaoPlaceholder")}
                    value={newTecnicoFuncao}
                    onChange={(e) => setNewTecnicoFuncao(e.target.value)}
                  />
                  <Button
                    disabled={!newTecnicoUserId || addTecnico.isPending}
                    onClick={async () => {
                      await addTecnico.mutateAsync({ userId: newTecnicoUserId, funcao: newTecnicoFuncao || null });
                      setNewTecnicoUserId("");
                      setNewTecnicoFuncao("");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> {t("team.add")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{t("team.validadoresTitle")}</p>
                </div>
                <p className="text-xs text-muted-foreground">{t("team.validadoresHelp")}</p>
                {team.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("team.validadoresEmpty")}</p>
                ) : (
                  <div className="space-y-2">
                    {team.map((member) => (
                      <div key={member.userId} className="flex items-center gap-2">
                        <Checkbox
                          id={`val-${member.userId}`}
                          checked={validadoresNomeados.includes(member.userId)}
                          onCheckedChange={() => toggleValidadorNomeado(member.userId)}
                        />
                        <label htmlFor={`val-${member.userId}`} className="cursor-pointer text-sm">
                          {member.fullName}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
