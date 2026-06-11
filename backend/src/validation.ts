import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const trimmedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const password = z
  .string()
  .refine((value) => {
    const length = Buffer.byteLength(value, "utf8");
    return length >= 8 && length <= 72;
  }, "A senha deve ter entre 8 e 72 caracteres.");

const transactionCategory = z.enum([
  "Alimentacao",
  "Moradia",
  "Transporte",
  "Saude",
  "Educacao",
  "Lazer",
  "Servicos",
  "Renda",
  "Freelance",
  "Investimentos",
  "Outros",
]);

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato AAAA-MM-DD.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Informe uma data valida.");

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    name: trimmedText(2, 80),
    password,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(72),
  })
  .strict();

export const transactionSchema = z
  .object({
    amount: z.coerce.number().finite().positive().max(9999999999.99),
    category: transactionCategory,
    date: dateOnly.optional(),
    description: trimmedText(1, 120),
    type: z.enum(["income", "expense"]),
  })
  .strict();

export const transactionUpdateSchema = transactionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo para atualizar.");

export const goalSchema = z
  .object({
    category: transactionCategory,
    monthlyLimit: z.coerce.number().finite().positive().max(9999999999.99),
  })
  .strict();

export const taskSchema = z
  .object({
    dueDate: dateOnly.nullable().optional().default(null),
    priority: z.enum(["alta", "media", "baixa"]).default("media"),
    title: trimmedText(1, 160),
  })
  .strict();

export const taskUpdateSchema = z
  .object({
    done: z.boolean().optional(),
    dueDate: dateOnly.nullable().optional(),
    priority: z.enum(["alta", "media", "baixa"]).optional(),
    title: trimmedText(1, 160).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo para atualizar.");

export function validateBody<Schema extends z.ZodType>(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
