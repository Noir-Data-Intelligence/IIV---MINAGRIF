import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useUserRole } from "@/hooks/useUserRole";
import { listUsers } from "@/services/api/users";
import { listProdutos } from "@/services/api/produtos";
import { listLotes } from "@/services/api/lotes";
import { listPlanos } from "@/services/api/planeamento";
import { listDistribuicoes } from "@/services/api/distribuicao";
import { listLaboratorios } from "@/services/api/laboratorios";
import { listInsumos } from "@/services/api/insumos";
import { listDepartamentos } from "@/services/api/departamentos";
import { listEstacoes } from "@/services/api/estacoes";
import { listDocumentos } from "@/services/api/documentos";
import { listProcesses } from "@/services/api/processes";
import { listNaoConformidades } from "@/services/api/naoConformidades";
import { listAuditorias } from "@/services/api/auditorias";
import { listAnalises } from "@/services/api/analises";
import { listNoticias } from "@/services/api/noticias";
import { listLegislacaoAdmin } from "@/services/api/legislacao";
import { listContactMessages } from "@/services/api/contactMessages";
import { listHeroSlidesAdmin } from "@/services/api/heroSlides";
import {
  LayoutDashboard, Users, Building2, FlaskConical, TestTubes, ClipboardList,
  Package, Pill, Boxes, CalendarRange, Truck, MapPin, ClipboardCheck,
  AlertTriangle, Shield, UserCircle, Search, FileStack, Workflow, BarChart3,
  Settings, Newspaper, Scale, Mail, Images, History, Clock,
} from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";

interface PageItem { label: string; path: string; module: ModuleKey; icon: any; group: string }

const PAGES: PageItem[] = [
  { label: "Painel", path: "/admin", module: "painel", icon: LayoutDashboard, group: "Geral" },
  { label: "Utilizadores", path: "/admin/utilizadores", module: "utilizadores", icon: Users, group: "Geral" },
  { label: "Departamentos", path: "/admin/departamentos", module: "departamentos", icon: Building2, group: "Geral" },
  { label: "Meu Perfil", path: "/admin/perfil", module: "perfil", icon: UserCircle, group: "Geral" },
  { label: "Laboratórios", path: "/admin/laboratorios", module: "laboratorios", icon: FlaskConical, group: "Laboratório" },
  { label: "Análises", path: "/admin/analises", module: "analises", icon: TestTubes, group: "Laboratório" },
  { label: "Resultados", path: "/admin/resultados", module: "resultados", icon: ClipboardList, group: "Laboratório" },
  { label: "Insumos", path: "/admin/insumos", module: "insumos", icon: Package, group: "Laboratório" },
  { label: "Produtos", path: "/admin/produtos", module: "produtos", icon: Pill, group: "Produção" },
  { label: "Lotes", path: "/admin/lotes", module: "lotes", icon: Boxes, group: "Produção" },
  { label: "Planeamento", path: "/admin/planeamento", module: "planeamento", icon: CalendarRange, group: "Produção" },
  { label: "Distribuição", path: "/admin/distribuicao", module: "distribuicao", icon: Truck, group: "Produção" },
  { label: "Estações", path: "/admin/estacoes", module: "estacoes", icon: MapPin, group: "Qualidade" },
  { label: "Auditorias", path: "/admin/auditorias", module: "auditorias", icon: ClipboardCheck, group: "Qualidade" },
  { label: "Não-Conformidades", path: "/admin/nao-conformidades", module: "nao-conformidades", icon: AlertTriangle, group: "Qualidade" },
  { label: "Documentos", path: "/admin/documentos", module: "documentos", icon: FileStack, group: "Gestão" },
  { label: "Processos", path: "/admin/processos", module: "processos", icon: Workflow, group: "Gestão" },
  { label: "Analítica de processos", path: "/admin/processos/analitica", module: "processos", icon: BarChart3, group: "Gestão" },
  { label: "Tipos de processo", path: "/admin/processos/tipos", module: "processos", icon: Settings, group: "Gestão" },
  { label: "Auditoria", path: "/admin/logs", module: "logs", icon: Shield, group: "Qualidade" },
  { label: "Histórico de Alertas", path: "/admin/historico-alertas", module: "historico-alertas", icon: History, group: "Qualidade" },
  { label: "RBAC (Permissões)", path: "/admin/rbac", module: "rbac", icon: Shield, group: "Geral" },
  { label: "Acessibilidade", path: "/admin/acessibilidade", module: "acessibilidade", icon: ClipboardCheck, group: "Qualidade" },
  { label: "Notícias", path: "/admin/noticias", module: "noticias", icon: Newspaper, group: "Conteúdo" },
  { label: "Legislação", path: "/admin/legislacao", module: "legislacao", icon: Scale, group: "Conteúdo" },
  { label: "Mensagens de contacto", path: "/admin/mensagens", module: "mensagens", icon: Mail, group: "Conteúdo" },
  { label: "Slideshow", path: "/admin/slideshow", module: "slideshow", icon: Images, group: "Conteúdo" },
];

