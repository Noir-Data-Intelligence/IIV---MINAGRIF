import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList, Eye, Plus, Trash2, FlaskConical, Beaker, Hourglass } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useRequisicoesList, useCreateRequisicao } from "@/hooks/queries/useRequisicoes";
import { useAmostrasList } from "@/hooks/queries/useAmostras";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import type { RequisicaoDto } from "@/types/dto/requisicao";
import { formatDate } from "@/lib/format";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import i18n from "@/i18n";
import ptRequisicoes from "@/i18n/locales/pt/admin/requisicoes.json";
import enRequisicoes from "@/i18n/locales/en/admin/requisicoes.json";

if (!i18n.hasResourceBundle("pt", "admin-requisicoes"))
  i18n.addResourceBundle("pt", "admin-requisicoes", ptRequisicoes, true, true);
if (!i18n.hasResourceBundle("en", "admin-requisicoes"))
  i18n.addResourceBundle("en", "admin-requisicoes", enRequisicoes, true, true);

const TIPO_AMOSTRA_VALUES = [
  "sangue", "soro", "fezes", "urina", "zaragatoa", "tecido", "leite", "agua", "outro",
] as const;

const amostraSchema = z.object({
  tipoAmostra: z.string().refine((v) => (TIPO_AMOSTRA_VALUES as readonly string[]).includes(v), "Seleccione o tipo de amostra"),
  origemMatriz: z.string().trim().optional(),
  pontoColheita: z.string().trim().optional(),
  colhidaPor: z.string().trim().optional(),
  latitude: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) >= -90 && Number(v) <= 90), "Latitude inválida (-90 a 90)"),
  longitude: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) >= -180 && Number(v) <= 180), "Longitude inválida (-180 a 180)"),
});

const requisicaoSchema = z.object({
  laboratorioId: z.string().min(1, "Seleccione o laboratório/área"),
  tipoSujeito: z.enum(["animal", "humano"]),
  clienteNome: z.string().trim().min(2, "Nome demasiado curto"),
  clienteContacto: z.string().trim().optional(),
  veterinarioResponsavel: z.string().trim().optional(),
  consentimento: z.boolean().refine((v) => v, "O consentimento do cliente é obrigatório"),
  assinaturaCliente: z.string().trim().min(1, "Assinatura do cliente obrigatória"),
  amostras: z.array(amostraSchema).min(1, "Adicione pelo menos uma amostra ao lote"),
});

type RequisicaoFormValues = z.infer<typeof requisicaoSchema>;

