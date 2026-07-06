# Portal IIV/MINAGRIF

Portal público e área administrativa do Instituto de Investigação Veterinária (IIV) do MINAGRIF (Ministério da Agricultura, Angola).

## Stack Técnico

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Routing**: react-router-dom
- **Backend**: Supabase (migração em curso para API Laravel)
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

## Estrutura do Projecto

- **src/pages** - Páginas da aplicação (público e administrativo)
- **src/components** - Componentes reutilizáveis (UI, layouts, admin)
- **src/hooks** - Hooks customizados (autenticação, mobile, etc.)
- **src/integrations** - Integrações com serviços externos
- **src/assets** - Imagens e recursos estáticos
- **supabase/** - Configurações e migrações Supabase

## Estrutura de Permissões

A aplicação implementa um sistema de roles (Utilizador, Técnico, Administrador) com guards de rota para controlar acesso a áreas administrativas.

## Próximas Etapas

- Migração do backend de Supabase para API Laravel
- Otimizações de performance e SEO
- Melhorias na área administrativa
