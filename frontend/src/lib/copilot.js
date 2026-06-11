import { currency, displayCategory } from "./format";

export function buildCopilotResponse(question, transactions, totals, intelligence) {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const expenseByCategory = expenses.reduce((result, transaction) => {
    result[transaction.category] = (result[transaction.category] || 0) + transaction.amount;
    return result;
  }, {});
  const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const projectedBalance = intelligence?.forecast?.periods?.find(
    (period) => period.days === 30,
  )?.balance;

  if (normalized.includes("30 dias") || normalized.includes("saldo futuro")) {
    return projectedBalance === undefined
      ? "Ainda não há dados suficientes para projetar seu saldo em 30 dias."
      : `Mantendo seu ritmo atual, a projeção de saldo em 30 dias é ${currency.format(
          projectedBalance,
        )}. O risco financeiro está classificado como ${intelligence.forecast.riskLabel.toLowerCase()}.`;
  }

  if (
    normalized.includes("gastei mais") ||
    normalized.includes("maior gasto") ||
    normalized.includes("categoria")
  ) {
    return topCategory
      ? `${displayCategory(topCategory[0])} é sua maior categoria de gastos no período, com ${currency.format(
          topCategory[1],
        )}. Ela representa ${totals.expense ? Math.round((topCategory[1] / totals.expense) * 100) : 0}% das saídas.`
      : "Ainda não há saídas registradas neste período para eu comparar.";
  }

  if (normalized.includes("fim de semana") || normalized.includes("posso gastar")) {
    const prudentAmount = Math.max(0, totals.balance * 0.15);
    return totals.balance > 0
      ? `Uma referência prudente seria limitar os gastos a ${currency.format(
          prudentAmount,
        )}, cerca de 15% do saldo disponível de ${currency.format(totals.balance)}.`
      : "Seu saldo disponível não está positivo neste período. Eu evitaria criar novos gastos agora.";
  }

  if (normalized.includes("score") || normalized.includes("saude financeira")) {
    return intelligence?.score
      ? `Seu Nexa Score é ${intelligence.score.value} de 100, classificado como ${intelligence.score.label}. Ele considera economia, saldo, controle de gastos e consistência.`
      : "Ainda não há dados suficientes para calcular seu Nexa Score.";
  }

  if (normalized.includes("econom")) {
    return `Sua taxa de economia no período está em ${totals.savingsRate}%. O saldo atual é ${currency.format(
      totals.balance,
    )}.`;
  }

  return `No período analisado, você possui ${currency.format(totals.income)} em entradas, ${currency.format(
    totals.expense,
  )} em saídas e saldo de ${currency.format(
    totals.balance,
  )}. Você também pode perguntar sobre maior gasto, Nexa Score ou saldo em 30 dias.`;
}
