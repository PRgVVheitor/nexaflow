import "dotenv/config";
import { z } from "zod";

const localJwtSecret = "nexaflow-local-development-secret-change-me";

export const envSchema = z
  .object({
    CLIENT_ORIGIN: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional(),
    ),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(?:ql)?:\/\//, "DATABASE_URL deve apontar para PostgreSQL."),
    EMAIL_FROM: z.string().min(3).default("NexaFlow <onboarding@resend.dev>"),
    JWT_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    RESEND_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") {
      if (values.JWT_SECRET && values.JWT_SECRET.length < 16) {
        context.addIssue({
          code: "custom",
          message: "JWT_SECRET deve ter pelo menos 16 caracteres.",
          path: ["JWT_SECRET"],
        });
      }
      return;
    }

    if (!values.CLIENT_ORIGIN) {
      context.addIssue({
        code: "custom",
        message: "CLIENT_ORIGIN e obrigatoria em producao.",
        path: ["CLIENT_ORIGIN"],
      });
    }

    if (!values.JWT_SECRET || values.JWT_SECRET.length < 32) {
      context.addIssue({
        code: "custom",
        message: "JWT_SECRET deve ter pelo menos 32 caracteres em producao.",
        path: ["JWT_SECRET"],
      });
    }

  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "ambiente"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Variaveis de ambiente invalidas: ${details}`);
}

export const env = {
  ...result.data,
  CLIENT_ORIGIN: result.data.CLIENT_ORIGIN || "http://127.0.0.1:5173",
  JWT_SECRET: result.data.JWT_SECRET || localJwtSecret,
};
