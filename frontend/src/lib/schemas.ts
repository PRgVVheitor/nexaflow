import { z } from "zod";

export const transactionFormSchema = z.object({
  amount: z.coerce
    .number({ error: "Informe um valor." })
    .positive("O valor deve ser maior que zero."),
  category: z.string().min(1, "Selecione uma categoria."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecione a data do lançamento."),
  description: z.string().trim().min(2, "Informe uma descrição com pelo menos 2 caracteres."),
  type: z.enum(["income", "expense"]),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
export type TransactionFormInput = z.input<typeof transactionFormSchema>;

export const taskFormSchema = z.object({
  dueDate: z.string().optional(),
  priority: z.enum(["alta", "media", "baixa"]),
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres."),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const registerFormSchema = loginFormSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome."),
});
