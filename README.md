# NexaFlow

[![CI](https://github.com/PRgVVheitor/nexaflow/actions/workflows/ci.yml/badge.svg)](https://github.com/PRgVVheitor/nexaflow/actions/workflows/ci.yml)

Aplicacao full-stack para centralizar financas, tarefas e rotina em um painel unico.

## Objetivo

Mostrar no GitHub um produto com separacao clara entre front-end e back-end, consumo de API, estado no React, rotas HTTP, migrations e persistencia em PostgreSQL.

## Stack

- React
- Vite
- Tailwind CSS
- Componentes baseados em shadcn/ui
- Framer Motion
- Recharts
- Lucide React
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

- Dashboard financeiro responsivo com graficos de barras, pizza e linha.
- Cadastro e remocao de transacoes.
- Taskly com criacao, conclusao, filtros e remocao de tarefas.
- Cadastro, login, restauracao de sessao e logout.
- Dados financeiros e tarefas isolados por usuario.
- Senhas protegidas com bcrypt e sessoes assinadas com JWT.
- Area de estudos com formulario conectado ao back-end.
- Componentes reutilizaveis: Card, Button, Input, Badge, Table e Select.
- Animacoes e transicoes com Framer Motion.
- Persistencia em PostgreSQL com Prisma ORM.
- Migration inicial e seed reproduzivel.
- Blueprint do Render para criar API e banco.

## Como rodar com Docker

Tenha o Docker Desktop e o Node.js instalados. Instale as dependencias do backend:

```bash
cd backend
npm install
```

Depois instale as dependencias do frontend:

```bash
cd ../frontend
npm install
cd ..
```

Crie `backend/.env` com base em `backend/.env.example`. A configuracao de exemplo ja aponta para o PostgreSQL do Docker:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexaflow?schema=public"
PORT=3001
CLIENT_ORIGIN="http://127.0.0.1:5173"
JWT_SECRET="troque-por-uma-chave-longa-e-aleatoria"
```

Para apontar o frontend para outra API, crie `frontend/.env` com base em `frontend/.env.example`.

Na primeira execucao, construa a API, suba a API e o PostgreSQL, aplique as migrations e carregue os dados demonstrativos:

```bash
npm run db:bootstrap
```

Nas proximas execucoes, basta subir a API e o banco:

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

## Banco de dados

O arquivo `compose.yaml` executa a API Node e o PostgreSQL 17 em containers. O banco usa um volume persistente e continua salvo quando os containers sao desligados.

O schema fica em `backend/prisma/schema.prisma` e possui:

- `Transaction`: entradas e saidas financeiras.
- `Task`: tarefas e prioridades do Taskly.
- `Lead`: emails capturados pela area de estudos.
- `User`: contas, credenciais protegidas e relacionamento com os dados privados.

Comandos uteis:

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

Para desenvolver o backend com recarregamento automatico, suba somente o PostgreSQL e execute o Node localmente:

```bash
npm run docker:up:db
npm run dev:backend
```

## Deploy do backend

O arquivo `render.yaml` cria uma API Node e um PostgreSQL no Render, aplica as migrations em cada deploy e carrega o seed demonstrativo no primeiro deploy. Durante o deploy, configure `CLIENT_ORIGIN` com a URL publicada do frontend.

## Testes e integracao continua

Com PostgreSQL ativo, execute toda a suite local:

```bash
npm test
```

Os testes do backend validam autenticacao, isolamento entre usuarios e rotas HTTP contra PostgreSQL real. Os testes do frontend verificam login, cadastro, carregamento do dashboard e navegacao para o Taskly com uma API simulada.

O workflow `.github/workflows/ci.yml` cria um PostgreSQL temporario e executa migrations, testes e build automaticamente em cada push e pull request.

## Proximas melhorias

- Publicar o frontend e conectar ao backend hospedado.
