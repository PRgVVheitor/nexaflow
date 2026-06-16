# NexaFlow

[![CI](https://github.com/PRgVVheitor/nexaflow/actions/workflows/ci.yml/badge.svg)](https://github.com/PRgVVheitor/nexaflow/actions/workflows/ci.yml)

Aplicação full-stack para centralizar finanças e produtividade em um painel único.

## Objetivo

Mostrar no GitHub um produto com separação clara entre front-end e back-end, consumo de API, estado no React, rotas HTTP, migrations e persistência em PostgreSQL.

## Stack

- React
- Vite
- Tailwind CSS
- Componentes baseados em shadcn/ui
- Framer Motion
- Recharts
- Lucide React
- React Hook Form
- React Router DOM
- TanStack Query
- React DayPicker
- date-fns
- React Hot Toast
- Zod
- Google Fonts / Inter
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Docker Compose
- Helmet
- Vitest
- Testing Library
- Supertest
- Playwright
- ESLint
- GitHub Actions
- TypeScript

## Funcionalidades

- Landing page pública com hero, recursos e CTA, com login em rota própria (`/login`).
- Rotas principais com code splitting (React.lazy) para reduzir o bundle inicial.
- Modo claro/escuro com persistência da preferência.
- Metas de gastos por categoria com barra de progresso e alertas de limite.
- Transações recorrentes (salário, aluguel, assinaturas) lançadas automaticamente todo mês.
- Comparação mensal em onda: saldo acumulado dia a dia de dois meses lado a lado.
- Dashboard financeiro responsivo com gráfico de ondas comparando períodos, barras horizontais de gastos por categoria, indicadores de saldo, entradas e saídas, seleção e comparação mensal.
- Mikal, assistente financeiro flutuante com perguntas rápidas e respostas calculadas a partir dos dados da conta.
- Cache e sincronização do estado da API com TanStack Query, incluindo mutations e Devtools em desenvolvimento.
- Inteligência Financeira V1 com Nexa Score explicável, previsão de saldo em 7, 15 e 30 dias, alertas de anomalias e feed de insights.
- Filtros financeiros por semana, mês, ano ou intervalo personalizado.
- Data própria em cada transação: registre lançamentos retroativos e corrija a data depois.
- Exportação das transações filtradas em CSV.
- Edição inline de data, descrição, categoria, tipo e valor das transações.
- Estados vazios e skeletons de carregamento nos painéis.
- Categorias financeiras padronizadas e seletor visual de entrada ou saída.
- Cadastro e remoção de transações.
- Taskly com criação, edição inline, prazos opcionais, conclusão, filtros e remoção de tarefas.
- Visualização do Taskly em lista ou quadro Kanban.
- Navegação por rotas reais com React Router DOM.
- Calendário customizado para selecionar prazos no Taskly.
- Sinalização visual e filtros para tarefas atrasadas, de hoje, próximas ou sem prazo.
- Indicadores do Taskly com números destacados e anéis de progresso.
- Feedbacks com toasts e validação visual nos formulários principais.
- Cadastro, login, restauração de sessão e logout.
- Sessão real protegida por cookie HttpOnly, Secure em produção e SameSite.
- Verificação de email e recuperação de senha com tokens opacos, expiráveis e de uso único.
- Dados financeiros e tarefas isolados por usuário.
- Senhas protegidas com bcrypt e sessões assinadas com JWT.
- Rate limiting nas rotas de login e cadastro.
- Headers de segurança com Helmet.
- Validação de entradas e variáveis de ambiente com Zod.
- Respostas de erro padronizadas na API.
- Componentes reutilizaveis: Card, Button, Input, Badge, Table e Select.
- Animações e transições com Framer Motion.
- Persistência em PostgreSQL com Prisma ORM.
- Migration inicial e seed reproduzível.
- Blueprint do Render para publicar frontend, API e banco.
- Logs estruturados com Pino e monitoramento opcional de erros com Sentry.
- Backup diário automatizado do PostgreSQL via GitHub Actions.
- Auditorias automatizadas com axe, Lighthouse e Playwright em desktop e mobile.

## Como rodar com Docker

Tenha o Docker Desktop e o Node.js instalados. Instale as dependências do backend:

```bash
cd backend
npm install
```

Depois instale as dependências do frontend:

```bash
cd ../frontend
npm install
cd ..
```

Crie `backend/.env` com base em `backend/.env.example`. A configuração de exemplo já aponta para o PostgreSQL do Docker. Em produção, `CLIENT_ORIGIN` é obrigatória e `JWT_SECRET` precisa ter pelo menos 32 caracteres:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexaflow?schema=public"
PORT=3001
CLIENT_ORIGIN="http://127.0.0.1:5173"
JWT_SECRET="troque-por-uma-chave-com-pelo-menos-32-caracteres"
NODE_ENV="development"
RESEND_API_KEY=""
EMAIL_FROM="NexaFlow <onboarding@resend.dev>"
SENTRY_DSN=""
```

Para apontar o frontend para outra API, crie `frontend/.env` com base em `frontend/.env.example`.

Na primeira execução, construa a API, suba a API e o PostgreSQL, aplique as migrations e carregue os dados demonstrativos:

```bash
npm run db:bootstrap
```

Nas próximas execuções, basta subir a API e o banco:

```bash
npm run docker:up
```

Depois rode o frontend:

```bash
npm run dev:frontend
```

URLs:

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:3001/api/health

Conta demonstrativa:

- Email: `demo@nexaflow.app`
- Senha: `demo1234`
- O botão `Usar conta demonstrativa` funciona localmente mesmo sem API ou PostgreSQL ativos.

## Banco de dados

O arquivo `compose.yaml` executa a API Node e o PostgreSQL 17 em containers. O banco usa um volume persistente e continua salvo quando os containers são desligados.

O schema fica em `backend/prisma/schema.prisma` e possui:

- `Transaction`: entradas e saídas financeiras.
- `Task`: tarefas, prioridades e prazos opcionais do Taskly.
- `User`: contas, credenciais protegidas e relacionamento com os dados privados.

Comandos úteis:

```bash
npm run docker:up
npm run docker:up:db
npm run docker:down
npm run docker:logs
npm run db:migrate
npm run db:deploy
npm run db:generate
npm run db:seed
npm run db:studio
```

Para apagar o volume e recriar o banco do zero:

```bash
npm run docker:reset
npm run db:bootstrap
```

> `docker:reset` remove todos os dados locais do PostgreSQL.

Para desenvolver o backend com recarregamento automático, suba somente o PostgreSQL e execute o Node localmente:

```bash
npm run docker:up:db
npm run dev:backend
```

## Deploy

### Frontend na Vercel

O projeto inclui `vercel.json` na raiz e em `frontend/`, entao pode ser importado na Vercel de duas formas:

- Repositorio inteiro: use a raiz do projeto. A Vercel executa `npm ci --prefix frontend`, `npm run build --prefix frontend` e publica `frontend/dist`.
- Somente frontend: selecione `frontend` como Root Directory. A Vercel executa `npm ci`, `npm run build` e publica `dist`.

Para publicar apenas a vitrine do projeto, nenhuma variavel e obrigatoria: a conta demonstrativa funciona no navegador mesmo sem backend ativo.

Quando o backend estiver online, configure no painel da Vercel:

- `VITE_API_URL`: URL HTTPS da API.
- `VITE_SENTRY_DSN`: opcional, para monitoramento de erros no frontend.

### Aplicacao completa no Render

O `render.yaml` cria o frontend estático, a API Node e o PostgreSQL no Render. No primeiro deploy, configure:

- `VITE_API_URL`: URL HTTPS da API.
- `CLIENT_ORIGIN`: URL HTTPS do frontend.
- `RESEND_API_KEY` e `EMAIL_FROM`: credenciais para verificação de email e recuperação de senha.
- `SENTRY_DSN` e `VITE_SENTRY_DSN`: opcionais, para monitoramento de erros no backend e frontend.

O deploy aplica as migrations e sincroniza o seed demonstrativo. O seed usa `upsert`: garante os dados de demonstração sem apagar contas, tarefas ou transações existentes.

Para ativar o backup diário, adicione `PROD_DATABASE_URL` aos GitHub Actions Secrets. O workflow `.github/workflows/backup.yml` também pode ser executado manualmente. Valide periodicamente a restauração do arquivo com `pg_restore`.

## Estrutura do frontend

```
frontend/src/
├── pages/        # AuthScreen, FinanceDashboard, TasksApp
├── components/   # UI reutilizável: gráficos, formulários, skeletons, Kanban, Mikal
└── lib/          # Cliente da API, schemas, formatação, datas e constantes
```

## Testes e integração contínua

Com PostgreSQL ativo, execute toda a suite local:

```bash
npm test
```

Para verificar o lint dos dois pacotes:

```bash
npm run lint
```

Os testes do backend validam autenticação, isolamento entre usuários, recorrências e rotas HTTP contra PostgreSQL real. Os testes do frontend verificam login, cadastro, dashboard, metas, recorrências e navegação com uma API simulada.

Para o teste end-to-end (Playwright, usa o modo demonstrativo e não precisa de API):

```bash
cd frontend
npm run test:e2e
npm run test:a11y
npm run audit:lighthouse
```

O workflow `.github/workflows/ci.yml` cria um PostgreSQL temporário e executa lint, type-check, migrations, testes, build, E2E em desktop/mobile, acessibilidade e Lighthouse automaticamente em cada push e pull request.

## Próximas melhorias

- Paginação e filtros de período direto na API de transações.
