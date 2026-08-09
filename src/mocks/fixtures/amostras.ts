import type { AmostraDto, AmostraRejeicaoDto } from "@/types/dto/amostra";

/** Amostras do lote de cada requisição (`fixtures/requisicoes.ts`) — cobre triagem pendente/aceite/rejeitada. */
export let amostrasFixtures: AmostraDto[] = [
  {
    id: "amo-0001",
    requisicaoId: "req-0001",
    numero: "REQ-2026-001-A1",
    tipoAmostra: "Zaragatoa nasal",
    origemMatriz: "Mucosa nasal",
    pontoColheita: "Explorações — Huambo",
    colhidaPor: "Rosa Ngueve Chissano",
    sujeito: { especie: "Suíno", sexo: "M", idade: "8 meses", identificacao: "SUI-0210" },
    latitude: -12.7756,
    longitude: 15.7392,
    recebidaEm: "2026-06-16T10:00:00.000Z",
    status: "rejeitada",
  },
  {
    id: "amo-0002",
    requisicaoId: "req-0001",
    numero: "REQ-2026-001-A2",
    tipoAmostra: "Tecido",
    origemMatriz: "Nódulo linfático",
    pontoColheita: "Matadouro Municipal do Lubango",
    colhidaPor: "Rosa Ngueve Chissano",
    sujeito: { especie: "Bovino", sexo: "F", idade: "3 anos", identificacao: "BOV-3391" },
    latitude: -14.9177,
    longitude: 13.4925,
    recebidaEm: "2026-06-16T10:05:00.000Z",
    status: "aceite",
  },
  {
    id: "amo-0003",
    requisicaoId: "req-0002",
    numero: "REQ-2026-002-A1",
    tipoAmostra: "Sangue",
    origemMatriz: "Sangue total (EDTA)",
    pontoColheita: "Direcção Provincial de Benguela",
    colhidaPor: "João Baptista Sachiwo",
    sujeito: { especie: "Aves", sexo: null, idade: "lote", identificacao: null },
    latitude: -12.5763,
    longitude: 13.4055,
    recebidaEm: "2026-07-02T09:15:00.000Z",
    status: "recebida",
  },
  {
    id: "amo-0004",
    requisicaoId: "req-0002",
    numero: "REQ-2026-002-A2",
    tipoAmostra: "Tecido",
    origemMatriz: "Traqueia",
    pontoColheita: "Direcção Provincial de Benguela",
    colhidaPor: "João Baptista Sachiwo",
    sujeito: { especie: "Aves", sexo: null, idade: "lote", identificacao: null },
    latitude: null,
    longitude: null,
    recebidaEm: "2026-06-10T11:00:00.000Z",
    status: "aceite",
  },
  {
    id: "amo-0005",
    requisicaoId: "req-0003",
    numero: "REQ-2026-003-A1",
    tipoAmostra: "Fezes",
    origemMatriz: "Amostra fecal directa",
    pontoColheita: "Herdade do Namibe",
    colhidaPor: "João Baptista Sachiwo",
    sujeito: { especie: "Caprino", sexo: "F", idade: "2 anos", identificacao: "CAP-0087" },
    latitude: -15.1961,
    longitude: 12.1522,
    recebidaEm: "2026-07-03T08:30:00.000Z",
    status: "recebida",
  },
  {
    id: "amo-0006",
    requisicaoId: "req-0003",
    numero: "REQ-2026-003-A2",
    tipoAmostra: "Fezes",
    origemMatriz: "Amostra fecal directa",
    pontoColheita: "Herdade do Namibe",
    colhidaPor: "João Baptista Sachiwo",
    sujeito: { especie: "Ovino", sexo: "M", idade: "1 ano", identificacao: "OVI-0155" },
    latitude: null,
    longitude: null,
    recebidaEm: "2026-06-12T08:35:00.000Z",
    status: "aceite",
  },
];

export function setAmostrasFixtures(next: AmostraDto[]) {
  amostrasFixtures = next;
}

export let amostraRejeicoesFixtures: AmostraRejeicaoDto[] = [
  {
    id: "arej-0001",
    amostraId: "amo-0001",
    criterioRejeicaoId: "crit-0003",
    responsavelId: "usr-0005",
    detalhe: "Amostra hemolisada por atraso no transporte.",
    assinaturaResponsavel: "João Baptista Sachiwo",
    rejeitadaEm: "2026-06-16T10:30:00.000Z",
  },
];

export function setAmostraRejeicoesFixtures(next: AmostraRejeicaoDto[]) {
  amostraRejeicoesFixtures = next;
}
