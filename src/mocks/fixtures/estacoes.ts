import type { EstacaoDto } from "@/types/dto/estacao";

/**
 * Dados fictícios mas realistas das estações zootécnicas e experimentais do IIV.
 * Servem os handlers MSW enquanto o backend Laravel não existe.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers create/update/delete
 * operam sobre este array em memória, persistindo alterações durante a sessão do
 * browser (perde-se no refresh, comportamento esperado de um mock). Os `id` são
 * estáveis porque o módulo Animais referencia-os via `stationId`.
 */
export let estacoesFixtures: EstacaoDto[] = [
  {
    id: "est-0001",
    name: "Estação Zootécnica da Humpata",
    stationType: "zootecnica",
    location: "Humpata, Huíla",
    description:
      "Estação de referência para o melhoramento de bovinos de raça autóctone e ensaios de maneio em pastagens de altitude.",
    isActive: true,
    createdAt: "2023-01-20T08:00:00.000Z",
  },
  {
    id: "est-0002",
    name: "Estação Experimental da Chianga",
    stationType: "experimental",
    location: "Huambo",
    description:
      "Ensaios de nutrição animal e avaliação de recursos forrageiros locais no planalto central.",
    isActive: true,
    createdAt: "2023-02-14T09:30:00.000Z",
  },
  {
    id: "est-0003",
    name: "Estação Zootécnica de Malanje",
    stationType: "zootecnica",
    location: "Malanje",
    description:
      "Produção e conservação de efectivos caprinos e ovinos adaptados às condições da região.",
    isActive: true,
    createdAt: "2023-03-05T10:15:00.000Z",
  },
  {
    id: "est-0004",
    name: "Campo Experimental de Mazozo",
    stationType: "campo",
    location: "Icolo e Bengo, Luanda",
    description:
      "Campo de demonstração e ensaio de pastagens irrigadas e sistemas silvopastoris.",
    isActive: true,
    createdAt: "2023-04-18T07:45:00.000Z",
  },
  {
    id: "est-0005",
    name: "Estação Experimental do Namibe",
    stationType: "experimental",
    location: "Namibe",
    description:
      "Estudo da adaptação de raças a zonas áridas e ensaios de suplementação em época seca.",
    isActive: false,
    createdAt: "2023-05-22T11:00:00.000Z",
  },
  {
    id: "est-0006",
    name: "Estação Zootécnica do Cuando Cubango",
    stationType: "zootecnica",
    location: "Menongue, Cuando Cubango",
    description:
      "Núcleo de reprodução bovina e apoio técnico à pecuária extensiva do sudeste.",
    isActive: true,
    createdAt: "2023-06-30T13:20:00.000Z",
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setEstacoesFixtures(next: EstacaoDto[]) {
  estacoesFixtures = next;
}
