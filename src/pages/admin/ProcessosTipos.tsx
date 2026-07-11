import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import type { TFunction } from "i18next";
import {
  Workflow,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Layers,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { WriteGuard } from "@/components/WriteGuard";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateProcessType,
  useCreateProcessTypeStep,
  useDeleteProcessType,
  useDeleteProcessTypeStep,
  useProcessTypesList,
  useProcessTypeSteps,
  useReorderProcessTypeSteps,
  useUpdateProcessType,
  useUpdateProcessTypeStep,
} from "@/hooks/queries/useProcessTypes";
import { fadeIn } from "@/lib/motion";
import type { AppRole } from "@/lib/permissions";
import type { ProcessTypeDto, ProcessTypeStepDto } from "@/types/dto/processType";
import i18n from "@/i18n";
import ptProcessosTipos from "@/i18n/locales/pt/admin/processos-tipos.json";
import enProcessosTipos from "@/i18n/locales/en/admin/processos-tipos.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav),
// seguindo o padrão de Departamentos.tsx / Auditorias.tsx.
if (!i18n.hasResourceBundle("pt", "admin-processos-tipos"))
  i18n.addResourceBundle("pt", "admin-processos-tipos", ptProcessosTipos, true, true);
if (!i18n.hasResourceBundle("en", "admin-processos-tipos"))
  i18n.addResourceBundle("en", "admin-processos-tipos", enProcessosTipos, true, true);

const ROLES: AppRole[] = ["admin", "gestor", "tecnico", "diretor", "colaborador"];
/** Sentinela para "sem papel" — o <Select> shadcn não aceita valor "". */
const NONE = "none";

function buildTypeSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.nameShort")),
    description: z.string().trim().optional(),
    slaDays: z.string().optional(),
    isActive: z.boolean(),
  });
}
type TypeFormValues = z.infer<ReturnType<typeof buildTypeSchema>>;

function buildStepSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t("validation.stepNameShort")),
    defaultRole: z.string(),
    slaDays: z.string().optional(),
  });
}
type StepFormValues = z.infer<ReturnType<typeof buildStepSchema>>;

