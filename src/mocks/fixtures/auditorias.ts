import type { AuditoriaDto } from "@/types/dto/auditoria";

/**
 * Dados fictícios mas realistas de auditorias de qualidade do IIV (Instituto de
 * Investigação Veterinária). Servem os handlers MSW enquanto o backend Laravel
 * não existe.
 *
 * Os `departmentId`/`laboratoryId` apontam para ids reais de
 * `fixtures/departamentos.ts` e `fixtures/laboratorios.ts`; os campos
 * `departmentName`/`laboratoryName` guardam o nome resolvido (como faria uma API
 * Resource do Laravel), para leitura directa na página.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória (reset no refresh do browser).
 */
export let auditoriasFixtures: AuditoriaDto[] = [
  {
    id: "aud-0001",
    title: "Auditoria interna ao Laboratório de Virologia",
    auditType: "interna",
    auditor: "Dra. Ana Kandimba",
    scheduledDate: "2024-02-12",
    completedDate: "2024-02-14",
    status: "concluida",
    findings:
      "Registos de calibração dos termocicladores incompletos em dois equipamentos. Boas práticas de biossegurança verificadas.",
    recommendations:
      "Actualizar o plano de calibração e associar cada registo ao respectivo equipamento no sistema.",
    departmentId: "dep-0002",
    laboratoryId: "lab-0001",
    departmentName: "Virologia",
    laboratoryName: "Laboratório de Virologia",
    createdAt: "2024-01-30T09:00:00.000Z",
  },
  {
    id: "aud-0002",
    title: "Auditoria externa de acreditação ISO/IEC 17025",
    auditType: "ISO",
    auditor: "Eng. Bureau Veritas Angola",
    scheduledDate: "2024-05-20",
    completedDate: null,
    status: "planeada",
    findings: null,
    recommendations: null,
    departmentId: "dep-0008",
    laboratoryId: "lab-0004",
    departmentName: "Qualidade e Metrologia",
    laboratoryName: "Laboratório de Diagnóstico Molecular",
    createdAt: "2024-04-02T10:30:00.000Z",
  },
  {
    id: "aud-0003",
    title: "Auditoria interna ao processo de antibiogramas",
    auditType: "interna",
    auditor: "Dr. Manuel Chivinda",
    scheduledDate: "2024-06-05",
    completedDate: null,
    status: "em_curso",
    findings:
      "Verificação em curso da rastreabilidade das estirpes de referência e dos meios de cultura.",
    recommendations: null,
    departmentId: "dep-0003",
    laboratoryId: "lab-0002",
    departmentName: "Bacteriologia",
    laboratoryName: "Laboratório de Bacteriologia",
    createdAt: "2024-05-18T08:45:00.000Z",
  },
  {
    id: "aud-0004",
    title: "Auditoria externa à gestão de resíduos laboratoriais",
    auditType: "externa",
    auditor: "Dra. Sofia Nzinga (MINAMB)",
    scheduledDate: "2024-03-28",
    completedDate: "2024-03-29",
    status: "concluida",
    findings:
      "Segregação de resíduos biológicos conforme. Falta de contrato actualizado com operador de recolha certificado.",
    recommendations:
      "Formalizar contrato com operador certificado e afixar o plano de gestão de resíduos nas zonas de produção.",
    departmentId: "dep-0008",
    laboratoryId: null,
    departmentName: "Qualidade e Metrologia",
    laboratoryName: null,
    createdAt: "2024-03-10T11:15:00.000Z",
  },
  {
    id: "aud-0005",
    title: "Auditoria interna à conservação de amostras",
    auditType: "interna",
    auditor: "Dra. Ana Kandimba",
    scheduledDate: "2023-11-15",
    completedDate: null,
    status: "cancelada",
    findings: null,
    recommendations: null,
    departmentId: "dep-0004",
    laboratoryId: "lab-0003",
    departmentName: "Parasitologia",
    laboratoryName: "Laboratório de Parasitologia",
    createdAt: "2023-10-30T14:00:00.000Z",
  },
  {
    id: "aud-0006",
    title: "Auditoria interna ao controlo microbiológico de alimentos",
    auditType: "interna",
    auditor: "Dr. Manuel Chivinda",
    scheduledDate: "2024-07-01",
    completedDate: null,
    status: "planeada",
    findings: null,
    recommendations: null,
    departmentId: "dep-0006",
    laboratoryId: "lab-0005",
    departmentName: "Nutrição e Alimentação Animal",
    laboratoryName: "Laboratório de Microbiologia de Alimentos",
    createdAt: "2024-06-12T09:20:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setAuditoriasFixtures(next: AuditoriaDto[]) {
  auditoriasFixtures = next;
}
