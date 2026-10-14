import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAceitarComReserva, useColegasLab, useConferirAmostra, useRejeitarNaRecepcao } from "@/hooks/queries/useLab";
import { useCriteriosRejeicaoList } from "@/hooks/queries/useCriteriosRejeicao";
import type { AmostraDto } from "@/types/dto/amostra";
import type { CriteriosConferencia } from "@/types/dto/lab";
import { AmostraStatusBadge, CRITERIOS_CONFERENCIA, errMsg, useLabT } from "./labShared";

/**
 * Dupla conferência na recepção (DEF-001): checklist dos 6 critérios +
 * assinatura. O botão fica desactivado se o utilizador for o mesmo da 1ª
 * conferência (o backend recusa também com 422). Se alguma conferência for
 * não conforme, liga ao Termo de Rejeição ou à aceitação com reserva.
 */
export function ConferenciaDialog({
  amostra,
  open,
  onOpenChange,
}: {
  amostra: AmostraDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLabT();
  const { toast } = useToast();
  const { user } = useAuth();
  const conferir = useConferirAmostra();
  const aceitarReserva = useAceitarComReserva();
  const [criterios, setCriterios] = useState<CriteriosConferencia>(() => todosTrue());
  const [observacao, setObservacao] = useState("");
  const [motivoReserva, setMotivoReserva] = useState("");
  const [rejeitarAberto, setRejeitarAberto] = useState(false);

  useEffect(() => {
    if (open) {
      setCriterios(todosTrue());
      setObservacao("");
      setMotivoReserva("");
    }
  }, [open, amostra?.id]);

  const conferencias = amostra?.conferencias ?? [];
  const primeira = conferencias.find((c) => c.ordem === 1);
  const mesmoTecnico = !!primeira && conferencias.length === 1 && primeira.tecnicoId === user?.id;
  const completa = conferencias.length >= 2;
  const aguardaDecisao = completa && amostra?.status === "em_conferencia";
  const podeConferir = !!amostra && !completa && (amostra.status === "recebida" || amostra.status === "em_conferencia");

  const submeter = async () => {
    if (!amostra) return;
    try {
      await conferir.mutateAsync({ amostraId: amostra.id, payload: { criterios, observacao: observacao.trim() || null } });
      toast({ title: t("conferencia.ok") });
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const aceitarComReserva = async () => {
    if (!amostra || !motivoReserva.trim()) return;
    try {
      await aceitarReserva.mutateAsync({ amostraId: amostra.id, motivo: motivoReserva.trim() });
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("conferencia.title", { numero: amostra?.numero ?? "" })}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {amostra && <AmostraStatusBadge status={amostra.status} />}
              {podeConferir && t("conferencia.ordem", { ordem: conferencias.length + 1 })}
            </DialogDescription>
          </DialogHeader>

          {conferencias.length > 0 && (
            <ul className="space-y-1 text-sm">
              {conferencias.map((c) => (
                <li key={c.id} className="flex justify-between rounded bg-muted/40 px-2 py-1">
                  <span>{t("conferencia.ordem", { ordem: c.ordem })} — {c.tecnicoNome ?? c.tecnicoId}</span>
                  <span className={c.conforme ? "text-emerald-600" : "text-destructive"}>
                    {c.conforme ? t("conferencia.conforme") : t("conferencia.naoConforme")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {podeConferir && (
            <div className="space-y-3">
              {mesmoTecnico && (
                <Alert variant="destructive">
                  <AlertDescription>{t("conferencia.mesmoTecnico", { nome: primeira?.tecnicoNome ?? "" })}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-2">
                {CRITERIOS_CONFERENCIA.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={criterios[c]}
                      onCheckedChange={(v) => setCriterios((prev) => ({ ...prev, [c]: v === true }))}
                    />
                    {t(`conferencia.criterios.${c}`)}
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <Label>{t("conferencia.observacao")}</Label>
                <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
              </div>
            </div>
          )}

          {completa && !aguardaDecisao && <p className="text-sm text-muted-foreground">{t("conferencia.jaConferida")}</p>}

          {aguardaDecisao && (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>{t("conferencia.decisao")}</AlertDescription>
              </Alert>
              <Label>{t("conferencia.motivoReserva")}</Label>
              <Input value={motivoReserva} onChange={(e) => setMotivoReserva(e.target.value)} />
            </div>
          )}

          <DialogFooter className="gap-2">
            {aguardaDecisao && (
              <>
                <Button variant="destructive" onClick={() => setRejeitarAberto(true)}>
                  {t("recepcao.rejeitar")}
                </Button>
                <Button variant="secondary" disabled={!motivoReserva.trim() || aceitarReserva.isPending} onClick={aceitarComReserva}>
                  {t("recepcao.aceiteReserva")}
                </Button>
              </>
            )}
            {podeConferir && (
              <>
                <Button variant="outline" onClick={() => setRejeitarAberto(true)}>
                  {t("recepcao.rejeitar")}
                </Button>
                <Button disabled={mesmoTecnico || conferir.isPending} onClick={submeter}>
                  {t("conferencia.assinar")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejeicaoDialog
        amostra={amostra}
        open={rejeitarAberto}
        onOpenChange={(v) => {
          setRejeitarAberto(v);
          if (!v) onOpenChange(false);
        }}
      />
    </>
  );
}

function todosTrue(): CriteriosConferencia {
  return Object.fromEntries(CRITERIOS_CONFERENCIA.map((c) => [c, true])) as CriteriosConferencia;
}

/** Termo de Rejeição na recepção: critério + 2 assinaturas de responsáveis diferentes. */
export function RejeicaoDialog({
  amostra,
  open,
  onOpenChange,
}: {
  amostra: AmostraDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLabT();
  const { toast } = useToast();
  const { user } = useAuth();
  const rejeitar = useRejeitarNaRecepcao();
  const { data: criterios } = useCriteriosRejeicaoList();
  const { data: colegas } = useColegasLab();
  const [criterioId, setCriterioId] = useState("");
  const [assinatura, setAssinatura] = useState("");
  const [segundoId, setSegundoId] = useState("");
  const [assinaturaSegundo, setAssinaturaSegundo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [accao, setAccao] = useState("");

  useEffect(() => {
    if (open) {
      setCriterioId("");
      setAssinatura(user?.fullName ?? "");
      setSegundoId("");
      setAssinaturaSegundo("");
      setDetalhe("");
      setAccao("");
    }
  }, [open, user?.fullName]);

  const outros = useMemo(() => (colegas ?? []).filter((c) => c.id !== user?.id), [colegas, user?.id]);
  const valido = !!criterioId && !!assinatura.trim() && !!segundoId && !!assinaturaSegundo.trim();

  const confirmar = async () => {
    if (!amostra || !valido) return;
    try {
      await rejeitar.mutateAsync({
        amostraId: amostra.id,
        payload: {
          criterioRejeicaoId: criterioId,
          assinaturaResponsavel: assinatura.trim(),
          segundoResponsavelId: segundoId,
          assinaturaSegundo: assinaturaSegundo.trim(),
          detalhe: detalhe.trim() || null,
          accaoTomada: accao.trim() || null,
        },
      });
      toast({ title: t("rejeicao.ok") });
      onOpenChange(false);
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("rejeicao.title", { numero: amostra?.numero ?? "" })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("rejeicao.criterio")}</Label>
            <Select value={criterioId} onValueChange={setCriterioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(criterios ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.motivo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("rejeicao.assinatura")}</Label>
            <Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("rejeicao.segundo")}</Label>
            <Select value={segundoId} onValueChange={setSegundoId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outros.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t("rejeicao.assinaturaSegundo")}</Label>
            <Input value={assinaturaSegundo} onChange={(e) => setAssinaturaSegundo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("rejeicao.detalhe")}</Label>
            <Textarea rows={2} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("rejeicao.accao")}</Label>
            <Input value={accao} onChange={(e) => setAccao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" disabled={!valido || rejeitar.isPending} onClick={confirmar}>
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
