import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, X } from "lucide-react";
import type { AppRole } from "@/lib/permissions";

interface Props { documentId: string }

interface Perm {
  id: string; role: AppRole | null; department_id: string | null; can_edit: boolean;
  department?: { name: string } | null;
}

const ROLES: AppRole[] = ["admin", "gestor", "tecnico", "diretor", "colaborador"];

export function DocumentPermissionsPanel({ documentId }: Props) {
  const { toast } = useToast();
  const [perms, setPerms] = useState<Perm[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<"role" | "department">("role");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [canEdit, setCanEdit] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: p }, { data: d }] = await Promise.all([
      supabase.from("document_permissions")
        .select("*, department:departments(name)").eq("document_id", documentId),
      supabase.from("departments").select("id, name").order("name"),
    ]);
    setPerms((p ?? []) as any);
    setDepartments(d ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [documentId]);

  const addPerm = async () => {
    const payload: any = { document_id: documentId, can_edit: canEdit };
    if (target === "role") {
      if (!selectedRole) return;
      payload.role = selectedRole;
    } else {
      if (!selectedDept) return;
      payload.department_id = selectedDept;
    }
    const { error } = await supabase.from("document_permissions").insert(payload);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setSelectedRole(""); setSelectedDept(""); setCanEdit(false);
    fetchAll();
  };

  const removePerm = async (id: string) => {
    await supabase.from("document_permissions").delete().eq("id", id);
    fetchAll();
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Shield className="h-4 w-4" /> Permissões
      </h4>

      {loading ? (
        <p className="text-xs text-muted-foreground">A carregar…</p>
      ) : perms.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem permissões granulares — visibilidade aplica-se.</p>
      ) : (
        <ul className="space-y-1.5">
          {perms.map(p => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded px-2 py-1.5">
              <span className="flex items-center gap-2">
                {p.role ? (
                  <Badge variant="outline" className="capitalize">Papel: {p.role}</Badge>
                ) : (
                  <Badge variant="outline">Dept.: {p.department?.name ?? "—"}</Badge>
                )}
                {p.can_edit && <Badge variant="secondary">edição</Badge>}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removePerm(p.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-3 space-y-2">
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={target === "role" ? "default" : "outline"} onClick={() => setTarget("role")}>
            Por papel
          </Button>
          <Button type="button" size="sm" variant={target === "department" ? "default" : "outline"} onClick={() => setTarget("department")}>
            Por departamento
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          {target === "role" ? (
            <div className="sm:col-span-2">
              <Label className="text-xs">Papel</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue placeholder="Seleccionar papel" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <Label className="text-xs">Departamento</Label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2 pb-2">
            <Switch checked={canEdit} onCheckedChange={setCanEdit} />
            <Label className="text-xs cursor-pointer">Pode editar</Label>
          </div>
        </div>
        <Button size="sm" onClick={addPerm} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Adicionar permissão
        </Button>
      </div>
    </div>
  );
}
