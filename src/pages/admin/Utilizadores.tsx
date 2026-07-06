import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Pencil, Trash2, UserPlus, Shield } from "lucide-react";
import { ALL_ROLES, ROLE_LABEL, type AppRole } from "@/lib/permissions";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}
interface RoleRow { id: string; user_id: string; role: AppRole; }
interface DeptRow { id: string; user_id: string; department_id: string; }
interface Department { id: string; name: string; }

export default function Utilizadores() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [userDepts, setUserDepts] = useState<DeptRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  // Edit dialog state
  const [editing, setEditing] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftRoles, setDraftRoles] = useState<Set<AppRole>>(new Set());
  const [draftDepts, setDraftDepts] = useState<Set<string>>(new Set());

  async function loadAll() {
    setLoading(true);
    const [{ data: profs }, { data: r }, { data: ud }, { data: deps }] = await Promise.all([
      (supabase as any).rpc("admin_list_profiles"),
      supabase.from("user_roles").select("id, user_id, role"),
      supabase.from("user_departments").select("id, user_id, department_id"),
      supabase.from("departments").select("id, name").order("name"),
    ]);
    setProfiles((profs ?? []) as Profile[]);
    setRoles((r ?? []) as RoleRow[]);
    setUserDepts((ud ?? []) as DeptRow[]);
    setDepartments((deps ?? []) as Department[]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const rolesByUser = useMemo(() => {
    const m: Record<string, RoleRow[]> = {};
    for (const r of roles) (m[r.user_id] ??= []).push(r);
    return m;
  }, [roles]);

  const deptsByUser = useMemo(() => {
    const m: Record<string, DeptRow[]> = {};
    for (const d of userDepts) (m[d.user_id] ??= []).push(d);
    return m;
  }, [userDepts]);

  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (q && !(p.full_name || "").toLowerCase().includes(q) && !(p.phone || "").toLowerCase().includes(q)) return false;
      if (roleFilter !== "all") {
        const has = (rolesByUser[p.user_id] ?? []).some((r) => r.role === roleFilter);
        if (!has) return false;
      }
      if (deptFilter !== "all") {
        const has = (deptsByUser[p.user_id] ?? []).some((d) => d.department_id === deptFilter);
        if (!has) return false;
      }
      return true;
    });
  }, [profiles, search, roleFilter, deptFilter, rolesByUser, deptsByUser]);

  const pag = useClientPagination(filtered);



  function openEdit(p: Profile) {
    setEditing(p);
    setDraftName(p.full_name ?? "");
    setDraftPhone(p.phone ?? "");
    setDraftRoles(new Set((rolesByUser[p.user_id] ?? []).map((r) => r.role)));
    setDraftDepts(new Set((deptsByUser[p.user_id] ?? []).map((d) => d.department_id)));
  }

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    return next;
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      // 1) Profile (name + phone)
      const { error: pe } = await supabase
        .from("profiles")
        .update({ full_name: draftName.trim(), phone: draftPhone.trim() || null })
        .eq("user_id", editing.user_id);
      if (pe) throw pe;

      // 2) Roles diff
      const currentRoles = new Set((rolesByUser[editing.user_id] ?? []).map((r) => r.role));
      const toAddRoles = [...draftRoles].filter((r) => !currentRoles.has(r));
      const toRemoveRoleIds = (rolesByUser[editing.user_id] ?? [])
        .filter((r) => !draftRoles.has(r.role))
        .map((r) => r.id);

      if (toRemoveRoleIds.length) {
        const { error } = await supabase.from("user_roles").delete().in("id", toRemoveRoleIds);
        if (error) throw error;
      }
      if (toAddRoles.length) {
        const { error } = await supabase.from("user_roles").insert(
          toAddRoles.map((role) => ({ user_id: editing.user_id, role }))
        );
        if (error) throw error;
      }

      // 3) Departments diff
      const currentDepts = new Set((deptsByUser[editing.user_id] ?? []).map((d) => d.department_id));
      const toAddDepts = [...draftDepts].filter((d) => !currentDepts.has(d));
      const toRemoveDeptIds = (deptsByUser[editing.user_id] ?? [])
        .filter((d) => !draftDepts.has(d.department_id))
        .map((d) => d.id);

      if (toRemoveDeptIds.length) {
        const { error } = await supabase.from("user_departments").delete().in("id", toRemoveDeptIds);
        if (error) throw error;
      }
      if (toAddDepts.length) {
        const { error } = await supabase.from("user_departments").insert(
          toAddDepts.map((department_id) => ({ user_id: editing.user_id, department_id }))
        );
        if (error) throw error;
      }

      toast({ title: "Utilizador actualizado", description: "As alterações foram guardadas." });
      setEditing(null);
      await loadAll();
    } catch (e: any) {
      toast({ title: "Erro ao guardar", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile(p: Profile) {
    const { error } = await supabase.from("profiles").delete().eq("user_id", p.user_id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil removido", description: "O registo de perfil foi apagado. A conta de autenticação mantém-se." });
    await loadAll();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="Gestão de Utilizadores"
        description="Utilizadores registados, com papéis e departamentos atribuídos"
      >
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/rbac"><Shield className="h-4 w-4 mr-2" />Matriz de permissões</Link>
        </Button>
      </AdminPageHeader>

      <AdminCard
        title={`Utilizadores (${filtered.length})`}
        icon={Users}
        loading={loading}
        isEmpty={!loading && filtered.length === 0}
        emptyMessage="Nenhum utilizador encontrado com estes filtros."
      >
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por nome ou telefone..."
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Papel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full md:w-60"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Departamentos</TableHead>
                <TableHead>Registado em</TableHead>
                <TableHead className="text-right w-32">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pag.pageItems.map((u) => {
                const userRoles = rolesByUser[u.user_id] ?? [];
                const userDeps = deptsByUser[u.user_id] ?? [];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userRoles.length === 0 && <span className="text-xs text-muted-foreground">Sem papéis</span>}
                        {userRoles.map((r) => (
                          <Badge key={r.id} variant="secondary" className="text-xs">{ROLE_LABEL[r.role]}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userDeps.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {userDeps.map((d) => (
                          <Badge key={d.id} variant="outline" className="text-xs">{deptName(d.department_id)}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(u)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Apagar">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar perfil?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acção apaga o perfil, papéis e departamentos associados a <b>{u.full_name || "este utilizador"}</b>.
                                A conta de autenticação não é removida (só um administrador da Cloud pode fazê-lo).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProfile(u)}>Apagar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={pag.page} pageSize={pag.pageSize} total={pag.total} totalPages={pag.totalPages}
          canPrev={pag.canPrev} canNext={pag.canNext}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Editar utilizador
            </DialogTitle>
            <DialogDescription>
              Actualize o nome, telefone, papéis e departamentos atribuídos.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="u-name">Nome completo</Label>
                  <Input id="u-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="u-phone">Telefone</Label>
                  <Input id="u-phone" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="+258 8X XXX XXXX" />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Papéis</Label>
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
                <Label className="mb-2 block">Departamentos</Label>
                {departments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem departamentos definidos.</p>
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
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
