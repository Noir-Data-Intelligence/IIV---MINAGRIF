import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import Index from "./pages/Index";
import Sobre from "./pages/Sobre";
import Servicos from "./pages/Servicos";
import Noticias from "./pages/Noticias";
import NoticiaDetalhe from "./pages/NoticiaDetalhe";
import Legislacao from "./pages/Legislacao";
import LegislacaoDetalhe from "./pages/LegislacaoDetalhe";
import LegislacaoAdmin from "./pages/admin/Legislacao";
import NoticiasAdmin from "./pages/admin/Noticias";
import MensagensAdmin from "./pages/admin/Mensagens";
import SlideshowAdmin from "./pages/admin/Slideshow";

import Contactos from "./pages/Contactos";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Notificacoes from "./pages/admin/Notificacoes";
import Login from "./pages/Login";
import Registar from "./pages/Registar";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/admin/Dashboard";
import PainelDetalhe from "./pages/admin/PainelDetalhe";
import Utilizadores from "./pages/admin/Utilizadores";
import Departamentos from "./pages/admin/Departamentos";
import Laboratorios from "./pages/admin/Laboratorios";
import Analises from "./pages/admin/Analises";
import Resultados from "./pages/admin/Resultados";
import Insumos from "./pages/admin/Insumos";
import Produtos from "./pages/admin/Produtos";
import Lotes from "./pages/admin/Lotes";
import Planeamento from "./pages/admin/Planeamento";
import Distribuicao from "./pages/admin/Distribuicao";
import Estacoes from "./pages/admin/Estacoes";
import Animais from "./pages/admin/Animais";
import Inseminacao from "./pages/admin/Inseminacao";
import Stock from "./pages/admin/Stock";
import Agricultura from "./pages/admin/Agricultura";
import ProducaoPecuaria from "./pages/admin/ProducaoPecuaria";
import Financeiro from "./pages/admin/Financeiro";
import Patrimonio from "./pages/admin/Patrimonio";
import Missoes from "./pages/admin/Missoes";
import RecursosHumanos from "./pages/admin/RecursosHumanos";
import Formacoes from "./pages/admin/Formacoes";
import Investigacao from "./pages/admin/Investigacao";
import Avaliacoes from "./pages/admin/Avaliacoes";
import BI from "./pages/admin/BI";
import Auditorias from "./pages/admin/Auditorias";
import NaoConformidades from "./pages/admin/NaoConformidades";
import LogsActividade from "./pages/admin/LogsActividade";
import Perfil from "./pages/admin/Perfil";
import Acessibilidade from "./pages/admin/Acessibilidade";
import RBAC from "./pages/admin/RBAC";
import HistoricoAlertas from "./pages/admin/HistoricoAlertas";
import Documentos from "./pages/admin/Documentos";
import Processos from "./pages/admin/Processos";
import ProcessoDetalhe from "./pages/admin/ProcessoDetalhe";
import ProcessosTipos from "./pages/admin/ProcessosTipos";
import ProcessosAnalitica from "./pages/admin/ProcessosAnalitica";
import { RoleGuard } from "@/components/RoleGuard";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="analises" element={<RoleGuard module="analises"><Analises /></RoleGuard>} />
              <Route path="resultados" element={<RoleGuard module="resultados"><Resultados /></RoleGuard>} />
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
              <Route path="patrimonio" element={<RoleGuard module="patrimonio"><Patrimonio /></RoleGuard>} />
              <Route path="missoes" element={<RoleGuard module="missoes"><Missoes /></RoleGuard>} />
              <Route path="rh" element={<RoleGuard module="rh"><RecursosHumanos /></RoleGuard>} />
              <Route path="formacoes" element={<RoleGuard module="formacoes"><Formacoes /></RoleGuard>} />
              <Route path="investigacao" element={<RoleGuard module="investigacao"><Investigacao /></RoleGuard>} />
              <Route path="avaliacoes" element={<RoleGuard module="avaliacoes"><Avaliacoes /></RoleGuard>} />
              <Route path="bi" element={<RoleGuard module="bi"><BI /></RoleGuard>} />

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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
