import { usePublicStats } from "@/hooks/queries/usePublicStats";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat { value: string; label: string; }

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")}k+`;
  return `${n}+`;
}

export function LiveStats() {
  const { data, isLoading } = usePublicStats();

  const stats: Stat[] = data
    ? [
        { value: `${data.anosExperiencia}+`, label: "Anos de experiência" },
        { value: String(data.produtosPortfolio), label: "Produtos no portfólio" },
        {
          value: data.dosesProduzidas > 0 ? formatNumber(data.dosesProduzidas) : "—",
          label: "Doses produzidas",
        },
        { value: String(data.estacoesRegionais), label: "Estações regionais" },
      ]
    : [];

  return (
    <section className="relative -mt-14 z-20">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl shadow-elevated overflow-hidden border border-border/60">
          {isLoading || stats.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card text-center py-8 px-4 space-y-2">
                  <Skeleton className="h-9 w-20 mx-auto" />
                  <Skeleton className="h-3 w-28 mx-auto" />
                </div>
              ))
            : stats.map((s) => (
                <div key={s.label} className="bg-card text-center py-8 px-4">
                  <p className="font-serif text-3xl md:text-4xl text-primary">{s.value}</p>
                  <p className="kicker mt-2 text-muted-foreground">{s.label}</p>
                </div>
              ))}
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--iiv-gold))] mr-2 animate-pulse" />
          Dados actualizados em tempo real
        </p>
      </div>
    </section>
  );
}
