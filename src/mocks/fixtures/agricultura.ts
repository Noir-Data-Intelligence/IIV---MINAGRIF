import type { CropDto, FieldDto, HarvestDto } from "@/types/dto/agricultura";

/**
 * Dados fictícios mas plausíveis da actividade agrícola das estações do IIV
 * (Instituto de Investigação Veterinária de Angola). Servem os handlers MSW
 * enquanto o backend Laravel não existe.
 *
 * Culturas relevantes para Angola: milho, mandioca, feijão, batata-doce e capim
 * para pastagem. Os campos referenciam as estações de `fixtures/estacoes.ts`
 * (est-0001..est-0006) e as culturas abaixo (crop-0001..crop-0005). As colheitas
 * referenciam os campos (fld-0001..).
 *
 * NOTA: exportados como `let` para serem MUTÁVEIS — os handlers create/update/
 * delete operam sobre estes arrays em memória, persistindo alterações durante a
 * sessão do browser (perde-se no refresh, comportamento esperado de um mock).
 */

// --- Culturas --------------------------------------------------------------

export let cropsFixtures: CropDto[] = [
  {
    id: "crop-0001",
    name: "Milho",
    scientificName: "Zea mays",
    cycleDays: 120,
    notes: "Cultura de sequeiro dominante no planalto central; base alimentar.",
    createdAt: "2025-09-01T08:00:00.000Z",
  },
  {
    id: "crop-0002",
    name: "Mandioca",
    scientificName: "Manihot esculenta",
    cycleDays: 300,
    notes: "Tolerante à seca; raiz de reserva estratégica em época de escassez.",
    createdAt: "2025-09-01T08:05:00.000Z",
  },
  {
    id: "crop-0003",
    name: "Feijão",
    scientificName: "Phaseolus vulgaris",
    cycleDays: 90,
    notes: "Leguminosa fixadora de azoto; boa em rotação com o milho.",
    createdAt: "2025-09-01T08:10:00.000Z",
  },
  {
    id: "crop-0004",
    name: "Batata-doce",
    scientificName: "Ipomoea batatas",
    cycleDays: 150,
    notes: "Cultura de tuberosa resistente; ciclo curto e rústica.",
    createdAt: "2025-09-01T08:15:00.000Z",
  },
  {
    id: "crop-0005",
    name: "Capim para pastagem",
    scientificName: "Panicum maximum",
    cycleDays: 60,
    notes: "Forragem para maneio de pastagens e alimentação do efectivo pecuário.",
    createdAt: "2025-09-01T08:20:00.000Z",
  },
];

// --- Campos / talhões ------------------------------------------------------

