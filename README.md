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
- Vitest
- Testing Library
- Supertest
- GitHub Actions
- JavaScript

## Funcionalidades

- Dashboard financeiro responsivo com gráfico de ondas comparando períodos, barras horizontais de gastos por categoria, indicadores de saldo, entradas e saídas, seleção e comparação mensal.
- Mikal, assistente financeiro flutuante com perguntas rápidas e respostas calculadas a partir dos dados da conta.
- Inteligência Financeira V1 com Nexa Score explicável, previsão de saldo em 7, 15 e 30 dias, alertas de anomalias e feed de insights.
- Filtros financeiros por semana, mês, ano ou intervalo personalizado.
- Exportação das transações filtradas em CSV.
- Edição inline de descrição, categoria, tipo e valor das transações.
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
- Dados financeiros e tarefas isolados por usuário.
- Senhas protegidas com bcrypt e sessões assinadas com JWT.
- Rate limiting nas rotas de login e cadastro.
- Validação de entradas e variáveis de ambiente com Zod.
- Respostas de erro padronizadas na API.
- Componentes reutilizaveis: Card, Button, Input, Badge, Table e Select.
- Animações e transições com Framer Motion.
- Persistência em PostgreSQL com Prisma ORM.
- Migration inicial e seed reproduzível.
- Blueprint do Render para criar API e banco.

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

## Deploy do backend

O arquivo `render.yaml` cria uma API Node e um PostgreSQL no Render, aplica as migrations e sincroniza o seed demonstrativo em cada deploy. O seed usa `upsert`: garante os dados de demonstração sem apagar contas, tarefas ou transações existentes. Durante o deploy, configure `CLIENT_ORIGIN` com a URL publicada do frontend.

## Testes e integração contínua

Com PostgreSQL ativo, execute toda a suite local:

```bash
npm test
```

Os testes do backend validam autenticação, isolamento entre usuários e rotas HTTP contra PostgreSQL real. Os testes do frontend verificam login, cadastro, carregamento do dashboard e navegação para o Taskly com uma API simulada.

O workflow `.github/workflows/ci.yml` cria um PostgreSQL temporário e executa migrations, testes e build automaticamente em cada push e pull request.

## Próximas melhorias

- Publicar o frontend e conectar ao backend hospedado.
