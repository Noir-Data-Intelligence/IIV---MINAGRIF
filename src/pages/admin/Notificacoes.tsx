import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/admin/TablePagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { cn } from "@/lib/utils";

type NotificationType = "info" | "sucesso" | "aviso" | "erro";
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeMeta: Record<NotificationType, { icon: any; color: string; bg: string; label: string }> = {
  info:    { icon: Info,          color: "text-sky-600",     bg: "bg-sky-500/10",    label: "Informação" },
  sucesso: { icon: CheckCircle2,  color: "text-primary",     bg: "bg-primary/10",    label: "Sucesso" },
  aviso:   { icon: AlertTriangle, color: "text-secondary",   bg: "bg-secondary/10",  label: "Aviso" },
  erro:    { icon: AlertCircle,   color: "text-destructive", bg: "bg-destructive/10",label: "Erro" },
};

export default function Notificacoes() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      setItems((data ?? []) as Notification[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`notifications-page:${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") setItems((c) => [payload.new as Notification, ...c]);
          else if (payload.eventType === "UPDATE") setItems((c) => c.map((n) => n.id === (payload.new as any).id ? payload.new as Notification : n));
          else if (payload.eventType === "DELETE") setItems((c) => c.filter((n) => n.id !== (payload.old as any).id));
        }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unread = items.filter((n) => !n.read);

  const markAllRead = async () => {
    if (!user || unread.length === 0) return;
    setItems((c) => c.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const markRead = async (id: string) => {
    setItems((c) => c.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const removeOne = async (id: string) => {
    setItems((c) => c.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const clearAll = async () => {
    if (!user || items.length === 0) return;
    setItems([]);
    await supabase.from("notifications").delete().eq("user_id", user.id);
  };

  const PaginatedList = ({ list }: { list: Notification[] }) => {
    const pag = useClientPagination(list, 20);
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="py-16 flex flex-col items-center text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BellOff className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <p className="text-sm font-medium">Sem notificações</p>
          <p className="text-xs text-muted-foreground mt-1">As novas notificações aparecerão aqui em tempo real.</p>
        </div>
      );
    }
    return (
      <>
        <ul className="divide-y divide-border/40">
          {pag.pageItems.map((n) => {
            const meta = typeMeta[n.type];
            const Icon = meta.icon;
            const body = (
              <div className="flex items-start gap-3 p-4">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.bg, meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{meta.label}</Badge>
                    {!n.read && <Badge className="bg-secondary text-secondary-foreground text-[10px] h-5 px-1.5">Nova</Badge>}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id} className={cn("group relative hover:bg-muted/40 transition-colors", !n.read && "bg-primary/[0.03]")}>
                {n.link ? (
                  <Link to={n.link} onClick={() => markRead(n.id)} className="block">{body}</Link>
                ) : body}
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-background text-muted-foreground" aria-label="Marcar como lida">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => removeOne(n.id)} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Remover">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <TablePagination page={pag.page} pageSize={pag.pageSize} total={pag.total} totalPages={pag.totalPages} canPrev={pag.canPrev} canNext={pag.canNext} onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} />
      </>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Bell}
        title="Notificações"
        description={loading ? "A carregar..." : `${unread.length} por ler · ${items.length} no total`}
      >
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> Marcar todas
          </Button>
        )}
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Limpar
          </Button>
        )}
      </AdminPageHeader>

      <AdminCard>
        <Tabs defaultValue="todas">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="todas">Todas ({items.length})</TabsTrigger>
            <TabsTrigger value="naolidas">Não lidas ({unread.length})</TabsTrigger>
            {(["info", "sucesso", "aviso", "erro"] as NotificationType[]).map((t) => (
              <TabsTrigger key={t} value={t}>{typeMeta[t].label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="todas" className="mt-0"><PaginatedList list={items} /></TabsContent>
          <TabsContent value="naolidas" className="mt-0"><PaginatedList list={unread} /></TabsContent>
          {(["info", "sucesso", "aviso", "erro"] as NotificationType[]).map((t) => (
            <TabsContent key={t} value={t} className="mt-0">
              <PaginatedList list={items.filter((n) => n.type === t)} />
            </TabsContent>
          ))}
        </Tabs>
      </AdminCard>
    </div>
  );
}
