import { Loader2, Pause, Play, Plus, Repeat, Trash2 } from "lucide-react";
import { useState } from "react";
import { transactionCategories } from "../lib/constants";
import { currency, displayCategory } from "../lib/format";
import type { RecurringTransaction, TransactionType } from "../lib/types";
import { cn } from "../lib/utils";
import { EmptyState } from "./EmptyState";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "./ui";

export interface RecurringFormValues {
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  dayOfMonth: number;
}

interface RecurringPanelProps {
  recurrences: RecurringTransaction[];
  loading: boolean;
  onCreate: (data: RecurringFormValues) => Promise<boolean>;
  onDelete: (id: string) => void;
  onToggle: (recurrence: RecurringTransaction) => void;
}

const emptyForm = {
  description: "",
  category: "",
  type: "expense" as TransactionType,
  amount: "",
  dayOfMonth: "1",
};

export function RecurringPanel({
  recurrences,
  loading,
  onCreate,
  onDelete,
  onToggle,
}: RecurringPanelProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function update<Field extends keyof typeof emptyForm>(field: Field, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    const dayOfMonth = Number(form.dayOfMonth);
    if (
      form.description.trim().length < 1 ||
      !form.category ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(dayOfMonth) ||
      dayOfMonth < 1 ||
      dayOfMonth > 31
    ) {
      return;
    }

    setSaving(true);
    const created = await onCreate({
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      amount,
      dayOfMonth,
    });
    if (created) setForm(emptyForm);
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="text-emerald-300" size={17} />
          Transações recorrentes
        </CardTitle>
        <CardDescription>
          Salário, aluguel e assinaturas são lançados automaticamente todo mês no dia escolhido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_130px_120px_110px_auto]"
          onSubmit={submit}
        >
          <Input
            aria-label="Descrição da recorrência"
            placeholder="Descrição (ex.: Aluguel)"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />
          <Select
            aria-label="Categoria da recorrência"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            <option disabled value="">
              Categoria
            </option>
            {transactionCategories[form.type].map((category) => (
              <option key={category} value={category}>
                {displayCategory(category)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Tipo da recorrência"
            value={form.type}
            onChange={(event) => {
              const type = event.target.value as TransactionType;
              setForm((current) => ({
                ...current,
                type,
                category: transactionCategories[type].includes(current.category)
                  ? current.category
                  : "",
              }));
            }}
          >
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </Select>
          <Input
            aria-label="Valor da recorrência"
            min="0.01"
            placeholder="Valor (R$)"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
          />
          <Input
            aria-label="Dia do mês da recorrência"
            max="31"
            min="1"
            placeholder="Dia"
            step="1"
            type="number"
            value={form.dayOfMonth}
            onChange={(event) => update("dayOfMonth", event.target.value)}
          />
          <Button disabled={saving} type="submit">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Adicionar
          </Button>
        </form>

        {loading ? (
          <div aria-label="Carregando recorrências" className="animate-pulse space-y-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div className="h-12 rounded-lg bg-zinc-800/60" key={index} />
            ))}
          </div>
        ) : !recurrences.length ? (
          <EmptyState text="Nenhuma recorrência ainda. Cadastre o salário ou o aluguel para automatizar o mês." />
        ) : (
          <div className="space-y-2">
            {recurrences.map((recurrence) => (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3",
                  !recurrence.active && "opacity-60",
                )}
                key={recurrence.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {recurrence.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{displayCategory(recurrence.category)}</Badge>
                    <Badge variant={recurrence.type === "income" ? "success" : "danger"}>
                      {recurrence.type === "income" ? "Entrada" : "Saída"}
                    </Badge>
                    <Badge className="normal-case" variant="default">
                      Todo dia {recurrence.dayOfMonth}
                    </Badge>
                    {!recurrence.active && <Badge variant="warning">Pausada</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <strong
                    className={cn(
                      "text-sm",
                      recurrence.type === "income" ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {currency.format(recurrence.amount)}
                  </strong>
                  <Button
                    aria-label={
                      recurrence.active
                        ? `Pausar recorrência ${recurrence.description}`
                        : `Reativar recorrência ${recurrence.description}`
                    }
                    size="icon"
                    title={recurrence.active ? "Pausar" : "Reativar"}
                    type="button"
                    variant="secondary"
                    onClick={() => onToggle(recurrence)}
                  >
                    {recurrence.active ? <Pause size={15} /> : <Play size={15} />}
                  </Button>
                  <Button
                    aria-label={`Remover recorrência ${recurrence.description}`}
                    size="icon"
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(recurrence.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
