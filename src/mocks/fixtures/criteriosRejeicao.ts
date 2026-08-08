import type { CriterioRejeicaoDto } from "@/types/dto/criterioRejeicao";

/** Catálogo de motivos de rejeição (FM-SQ-061 geral, FM-SQ-075 alimentar) — ver LaboratorioSeeder no backend. */
export let criteriosRejeicaoFixtures: CriterioRejeicaoDto[] = [
  { id: "crit-0001", laboratorioId: null, codigo: "REJ-001", motivo: "Amostra sem identificação ou identificação ilegível" },
  { id: "crit-0002", laboratorioId: null, codigo: "REJ-002", motivo: "Volume/quantidade insuficiente para a análise solicitada" },
  { id: "crit-0003", laboratorioId: null, codigo: "REJ-003", motivo: "Amostra hemolisada ou coagulada" },
  { id: "crit-0004", laboratorioId: null, codigo: "REJ-004", motivo: "Recipiente inadequado ou danificado" },
  { id: "crit-0005", laboratorioId: null, codigo: "REJ-005", motivo: "Prazo de transporte/conservação excedido" },
  { id: "crit-0006", laboratorioId: null, codigo: "REJ-006", motivo: "Requisição incompleta (falta consentimento ou assinatura)" },
  { id: "crit-0101", laboratorioId: "lab-0005", codigo: "REJ-101", motivo: "Amostra de água sem registo de temperatura na colheita" },
  { id: "crit-0102", laboratorioId: "lab-0005", codigo: "REJ-102", motivo: "Cadeia de frio quebrada durante o transporte" },
];

export function setCriteriosRejeicaoFixtures(next: CriterioRejeicaoDto[]) {
  criteriosRejeicaoFixtures = next;
}
