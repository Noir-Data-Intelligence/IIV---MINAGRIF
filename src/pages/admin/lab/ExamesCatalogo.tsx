import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WriteGuard } from "@/components/WriteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useDeleteExame, useExamesCatalogo, useSaveExame } from "@/hooks/queries/useLab";
import { useLaboratoriosList } from "@/hooks/queries/useLaboratorios";
import type { CampoResultado, ExameCatalogoDto } from "@/types/dto/lab";
import { TIPOS_AMOSTRA, errMsg, useLabT } from "./labShared";

/** Catálogo de exames por área (módulo `lab-exames`; escrita: Director de Laboratório/admin). */
export default function ExamesCatalogo() {
  const { t } = useLabT();
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useExamesCatalogo({ search: search || undefined });
  const apagar = useDeleteExame();
  const [editar, setEditar] = useState<ExameCatalogoDto | "novo" | null>(null);

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={BookOpen} title={t("exames.title")} description={t("exames.description")}>
        <WriteGuard module="lab-exames">
          <Button onClick={() => setEditar("novo")}><Plus className="mr-1 h-4 w-4" /> {t("exames.novo")}</Button>
        </WriteGuard>
      </AdminPageHeader>
      <Input className="max-w-xs" placeholder="…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.area")}</TableHead>
                <TableHead>{t("exames.codigo")}</TableHead>
                <TableHead>{t("exames.nome")}</TableHead>
                <TableHead>{t("exames.tecnica")}</TableHead>
                <TableHead>{t("exames.tipos")}</TableHead>
                <TableHead>{t("exames.sla")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead className="text-right">{t("common.accoes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center">{t("common.loading")}</TableCell></TableRow>}
              {(data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell><Badge variant="outline">{e.laboratorioCode}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{e.codigo}</TableCell>
                  <TableCell>{e.nome}</TableCell>
                  <TableCell className="text-xs">{e.tecnicaMetodo ?? "—"}</TableCell>
                  <TableCell className="text-xs">{e.tiposAmostra.map((x) => t(`tipoAmostra.${x}`)).join(", ") || "—"}</TableCell>
                  <TableCell>{e.slaHoras ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={e.activo ? "default" : "secondary"}>{e.activo ? t("exames.activo") : t("exames.inactivo")}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {canWrite("lab-exames") && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => setEditar(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title={t("exames.remover")}
                          onClick={async () => {
                            try {
                              await apagar.mutateAsync(e.id);
                            } catch (err) {
                              toast({ title: errMsg(err, t("common.error")), variant: "destructive" });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editar && <ExameDialog exame={editar === "novo" ? null : editar} onClose={() => setEditar(null)} />}
    </div>
  );
}

function ExameDialog({ exame, onClose }: { exame: ExameCatalogoDto | null; onClose: () => void }) {
  const { t } = useLabT();
  const { toast } = useToast();
  const guardar = useSaveExame();
  const { data: labs } = useLaboratoriosList({ page: 1, perPage: 100 });
  const [laboratorioId, setLaboratorioId] = useState(exame?.laboratorioId ?? "");
  const [codigo, setCodigo] = useState(exame?.codigo ?? "");
  const [nome, setNome] = useState(exame?.nome ?? "");
  const [tecnica, setTecnica] = useState(exame?.tecnicaMetodo ?? "");
  const [pop, setPop] = useState(exame?.popCodigo ?? "");
  const [tipos, setTipos] = useState<string[]>(exame?.tiposAmostra ?? []);
  const [sla, setSla] = useState(exame?.slaHoras ? String(exame.slaHoras) : "");
  const [campos, setCampos] = useState(JSON.stringify(exame?.camposResultado ?? [], null, 0));
  const [activo, setActivo] = useState(exame?.activo ?? true);

  const submeter = async () => {
    let camposResultado: CampoResultado[];
    try {
      camposResultado = JSON.parse(campos || "[]");
    } catch {
      toast({ title: t("exames.jsonInvalido"), variant: "destructive" });
      return;
    }
    try {
      await guardar.mutateAsync({
        id: exame?.id,
        payload: {
          laboratorioId,
          codigo: codigo.trim(),
          nome: nome.trim(),
          tecnicaMetodo: tecnica.trim() || null,
          popCodigo: pop.trim() || null,
          tiposAmostra: tipos,
          slaHoras: sla ? Number(sla) : null,
          camposResultado,
          activo,
        },
      });
      onClose();
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{exame ? t("exames.editar") : t("exames.novo")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>{t("common.area")}</Label>
            <Select value={laboratorioId} onValueChange={setLaboratorioId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(labs?.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.code} — {l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>{t("exames.codigo")}</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} /></div>
          <div className="space-y-1"><Label>{t("exames.nome")}</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div className="space-y-1"><Label>{t("exames.tecnica")}</Label><Input value={tecnica} onChange={(e) => setTecnica(e.target.value)} /></div>
          <div className="space-y-1"><Label>{t("exames.pop")}</Label><Input value={pop} onChange={(e) => setPop(e.target.value)} /></div>
          <div className="space-y-1"><Label>{t("exames.sla")}</Label><Input type="number" value={sla} onChange={(e) => setSla(e.target.value)} /></div>
          <label className="flex items-center gap-2 pt-6 text-sm"><Switch checked={activo} onCheckedChange={setActivo} /> {t("exames.activo")}</label>
          <div className="col-span-2 space-y-1">
            <Label>{t("exames.tipos")}</Label>
            <div className="flex flex-wrap gap-1">
              {TIPOS_AMOSTRA.map((tipo) => (
                <Badge
                  key={tipo}
                  variant={tipos.includes(tipo) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTipos((p) => (p.includes(tipo) ? p.filter((x) => x !== tipo) : [...p, tipo]))}
                >
                  {t(`tipoAmostra.${tipo}`)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <Label>{t("exames.campos")}</Label>
            <Textarea rows={3} className="font-mono text-xs" value={campos} onChange={(e) => setCampos(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t("exames.camposAjuda")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={!laboratorioId || !codigo.trim() || !nome.trim() || guardar.isPending} onClick={submeter}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
