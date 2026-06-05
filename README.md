# NexaFlow

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
- JavaScript

## Funcionalidades

- Dashboard financeiro responsivo com graficos de barras, pizza e linha.
- Cadastro e remocao de transacoes.
- Taskly com criacao, conclusao, filtros e remocao de tarefas.
- Area de estudos com formulario conectado ao back-end.
- Componentes reutilizaveis: Card, Button, Input, Badge, Table e Select.
- Animacoes e transicoes com Framer Motion.
- Persistencia em PostgreSQL com Prisma ORM.
- Migration inicial e seed reproduzivel.
- Blueprint do Render para criar API e banco.

## Como rodar

Instale as dependencias do backend:

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

Crie `backend/.env` com base em `backend/.env.example` e informe sua conexao PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexaflow?schema=public"
PORT=3001
CLIENT_ORIGIN="http://127.0.0.1:5173"
```

Para apontar o frontend para outra API, crie `frontend/.env` com base em `frontend/.env.example`.

Crie as tabelas e carregue os dados iniciais:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Rode o back-end:

```bash
npm run dev:backend
```

Em outro terminal, rode o front-end:

```bash
npm run dev:frontend
```

URLs:

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:3001/api/health

## Banco de dados

O schema fica em `backend/prisma/schema.prisma` e possui:

- `Transaction`: entradas e saidas financeiras.
- `Task`: tarefas e prioridades do Taskly.
- `Lead`: emails capturados pela area de estudos.

Comandos uteis:

```bash
npm run db:migrate
npm run db:deploy
npm run db:generate
npm run db:seed
npm run db:studio
```

## Deploy do backend

O arquivo `render.yaml` cria uma API Node e um PostgreSQL no Render, aplica as migrations em cada deploy e carrega o seed demonstrativo no primeiro deploy. Durante o deploy, configure `CLIENT_ORIGIN` com a URL publicada do frontend.

## Proximas melhorias

- Criar autenticacao.
- Adicionar testes automatizados.
- Publicar o frontend e conectar ao backend hospedado.
