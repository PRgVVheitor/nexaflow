import { Prisma } from "@prisma/client";
import type { Goal, RecurringTransaction, Task, Transaction } from "@prisma/client";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { ZodError, type z } from "zod";
import {
  createToken,
  clearSessionCookie,
  hashPassword,
  publicUser,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from "./auth.js";
import { prisma } from "./db.js";
import {
  createOpaqueToken,
  hashOpaqueToken,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email.js";
import { env } from "./env.js";
import { buildFinancialIntelligence } from "./finance-intelligence.js";
import { materializeRecurring } from "./recurring.js";
import { logger } from "./logger.js";
import { Sentry } from "./monitoring.js";
import {
  emailSchema,
  goalSchema,
  loginSchema,
  recurringSchema,
  recurringUpdateSchema,
  registerSchema,
  resetPasswordSchema,
  taskSchema,
  taskUpdateSchema,
  transactionSchema,
  transactionUpdateSchema,
  tokenSchema,
  validateBody,
} from "./validation.js";

export const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ credentials: true, origin: env.CLIENT_ORIGIN }));
app.use(pinoHttp({ logger }));
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || !req.headers.origin) {
    next();
    return;
  }
  if (req.headers.origin !== env.CLIENT_ORIGIN) {
    res.status(403).json({ message: "Origem nao autorizada." });
    return;
  }
  next();
});

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

function serializeRecurring(recurrence: RecurringTransaction) {
  return { ...recurrence, amount: Number(recurrence.amount) };
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

async function createVerification(userId: string, email: string) {
  const token = createOpaqueToken();
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: {
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      tokenHash: hashOpaqueToken(token),
      userId,
    },
  });
  try {
    await sendVerificationEmail(email, token);
  } catch (error) {
    logger.error({ err: error, userId }, "Falha ao enviar email de verificacao");
  }
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
    await createVerification(user.id, user.email);
    setSessionCookie(res, createToken(user));
    res.status(201).json({ user: publicUser(user) });
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

    setSessionCookie(res, createToken(user));
    res.json({ user: publicUser(user) });
  }),
);

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

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

app.post(
  "/api/auth/request-verification",
  authLimiter,
  validateBody(emailSchema),
  asyncRoute(async (req, res) => {
    const { email } = validated(req, emailSchema);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) await createVerification(user.id, user.email);
    res.json({ message: "Se a conta existir, enviaremos um link de verificacao." });
  }),
);

app.post(
  "/api/auth/verify-email",
  authLimiter,
  validateBody(tokenSchema),
  asyncRoute(async (req, res) => {
    const { token } = validated(req, tokenSchema);
    const verification = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
    });
    if (!verification || verification.expiresAt < new Date()) {
      res.status(400).json({ message: "Link invalido ou expirado." });
      return;
    }
    await prisma.$transaction([
      prisma.user.update({
        data: { emailVerifiedAt: new Date() },
        where: { id: verification.userId },
      }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: verification.userId } }),
    ]);
    res.json({ message: "Email verificado com sucesso." });
  }),
);

app.post(
  "/api/auth/forgot-password",
  authLimiter,
  validateBody(emailSchema),
  asyncRoute(async (req, res) => {
    const { email } = validated(req, emailSchema);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = createOpaqueToken();
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: {
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          tokenHash: hashOpaqueToken(token),
          userId: user.id,
        },
      });
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (error) {
        logger.error({ err: error, userId: user.id }, "Falha ao enviar recuperacao de senha");
      }
    }
    res.json({ message: "Se a conta existir, enviaremos instrucoes para redefinir a senha." });
  }),
);

app.post(
  "/api/auth/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncRoute(async (req, res) => {
    const { password, token } = validated(req, resetPasswordSchema);
    const reset = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
    });
    if (!reset || reset.expiresAt < new Date()) {
      res.status(400).json({ message: "Link invalido ou expirado." });
      return;
    }
    await prisma.$transaction([
      prisma.user.update({
        data: { passwordHash: await hashPassword(password) },
        where: { id: reset.userId },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: reset.userId } }),
    ]);
    res.json({ message: "Senha redefinida com sucesso." });
  }),
);

app.get(
  "/api/transactions",
  requireAuth,
  asyncRoute(async (req, res) => {
    await materializeRecurring(authUserId(req));
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
    await materializeRecurring(authUserId(req));
    const transactions = await prisma.transaction.findMany({
      where: { userId: authUserId(req) },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    res.json(buildFinancialIntelligence(transactions));
  }),
);

app.get(
  "/api/recurring",
  requireAuth,
  asyncRoute(async (req, res) => {
    const recurrences = await prisma.recurringTransaction.findMany({
      where: { userId: authUserId(req) },
      orderBy: { createdAt: "desc" },
    });
    res.json(recurrences.map(serializeRecurring));
  }),
);

app.post(
  "/api/recurring",
  requireAuth,
  validateBody(recurringSchema),
  asyncRoute(async (req, res) => {
    const data = validated(req, recurringSchema);
    const recurrence = await prisma.recurringTransaction.create({
      data: { ...data, userId: authUserId(req) },
    });
    await materializeRecurring(authUserId(req));
    res.status(201).json(serializeRecurring(recurrence));
  }),
);

app.patch(
  "/api/recurring/:id",
  requireAuth,
  validateBody(recurringUpdateSchema),
  asyncRoute(async (req, res) => {
    const data = validated(req, recurringUpdateSchema);

    try {
      const recurrence = await prisma.recurringTransaction.update({
        data,
        where: { id: req.params.id, userId: authUserId(req) },
      });
      res.json(serializeRecurring(recurrence));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        res.status(404).json({ message: "Recorrencia nao encontrada." });
        return;
      }
      throw error;
    }
  }),
);

app.delete(
  "/api/recurring/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    const result = await prisma.recurringTransaction.deleteMany({
      where: { id: req.params.id, userId: authUserId(req) },
    });

    if (!result.count) {
      res.status(404).json({ message: "Recorrencia nao encontrada." });
      return;
    }

    res.status(204).end();
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

  req.log.error({ err: error }, "Erro nao tratado");
  Sentry.captureException(error);
  res.status(500).json({ message: "Erro interno no servidor." });
});
