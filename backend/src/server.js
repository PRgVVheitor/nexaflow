import "dotenv/config";
import { Prisma } from "@prisma/client";
import cors from "cors";
import express from "express";
import { prisma } from "./db.js";

const port = process.env.PORT || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || "*";
const app = express();

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function serializeTransaction(transaction) {
  return { ...transaction, amount: Number(transaction.amount) };
}

function isMissingRecord(error) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

app.get(
  "/api/health",
  asyncRoute(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "nexaflow-api", database: "postgresql" });
  }),
);

app.get(
  "/api/transactions",
  asyncRoute(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions.map(serializeTransaction));
  }),
);

app.post(
  "/api/transactions",
  asyncRoute(async (req, res) => {
    const description = normalizeText(req.body.description);
    const category = normalizeText(req.body.category);
    const type = req.body.type === "income" ? "income" : "expense";
    const amount = normalizeAmount(req.body.amount);

    if (!description || !category || !amount) {
      res.status(400).json({ message: "Descricao, categoria e valor sao obrigatorios." });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: { description, category, type, amount },
    });
    res.status(201).json(serializeTransaction(transaction));
  }),
);

app.delete(
  "/api/transactions/:id",
  asyncRoute(async (req, res) => {
    try {
      await prisma.transaction.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (error) {
      if (isMissingRecord(error)) {
        res.status(404).json({ message: "Transacao nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.get(
  "/api/tasks",
  asyncRoute(async (req, res) => {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
    res.json(tasks);
  }),
);

app.post(
  "/api/tasks",
  asyncRoute(async (req, res) => {
    const title = normalizeText(req.body.title);
    const priorities = ["alta", "media", "baixa"];
    const priority = priorities.includes(req.body.priority) ? req.body.priority : "media";

    if (!title) {
      res.status(400).json({ message: "Titulo da tarefa e obrigatorio." });
      return;
    }

    const task = await prisma.task.create({ data: { title, priority } });
    res.status(201).json(task);
  }),
);

app.patch(
  "/api/tasks/:id",
  asyncRoute(async (req, res) => {
    try {
      const task = await prisma.task.update({
        data: { done: Boolean(req.body.done) },
        where: { id: req.params.id },
      });
      res.json(task);
    } catch (error) {
      if (isMissingRecord(error)) {
        res.status(404).json({ message: "Tarefa nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.delete(
  "/api/tasks/:id",
  asyncRoute(async (req, res) => {
    try {
      await prisma.task.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (error) {
      if (isMissingRecord(error)) {
        res.status(404).json({ message: "Tarefa nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.get(
  "/api/leads",
  asyncRoute(async (req, res) => {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    res.json(leads);
  }),
);

app.post(
  "/api/leads",
  asyncRoute(async (req, res) => {
    const email = normalizeText(req.body.email).toLowerCase();

    if (!email || !email.includes("@")) {
      res.status(400).json({ message: "Email invalido." });
      return;
    }

    const lead = await prisma.lead.create({ data: { email } });
    res.status(201).json(lead);
  }),
);

app.use((error, req, res, next) => {
  console.error(error);

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({ message: "Banco de dados indisponivel." });
    return;
  }

  res.status(500).json({ message: "Erro interno no servidor." });
});

const server = app.listen(port, () => {
  console.log(`API running on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
