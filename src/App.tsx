import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { CursorFx } from "@/components/CursorFx";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

const Index = lazy(() => import("./pages/Index"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Noticias = lazy(() => import("./pages/Noticias"));
const NoticiaDetalhe = lazy(() => import("./pages/NoticiaDetalhe"));
const Legislacao = lazy(() => import("./pages/Legislacao"));
const LegislacaoDetalhe = lazy(() => import("./pages/LegislacaoDetalhe"));
const LegislacaoAdmin = lazy(() => import("./pages/admin/Legislacao"));
const NoticiasAdmin = lazy(() => import("./pages/admin/Noticias"));
const MensagensAdmin = lazy(() => import("./pages/admin/Mensagens"));
const SlideshowAdmin = lazy(() => import("./pages/admin/Slideshow"));

const Contactos = lazy(() => import("./pages/Contactos"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Notificacoes = lazy(() => import("./pages/admin/Notificacoes"));
const Login = lazy(() => import("./pages/Login"));
const Registar = lazy(() => import("./pages/Registar"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const PainelDetalhe = lazy(() => import("./pages/admin/PainelDetalhe"));
const Utilizadores = lazy(() => import("./pages/admin/Utilizadores"));
const Departamentos = lazy(() => import("./pages/admin/Departamentos"));
const Laboratorios = lazy(() => import("./pages/admin/Laboratorios"));
const Requisicoes = lazy(() => import("./pages/admin/Requisicoes"));
const RequisicaoDetalhe = lazy(() => import("./pages/admin/RequisicaoDetalhe"));
const Insumos = lazy(() => import("./pages/admin/Insumos"));
const Produtos = lazy(() => import("./pages/admin/Produtos"));
const Lotes = lazy(() => import("./pages/admin/Lotes"));
const Planeamento = lazy(() => import("./pages/admin/Planeamento"));
const Distribuicao = lazy(() => import("./pages/admin/Distribuicao"));
const Estacoes = lazy(() => import("./pages/admin/Estacoes"));
const Animais = lazy(() => import("./pages/admin/Animais"));
const Inseminacao = lazy(() => import("./pages/admin/Inseminacao"));
const Stock = lazy(() => import("./pages/admin/Stock"));
const Agricultura = lazy(() => import("./pages/admin/Agricultura"));
const ProducaoPecuaria = lazy(() => import("./pages/admin/ProducaoPecuaria"));
const Financeiro = lazy(() => import("./pages/admin/Financeiro"));
const PatrimonioCentral = lazy(() => import("./pages/admin/PatrimonioCentral"));
const PatrimonioEstacao = lazy(() => import("./pages/admin/PatrimonioEstacao"));
const Missoes = lazy(() => import("./pages/admin/Missoes"));
const RecursosHumanosTransversal = lazy(() => import("./pages/admin/RecursosHumanosTransversal"));
const RecursosHumanosLaboratorio = lazy(() => import("./pages/admin/RecursosHumanosLaboratorio"));
const Formacoes = lazy(() => import("./pages/admin/Formacoes"));
const Investigacao = lazy(() => import("./pages/admin/Investigacao"));
const Avaliacoes = lazy(() => import("./pages/admin/Avaliacoes"));
const BI = lazy(() => import("./pages/admin/BI"));
const Observatorio = lazy(() => import("./pages/admin/Observatorio"));
const Auditorias = lazy(() => import("./pages/admin/Auditorias"));
const NaoConformidades = lazy(() => import("./pages/admin/NaoConformidades"));
const LogsActividade = lazy(() => import("./pages/admin/LogsActividade"));
const Perfil = lazy(() => import("./pages/admin/Perfil"));
const Acessibilidade = lazy(() => import("./pages/admin/Acessibilidade"));
const RBAC = lazy(() => import("./pages/admin/RBAC"));
const HistoricoAlertas = lazy(() => import("./pages/admin/HistoricoAlertas"));
const Documentos = lazy(() => import("./pages/admin/Documentos"));
const Processos = lazy(() => import("./pages/admin/Processos"));
const ProcessoDetalhe = lazy(() => import("./pages/admin/ProcessoDetalhe"));
const ProcessosTipos = lazy(() => import("./pages/admin/ProcessosTipos"));
const ProcessosAnalitica = lazy(() => import("./pages/admin/ProcessosAnalitica"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { RoleGuard } from "@/components/RoleGuard";
import { queryClient } from "@/lib/queryClient";

// Fallback de rota: cada página já usa Skeleton internos para os seus próprios dados,
// mas o chunk JS da própria página só chega depois deste primeiro paint — sem isto o
// utilizador veria um ecrã em branco enquanto o lazy import() resolve.
function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
      <TooltipProvider>
        <CursorFx />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/noticias/:slug" element={<NoticiaDetalhe />} />
              <Route path="/legislacao" element={<Legislacao />} />
              <Route path="/legislacao/:slug" element={<LegislacaoDetalhe />} />

              <Route path="/contactos" element={<Contactos />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
            </Route>

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/registar" element={<Registar />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />

            {/* Admin area */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="painel/:metric" element={<PainelDetalhe />} />
              <Route path="utilizadores" element={<RoleGuard module="utilizadores"><Utilizadores /></RoleGuard>} />
              <Route path="departamentos" element={<RoleGuard module="departamentos"><Departamentos /></RoleGuard>} />
              <Route path="laboratorios" element={<RoleGuard module="laboratorios"><Laboratorios /></RoleGuard>} />
              <Route path="requisicoes" element={<RoleGuard module="analises"><Requisicoes /></RoleGuard>} />
              <Route path="requisicoes/:id" element={<RoleGuard module="analises"><RequisicaoDetalhe /></RoleGuard>} />
              <Route path="insumos" element={<RoleGuard module="insumos"><Insumos /></RoleGuard>} />
              <Route path="produtos" element={<RoleGuard module="produtos"><Produtos /></RoleGuard>} />
              <Route path="lotes" element={<RoleGuard module="lotes"><Lotes /></RoleGuard>} />
              <Route path="planeamento" element={<RoleGuard module="planeamento"><Planeamento /></RoleGuard>} />
              <Route path="distribuicao" element={<RoleGuard module="distribuicao"><Distribuicao /></RoleGuard>} />
              <Route path="estacoes" element={<RoleGuard module="estacoes"><Estacoes /></RoleGuard>} />
              <Route path="animais" element={<RoleGuard module="animais"><Animais /></RoleGuard>} />
              <Route path="inseminacao" element={<RoleGuard module="inseminacao"><Inseminacao /></RoleGuard>} />
              <Route path="stock" element={<RoleGuard module="stock"><Stock /></RoleGuard>} />
              <Route path="agricultura" element={<RoleGuard module="agricultura"><Agricultura /></RoleGuard>} />
              <Route path="pecuaria" element={<RoleGuard module="pecuaria"><ProducaoPecuaria /></RoleGuard>} />
              <Route path="financeiro" element={<RoleGuard module="financeiro"><Financeiro /></RoleGuard>} />
              <Route path="patrimonio-central" element={<RoleGuard module="patrimonio"><PatrimonioCentral /></RoleGuard>} />
              <Route path="patrimonio-estacao" element={<RoleGuard module="patrimonio"><PatrimonioEstacao /></RoleGuard>} />
              <Route path="missoes" element={<RoleGuard module="missoes"><Missoes /></RoleGuard>} />
              <Route path="rh-transversal" element={<RoleGuard module="rh"><RecursosHumanosTransversal /></RoleGuard>} />
              <Route path="rh-laboratorio" element={<RoleGuard module="rh"><RecursosHumanosLaboratorio /></RoleGuard>} />
              <Route path="formacoes" element={<RoleGuard module="formacoes"><Formacoes /></RoleGuard>} />
              <Route path="investigacao" element={<RoleGuard module="investigacao"><Investigacao /></RoleGuard>} />
              <Route path="avaliacoes" element={<RoleGuard module="avaliacoes"><Avaliacoes /></RoleGuard>} />
              <Route path="bi" element={<RoleGuard module="bi"><BI /></RoleGuard>} />
              <Route path="observatorio" element={<RoleGuard module="observatorio"><Observatorio /></RoleGuard>} />

              <Route path="auditorias" element={<RoleGuard module="auditorias"><Auditorias /></RoleGuard>} />
              <Route path="nao-conformidades" element={<RoleGuard module="nao-conformidades"><NaoConformidades /></RoleGuard>} />
              <Route path="logs" element={<RoleGuard module="logs"><LogsActividade /></RoleGuard>} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="notificacoes" element={<Notificacoes />} />
              <Route path="acessibilidade" element={<RoleGuard module="acessibilidade"><Acessibilidade /></RoleGuard>} />
              <Route path="rbac" element={<RoleGuard module="rbac"><RBAC /></RoleGuard>} />
              <Route path="historico-alertas" element={<RoleGuard module="historico-alertas"><HistoricoAlertas /></RoleGuard>} />
              <Route path="documentos" element={<RoleGuard module="documentos"><Documentos /></RoleGuard>} />
              <Route path="processos" element={<RoleGuard module="processos"><Processos /></RoleGuard>} />
              <Route path="processos/tipos" element={<RoleGuard module="processos"><ProcessosTipos /></RoleGuard>} />
              <Route path="processos/analitica" element={<RoleGuard module="processos"><ProcessosAnalitica /></RoleGuard>} />
              <Route path="processos/:id" element={<RoleGuard module="processos"><ProcessoDetalhe /></RoleGuard>} />
              <Route path="legislacao" element={<RoleGuard module="legislacao"><LegislacaoAdmin /></RoleGuard>} />
              <Route path="noticias" element={<RoleGuard module="noticias"><NoticiasAdmin /></RoleGuard>} />

              <Route path="mensagens" element={<RoleGuard module="mensagens"><MensagensAdmin /></RoleGuard>} />
              <Route path="slideshow" element={<RoleGuard module="slideshow"><SlideshowAdmin /></RoleGuard>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
