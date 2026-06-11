const dayMs = 24 * 60 * 60 * 1000;

export interface IntelligenceTransaction {
  amount: number | string | { toString(): string };
  category: string;
  type: string;
  date?: Date | string | null;
  createdAt?: Date | string;
}

interface NormalizedTransaction {
  amount: number;
  category: string;
  type: string;
  date: Date;
}

export type RiskLevel = "low" | "medium" | "high";

export interface Anomaly {
  category: string;
  current: number;
  previousAverage: number;
  percentage: number;
}

export interface Insight {
  id: string;
  type: "info" | "success" | "warning";
  title: string;
  message: string;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function startOfMonth(date: Date, offset = 0) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function totalByType(transactions: NormalizedTransaction[], type: string) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 65) return "Saudável";
  if (score >= 45) return "Em atenção";
  return "Crítico";
}

function riskLabel(risk: RiskLevel) {
  if (risk === "high") return "Alto risco";
  if (risk === "medium") return "Atenção";
  return "Baixo risco";
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

function findAnomalies(expenses: NormalizedTransaction[], now: Date): Anomaly[] {
  const currentWeekStart = startOfWeek(now);
  const previousWindowStart = new Date(currentWeekStart.getTime() - 28 * dayMs);
  const categoryTotals = new Map<string, { current: number; previous: number }>();

  for (const expense of expenses) {
    const date = expense.date;
    if (date < previousWindowStart) continue;
    const totals = categoryTotals.get(expense.category) || { current: 0, previous: 0 };
    if (date >= currentWeekStart) totals.current += expense.amount;
    else totals.previous += expense.amount;
    categoryTotals.set(expense.category, totals);
  }

  return [...categoryTotals.entries()]
    .map(([category, totals]) => {
      const previousWeeklyAverage = totals.previous / 4;
      if (
        totals.current < 100 ||
        previousWeeklyAverage <= 0 ||
        totals.current < previousWeeklyAverage * 1.5
      ) {
        return null;
      }
      return {
        category,
        current: roundMoney(totals.current),
        previousAverage: roundMoney(previousWeeklyAverage),
        percentage: Math.round(
          ((totals.current - previousWeeklyAverage) / previousWeeklyAverage) * 100,
        ),
      };
    })
    .filter((anomaly): anomaly is Anomaly => anomaly !== null)
    .sort((a, b) => b.percentage - a.percentage);
}

export function buildFinancialIntelligence(
  transactions: IntelligenceTransaction[],
  now = new Date(),
) {
  const normalized: NormalizedTransaction[] = transactions.map((transaction) => ({
    category: transaction.category,
    type: transaction.type,
    amount: Number(transaction.amount),
    date: new Date(transaction.date ?? transaction.createdAt ?? now),
  }));
  const income = totalByType(normalized, "income");
  const expense = totalByType(normalized, "expense");
  const currentBalance = income - expense;
  const recentStart = new Date(now.getTime() - 30 * dayMs);
  const recent = normalized.filter((transaction) => transaction.date >= recentStart);
  const recentIncome = totalByType(recent, "income");
  const recentExpense = totalByType(recent, "expense");
  const recentNet = recentIncome - recentExpense;
  const earliestRecent = recent.reduce<Date | null>(
    (earliest, transaction) =>
      !earliest || transaction.date < earliest ? transaction.date : earliest,
    null,
  );
  const observedDays = earliestRecent
    ? clamp(Math.ceil((now.getTime() - earliestRecent.getTime()) / dayMs) + 1, 7, 30)
    : 30;
  const dailyNet = recentNet / observedDays;
  const forecastDays = [7, 15, 30].map((days) => ({
    days,
    balance: roundMoney(currentBalance + dailyNet * days),
  }));
  const risk: RiskLevel =
    forecastDays[0]!.balance < 0 ? "high" : forecastDays[2]!.balance < 0 ? "medium" : "low";

  const savingsRate = recentIncome ? (recentNet / recentIncome) * 100 : 0;
  const savingsPoints = recentIncome ? clamp(Math.round((savingsRate + 10) * 0.8), 0, 40) : 0;
  const balancePoints = currentBalance >= 0 ? 20 : clamp(20 + currentBalance / 100, 0, 20);
  const expenseRatio = recentIncome ? recentExpense / recentIncome : recentExpense ? 2 : 0;
  const controlPoints = recentIncome ? clamp(Math.round((1.2 - expenseRatio) * 25), 0, 20) : 0;
  const monthlyNets = [0, -1, -2].map((offset) => {
    const start = startOfMonth(now, offset);
    const end = startOfMonth(now, offset + 1);
    const month = normalized.filter(
      (transaction) => transaction.date >= start && transaction.date < end,
    );
    return totalByType(month, "income") - totalByType(month, "expense");
  });
  const activeMonths = monthlyNets.filter((net) => net !== 0);
  const consistencyPoints = activeMonths.length
    ? Math.round((activeMonths.filter((net) => net >= 0).length / activeMonths.length) * 20)
    : 0;
  const scoreComponents = normalized.length
    ? {
        savings: savingsPoints,
        balance: Math.round(balancePoints),
        control: controlPoints,
        consistency: consistencyPoints,
      }
    : { savings: 0, balance: 0, control: 0, consistency: 0 };
  const score = clamp(
    Object.values(scoreComponents).reduce((total, value) => total + value, 0),
    0,
    100,
  );

  const expenses = normalized.filter((transaction) => transaction.type === "expense");
  const anomalies = findAnomalies(expenses, now);
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
    return totals;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const insights: Insight[] = [];

  if (!normalized.length) {
    insights.push({
      id: "start",
      type: "info",
      title: "Comece registrando seus movimentos",
      message: "Adicione entradas e saídas para liberar previsões e análises personalizadas.",
    });
  } else {
    insights.push({
      id: "savings",
      type: savingsRate >= 20 ? "success" : savingsRate >= 0 ? "info" : "warning",
      title: savingsRate >= 20 ? "Boa taxa de economia" : "Taxa de economia em atenção",
      message: `Nos últimos 30 dias, sua taxa de economia foi de ${Math.round(savingsRate)}%.`,
    });

    if (topCategory) {
      insights.push({
        id: "top-category",
        type: "info",
        title: "Maior categoria de gastos",
        message: `${categoryLabel(topCategory[0])} concentra R$ ${roundMoney(topCategory[1]).toFixed(2)} das suas despesas.`,
      });
    }

    if (risk !== "low") {
      insights.push({
        id: "negative-risk",
        type: "warning",
        title: riskLabel(risk),
        message: `Mantendo o ritmo atual, seu saldo projetado para 30 dias é R$ ${forecastDays[2]!.balance.toFixed(2)}.`,
      });
    } else {
      insights.push({
        id: "forecast",
        type: "success",
        title: "Projeção positiva",
        message: `Mantendo o ritmo atual, seu saldo projetado para 30 dias é R$ ${forecastDays[2]!.balance.toFixed(2)}.`,
      });
    }

    for (const anomaly of anomalies.slice(0, 2)) {
      insights.push({
        id: `anomaly-${anomaly.category}`,
        type: "warning",
        title: "Gasto fora do padrão",
        message: `${categoryLabel(anomaly.category)} está ${anomaly.percentage}% acima da média semanal recente.`,
      });
    }
  }

  return {
    generatedAt: now.toISOString(),
    score: {
      value: score,
      label: normalized.length ? scoreLabel(score) : "Sem dados",
      components: scoreComponents,
    },
    forecast: {
      currentBalance: roundMoney(currentBalance),
      dailyNet: roundMoney(dailyNet),
      risk,
      riskLabel: riskLabel(risk),
      periods: forecastDays,
    },
    anomalies,
    insights,
  };
}