export default function ProcessosTipos() {
  const { t } = useTranslation("admin-processos-tipos");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("processos");
  const prefersReduced = useReducedMotion();

  const [formOpen, setFormOpen] = useState(false);
  const [editType, setEditType] = useState<ProcessTypeDto | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);

  const { data, isLoading } = useProcessTypesList({ perPage: 100 });
  const types = data?.data ?? [];

  const createType = useCreateProcessType();
  const updateType = useUpdateProcessType();
  const deleteType = useDeleteProcessType();

  const typeSchema = useMemo(() => buildTypeSchema(t), [t]);

  const initialValues = useMemo<Partial<TypeFormValues> | undefined>(
    () =>
      editType
        ? {
            name: editType.name,
            description: editType.description ?? "",
            slaDays: editType.slaDays?.toString() ?? "",
            isActive: editType.isActive,
          }
        : undefined,
    [editType],
  );

  const entityForm = useEntityForm({
    schema: typeSchema,
    initialValues,
    defaultValues: { name: "", description: "", slaDays: "", isActive: true },
    open: formOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        slaDays: values.slaDays ? Number(values.slaDays) : null,
        isActive: values.isActive,
      };
      if (editType) {
        await updateType.mutateAsync({ id: editType.id, payload });
      } else {
        await createType.mutateAsync(payload);
      }
    },
    successMessage: editType ? t("toast.typeUpdated") : t("toast.typeCreated"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const openCreateType = () => {
    setEditType(null);
    setFormOpen(true);
  };
  const openEditType = (pt: ProcessTypeDto) => {
    setEditType(pt);
    setFormOpen(true);
  };

  const kpiTotal = data?.meta.total ?? 0;
  const kpiActive = useMemo(() => types.filter((pt) => pt.isActive).length, [types]);
  const kpiInactive = useMemo(() => types.filter((pt) => !pt.isActive).length, [types]);

  const motionProps = prefersReduced
    ? {}
    : { initial: "hidden" as const, animate: "visible" as const, variants: fadeIn };

  return (
    <motion.div className="space-y-6" {...motionProps}>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/processos">
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </Link>
        </Button>
      </div>

      <AdminPageHeader icon={Workflow} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="processos">
          <Button onClick={openCreateType} className="gap-2">
            <Plus className="h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <AdminCard
          variant="gradient-green"
          icon={Layers}
          metric={kpiTotal}
          title={t("kpis.total")}
          caption={t("kpis.totalCaption")}
          stagger={1}
        />
        <AdminCard
          variant="gradient-teal"
          icon={CheckCircle2}
          metric={kpiActive}
          title={t("kpis.active")}
          caption={t("kpis.activeCaption")}
          stagger={2}
        />
        <AdminCard
          variant="gradient-gold"
          icon={XCircle}
          metric={kpiInactive}
          title={t("kpis.inactive")}
          caption={t("kpis.inactiveCaption")}
          stagger={3}
        />
      </div>

      <AdminCard loading={isLoading} isEmpty={!isLoading && types.length === 0} emptyMessage={t("list.empty")}>
        <Accordion type="multiple" className="space-y-2">
          {types.map((pt) => (
            <ProcessTypeRow
              key={pt.id}
              type={pt}
              canEdit={canEdit}
              onEditType={openEditType}
              onDeleteType={setDeleteTypeId}
            />
          ))}
        </Accordion>
      </AdminCard>

      {/* Dialog de criar/editar TIPO */}
      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editType ? t("typeForm.editTitle") : t("typeForm.createTitle")}
        form={entityForm}
        submitLabel={editType ? t("form.submitEdit") : t("form.submitCreate")}
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
                  <FormLabel>{t("typeForm.labels.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("typeForm.placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("typeForm.labels.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t("typeForm.placeholders.description")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="slaDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("typeForm.labels.slaDays")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-8">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer !mt-0">{t("typeForm.labels.isActive")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteTypeId}
        onOpenChange={(o) => !o && setDeleteTypeId(null)}
        onConfirm={async () => {
          if (!deleteTypeId) return;
          await deleteType.mutateAsync(deleteTypeId);
          setDeleteTypeId(null);
        }}
        title={t("deleteType.title")}
        description={t("deleteType.description")}
      />
    </motion.div>
  );
}

interface ProcessTypeRowProps {
  type: ProcessTypeDto;
  canEdit: boolean;
  onEditType: (t: ProcessTypeDto) => void;
  onDeleteType: (id: string) => void;
}

/**
 * Item do Accordion para um tipo de processo. Aloja a gestão das suas
 * etapas-padrão (sub-recurso), com hooks react-query próprios por `type.id`.
 * A lista de etapas é carregada mesmo com o item colapsado (react-query dispara
 * a query no mount), pelo que a contagem/os badges no cabeçalho já aparecem.
 */
function ProcessTypeRow({ type, canEdit, onEditType, onDeleteType }: ProcessTypeRowProps) {
  const { t } = useTranslation("admin-processos-tipos");
  const { data: steps, isLoading } = useProcessTypeSteps(type.id);

  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [editStep, setEditStep] = useState<ProcessTypeStepDto | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);

  const createStep = useCreateProcessTypeStep(type.id);
  const updateStep = useUpdateProcessTypeStep(type.id);
  const deleteStep = useDeleteProcessTypeStep(type.id);
  const reorderSteps = useReorderProcessTypeSteps(type.id);

  const list = useMemo(
    () => (steps ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    [steps],
  );

  const stepSchema = useMemo(() => buildStepSchema(t), [t]);
  const stepInitial = useMemo<Partial<StepFormValues> | undefined>(
    () =>
      editStep
        ? {
            name: editStep.name,
            defaultRole: editStep.defaultRole ?? NONE,
            slaDays: editStep.slaDays?.toString() ?? "",
          }
        : undefined,
    [editStep],
  );

  const stepForm = useEntityForm({
    schema: stepSchema,
    initialValues: stepInitial,
    defaultValues: { name: "", defaultRole: NONE, slaDays: "" },
    open: stepFormOpen,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        defaultRole: values.defaultRole === NONE ? null : (values.defaultRole as AppRole),
        slaDays: values.slaDays ? Number(values.slaDays) : null,
      };
      if (editStep) {
        await updateStep.mutateAsync({ stepId: editStep.id, payload });
      } else {
        await createStep.mutateAsync(payload);
      }
    },
    successMessage: editStep ? t("toast.stepUpdated") : t("toast.stepCreated"),
    errorMessage: t("toast.error"),
    onSuccess: () => setStepFormOpen(false),
  });

  const openCreateStep = () => {
    setEditStep(null);
    setStepFormOpen(true);
  };
  const openEditStep = (s: ProcessTypeStepDto) => {
    setEditStep(s);
    setStepFormOpen(true);
  };

  const moveStep = async (step: ProcessTypeStepDto, dir: -1 | 1) => {
    const idx = list.findIndex((s) => s.id === step.id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const reordered = list.slice();
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    await reorderSteps.mutateAsync(reordered.map((s) => s.id));
  };

  const roleLabel = (role: AppRole) => t(`roles.${role}`);

  return (
    <AccordionItem value={type.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="font-semibold">{type.name}</span>
          {!type.isActive && <Badge variant="outline">{t("list.inactive")}</Badge>}
          {type.slaDays != null && (
            <Badge variant="secondary">{t("list.sla", { days: type.slaDays })}</Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {t("list.stepsCount", { count: list.length })}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3">
        {type.description && <p className="text-sm text-muted-foreground">{type.description}</p>}

        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => onEditType(type)} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> {t("actions.editType")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive"
                onClick={() => onDeleteType(type.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("actions.delete")}
              </Button>
              <Button size="sm" className="gap-1 ml-auto" onClick={openCreateStep}>
                <Plus className="h-3.5 w-3.5" /> {t("actions.addStep")}
              </Button>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t("list.noSteps")}</p>
        ) : (
          <ol className="space-y-2">
            {list.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2 pl-3">
                <Badge variant="outline" className="font-mono">
                  {s.orderIndex}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.defaultRole ? t("list.stepRole", { role: roleLabel(s.defaultRole) }) : t("list.stepNoRole")}
                    {s.slaDays ? t("list.stepSla", { days: s.slaDays }) : ""}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={i === 0 || reorderSteps.isPending}
                      onClick={() => moveStep(s, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={i === list.length - 1 || reorderSteps.isPending}
                      onClick={() => moveStep(s, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditStep(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteStepId(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </AccordionContent>

      {/* Dialog de criar/editar ETAPA */}
      <EntityFormDialog
        open={stepFormOpen}
        onOpenChange={setStepFormOpen}
        title={editStep ? t("stepForm.editTitle") : t("stepForm.createTitle")}
        form={stepForm}
        submitLabel={editStep ? t("form.submitEdit") : t("form.submitCreate")}
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
                  <FormLabel>{t("stepForm.labels.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("stepForm.placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("stepForm.labels.role")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>{t("stepForm.noRole")}</SelectItem>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`roles.${r}`)}
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
                name="slaDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("stepForm.labels.slaDays")}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteStepId}
        onOpenChange={(o) => !o && setDeleteStepId(null)}
        onConfirm={async () => {
          if (!deleteStepId) return;
          await deleteStep.mutateAsync(deleteStepId);
          setDeleteStepId(null);
        }}
        title={t("deleteStep.title")}
        description={t("deleteStep.description")}
      />
    </AccordionItem>
  );
}
