# Portal IIV/MINAGRIF .

Portal público e área administrativa do Instituto de Investigação Veterinária (IIV) do MINAGRIF (Ministério da Agricultura, Angola).

Contexto completo do projecto (requisitos, regras de negócio, arquitectura, decisões em aberto): `../SIG-IIV-MEMORIA-PROJETO.md`.

## Stack Técnico

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Routing**: react-router-dom, TanStack Query/Table
- **Backend**: API REST Laravel 12 (`../Back-end`) — Sanctum SPA cookie-based. Em modo mock (`VITE_API_MOCK=true`) as respostas são servidas por MSW, sem backend nenhum a correr.
- **Ferramentas**: ESLint, Vitest, PostCSS, Autoprefixer

## Como Correr Localmente

### Requisitos
- Node.js (v18+) e npm instalados

### Passos

```sh
# Instalar dependências
npm install

# Correr servidor de desenvolvimento (porta 8080)
npm run dev

# Build para produção
npm run build

# Executar testes
npm run test

# Executar testes em watch mode
npm run test:watch

# Lint e verificação de código
npm run lint
```

### Ligar ao backend real (em vez do mock MSW)

No `.env` (não versionado): `VITE_API_MOCK=false` e `VITE_API_URL=http://localhost:8000/api`, com o backend Laravel a correr localmente (ver `../Back-end/README.md`, secção "Correr localmente" ou "Deploy com Docker"). Login com as contas de demonstração `<papel>@iiv.demo` / `<papel>123`.

## Estrutura do Projecto

- **src/pages** - Páginas da aplicação (público e administrativo)
- **src/components** - Componentes reutilizáveis (UI, layouts, admin)
- **src/hooks** - Hooks customizados (autenticação, mobile, etc.)
- **src/services/api** - Camada de dados REST (um ficheiro por módulo, `endpoints.ts` como mapa central)
- **src/mocks** - Handlers/fixtures MSW (modo `VITE_API_MOCK=true`)
- **src/assets** - Imagens e recursos estáticos

## RBAC

12 papéis institucionais (`src/lib/permissions.ts`, `AppRole`) — `admin`, `diretor`, `director-laboratorio`, `responsavel-qualidade`, `tecnico`, `recepcionista`, `gestor-stock`, `gestor-patrimonio`, `gestor-financeiro`, `gestor-rh`, `gestor-estacao`, `isv`. Matriz de permissões por módulo, editável em runtime na página `/admin/rbac` — tem de espelhar exactamente `Back-end/database/seeders/RolePermissionSeeder.php`.

Contas criadas via registo público nascem inactivas (`isActive: false`) e não conseguem entrar até um administrador as aprovar em `/admin/utilizadores` (acção "Aprovar conta") — as 12 contas de demonstração acima já nascem activas nos fixtures/seeders, por isso não são afectadas.

## Deploy com Docker

`docker-compose.yml` faz build da SPA (Vite, variáveis `VITE_*` como build args, inlined em tempo de build) e serve-a via nginx, atrás de um Traefik externo (rede `proxy`, já tem de existir — `docker network create proxy`). Por omissão liga-se ao backend real dockerizado (`../Back-end/docker-compose.yml`) no **mesmo host** (`VITE_API_URL=/api`, relativo) — o Traefik encaminha `/api`/`/sanctum` desse host para o backend (ver labels do serviço `nginx` em `Back-end/docker-compose.yml`). Deliberadamente **não** um subdomínio `api.` próprio: um `SESSION_DOMAIN` com wildcard entre subdomínios foi identificado numa auditoria de segurança (2026-08-09) como vector de cookie tossing a partir de outro subdomínio da mesma agência — mesma origem elimina o problema.

```bash
docker network create proxy   # só da primeira vez, se ainda não existir
docker compose up -d --build
```

Ajustar via variáveis de ambiente antes do build (nenhuma tem segredos, mas `VITE_API_URL`/`VITE_API_MOCK` decidem se a app fala com o backend real ou com dados mock):

```bash
VITE_API_MOCK=false VITE_API_URL=/api docker compose up -d --build
```

## Próximas Etapas

Ver `../SIG-IIV-MEMORIA-PROJETO.md` secção 15/16 para o estado detalhado por Onda e as decisões pendentes de confirmação do cliente (domínio institucional final, fornecedor de LLM do chat-assistant, etc.).