interface DataHit {
  label: string;
  sub?: string;
  path: string;
  icon: any;
  group: string;
  /** Optional unique id for de-dup / focus param */
  id?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENTS_KEY = "iiv:global-search:recents";
const MAX_RECENTS = 6;

interface RecentEntry { label: string; path: string; group: string }

function loadRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENTS) : [];
  } catch { return []; }
}
function saveRecent(entry: RecentEntry) {
  try {
    const cur = loadRecents().filter((e) => e.path !== entry.path);
    cur.unshift(entry);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, MAX_RECENTS)));
  } catch { /* ignore */ }
}

export function GlobalSearch({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { canView } = useUserRole();
  const [query, setQuery] = useState("");
  const [dataHits, setDataHits] = useState<DataHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  useEffect(() => { if (open) setRecents(loadRecents()); }, [open]);

  const allowedPages = useMemo(() => PAGES.filter((p) => canView(p.module)), [canView]);

  const filteredPages = useMemo(() => {
    if (!query.trim()) return allowedPages;
    const q = query.toLowerCase();
    return allowedPages.filter((p) =>
      p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
    );
  }, [allowedPages, query]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setDataHits([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const tasks: Array<Promise<DataHit[]>> = [];

        if (canView("utilizadores")) {
          tasks.push(
            listUsers({ search: q }).then((rows) =>
              rows.slice(0, 5).map((u) => ({
                id: u.id, label: u.fullName || "Sem nome",
                path: `/admin/utilizadores?focus=${u.id}`, icon: Users, group: "Utilizadores",
              })),
            ),
          );
        }
        if (canView("produtos")) {
          tasks.push(
            listProdutos({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((p) => ({
                id: p.id, label: p.name, sub: p.productType,
                path: `/admin/produtos?focus=${p.id}`, icon: Pill, group: "Produtos",
              })),
            ),
          );
        }
        if (canView("lotes")) {
          tasks.push(
            listLotes({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((b) => ({
                id: b.id, label: b.batchNumber, sub: b.status,
                path: `/admin/lotes?focus=${b.id}`, icon: Boxes, group: "Lotes",
              })),
            ),
          );
        }
        if (canView("planeamento")) {
          tasks.push(
            listPlanos({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((pl) => ({
                id: pl.id, label: "Plano",
                sub: `${pl.status} · ${pl.plannedStart} → ${pl.plannedEnd}`,
                path: `/admin/planeamento?focus=${pl.id}`, icon: CalendarRange, group: "Planeamento",
              })),
            ),
          );
        }
        if (canView("distribuicao")) {
          tasks.push(
            listDistribuicoes({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((d) => ({
                id: d.id, label: d.destination, sub: `${d.quantity} un · ${d.distributionDate}`,
                path: `/admin/distribuicao?focus=${d.id}`, icon: Truck, group: "Distribuições",
              })),
            ),
          );
        }
        if (canView("laboratorios")) {
          tasks.push(
            listLaboratorios({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((l) => ({
                id: l.id, label: l.name, sub: l.type,
                path: `/admin/laboratorios?focus=${l.id}`, icon: FlaskConical, group: "Laboratórios",
              })),
            ),
          );
        }
        if (canView("insumos")) {
          tasks.push(
            listInsumos({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((s) => ({
                id: s.id, label: s.name, sub: `${s.quantity} ${s.unit}`,
                path: `/admin/insumos?focus=${s.id}`, icon: Package, group: "Insumos",
              })),
            ),
          );
        }
        if (canView("departamentos")) {
          tasks.push(
            listDepartamentos({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((d) => ({
                id: d.id, label: d.name, sub: d.description || undefined,
                path: `/admin/departamentos?focus=${d.id}`, icon: Building2, group: "Departamentos",
              })),
            ),
          );
        }
        if (canView("estacoes")) {
          tasks.push(
            listEstacoes({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((s) => ({
                id: s.id, label: s.name, sub: `${s.stationType}${s.location ? " · " + s.location : ""}`,
                path: `/admin/estacoes?focus=${s.id}`, icon: MapPin, group: "Estações",
              })),
            ),
          );
        }
        if (canView("documentos")) {
          tasks.push(
            listDocumentos({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((d) => ({
                id: d.id, label: d.title, sub: d.status,
                path: `/admin/documentos?focus=${d.id}`, icon: FileStack, group: "Documentos",
              })),
            ),
          );
        }
        if (canView("processos")) {
          tasks.push(
            listProcesses({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((p) => ({
                id: p.id, label: `${p.code} · ${p.title}`, sub: p.status,
                path: `/admin/processos/${p.id}`, icon: Workflow, group: "Processos",
              })),
            ),
          );
        }
        if (canView("nao-conformidades")) {
          tasks.push(
            listNaoConformidades({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((n) => ({
                id: n.id, label: n.title, sub: `${n.severity} · ${n.status}`,
                path: `/admin/nao-conformidades?focus=${n.id}`, icon: AlertTriangle, group: "Não-Conformidades",
              })),
            ),
          );
        }
        if (canView("auditorias")) {
          tasks.push(
            listAuditorias({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((a) => ({
                id: a.id, label: a.title, sub: `${a.auditor} · ${a.status}`,
                path: `/admin/auditorias?focus=${a.id}`, icon: ClipboardCheck, group: "Auditorias",
              })),
            ),
          );
        }
        if (canView("analises")) {
          tasks.push(
            listAnalises({ search: q, page: 1, perPage: 5 }).then(({ data }) =>
              data.map((a) => ({
                id: a.id, label: a.clientName, sub: `${a.analysisType} · ${a.status}`,
                path: `/admin/analises?focus=${a.id}`, icon: TestTubes, group: "Análises",
              })),
            ),
          );
        }
        if (canView("noticias")) {
          tasks.push(
            listNoticias({ page: 1, perPage: 5, search: q }).then(({ data }) =>
              data.map((n) => ({
                id: n.id, label: n.titulo,
                sub: `${n.categoria}${n.published ? "" : " · rascunho"}`,
                path: `/admin/noticias?focus=${n.id}`, icon: Newspaper, group: "Notícias",
              })),
            ),
          );
        }
        if (canView("legislacao")) {
          tasks.push(
            listLegislacaoAdmin({ page: 1, perPage: 5, search: q }).then(({ data }) =>
              data.map((l) => ({
                id: l.id, label: l.titulo, sub: `${l.tipo} ${l.num}/${l.ano}`,
                path: `/admin/legislacao?focus=${l.id}`, icon: Scale, group: "Legislação",
              })),
            ),
          );
        }
        if (canView("mensagens")) {
          tasks.push(
            listContactMessages({ page: 1, perPage: 50 }).then(({ data }) => {
              const ql = q.toLowerCase();
              return data
                .filter(
                  (m) =>
                    m.nome.toLowerCase().includes(ql) ||
                    m.assunto.toLowerCase().includes(ql) ||
                    m.email.toLowerCase().includes(ql) ||
                    m.mensagem.toLowerCase().includes(ql),
                )
                .slice(0, 5)
                .map((m) => ({
                  id: m.id, label: m.assunto, sub: `${m.nome} · ${m.email}${m.lida ? "" : " · nova"}`,
                  path: `/admin/mensagens?focus=${m.id}`, icon: Mail, group: "Mensagens",
                }));
            }),
          );
        }
        if (canView("slideshow")) {
          tasks.push(
            listHeroSlidesAdmin({ page: 1, perPage: 5, search: q }).then(({ data }) =>
              data.map((s) => ({
                id: s.id, label: s.title, sub: s.kicker,
                path: `/admin/slideshow?focus=${s.id}`, icon: Images, group: "Slideshow",
              })),
            ),
          );
        }

        const results = await Promise.all(tasks);
        setDataHits(results.flat());
      } catch {
        setDataHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query, open, canView]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDataHits([]);
    }
  }, [open]);

  const go = (path: string, label: string, group: string) => {
    saveRecent({ path, label, group });
    onOpenChange(false);
    navigate(path);
  };

  const pagesByGroup = useMemo(() => {
    const map = new Map<string, PageItem[]>();
    filteredPages.forEach((p) => {
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group)!.push(p);
    });
    return Array.from(map.entries());
  }, [filteredPages]);

  const hitsByGroup = useMemo(() => {
    const map = new Map<string, DataHit[]>();
    dataHits.forEach((h) => {
      if (!map.has(h.group)) map.set(h.group, []);
      map.get(h.group)!.push(h);
    });
    return Array.from(map.entries());
  }, [dataHits]);

  const totalDataHits = dataHits.length;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Pesquisar páginas, utilizadores, processos, documentos, notícias, legislação..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>
          {searching ? "A procurar..." : query.length > 0 && query.length < 2 ? "Digite pelo menos 2 caracteres..." : "Sem resultados."}
        </CommandEmpty>

        {!query && recents.length > 0 && (
          <>
            <CommandGroup heading="Recentes">
              {recents.map((r, i) => (
                <CommandItem
                  key={`recent-${i}-${r.path}`}
                  value={`recent-${i}-${r.label}`}
                  onSelect={() => go(r.path, r.label, r.group)}
                >
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{r.group}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {pagesByGroup.map(([groupName, items]) => (
          <CommandGroup key={`page-${groupName}`} heading={`Páginas · ${groupName}`}>
            {items.map((p) => (
              <CommandItem
                key={p.path}
                value={`page-${p.path}-${p.label}-${p.group}`}
                onSelect={() => go(p.path, p.label, `Página · ${groupName}`)}
              >
                <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{p.label}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{groupName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {hitsByGroup.length > 0 && <CommandSeparator />}

        {hitsByGroup.map(([groupName, hits]) => (
          <CommandGroup key={`data-${groupName}`} heading={groupName}>
            {hits.map((h, i) => (
              <CommandItem
                key={`${groupName}-${i}-${h.id ?? h.label}`}
                value={`data-${groupName}-${i}-${h.label}-${h.sub ?? ""}`}
                onSelect={() => go(h.path, h.label, groupName)}
              >
                <h.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{h.label}</span>
                  {h.sub && <span className="text-[11px] text-muted-foreground truncate">{h.sub}</span>}
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{groupName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Search className="h-3 w-3" />
          {query.length >= 2
            ? `${totalDataHits} resultado${totalDataHits === 1 ? "" : "s"} em ${hitsByGroup.length} categoria${hitsByGroup.length === 1 ? "" : "s"}`
            : "Pesquisa global"}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border bg-muted px-1 font-mono">↵</kbd> abrir ·
          <kbd className="rounded border border-border bg-muted px-1 font-mono">esc</kbd> fechar
        </span>
      </div>
    </CommandDialog>
  );
}
