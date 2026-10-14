import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Inbox, Microscope } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAccaoBi, useFilaArea, useMinhasAreas } from "@/hooks/queries/useLab";
import type { FilaAreaDto } from "@/types/dto/lab";
import { BiStatusBadge, errMsg, fmtDateTime, useLabT } from "./labShared";

type Grupo = "porReceber" | "emAnalise" | "emValidacao" | "validados";

/**
 * "A Minha Área" (DEF-002): fila de trabalho da área do técnico logado. O
 * BI não é processado sozinho — tem de ser explicitamente recebido por um
 * membro da equipa (o backend devolve 403 a quem não pertence à área).
 */
export default function AreaFila() {
  const { code } = useParams<{ code: string }>();
  const { t } = useLabT();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const { data: areas, isLoading: areasLoading } = useMinhasAreas();
  const { data: fila, isLoading } = useFilaArea(code);
  const accaoBi = useAccaoBi();
  const [grupo, setGrupo] = useState<Grupo>("porReceber");

  if (!code) {
    if (areasLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
    if (areas && areas.length > 0) return <Navigate to={`/admin/lab/area/${areas[0].code}`} replace />;
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={Microscope} title={t("area.title")} description={t("area.description")} />
        <Card><CardContent className="p-6 text-sm text-muted-foreground">{t("common.nenhumaArea")}</CardContent></Card>
      </div>
    );
  }

  const receber = async (id: string) => {
    try {
      await accaoBi.mutateAsync({ id, accao: "receber-na-area" });
      toast({ title: t("area.recebido") });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  const lista = (fila as FilaAreaDto | undefined)?.[grupo] ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Microscope} title={`${t("area.title")} — ${fila?.laboratorio?.name ?? code}`} description={t("area.description")}>
        {areas && areas.length > 1 && (
          <Select value={code} onValueChange={(c) => navigate(`/admin/lab/area/${c}`)}>
            <SelectTrigger className="w-56"><SelectValue placeholder={t("area.escolher")} /></SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.code}>{a.code} — {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </AdminPageHeader>

      <Tabs value={grupo} onValueChange={(v) => setGrupo(v as Grupo)}>
        <TabsList>
          {(["porReceber", "emAnalise", "emValidacao", "validados"] as const).map((g) => (
            <TabsTrigger key={g} value={g}>
              {t(`area.tabs.${g}`)} <Badge variant="secondary" className="ml-2">{fila?.[g]?.length ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BI</TableHead>
                <TableHead>{t("common.cliente")}</TableHead>
                <TableHead>{t("common.amostras")}</TableHead>
                <TableHead>{t("common.estado")}</TableHead>
                <TableHead>{t("common.prazo")}</TableHead>
                <TableHead className="text-right">{t("common.accoes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && lista.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              )}
              {lista.map((b) => {
                const atrasado = b.prazoEm && new Date(b.prazoEm) < new Date();
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-medium">{b.numero}</TableCell>
                    <TableCell>{b.requisicao?.clienteNome}</TableCell>
                    <TableCell className="text-xs">{(b.amostras ?? []).map((a) => a.codigoBarras ?? a.numero).join(", ")}</TableCell>
                    <TableCell><BiStatusBadge status={b.status} /></TableCell>
                    <TableCell className={atrasado ? "text-destructive" : ""}>{fmtDateTime(b.prazoEm)}</TableCell>
                    <TableCell className="space-x-1 text-right">
                      {b.status === "em_transito" && canWrite("lab-area") && (
                        <Button size="sm" disabled={accaoBi.isPending} onClick={() => receber(b.id)}>
                          <Inbox className="mr-1 h-3.5 w-3.5" /> {t("area.receber")}
                        </Button>
                      )}
                      {b.status !== "em_transito" && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/lab/bi/${b.id}`)}>
                          {t("area.abrir")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
