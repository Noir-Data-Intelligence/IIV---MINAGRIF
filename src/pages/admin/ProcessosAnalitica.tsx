import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, BarChart3, Timer, Workflow } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

interface ProcessRow {
  id: string; type_id: string; status: string; priority: string;
  opened_at: string; closed_at: string | null; due_date: string | null;
}
interface TypeRow { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  aberto: "hsl(48 96% 53%)",
  em_curso: "hsl(var(--primary))",
  concluido: "hsl(142 71% 45%)",
  cancelado: "hsl(var(--destructive))",
};
const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto", em_curso: "Em curso", concluido: "Concluído", cancelado: "Cancelado",
};

export default function ProcessosAnalitica() {
  const [rows, setRows] = useState<ProcessRow[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: t }] = await Promise.all([
        supabase.from("processes").select("id, type_id, status, priority, opened_at, closed_at, due_date"),
        supabase.from("process_types").select("id, name"),
      ]);
      setRows((p ?? []) as ProcessRow[]);
      setTypes((t ?? []) as TypeRow[]);
      setLoading(false);
    })();
  }, []);

  const typeName = (id: string) => types.find(t => t.id === id)?.name ?? "—";

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(r.status, (map.get(r.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v, key: k }));
  }, [rows]);

  const byTypeData = useMemo(() => {
    const map = new Map<string, { name: string; abertos: number; em_curso: number; concluidos: number; cancelados: number }>();
    rows.forEach(r => {
      const key = r.type_id;
      if (!map.has(key)) map.set(key, { name: typeName(key), abertos: 0, em_curso: 0, concluidos: 0, cancelados: 0 });
      const row = map.get(key)!;
      if (r.status === "aberto") row.abertos++;
      else if (r.status === "em_curso") row.em_curso++;
      else if (r.status === "concluido") row.concluidos++;
      else if (r.status === "cancelado") row.cancelados++;
    });
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, types]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; abertos: number; concluidos: number }>();
    rows.forEach(r => {
      const m = r.opened_at.slice(0, 7);
      if (!map.has(m)) map.set(m, { month: m, abertos: 0, concluidos: 0 });
      map.get(m)!.abertos++;
    });
    rows.filter(r => r.closed_at && r.status === "concluido").forEach(r => {
      const m = r.closed_at!.slice(0, 7);
      if (!map.has(m)) map.set(m, { month: m, abertos: 0, concluidos: 0 });
      map.get(m)!.concluidos++;
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [rows]);

  const avgCycleDays = useMemo(() => {
    const closed = rows.filter(r => r.closed_at && r.status === "concluido");
    if (closed.length === 0) return 0;
    const total = closed.reduce((sum, r) => {
      const ms = new Date(r.closed_at!).getTime() - new Date(r.opened_at).getTime();
      return sum + ms / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round((total / closed.length) * 10) / 10;
  }, [rows]);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = rows.filter(r => r.due_date && r.due_date < today && (r.status === "aberto" || r.status === "em_curso")).length;
  const slaCompliance = useMemo(() => {
    const closed = rows.filter(r => r.status === "concluido" && r.due_date && r.closed_at);
    if (closed.length === 0) return null;
    const ok = closed.filter(r => r.closed_at!.slice(0, 10) <= r.due_date!).length;
    return Math.round((ok / closed.length) * 100);
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader icon={BarChart3} title="Analítica de processos" />
        <AdminCard loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="mb-2">
          <Link to="/admin/processos"><ChevronLeft className="h-4 w-4" /> Voltar a processos</Link>
        </Button>
      </div>

      <AdminPageHeader
        icon={BarChart3}
        title="Analítica de processos"
        description="Indicadores de desempenho dos fluxos administrativos."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de processos", value: rows.length, tone: "text-primary" },
          { label: "Ciclo médio (dias)", value: avgCycleDays, tone: "text-secondary-foreground" },
          { label: "Cumprimento SLA", value: slaCompliance === null ? "—" : `${slaCompliance}%`, tone: "text-emerald-600 dark:text-emerald-400" },
          { label: "Em atraso", value: overdue, tone: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border/40 bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Distribuição por estado">
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLORS[d.key] ?? "hsl(var(--muted))"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard title="Evolução mensal (últimos 12 meses)">
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="abertos" stroke="hsl(var(--primary))" name="Abertos" />
                <Line type="monotone" dataKey="concluidos" stroke="hsl(142 71% 45%)" name="Concluídos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard title="Volume por tipo de processo" className="lg:col-span-2">
          {byTypeData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="abertos" stackId="a" fill={STATUS_COLORS.aberto} name="Abertos" />
                <Bar dataKey="em_curso" stackId="a" fill={STATUS_COLORS.em_curso} name="Em curso" />
                <Bar dataKey="concluidos" stackId="a" fill={STATUS_COLORS.concluido} name="Concluídos" />
                <Bar dataKey="cancelados" stackId="a" fill={STATUS_COLORS.cancelado} name="Cancelados" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Em atraso por tipo">
        {(() => {
          const map = new Map<string, number>();
          rows.filter(r => r.due_date && r.due_date < today && (r.status === "aberto" || r.status === "em_curso"))
            .forEach(r => map.set(r.type_id, (map.get(r.type_id) ?? 0) + 1));
          const list = Array.from(map.entries()).map(([k, v]) => ({ name: typeName(k), value: v }));
          return list.length === 0 ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" /> Sem processos em atraso.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map(l => (
                <li key={l.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Workflow className="h-4 w-4 text-muted-foreground" /> {l.name}</span>
                  <Badge variant="destructive">{l.value}</Badge>
                </li>
              ))}
            </ul>
          );
        })()}
      </AdminCard>
    </div>
  );
}
