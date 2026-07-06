import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt, enUS } from "date-fns/locale";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/admin/TablePagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { cn } from "@/lib/utils";
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/queries/useNotifications";
import type { NotificationDto, NotificationType } from "@/types/dto/notification";
import i18n from "@/i18n";
import ptNotificacoes from "@/i18n/locales/pt/admin/notificacoes.json";
import enNotificacoes from "@/i18n/locales/en/admin/notificacoes.json";

// Namespace "notificacoes" não faz parte do bundle central (src/i18n/index.ts,
// que só regista "common"/"nav"). Registamo-lo aqui em runtime para manter esta
// página autónoma sem tocar na configuração global do i18next, tal como
// `Departamentos.tsx` fez para o namespace "departamentos".
if (!i18n.hasResourceBundle("pt", "notificacoes"))
  i18n.addResourceBundle("pt", "notificacoes", ptNotificacoes, true, true);
if (!i18n.hasResourceBundle("en", "notificacoes"))
  i18n.addResourceBundle("en", "notificacoes", enNotificacoes, true, true);

const typeIcon: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  info: { icon: Info, color: "text-sky-600", bg: "bg-sky-500/10" },
  sucesso: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  aviso: { icon: AlertTriangle, color: "text-secondary", bg: "bg-secondary/10" },
  erro: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Notificacoes() {
  const { t, i18n: i18nInstance } = useTranslation("notificacoes");
  const dateLocale = i18nInstance.language === "en" ? enUS : pt;

  const { data, isLoading } = useNotificationsList();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const removeOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const handleMarkAllRead = () => {
    if (unread.length === 0) return;
    markAllRead.mutate();
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    clearAll.mutate();
  };

  const PaginatedList = ({ list }: { list: NotificationDto[] }) => {
    const pag = useClientPagination(list, 20);
    if (isLoading) {
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
          <p className="text-sm font-medium">{t("empty.title")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("empty.description")}</p>
        </div>
      );
    }
    return (
      <>
        <ul className="divide-y divide-border/40">
          {pag.pageItems.map((n) => {
            const meta = typeIcon[n.type];
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
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{t(`types.${n.type}`)}</Badge>
                    {!n.read && <Badge className="bg-secondary text-secondary-foreground text-[10px] h-5 px-1.5">{t("badge.new")}</Badge>}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id} className={cn("group relative hover:bg-muted/40 transition-colors", !n.read && "bg-primary/[0.03]")}>
                {n.link ? (
                  <Link to={n.link} onClick={() => markRead.mutate(n.id)} className="block">{body}</Link>
                ) : body}
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!n.read && (
                    <button onClick={() => markRead.mutate(n.id)} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-background text-muted-foreground" aria-label={t("actions.markRead")}>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => removeOne.mutate(n.id)} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label={t("actions.remove")}>
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
        title={t("page.title")}
        description={isLoading ? t("page.loading") : t("page.summary", { unread: unread.length, total: items.length })}
      >
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> {t("actions.markAll")}
          </Button>
        )}
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> {t("actions.clearAll")}
          </Button>
        )}
      </AdminPageHeader>

      <AdminCard>
        <Tabs defaultValue="todas">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="todas">{t("tabs.all", { count: items.length })}</TabsTrigger>
            <TabsTrigger value="naolidas">{t("tabs.unread", { count: unread.length })}</TabsTrigger>
            {(["info", "sucesso", "aviso", "erro"] as NotificationType[]).map((tp) => (
              <TabsTrigger key={tp} value={tp}>{t(`types.${tp}`)}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="todas" className="mt-0"><PaginatedList list={items} /></TabsContent>
          <TabsContent value="naolidas" className="mt-0"><PaginatedList list={unread} /></TabsContent>
          {(["info", "sucesso", "aviso", "erro"] as NotificationType[]).map((tp) => (
            <TabsContent key={tp} value={tp} className="mt-0">
              <PaginatedList list={items.filter((n) => n.type === tp)} />
            </TabsContent>
          ))}
        </Tabs>
      </AdminCard>
    </div>
  );
}
