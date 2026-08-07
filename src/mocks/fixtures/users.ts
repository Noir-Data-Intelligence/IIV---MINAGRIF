import type { UserDto } from "@/types/dto/user";

/**
 * Utilizadores fictícios do IIV, com papéis e departamento já resolvidos
 * (ver nota em `types/dto/user.ts` sobre a consolidação face às 3 tabelas
 * Supabase originais). `departmentIds` usa os ids reais de
 * `mocks/fixtures/departamentos.ts`.
 *
 * Exactamente 1 utilizador por cada um dos 12 papéis de `AppRole` (ver
 * `lib/permissions.ts`), com email `<papel>@iiv.demo` — mesma convenção usada
 * pelo painel de contas demo em `Login.tsx` e por `authCredentials.ts`
 * (password = `<papel>123`). O Seeder Laravel deve reproduzir as mesmas 12
 * credenciais (ver PLANO-BACKEND-LARAVEL.txt secção 9 / SIG-IIV-MEMORIA-
 * PROJETO.md secção 15).
 *
 * NOTA: exportado como `let` para ser MUTÁVEL — os handlers update/delete
 * operam sobre este array em memória (perde-se no refresh, comportamento
 * esperado de um mock).
 */
export let usersFixtures: UserDto[] = [
  {
    id: "usr-0001",
    fullName: "Fernando Kianda Ndala",
    email: "admin@iiv.demo",
    phone: "+244 923 145 782",
    createdAt: "2023-02-14T09:15:00.000Z",
    roles: ["admin"],
    departmentIds: ["dep-0009"],
  },
  {
    id: "usr-0002",
    fullName: "Manuel Sozinho Bumba",
    email: "diretor@iiv.demo",
    phone: "+244 916 578 934",
    createdAt: "2023-04-18T10:20:00.000Z",
    roles: ["diretor"],
    departmentIds: ["dep-0005"],
  },
  {
    id: "usr-0003",
    fullName: "Adélia Kapenda Tchissola",
    email: "director-laboratorio@iiv.demo",
    phone: "+244 945 210 673",
    createdAt: "2023-04-02T08:45:00.000Z",
    roles: ["director-laboratorio"],
    departmentIds: ["dep-0003"],
  },
  {
    id: "usr-0004",
    fullName: "Guilhermina Sapalo Dilolwa",
    email: "responsavel-qualidade@iiv.demo",
    phone: "+244 913 296 748",
    createdAt: "2023-06-12T15:40:00.000Z",
    roles: ["responsavel-qualidade"],
    departmentIds: ["dep-0007"],
  },
  {
    id: "usr-0005",
    fullName: "João Baptista Sachiwo",
    email: "tecnico@iiv.demo",
    phone: "+244 934 682 219",
    createdAt: "2023-03-20T14:30:00.000Z",
    roles: ["tecnico"],
    departmentIds: ["dep-0002"],
  },
  {
    id: "usr-0006",
    fullName: "Rosa Ngueve Chissano",
    email: "recepcionista@iiv.demo",
    phone: "+244 927 843 012",
    createdAt: "2023-05-09T13:10:00.000Z",
    roles: ["recepcionista"],
    departmentIds: ["dep-0004"],
  },
  {
    id: "usr-0007",
    fullName: "Vicente Kalombo Tchivinda",
    email: "gestor-stock@iiv.demo",
    phone: "+244 936 152 908",
    createdAt: "2023-08-01T09:35:00.000Z",
    roles: ["gestor-stock"],
    departmentIds: ["dep-0002"],
  },
  {
    id: "usr-0008",
    fullName: "Filomena Ussumane Cachimbombo",
    email: "gestor-patrimonio@iiv.demo",
    phone: "+244 917 480 261",
    createdAt: "2023-08-20T14:05:00.000Z",
    roles: ["gestor-patrimonio"],
    departmentIds: ["dep-0009"],
  },
  {
    id: "usr-0009",
    fullName: "Ernesto Palanca Zua",
    email: "gestor-financeiro@iiv.demo",
    phone: "+244 949 720 385",
    createdAt: "2023-06-30T08:00:00.000Z",
    roles: ["gestor-financeiro"],
    departmentIds: ["dep-0008"],
  },
  {
    id: "usr-0010",
    fullName: "Cristina Mabeco Sengue",
    email: "gestor-rh@iiv.demo",
    phone: "+244 921 065 437",
    createdAt: "2023-07-14T12:25:00.000Z",
    roles: ["gestor-rh"],
    departmentIds: ["dep-0010"],
  },
  {
    id: "usr-0011",
    fullName: "Isabel Muxito Capingala",
    email: "gestor-estacao@iiv.demo",
    phone: "+244 912 337 401",
    createdAt: "2023-03-05T11:00:00.000Z",
    roles: ["gestor-estacao"],
    departmentIds: ["dep-0001"],
  },
  {
    id: "usr-0012",
    fullName: "Domingos Alberto Muanza",
    email: "isv@iiv.demo",
    phone: "+244 938 461 590",
    createdAt: "2023-05-25T09:50:00.000Z",
    roles: ["isv"],
    departmentIds: ["dep-0006"],
  },
];

/** Substitui o conteúdo do array em memória (usado pelos handlers de escrita). */
export function setUsersFixtures(next: UserDto[]) {
  usersFixtures = next;
}
