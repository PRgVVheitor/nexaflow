import { Prisma } from "@prisma/client";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import {
  createToken,
  hashPassword,
  publicUser,
  requireAuth,
  verifyPassword,
} from "./auth.js";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { buildFinancialIntelligence } from "./finance-intelligence.js";
import {
  loginSchema,
  registerSchema,
  taskSchema,
  taskUpdateSchema,
  transactionSchema,
  transactionUpdateSchema,
  validateBody,
} from "./validation.js";

export const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

const authLimiter = rateLimit({
  handler: (req, res) => {
    res.status(429).json({
      message: "Muitas tentativas de autenticacao. Tente novamente em alguns minutos.",
    });
  },
  legacyHeaders: false,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function serializeTransaction(transaction) {
  return { ...transaction, amount: Number(transaction.amount) };
}

function serializeTask(task) {
  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
  };
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
  authLimiter,
  validateBody(registerSchema),
  asyncRoute(async (req, res) => {
    const { email, name, password } = req.validatedBody;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
      },
    });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  }),
);

app.post(
  "/api/auth/login",
  authLimiter,
  validateBody(loginSchema),
  asyncRoute(async (req, res) => {
    const { email, password } = req.validatedBody;
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

app.get(
  "/api/finance/intelligence",
  requireAuth,
  asyncRoute(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(buildFinancialIntelligence(transactions));
  }),
);

app.post(
  "/api/transactions",
  requireAuth,
  validateBody(transactionSchema),
  asyncRoute(async (req, res) => {
    const { amount, category, description, type } = req.validatedBody;
    const transaction = await prisma.transaction.create({
      data: { description, category, type, amount, userId: req.auth.userId },
    });
    res.status(201).json(serializeTransaction(transaction));
  }),
);

app.patch(
  "/api/transactions/:id",
  requireAuth,
  validateBody(transactionUpdateSchema),
  asyncRoute(async (req, res) => {
    const result = await prisma.transaction.updateMany({
      data: req.validatedBody,
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!result.count) {
      res.status(404).json({ message: "Transacao nao encontrada." });
      return;
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    res.json(serializeTransaction(transaction));
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
    res.json(tasks.map(serializeTask));
  }),
);

app.post(
  "/api/tasks",
  requireAuth,
  validateBody(taskSchema),
  asyncRoute(async (req, res) => {
    const { dueDate, priority, title } = req.validatedBody;
    const task = await prisma.task.create({
      data: {
        title,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00.000Z`) : null,
        userId: req.auth.userId,
      },
    });
    res.status(201).json(serializeTask(task));
  }),
);

app.patch(
  "/api/tasks/:id",
  requireAuth,
  validateBody(taskUpdateSchema),
  asyncRoute(async (req, res) => {
    const data = { ...req.validatedBody };
    if ("dueDate" in data) {
      data.dueDate = data.dueDate ? new Date(`${data.dueDate}T00:00:00.000Z`) : null;
    }

    const result = await prisma.task.updateMany({
      data,
      where: { id: req.params.id, userId: req.auth.userId },
    });

    if (!result.count) {
      res.status(404).json({ message: "Tarefa nao encontrada." });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    res.json(serializeTask(task));
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

app.use((req, res) => {
  res.status(404).json({ message: "Rota nao encontrada." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      issues: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      message: "Dados invalidos.",
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({ message: "JSON invalido." });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({ message: "Banco de dados indisponivel." });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = String(error.meta?.target || "");
      res.status(409).json({
        message: target.includes("email")
          ? "Este email ja esta cadastrado."
          : "Este registro ja existe.",
      });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ message: "Registro nao encontrado." });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Erro interno no servidor." });
});
