import type { AmostraDto } from "@/types/dto/amostra";
import type {
  AmostraMovimentoDto,
  BoletimAnaliseLabDto,
  BoletimInternoLabDto,
  ExameCatalogoDto,
  RequisicaoExameDto,
  RequisicaoLabDto,
} from "@/types/dto/lab";

/**
 * Estado em memória do Laboratório por fase (mock MSW). Mesmo princípio dos
 * outros fixtures: arrays mutáveis que os handlers de `handlers/lab.ts`
 * alteram. Catálogo = DADOS DE DEMONSTRAÇÃO (espelha ExameCatalogoSeeder.php).
 */
export const labExamesFixtures: ExameCatalogoDto[] = [
  { id: "ex-ab-cult", laboratorioId: "lab-0002", laboratorioCode: "AB", codigo: "AB-CULT", nome: "Cultura e isolamento bacteriano", tecnicaMetodo: "Cultura em meios selectivos", popCodigo: null, tiposAmostra: ["zaragatoa", "tecido", "leite", "urina", "outro"], slaHoras: 72, camposResultado: [{ chave: "crescimento", tipo: "opcao", opcoes: ["sem_crescimento", "escasso", "moderado", "abundante"] }, { chave: "agente_isolado", tipo: "texto", obrigatorio: false }], activo: true },
  { id: "ex-ap-copro", laboratorioId: "lab-0003", laboratorioCode: "AP", codigo: "AP-COPRO", nome: "Coprologia quantitativa (McMaster)", tecnicaMetodo: "McMaster", popCodigo: null, tiposAmostra: ["fezes"], slaHoras: 72, camposResultado: [{ chave: "opg", tipo: "numero", rotulo: "Ovos por grama", unidade: "OPG" }], activo: true },
  { id: "ex-bm-pcr", laboratorioId: "lab-0004", laboratorioCode: "BM", codigo: "BM-PCR", nome: "PCR em tempo real", tecnicaMetodo: "qPCR", popCodigo: null, tiposAmostra: ["sangue", "tecido", "zaragatoa"], slaHoras: 24, camposResultado: [{ chave: "alvo_detectado", tipo: "booleano" }, { chave: "ct", tipo: "numero", obrigatorio: false }], activo: true },
  { id: "ex-ama-coli", laboratorioId: "lab-0005", laboratorioCode: "AMA", codigo: "AMA-COLI", nome: "Contagem de coliformes", tecnicaMetodo: "Contagem em placa", popCodigo: null, tiposAmostra: ["agua", "leite", "outro"], slaHoras: 120, camposResultado: [{ chave: "ufc_ml", tipo: "numero", unidade: "ufc/ml" }], activo: true },
  { id: "ex-as-bruc", laboratorioId: "lab-0006", laboratorioCode: "AS", codigo: "AS-BRUC-RB", nome: "Brucelose — Rosa Bengala", tecnicaMetodo: "Aglutinação (Rosa Bengala)", popCodigo: null, tiposAmostra: ["soro", "sangue"], slaHoras: 24, camposResultado: [{ chave: "reaccao", tipo: "opcao", opcoes: ["negativo", "positivo"] }], activo: true },
  { id: "ex-ar-ifd", laboratorioId: "lab-0001", laboratorioCode: "AR", codigo: "AR-IFD", nome: "Raiva — Imunofluorescência directa", tecnicaMetodo: "IFD", popCodigo: null, tiposAmostra: ["tecido"], slaHoras: 48, camposResultado: [{ chave: "resultado", tipo: "opcao", opcoes: ["negativo", "positivo"] }], activo: true },
];

export const labRequisicoesFixtures: RequisicaoLabDto[] = [];
export const labAmostrasFixtures: AmostraDto[] = [];
export const labRequisicaoExamesFixtures: RequisicaoExameDto[] = [];
export const labBoletinsInternosFixtures: BoletimInternoLabDto[] = [];
export const labBoletinsAnalisesFixtures: BoletimAnaliseLabDto[] = [];
export const labMovimentosFixtures: AmostraMovimentoDto[] = [];

/** Equipas por área no mock: o Técnico de demonstração (usr-0005) pertence a todas. */
export const labMembrosFixtures: Record<string, string[]> = {
  "lab-0001": ["usr-0005"],
  "lab-0002": ["usr-0005"],
  "lab-0003": ["usr-0005"],
  "lab-0004": ["usr-0005"],
  "lab-0005": ["usr-0005"],
  "lab-0006": ["usr-0005"],
};

export const labSequencias = { req: 0, pat: 0, ba: 0, te: 0 };