export let fieldsFixtures: FieldDto[] = [
  {
    id: "fld-0001",
    stationId: "est-0001", // Humpata, Huíla
    cropId: "crop-0005", // Capim
    fieldCode: "HUM-P1",
    areaHa: 12.5,
    plantingDate: "2026-02-10",
    expectedHarvest: "2026-04-15",
    status: "em_crescimento",
    notes: "Pastagem de altitude para o efectivo bovino da estação.",
    createdAt: "2026-02-10T09:00:00.000Z",
  },
  {
    id: "fld-0002",
    stationId: "est-0002", // Chianga, Huambo
    cropId: "crop-0001", // Milho
    fieldCode: "CHI-A3",
    areaHa: 8.0,
    plantingDate: "2025-11-20",
    expectedHarvest: "2026-03-20",
    status: "colhido",
    notes: "Ensaio de variedades de milho de ciclo médio.",
    createdAt: "2025-11-20T09:30:00.000Z",
  },
  {
    id: "fld-0003",
    stationId: "est-0002", // Chianga, Huambo
    cropId: "crop-0003", // Feijão
    fieldCode: "CHI-B1",
    areaHa: 3.2,
    plantingDate: "2026-01-15",
    expectedHarvest: "2026-04-20",
    status: "em_crescimento",
    notes: "Rotação com o talhão de milho da campanha anterior.",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "fld-0004",
    stationId: "est-0003", // Malanje
    cropId: "crop-0002", // Mandioca
    fieldCode: "MAL-C2",
    areaHa: 15.0,
    plantingDate: "2025-10-05",
    expectedHarvest: "2026-08-01",
    status: "em_crescimento",
    notes: "Campo de multiplicação de estacas de mandioca melhorada.",
    createdAt: "2025-10-05T08:45:00.000Z",
  },
  {
    id: "fld-0005",
    stationId: "est-0004", // Mazozo, Luanda
    cropId: "crop-0004", // Batata-doce
    fieldCode: "MAZ-D1",
    areaHa: 4.5,
    plantingDate: "2026-03-01",
    expectedHarvest: "2026-07-28",
    status: "plantado",
    notes: "Ensaio de batata-doce de polpa alaranjada (rica em vitamina A).",
    createdAt: "2026-03-01T07:50:00.000Z",
  },
  {
    id: "fld-0006",
    stationId: "est-0004", // Mazozo, Luanda
    cropId: "crop-0005", // Capim
    fieldCode: "MAZ-P2",
    areaHa: 20.0,
    plantingDate: "2026-04-05",
    expectedHarvest: "2026-06-10",
    status: "em_crescimento",
    notes: "Pastagem irrigada em sistema silvopastoril.",
    createdAt: "2026-04-05T09:15:00.000Z",
  },
  {
    id: "fld-0007",
    stationId: "est-0006", // Cuando Cubango
    cropId: "crop-0001", // Milho
    fieldCode: "CCB-A1",
    areaHa: 6.0,
    plantingDate: null,
    expectedHarvest: null,
    status: "planeado",
    notes: "Talhão previsto para a próxima campanha das chuvas.",
    createdAt: "2026-06-20T11:00:00.000Z",
  },
  {
    id: "fld-0008",
    stationId: "est-0003", // Malanje
    cropId: "crop-0003", // Feijão
    fieldCode: "MAL-B4",
    areaHa: 2.0,
    plantingDate: "2025-09-10",
    expectedHarvest: "2025-12-05",
    status: "abandonado",
    notes: "Talhão abandonado por ataque de pragas na campanha anterior.",
    createdAt: "2025-09-10T08:20:00.000Z",
  },
];

// --- Colheitas -------------------------------------------------------------

export let harvestsFixtures: HarvestDto[] = [
  {
    id: "hrv-0001",
    fieldId: "fld-0002", // Milho colhido — Chianga
    harvestDate: "2026-03-22",
    quantity: 34500,
    unit: "kg",
    qualityGrade: "A",
    notes: "Rendimento acima da média para a variedade ensaiada.",
    createdAt: "2026-03-22T15:00:00.000Z",
  },
  {
    id: "hrv-0002",
    fieldId: "fld-0001", // Capim — Humpata (corte)
    harvestDate: "2026-04-16",
    quantity: 18000,
    unit: "kg",
    qualityGrade: "B",
    notes: "1.º corte de forragem verde para silagem.",
    createdAt: "2026-04-16T10:30:00.000Z",
  },
  {
    id: "hrv-0003",
    fieldId: "fld-0006", // Capim — Mazozo (corte)
    harvestDate: "2026-06-12",
    quantity: 26000,
    unit: "kg",
    qualityGrade: "A",
    notes: "Corte de pastagem irrigada; boa densidade de massa verde.",
    createdAt: "2026-06-12T09:00:00.000Z",
  },
  {
    id: "hrv-0004",
    fieldId: "fld-0001", // Capim — Humpata (2.º corte)
    harvestDate: "2026-06-28",
    quantity: 15500,
    unit: "kg",
    qualityGrade: "B",
    notes: "2.º corte da época; menor rendimento com a época seca.",
    createdAt: "2026-06-28T11:20:00.000Z",
  },
  {
    id: "hrv-0005",
    fieldId: "fld-0002", // Milho — grão seco pós-secagem
    harvestDate: "2025-04-10",
    quantity: 29800,
    unit: "kg",
    qualityGrade: "A",
    notes: "Colheita da campanha anterior (histórico 2025).",
    createdAt: "2025-04-10T14:00:00.000Z",
  },
];

/** Substitui o conteúdo dos arrays em memória (usados pelos handlers de escrita). */
export function setCropsFixtures(next: CropDto[]) {
  cropsFixtures = next;
}
export function setFieldsFixtures(next: FieldDto[]) {
  fieldsFixtures = next;
}
export function setHarvestsFixtures(next: HarvestDto[]) {
  harvestsFixtures = next;
}
