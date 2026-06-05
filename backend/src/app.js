import "dotenv/config";
import { Prisma } from "@prisma/client";
import cors from "cors";
import express from "express";
import {
  createToken,
  hashPassword,
  publicUser,
  requireAuth,
  verifyPassword,
} from "./auth.js";
import { prisma } from "./db.js";

const clientOrigin = process.env.CLIENT_ORIGIN || "*";
export const app = express();

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

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  const length = Buffer.byteLength(password, "utf8");
  return length >= 8 && length <= 72;
}

function serializeTransaction(transaction) {
  return { ...transaction, amount: Number(transaction.amount) };
}

app.get(
  "/api/health",
  asyncRoute(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "nexaflow-api", database: "postgresql" });
  }),
);

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (name.length < 2 || !isValidEmail(email) || !isValidPassword(password)) {
      res.status(400).json({
        message: "Informe nome, email valido e senha entre 8 e 72 caracteres.",
      });
      return;
    }

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
        },
      });

      res.status(201).json({ token: createToken(user), user: publicUser(user) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        res.status(409).json({ message: "Este email ja esta cadastrado." });
        return;
      }
      throw error;
    }
  }),
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ message: "Email ou senha invalidos." });
      return;
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  }),
);

app.get(
  "/api/auth/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });

    if (!user) {
      res.status(401).json({ message: "Usuario nao encontrado." });
      return;
    }

    res.json({ user: publicUser(user) });
  }),
);

app.get(
  "/api/transactions",
  requireAuth,
  asyncRoute(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions.map(serializeTransaction));
  }),
);

app.post(
  "/api/transactions",
  requireAuth,
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
      data: { description, category, type, amount, userId: req.auth.userId },
    });
    res.status(201).json(serializeTransaction(transaction));
  }),
);

app.delete(
  "/api/transactions/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.transaction.deleteMany({
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!result.count) {
      res.status(404).json({ message: "Transacao nao encontrada." });
      return;
    }

    res.status(204).end();
  }),
);

app.get(
  "/api/tasks",
  requireAuth,
  asyncRoute(async (req, res) => {
    const tasks = await prisma.task.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  }),
);

app.post(
  "/api/tasks",
  requireAuth,
  asyncRoute(async (req, res) => {
    const title = normalizeText(req.body.title);
    const priorities = ["alta", "media", "baixa"];
    const priority = priorities.includes(req.body.priority) ? req.body.priority : "media";

    if (!title) {
      res.status(400).json({ message: "Titulo da tarefa e obrigatorio." });
      return;
    }

    const task = await prisma.task.create({
      data: { title, priority, userId: req.auth.userId },
    });
    res.status(201).json(task);
  }),
);

app.patch(
  "/api/tasks/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.task.updateMany({
      data: { done: Boolean(req.body.done) },
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!result.count) {
      res.status(404).json({ message: "Tarefa nao encontrada." });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json(task);
  }),
);

app.delete(
  "/api/tasks/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.task.deleteMany({
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!result.count) {
      res.status(404).json({ message: "Tarefa nao encontrada." });
      return;
    }

    res.status(204).end();
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
