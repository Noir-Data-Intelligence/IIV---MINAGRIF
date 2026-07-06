import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Workflow, Plus, Pencil, Trash2, ChevronLeft, ArrowUp, ArrowDown } from "lucide-react";
import type { AppRole } from "@/lib/permissions";

interface PType { id: string; name: string; description: string | null; icon: string | null; sla_days: number | null; is_active: boolean }
interface PStep { id: string; process_type_id: string; order_index: number; name: string; default_role: AppRole | null; sla_days: number | null }

const ROLES: AppRole[] = ["admin", "gestor", "tecnico", "diretor", "colaborador"];

export default function ProcessosTipos() {
  const { toast } = useToast();
  const [types, setTypes] = useState<PType[]>([]);
  const [stepsMap, setStepsMap] = useState<Record<string, PStep[]>>({});
  const [loading, setLoading] = useState(true);

  // type form
  const [typeOpen, setTypeOpen] = useState(false);
  const [editingType, setEditingType] = useState<PType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "", sla_days: "", is_active: true });

  // step form
  const [stepOpen, setStepOpen] = useState(false);
  const [stepCtx, setStepCtx] = useState<{ typeId: string; step: PStep | null } | null>(null);
  const [stepForm, setStepForm] = useState({ name: "", default_role: "none" as string, sla_days: "" });

  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data: t } = await supabase.from("process_types").select("*").order("name");
    setTypes((t ?? []) as PType[]);
    const { data: s } = await supabase.from("process_type_steps").select("*").order("order_index");
    const map: Record<string, PStep[]> = {};
    (s ?? []).forEach((row: any) => {
      (map[row.process_type_id] = map[row.process_type_id] || []).push(row);
    });
    setStepsMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreateType = () => {
    setEditingType(null);
    setTypeForm({ name: "", description: "", sla_days: "", is_active: true });
    setTypeOpen(true);
  };
  const openEditType = (t: PType) => {
    setEditingType(t);
    setTypeForm({
      name: t.name, description: t.description ?? "",
      sla_days: t.sla_days?.toString() ?? "", is_active: t.is_active,
    });
    setTypeOpen(true);
  };

  const saveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;
    const payload = {
      name: typeForm.name.trim(),
      description: typeForm.description.trim() || null,
      sla_days: typeForm.sla_days ? Number(typeForm.sla_days) : null,
      is_active: typeForm.is_active,
    };
    const { error } = editingType
      ? await supabase.from("process_types").update(payload).eq("id", editingType.id)
      : await supabase.from("process_types").insert(payload);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingType ? "Tipo actualizado" : "Tipo criado" });
    setTypeOpen(false);
    fetchAll();
  };

  const openCreateStep = (typeId: string) => {
    setStepCtx({ typeId, step: null });
    setStepForm({ name: "", default_role: "none", sla_days: "" });
    setStepOpen(true);
  };
  const openEditStep = (typeId: string, step: PStep) => {
    setStepCtx({ typeId, step });
    setStepForm({
      name: step.name,
      default_role: step.default_role ?? "none",
      sla_days: step.sla_days?.toString() ?? "",
    });
    setStepOpen(true);
  };

  const saveStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepCtx || !stepForm.name.trim()) return;
    const existing = stepsMap[stepCtx.typeId] ?? [];
    const payload = {
      process_type_id: stepCtx.typeId,
      name: stepForm.name.trim(),
      default_role: stepForm.default_role === "none" ? null : (stepForm.default_role as AppRole),
      sla_days: stepForm.sla_days ? Number(stepForm.sla_days) : null,
    };
    const { error } = stepCtx.step
      ? await supabase.from("process_type_steps").update(payload).eq("id", stepCtx.step.id)
      : await supabase.from("process_type_steps").insert({ ...payload, order_index: existing.length + 1 });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: stepCtx.step ? "Etapa actualizada" : "Etapa adicionada" });
    setStepOpen(false);
    fetchAll();
  };

  const moveStep = async (typeId: string, step: PStep, dir: -1 | 1) => {
    const list = (stepsMap[typeId] ?? []).slice().sort((a, b) => a.order_index - b.order_index);
    const idx = list.findIndex(s => s.id === step.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await supabase.from("process_type_steps").update({ order_index: swap.order_index }).eq("id", step.id);
    await supabase.from("process_type_steps").update({ order_index: step.order_index }).eq("id", swap.id);
    fetchAll();
  };

  const deleteType = async () => {
    if (!deleteTypeId) return;
    const { error } = await supabase.from("process_types").delete().eq("id", deleteTypeId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Tipo eliminado" });
    setDeleteTypeId(null);
    fetchAll();
  };

  const deleteStep = async () => {
    if (!deleteStepId) return;
    const { error } = await supabase.from("process_type_steps").delete().eq("id", deleteStepId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Etapa eliminada" });
    setDeleteStepId(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
      </div>

      <AdminPageHeader
        icon={Workflow}
        title="Tipos de processo"
        description="Configurar workflows: tipos, etapas, responsáveis e SLAs."
      >
        <Button onClick={openCreateType} className="gap-2">
          <Plus className="h-4 w-4" /> Novo tipo
        </Button>
      </AdminPageHeader>

      <AdminCard loading={loading} isEmpty={!loading && types.length === 0} emptyMessage="Sem tipos configurados.">
        <Accordion type="multiple" className="space-y-2">
          {types.map(t => {
            const list = (stepsMap[t.id] ?? []).slice().sort((a, b) => a.order_index - b.order_index);
            return (
              <AccordionItem key={t.id} value={t.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="font-semibold">{t.name}</span>
                    {!t.is_active && <Badge variant="outline">Inactivo</Badge>}
                    {t.sla_days && <Badge variant="secondary">SLA {t.sla_days}d</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">{list.length} etapas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditType(t)} className="gap-1">
                      <Pencil className="h-3.5 w-3.5" /> Editar tipo
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => setDeleteTypeId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </Button>
                    <Button size="sm" className="gap-1 ml-auto" onClick={() => openCreateStep(t.id)}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar etapa
                    </Button>
                  </div>

                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Sem etapas. Adicione a primeira.</p>
                  ) : (
                    <ol className="space-y-2">
                      {list.map((s, i) => (
                        <li key={s.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2 pl-3">
                          <Badge variant="outline" className="font-mono">{s.order_index}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.default_role ? `Papel: ${s.default_role}` : "Sem papel"}
                              {s.sla_days ? ` · SLA ${s.sla_days}d` : ""}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => moveStep(t.id, s, -1)}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === list.length - 1} onClick={() => moveStep(t.id, s, 1)}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditStep(t.id, s)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteStepId(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </AdminCard>

      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingType ? "Editar tipo" : "Novo tipo de processo"}</DialogTitle></DialogHeader>
          <form onSubmit={saveType} className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SLA (dias)</Label>
                <Input type="number" min="0" value={typeForm.sla_days} onChange={(e) => setTypeForm({ ...typeForm, sla_days: e.target.value })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={typeForm.is_active} onCheckedChange={(v) => setTypeForm({ ...typeForm, is_active: v })} />
                <Label className="cursor-pointer">Activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stepOpen} onOpenChange={setStepOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{stepCtx?.step ? "Editar etapa" : "Nova etapa"}</DialogTitle></DialogHeader>
          <form onSubmit={saveStep} className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={stepForm.name} onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Papel responsável</Label>
                <Select value={stepForm.default_role} onValueChange={(v) => setStepForm({ ...stepForm, default_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem papel definido</SelectItem>
                    {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SLA (dias)</Label>
                <Input type="number" min="0" value={stepForm.sla_days} onChange={(e) => setStepForm({ ...stepForm, sla_days: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStepOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTypeId} onOpenChange={(o) => !o && setDeleteTypeId(null)}
        onConfirm={deleteType} title="Eliminar tipo?" description="Remove o tipo e todas as etapas-padrão associadas."
      />
      <DeleteConfirmDialog
        open={!!deleteStepId} onOpenChange={(o) => !o && setDeleteStepId(null)}
        onConfirm={deleteStep} title="Eliminar etapa?" description="A etapa-padrão será removida deste tipo."
      />
    </div>
  );
}
