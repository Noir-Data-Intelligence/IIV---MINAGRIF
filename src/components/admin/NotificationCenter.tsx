import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "@/hooks/queries/useNotifications";
import type { NotificationType } from "@/types/dto/notification";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, Trash2, BellOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const typeMeta: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  info:    { icon: Info,         color: "text-white", bg: "bg-sky-500 shadow-md shadow-sky-500/30" },
  sucesso: { icon: CheckCircle2, color: "text-primary-foreground", bg: "gradient-green-soft shadow-md" },
  aviso:   { icon: AlertTriangle,color: "text-white", bg: "bg-amber-500 shadow-md shadow-amber-500/30" },
  erro:    { icon: AlertCircle,  color: "text-white", bg: "bg-destructive shadow-md shadow-destructive/30" },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data, isLoading: loading } = useNotificationsList();
  const items = useMemo(() => (data ?? []).slice(0, 20), [data]);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markRead = (id: string) => markReadMutation.mutate(id);
  const markAllRead = () => { if (unreadCount > 0) markAllReadMutation.mutate(); };
  const removeOne = (id: string) => deleteMutation.mutate(id);
  const clearAll = () => { if (items.length > 0) clearAllMutation.mutate(); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/60 hover:bg-background transition-colors text-muted-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold leading-none shadow-elegant">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 overflow-hidden glass-strong border-border/60 shadow-elevated" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div>
            <p className="font-serif text-base leading-tight">Notificações</p>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount === 0 ? "Tudo em dia" : `${unreadCount} por ler`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3 mr-1" /> Marcar todas
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-destructive hover:text-destructive" onClick={clearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="py-10 text-center text-xs text-muted-foreground">A carregar...</div>
        ) : items.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center px-6">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <BellOff className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <p className="text-sm font-medium">Sem notificações</p>
            <p className="text-[11px] text-muted-foreground mt-1">As novas notificações aparecerão aqui em tempo real.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y divide-border/40">
              {items.map((n) => {
                const meta = typeMeta[n.type];
                const Icon = meta.icon;
                const inner = (
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg, meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug truncate", !n.read && "font-semibold")}>{n.title}</p>
                        {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: pt })}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <li key={n.id} className={cn("group relative px-4 py-3 hover:bg-muted/40 transition-colors", !n.read && "bg-primary/[0.03]")}>
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => { markRead(n.id); setOpen(false); }}
                        className="block"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => markRead(n.id)} className="w-full text-left">
                        {inner}
                      </button>
                    )}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                          className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-background text-muted-foreground"
                          aria-label="Marcar como lida"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeOne(n.id); }}
                        className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        {/* Footer link */}
        <div className="border-t border-border/50 px-3 py-2">
          <Link
            to="/admin/notificacoes"
            onClick={() => setOpen(false)}
            className="block text-center text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Ver todas as notificações →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
