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
import { analisesHandlers } from "@/mocks/handlers/analises";
import { insumosHandlers } from "@/mocks/handlers/insumos";
import { resultadosHandlers } from "@/mocks/handlers/resultados";
import { produtosHandlers } from "@/mocks/handlers/produtos";
import { lotesHandlers } from "@/mocks/handlers/lotes";
import { planeamentoHandlers } from "@/mocks/handlers/planeamento";
import { distribuicaoHandlers } from "@/mocks/handlers/distribuicao";

/**
 * Agregador de todos os handlers MSW.
 *
 * À medida que cada módulo migra, importa-se aqui o seu array de handlers e
 * acrescenta-se ao spread (ex: `...legislacaoHandlers`).
 */
export const handlers = [
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
  ...analisesHandlers,
  ...insumosHandlers,
  ...resultadosHandlers,
  ...produtosHandlers,
  ...lotesHandlers,
  ...planeamentoHandlers,
  ...distribuicaoHandlers,
];

export default handlers;
