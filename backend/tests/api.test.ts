import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";
import { envSchema } from "../src/env.js";
import { createOpaqueToken, hashOpaqueToken } from "../src/email.js";

const testPrefix = `ci-${Date.now()}`;
const email = `${testPrefix}@example.com`;
const password = "senha-segura-123";
let user: { id: string; name: string; email: string };
const agent = request.agent(app);

beforeAll(async () => {
  await prisma.$connect();
  const response = await agent.post("/api/auth/register").send({
    name: "Usuario de Teste",
    email,
    password,
  });
  user = response.body.user;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: testPrefix } } });
  await prisma.$disconnect();
});

function authenticated(
  method: "get" | "post" | "patch" | "delete",
  path: string,
) {
  return agent[method](path);
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

    expect(user).toMatchObject({ name: "Usuario de Teste", email });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(email);
  });

  it("autentica com email e senha", async () => {
    const response = await request(app).post("/api/auth/login").send({ email, password });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]?.[0]).toContain("nexaflow_session=");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(response.body.token).toBeUndefined();
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

  it("cria, lista, edita e remove uma transacao", async () => {
    const description = `${testPrefix}-transaction`;
    const created = await authenticated("post", "/api/transactions").send({
      description,
      category: "Outros",
      type: "income",
      amount: 42.5,
      date: "2026-06-01",
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      description,
      amount: 42.5,
      type: "income",
      date: "2026-06-01",
    });

    const listed = await authenticated("get", "/api/transactions");
    expect(listed.body.some((transaction: { id: string }) => transaction.id === created.body.id)).toBe(true);

    const edited = await authenticated("patch", `/api/transactions/${created.body.id}`).send({
      description: `${description}-editada`,
      category: "Freelance",
      type: "income",
      amount: 75.25,
      date: "2026-06-04",
    });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({
      description: `${description}-editada`,
      category: "Freelance",
      type: "income",
      amount: 75.25,
      date: "2026-06-04",
    });

    const removed = await authenticated("delete", `/api/transactions/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("usa a data atual quando a transacao nao informa data", async () => {
    const created = await authenticated("post", "/api/transactions").send({
      description: `${testPrefix}-sem-data`,
      category: "Outros",
      type: "expense",
      amount: 10,
    });

    expect(created.status).toBe(201);
    expect(created.body.date).toBe(new Date().toISOString().slice(0, 10));

    await authenticated("delete", `/api/transactions/${created.body.id}`);
  });

  it("gera score, previsoes e insights financeiros", async () => {
    const response = await authenticated("get", "/api/finance/intelligence");

    expect(response.status).toBe(200);
    expect(response.body.score.value).toBeGreaterThanOrEqual(0);
    expect(response.body.score.value).toBeLessThanOrEqual(100);
    expect(response.body.forecast.periods).toHaveLength(3);
    expect(response.body.insights).toEqual(expect.any(Array));
  });

  it("cria, edita, conclui e remove uma tarefa", async () => {
    const title = `${testPrefix}-task`;
    const created = await authenticated("post", "/api/tasks").send({
      title,
      priority: "alta",
      dueDate: "2026-06-10",
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      title,
      priority: "alta",
      done: false,
      dueDate: "2026-06-10",
    });

    const edited = await authenticated("patch", `/api/tasks/${created.body.id}`).send({
      title: `${title}-editada`,
      priority: "baixa",
      dueDate: "2026-06-12",
    });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({
      title: `${title}-editada`,
      priority: "baixa",
      dueDate: "2026-06-12",
      done: false,
    });

    const updated = await authenticated("patch", `/api/tasks/${created.body.id}`).send({
      done: true,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.done).toBe(true);
    expect(updated.body.dueDate).toBe("2026-06-12");

    const removed = await authenticated("delete", `/api/tasks/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("materializa recorrencias sem duplicar lancamentos", async () => {
    const today = new Date();
    const created = await authenticated("post", "/api/recurring").send({
      description: `${testPrefix}-recorrencia`,
      category: "Moradia",
      type: "expense",
      amount: 999.99,
      dayOfMonth: today.getUTCDate(),
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      description: `${testPrefix}-recorrencia`,
      dayOfMonth: today.getUTCDate(),
      active: true,
    });

    const firstList = await authenticated("get", "/api/transactions");
    const firstMatches = firstList.body.filter(
      (transaction: { description: string }) =>
        transaction.description === `${testPrefix}-recorrencia`,
    );
    expect(firstMatches).toHaveLength(1);
    expect(firstMatches[0].amount).toBe(999.99);

    const secondList = await authenticated("get", "/api/transactions");
    const secondMatches = secondList.body.filter(
      (transaction: { description: string }) =>
        transaction.description === `${testPrefix}-recorrencia`,
    );
    expect(secondMatches).toHaveLength(1);

    const paused = await authenticated("patch", `/api/recurring/${created.body.id}`).send({
      active: false,
    });
    expect(paused.status).toBe(200);
    expect(paused.body.active).toBe(false);

    const removed = await authenticated("delete", `/api/recurring/${created.body.id}`);
    expect(removed.status).toBe(204);
  });
  it("cria, atualiza, lista e remove uma meta de gastos", async () => {
    const created = await authenticated("post", "/api/goals").send({
      category: "Lazer",
      monthlyLimit: 400,
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ category: "Lazer", monthlyLimit: 400 });

    const updated = await authenticated("post", "/api/goals").send({
      category: "Lazer",
      monthlyLimit: 650.5,
    });
    expect(updated.status).toBe(201);
    expect(updated.body.id).toBe(created.body.id);
    expect(updated.body.monthlyLimit).toBe(650.5);

    const listed = await authenticated("get", "/api/goals");
    expect(listed.body.some((goal: { id: string }) => goal.id === created.body.id)).toBe(true);

    const removed = await authenticated("delete", `/api/goals/${created.body.id}`);
    expect(removed.status).toBe(204);
  });
  it("rejeita prazo invalido ao criar uma tarefa", async () => {
    const response = await authenticated("post", "/api/tasks").send({
      title: `${testPrefix}-invalid-date`,
      priority: "media",
      dueDate: "2026-02-31",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Dados invalidos.");
  });

  it("isola os dados entre usuarios", async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post("/api/auth/register").send({
      name: "Segundo Usuario",
      email: `${testPrefix}-second@example.com`,
      password,
    });
    const created = await authenticated("post", "/api/tasks").send({
      title: `${testPrefix}-private-task`,
      priority: "media",
    });

    const secondUserTasks = await secondAgent.get("/api/tasks");
    const forbiddenDelete = await secondAgent.delete(`/api/tasks/${created.body.id}`);

    expect(secondUserTasks.body).toEqual([]);
    expect(forbiddenDelete.status).toBe(404);

    await authenticated("delete", `/api/tasks/${created.body.id}`);
  });

  it("nao expoe mais a antiga rota de leads", async () => {
    const response = await authenticated("get", "/api/leads");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Rota nao encontrada.");
  });

  it("encerra a sessao removendo o cookie", async () => {
    const logoutAgent = request.agent(app);
    await logoutAgent.post("/api/auth/login").send({ email, password });
    const logout = await logoutAgent.post("/api/auth/logout");
    const me = await logoutAgent.get("/api/auth/me");

    expect(logout.status).toBe(204);
    expect(logout.headers["set-cookie"]?.[0]).toContain("nexaflow_session=;");
    expect(me.status).toBe(401);
  });

  it("nao revela se um email existe na recuperacao de senha", async () => {
    const existing = await request(app).post("/api/auth/forgot-password").send({ email });
    const missing = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `${testPrefix}-missing@example.com` });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.body.message).toBe(missing.body.message);
  });

  it("verifica email com token opaco de uso unico", async () => {
    const verificationToken = createOpaqueToken();
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.emailVerificationToken.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashOpaqueToken(verificationToken),
        userId: user.id,
      },
    });

    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: verificationToken });
    const reused = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: verificationToken });

    expect(response.status).toBe(200);
    expect(reused.status).toBe(400);
    expect((await prisma.user.findUnique({ where: { id: user.id } }))?.emailVerifiedAt).not.toBeNull();
  });

  it("redefine a senha com token opaco de uso unico", async () => {
    const resetToken = createOpaqueToken();
    const newPassword = "senha-nova-segura-123";
    await prisma.passwordResetToken.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashOpaqueToken(resetToken),
        userId: user.id,
      },
    });

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ password: newPassword, token: resetToken });
    const login = await request(app).post("/api/auth/login").send({ email, password: newPassword });
    const reused = await request(app)
      .post("/api/auth/reset-password")
      .send({ password: "outra-senha-segura-123", token: resetToken });

    expect(reset.status).toBe(200);
    expect(login.status).toBe(200);
    expect(reused.status).toBe(400);
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

    expect(response!.status).toBe(429);
    expect(response!.body.message).toContain("Muitas tentativas");
  });
});
