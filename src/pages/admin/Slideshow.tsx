import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { TFunction } from "i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ExternalLink, Images, Pencil, Plus, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable } from "@/components/data-table";
import { EntityFormDialog } from "@/components/EntityFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEntityForm } from "@/hooks/useEntityForm";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateHeroSlide,
  useDeleteHeroSlide,
  useHeroSlidesAdminList,
  useUpdateHeroSlide,
} from "@/hooks/queries/useHeroSlides";
import type { HeroSlideDto } from "@/types/dto/heroSlide";
import i18n from "@/i18n";
import ptSlideshow from "@/i18n/locales/pt/admin/slideshow.json";
import enSlideshow from "@/i18n/locales/en/admin/slideshow.json";

// Namespace "slideshow" não faz parte do bundle central (src/i18n/index.ts) —
// registamo-lo aqui em runtime, seguindo exactamente o padrão adoptado em
// Departamentos.tsx (primeiro módulo admin com i18n).
if (!i18n.hasResourceBundle("pt", "slideshow"))
  i18n.addResourceBundle("pt", "slideshow", ptSlideshow, true, true);
if (!i18n.hasResourceBundle("en", "slideshow"))
  i18n.addResourceBundle("en", "slideshow", enSlideshow, true, true);

const ALLOWED_HOSTS = ["iiv.gov.ao", "www.iiv.gov.ao"];

/**
 * Normaliza e valida o link do CTA — réplica exacta da lógica de segurança que
 * já existia na versão Supabase desta página (mesmas regras, agora com
 * mensagens traduzidas via `t()`):
 * - Aceita rotas internas relativas (devem começar por "/", "#" ou "?").
 * - Aceita URLs absolutas https:// apenas para domínios autorizados.
 * - Rejeita javascript:, data:, file:, protocolos perigosos e domínios externos.
 * Devolve a string normalizada ou lança Error com mensagem amigável.
 */
function normalizeCtaLink(raw: string, t: TFunction): string {
  const v = (raw ?? "").trim();
  if (!v) throw new Error(t("validation.ctaLinkRequired"));

  if (/^\s*(javascript|data|vbscript|file):/i.test(v)) {
    throw new Error(t("validation.ctaLinkProtocol"));
  }

  if (v.startsWith("#") || v.startsWith("?")) return v;

  if (v.startsWith("/")) {
    if (v.startsWith("//")) throw new Error(t("validation.ctaLinkRelative"));
    return v;
  }

  try {
    const url = new URL(v);
    if (url.protocol !== "https:") throw new Error(t("validation.ctaLinkHttpsOnly"));
    const host = url.hostname.toLowerCase();
    const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) {
      throw new Error(t("validation.ctaLinkDomain", { hosts: ALLOWED_HOSTS.join(", ") }));
    }
    return url.toString();
  } catch (e) {
    if (e instanceof Error && e.message) throw e;
    throw new Error(t("validation.ctaLinkFallback"));
  }
}

function buildSlideSchema(t: TFunction) {
  return z.object({
    kicker: z.string().trim().min(2, t("validation.kickerShort")),
    title: z.string().trim().min(2, t("validation.titleShort")),
    subtitle: z.string().trim().min(2, t("validation.subtitleShort")),
    ctaLabel: z.string().trim().min(1, t("validation.ctaLabelRequired")),
    ctaLink: z
      .string()
      .trim()
      .min(1, t("validation.ctaLinkRequired"))
      .superRefine((val, ctx) => {
        try {
          normalizeCtaLink(val, t);
        } catch (err) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: err instanceof Error ? err.message : t("validation.ctaLinkFallback"),
          });
        }
      }),
    sortOrder: z.coerce.number({ invalid_type_error: t("validation.sortOrderInvalid") }).int(
      t("validation.sortOrderInvalid"),
    ),
    published: z.boolean(),
  });
}

type SlideFormValues = z.infer<ReturnType<typeof buildSlideSchema>>;

