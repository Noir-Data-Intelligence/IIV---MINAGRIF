import type { DistribuicaoDto } from "@/types/dto/distribuicao";

/**
 * Distribuições fictícias do IIV para destinos plausíveis (estações regionais e
 * províncias angolanas), referenciando os lotes de `fixtures/lotes.ts`. Algumas
 * datas caem no mês corrente (meados de 2026) para exercitar o KPI "distribuído
 * no mês".
 *
 * `let` mutável — os handlers de escrita operam sobre este array em memória.
 */
export let distribuicaoFixtures: DistribuicaoDto[] = [
  {
    id: "dist-0001",
    destination: "Estação Zootécnica da Humpata (Huíla)",
    quantity: 1200,
    distributionDate: "2026-07-02",
    notes: "Campanha de vacinação de caprinos.",
    batchId: "lote-0001",
  },
  {
    id: "dist-0002",
    destination: "Direcção Provincial da Agricultura do Namibe",
    quantity: 800,
    distributionDate: "2026-07-04",
    notes: null,
    batchId: "lote-0001",
  },
  {
    id: "dist-0003",
    destination: "Estação de Investigação de Chianga (Huambo)",
    quantity: 6000,
    distributionDate: "2026-06-20",
    notes: "Vacinação avícola de larga escala.",
    batchId: "lote-0002",
  },
  {
    id: "dist-0004",
    destination: "Centro Veterinário do Cunene",
    quantity: 500,
    distributionDate: "2026-07-01",
    notes: null,
    batchId: "lote-0006",
  },
  {
    id: "dist-0005",
    destination: "Direcção Provincial da Agricultura de Benguela",
    quantity: 4000,
    distributionDate: "2026-06-28",
    notes: "Febre aftosa — efectivo bovino do litoral.",
    batchId: "lote-0006",
  },
  {
    id: "dist-0006",
    destination: "Estação Zootécnica da Quibala (Cuanza-Sul)",
    quantity: 250,
    distributionDate: "2026-05-30",
    notes: null,
    batchId: "lote-0004",
  },
  {
    id: "dist-0007",
    destination: "Laboratório Regional de Malanje",
    quantity: 120,
    distributionDate: "2026-06-10",
    notes: "Kits de diagnóstico de brucelose.",
    batchId: "lote-0007",
  },
  {
    id: "dist-0008",
    destination: "Direcção Provincial da Agricultura do Bié",
    quantity: 700,
    distributionDate: "2026-07-05",
    notes: null,
    batchId: "lote-0003",
  },
  {
    id: "dist-0009",
    destination: "Centro de Reprodução Animal do Uíge",
    quantity: 400,
    distributionDate: "2026-07-03",
    notes: "Anti-rábica para o programa canino urbano.",
    batchId: "lote-0010",
  },
  {
    id: "dist-0010",
    destination: "Estação Experimental do Kwanza-Norte",
    quantity: 3000,
    distributionDate: "2026-04-15",
    notes: null,
    batchId: "lote-0009",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setDistribuicaoFixtures(next: DistribuicaoDto[]) {
  distribuicaoFixtures = next;
}
