import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Save, UserPlus, Trash2, Search, RefreshCw, Eye, Pencil, RotateCcw,
} from "lucide-react";
import {
  ALL_MODULES, ALL_ROLES, MODULE_LABEL, ROLE_LABEL, ROLE_PERMISSIONS,
  type AppRole, type ModuleKey,
} from "@/lib/permissions";
import { refreshPermissionsMatrix } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

type PermRow = { role: AppRole; module: ModuleKey; can_view: boolean; can_write: boolean };
type Profile = { user_id: string; full_name: string };
type UserRoleRow = { id: string; user_id: string; role: AppRole };

const ROLE_TONE: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  diretor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  gestor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  tecnico: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  colaborador: "bg-muted text-muted-foreground border-border",
};

export default function RBAC() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, PermRow>>({});
  const [baseline, setBaseline] = useState<Record<string, PermRow>>({});
  const [moduleSearch, setModuleSearch] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [newRoleByUser, setNewRoleByUser] = useState<Record<string, AppRole>>({});

  const keyOf = (role: AppRole, m: ModuleKey) => `${role}:${m}`;

  function buildSeedMatrix(perms: PermRow[]) {
    const m: Record<string, PermRow> = {};
    for (const role of ALL_ROLES) {
      for (const mod of ALL_MODULES) {
        m[keyOf(role, mod)] = { role, module: mod, can_view: false, can_write: false };
      }
    }
    for (const p of perms) m[keyOf(p.role, p.module)] = p;
    return m;
  }

  async function loadAll() {
    setLoading(true);
    const [{ data: perms }, { data: profs }, { data: roles }] = await Promise.all([
      supabase.from("role_permissions").select("role, module, can_view, can_write"),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    const seeded = buildSeedMatrix((perms ?? []) as PermRow[]);
    setMatrix(seeded);
    setBaseline(JSON.parse(JSON.stringify(seeded)));
    setProfiles((profs ?? []) as Profile[]);
    setUserRoles((roles ?? []) as UserRoleRow[]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function togglePerm(role: AppRole, mod: ModuleKey, field: "can_view" | "can_write", value: boolean) {
    if (role === "admin") return;
    setMatrix((prev) => {
      const k = keyOf(role, mod);
      const cur = prev[k] ?? { role, module: mod, can_view: false, can_write: false };
      const next = { ...cur, [field]: value };
      if (field === "can_write" && value) next.can_view = true;
      if (field === "can_view" && !value) next.can_write = false;
      return { ...prev, [k]: next };
    });
  }

  function setRowAll(mod: ModuleKey, kind: "view" | "write" | "none") {
    setMatrix((prev) => {
      const next = { ...prev };
      for (const role of ALL_ROLES) {
        if (role === "admin") continue;
        const k = keyOf(role, mod);
        const cur = next[k] ?? { role, module: mod, can_view: false, can_write: false };
        if (kind === "none") next[k] = { ...cur, can_view: false, can_write: false };
        else if (kind === "view") next[k] = { ...cur, can_view: true };
        else next[k] = { ...cur, can_view: true, can_write: true };
      }
      return next;
    });
  }

  function resetRoleToDefault(role: AppRole) {
    if (role === "admin") return;
    const def = ROLE_PERMISSIONS[role];
    setMatrix((prev) => {
      const next = { ...prev };
      for (const mod of ALL_MODULES) {
        next[keyOf(role, mod)] = {
          role, module: mod,
          can_view: def.view.includes(mod),
          can_write: def.write.includes(mod),
        };
      }
      return next;
    });
    toast({ title: "Predefinições aplicadas", description: `Papel ${ROLE_LABEL[role]} reposto (por guardar).` });
  }

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(matrix)) {
      const a = matrix[k], b = baseline[k];
      if (!b || a.can_view !== b.can_view || a.can_write !== b.can_write) n++;
    }
    return n;
  }, [matrix, baseline]);

  async function savePermissions() {
    setSaving(true);
    const rows = Object.values(matrix).filter((r) => r.role !== "admin");
    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await supabase
        .from("role_permissions")
        .upsert(slice, { onConflict: "role,module" });
      if (error) {
        toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }
    await refreshPermissionsMatrix();
    setBaseline(JSON.parse(JSON.stringify(matrix)));
    toast({ title: "Permissões actualizadas", description: "A matriz foi guardada com sucesso." });
    setSaving(false);
  }

  async function assignRole(userId: string, role: AppRole) {
    const exists = userRoles.find((r) => r.user_id === userId && r.role === role);
    if (exists) {
      toast({ title: "Já atribuído", description: `Este utilizador já tem o papel ${ROLE_LABEL[role]}.` });
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role })
      .select("id, user_id, role")
      .single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setUserRoles((prev) => [...prev, data as UserRoleRow]);
    toast({ title: "Papel atribuído", description: `${ROLE_LABEL[role]} adicionado ao utilizador.` });
  }

  async function removeRole(id: string) {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setUserRoles((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Papel removido" });
  }

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.full_name || "").toLowerCase().includes(q));
  }, [profiles, search]);

  const filteredModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return ALL_MODULES;
    return ALL_MODULES.filter((m) => MODULE_LABEL[m].toLowerCase().includes(q) || m.includes(q));
  }, [moduleSearch]);

  const rolesByUser = useMemo(() => {
    const map: Record<string, UserRoleRow[]> = {};
    for (const r of userRoles) (map[r.user_id] ??= []).push(r);
    return map;
  }, [userRoles]);

  const totals = useMemo(() => {
    const out: Record<AppRole, { view: number; write: number }> = {
      admin: { view: ALL_MODULES.length, write: ALL_MODULES.length },
      diretor: { view: 0, write: 0 }, gestor: { view: 0, write: 0 },
      tecnico: { view: 0, write: 0 }, colaborador: { view: 0, write: 0 },
    };
    for (const role of ALL_ROLES) {
      if (role === "admin") continue;
      for (const mod of ALL_MODULES) {
        const c = matrix[keyOf(role, mod)];
        if (c?.can_view) out[role].view++;
        if (c?.can_write) out[role].write++;
      }
    }
    return out;
  }, [matrix]);

  function isCellDirty(role: AppRole, mod: ModuleKey) {
    const k = keyOf(role, mod);
    const a = matrix[k], b = baseline[k];
    if (!b) return false;
    return a.can_view !== b.can_view || a.can_write !== b.can_write;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <AdminPageHeader
          icon={Shield}
          title="Gestão de Permissões (RBAC)"
          description="Matriz consolidada de acessos por papel e módulo"
        >
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
        </AdminPageHeader>

        <Tabs defaultValue="matrix" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
            <TabsTrigger value="users">Atribuição a Utilizadores</TabsTrigger>
          </TabsList>

          {/* MATRIX */}
          <TabsContent value="matrix" className="space-y-4">
            <AdminCard title="Matriz Papel × Módulo" icon={Shield} loading={loading}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative max-w-xs flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Filtrar módulos..."
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Ver</span>
                  <span className="inline-flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> Escrever</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {dirtyCount > 0 && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                      {dirtyCount} alteraç{dirtyCount > 1 ? "ões" : "ão"} por guardar
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMatrix(JSON.parse(JSON.stringify(baseline)))}
                    disabled={dirtyCount === 0 || saving}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reverter
                  </Button>
                  <Button onClick={savePermissions} disabled={saving || dirtyCount === 0}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "A guardar..." : "Guardar"}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-auto max-h-[70vh]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="min-w-[180px] sticky left-0 bg-card z-20">Módulo</TableHead>
                      {ALL_ROLES.map((r) => (
                        <TableHead key={r} className="text-center min-w-[150px]">
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <Badge variant="outline" className={cn("border", ROLE_TONE[r])}>
                              {ROLE_LABEL[r]}
                            </Badge>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {totals[r].view} ver · {totals[r].write} esc.
                            </div>
                            {r !== "admin" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => resetRoleToDefault(r)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                                  >
                                    repor predefinição
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Aplica as predefinições do papel (por guardar)</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-28 text-center">Atalhos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModules.map((m) => (
                      <TableRow key={m} className="hover:bg-muted/30">
                        <TableCell className="font-medium sticky left-0 bg-card">
                          {MODULE_LABEL[m]}
                          <div className="text-[10px] text-muted-foreground">{m}</div>
                        </TableCell>
                        {ALL_ROLES.map((role) => {
                          const cell = matrix[keyOf(role, m)];
                          const isAdmin = role === "admin";
                          const view = isAdmin || !!cell?.can_view;
                          const write = isAdmin || !!cell?.can_write;
                          const dirty = !isAdmin && isCellDirty(role, m);
                          return (
                            <TableCell key={role} className={cn("text-center", dirty && "bg-amber-500/5")}>
                              <div className="flex items-center justify-center gap-3">
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <Checkbox
                                    checked={view}
                                    disabled={isAdmin}
                                    onCheckedChange={(v) => togglePerm(role, m, "can_view", !!v)}
                                    aria-label={`${ROLE_LABEL[role]} pode ver ${MODULE_LABEL[m]}`}
                                  />
                                  <Eye className={cn("h-3.5 w-3.5", view ? "text-primary" : "text-muted-foreground/40")} />
                                </label>
                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                  <Checkbox
                                    checked={write}
                                    disabled={isAdmin}
                                    onCheckedChange={(v) => togglePerm(role, m, "can_write", !!v)}
                                    aria-label={`${ROLE_LABEL[role]} pode escrever ${MODULE_LABEL[m]}`}
                                  />
                                  <Pencil className={cn("h-3.5 w-3.5", write ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40")} />
                                </label>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "view")}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Todos podem ver</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "write")}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Todos podem escrever</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRowAll(m, "none")}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover acesso a todos</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredModules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={ALL_ROLES.length + 2} className="text-center text-sm text-muted-foreground py-8">
                          Nenhum módulo corresponde ao filtro.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Nota: escrever implica ver. O papel “Administrador” mantém sempre acesso total e não é editável.
                Células com fundo âmbar indicam alterações por guardar.
              </p>
            </AdminCard>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="space-y-4">
            <AdminCard
              title="Papéis por Utilizador"
              icon={UserPlus}
              loading={loading}
              isEmpty={!loading && filteredProfiles.length === 0}
              emptyMessage="Nenhum utilizador encontrado."
            >
              <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Procurar utilizador..."
                  className="pl-9"
                />
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilizador</TableHead>
                      <TableHead>Papéis atribuídos</TableHead>
                      <TableHead className="w-72 text-right">Atribuir novo papel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((p) => {
                      const roles = rolesByUser[p.user_id] ?? [];
                      const selected = newRoleByUser[p.user_id] ?? "colaborador";
                      return (
                        <TableRow key={p.user_id}>
                          <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {roles.length === 0 && (
                                <span className="text-xs text-muted-foreground">Sem papéis</span>
                              )}
                              {roles.map((r) => (
                                <Badge key={r.id} variant="outline" className={cn("gap-1.5 pr-1 border", ROLE_TONE[r.role])}>
                                  {ROLE_LABEL[r.role]}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="h-4 w-4 rounded hover:bg-destructive/20 inline-flex items-center justify-center"
                                        aria-label={`Remover ${ROLE_LABEL[r.role]}`}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover papel?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acção remove o papel “{ROLE_LABEL[r.role]}” deste utilizador.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeRole(r.id)}>
                                          Remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={selected}
                                onValueChange={(v) => setNewRoleByUser((s) => ({ ...s, [p.user_id]: v as AppRole }))}
                              >
                                <SelectTrigger className="w-44">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ALL_ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => assignRole(p.user_id, selected)}>
                                <UserPlus className="h-4 w-4 mr-1.5" />
                                Atribuir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </AdminCard>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
