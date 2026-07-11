import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_LABEL, type ModuleKey } from "@/lib/permissions";
import {
  LayoutDashboard, Users, Building2, LogOut, ChevronLeft, FlaskConical, TestTubes,
  ClipboardList, Package, Pill, Boxes, CalendarRange, Truck, MapPin,
  ClipboardCheck, AlertTriangle, Shield, Menu, X, UserCircle, Search,
  Sparkles, Boxes as BoxesIcon, LineChart, ShieldCheck, ScrollText, MessageSquare, Images, Newspaper, Bell,
  FolderKanban, FileStack, Workflow, Rabbit, Dna, Sprout, Beef, Wallet, Wrench, Plane, GraduationCap, UserCog, Microscope, BarChart3, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { GlobalSearch } from "@/components/admin/GlobalSearch";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { ChatWidget } from "@/components/admin/ChatWidget";

interface NavItem { icon: any; label: string; path: string; module: ModuleKey }
interface NavGroup { label: string; items: NavItem[]; icon: any; colorClass: string }

const navGroups: NavGroup[] = [
  {
    label: "Geral",
    icon: Sparkles,
    colorClass: "text-sidebar-primary",
    items: [
      { icon: LayoutDashboard, label: "Painel", path: "/admin", module: "painel" },
      { icon: Bell, label: "Histórico de Alertas", path: "/admin/historico-alertas", module: "historico-alertas" },
      { icon: Users, label: "Utilizadores", path: "/admin/utilizadores", module: "utilizadores" },
      { icon: Shield, label: "Permissões (RBAC)", path: "/admin/rbac", module: "rbac" },
      { icon: Building2, label: "Departamentos", path: "/admin/departamentos", module: "departamentos" },
      { icon: ScrollText, label: "Legislação", path: "/admin/legislacao", module: "legislacao" },
      { icon: Newspaper, label: "Notícias", path: "/admin/noticias", module: "noticias" },

      { icon: MessageSquare, label: "Mensagens", path: "/admin/mensagens", module: "mensagens" },
      { icon: Images, label: "Slideshow", path: "/admin/slideshow", module: "slideshow" },
    ],
  },
  {
    label: "Laboratório",
    icon: LineChart,
    colorClass: "text-[hsl(175,55%,55%)]",
    items: [
      { icon: FlaskConical, label: "Laboratórios", path: "/admin/laboratorios", module: "laboratorios" },
      { icon: TestTubes, label: "Análises", path: "/admin/analises", module: "analises" },
      { icon: ClipboardList, label: "Resultados", path: "/admin/resultados", module: "resultados" },
      { icon: Package, label: "Insumos", path: "/admin/insumos", module: "insumos" },
    ],
  },
  {
    label: "Produção",
    icon: BoxesIcon,
    colorClass: "text-[hsl(38,75%,60%)]",
    items: [
      { icon: Pill, label: "Produtos", path: "/admin/produtos", module: "produtos" },
      { icon: Boxes, label: "Lotes", path: "/admin/lotes", module: "lotes" },
      { icon: CalendarRange, label: "Planeamento", path: "/admin/planeamento", module: "planeamento" },
      { icon: Truck, label: "Distribuição", path: "/admin/distribuicao", module: "distribuicao" },
    ],
  },
  {
    label: "Recursos & Produção",
    icon: BoxesIcon,
    colorClass: "text-[hsl(140,55%,55%)]",
    items: [
      { icon: Boxes, label: "Stock Integrado", path: "/admin/stock", module: "stock" },
      { icon: Sprout, label: "Agricultura", path: "/admin/agricultura", module: "agricultura" },
      { icon: Beef, label: "Produção Pecuária", path: "/admin/pecuaria", module: "pecuaria" },
    ],
  },
  {
    label: "Qualidade",
    icon: ShieldCheck,
    colorClass: "text-[hsl(0,70%,70%)]",
    items: [
      { icon: MapPin, label: "Estações", path: "/admin/estacoes", module: "estacoes" },
      { icon: Rabbit, label: "Animais", path: "/admin/animais", module: "animais" },
      { icon: Dna, label: "Inseminação Artificial", path: "/admin/inseminacao", module: "inseminacao" },
      { icon: ClipboardCheck, label: "Auditorias", path: "/admin/auditorias", module: "auditorias" },
      { icon: AlertTriangle, label: "Não-Conformidades", path: "/admin/nao-conformidades", module: "nao-conformidades" },
      { icon: Shield, label: "Logs de Atividade", path: "/admin/logs", module: "logs" },
      { icon: ShieldCheck, label: "Acessibilidade", path: "/admin/acessibilidade", module: "acessibilidade" },
    ],
  },
  {
    label: "Gestão",
    icon: FolderKanban,
    colorClass: "text-[hsl(220,70%,65%)]",
    items: [
      { icon: FileStack, label: "Documentos", path: "/admin/documentos", module: "documentos" },
      { icon: Workflow, label: "Processos", path: "/admin/processos", module: "processos" },
    ],
  },
  {
    label: "Financeiro & Património",
    icon: Wallet,
    colorClass: "text-[hsl(45,90%,55%)]",
    items: [
      { icon: Wallet, label: "Financeiro", path: "/admin/financeiro", module: "financeiro" },
      { icon: Wrench, label: "Património", path: "/admin/patrimonio", module: "patrimonio" },
    ],
  },
  {
    label: "Pessoas & Missões",
    icon: UserCog,
    colorClass: "text-[hsl(260,60%,65%)]",
    items: [
      { icon: UserCog, label: "Recursos Humanos", path: "/admin/rh", module: "rh" },
      { icon: Plane, label: "Missões", path: "/admin/missoes", module: "missoes" },
      { icon: GraduationCap, label: "Formações", path: "/admin/formacoes", module: "formacoes" },
    ],
  },
  {
    label: "Investigação & BI",
    icon: Microscope,
    colorClass: "text-[hsl(175,55%,55%)]",
    items: [
      { icon: Microscope, label: "Investigação", path: "/admin/investigacao", module: "investigacao" },
      { icon: Award, label: "Avaliações", path: "/admin/avaliacoes", module: "avaliacoes" },
      { icon: BarChart3, label: "BI Institucional", path: "/admin/bi", module: "bi" },
    ],
  },
];

function initialsFromEmail(email?: string | null) {
  if (!email) return "IIV";
  const namePart = email.split("@")[0];
  const parts = namePart.split(/[._-]/).filter(Boolean);
  const first = parts[0]?.[0] ?? namePart[0] ?? "I";
  const second = parts[1]?.[0] ?? namePart[1] ?? "";
  return (first + second).toUpperCase();
}

export function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { role, loading: roleLoading, canView } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  // Grupos abertos no Accordion da sidebar — arranca com o grupo da rota activa aberto.
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const active = navGroups
      .flatMap((g) => g.items.map((i) => ({ path: i.path, group: g.label })))
      .find((i) => (i.path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(i.path)));
    return active ? [active.group] : [];
  });
  const mobileAsideRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  // ⌘K / Ctrl+K shortcut + Esc closes mobile sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Close mobile drawer after the new route renders (smooth transition)
  useEffect(() => {
    if (!pendingPath) return;
    if (location.pathname === pendingPath || location.pathname.startsWith(pendingPath)) {
      const t = window.setTimeout(() => {
        setMobileOpen(false);
        setNavigating(false);
        setPendingPath(null);
      }, 180);
      return () => window.clearTimeout(t);
    }
  }, [location.pathname, pendingPath]);

  // Safety: ensure flags reset if route changes by other means
  useEffect(() => {
    if (!mobileOpen) {
      setNavigating(false);
      setPendingPath(null);
    }
  }, [mobileOpen]);


  // Body scroll lock + focus trap when drawer opens
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () =>
      Array.from(
        mobileAsideRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        ) ?? []
      ).filter((el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null);

    const t = window.setTimeout(() => {
      const activeLink = mobileAsideRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
      const target = activeLink ?? getFocusable()[0];
      target?.focus();
      activeLink?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);

    const onTrapKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const insideDrawer = mobileAsideRef.current?.contains(active ?? null);

      if (!insideDrawer) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onTrapKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener("keydown", onTrapKey);
      menuTriggerRef.current?.focus();
    };
  }, [mobileOpen]);


  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < -60) { setMobileOpen(false); touchStartX.current = null; }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-green flex items-center justify-center text-primary-foreground font-serif font-bold animate-pulse">IIV</div>
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => canView(i.module)) }))
    .filter((g) => g.items.length > 0);

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const currentItem = filteredGroups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))).find((i) => isActive(i.path));

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl gradient-gold opacity-40 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-serif font-bold text-sm shadow-elegant">
              IIV
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Sistema de Gestão</p>
            <p className="text-xs text-sidebar-muted truncate">IIV Angola</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <ScrollArea className="flex-1 py-4">
        <Accordion
          type="multiple"
          value={openGroups}
          onValueChange={setOpenGroups}
          className="px-3 space-y-1"
        >
          {filteredGroups.map((group) => (
            <AccordionItem key={group.label} value={group.label} className="border-b-0">
              <AccordionTrigger className="px-3 py-2 rounded-lg hover:no-underline hover:bg-sidebar-accent/40 transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-sidebar-muted">
                <span className="flex items-center gap-1.5 min-w-0">
                  <group.icon className={`h-3.5 w-3.5 shrink-0 ${group.colorClass}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted truncate">
                    {group.label}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0.5">
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={(e) => {
                          if (isActive(item.path)) {
                            setMobileOpen(false);
                            return;
                          }
                          setNavigating(true);
                          setPendingPath(item.path);
                        }}
                        aria-current={active ? "page" : undefined}
                        data-active={active ? "true" : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/30 shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-sidebar-primary" />
                        )}
                        <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="w-[272px] shrink-0 bg-sidebar hidden md:flex flex-col border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          ref={mobileAsideRef}
          id="mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-hidden={!mobileOpen}
          aria-label="Menu de navegação"
          tabIndex={-1}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          className={`absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar flex flex-col shadow-2xl transition-[transform,opacity] duration-300 ease-out will-change-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${navigating ? "opacity-70" : "opacity-100"}`}
        >
          {navigating && (
            <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
              <div className="h-full w-1/3 bg-sidebar-primary animate-nav-loading" />
            </div>
          )}
          <div className="flex items-center justify-end p-3 border-b border-sidebar-border">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <NavContent />
        </aside>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 glass-strong shadow-elegant border-b border-border/50">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                ref={menuTriggerRef}
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <Breadcrumb>
                  <BreadcrumbList className="text-xs">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/admin" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <LayoutDashboard className="h-3 w-3" />
                          Admin
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {location.pathname === "/admin" ? null : currentItem ? (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <span className="text-muted-foreground">{currentItem.group}</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1.5">
                            <currentItem.icon className="h-3.5 w-3.5 text-primary" />
                            {currentItem.label}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : location.pathname === "/admin/perfil" ? (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1.5">
                            <UserCircle className="h-3.5 w-3.5 text-primary" />
                            Meu Perfil
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : null}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search (opens command palette) */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 text-xs text-muted-foreground hover:bg-background hover:border-border transition-colors min-w-[220px]"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Pesquisar...</span>
                <kbd className="ml-2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </button>
              {/* Mobile search trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border/60 bg-background/60 hover:bg-background transition-colors text-muted-foreground"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Notifications */}
              <NotificationCenter />

              {/* User menu (avatar dropdown) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Menu do utilizador"
                    className="flex items-center gap-2 pl-2 ml-1 py-1 pr-1 lg:pr-2 border-l border-border/60 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-green text-primary-foreground font-serif text-[11px] font-bold shadow-elegant">
                      {initialsFromEmail(user.email)}
                    </div>
                    <div className="hidden lg:block min-w-0 text-left">
                      <p className="text-xs font-medium text-foreground leading-none truncate max-w-[140px]">
                        {user.email?.split("@")[0]}
                      </p>
                      {role && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ROLE_LABEL[role]}</p>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground truncate">{user.email?.split("@")[0]}</span>
                      <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
                      {role && (
                        <Badge variant="outline" className="mt-1 w-fit text-[9px] h-4 px-1.5">
                          {ROLE_LABEL[role]}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/admin/perfil">
                      <UserCircle className="mr-2 h-4 w-4" /> Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/">
                      <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>

        <footer className="h-10 flex items-center justify-center border-t border-border/40 bg-card/60 text-[11px] text-muted-foreground shrink-0">
          © 2026 IIV — Instituto de Investigação Veterinária · Angola
        </footer>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <ChatWidget />
    </div>
  );
}
