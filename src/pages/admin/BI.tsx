import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, TrendingUp, Wallet, Users, FlaskConical, Rabbit, Plane } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(140 55% 45%)", "hsl(45 90% 55%)", "hsl(175 55% 55%)", "hsl(220 70% 60%)", "hsl(260 60% 65%)", "hsl(0 70% 70%)"];

export default function BI() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    animals: 0, analyses: 0, missions: 0, employees: 0, projects: 0, publications: 0,
    revenueYTD: 0, expensesYTD: 0, budgetExec: 0,
    finMonthly: [] as any[], pubsByYear: [] as any[], staffByRole: [] as any[], harvestByCrop: [] as any[],
  });

  const load = async () => {
    setLoading(true);
    const year = new Date().getFullYear();
    const [an, la, ms, em, pj, pb, fi, hv, ur] = await Promise.all([
      supabase.from("animals").select("id", { count: "exact", head: true }),
      supabase.from("lab_analyses").select("id", { count: "exact", head: true }),
      supabase.from("missions").select("id", { count: "exact", head: true }).in("status", ["em_curso", "aprovada"]),
      supabase.from("employees").select("id", { count: "exact", head: true }),
      supabase.from("research_projects").select("id", { count: "exact", head: true }).in("status", ["em_curso", "aprovado"]),
      supabase.from("publications").select("year"),
      supabase.from("financial_transactions").select("type, amount, transaction_date"),
      supabase.from("harvests").select("quantity, field_id, crop_fields(crop_id, crops(name))"),
      supabase.from("user_roles").select("role"),
    ]);

    // Financeiro mensal
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, receita: 0, despesa: 0 }));
    let revYTD = 0, expYTD = 0;
    (fi.data || []).forEach((t: any) => {
      const d = new Date(t.transaction_date);
      if (d.getFullYear() !== year) return;
      const m = months[d.getMonth()];
      if (t.type === "receita") { m.receita += Number(t.amount); revYTD += Number(t.amount); }
      else if (t.type === "despesa") { m.despesa += Number(t.amount); expYTD += Number(t.amount); }
    });
    const finMonthly = months.map((m) => ({ name: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][m.month - 1], Receita: m.receita, Despesa: m.despesa }));

    // Publicações por ano
    const pubMap = new Map<number, number>();
    (pb.data || []).forEach((p: any) => { if (p.year) pubMap.set(p.year, (pubMap.get(p.year) || 0) + 1); });
    const pubsByYear = Array.from(pubMap.entries()).sort((a, b) => a[0] - b[0]).map(([y, c]) => ({ ano: String(y), publicações: c }));

    // RH por role
    const roleMap = new Map<string, number>();
    (ur.data || []).forEach((r: any) => roleMap.set(r.role, (roleMap.get(r.role) || 0) + 1));
    const staffByRole = Array.from(roleMap.entries()).map(([role, count]) => ({ name: role, value: count }));

    // Colheitas por cultura
    const cropMap = new Map<string, number>();
    (hv.data as any[] || []).forEach((h: any) => {
      const name = h.crop_fields?.crops?.name || "—";
      cropMap.set(name, (cropMap.get(name) || 0) + Number(h.quantity || 0));
    });
    const harvestByCrop = Array.from(cropMap.entries()).map(([name, qty]) => ({ name, quantidade: qty }));

    setData({
      animals: an.count || 0, analyses: la.count || 0, missions: ms.count || 0, employees: em.count || 0,
      projects: pj.count || 0, publications: (pb.data || []).length,
      revenueYTD: revYTD, expensesYTD: expYTD, budgetExec: 0,
      finMonthly, pubsByYear, staffByRole, harvestByCrop,
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Relatório Executivo BI — IIV", 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Gerado em ${new Date().toLocaleDateString("pt-PT")}`, 14, 25);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 32, head: [["Indicador", "Valor"]],
      body: [
        ["Efectivo animal", String(data.animals)],
        ["Análises laboratoriais", String(data.analyses)],
        ["Missões em curso", String(data.missions)],
        ["Colaboradores", String(data.employees)],
        ["Projectos I&D activos", String(data.projects)],
        ["Publicações totais", String(data.publications)],
        ["Receita YTD (AOA)", data.revenueYTD.toLocaleString("pt-PT")],
        ["Despesa YTD (AOA)", data.expensesYTD.toLocaleString("pt-PT")],
        ["Saldo YTD (AOA)", (data.revenueYTD - data.expensesYTD).toLocaleString("pt-PT")],
      ],
    });

    if (data.finMonthly.length) {
      autoTable(doc, {
        head: [["Mês", "Receita", "Despesa"]],
        body: data.finMonthly.map((m: any) => [m.name, m.Receita.toLocaleString("pt-PT"), m.Despesa.toLocaleString("pt-PT")]),
      });
    }

    doc.save(`bi-executivo-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "PDF exportado" });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={BarChart3} title="BI Institucional" description="Dashboards executivos e relatórios consolidados.">
        <Button onClick={exportPDF} variant="outline"><Download className="h-4 w-4 mr-1" /> Exportar PDF</Button>
      </AdminPageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <AdminCard variant="gradient-green-gold" icon={Rabbit} title="Efectivo" metric={data.animals} stagger={1} />
        <AdminCard variant="glass" icon={FlaskConical} title="Análises" metric={data.analyses} stagger={2} />
        <AdminCard variant="glass" icon={Plane} title="Missões activas" metric={data.missions} stagger={3} />
        <AdminCard variant="glass" icon={Users} title="Colaboradores" metric={data.employees} stagger={4} />
        <AdminCard variant="glass" icon={TrendingUp} title="Projectos I&D" metric={data.projects} stagger={5} />
        <AdminCard variant="glass" icon={Wallet} title="Saldo YTD" metric={`${((data.revenueYTD - data.expensesYTD) / 1_000_000).toFixed(1)}M`} stagger={6} />
      </div>

      <Tabs defaultValue="financeiro">
        <TabsList>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="rh">Recursos Humanos</TabsTrigger>
          <TabsTrigger value="investigacao">Investigação</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro">
          <AdminCard title="Receita vs Despesa (mensal)" loading={loading} isEmpty={!loading && data.finMonthly.every((m: any) => !m.Receita && !m.Despesa)} emptyMessage="Sem movimentos no ano corrente.">
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={data.finMonthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="Receita" fill={COLORS[0]} />
                  <Bar dataKey="Despesa" fill={COLORS[5]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="producao">
          <AdminCard title="Colheitas por cultura" loading={loading} isEmpty={!loading && data.harvestByCrop.length === 0} emptyMessage="Sem colheitas registadas.">
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={data.harvestByCrop}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="quantidade" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="rh">
          <AdminCard title="Colaboradores por perfil" loading={loading} isEmpty={!loading && data.staffByRole.length === 0} emptyMessage="Sem dados.">
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.staffByRole} dataKey="value" nameKey="name" outerRadius={120} label>
                    {data.staffByRole.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </TabsContent>

        <TabsContent value="investigacao">
          <AdminCard title="Publicações por ano" loading={loading} isEmpty={!loading && data.pubsByYear.length === 0} emptyMessage="Sem publicações.">
            <div className="h-80">
              <ResponsiveContainer>
                <LineChart data={data.pubsByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" /><YAxis allowDecimals={false} /><Tooltip />
                  <Line type="monotone" dataKey="publicações" stroke={COLORS[2]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
