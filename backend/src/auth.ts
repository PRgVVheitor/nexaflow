import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string };
      validatedBody?: unknown;
    }
  }
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function createToken(user: Pick<User, "id">) {
  return jwt.sign({}, env.JWT_SECRET, { expiresIn: "7d", subject: user.id });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Autenticacao necessaria." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || !payload.sub) throw new Error("invalid token");
    req.auth = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ message: "Sessao invalida ou expirada." });
  }
}
