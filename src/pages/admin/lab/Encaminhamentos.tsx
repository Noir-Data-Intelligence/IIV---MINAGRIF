import { useState } from "react";
import { Link } from "react-router-dom";
import { Route, Send } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAccaoBi, useEncaminhamentos } from "@/hooks/queries/useLab";
import type { BoletimStatus } from "@/types/dto/boletim";
import type { BoletimInternoLabDto } from "@/types/dto/lab";
import { BiStatusBadge, errMsg, fmtDateTime, useLabT } from "./labShared";

/** Colunas do quadro — agrupam os estados do BI pela sua localização física. */
const COLUNAS: Record<string, BoletimStatus[]> = {
  gerado: ["gerado"],
  em_transito: ["em_transito"],
  na_area: ["recebido_area", "em_analise", "resultado_registado", "em_validacao", "validado"],
  de_volta: ["devolvido", "recebido_cgisc"],
  terminado: ["emitido", "rejeitado_na_area"],
};

/**
 * Encaminhamentos (DEF-002): quadro por área da circulação física dos BI
 * entre a CGISC e as áreas. Só a CGISC encaminha; a recepção na área é
 * feita pela equipa da área em "A Minha Área". NÃO é a "Distribuição" de
 * vacinas (módulo Produção).
 */
export default function Encaminhamentos() {
  const { t } = useLabT();
  const { toast } = useToast();
  const { canWrite } = useUserRole();
  const [area, setArea] = useState<string>("todas");
  // Filtro de área no cliente: a Recepção não tem (nem precisa de) acesso ao módulo `laboratorios`.
  const { data, isLoading } = useEncaminhamentos({ page: 1, perPage: 500 });
  const accaoBi = useAccaoBi();
  const todos = data?.data ?? [];
  const codigos = [...new Set(todos.map((b) => b.laboratorio?.code).filter((c): c is string => !!c))].sort();
  const bis = area === "todas" ? todos : todos.filter((b) => b.laboratorio?.code === area);

  const encaminhar = async (bi: BoletimInternoLabDto) => {
    try {
      await accaoBi.mutateAsync({ id: bi.id, accao: "encaminhar" });
      toast({ title: t("recepcao.encaminhados") });
    } catch (e) {
      toast({ title: errMsg(e, t("common.error")), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Route} title={t("encaminhamentos.title")} description={t("encaminhamentos.description")}>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("encaminhamentos.todas")}</SelectItem>
            {codigos.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminPageHeader>

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Object.entries(COLUNAS).map(([col, estados]) => {
          const lista = bis.filter((b) => estados.includes(b.status));
          return (
            <Card key={col} className="bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  {t(`encaminhamentos.colunas.${col}`)} <Badge variant="secondary">{lista.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lista.length === 0 && <p className="text-xs text-muted-foreground">{t("common.empty")}</p>}
                {lista.map((b) => (
                  <div key={b.id} className="space-y-1 rounded-md border bg-background p-2 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-semibold">{b.numero}</span>
                      <Badge variant="outline">{b.laboratorio?.code}</Badge>
                    </div>
                    <div className="text-muted-foreground">{b.requisicao?.clienteNome}</div>
                    <div className="flex items-center justify-between">
                      <BiStatusBadge status={b.status} />
                      <span className="text-muted-foreground">{t("common.prazo")}: {fmtDateTime(b.prazoEm)}</span>
                    </div>
                    <div className="flex gap-1 pt-1">
                      {b.status === "gerado" && canWrite("lab-recepcao") && (
                        <Button size="sm" className="h-7" disabled={accaoBi.isPending} onClick={() => encaminhar(b)}>
                          <Send className="mr-1 h-3 w-3" /> {t("encaminhamentos.encaminhar")}
                        </Button>
                      )}
                      {b.requisicaoId && (
                        <Button size="sm" variant="ghost" className="h-7" asChild>
                          <Link to={`/admin/lab/processos/${b.requisicaoId}`}>{t("common.ver")}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
