import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Plus, Pencil, Trash2, BookOpen, Users, Microscope } from "lucide-react";

interface Line { id: string; name: string; area: string | null; description: string | null; status: string }
interface Project { id: string; line_id: string | null; title: string; objectives: string | null; status: string; start_date: string | null; end_date: string | null; funding_source: string | null; funding_amount: number | null; partners: string | null }
interface Publication { id: string; project_id: string | null; type: string; title: string; authors: any; year: number | null; venue: string | null; doi: string | null; url: string | null; created_by: string | null }

export default function Investigacao() {
  const { user } = useAuth();
  const { canWrite } = useUserRole();
  const { toast } = useToast();
  const canEdit = canWrite("investigacao");

  const [tab, setTab] = useState("projetos");
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);

  const [lineOpen, setLineOpen] = useState(false);
  const [lineEdit, setLineEdit] = useState<Line | null>(null);
  const [projOpen, setProjOpen] = useState(false);
  const [projEdit, setProjEdit] = useState<Project | null>(null);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubEdit, setPubEdit] = useState<Publication | null>(null);
  const [del, setDel] = useState<{ table: string; id: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [l, p, pb] = await Promise.all([
      supabase.from("research_lines").select("*").order("name"),
      supabase.from("research_projects").select("*").order("created_at", { ascending: false }),
      supabase.from("publications").select("*").order("year", { ascending: false }).limit(300),
    ]);
    if (l.data) setLines(l.data as Line[]);
    if (p.data) setProjects(p.data as Project[]);
    if (pb.data) setPubs(pb.data as Publication[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => ({
    activeProjects: projects.filter((p) => p.status === "em_curso" || p.status === "aprovado").length,
    pubsThisYear: pubs.filter((p) => p.year === new Date().getFullYear()).length,
    dois: pubs.filter((p) => !!p.doi).length,
    lines: lines.length,
  }), [projects, pubs, lines]);

  const saveLine = async (f: Partial<Line>) => {
    if (!f.name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    const payload = { name: f.name, area: f.area || null, description: f.description || null, status: f.status || "activa", ...(lineEdit ? {} : { created_by: user?.id }) };
    const { error } = lineEdit
      ? await supabase.from("research_lines").update(payload).eq("id", lineEdit.id)
      : await supabase.from("research_lines").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: lineEdit ? "Linha actualizada" : "Linha criada" });
    setLineOpen(false); setLineEdit(null); load();
  };

  const saveProj = async (f: Partial<Project>) => {
    if (!f.title) return toast({ title: "Título obrigatório", variant: "destructive" });
    const payload = {
      title: f.title, line_id: f.line_id || null, objectives: f.objectives || null,
      start_date: f.start_date || null, end_date: f.end_date || null,
      funding_source: f.funding_source || null, funding_amount: f.funding_amount || null,
      partners: f.partners || null, status: f.status || "proposto",
      ...(projEdit ? {} : { created_by: user?.id }),
    };
    const { error } = projEdit
      ? await supabase.from("research_projects").update(payload).eq("id", projEdit.id)
      : await supabase.from("research_projects").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: projEdit ? "Projecto actualizado" : "Projecto criado" });
    setProjOpen(false); setProjEdit(null); load();
  };

  const savePub = async (f: Partial<Publication> & { authorsText?: string }) => {
    if (!f.title) return toast({ title: "Título obrigatório", variant: "destructive" });
    const authors = (f.authorsText || "").split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: f.title, type: f.type || "artigo", year: f.year || null, venue: f.venue || null,
      doi: f.doi || null, url: f.url || null, project_id: f.project_id || null,
      authors, ...(pubEdit ? {} : { created_by: user?.id }),
    };
    const { error } = pubEdit
      ? await supabase.from("publications").update(payload).eq("id", pubEdit.id)
      : await supabase.from("publications").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: pubEdit ? "Publicação actualizada" : "Publicação criada" });
    setPubOpen(false); setPubEdit(null); load();
  };

  const confirmDelete = async () => {
    if (!del) return;
    const { error } = await supabase.from(del.table as any).delete().eq("id", del.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Removido" });
    setDel(null); load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Microscope} title="Investigação & Publicações" description="Linhas de pesquisa, projectos de I&D e produção científica." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminCard variant="gradient-green-gold" icon={FlaskConical} title="Linhas activas" metric={kpis.lines} stagger={1} />
        <AdminCard variant="glass" icon={Microscope} title="Projectos activos" metric={kpis.activeProjects} stagger={2} />
        <AdminCard variant="glass" icon={BookOpen} title={`Publicações ${new Date().getFullYear()}`} metric={kpis.pubsThisYear} stagger={3} />
        <AdminCard variant="glass" icon={BookOpen} title="DOIs registados" metric={kpis.dois} stagger={4} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="projetos">Projectos</TabsTrigger>
          <TabsTrigger value="linhas">Linhas de Pesquisa</TabsTrigger>
          <TabsTrigger value="publicacoes">Publicações</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos">
          <AdminCard title="Projectos de I&D" loading={loading} isEmpty={!loading && projects.length === 0} emptyMessage="Sem projectos.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setProjEdit(null); setProjOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Projecto</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Título</TableHead><TableHead>Linha</TableHead><TableHead>Período</TableHead>
                <TableHead>Financiamento</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{lines.find((l) => l.id === p.line_id)?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{p.start_date ?? "?"} → {p.end_date ?? "?"}</TableCell>
                    <TableCell className="text-xs">{p.funding_source ?? "—"}{p.funding_amount ? ` (${Number(p.funding_amount).toLocaleString()} AOA)` : ""}</TableCell>
                    <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setProjEdit(p); setProjOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel({ table: "research_projects", id: p.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="linhas">
          <AdminCard title="Linhas de Pesquisa" loading={loading} isEmpty={!loading && lines.length === 0} emptyMessage="Sem linhas.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setLineEdit(null); setLineOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Linha</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Área</TableHead><TableHead>Descrição</TableHead><TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.area ?? "—"}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">{l.description ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setLineEdit(l); setLineOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel({ table: "research_lines", id: l.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>

        <TabsContent value="publicacoes">
          <AdminCard title="Publicações" loading={loading} isEmpty={!loading && pubs.length === 0} emptyMessage="Sem publicações.">
            <div className="flex justify-end mb-3">
              {canEdit && <Button size="sm" onClick={() => { setPubEdit(null); setPubOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Nova Publicação</Button>}
            </div>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Ano</TableHead>
                <TableHead>Revista/Evento</TableHead><TableHead>DOI</TableHead>
                {canEdit && <TableHead className="w-24">Acções</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {pubs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-sm truncate">{p.title}</TableCell>
                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                    <TableCell>{p.year ?? "—"}</TableCell>
                    <TableCell className="text-xs">{p.venue ?? "—"}</TableCell>
                    <TableCell className="text-xs">{p.doi ? <a href={p.url || `https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{p.doi}</a> : "—"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setPubEdit(p); setPubOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDel({ table: "publications", id: p.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminCard>
        </TabsContent>
      </Tabs>

      <LineDialog open={lineOpen} onOpenChange={(v) => { setLineOpen(v); if (!v) setLineEdit(null); }} row={lineEdit} onSave={saveLine} />
      <ProjectDialog open={projOpen} onOpenChange={(v) => { setProjOpen(v); if (!v) setProjEdit(null); }} row={projEdit} lines={lines} onSave={saveProj} />
      <PubDialog open={pubOpen} onOpenChange={(v) => { setPubOpen(v); if (!v) setPubEdit(null); }} row={pubEdit} projects={projects} onSave={savePub} />
      <DeleteConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Remover?" description="Esta acção é permanente." onConfirm={confirmDelete} />
    </div>
  );
}

function LineDialog({ open, onOpenChange, row, onSave }: any) {
  const [f, setF] = useState<Partial<Line>>({});
  useEffect(() => { setF(row ?? { status: "activa" }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Linha" : "Nova Linha"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Área</Label><Input value={f.area || ""} onChange={(e) => setF({ ...f, area: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Estado</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="suspensa">Suspensa</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialog({ open, onOpenChange, row, lines, onSave }: any) {
  const [f, setF] = useState<Partial<Project>>({});
  useEffect(() => { setF(row ?? { status: "proposto" }); }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Projecto" : "Novo Projecto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={f.title || ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Linha de Pesquisa</Label>
              <Select value={f.line_id || ""} onValueChange={(v) => setF({ ...f, line_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{lines.map((l: Line) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Estado</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposto">Proposto</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_curso">Em curso</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data de Início</Label><Input type="date" value={f.start_date || ""} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></div>
            <div><Label>Data de Fim</Label><Input type="date" value={f.end_date || ""} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></div>
            <div><Label>Fonte de Financiamento</Label><Input value={f.funding_source || ""} onChange={(e) => setF({ ...f, funding_source: e.target.value })} /></div>
            <div><Label>Montante (AOA)</Label><Input type="number" value={f.funding_amount ?? ""} onChange={(e) => setF({ ...f, funding_amount: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Objectivos</Label><Textarea value={f.objectives || ""} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></div>
          <div><Label>Parceiros</Label><Input value={f.partners || ""} onChange={(e) => setF({ ...f, partners: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PubDialog({ open, onOpenChange, row, projects, onSave }: any) {
  const [f, setF] = useState<any>({});
  useEffect(() => {
    setF(row ? { ...row, authorsText: Array.isArray(row.authors) ? row.authors.join(", ") : "" } : { type: "artigo", year: new Date().getFullYear() });
  }, [row, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{row ? "Editar Publicação" : "Nova Publicação"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={f.title || ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="artigo">Artigo</SelectItem>
                  <SelectItem value="comunicacao">Comunicação</SelectItem>
                  <SelectItem value="livro">Livro</SelectItem>
                  <SelectItem value="tese">Tese</SelectItem>
                  <SelectItem value="relatorio">Relatório</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ano</Label><Input type="number" value={f.year ?? ""} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Autores (separados por vírgula)</Label><Input value={f.authorsText || ""} onChange={(e) => setF({ ...f, authorsText: e.target.value })} /></div>
            <div className="col-span-2"><Label>Revista/Evento</Label><Input value={f.venue || ""} onChange={(e) => setF({ ...f, venue: e.target.value })} /></div>
            <div><Label>DOI</Label><Input value={f.doi || ""} onChange={(e) => setF({ ...f, doi: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={f.url || ""} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
            <div className="col-span-2"><Label>Projecto associado</Label>
              <Select value={f.project_id || ""} onValueChange={(v) => setF({ ...f, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{projects.map((p: Project) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
