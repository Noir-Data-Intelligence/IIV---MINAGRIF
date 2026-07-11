import type {
  BreederDto,
  DoseDto,
  IACenterDto,
  InsemDto,
  TankDto,
} from "@/types/dto/inseminacao";

/**
 * Dados fictícios do módulo Inseminação Artificial. As FK cruzam entidades deste
 * módulo (centro <- reprodutor/tanque <- dose <- registo) e `animalId` referencia
 * as fixtures de Animais (ani-000X). Servem os handlers MSW enquanto o backend
 * Laravel não existe.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers de escrita operam
 * sobre estes arrays em memória (reset no refresh).
 */
export let iaCentersFixtures: IACenterDto[] = [
  {
    id: "iac-0001",
    name: "Centro de IA da Humpata",
    location: "Humpata, Huíla",
    responsibleUserId: null,
    notes: "Centro principal de recolha e processamento de sémen bovino.",
    isActive: true,
    createdAt: "2023-02-01T08:00:00.000Z",
  },
  {
    id: "iac-0002",
    name: "Centro de IA da Chianga",
    location: "Huambo",
    responsibleUserId: null,
    notes: null,
    isActive: true,
    createdAt: "2023-03-10T09:00:00.000Z",
  },
];

export let breedersFixtures: BreederDto[] = [
  {
    id: "brd-0001",
    centerId: "iac-0001",
    tag: "REP-0001",
    name: "Sultão",
    species: "Bovino",
    breed: "Nelore",
    birthDate: "2019-04-10",
    status: "activo",
    notes: "Alto índice genético.",
    createdAt: "2023-02-05T08:00:00.000Z",
  },
  {
    id: "brd-0002",
    centerId: "iac-0001",
    tag: "REP-0002",
    name: "Imperador",
    species: "Bovino",
    breed: "Girolando",
    birthDate: "2020-06-22",
    status: "activo",
    notes: null,
    createdAt: "2023-02-06T08:00:00.000Z",
  },
  {
    id: "brd-0003",
    centerId: "iac-0002",
    tag: "REP-0010",
    name: null,
    species: "Caprino",
    breed: "Boer",
    birthDate: "2021-01-15",
    status: "inactivo",
    notes: "Em repouso reprodutivo.",
    createdAt: "2023-03-12T08:00:00.000Z",
  },
];

export let nitrogenTanksFixtures: TankDto[] = [
  {
    id: "tnk-0001",
    centerId: "iac-0001",
    code: "N2-A01",
    capacityL: 35,
    currentLevelL: 28,
    minLevelL: 10,
    lastRefillDate: "2024-05-02",
    notes: null,
    createdAt: "2023-02-01T08:00:00.000Z",
  },
  {
    id: "tnk-0002",
    centerId: "iac-0001",
    code: "N2-A02",
    capacityL: 35,
    currentLevelL: 8,
    minLevelL: 10,
    lastRefillDate: "2024-03-18",
    notes: "Requer recarga urgente.",
    createdAt: "2023-02-01T08:05:00.000Z",
  },
  {
    id: "tnk-0003",
    centerId: "iac-0002",
    code: "N2-B01",
    capacityL: 20,
    currentLevelL: 15,
    minLevelL: 6,
    lastRefillDate: "2024-06-01",
    notes: null,
    createdAt: "2023-03-10T09:00:00.000Z",
  },
];

export let semenDosesFixtures: DoseDto[] = [
  {
    id: "dos-0001",
    breederId: "brd-0001",
    tankId: "tnk-0001",
    collectionDate: "2024-04-10",
    quantity: 40,
    availableQuantity: 32,
    qualityGrade: "A",
    notes: null,
    createdAt: "2024-04-10T10:00:00.000Z",
  },
  {
    id: "dos-0002",
    breederId: "brd-0002",
    tankId: "tnk-0001",
    collectionDate: "2024-04-15",
    quantity: 30,
    availableQuantity: 30,
    qualityGrade: "B",
    notes: null,
    createdAt: "2024-04-15T10:00:00.000Z",
  },
  {
    id: "dos-0003",
    breederId: "brd-0003",
    tankId: "tnk-0003",
    collectionDate: "2024-05-20",
    quantity: 15,
    availableQuantity: 5,
    qualityGrade: "A",
    notes: "Lote experimental caprino.",
    createdAt: "2024-05-20T10:00:00.000Z",
  },
];

export let inseminationRecordsFixtures: InsemDto[] = [
  {
    id: "ins-0001",
    animalId: "ani-0001",
    doseId: "dos-0001",
    technicianId: null,
    inseminationDate: "2024-05-01",
    result: "confirmada",
    pregnancyConfirmedAt: "2024-06-15",
    expectedBirthDate: "2025-02-05",
    notes: "Gestação confirmada por ecografia.",
    createdAt: "2024-05-01T09:00:00.000Z",
  },
  {
    id: "ins-0002",
    animalId: "ani-0003",
    doseId: "dos-0003",
    technicianId: null,
    inseminationDate: "2024-06-10",
    result: "pendente",
    pregnancyConfirmedAt: null,
    expectedBirthDate: null,
    notes: null,
    createdAt: "2024-06-10T09:00:00.000Z",
  },
  {
    id: "ins-0003",
    animalId: "ani-0006",
    doseId: "dos-0001",
    technicianId: null,
    inseminationDate: "2024-04-28",
    result: "falhou",
    pregnancyConfirmedAt: null,
    expectedBirthDate: null,
    notes: "Repetir cio no próximo ciclo.",
    createdAt: "2024-04-28T09:00:00.000Z",
  },
];

export function setIaCentersFixtures(next: IACenterDto[]) {
  iaCentersFixtures = next;
}
export function setBreedersFixtures(next: BreederDto[]) {
  breedersFixtures = next;
}
export function setNitrogenTanksFixtures(next: TankDto[]) {
  nitrogenTanksFixtures = next;
}
export function setSemenDosesFixtures(next: DoseDto[]) {
  semenDosesFixtures = next;
}
export function setInseminationRecordsFixtures(next: InsemDto[]) {
  inseminationRecordsFixtures = next;
}
