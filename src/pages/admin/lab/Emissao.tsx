import { useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, Inbox, PackageCheck, RotateCcw, Stamp, Lock } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useAccaoBi,
  useEmitirBoletimAnalises,
  useEncerrarProcesso,
  useEntregarBoletimAnalises,
  useFilaEmissao,
} from "@/hooks/queries/useLab";
import type { BoletimAnaliseLabDto, BoletimInternoLabDto, CanalEntrega } from "@/types/dto/lab";
import { BiStatusBadge, RequisicaoStatusBadge, errMsg, fmtDateTime, useLabT } from "./labShared";

type Tab = "devolvidos" | "aEmitir" | "emitidos" | "porEncerrar";

/**
 * Fase 3 — Emissão de Resultados (DEF-003). Só a CGISC: recebe a devolução
 * das áreas, pode devolver para correcção, EMITE o Boletim de Análises
 * oficial, regista a entrega à origem e encerra o processo.
 */
export default function Emissao() {
  const { t } = useLabT();
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const pode = canWrite("lab-emissao");
  const [tab, setTab] = useState<Tab>("devolvidos");
  const { data, isLoading } = useFilaEmissao();
  const accaoBi = useAccaoBi();
  const emitir = useEmitirBoletimAnalises();
  const encerrar = useEncerrarProcesso();
  const [correccao, setCorreccao] = useState<BoletimInternoLabDto | null>(null);
  const [motivo, setMotivo] = useState("");
  const [entrega, setEntrega] = useState<BoletimAnaliseLabDto | null>(null);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) toast({ title: ok });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const bis = tab === "porEncerrar" ? [] : (data?.[tab] ?? []);

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={FileCheck2} title={t("emissao.title")} description={t("emissao.description")} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          {(["devolvidos", "aEmitir", "emitidos", "porEncerrar"] as const).map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`emissao.tabs.${k}`)} <Badge variant="secondary" className="ml-2">{data?.[k]?.length ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {tab !== "porEncerrar" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BI</TableHead>
                  <TableHead>{t("common.area")}</TableHead>
                  <TableHead>{t("common.cliente")}</TableHead>
                  <TableHead>{t("common.estado")}</TableHead>
                  <TableHead>BA</TableHead>
                  <TableHead className="text-right">{t("common.accoes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6} className="text-center">{t("common.loading")}</TableCell></TableRow>}
                {!isLoading && bis.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                )}
                {bis.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">
                      <Link className="hover:underline" to={`/admin/lab/processos/${b.requisicaoId}`}>{b.numero}</Link>
                    </TableCell>
                    <TableCell><Badge variant="outline">{b.laboratorio?.code}</Badge></TableCell>
                    <TableCell>{b.requisicao?.clienteNome}</TableCell>
                    <TableCell><BiStatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-xs">
                      {b.boletimAnalise?.numero ?? "—"}
                      {b.boletimAnalise?.entregueEm && (
                        <div className="text-muted-foreground">
                          {t("emissao.entregue", { data: fmtDateTime(b.boletimAnalise.entregueEm), canal: b.boletimAnalise.canalEntrega ?? "" })}
                        </div>
                      )}
                      {b.boletimAnalise?.isvNotificadoEm && <Badge variant="secondary">{t("emissao.isvNotificado")}</Badge>}
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      {pode && b.status === "devolvido" && (
                        <Button size="sm" onClick={() => run(() => accaoBi.mutateAsync({ id: b.id, accao: "receber-devolucao" }), t("statusBi.recebido_cgisc"))}>
                          <Inbox className="mr-1 h-3.5 w-3.5" /> {t("emissao.receber")}
                        </Button>
                      )}
                      {pode && b.status === "recebido_cgisc" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setCorreccao(b); setMotivo(""); }}>
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> {t("emissao.correccao")}
                          </Button>
                          <Button
                            size="sm"
                            disabled={emitir.isPending}
                            onClick={() =>
                              run(async () => {
                                const ba = await emitir.mutateAsync(b.id);
                                toast({ title: t("emissao.emitido", { numero: ba.numero ?? "" }), description: t("emissao.pdfStub") });
                              })
                            }
                          >
                            <Stamp className="mr-1 h-3.5 w-3.5" /> {t("emissao.emitir")}
                          </Button>
                        </>
                      )}
                      {pode && b.status === "emitido" && b.boletimAnalise && !b.boletimAnalise.entregueEm && (
                        <Button size="sm" variant="secondary" onClick={() => setEntrega(b.boletimAnalise!)}>
                          <PackageCheck className="mr-1 h-3.5 w-3.5" /> {t("emissao.entregar")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.pat")}</TableHead>
                  <TableHead>{t("common.cliente")}</TableHead>
                  <TableHead>{t("common.estado")}</TableHead>
                  <TableHead>BA</TableHead>
                  <TableHead className="text-right">{t("common.accoes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.porEncerrar ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                )}
                {(data?.porEncerrar ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">
                      <Link className="hover:underline" to={`/admin/lab/processos/${r.id}`}>{r.patNumero ?? r.numero}</Link>
                    </TableCell>
                    <TableCell>{r.clienteNome}</TableCell>
                    <TableCell><RequisicaoStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs">{(r.boletinsAnalises ?? []).map((ba) => ba.numero).filter(Boolean).join(", ")}</TableCell>
                    <TableCell className="text-right">
                      {pode && (
                        <Button size="sm" disabled={encerrar.isPending} onClick={() => run(() => encerrar.mutateAsync(r.id), t("statusRequisicao.encerrada"))}>
                          <Lock className="mr-1 h-3.5 w-3.5" /> {t("emissao.encerrar")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!correccao} onOpenChange={(v) => !v && setCorreccao(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("emissao.correccao")} — {correccao?.numero}</DialogTitle></DialogHeader>
          <Label>{t("bi.motivo")}</Label>
          <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorreccao(null)}>{t("common.cancel")}</Button>
            <Button
              disabled={!motivo.trim() || accaoBi.isPending}
              onClick={() =>
                correccao &&
                run(async () => {
                  await accaoBi.mutateAsync({ id: correccao.id, accao: "devolver-correccao", payload: { motivo: motivo.trim() } });
                  setCorreccao(null);
                }, t("accoesMov.devolvida_correccao"))
              }
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntregaDialog ba={entrega} onClose={() => setEntrega(null)} />
    </div>
  );
}

/** Entrega do BA. `pagamentoConfirmado` é um STUB (não há módulo de pagamentos) — só conta se a área o exigir. */
function EntregaDialog({ ba, onClose }: { ba: BoletimAnaliseLabDto | null; onClose: () => void }) {
  const { t } = useLabT();
  const { toast } = useToast();
  const entregar = useEntregarBoletimAnalises();
  const [entregueA, setEntregueA] = useState("");
  const [canal, setCanal] = useState<CanalEntrega>("presencial");
  const [pagamento, setPagamento] = useState(false);

  const confirmar = async () => {
    if (!ba) return;
    try {
      await entregar.mutateAsync({ baId: ba.id, payload: { entregueA: entregueA.trim(), canal, pagamentoConfirmado: pagamento } });
      toast({ title: t("emissao.entregar") });
      onClose();
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!ba} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("emissao.entregar")} — {ba?.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("emissao.entregueA")}</Label>
            <Input value={entregueA} onChange={(e) => setEntregueA(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("emissao.canal")}</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as CanalEntrega)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["presencial", "email", "isv", "portal"] as const).map((c) => (
                  <SelectItem key={c} value={c}>{t(`emissao.canais.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={pagamento} onCheckedChange={(v) => setPagamento(v === true)} /> {t("emissao.pagamento")}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={!entregueA.trim() || entregar.isPending} onClick={confirmar}>{t("common.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
