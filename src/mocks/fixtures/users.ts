import type { UserDto } from "@/types/dto/user";

/**
 * Utilizadores fictícios do IIV, com papéis e departamento já resolvidos
 * (ver nota em `types/dto/user.ts` sobre a consolidação face às 3 tabelas
 * Supabase originais). `departmentIds` usa os ids reais de
 * `mocks/fixtures/departamentos.ts`.
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers update/delete
 * operam sobre este array em memória (perde-se no refresh, comportamento
 * esperado de um mock).
 */
export let usersFixtures: UserDto[] = [
  {
    id: "usr-0001",
    fullName: "Fernando Kianda Ndala",
    phone: "+244 923 145 782",
    createdAt: "2023-02-14T09:15:00.000Z",
    roles: ["admin"],
    departmentIds: ["dep-0009"],
  },
  {
    id: "usr-0002",
    fullName: "Isabel Muxito Capingala",
    phone: "+244 912 337 401",
    createdAt: "2023-03-05T11:00:00.000Z",
    roles: ["gestor"],
    departmentIds: ["dep-0001"],
  },
  {
    id: "usr-0003",
    fullName: "João Baptista Sachiwo",
    phone: "+244 934 682 219",
    createdAt: "2023-03-20T14:30:00.000Z",
    roles: ["tecnico"],
    departmentIds: ["dep-0002"],
  },
  {
    id: "usr-0004",
    fullName: "Adélia Kapenda Tchissola",
    phone: "+244 945 210 673",
    createdAt: "2023-04-02T08:45:00.000Z",
    roles: ["tecnico"],
    departmentIds: ["dep-0003"],
  },
  {
    id: "usr-0005",
    fullName: "Manuel Sozinho Bumba",
    phone: "+244 916 578 934",
    createdAt: "2023-04-18T10:20:00.000Z",
    roles: ["diretor"],
    departmentIds: ["dep-0005"],
  },
  {
    id: "usr-0006",
    fullName: "Rosa Ngueve Chissano",
    phone: "+244 927 843 012",
    createdAt: "2023-05-09T13:10:00.000Z",
    roles: ["colaborador"],
    departmentIds: ["dep-0004"],
  },
  {
    id: "usr-0007",
    fullName: "Domingos Alberto Muanza",
    phone: "+244 938 461 590",
    createdAt: "2023-05-25T09:50:00.000Z",
    roles: ["tecnico", "colaborador"],
    departmentIds: ["dep-0006"],
  },
  {
    id: "usr-0008",
    fullName: "Guilhermina Sapalo Dilolwa",
    phone: "+244 913 296 748",
    createdAt: "2023-06-12T15:40:00.000Z",
    roles: ["colaborador"],
    departmentIds: ["dep-0007"],
  },
  {
    id: "usr-0009",
    fullName: "Ernesto Palanca Zua",
    phone: "+244 949 720 385",
    createdAt: "2023-06-30T08:00:00.000Z",
    roles: ["gestor"],
    departmentIds: ["dep-0008"],
  },
  {
    id: "usr-0010",
    fullName: "Cristina Mabeco Sengue",
    phone: "+244 921 065 437",
    createdAt: "2023-07-14T12:25:00.000Z",
    roles: ["colaborador"],
    departmentIds: ["dep-0010"],
  },
  {
    id: "usr-0011",
    fullName: "Vicente Kalombo Tchivinda",
    phone: "+244 936 152 908",
    createdAt: "2023-08-01T09:35:00.000Z",
    roles: ["tecnico"],
    departmentIds: ["dep-0002"],
  },
  {
    id: "usr-0012",
    fullName: "Filomena Ussumane Cachimbombo",
    phone: "+244 917 480 261",
    createdAt: "2023-08-20T14:05:00.000Z",
    roles: ["colaborador"],
    departmentIds: ["dep-0009"],
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setUsersFixtures(next: UserDto[]) {
  usersFixtures = next;
}
