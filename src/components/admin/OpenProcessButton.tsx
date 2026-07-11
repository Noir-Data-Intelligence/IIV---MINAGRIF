import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Workflow } from "lucide-react";
import { useProcessTypesList } from "@/hooks/queries/useProcessTypes";
import { useCreateProcess } from "@/hooks/queries/useProcesses";
import type { ProcessPriority } from "@/types/dto/process";
import i18n from "@/i18n";
import ptOpenProcess from "@/i18n/locales/pt/admin/open-process.json";
import enOpenProcess from "@/i18n/locales/en/admin/open-process.json";

// Namespace autónomo registado em runtime (o bundle central só regista common/nav).
if (!i18n.hasResourceBundle("pt", "admin-open-process"))
  i18n.addResourceBundle("pt", "admin-open-process", ptOpenProcess, true, true);
if (!i18n.hasResourceBundle("en", "admin-open-process"))
  i18n.addResourceBundle("en", "admin-open-process", enOpenProcess, true, true);

interface Props {
  entityType: string;
  entityId: string;
  defaultTitle?: string;
  defaultTypeHint?: string; // partial type name to preselect (e.g. "Não Conformidade")
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
}

const PRIORITY_KEYS: ProcessPriority[] = ["baixa", "normal", "alta", "urgente"];

export function OpenProcessButton({
  entityType, entityId, defaultTitle = "", defaultTypeHint, size = "sm", variant = "outline",
}: Props) {
  const { t } = useTranslation("admin-open-process");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    typeId: "", title: defaultTitle, description: "",
    priority: "normal" as ProcessPriority, dueDate: "",
  });

  const { data: typesData } = useProcessTypesList({ activeOnly: true, perPage: 100 });
  const types = typesData?.data ?? [];
  const createProcess = useCreateProcess();

  useEffect(() => {
    if (!open || types.length === 0) return;
    let pre = "";
    if (defaultTypeHint) {
      const m = types.find((t) => t.name.toLowerCase().includes(defaultTypeHint.toLowerCase()));
      if (m) pre = m.id;
    }
    setForm((f) => ({ ...f, typeId: f.typeId || pre, title: defaultTitle || f.title }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, types.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.typeId || !form.title.trim()) {
      toast({ title: t("toast.requiredFields"), variant: "destructive" });
      return;
    }
    try {
      const created = await createProcess.mutateAsync({
        typeId: form.typeId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        dueDate: form.dueDate || null,
        requesterId: user.id,
        linkedEntityType: entityType,
        linkedEntityId: entityId,
      });

      toast({ title: t("toast.success"), description: t("toast.successDescription", { entity: entityType }) });
      setOpen(false);
      navigate(`/admin/processos/${created.id}`);
    } catch (err) {
      toast({ title: t("toast.error"), description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
  };

  return (
    <>
      <Button size={size} variant={variant} className="gap-1.5" onClick={() => setOpen(true)}>
        <Workflow className="h-3.5 w-3.5" /> {t("trigger")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("dialogTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label>{t("form.labels.type")} *</Label>
              <Select value={form.typeId} onValueChange={(v) => setForm({ ...form, typeId: v })}>
                <SelectTrigger><SelectValue placeholder={t("form.placeholders.type")} /></SelectTrigger>
                <SelectContent>
                  {types.map((pt) => <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.labels.title")} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>{t("form.labels.description")}</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("form.labels.priority")}</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as ProcessPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_KEYS.map((p) => (
                      <SelectItem key={p} value={p}>{t(`priority.${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("form.labels.dueDate")}</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("form.cancel")}</Button>
              <Button type="submit" disabled={createProcess.isPending}>
                {createProcess.isPending ? t("form.submitting") : t("form.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
