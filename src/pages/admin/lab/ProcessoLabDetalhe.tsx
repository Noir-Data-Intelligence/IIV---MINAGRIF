import { Link, useParams } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";
import { useProcessoLab, useRecepcaoList } from "@/hooks/queries/useLab";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AmostraStatusBadge, BiStatusBadge, RequisicaoStatusBadge, fmtDateTime, useLabT } from "./labShared";

/**
 * Consulta do processo laboratorial (só leitura) — substitui a antiga
 * `RequisicaoDetalhe.tsx`, que fazia o fluxo inteiro numa só página. Mostra
 * amostras, conferências, exames pedidos, BI/BA e a timeline de
 * rastreabilidade (`amostra_movimentos`). Sem botões de workflow.
 */
export default function ProcessoLabDetalhe() {
  const { id } = useParams<{ id: string }>();
  return id ? <Detalhe id={id} /> : <ListaProcessos />;
}

/** Lista de consulta de todos os processos (só leitura). */
function ListaProcessos() {
  const { t } = useLabT();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useRecepcaoList({ page: 1, perPage: 200, search: search || undefined });
  return (
    <div className="space-y-6">
      <AdminPageHeader icon={History} title={t("menu.processos")} description={t("processo.description")} />
      <Input className="max-w-xs" placeholder={t("recepcao.pesquisar")} value={search} onChange={(e) => setSearch(e.target.value)} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.pat")}</TableHead>
                <TableHead>{t("common.cliente")}</TableHead>
                <TableHead>{t("common.areas")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead>{t("common.entrada")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5} className="text-center">{t("common.loading")}</TableCell></TableRow>}
              {(data?.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">
                    <Link className="hover:underline" to={`/admin/lab/processos/${r.id}`}>{r.patNumero ?? r.numero}</Link>
                  </TableCell>
                  <TableCell>{r.clienteNome}</TableCell>
                  <TableCell>{(r.areas ?? []).map((a) => <Badge key={a} variant="outline" className="mr-1">{a}</Badge>)}</TableCell>
                  <TableCell><RequisicaoStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-xs">{fmtDateTime(r.entregueEm ?? r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Detalhe({ id }: { id: string }) {
  const { t } = useLabT();
  const { canView } = useUserRole();
  const { data, isLoading } = useProcessoLab(id);

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  const r = data.requisicao;
  const numeroAmostra = (amostraId: string) => {
    const a = r.amostras?.find((x) => x.id === amostraId);
    return a?.codigoBarras ?? a?.numero ?? amostraId;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={History} title={`${t("processo.title")} ${r.patNumero ?? r.numero}`} description={t("processo.description")}>
        {canView("lab-recepcao") && (
          <Button variant="ghost" asChild>
            <Link to="/admin/lab/recepcao"><ArrowLeft className="mr-1 h-4 w-4" /> {t("common.voltar")}</Link>
          </Button>
        )}
      </AdminPageHeader>

      <Card>
        <CardContent className="grid gap-3 p-4 text-sm md:grid-cols-4">
          <Info label={t("common.estado")}><RequisicaoStatusBadge status={r.status} /></Info>
          <Info label={t("common.requisicao")}>{r.numero}</Info>
          <Info label={t("common.cliente")}>{r.clienteNome}</Info>
          <Info label={t("wizard.origemTipo")}>{r.origemTipo ? t(`wizard.origem.${r.origemTipo}`) : "—"}</Info>
          <Info label={t("wizard.veterinario")}>{r.veterinarioResponsavel ?? "—"}</Info>
          <Info label={t("wizard.entreguePor")}>{r.entreguePor ?? "—"} · {fmtDateTime(r.entregueEm)}</Info>
          <Info label={t("processo.termoEntrega")}>
            {r.provenienciaLocal ? "—" : `${r.termoEntregaNumero ?? ""} (${r.termoEntregaAssinadoPor ?? ""})`}
          </Info>
          <Info label={t("common.areas")}>
            {(r.areas ?? []).map((a) => <Badge key={a} variant="outline" className="mr-1">{a}</Badge>)}
          </Info>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("common.amostras")} / {t("processo.conferencias")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("wizard.tipoAmostra")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead>{t("processo.conferencias")}</TableHead>
                <TableHead>Local</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(r.amostras ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.codigoBarras ?? a.numero}</TableCell>
                  <TableCell>{t(`tipoAmostra.${a.tipoAmostra}`)}</TableCell>
                  <TableCell>
                    <AmostraStatusBadge status={a.status} />
                    {a.reservaMotivo && <div className="text-xs text-muted-foreground">{a.reservaMotivo}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {(a.conferencias ?? []).map((c) => (
                      <div key={c.id}>
                        {c.ordem}ª — {c.tecnicoNome ?? c.tecnicoId}: {c.conforme ? t("conferencia.conforme") : t("conferencia.naoConforme")}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-xs">{a.localizacaoActual ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("processo.boletins")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BI</TableHead>
                <TableHead>{t("common.area")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead>{t("accoesMov.validada")}</TableHead>
                <TableHead>BA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(r.boletinsInternos ?? []).map((b) => {
                const ba = (r.boletinsAnalises ?? []).find((x) => x.boletimInternoId === b.id);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">
                      {canView("lab-area") ? <Link className="hover:underline" to={`/admin/lab/bi/${b.id}`}>{b.numero}</Link> : b.numero}
                    </TableCell>
                    <TableCell><Badge variant="outline">{b.laboratorio?.code}</Badge></TableCell>
                    <TableCell><BiStatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-xs">{(b.validacoes ?? []).map((v) => v.validadorNome ?? v.validadorId).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {ba?.numero ?? "—"} {ba?.emitidoEm && `· ${fmtDateTime(ba.emitidoEm)}`}
                      {ba?.entregueEm && <div>{t("emissao.entregue", { data: fmtDateTime(ba.entregueEm), canal: ba.canalEntrega ?? "" })}</div>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("processo.timeline")}</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2 border-l pl-4">
            {data.movimentos.map((m) => (
              <li key={m.id} className="text-sm">
                <span className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</span>{" "}
                <span className="font-mono text-xs">{numeroAmostra(m.amostraId)}</span>{" "}
                <strong>{t(`accoesMov.${m.accao}`, { defaultValue: m.accao })}</strong>
                {(m.deLocal || m.paraLocal) && (
                  <span className="text-muted-foreground"> · {m.deLocal ?? "—"} → {m.paraLocal ?? "—"}</span>
                )}
                {m.userNome && <span className="text-muted-foreground"> · {m.userNome}</span>}
                {m.observacao && <div className="text-xs text-muted-foreground">{m.observacao}</div>}
              </li>
            ))}
            {data.movimentos.length === 0 && <li className="text-sm text-muted-foreground">{t("common.empty")}</li>}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
