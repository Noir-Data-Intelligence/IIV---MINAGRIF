/**
 * Preset visual partilhado para todos os gráficos recharts do portal IIV/MINAGRIF.
 *
 * NÃO reimplementa o `ChartContainer` — esse já existe e está completo em
 * `@/components/ui/chart` (shadcn: ChartContainer, ChartTooltip, ChartTooltipContent,
 * ChartLegend, ChartLegendContent). Este ficheiro só acrescenta a paleta de cores
 * (`--chart-1`..`--chart-5` definidas em src/index.css), tipografia/tamanhos de eixo
 * consistentes e formatação de números em pt-AO.
 *
 * Uso típico num gráfico recharts:
 *
 *   import { ChartContainer } from "@/components/ui/chart";
 *   import { chartColors, buildChartConfig, axisTickStyle, formatAxisNumber } from "@/components/charts";
 *
 *   const config = buildChartConfig(["total", "distribuido"]); // -> ChartConfig com --chart-1, --chart-2...
 *
 *   <ChartContainer config={config} className="h-[280px] w-full">
 *     <BarChart data={data}>
 *       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
 *       <XAxis dataKey="month" tick={axisTickStyle} />
 *       <YAxis allowDecimals={false} tick={axisTickStyle} tickFormatter={formatAxisNumber} />
 *       <Bar dataKey="total" fill={chartColors[0]} radius={[6, 6, 0, 0]} />
 *     </BarChart>
 *   </ChartContainer>
 */
import type { ChartConfig } from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";

/** As 5 cores categóricas do tema (var(--chart-1)..(--chart-5) de src/index.css), já em `hsl()`. */
export const chartColors: readonly string[] = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

/** Devolve uma cor da paleta por índice, com fallback cíclico para séries além das 5 base. */
export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}

/** Tipografia/tamanho consistente para labels de eixos e legendas recharts. */
export const chartTypography = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  axisFontSize: 12,
  legendFontSize: 12,
} as const;

/** Estilo pronto a passar em `<XAxis tick={axisTickStyle} />` / `<YAxis tick={axisTickStyle} />`. */
export const axisTickStyle = {
  fill: "hsl(var(--muted-foreground))",
  fontSize: chartTypography.axisFontSize,
  fontFamily: chartTypography.fontFamily,
} as const;

/** Estilo do wrapper da legenda recharts (`<Legend wrapperStyle={legendWrapperStyle} />`). */
export const legendWrapperStyle = {
  fontSize: chartTypography.legendFontSize,
  fontFamily: chartTypography.fontFamily,
} as const;

/**
 * Constrói um `ChartConfig` (tipo do shadcn `ChartContainer`) a partir de uma lista de séries,
 * atribuindo automaticamente uma cor da paleta a cada uma, por ordem.
 *
 * Ex: buildChartConfig(["total"], { total: "Análises" })
 *  -> { total: { label: "Análises", color: "hsl(var(--chart-1))" } }
 */
export function buildChartConfig(
  keys: string[],
  labels?: Record<string, React.ReactNode>,
): ChartConfig {
  const config: ChartConfig = {};
  keys.forEach((key, i) => {
    config[key] = {
      label: labels?.[key] ?? key,
      color: getChartColor(i),
    };
  });
  return config;
}

/** Formata um número no eixo/tooltip do gráfico, em pt-AO (via helper central de src/lib/format.ts). */
export function formatAxisNumber(value: number): string {
  return formatNumber(value);
}

/** Formata um número de forma compacta (ex: 1200 -> "1,2 mil"), útil em eixos com valores grandes. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-AO", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
