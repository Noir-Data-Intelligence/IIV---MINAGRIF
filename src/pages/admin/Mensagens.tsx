import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Check, Eye, Inbox, Mail, MessageSquare, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RowActions, type RowAction } from "@/components/admin/RowActions";
import { DataTable, DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useContactMessagesList,
  useDeleteContactMessage,
  useMarkContactMessageRead,
  useMarkContactMessageResponded,
} from "@/hooks/queries/useContactMessages";
import type { ContactMessageDto } from "@/types/dto/contactMessage";
import i18n from "@/i18n";
import ptMensagens from "@/i18n/locales/pt/admin/mensagens.json";
import enMensagens from "@/i18n/locales/en/admin/mensagens.json";

// Namespace "mensagens" não faz parte do bundle central (src/i18n/index.ts) —
// registamo-lo aqui em runtime, replicando o padrão de Departamentos.tsx
// (primeiro módulo admin com i18n), para manter esta página autónoma sem
// tocar na configuração global do i18next.
if (!i18n.hasResourceBundle("pt", "mensagens"))
  i18n.addResourceBundle("pt", "mensagens", ptMensagens, true, true);
if (!i18n.hasResourceBundle("en", "mensagens"))
  i18n.addResourceBundle("en", "mensagens", enMensagens, true, true);

export default function MensagensAdmin() {
  const { t, i18n: i18nInstance } = useTranslation("mensagens");
  const { canWrite } = useUserRole();
  const canDelete = canWrite("mensagens");
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [viewItem, setViewItem] = useState<ContactMessageDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useContactMessagesList({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
  });

  const markRead = useMarkContactMessageRead();
  const markResponded = useMarkContactMessageResponded();
  const deleteMessage = useDeleteContactMessage();

  const rows = data?.data ?? [];
  const unread = rows.filter((m) => !m.lida).length;

  // Leitura auxiliar (perPage alto), só para agregar os KPIs do topo — não
  // interfere com a paginação server-side da tabela. Mesmo padrão de
  // Dashboard.tsx para agregações client-side.
  const { data: allData } = useContactMessagesList({ page: 1, perPage: 1000 });
  const stats = useMemo(() => {
    const items = allData?.data ?? [];
    const total = allData?.meta.total ?? items.length;
    const unreadTotal = items.filter((m) => !m.lida).length;
    const responded = items.filter((m) => m.respondida).length;
    return { total, unread: unreadTotal, responded };
  }, [allData]);

  const openView = (m: ContactMessageDto) => {
    setViewItem(m);
    if (!m.lida) {
      markRead.mutate(m.id, {
        onSuccess: (updated) => setViewItem(updated),
        onError: () => toast({ title: t("toast.error"), variant: "destructive" }),
      });
    }
  };

  const handleMarkResponded = async () => {
    if (!viewItem) return;
    try {
      const updated = await markResponded.mutateAsync(viewItem.id);
      toast({ title: t("toast.respondedSuccess") });
      setViewItem(updated);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMessage.mutateAsync(deleteId);
      toast({ title: t("toast.deleteSuccess") });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<ContactMessageDto>[]>(
    () => [
      {
        id: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.status")} />,
        enableSorting: false,
        cell: ({ row }) => {
          const m = row.original;
          if (m.respondida)
            return (
              <Badge variant="outline" className="border-primary/30 text-primary">
                {t("status.responded")}
              </Badge>
            );
          if (m.lida) return <Badge variant="outline">{t("status.read")}</Badge>;
          return <Badge className="bg-[hsl(var(--iiv-gold))] text-primary">{t("status.new")}</Badge>;
        },
      },
      {
        accessorKey: "nome",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.from")} />,
        cell: ({ row }) => (
          <div className={!row.original.lida ? "font-medium" : ""}>
            <div>{row.original.nome}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "assunto",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.subject")} />,
        cell: ({ row }) => <span className="block max-w-md truncate">{row.original.assunto}</span>,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString(
              i18nInstance.language === "en" ? "en-GB" : "pt-AO",
            )}
          </span>
        ),
      },
    ],
    [t, i18nInstance.language],
  );

  const renderRowActions = (row: ContactMessageDto) => {
    const actions: RowAction[] = [{ label: t("actions.view"), icon: Eye, onClick: () => openView(row) }];
    if (canDelete) {
      actions.push({
        label: t("actions.delete"),
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteId(row.id),
      });
    }
    return <RowActions actions={actions} />;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={MessageSquare}
        title={t("page.title")}
        description={t("page.description", { total: data?.meta.total ?? 0, unread })}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        pageCount={data?.meta.lastPage ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={data?.meta.total}
        searchPlaceholder={t("table.searchPlaceholder")}
        emptyMessage={t("table.empty")}
        renderRowActions={renderRowActions}
      />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={handleDelete} />

      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{viewItem?.assunto}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("dialog.from")}</p>
                  <p className="font-medium">{viewItem.nome}</p>
                  <a href={`mailto:${viewItem.email}`} className="text-primary hover:underline text-xs">
                    {viewItem.email}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("dialog.received")}</p>
                  <p className="font-medium">
                    {new Date(viewItem.createdAt).toLocaleString(
                      i18nInstance.language === "en" ? "en-GB" : "pt-AO",
                    )}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{t("dialog.message")}</p>
                <div className="rounded-xl border border-border/60 bg-accent/20 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {viewItem.mensagem}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline">
                  <a href={`mailto:${viewItem.email}?subject=Re: ${encodeURIComponent(viewItem.assunto)}`}>
                    <Mail className="mr-2 h-4 w-4" /> {t("dialog.replyByEmail")}
                  </a>
                </Button>
                {!viewItem.respondida && (
                  <Button onClick={handleMarkResponded} disabled={markResponded.isPending}>
                    <Check className="mr-2 h-4 w-4" /> {t("dialog.markResponded")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
