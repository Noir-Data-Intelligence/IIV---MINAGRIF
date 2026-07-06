import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { TablePagination } from "@/components/admin/TablePagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { MessageSquare, Trash2, Eye, Check, Mail } from "lucide-react";

interface Message {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  lida: boolean;
  respondida: boolean;
  created_at: string;
}

export default function MensagensAdmin() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<Message | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const pag = usePagination(20);

  const fetchData = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(pag.from, pag.to);
    setItems((data as Message[]) ?? []);
    pag.setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pag.page, pag.pageSize]);

  const openView = async (m: Message) => {
    setView(m);
    if (!m.lida) {
      await supabase.from("contact_messages").update({ lida: true }).eq("id", m.id);
      fetchData();
    }
  };

  const markResponded = async (id: string) => {
    await supabase.from("contact_messages").update({ respondida: true }).eq("id", id);
    toast({ title: "Marcada como respondida" });
    fetchData();
    setView(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("contact_messages").delete().eq("id", deleteId);
    toast({ title: "Mensagem eliminada" });
    setDeleteId(null);
    fetchData();
  };

  const unread = items.filter((i) => !i.lida).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={MessageSquare}
        title="Mensagens de Contacto"
        description={`${pag.total} mensagens • ${unread} por ler nesta página`}
      />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">{view?.assunto}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">De</p>
                  <p className="font-medium">{view.nome}</p>
                  <a href={`mailto:${view.email}`} className="text-primary hover:underline text-xs">{view.email}</a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Recebida</p>
                  <p className="font-medium">{new Date(view.created_at).toLocaleString("pt-AO")}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Mensagem</p>
                <div className="rounded-xl border border-border/60 bg-accent/20 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {view.mensagem}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline">
                  <a href={`mailto:${view.email}?subject=Re: ${encodeURIComponent(view.assunto)}`}>
                    <Mail className="mr-2 h-4 w-4" /> Responder por email
                  </a>
                </Button>
                {!view.respondida && (
                  <Button onClick={() => markResponded(view.id)}>
                    <Check className="mr-2 h-4 w-4" /> Marcar como respondida
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdminCard
        title="Caixa de entrada"
        icon={MessageSquare}
        loading={loading}
        isEmpty={items.length === 0 && pag.total === 0}
        emptyMessage="Ainda não há mensagens recebidas."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id} className={!m.lida ? "font-medium" : ""}>
                <TableCell>
                  {m.respondida ? (
                    <Badge variant="outline" className="border-primary/30 text-primary">Respondida</Badge>
                  ) : m.lida ? (
                    <Badge variant="outline">Lida</Badge>
                  ) : (
                    <Badge className="bg-[hsl(var(--iiv-gold))] text-primary">Nova</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div>{m.nome}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </TableCell>
                <TableCell className="max-w-md truncate">{m.assunto}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString("pt-AO")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openView(m)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={pag.total}
          totalPages={pag.totalPages}
          canPrev={pag.canPrev}
          canNext={pag.canNext}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
        />
      </AdminCard>
    </div>
  );
}
