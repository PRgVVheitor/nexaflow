import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

const testPrefix = `ci-${Date.now()}`;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.lead.deleteMany({ where: { email: { startsWith: testPrefix } } });
  await prisma.task.deleteMany({ where: { title: { startsWith: testPrefix } } });
  await prisma.transaction.deleteMany({
    where: { description: { startsWith: testPrefix } },
  });
  await prisma.$disconnect();
});

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

  it("valida dados obrigatorios antes de criar uma transacao", async () => {
    const response = await request(app).post("/api/transactions").send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Descricao, categoria e valor sao obrigatorios.");
  });

  it("cria, lista e remove uma transacao", async () => {
    const description = `${testPrefix}-transaction`;
    const created = await request(app).post("/api/transactions").send({
      description,
      category: "Testes",
      type: "income",
      amount: 42.5,
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ description, amount: 42.5, type: "income" });

    const listed = await request(app).get("/api/transactions");
    expect(listed.body.some((transaction) => transaction.id === created.body.id)).toBe(true);

    const removed = await request(app).delete(`/api/transactions/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("cria, conclui e remove uma tarefa", async () => {
    const title = `${testPrefix}-task`;
    const created = await request(app).post("/api/tasks").send({
      title,
      priority: "alta",
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title, priority: "alta", done: false });

    const updated = await request(app).patch(`/api/tasks/${created.body.id}`).send({
      done: true,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.done).toBe(true);

    const removed = await request(app).delete(`/api/tasks/${created.body.id}`);
    expect(removed.status).toBe(204);
  });

  it("captura um lead valido", async () => {
    const email = `${testPrefix}@example.com`;
    const response = await request(app).post("/api/leads").send({ email });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(email);
  });
});
