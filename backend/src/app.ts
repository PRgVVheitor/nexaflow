import { Prisma } from "@prisma/client";
import type { Goal, Task, Transaction } from "@prisma/client";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError, type z } from "zod";
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
  goalSchema,
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
app.use(helmet());
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

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function validated<Schema extends z.ZodType>(req: Request, _schema: Schema) {
  return req.validatedBody as z.infer<Schema>;
}

function serializeTransaction(transaction: Transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString().slice(0, 10),
  };
}

function serializeGoal(goal: Goal) {
  return { ...goal, monthlyLimit: Number(goal.monthlyLimit) };
}

function serializeTask(task: Task) {
  return {
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
  };
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function authUserId(req: Request) {
  return req.auth!.userId;
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
    const { email, name, password } = validated(req, registerSchema);
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
    const { email, password } = validated(req, loginSchema);
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
    const user = await prisma.user.findUnique({ where: { id: authUserId(req) } });

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
      where: { userId: authUserId(req) },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    res.json(transactions.map(serializeTransaction));
  }),
);

app.get(
  "/api/finance/intelligence",
  requireAuth,
  asyncRoute(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: authUserId(req) },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    res.json(buildFinancialIntelligence(transactions));
  }),
);

app.post(
  "/api/transactions",
  requireAuth,
  validateBody(transactionSchema),
  asyncRoute(async (req, res) => {
    const { amount, category, date, description, type } = validated(req, transactionSchema);
    const transaction = await prisma.transaction.create({
      data: {
        description,
        category,
        type,
        amount,
        ...(date ? { date: parseDateOnly(date) } : {}),
        userId: authUserId(req),
      },
    });
    res.status(201).json(serializeTransaction(transaction));
  }),
);

app.patch(
  "/api/transactions/:id",
  requireAuth,
  validateBody(transactionUpdateSchema),
  asyncRoute(async (req, res) => {
    const { date, ...rest } = validated(req, transactionUpdateSchema);
    const data = { ...rest, ...(date ? { date: parseDateOnly(date) } : {}) };

    try {
      const transaction = await prisma.transaction.update({
        data,
        where: { id: req.params.id, userId: authUserId(req) },
      });
      res.json(serializeTransaction(transaction));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Transacao nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.delete(
  "/api/transactions/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.transaction.deleteMany({
      where: { id: req.params.id, userId: authUserId(req) },
    });

    if (!result.count) {
      res.status(404).json({ message: "Transacao nao encontrada." });
      return;
    }

    res.status(204).end();
  }),
);

app.get(
  "/api/goals",
  requireAuth,
  asyncRoute(async (req, res) => {
    const goals = await prisma.goal.findMany({
      where: { userId: authUserId(req) },
      orderBy: { category: "asc" },
    });
    res.json(goals.map(serializeGoal));
  }),
);

app.post(
  "/api/goals",
  requireAuth,
  validateBody(goalSchema),
  asyncRoute(async (req, res) => {
    const { category, monthlyLimit } = validated(req, goalSchema);
    const goal = await prisma.goal.upsert({
      where: { userId_category: { userId: authUserId(req), category } },
      update: { monthlyLimit },
      create: { category, monthlyLimit, userId: authUserId(req) },
    });
    res.status(201).json(serializeGoal(goal));
  }),
);

app.delete(
  "/api/goals/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.goal.deleteMany({
      where: { id: req.params.id, userId: authUserId(req) },
    });

    if (!result.count) {
      res.status(404).json({ message: "Meta nao encontrada." });
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
      where: { userId: authUserId(req) },
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
    const { dueDate, priority, title } = validated(req, taskSchema);
    const task = await prisma.task.create({
      data: {
        title,
        priority,
        dueDate: dueDate ? parseDateOnly(dueDate) : null,
        userId: authUserId(req),
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
    const { dueDate, ...rest } = validated(req, taskUpdateSchema);
    const data = {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? parseDateOnly(dueDate) : null } : {}),
    };

    try {
      const task = await prisma.task.update({
        data,
        where: { id: req.params.id, userId: authUserId(req) },
      });
      res.json(serializeTask(task));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Tarefa nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.delete(
  "/api/tasks/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.task.deleteMany({
      where: { id: req.params.id, userId: authUserId(req) },
    });

    if (!result.count) {
      res.status(404).json({ message: "Tarefa nao encontrada." });
      return;
    }

    res.status(204).end();
  }),
);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Rota nao encontrada." });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
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

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    "body" in error
  ) {
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
