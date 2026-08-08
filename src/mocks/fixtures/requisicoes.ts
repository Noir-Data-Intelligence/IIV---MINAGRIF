import type { RequisicaoDto } from "@/types/dto/requisicao";

/** Requisições de entrada (FM-SQ-040/041/042/046/047, FM-CGISC-073) — cada uma com um lote de amostras (`fixtures/amostras.ts`). */
export let requisicoesFixtures: RequisicaoDto[] = [
  {
    id: "req-0001",
    numero: "PAT-001-2026",
    laboratorioId: "lab-0002",
    tipoSujeito: "animal",
    clienteNome: "Cooperativa Agropecuária do Huambo",
    clienteContacto: "+244 927 000 111",
    veterinarioResponsavel: "Dr. Kiala Bumba",
    dadosEpidemiologicos: null,
    dadosFacturacao: null,
    consentimento: true,
    assinaturaCliente: "assinatura-cliente-req-0001",
    createdBy: "usr-0006",
    createdAt: "2026-06-16T09:50:00.000Z",
  },
  {
    id: "req-0002",
    numero: "PAT-002-2026",
    laboratorioId: "lab-0004",
    tipoSujeito: "animal",
    clienteNome: "Direcção Provincial de Benguela",
    clienteContacto: "+244 913 222 333",
    veterinarioResponsavel: "Dra. Ussumane Cachimbombo",
    dadosEpidemiologicos: { surtoReportado: true, regiao: "Benguela" },
    dadosFacturacao: null,
    consentimento: true,
    assinaturaCliente: "assinatura-cliente-req-0002",
    createdBy: "usr-0006",
    createdAt: "2026-06-10T10:40:00.000Z",
  },
  {
    id: "req-0003",
    numero: "PAT-003-2026",
    laboratorioId: "lab-0003",
    tipoSujeito: "animal",
    clienteNome: "Herdade do Namibe",
    clienteContacto: "+244 936 444 555",
    veterinarioResponsavel: null,
    dadosEpidemiologicos: null,
    dadosFacturacao: null,
    consentimento: true,
    assinaturaCliente: "assinatura-cliente-req-0003",
    createdBy: "usr-0005",
    createdAt: "2026-06-12T08:15:00.000Z",
  },
];

export function setRequisicoesFixtures(next: RequisicaoDto[]) {
  requisicoesFixtures = next;
}
