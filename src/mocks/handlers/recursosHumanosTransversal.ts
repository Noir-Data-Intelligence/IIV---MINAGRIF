import { createRecursosHumanosHandlers } from "@/mocks/handlers/recursosHumanosFactory";
import {
  contractsTransversalFixtures,
  employeesTransversalFixtures,
  leavesTransversalFixtures,
} from "@/mocks/fixtures/recursosHumanosTransversal";

/** Handlers MSW do RH Transversal — `/rh-transversal/*`, esquema separado do RH Laboratorial. */
export const recursosHumanosTransversalHandlers = createRecursosHumanosHandlers(
  "rh-transversal",
  "transversal",
  employeesTransversalFixtures,
  contractsTransversalFixtures,
  leavesTransversalFixtures,
);

export default recursosHumanosTransversalHandlers;
