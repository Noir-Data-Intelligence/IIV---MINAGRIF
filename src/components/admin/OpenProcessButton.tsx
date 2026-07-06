import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Workflow } from "lucide-react";

interface Props {
  entityType: string;
  entityId: string;
  defaultTitle?: string;
  defaultTypeHint?: string; // partial type name to preselect (e.g. "Não Conformidade")
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
}

interface PType { id: string; name: string }

export function OpenProcessButton({
  entityType, entityId, defaultTitle = "", defaultTypeHint, size = "sm", variant = "outline",
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<PType[]>([]);
  const [form, setForm] = useState({
    type_id: "", title: defaultTitle, description: "",
    priority: "normal", due_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("process_types").select("id, name").eq("is_active", true).order("name");
      const list = (data ?? []) as PType[];
      setTypes(list);
      let pre = "";
      if (defaultTypeHint) {
        const m = list.find(t => t.name.toLowerCase().includes(defaultTypeHint.toLowerCase()));
        if (m) pre = m.id;
      }
      setForm(f => ({ ...f, type_id: pre, title: defaultTitle || f.title }));
    })();
    // eslint-disable-next-line
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.type_id || !form.title.trim()) {
      toast({ title: "Campos obrigatórios", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const { data: proc, error: pErr } = await supabase.from("processes").insert({
        type_id: form.type_id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        requester_id: user.id,
        priority: form.priority as any,
        due_date: form.due_date || null,
        status: "aberto",
        code: "",
        linked_entity_type: entityType,
        linked_entity_id: entityId,
      } as any).select().single();
      if (pErr) throw pErr;

      const { data: typeSteps } = await supabase.from("process_type_steps")
        .select("*").eq("process_type_id", form.type_id).order("order_index");
      if (typeSteps && typeSteps.length > 0) {
        const rows = typeSteps.map((s: any, i: number) => ({
          process_id: proc.id, type_step_id: s.id, order_index: s.order_index, name: s.name,
          assignee_role: s.default_role,
          status: (i === 0 ? "em_curso" : "pendente") as "em_curso" | "pendente",
          started_at: i === 0 ? new Date().toISOString() : null,
          due_at: s.sla_days ? new Date(Date.now() + s.sla_days * 86400000).toISOString() : null,
        }));
        const { data: inserted } = await supabase.from("process_steps").insert(rows).select();
        const first = (inserted ?? []).sort((a: any, b: any) => a.order_index - b.order_index)[0];
        if (first) {
          await supabase.from("processes").update({
            current_step_id: first.id, status: "em_curso",
          }).eq("id", proc.id);
        }
      }
      await supabase.from("process_events").insert({
        process_id: proc.id, actor_id: user.id, event_type: "aberto",
        payload: { title: form.title, source: entityType },
      });

      toast({ title: "Processo aberto", description: `Ligado a ${entityType}` });
      setOpen(false);
      navigate(`/admin/processos/${proc.id}`);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button size={size} variant={variant} className="gap-1.5" onClick={() => setOpen(true)}>
        <Workflow className="h-3.5 w-3.5" /> Abrir processo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir processo ligado</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type_id} onValueChange={(v) => setForm({ ...form, type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "A criar…" : "Abrir processo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
