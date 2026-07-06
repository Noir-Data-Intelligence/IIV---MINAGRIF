import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pencil, Shield, Trash2, UserPlus, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { WriteGuard } from "@/components/WriteGuard";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useUsersList, useUpdateUser, useDeleteUser } from "@/hooks/queries/useUsers";
import { useDepartamentosList } from "@/hooks/queries/useDepartamentos";
import type { UserDto } from "@/types/dto/user";
import { ALL_ROLES, ROLE_LABEL, type AppRole } from "@/lib/permissions";
import i18n from "@/i18n";
import ptUtilizadores from "@/i18n/locales/pt/admin/utilizadores.json";
import enUtilizadores from "@/i18n/locales/en/admin/utilizadores.json";

// Namespace "utilizadores" registado em runtime, mesmo padrão de Departamentos.tsx
// (src/i18n/index.ts só regista "common"/"nav" — ver comentário lá).
if (!i18n.hasResourceBundle("pt", "utilizadores"))
  i18n.addResourceBundle("pt", "utilizadores", ptUtilizadores, true, true);
if (!i18n.hasResourceBundle("en", "utilizadores"))
  i18n.addResourceBundle("en", "utilizadores", enUtilizadores, true, true);

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}

export default function Utilizadores() {
  const { t, i18n: i18nInstance } = useTranslation("utilizadores");
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const canEdit = canWrite("utilizadores");

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  // Reseta para a primeira página sempre que um filtro muda, para não ficar
  // "preso" numa página que deixou de existir no conjunto filtrado.
  const resetToFirstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }));

  const { data: users = [], isLoading } = useUsersList({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    departmentId: deptFilter !== "all" ? deptFilter : undefined,
  });

  // Departamentos: usados no filtro, na coluna "Departamentos" (lookup de nome)
  // e nas checkboxes do dialog de edição. perPage alto para trazer "todos" —
  // o mock não pagina de facto um conjunto tão pequeno.
  const { data: departamentosPage } = useDepartamentosList({ page: 1, perPage: 100 });
  const departments = useMemo(() => departamentosPage?.data ?? [], [departamentosPage]);
  const deptNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // `listUsers` devolve um array simples (sem paginação de servidor — ver
  // mocks/handlers/users.ts), pelo que a paginação é feita aqui, client-side,
  // sobre o resultado já filtrado pela API mock (search/role/departmentId).
  // Substitui o antigo `useClientPagination`, adaptado ao formato
  // `pagination: { pageIndex, pageSize }` consumido por <DataTable>.
  const pageCount = Math.max(1, Math.ceil(users.length / pagination.pageSize));
  const pageItems = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return users.slice(start, start + pagination.pageSize);
  }, [users, pagination.pageIndex, pagination.pageSize]);

  // Edit dialog state
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftRoles, setDraftRoles] = useState<Set<AppRole>>(new Set());
  const [draftDepts, setDraftDepts] = useState<Set<string>>(new Set());

  // Delete confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);

  function openEdit(u: UserDto) {
    setEditing(u);
    setDraftName(u.fullName ?? "");
    setDraftPhone(u.phone ?? "");
    setDraftRoles(new Set(u.roles));
    setDraftDepts(new Set(u.departmentIds));
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateUser.mutateAsync({
        id: editing.id,
        payload: {
          fullName: draftName.trim(),
          phone: draftPhone.trim() || null,
          roles: [...draftRoles],
          departmentIds: [...draftDepts],
        },
      });
      toast({ title: t("toast.updateSuccess"), description: t("toast.updateSuccessDescription") });
      setEditing(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: t("toast.error"), description: message, variant: "destructive" });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast({ title: t("toast.deleteSuccess"), description: t("toast.deleteSuccessDescription") });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast({ title: t("toast.error"), description: message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.name")} />,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.fullName || "—"}</div>
            <div className="text-sm text-muted-foreground">{row.original.phone || t("table.emptyCell")}</div>
          </div>
        ),
      },
      {
        id: "roles",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.roles")} />,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length === 0 && (
              <span className="text-xs text-muted-foreground">{t("table.noRoles")}</span>
            )}
            {row.original.roles.map((r) => (
              <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABEL[r]}</Badge>
            ))}
          </div>
        ),
      },
      {
        id: "departments",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.departments")} />,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.departmentIds.length === 0 && (
              <span className="text-xs text-muted-foreground">{t("table.emptyCell")}</span>
            )}
            {row.original.departmentIds.map((id) => (
              <Badge key={id} variant="outline" className="text-xs">{deptNameById.get(id) ?? "—"}</Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.createdAt")} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.original.createdAt).toLocaleDateString(
              i18nInstance.language === "en" ? "en-GB" : "pt-AO",
            )}
          </span>
        ),
      },
    ],
    [t, deptNameById, i18nInstance.language],
  );

  const renderRowActions = (row: UserDto) => {
    const actions: RowAction[] = [];
    if (canEdit) {
      actions.push({ label: t("actions.edit"), icon: Pencil, onClick: () => openEdit(row) });
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteTarget(row),
      });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Users} title={t("page.title")} description={t("page.description")}>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/rbac"><Shield className="h-4 w-4 mr-2" />{t("actions.permissionsMatrix")}</Link>
        </Button>
      </AdminPageHeader>

      <div className="flex flex-col md:flex-row gap-3">
        <Select
          value={roleFilter}
          onValueChange={(v) => { setRoleFilter(v); resetToFirstPage(); }}
        >
          <SelectTrigger className="w-full md:w-52"><SelectValue placeholder={t("filters.rolePlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={deptFilter}
          onValueChange={(v) => { setDeptFilter(v); resetToFirstPage(); }}
        >
          <SelectTrigger className="w-full md:w-60"><SelectValue placeholder={t("filters.departmentPlaceholder")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allDepartments")}</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        manualSorting={false}
        rowCount={users.length}
        globalFilter={search}
        onGlobalFilterChange={(v) => { setSearch(v); resetToFirstPage(); }}
        searchPlaceholder={t("table.searchPlaceholder")}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      {/* Edit dialog — mantém-se um <Dialog> custom (não o EntityFormDialog genérico):
          selecção múltipla de papéis e departamentos por checkbox não se encaixa bem
          no formulário genérico de campo-a-campo. Só a origem dos dados mudou (mock). */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              {t("dialog.editTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialog.editDescription")}</DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-name">{t("form.labels.fullName")}</Label>
                  <Input id="u-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="u-phone">{t("form.labels.phone")}</Label>
                  <Input
                    id="u-phone"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    placeholder={t("form.placeholders.phone")}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t("form.labels.roles")}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-lg border p-3">
                  {ALL_ROLES.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={draftRoles.has(r)}
                        onCheckedChange={() => setDraftRoles((s) => toggleSet(s, r))}
                      />
                      {ROLE_LABEL[r]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t("form.labels.departments")}</Label>
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("form.noDepartments")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg border p-3 max-h-48 overflow-y-auto">
                    {departments.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={draftDepts.has(d.id)}
                          onCheckedChange={() => setDraftDepts((s) => toggleSet(s, d.id))}
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={updateUser.isPending}>
              {t("form.cancel")}
            </Button>
            <WriteGuard module="utilizadores">
              <Button onClick={saveEdit} disabled={updateUser.isPending}>
                {updateUser.isPending ? t("form.submitting") : t("form.submitEdit")}
              </Button>
            </WriteGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t("delete.title")}
        description={t("delete.description")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
