import { Loader2, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { transactionCategories } from "../lib/constants";
import { currency, displayCategory } from "../lib/format";
import type { Goal } from "../lib/types";
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

interface GoalsPanelProps {
  goals: Goal[];
  loading: boolean;
  spentByCategory: Record<string, number>;
  onDelete: (id: string) => void;
  onSave: (category: string, monthlyLimit: number) => Promise<boolean>;
}

export function GoalsPanel({ goals, loading, spentByCategory, onDelete, onSave }: GoalsPanelProps) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsedLimit = Number(limit);
    if (!category || !Number.isFinite(parsedLimit) || parsedLimit <= 0) return;

    setSaving(true);
    if (await onSave(category, parsedLimit)) {
      setCategory("");
      setLimit("");
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-emerald-300" size={17} />
            Metas de gastos
          </CardTitle>
          <CardDescription>
            Limites mensais por categoria, comparados aos gastos do mês atual.
          </CardDescription>
        </div>
        <form className="grid gap-2 sm:grid-cols-[180px_140px_auto]" onSubmit={submit}>
          <Select
            aria-label="Categoria da meta"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option disabled value="">
              Categoria
            </option>
            {transactionCategories.expense.map((item) => (
              <option key={item} value={item}>
                {displayCategory(item)}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Limite mensal da meta"
            min="0.01"
            placeholder="Limite (R$)"
            step="0.01"
            type="number"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
          <Button disabled={saving || !category || !limit} type="submit">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Salvar meta
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div aria-label="Carregando metas" className="animate-pulse space-y-3">
            {Array.from({ length: 2 }, (_, index) => (
              <div className="h-14 rounded-lg bg-zinc-800/60" key={index} />
            ))}
          </div>
        ) : !goals.length ? (
          <EmptyState text="Defina um limite mensal por categoria para acompanhar seus gastos." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {goals.map((goal) => {
              const spent = spentByCategory[goal.category] || 0;
              const percentage = goal.monthlyLimit
                ? Math.round((spent / goal.monthlyLimit) * 100)
                : 0;
              const exceeded = percentage >= 100;
              const warning = !exceeded && percentage >= 70;
              const barColor = exceeded
                ? "bg-rose-400"
                : warning
                  ? "bg-amber-400"
                  : "bg-emerald-400";

              return (
                <div
                  className="rounded-lg border border-zinc-800 bg-zinc-950/35 p-4"
                  key={goal.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-100">
                          {displayCategory(goal.category)}
                        </p>
                        {exceeded && <Badge variant="danger">Estourada</Badge>}
                        {warning && <Badge variant="warning">Quase no limite</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {currency.format(spent)} de {currency.format(goal.monthlyLimit)} ({percentage}
                        %)
                      </p>
                    </div>
                    <Button
                      aria-label={`Remover meta de ${displayCategory(goal.category)}`}
                      size="icon"
                      type="button"
                      variant="destructive"
                      onClick={() => onDelete(goal.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                  <div
                    aria-label={`${percentage}% da meta de ${displayCategory(goal.category)} usada`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={Math.min(percentage, 100)}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"
                    role="progressbar"
                  >
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