/** Extraído para componente próprio: `useFieldArray` tem de ser chamado no topo de um componente/hook, nunca dentro de um render-prop. */
function AmostrasFieldArray({ form, t }: { form: UseFormReturn<RequisicaoFormValues>; t: (key: string) => string }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "amostras" });

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" /> {t("form.amostras.title")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ tipoAmostra: "", origemMatriz: "", pontoColheita: "", colhidaPor: "", latitude: "", longitude: "" })
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> {t("form.amostras.add")}
        </Button>
      </div>

      {fields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3 relative">
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
          <FormField
            control={form.control}
            name={`amostras.${index}.tipoAmostra`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.tipoAmostra")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.amostras.tipoAmostraPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_AMOSTRA_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`tipoAmostra.${v}`)}
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
            name={`amostras.${index}.origemMatriz`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.origemMatriz")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`amostras.${index}.pontoColheita`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.pontoColheita")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`amostras.${index}.colhidaPor`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.colhidaPor")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`amostras.${index}.latitude`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.latitude")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("form.amostras.latitudePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`amostras.${index}.longitude`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t("form.amostras.longitude")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("form.amostras.longitudePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

const DEFAULT_VALUES: RequisicaoFormValues = {
  laboratorioId: "",
  tipoSujeito: "animal",
  clienteNome: "",
  clienteContacto: "",
  veterinarioResponsavel: "",
  consentimento: false,
  assinaturaCliente: "",
  amostras: [{ tipoAmostra: "", origemMatriz: "", pontoColheita: "", colhidaPor: "", latitude: "", longitude: "" }],
};

export default function Requisicoes() {
  const { t, i18n: i18nInstance } = useTranslation("admin-requisicoes");
  const navigate = useNavigate();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("analises");
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useRequisicoesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });
  const laboratoriosQuery = useLaboratoriosList({ page: 1, perPage: 100 });
  const pendentesQuery = useAmostrasList({ page: 1, perPage: 1, status: "recebida" });

  const createRequisicao = useCreateRequisicao();

  const laboratorios = laboratoriosQuery.data?.data ?? [];
  const labNameMap = useMemo(() => {
    const map = new Map<string, string>();
    laboratorios.forEach((l) => map.set(l.id, `${l.code} — ${l.name}`));
    return map;
  }, [laboratorios]);

  const entityForm = useEntityForm({
    schema: requisicaoSchema,
    defaultValues: DEFAULT_VALUES,
    open: formOpen,
    onSubmit: async (values) => {
      await createRequisicao.mutateAsync({
        laboratorioId: values.laboratorioId,
        tipoSujeito: values.tipoSujeito,
        clienteNome: values.clienteNome,
        clienteContacto: values.clienteContacto?.trim() || null,
        veterinarioResponsavel: values.veterinarioResponsavel?.trim() || null,
        consentimento: values.consentimento,
        assinaturaCliente: values.assinaturaCliente,
        amostras: values.amostras.map((a) => ({
          tipoAmostra: a.tipoAmostra,
          origemMatriz: a.origemMatriz?.trim() || null,
          pontoColheita: a.pontoColheita?.trim() || null,
          colhidaPor: a.colhidaPor?.trim() || null,
          latitude: a.latitude?.trim() ? Number(a.latitude.trim()) : null,
          longitude: a.longitude?.trim() ? Number(a.longitude.trim()) : null,
        })),
      });
    },
    successMessage: t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => setFormOpen(false),
  });

  const rows = data?.data ?? [];
  const kpiTotal = data?.meta.total ?? 0;
  const kpiPendentes = pendentesQuery.data?.meta.total ?? 0;
  const kpiAmostrasLote = useMemo(
    () => rows.reduce((sum, r) => sum + (r.amostras?.length ?? 0), 0),
    [rows],
  );

  const columns = useMemo<ColumnDef<RequisicaoDto>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.numero")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium font-mono text-sm">
            <ClipboardList className="h-4 w-4 text-primary" />
            {row.original.numero}
          </div>
        ),
      },
      {
        accessorKey: "clienteNome",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.cliente")} />,
      },
      {
        id: "laboratorio",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.laboratorio")} />,
        cell: ({ row }) => labNameMap.get(row.original.laboratorioId) ?? t("table.emptyCell"),
      },
      {
        id: "amostras",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.amostras")} />,
        cell: ({ row }) => <Badge variant="secondary">{row.original.amostras?.length ?? 0}</Badge>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.data")} />,
        cell: ({ row }) => formatDate(row.original.createdAt, i18nInstance.language === "en" ? "en" : "pt"),
      },
    ],
    [t, labNameMap, i18nInstance.language],
  );

  const renderRowActions = (row: RequisicaoDto) => {
    const actions: RowAction[] = [];
    return (
      <RowActions
        primary={{ label: t("actions.view"), icon: Eye, onClick: () => navigate(`/admin/requisicoes/${row.id}`) }}
        actions={actions}
      />
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={ClipboardList} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="analises">
          <Button onClick={() => setFormOpen(true)}>
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
          <AdminCard variant="gradient-green" icon={ClipboardList} metric={kpiTotal} title={t("kpis.total")} caption={t("kpis.totalCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="gradient-gold" icon={Hourglass} metric={kpiPendentes} title={t("kpis.pendentes")} caption={t("kpis.pendentesCaption")} />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
          <AdminCard variant="gradient-teal" icon={Beaker} metric={kpiAmostrasLote} title={t("kpis.amostras")} caption={t("kpis.amostrasCaption")} />
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
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={t("dialog.createTitle")}
        form={entityForm}
        submitLabel={t("form.submitCreate")}
        submittingLabel={t("form.submitting")}
        cancelLabel={t("form.cancel")}
        className="max-w-3xl"
      >
        {(form) => {
          return (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="laboratorioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.laboratorio")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.placeholders.laboratorio")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {laboratorios.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.code} — {l.name}
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
                  name="tipoSujeito"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.tipoSujeito")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="animal">{t("form.tipoSujeito.animal")}</SelectItem>
                          <SelectItem value="humano">{t("form.tipoSujeito.humano")}</SelectItem>
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
                  name="clienteNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.clienteNome")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("form.placeholders.clienteNome")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clienteContacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.labels.clienteContacto")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("form.placeholders.clienteContacto")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="veterinarioResponsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.veterinarioResponsavel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.veterinarioResponsavel")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AmostrasFieldArray form={form} t={t} />

              <FormField
                control={form.control}
                name="consentimento"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">{t("form.labels.consentimento")}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assinaturaCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.assinaturaCliente")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.assinaturaCliente")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          );
        }}
      </EntityFormDialog>
    </div>
  );
}
