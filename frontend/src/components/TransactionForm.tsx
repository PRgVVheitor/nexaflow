import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Loader2, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { transactionCategories } from "../lib/constants";
import { displayCategory } from "../lib/format";
import {
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "../lib/schemas";
import type { TransactionType } from "../lib/types";
import { cn } from "../lib/utils";
import { DatePicker } from "./DatePicker";
import { FieldError } from "./FieldError";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select } from "./ui";

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

interface TransactionFormProps {
  onCreate: (data: TransactionFormValues) => Promise<boolean>;
}

export function TransactionForm({ onCreate }: TransactionFormProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<TransactionFormInput, unknown, TransactionFormValues>({
    defaultValues: { amount: "", category: "", date: today(), description: "", type: "expense" },
    resolver: zodResolver(transactionFormSchema),
  });
  const type = watch("type");
  const category = watch("category");
  const categories = transactionCategories[type];

  function selectType(nextType: TransactionType) {
    setValue("type", nextType);
    if (!transactionCategories[nextType].includes(category)) setValue("category", "");
  }

  async function submit(data: TransactionFormValues) {
    if (await onCreate(data)) {
      reset({ amount: "", category: "", date: data.date, description: "", type: data.type });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova transação</CardTitle>
        <CardDescription>Registre uma entrada ou saída no painel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" noValidate onSubmit={handleSubmit(submit)}>
          <Input
            aria-label="Descrição"
            aria-invalid={Boolean(errors.description)}
            className={cn(errors.description && "border-red-400 focus:border-red-400")}
            placeholder="Descrição"
            {...register("description")}
          />
          <FieldError error={errors.description} />
          <Select
            aria-label="Categoria"
            aria-invalid={Boolean(errors.category)}
            className={cn(errors.category && "border-red-400 focus:border-red-400")}
            {...register("category")}
          >
            <option disabled value="">
              Selecione uma categoria
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {displayCategory(category)}
              </option>
            ))}
          </Select>
          <FieldError error={errors.category} />
          <Input
            aria-label="Valor"
            aria-invalid={Boolean(errors.amount)}
            className={cn(errors.amount && "border-red-400 focus:border-red-400")}
            min="0.01"
            placeholder="Valor"
            step="0.01"
            type="number"
            {...register("amount")}
          />
          <FieldError error={errors.amount} />
          <label className="grid gap-1.5 text-xs font-medium text-zinc-400">
            Data do lançamento
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  label="Data da transação"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </label>
          <FieldError error={errors.date} />
          <div
            aria-label="Tipo da transação"
            className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1"
            role="group"
          >
            <Button
              aria-pressed={type === "expense"}
              className={cn(type === "expense" && "bg-rose-400/15 text-rose-300")}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => selectType("expense")}
            >
              <ArrowDownRight size={16} />
              Saída
            </Button>
            <Button
              aria-pressed={type === "income"}
              className={cn(type === "income" && "bg-emerald-400/15 text-emerald-300")}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => selectType("income")}
            >
              <ArrowUpRight size={16} />
              Entrada
            </Button>
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            Adicionar transação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
