import type { AnimalDto, AnimalEventDto, HealthRecordDto } from "@/types/dto/animal";

/**
 * Dados fictícios do módulo Animais. `stationId` referencia os `id` estáveis das
 * fixtures de Estações (est-000X). Servem os handlers MSW enquanto o backend
 * Laravel não existe.
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers de escrita
 * operam sobre estes arrays em memória (reset no refresh).
 */
export let animaisFixtures: AnimalDto[] = [
  {
    id: "ani-0001",
    stationId: "est-0001",
    tag: "BR-0001",
    name: "Mimosa",
    species: "Bovino",
    breed: "Nelore",
    sex: "femea",
    birthDate: "2021-03-12",
    motherTag: "BR-0100",
    fatherTag: "BR-0200",
    status: "activo",
    currentWeightKg: 385,
    notes: "Excelente índice de fertilidade.",
    createdAt: "2023-02-01T08:00:00.000Z",
  },
  {
    id: "ani-0002",
    stationId: "est-0001",
    tag: "BR-0002",
    name: "Trovão",
    species: "Bovino",
    breed: "Nelore",
    sex: "macho",
    birthDate: "2020-07-05",
    motherTag: null,
    fatherTag: null,
    status: "activo",
    currentWeightKg: 620,
    notes: "Reprodutor de referência.",
    createdAt: "2023-02-01T08:10:00.000Z",
  },
  {
    id: "ani-0003",
    stationId: "est-0003",
    tag: "CP-0011",
    name: null,
    species: "Caprino",
    breed: "Angora",
    sex: "femea",
    birthDate: "2022-01-20",
    motherTag: "CP-0003",
    fatherTag: null,
    status: "activo",
    currentWeightKg: 42,
    notes: null,
    createdAt: "2023-03-15T09:00:00.000Z",
  },
  {
    id: "ani-0004",
    stationId: "est-0003",
    tag: "OV-0007",
    name: "Neve",
    species: "Ovino",
    breed: "Merino",
    sex: "femea",
    birthDate: "2021-11-02",
    motherTag: null,
    fatherTag: null,
    status: "transferido",
    currentWeightKg: 55,
    notes: "Transferida para a Chianga.",
    createdAt: "2023-04-10T10:30:00.000Z",
  },
  {
    id: "ani-0005",
    stationId: "est-0002",
    tag: "BR-0050",
    name: "Bravo",
    species: "Bovino",
    breed: "Girolando",
    sex: "macho",
    birthDate: "2019-05-18",
    motherTag: null,
    fatherTag: null,
    status: "abatido",
    currentWeightKg: null,
    notes: null,
    createdAt: "2023-05-20T11:15:00.000Z",
  },
  {
    id: "ani-0006",
    stationId: "est-0006",
    tag: "BR-0088",
    name: "Estrela",
    species: "Bovino",
    breed: "Nelore",
    sex: "femea",
    birthDate: "2022-09-30",
    motherTag: "BR-0001",
    fatherTag: "BR-0002",
    status: "activo",
    currentWeightKg: 210,
    notes: "Novilha em crescimento.",
    createdAt: "2023-10-05T07:45:00.000Z",
  },
];

export let animalEventsFixtures: AnimalEventDto[] = [
  {
    id: "aev-0001",
    animalId: "ani-0001",
    eventType: "pesagem",
    eventDate: "2024-01-15",
    destination: null,
    notes: "385 kg — ganho de peso dentro do esperado.",
    createdAt: "2024-01-15T08:00:00.000Z",
  },
  {
    id: "aev-0002",
    animalId: "ani-0001",
    eventType: "vacinacao",
    eventDate: "2024-02-10",
    destination: null,
    notes: "Vacina contra febre aftosa.",
    createdAt: "2024-02-10T09:30:00.000Z",
  },
  {
    id: "aev-0003",
    animalId: "ani-0002",
    eventType: "observacao",
    eventDate: "2024-03-01",
    destination: null,
    notes: "Comportamento normal, boa condição corporal.",
    createdAt: "2024-03-01T10:00:00.000Z",
  },
];

export let healthRecordsFixtures: HealthRecordDto[] = [
  {
    id: "ahr-0001",
    animalId: "ani-0001",
    recordType: "vacina",
    productName: "Aftogan",
    dosage: "5 ml",
    diagnosis: null,
    treatment: null,
    veterinarian: "Dr. Manuel Kalunga",
    recordDate: "2024-02-10",
    nextDueDate: "2024-08-10",
    createdAt: "2024-02-10T09:30:00.000Z",
  },
  {
    id: "ahr-0002",
    animalId: "ani-0003",
    recordType: "desparasitacao",
    productName: "Ivermectina",
    dosage: "1 ml/50 kg",
    diagnosis: null,
    treatment: "Aplicação subcutânea.",
    veterinarian: "Dra. Ana Chissola",
    recordDate: "2024-01-22",
    nextDueDate: "2024-07-22",
    createdAt: "2024-01-22T11:00:00.000Z",
  },
];

export function setAnimaisFixtures(next: AnimalDto[]) {
  animaisFixtures = next;
}
export function setAnimalEventsFixtures(next: AnimalEventDto[]) {
  animalEventsFixtures = next;
}
export function setHealthRecordsFixtures(next: HealthRecordDto[]) {
  healthRecordsFixtures = next;
}
