import type { AssetEstacaoDto, MaintenanceEstacaoDto } from "@/types/dto/patrimonioEstacao";

/**
 * Dados fictícios mas realistas do Património de Estação do IIV — esquema
 * separado do Património Central (dualidade obrigatória, ver
 * SIG-IIV-MEMORIA-PROJETO.md secção 6). `stationId` é sempre obrigatório
 * (est-0001..est-0004, ver `fixtures/estacoes.ts`).
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers create/update/
 * delete operam sobre estes arrays em memória, persistindo alterações durante a
 * sessão do browser (perde-se no refresh, comportamento esperado de um mock).
 */
export let assetsEstacaoFixtures: AssetEstacaoDto[] = [
  {
    id: "ast-e-0001",
    code: "PAT-E-0001",
    name: "Tractor agrícola Massey Ferguson 4275",
    category: "viatura",
    description: "Tractor para lavoura, transporte de forragem e maneio de pastagens da estação.",
    location: "Parque de máquinas",
    stationId: "est-0001",
    departmentId: "dep-0005",
    responsibleUser: "Sr. Bento Kapinga",
    acquisitionDate: "2019-08-14",
    acquisitionCost: 26000000,
    currentValue: 14500000,
    serialNumber: "MF4275-1908-221",
    status: "activo",
    notes: "Revisão a cada 500 horas de trabalho.",
    createdAt: "2019-08-14T08:00:00.000Z",
    updatedAt: "2026-04-11T10:00:00.000Z",
  },
  {
    id: "ast-e-0002",
    code: "PAT-E-0002",
    name: "Gerador diesel Cummins 30 kVA",
    category: "energia",
    description: "Grupo electrogéneo de apoio à ordenha mecânica e iluminação dos currais.",
    location: "Casa das máquinas",
    stationId: "est-0001",
    departmentId: "dep-0008",
    responsibleUser: "Sr. Bento Kapinga",
    acquisitionDate: "2020-03-02",
    acquisitionCost: 12500000,
    currentValue: 7200000,
    serialNumber: "CUM-30KVA-2003-19",
    status: "activo",
    notes: null,
    createdAt: "2020-03-02T09:00:00.000Z",
    updatedAt: "2025-12-01T09:00:00.000Z",
  },
  {
    id: "ast-e-0003",
    code: "PAT-E-0003",
    name: "Bomba de água submersível Grundfos",
    category: "energia",
    description: "Bomba do furo de abastecimento de água para os currais e pastagens irrigadas.",
    location: "Furo nº 2",
    stationId: "est-0002",
    departmentId: "dep-0005",
    responsibleUser: null,
    acquisitionDate: "2021-11-20",
    acquisitionCost: 4800000,
    currentValue: 3100000,
    serialNumber: "GRF-SP-2111-08",
    status: "avariado",
    notes: "Motor queimado — aguarda peça de substituição.",
    createdAt: "2021-11-20T10:00:00.000Z",
    updatedAt: "2026-06-15T11:00:00.000Z",
  },
  {
    id: "ast-e-0004",
    code: "PAT-E-0004",
    name: "Viatura pick-up Toyota Hilux (estação)",
    category: "viatura",
    description: "Viatura de apoio às actividades diárias e transporte de insumos da estação.",
    location: "Parque automóvel",
    stationId: "est-0003",
    departmentId: "dep-0005",
    responsibleUser: "Sr. Domingos Sachipengo",
    acquisitionDate: "2022-06-09",
    acquisitionCost: 30500000,
    currentValue: 23000000,
    serialNumber: "MJ-11-40-AO",
    status: "activo",
    notes: "Revisão a cada 10 000 km. Matrícula MJ-11-40-AO.",
    createdAt: "2022-06-09T09:30:00.000Z",
    updatedAt: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "ast-e-0005",
    code: "PAT-E-0005",
    name: "Sistema de vedação eléctrica de pastagem",
    category: "outros",
    description: "Vedação eléctrica solar para rotação de piquetes de pastagem do efectivo bovino.",
    location: "Pastagem Norte",
    stationId: "est-0001",
    departmentId: "dep-0005",
    responsibleUser: null,
    acquisitionDate: "2023-02-28",
    acquisitionCost: 2100000,
    currentValue: 1600000,
    serialNumber: null,
    status: "activo",
    notes: null,
    createdAt: "2023-02-28T08:00:00.000Z",
    updatedAt: "2025-07-19T08:00:00.000Z",
  },
];

export let maintenancesEstacaoFixtures: MaintenanceEstacaoDto[] = [
  {
    id: "man-e-0001",
    assetId: "ast-e-0001",
    date: "2026-04-11",
    type: "preventiva",
    description: "Mudança de óleo, filtros e verificação do sistema hidráulico.",
    cost: 380000,
    provider: "AgriTécnica Huíla",
    nextDueDate: "2026-10-11",
    notes: null,
    createdAt: "2026-04-11T10:00:00.000Z",
  },
  {
    id: "man-e-0002",
    assetId: "ast-e-0003",
    date: "2026-06-15",
    type: "correctiva",
    description: "Diagnóstico do motor submersível — bobinado queimado, aguarda peça importada.",
    cost: 0,
    provider: "Grundfos Angola",
    nextDueDate: null,
    notes: "Orçamento de reparação pendente de aprovação.",
    createdAt: "2026-06-15T11:00:00.000Z",
  },
  {
    id: "man-e-0003",
    assetId: "ast-e-0004",
    date: "2026-05-02",
    type: "preventiva",
    description: "Revisão dos 30 000 km: óleo, travões e alinhamento.",
    cost: 720000,
    provider: "Toyota de Angola (CST)",
    nextDueDate: "2026-11-02",
    notes: null,
    createdAt: "2026-05-02T09:00:00.000Z",
  },
];

/** Substitui o conteúdo do array de activos em memória (usado pelos handlers). */
export function setAssetsEstacaoFixtures(next: AssetEstacaoDto[]) {
  assetsEstacaoFixtures = next;
}

/** Substitui o conteúdo do array de manutenções em memória (usado pelos handlers). */
export function setMaintenancesEstacaoFixtures(next: MaintenanceEstacaoDto[]) {
  maintenancesEstacaoFixtures = next;
}
