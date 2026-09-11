/**
 * DTO da equipa de Técnicos de um laboratório — contrato REST do recurso
 * `laboratorios/{id}/tecnicos` (espelha `LaboratorioTecnicoResource` no
 * backend). Pedido do cliente: "gestão de equipas (Técnicos)". Distinto de
 * `LaboratorioDto.validadoresNomeados` — este é o membro completo da
 * equipa; `validadoresNomeados` é o subconjunto autorizado a validar.
 */
export interface LaboratorioTecnicoDto {
  userId: string;
  fullName: string;
  email: string;
  funcao: string | null;
}

export interface AddLaboratorioTecnicoPayload {
  userId: string;
  funcao?: string | null;
}
