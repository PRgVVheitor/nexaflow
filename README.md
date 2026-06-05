# NexaFlow

Aplicacao full-stack para centralizar financas, tarefas e rotina em um painel unico.

## Objetivo

Mostrar no GitHub um produto com separacao clara entre front-end e back-end, consumo de API, estado no React, rotas HTTP e persistencia simples em arquivo JSON.

## Stack

- React
- Vite
- Node.js
- Express
- JavaScript
- CSS responsivo

## Funcionalidades

- Dashboard de financas consumindo API.
- Cadastro e remocao de transacoes.
- App de tarefas com criacao, conclusao, filtros e remocao.
- Landing page com formulario conectado ao back-end.
- Persistencia em `backend/data/db.json`.

## Como rodar

Instale as dependencias:

```bash
npm run install:all
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

## Proximas melhorias

- Adicionar banco de dados real.
- Criar autenticacao.
- Adicionar testes automatizados.
- Fazer deploy do front e do back.
