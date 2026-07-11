/**
 * Estado "sem dados" consistente para sobrepor a um gráfico vazio, usado por todos os
 * dashboards (Dashboard admin, PainelDetalhe, Processos/ProcessosAnalitica, BI.tsx).
 * Ficheiro autocontido — não importa de src/components/states/ (pode não existir ainda).
 *
 * Uso:
 *   {data.length > 0 ? (
 *     <ChartContainer config={config}>...</ChartContainer>
 *   ) : (
 *     <NoDataOverlay />
 *   )}
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface NoDataOverlayProps {
  /** Mensagem principal (default: "Sem dados disponíveis"). */
  message?: string;
  /** Texto secundário opcional, ex: sugestão de ação ou período em falta. */
  description?: string;
  /** Altura do bloco — deve normalmente igualar a altura do gráfico que substitui. */
  height?: number | string;
  className?: string;
}

export function NoDataOverlay({
  message = "Sem dados disponíveis",
  description,
  height = 280,
  className,
}: NoDataOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center",
        className,
      )}
      style={{ height }}
      role="status"
    >
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
