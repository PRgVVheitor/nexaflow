import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { env } from "./env.js";
import { logger } from "./logger.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendEmail(to: string, subject: string, html: string, developmentUrl: string) {
  if (!resend) {
    if (env.NODE_ENV === "production") {
      throw new Error("Provedor de email nao configurado.");
    }
    logger.info({ developmentUrl, to }, `Email simulado: ${subject}`);
    return;
  }

  const result = await resend.emails.send({ from: env.EMAIL_FROM, html, subject, to });
  if (result.error) throw new Error(result.error.message);
}

export function sendVerificationEmail(email: string, token: string) {
  const url = `${env.CLIENT_ORIGIN}/verificar-email?token=${token}`;
  return sendEmail(
    email,
    "Confirme seu email no NexaFlow",
    `<p>Confirme seu email para proteger sua conta.</p><p><a href="${url}">Verificar email</a></p>`,
    url,
  );
}

export function sendPasswordResetEmail(email: string, token: string) {
  const url = `${env.CLIENT_ORIGIN}/redefinir-senha?token=${token}`;
  return sendEmail(
    email,
    "Redefina sua senha do NexaFlow",
    `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${url}">Criar nova senha</a></p><p>O link expira em uma hora.</p>`,
    url,
  );
}