export default function Slideshow() {
  const { t } = useTranslation("slideshow");
  const { canWrite } = useUserRole();
  const canEdit = canWrite("slideshow");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<HeroSlideDto | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useHeroSlidesAdminList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: search || undefined,
  });

  const rows = data?.data ?? [];

  const createHeroSlide = useCreateHeroSlide();
  const updateHeroSlide = useUpdateHeroSlide();
  const deleteHeroSlide = useDeleteHeroSlide();

  const slideSchema = useMemo(() => buildSlideSchema(t), [t]);

  const initialValues = useMemo<Partial<SlideFormValues> | undefined>(
    () =>
      editItem
        ? {
            kicker: editItem.kicker,
            title: editItem.title,
            subtitle: editItem.subtitle,
            ctaLabel: editItem.ctaLabel,
            ctaLink: editItem.ctaLink,
            sortOrder: editItem.sortOrder,
            published: editItem.published,
          }
        : undefined,
    [editItem],
  );

  // Sugestão de ordem para um slide novo: a seguir à maior `sortOrder` já
  // carregada na página actual (réplica do `max + 1` que a versão Supabase
  // calculava no servidor).
  const suggestedNextOrder = useMemo(
    () => (rows.length ? Math.max(...rows.map((s) => s.sortOrder)) + 1 : 1),
    [rows],
  );

  const entityForm = useEntityForm({
    schema: slideSchema,
    initialValues,
    defaultValues: {
      kicker: "",
      title: "",
      subtitle: "",
      ctaLabel: "Saiba mais",
      ctaLink: "/sobre",
      sortOrder: suggestedNextOrder,
      published: true,
    },
    open: formOpen,
    onSubmit: async (values) => {
      const ctaLink = normalizeCtaLink(values.ctaLink, t);
      // TODO Fase 4: upload real para Laravel Storage. Em mock não há storage
      // real: sem ficheiro seleccionado mantém-se a `imageUrl` actual (ou
      // `null` na criação); com ficheiro seleccionado assume-se `null` para
      // cair no fallback de imagens locais que `HeroSlideshow.tsx` já usa.
      const imageUrl = file ? null : (editItem?.imageUrl ?? null);
      const payload: Partial<HeroSlideDto> = {
        kicker: values.kicker,
        title: values.title,
        subtitle: values.subtitle,
        ctaLabel: values.ctaLabel,
        ctaLink,
        sortOrder: values.sortOrder,
        published: values.published,
        imageUrl,
      };
      if (editItem) {
        await updateHeroSlide.mutateAsync({ id: editItem.id, payload });
      } else {
        await createHeroSlide.mutateAsync(payload);
      }
    },
    successMessage: editItem ? t("toast.updateSuccess") : t("toast.createSuccess"),
    errorMessage: t("toast.error"),
    onSuccess: () => {
      setFormOpen(false);
      setFile(null);
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setFile(null);
    setFormOpen(true);
  };

  const openEdit = (row: HeroSlideDto) => {
    setEditItem(row);
    setFile(null);
    setFormOpen(true);
  };

  // Troca a `sortOrder` entre dois slides ADJACENTES na página actual (a
  // versão Supabase original fazia a mesma troca a dois, sobre a lista
  // completa carregada no cliente). Com paginação server-side, isto só move
  // dentro da página visível — comportamento aceitável para um conjunto
  // tipicamente pequeno de slides (uma página cobre o total habitual).
  const moveSlide = async (slide: HeroSlideDto, direction: -1 | 1) => {
    const idx = rows.findIndex((s) => s.id === slide.id);
    const swap = rows[idx + direction];
    if (idx === -1 || !swap) return;
    await Promise.all([
      updateHeroSlide.mutateAsync({ id: slide.id, payload: { sortOrder: swap.sortOrder } }),
      updateHeroSlide.mutateAsync({ id: swap.id, payload: { sortOrder: slide.sortOrder } }),
    ]);
  };

  const columns = useMemo<ColumnDef<HeroSlideDto>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: t("table.image"),
        enableSorting: false,
        cell: ({ row }) =>
          row.original.imageUrl ? (
            <img src={row.original.imageUrl} alt="" className="h-10 w-16 rounded object-cover" />
          ) : (
            <div className="h-10 w-16 rounded bg-muted" />
          ),
      },
      {
        accessorKey: "title",
        header: t("table.content"),
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="text-xs text-muted-foreground">{row.original.kicker}</div>
            <div className="font-medium">{row.original.title}</div>
          </div>
        ),
      },
      {
        accessorKey: "sortOrder",
        header: t("table.order"),
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.sortOrder}</span>,
      },
      {
        id: "status",
        header: t("table.status"),
        enableSorting: false,
        cell: ({ row }) => {
          const slide = row.original;
          const badge = (
            <Badge variant={slide.published ? "default" : "secondary"}>
              {slide.published ? t("badge.published") : t("badge.draft")}
            </Badge>
          );
          if (!canEdit) return badge;
          return (
            <button
              type="button"
              className="cursor-pointer"
              onClick={() =>
                updateHeroSlide.mutate({ id: slide.id, payload: { published: !slide.published } })
              }
            >
              {badge}
            </button>
          );
        },
      },
    ],
    [t, canEdit, updateHeroSlide],
  );

  const renderRowActions = (row: HeroSlideDto) => {
    const actions: RowAction[] = [];
    if (canEdit) {
      const idx = rows.findIndex((s) => s.id === row.id);
      actions.push({
        label: t("actions.moveUp"),
        icon: ArrowUp,
        disabled: idx <= 0,
        onClick: () => moveSlide(row, -1),
      });
      actions.push({
        label: t("actions.moveDown"),
        icon: ArrowDown,
        disabled: idx === -1 || idx >= rows.length - 1,
        onClick: () => moveSlide(row, 1),
      });
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
      <AdminPageHeader icon={Images} title={t("page.title")} description={t("page.description")}>
        <WriteGuard module="slideshow">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t("actions.new")}
          </Button>
        </WriteGuard>
      </AdminPageHeader>

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
              name="kicker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.kicker")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.placeholders.kicker")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.subtitle")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder={t("form.placeholders.subtitle")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ctaLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.ctaLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.ctaLabel")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ctaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.labels.ctaLink")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.placeholders.ctaLink")} {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t("form.ctaLinkHint", { hosts: ALLOWED_HOSTS.join(", ") })}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.labels.sortOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">{t("form.labels.published")}</FormLabel>
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>{t("form.labels.image")}</Label>
              {/* TODO Fase 4: upload real para Laravel Storage — por agora o
                  ficheiro escolhido não é enviado a lado nenhum (ver onSubmit). */}
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">{t("form.imageHint")}</p>
              {editItem?.imageUrl && !file && (
                <a
                  href={editItem.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> {t("form.viewCurrentImage")}
                </a>
              )}
            </div>
          </>
        )}
      </EntityFormDialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteHeroSlide.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
