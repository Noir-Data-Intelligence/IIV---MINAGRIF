import type { AlertAckDto } from "@/types/dto/dashboardAlertAck";

/**
 * Acks ("silenciar alerta") da sessão actual, MUTÁVEL em memória. Arranca vazio
 * — o utilizador é que silencia alertas em runtime. O handler GET só devolve os
 * que ainda estão dentro da validade (`acknowledgedUntil` no futuro).
 */
export const dashboardAlertAcksFixtures: AlertAckDto[] = [];
