import type {
  ContractDto,
  EmployeeDto,
  LeaveDto,
} from "@/types/dto/recursosHumanos";

/**
 * Dados fictícios mas plausíveis do RH Laboratorial do IIV — esquema separado
 * do RH Transversal (dualidade obrigatória, ver
 * SIG-IIV-MEMORIA-PROJETO.md secção 6): o laboratório emite e aprova os seus
 * próprios processos de RH de forma autónoma. Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * Cobre técnicos e responsáveis de laboratório, os respectivos vínculos
 * contratuais e um histórico de férias/ausências mais reduzido que o do RH
 * Transversal.
 *
 * NOTA: exportados como `const` mas MUTÁVEIS via `.unshift()`/`.splice()` (nunca
 * reatribuídos) — os handlers create/update/delete operam sobre estes arrays
 * em memória, persistindo alterações durante a sessão do browser (perde-se no
 * refresh, comportamento esperado de um mock).
 */

export const employeesLaboratorioFixtures: EmployeeDto[] = [
  {
    id: "emp-lab-0001",
    employeeNumber: "LAB-0001",
    fullName: "Teresa Mbala",
    position: "Responsável de Laboratório",
    nationalId: "005812234LA018",
    phone: "+244 923 445 671",
    email: "teresa.mbala@iiv.gov.ao",
    departmentId: "dep-0002",
    hireDate: "2014-06-02",
    isActive: true,
    qualifications: "Doutoramento em Biologia Molecular; responsável pelo Laboratório de Virologia.",
    notes: "Responsável técnica do laboratório de Virologia.",
    createdAt: "2014-06-02T08:00:00.000Z",
  },
  {
    id: "emp-lab-0002",
    employeeNumber: "LAB-0002",
    fullName: "Amélia Sunga",
    position: "Técnica de Bacteriologia",
    nationalId: "007634512LA027",
    phone: "+244 924 118 903",
    email: "amelia.sunga@iiv.gov.ao",
    departmentId: "dep-0003",
    hireDate: "2018-02-19",
    isActive: true,
    qualifications: "Licenciatura em Análises Clínicas e Saúde Pública; técnica de Bacteriologia.",
    notes: null,
    createdAt: "2018-02-19T08:00:00.000Z",
  },
  {
    id: "emp-lab-0003",
    employeeNumber: "LAB-0003",
    fullName: "João Kiala",
    position: "Técnico de Parasitologia",
    nationalId: "008921345LA033",
    phone: "+244 925 887 220",
    email: "joao.kiala@iiv.gov.ao",
    departmentId: "dep-0004",
    hireDate: "2019-10-07",
    isActive: true,
    qualifications: "Técnico superior de Parasitologia.",
    notes: null,
    createdAt: "2019-10-07T08:00:00.000Z",
  },
  {
    id: "emp-lab-0004",
    employeeNumber: "LAB-0004",
    fullName: "Anselmo Nzau",
    position: "Responsável de Biologia Molecular",
    nationalId: "009456781LA044",
    phone: "+244 926 330 552",
    email: "anselmo.nzau@iiv.gov.ao",
    departmentId: "dep-0002",
    hireDate: "2021-01-11",
    isActive: true,
    qualifications: "Mestrado em Biologia Molecular; responsável pelo diagnóstico por PCR.",
    notes: null,
    createdAt: "2021-01-11T08:00:00.000Z",
  },
];

export const contractsLaboratorioFixtures: ContractDto[] = [
  {
    id: "con-lab-0001",
    employeeId: "emp-lab-0001",
    contractType: "efectivo",
    position: "Responsável de Laboratório",
    startDate: "2014-06-02",
    endDate: null,
    salary: 420000,
    currency: "AOA",
    isActive: true,
    notes: null,
    createdAt: "2014-06-02T08:00:00.000Z",
  },
  {
    id: "con-lab-0002",
    employeeId: "emp-lab-0002",
    contractType: "efectivo",
    position: "Técnica de Bacteriologia",
    startDate: "2018-02-19",
    endDate: null,
    salary: 280000,
    currency: "AOA",
    isActive: true,
    notes: null,
    createdAt: "2018-02-19T08:00:00.000Z",
  },
  {
    id: "con-lab-0003",
    employeeId: "emp-lab-0003",
    contractType: "termo_certo",
    position: "Técnico de Parasitologia",
    startDate: "2024-10-07",
    endDate: "2026-10-07",
    salary: 250000,
    currency: "AOA",
    isActive: true,
    notes: "Renovação prevista até Outubro de 2026.",
    createdAt: "2024-10-07T08:00:00.000Z",
  },
  {
    id: "con-lab-0004",
    employeeId: "emp-lab-0004",
    contractType: "efectivo",
    position: "Responsável de Biologia Molecular",
    startDate: "2021-01-11",
    endDate: null,
    salary: 350000,
    currency: "AOA",
    isActive: true,
    notes: null,
    createdAt: "2021-01-11T08:00:00.000Z",
  },
];

export const leavesLaboratorioFixtures: LeaveDto[] = [
  {
    id: "lea-lab-0001",
    employeeId: "emp-lab-0002",
    leaveType: "ferias",
    startDate: "2026-08-01",
    endDate: "2026-08-15",
    days: 15,
    status: "aprovada",
    reason: "Férias anuais.",
    createdAt: "2026-07-10T09:00:00.000Z",
  },
  {
    id: "lea-lab-0002",
    employeeId: "emp-lab-0003",
    leaveType: "doenca",
    startDate: "2026-06-05",
    endDate: "2026-06-08",
    days: 4,
    status: "concluida",
    reason: "Baixa médica.",
    createdAt: "2026-06-05T08:30:00.000Z",
  },
];
