import { ArrowUpRight, BrainCircuit, Gauge, Lightbulb, TriangleAlert } from "lucide-react";
import { currency } from "../lib/format";
import type { Intelligence, InsightType } from "../lib/types";
import { cn } from "../lib/utils";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";

interface FinancialIntelligencePanelProps {
  intelligence: Intelligence | null;
  loading: boolean;
}

export function FinancialIntelligencePanel({ intelligence, loading }: FinancialIntelligencePanelProps) {
  if (loading) {
    return (
      <div aria-label="Carregando inteligência financeira" className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card className="h-64 animate-pulse bg-zinc-900/70" key={index}>
            <CardContent className="space-y-4 p-5">
              <div className="h-4 w-32 rounded bg-zinc-800" />
              <div className="h-28 rounded bg-zinc-800/70" />
              <div className="h-3 w-2/3 rounded bg-zinc-800/60" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!intelligence) return null;

  const scoreTone =
    intelligence.score.value >= 65
      ? { color: "#34d399", text: "text-emerald-300" }
      : intelligence.score.value >= 45
        ? { color: "#fbbf24", text: "text-amber-300" }
        : { color: "#fb7185", text: "text-rose-300" };
  const riskVariant =
    intelligence.forecast.risk === "low"
      ? "success"
      : intelligence.forecast.risk === "medium"
        ? "warning"
        : "danger";

  return (
    <section aria-labelledby="financial-intelligence-title" className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
          <BrainCircuit size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-50" id="financial-intelligence-title">
            Inteligência financeira
          </h2>
          <p className="text-xs text-zinc-400">Análises calculadas a partir dos seus movimentos.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.05fr_1.55fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="text-emerald-300" size={17} />
              Nexa Score
            </CardTitle>
            <CardDescription>Saúde financeira de 0 a 100.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-5">
              <div
                aria-label={`Nexa Score ${intelligence.score.value} de 100`}
                className="relative grid size-28 shrink-0 place-items-center rounded-full"
                role="img"
                style={{
                  background: `conic-gradient(${scoreTone.color} ${intelligence.score.value}%, #27272a 0)`,
                }}
              >
                <div className="absolute inset-[9px] rounded-full bg-zinc-900" />
                <span className={cn("relative text-3xl font-bold", scoreTone.text)}>
                  {intelligence.score.value}
                </span>
              </div>
              <div>
                <p className={cn("text-lg font-bold", scoreTone.text)}>
                  {intelligence.score.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Economia, saldo, controle de gastos e consistência.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(
                [
                  ["Economia", intelligence.score.components.savings, 40],
                  ["Saldo", intelligence.score.components.balance, 20],
                  ["Controle", intelligence.score.components.control, 20],
                  ["Consistência", intelligence.score.components.consistency, 20],
                ] as const
              ).map(([label, value, maximum]) => (
                <div className="rounded-md border border-zinc-800 bg-zinc-950/35 px-2.5 py-2" key={label}>
                  <span className="text-zinc-400">{label}</span>
                  <strong className="float-right text-zinc-200">
                    {value}/{maximum}
                  </strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Previsão de saldo</CardTitle>
                <CardDescription>Projeção baseada nos últimos 30 dias.</CardDescription>
              </div>
              <Badge variant={riskVariant}>{intelligence.forecast.riskLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {intelligence.forecast.periods.map((period) => (
              <div
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/35 px-3 py-3"
                key={period.days}
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-400">
                    Em {period.days} dias
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Mantendo o ritmo atual</p>
                </div>
                <strong className={period.balance >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {currency.format(period.balance)}
                </strong>
              </div>
            ))}
            <p className="text-xs text-zinc-400">
              Ritmo diário estimado:{" "}
              <span className={intelligence.forecast.dailyNet >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {currency.format(intelligence.forecast.dailyNet)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-amber-300" size={17} />
              Insights automáticos
            </CardTitle>
            <CardDescription>O que merece sua atenção agora.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {intelligence.insights.slice(0, 5).map((insight) => (
              <div
                className="flex gap-3 rounded-md border border-zinc-800 bg-zinc-950/35 p-3"
                key={insight.id}
              >
                <InsightIcon type={insight.type} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">{insight.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{insight.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InsightIcon({ type }: { type: InsightType }) {
  const styles: Record<InsightType, string> = {
    info: "bg-sky-400/10 text-sky-300",
    success: "bg-emerald-400/10 text-emerald-300",
    warning: "bg-amber-400/10 text-amber-300",
  };
  const Icon = type === "warning" ? TriangleAlert : type === "success" ? ArrowUpRight : Lightbulb;
  return (
    <div className={cn("grid size-8 shrink-0 place-items-center rounded-md", styles[type] || styles.info)}>
      <Icon size={15} />
    </div>
  );
}
