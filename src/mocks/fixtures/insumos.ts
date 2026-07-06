import type { InsumoDto } from "@/types/dto/insumo";

/**
 * Dados fictícios de insumos/reagentes laboratoriais do IIV. Referenciam os ids
 * dos laboratórios de `fixtures/laboratorios.ts`. Alguns têm `quantity < minStock`
 * (para exercitar o alerta de stock baixo) e 1-2 com `expiryDate` próxima/passada
 * (data de referência do sistema: 2026-07-06).
 *
 * NOTA: mutável (`let`) — os handlers create/update/delete operam sobre este array.
 */
export let insumosFixtures: InsumoDto[] = [
  {
    id: "ins-0001",
    laboratoryId: "lab-0002",
    name: "Agar Mueller-Hinton",
    quantity: 24,
    unit: "placa",
    minStock: 10,
    expiryDate: "2027-03-31",
  },
  {
    id: "ins-0002",
    laboratoryId: "lab-0001",
    name: "Kit RT-PCR Febre Aftosa",
    quantity: 3,
    unit: "kit",
    minStock: 5,
    expiryDate: "2026-11-30",
  },
  {
    id: "ins-0003",
    laboratoryId: "lab-0004",
    name: "Taq Polimerase (500 U)",
    quantity: 8,
    unit: "frasco",
    minStock: 4,
    expiryDate: "2026-09-15",
  },
  {
    id: "ins-0004",
    laboratoryId: "lab-0004",
    name: "Primers PCR PSA (lote 2025)",
    quantity: 2,
    unit: "tubo",
    minStock: 6,
    expiryDate: "2026-07-20",
  },
  {
    id: "ins-0005",
    laboratoryId: "lab-0003",
    name: "Lâminas de microscopia",
    quantity: 120,
    unit: "unidade",
    minStock: 50,
    expiryDate: null,
  },
  {
    id: "ins-0006",
    laboratoryId: "lab-0002",
    name: "Discos de antibiótico (sortido)",
    quantity: 15,
    unit: "cartucho",
    minStock: 8,
    expiryDate: "2026-06-30",
  },
  {
    id: "ins-0007",
    laboratoryId: "lab-0006",
    name: "Formol tamponado 10%",
    quantity: 6,
    unit: "litro",
    minStock: 3,
    expiryDate: "2028-01-31",
  },
  {
    id: "ins-0008",
    laboratoryId: "lab-0001",
    name: "Meio de transporte viral (VTM)",
    quantity: 4,
    unit: "frasco",
    minStock: 12,
    expiryDate: "2026-10-10",
  },
  {
    id: "ins-0009",
    laboratoryId: "lab-0005",
    name: "Caldo de enriquecimento (Salmonella)",
    quantity: 9,
    unit: "frasco",
    minStock: 5,
    expiryDate: "2026-08-05",
  },
  {
    id: "ins-0010",
    laboratoryId: "lab-0003",
    name: "Corante Giemsa",
    quantity: 1,
    unit: "litro",
    minStock: 2,
    expiryDate: "2027-02-28",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setInsumosFixtures(next: InsumoDto[]) {
  insumosFixtures = next;
}
