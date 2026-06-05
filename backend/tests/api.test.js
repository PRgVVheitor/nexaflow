import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";
import { envSchema } from "../src/env.js";

const testPrefix = `ci-${Date.now()}`;
const email = `${testPrefix}@example.com`;
const password = "senha-segura-123";
let token;
let user;

beforeAll(async () => {
  await prisma.$connect();
  const response = await request(app).post("/api/auth/register").send({
    name: "Usuario de Teste",
    email,
    password,
  });
  token = response.body.token;
  user = response.body.user;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: testPrefix } } });
  await prisma.$disconnect();
});

function authenticated(method, path, authToken = token) {
  return request(app)[method](path).set("Authorization", `Bearer ${authToken}`);
}

describe("NexaFlow API", () => {
  it("confirma a conexao com PostgreSQL", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "nexaflow-api",
      database: "postgresql",
    });
  });

  it("cadastra um usuario e restaura sua sessao", async () => {
    const response = await authenticated("get", "/api/auth/me");

    expect(token).toEqual(expect.any(String));
    expect(user).toMatchObject({ name: "Usuario de Teste", email });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
  });

  it("autentica com email e senha", async () => {
    const response = await request(app).post("/api/auth/login").send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("padroniza conflitos de email no middleware central", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Usuario Duplicado",
      email,
      password,
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Este email ja esta cadastrado.");
  });

  it("protege os dados sem uma sessao valida", async () => {
    const response = await request(app).get("/api/transactions");

    expect(response.status).toBe(401);
  });

  it("valida dados obrigatorios antes de criar uma transacao", async () => {
    const response = await authenticated("post", "/api/transactions").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Dados invalidos.");
    expect(response.body.issues).toEqual(expect.any(Array));
  });

  it("rejeita tipos inesperados nos dados da API", async () => {
    const response = await authenticated("post", "/api/transactions").send({
      amount: 42,
      category: "Outros",
      description: "Tipo invalido",
      type: "credit",
    });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "type" })]),
    );
  });

  it("rejeita categorias financeiras fora da lista padronizada", async () => {
    const response = await authenticated("post", "/api/transactions").send({
      amount: 42,
      category: "Categoria inventada",
      description: "Categoria invalida",
      type: "expense",
    });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "category" })]),
    );
  });

  it("cria, lista e remove uma transacao", async () => {
    const description = `${testPrefix}-transaction`;
    const created = await authenticated("post", "/api/transactions").send({
      description,
      category: "Outros",
      type: "income",
      amount: 42.5,
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ description, amount: 42.5, type: "income" });

    const listed = await authenticated("get", "/api/transactions");
    expect(listed.body.some((transaction) => transaction.id === created.body.id)).toBe(true);

    const removed = await authenticated("delete", `/api/transactions/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("cria, conclui e remove uma tarefa", async () => {
    const title = `${testPrefix}-task`;
    const created = await authenticated("post", "/api/tasks").send({
      title,
      priority: "alta",
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title, priority: "alta", done: false });

    const updated = await authenticated("patch", `/api/tasks/${created.body.id}`).send({
      done: true,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.done).toBe(true);

    const removed = await authenticated("delete", `/api/tasks/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("isola os dados entre usuarios", async () => {
    const secondUser = await request(app).post("/api/auth/register").send({
      name: "Segundo Usuario",
      email: `${testPrefix}-second@example.com`,
      password,
    });
    const created = await authenticated("post", "/api/tasks").send({
      title: `${testPrefix}-private-task`,
      priority: "media",
    });

    const secondUserTasks = await authenticated("get", "/api/tasks", secondUser.body.token);
    const forbiddenDelete = await authenticated(
      "delete",
      `/api/tasks/${created.body.id}`,
      secondUser.body.token,
    );

    expect(secondUserTasks.body).toEqual([]);
    expect(forbiddenDelete.status).toBe(404);

    await authenticated("delete", `/api/tasks/${created.body.id}`);
  });

  it("nao expoe mais a antiga rota de leads", async () => {
    const response = await authenticated("get", "/api/leads");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Rota nao encontrada.");
  });

  it("exige configuracao segura para iniciar em producao", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://localhost/nexaflow",
      NODE_ENV: "production",
    });

    expect(result.success).toBe(false);
  });

  it("limita tentativas repetidas de autenticacao", async () => {
    let response;

    for (let attempt = 0; attempt < 11; attempt += 1) {
      response = await request(app).post("/api/auth/login").send({
        email: "inexistente@example.com",
        password: "senha-incorreta",
      });
    }

    expect(response.status).toBe(429);
    expect(response.body.message).toContain("Muitas tentativas");
  });
});
