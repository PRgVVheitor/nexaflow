import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function createToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "7d", subject: user.id },
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Autenticacao necessaria." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = { userId: payload.sub };
    next();
  } catch {
    res.status(401).json({ message: "Sessao invalida ou expirada." });
  }
}
