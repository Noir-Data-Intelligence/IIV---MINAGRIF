import { createRecursosHumanosHandlers } from "@/mocks/handlers/recursosHumanosFactory";
import {
  contractsLaboratorioFixtures,
  employeesLaboratorioFixtures,
  leavesLaboratorioFixtures,
} from "@/mocks/fixtures/recursosHumanosLaboratorio";

/** Handlers MSW do RH Laboratorial — `/rh-laboratorio/*`, esquema separado do RH Transversal. */
export const recursosHumanosLaboratorioHandlers = createRecursosHumanosHandlers(
  "rh-laboratorio",
  "laboratorio",
  employeesLaboratorioFixtures,
  contractsLaboratorioFixtures,
  leavesLaboratorioFixtures,
);

export default recursosHumanosLaboratorioHandlers;
