import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";
import type { ApiError } from "@/lib/http";
import ptLab from "@/i18n/locales/pt/admin/lab.json";
import enLab from "@/i18n/locales/en/admin/lab.json";
import type { BoletimStatus } from "@/types/dto/boletim";
import type { AmostraStatus } from "@/types/dto/amostra";
import type { RequisicaoStatus } from "@/types/dto/lab";

/**
 * Peças partilhadas pelas páginas do Laboratório por fase (Recepção,
 * Encaminhamentos, A Minha Área, Emissão, Processo, Catálogo): bundle i18n
 * `admin-lab`, badges de estado e mensagem de erro da API.
 */
if (!i18n.hasResourceBundle("pt", "admin-lab")) i18n.addResourceBundle("pt", "admin-lab", ptLab, true, true);
if (!i18n.hasResourceBundle("en", "admin-lab")) i18n.addResourceBundle("en", "admin-lab", enLab, true, true);

export function useLabT() {
  return useTranslation("admin-lab");
}

type Variant = "default" | "secondary" | "destructive" | "outline";

const BI_VARIANT: Partial<Record<BoletimStatus, Variant>> = {
  gerado: "outline",
  em_transito: "secondary",
  validado: "default",
  emitido: "default",
  rejeitado_na_area: "destructive",
};

const REQ_VARIANT: Partial<Record<RequisicaoStatus, Variant>> = {
  rejeitada: "destructive",
  emitida: "default",
  encerrada: "secondary",
};

const AMOSTRA_VARIANT: Partial<Record<AmostraStatus, Variant>> = {
  rejeitada: "destructive",
  aceite: "default",
  aceite_com_reserva: "secondary",
  concluida: "secondary",
};

export function BiStatusBadge({ status }: { status: BoletimStatus }) {
  const { t } = useLabT();
  return <Badge variant={BI_VARIANT[status] ?? "outline"}>{t(`statusBi.${status}`)}</Badge>;
}

export function RequisicaoStatusBadge({ status }: { status: RequisicaoStatus }) {
  const { t } = useLabT();
  return <Badge variant={REQ_VARIANT[status] ?? "outline"}>{t(`statusRequisicao.${status}`)}</Badge>;
}

export function AmostraStatusBadge({ status }: { status: AmostraStatus }) {
  const { t } = useLabT();
  return <Badge variant={AMOSTRA_VARIANT[status] ?? "outline"}>{t(`statusAmostra.${status}`)}</Badge>;
}

/** Mensagem legível de um erro da API (422 do Laravel: primeira mensagem de campo). */
export function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> | undefined;
  const campo = err?.fieldErrors ? Object.values(err.fieldErrors)[0] : undefined;
  return campo || err?.message || fallback;
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(i18n.language === "en" ? "en-GB" : "pt-PT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export const TIPOS_AMOSTRA = ["sangue", "soro", "fezes", "urina", "zaragatoa", "tecido", "leite", "agua", "outro"] as const;

export const CRITERIOS_CONFERENCIA = [
  "crit_identificacao",
  "crit_quantidade",
  "crit_conservacao",
  "crit_macroscopica",
  "crit_caracteristicas_fisicas",
  "crit_tempo_colheita",
] as const;
