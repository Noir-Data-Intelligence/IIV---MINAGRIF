import { authHandlers } from "@/mocks/handlers/auth";
import { chatAssistantHandlers } from "@/mocks/handlers/chatAssistant";
import { noticiasHandlers } from "@/mocks/handlers/noticias";
import { legislacaoHandlers } from "@/mocks/handlers/legislacao";
import { departamentosHandlers } from "@/mocks/handlers/departamentos";
import { usersHandlers } from "@/mocks/handlers/users";
import { heroSlidesHandlers } from "@/mocks/handlers/heroSlides";
import { publicStatsHandlers } from "@/mocks/handlers/publicStats";
import { contactMessagesHandlers } from "@/mocks/handlers/contactMessages";
import { notificationsHandlers } from "@/mocks/handlers/notifications";
import { rbacHandlers } from "@/mocks/handlers/rbac";
import { laboratoriosHandlers } from "@/mocks/handlers/laboratorios";
import { insumosHandlers } from "@/mocks/handlers/insumos";
import { requisicoesHandlers } from "@/mocks/handlers/requisicoes";
import { amostrasHandlers } from "@/mocks/handlers/amostras";
import { boletinsHandlers } from "@/mocks/handlers/boletins";
import { criteriosRejeicaoHandlers } from "@/mocks/handlers/criteriosRejeicao";
import { produtosHandlers } from "@/mocks/handlers/produtos";
import { lotesHandlers } from "@/mocks/handlers/lotes";
import { planeamentoHandlers } from "@/mocks/handlers/planeamento";
import { distribuicaoHandlers } from "@/mocks/handlers/distribuicao";
import { estacoesHandlers } from "@/mocks/handlers/estacoes";
import { auditoriasHandlers } from "@/mocks/handlers/auditorias";
import { naoConformidadesHandlers } from "@/mocks/handlers/naoConformidades";
import { logsHandlers } from "@/mocks/handlers/logs";
import { animaisHandlers } from "@/mocks/handlers/animais";
import { inseminacaoHandlers } from "@/mocks/handlers/inseminacao";
import { documentosHandlers } from "@/mocks/handlers/documentos";
import { documentLinksHandlers } from "@/mocks/handlers/documentLinks";
import { documentPermissionsHandlers } from "@/mocks/handlers/documentPermissions";
import { processTypesHandlers } from "@/mocks/handlers/processTypes";
import { processesHandlers } from "@/mocks/handlers/processes";
import { financeiroHandlers } from "@/mocks/handlers/financeiro";
import { patrimonioCentralHandlers } from "@/mocks/handlers/patrimonioCentral";
import { patrimonioEstacaoHandlers } from "@/mocks/handlers/patrimonioEstacao";
import { recursosHumanosTransversalHandlers } from "@/mocks/handlers/recursosHumanosTransversal";
import { recursosHumanosLaboratorioHandlers } from "@/mocks/handlers/recursosHumanosLaboratorio";
import { formacoesHandlers } from "@/mocks/handlers/formacoes";
import { missoesHandlers } from "@/mocks/handlers/missoes";
import { investigacaoHandlers } from "@/mocks/handlers/investigacao";
import { observatorioHandlers } from "@/mocks/handlers/observatorio";
import { stockHandlers } from "@/mocks/handlers/stock";
import { avaliacoesHandlers } from "@/mocks/handlers/avaliacoes";
import { agriculturaHandlers } from "@/mocks/handlers/agricultura";
import { pecuariaHandlers } from "@/mocks/handlers/pecuaria";
import { perfilHandlers } from "@/mocks/handlers/perfil";
import { dashboardAlertHistoryHandlers } from "@/mocks/handlers/dashboardAlertHistory";
import { dashboardPrefsHandlers } from "@/mocks/handlers/dashboardPrefs";
import { dashboardAlertAcksHandlers } from "@/mocks/handlers/dashboardAlertAcks";

/**
 * Agregador de todos os handlers MSW.
 *
 * À medida que cada módulo migra, importa-se aqui o seu array de handlers e
 * acrescenta-se ao spread (ex: `...legislacaoHandlers`).
 */
export const handlers = [
  ...authHandlers,
  ...chatAssistantHandlers,
  ...noticiasHandlers,
  ...legislacaoHandlers,
  ...departamentosHandlers,
  ...usersHandlers,
  ...heroSlidesHandlers,
  ...publicStatsHandlers,
  ...contactMessagesHandlers,
  ...notificationsHandlers,
  ...rbacHandlers,
  ...laboratoriosHandlers,
  ...insumosHandlers,
  ...requisicoesHandlers,
  ...amostrasHandlers,
  ...boletinsHandlers,
  ...criteriosRejeicaoHandlers,
  ...produtosHandlers,
  ...lotesHandlers,
  ...planeamentoHandlers,
  ...distribuicaoHandlers,
  ...estacoesHandlers,
  ...auditoriasHandlers,
  ...naoConformidadesHandlers,
  ...logsHandlers,
  ...animaisHandlers,
  ...inseminacaoHandlers,
  ...documentosHandlers,
  ...documentLinksHandlers,
  ...documentPermissionsHandlers,
  ...processTypesHandlers,
  ...processesHandlers,
  ...financeiroHandlers,
  ...patrimonioCentralHandlers,
  ...patrimonioEstacaoHandlers,
  ...recursosHumanosTransversalHandlers,
  ...recursosHumanosLaboratorioHandlers,
  ...formacoesHandlers,
  ...missoesHandlers,
  ...investigacaoHandlers,
  ...observatorioHandlers,
  ...stockHandlers,
  ...avaliacoesHandlers,
  ...agriculturaHandlers,
  ...pecuariaHandlers,
  ...perfilHandlers,
  ...dashboardAlertHistoryHandlers,
  ...dashboardPrefsHandlers,
  ...dashboardAlertAcksHandlers,
];

export default handlers;
