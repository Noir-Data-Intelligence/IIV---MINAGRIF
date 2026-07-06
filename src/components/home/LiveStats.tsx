import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat { value: string; label: string; }

const ANO_FUNDACAO = 1965;

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")}k+`;
  return `${n}+`;
}

export function LiveStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);

  const fetchStats = async () => {
    const [prodRes, batchRes, statRes, audRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("production_batches").select("quantity_produced"),
      supabase.from("stations").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("quality_audits").select("id", { count: "exact", head: true }).eq("status", "concluida"),
    ]);

    const totalDoses = (batchRes.data ?? []).reduce((sum, b: any) => sum + (b.quantity_produced ?? 0), 0);
    const anos = new Date().getFullYear() - ANO_FUNDACAO;

    setStats([
      { value: `${anos}+`, label: "Anos de experiência" },
      { value: String(prodRes.count ?? 0), label: "Produtos no portfólio" },
      { value: totalDoses > 0 ? formatNumber(totalDoses) : "—", label: "Doses produzidas" },
      { value: String(statRes.count ?? 0), label: "Estações regionais" },
    ]);
    setLoading(false);
    void audRes;
  };

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("public-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "production_batches" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "quality_audits" }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="relative -mt-14 z-20">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl shadow-elevated overflow-hidden border border-border/60">
          {loading
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
