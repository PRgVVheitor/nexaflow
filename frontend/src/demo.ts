import type { ApiUser, Goal, Intelligence, RecurringTransaction, Task, Transaction } from "./lib/types";

export const demoModeKey = "nexaflow-demo-mode";
export const demoStoreKey = "nexaflow-demo-store";
export const demoToken = "demo-local-token";
const demoVersion = "5";
const demoVersionKey = "nexaflow-demo-version";

interface DemoRecurring extends RecurringTransaction {
  lastRunMonth: string | null;
  createdAt: string;
}

interface DemoStore {
  transactions: Transaction[];
  tasks: Task[];
  goals: Goal[];
  recurring: DemoRecurring[];
}

const demoUser: ApiUser = {
  id: "demo-user",
  name: "Usuário Demo",
  email: "demo@nexaflow.app",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function displayCategory(category: string) {
  const labels: Record<string, string> = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

function createDemoStore(): DemoStore {
  const now = new Date();
  const dateWithOffset = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const transactionDate = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const transactionMonth = (monthsAgo: number, day: number) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 12);
    return date.toISOString();
  };
  const historicalEntries: Array<[number, number, number, string]> = [
    [1, 4700, 2380, "Moradia"],
    [2, 4450, 2760, "Alimentacao"],
    [3, 5100, 2490, "Servicos"],
    [4, 4300, 2910, "Transporte"],
    [5, 4800, 2210, "Moradia"],
    [6, 4200, 2630, "Alimentacao"],
    [7, 4550, 2850, "Lazer"],
    [8, 4400, 2310, "Servicos"],
    [9, 4950, 3020, "Moradia"],
    [10, 4100, 2580, "Transporte"],
    [11, 4650, 2440, "Alimentacao"],
  ];
  const historicalTransactions = historicalEntries.flatMap(
    ([monthsAgo, income, expense, category]) => [
      {
        id: `demo-history-income-${monthsAgo}`,
        description: "Renda mensal",
        category: "Renda",
        type: "income" as const,
        amount: income,
        createdAt: transactionMonth(monthsAgo, 5),
      },
      {
        id: `demo-history-expense-${monthsAgo}`,
        description: `Gastos de ${displayCategory(category)}`,
        category,
        type: "expense" as const,
        amount: expense,
        createdAt: transactionMonth(monthsAgo, 18),
      },
    ],
  );

  return {
    transactions: [
      {
        id: "demo-tx-1",
        description: "Salário",
        category: "Renda",
        type: "income" as const,
        amount: 4200,
        createdAt: transactionDate(4),
      },
      {
        id: "demo-tx-2",
        description: "Projeto freelance",
        category: "Freelance",
        type: "income" as const,
        amount: 950,
        createdAt: transactionDate(8),
      },
      {
        id: "demo-tx-3",
        description: "Aluguel",
        category: "Moradia",
        type: "expense" as const,
        amount: 1350,
        createdAt: transactionDate(3),
      },
      {
        id: "demo-tx-4",
        description: "Mercado",
        category: "Alimentacao",
        type: "expense" as const,
        amount: 620,
        createdAt: transactionDate(2),
      },
      {
        id: "demo-tx-5",
        description: "Assinaturas",
        category: "Servicos",
        type: "expense" as const,
        amount: 189,
        createdAt: transactionDate(12),
      },
      ...historicalTransactions,
    ].map((transaction) => ({
      ...transaction,
      date: transaction.createdAt.slice(0, 10),
    })),
    recurring: [
      {
        id: "demo-rec-1",
        description: "Assinatura de streaming",
        category: "Lazer",
        type: "expense" as const,
        amount: 39.9,
        dayOfMonth: 8,
        active: true,
        lastRunMonth: null,
        createdAt: now.toISOString(),
      },
    ],
    goals: [
      { id: "demo-goal-1", category: "Alimentacao", monthlyLimit: 800 },
      { id: "demo-goal-2", category: "Moradia", monthlyLimit: 1500 },
      { id: "demo-goal-3", category: "Lazer", monthlyLimit: 400 },
    ],
    tasks: [
      {
        id: "demo-task-1",
        title: "Revisar orçamento do mês",
        priority: "alta" as const,
        done: false,
        dueDate: dateWithOffset(0),
      },
      {
        id: "demo-task-2",
        title: "Enviar proposta para cliente",
        priority: "media" as const,
        done: false,
        dueDate: dateWithOffset(2),
      },
      {
        id: "demo-task-3",
        title: "Atualizar portfólio",
        priority: "baixa" as const,
        done: true,
        dueDate: dateWithOffset(-1),
      },
    ],
  };
}

function readDemoStore(): DemoStore {
  try {
    return (JSON.parse(localStorage.getItem(demoStoreKey) || "null") as DemoStore) || createDemoStore();
  } catch {
    return createDemoStore();
  }
}

function writeDemoStore(store: DemoStore) {
  localStorage.setItem(demoStoreKey, JSON.stringify(store));
}

function buildDemoIntelligence(transactions: Transaction[]): Intelligence {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const balance = income - expense;
  const dailyNet = balance / 30;
  const savingsRate = income ? Math.round((balance / income) * 100) : 0;
  const score = transactions.length
    ? Math.max(0, Math.min(100, Math.round(45 + savingsRate * 0.7)))
    : 0;
  const categoryTotals = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      return totals;
    }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return {
    score: {
      value: score,
      label:
        score >= 80 ? "Excelente" : score >= 65 ? "Saudável" : score >= 45 ? "Em atenção" : "Crítico",
      components: {
        savings: Math.min(40, Math.max(0, Math.round(savingsRate * 0.8))),
        balance: balance >= 0 ? 20 : 0,
        control: expense <= income ? 20 : 0,
        consistency: transactions.length ? 15 : 0,
      },
    },
    forecast: {
      currentBalance: balance,
      dailyNet,
      risk: balance + dailyNet * 30 < 0 ? "high" : "low",
      riskLabel: balance + dailyNet * 30 < 0 ? "Alto risco" : "Baixo risco",
      periods: [7, 15, 30].map((days) => ({
        days,
        balance: Math.round((balance + dailyNet * days) * 100) / 100,
      })),
    },
    anomalies: [],
    insights: transactions.length
      ? [
          {
            id: "demo-savings",
            type: savingsRate >= 20 ? "success" : "warning",
            title: savingsRate >= 20 ? "Boa taxa de economia" : "Economia em atenção",
            message: `Sua taxa de economia demonstrativa está em ${savingsRate}%.`,
          },
          {
            id: "demo-category",
            type: "info",
            title: "Maior categoria de gastos",
            message: topCategory
              ? `${displayCategory(topCategory[0])} concentra ${currency.format(topCategory[1])} das despesas.`
              : "Adicione despesas para descobrir seus padrões.",
          },
          {
            id: "demo-forecast",
            type: "success",
            title: "Projeção de saldo",
            message: `Mantendo o ritmo atual, o saldo em 30 dias será ${currency.format(balance + dailyNet * 30)}.`,
          },
        ]
      : [
          {
            id: "demo-start",
            type: "info",
            title: "Comece registrando seus movimentos",
            message: "Adicione entradas e saídas para liberar previsões.",
          },
        ],
  };
}

export function activateDemoMode() {
  localStorage.setItem(demoModeKey, "true");
  localStorage.setItem("nexaflow-token", demoToken);
  if (localStorage.getItem(demoVersionKey) !== demoVersion) {
    writeDemoStore(createDemoStore());
    localStorage.setItem(demoVersionKey, demoVersion);
  }
  return { token: demoToken, user: demoUser };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseMonthKey(key: string): [number, number] {
  const [year, month] = key.split("-").map(Number);
  return [year!, month!];
}

function nextMonthKey(key: string) {
  const [year, month] = parseMonthKey(key);
  return month === 12 ? `${year + 1}-01` : `${year}-${pad2(month + 1)}`;
}

function materializeDemoRecurring(store: DemoStore) {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  let changed = false;

  for (const recurrence of store.recurring) {
    if (!recurrence.active) continue;
    const createdAt = new Date(recurrence.createdAt);
    let cursor = recurrence.lastRunMonth
      ? nextMonthKey(recurrence.lastRunMonth)
      : `${createdAt.getFullYear()}-${pad2(createdAt.getMonth() + 1)}`;

    while (cursor <= currentKey) {
      const [year, month] = parseMonthKey(cursor);
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(recurrence.dayOfMonth, lastDay);
      const due = new Date(year, month - 1, day);
      if (due > now) break;

      store.transactions.unshift({
        id: `demo-tx-rec-${recurrence.id}-${cursor}`,
        description: recurrence.description,
        category: recurrence.category,
        type: recurrence.type,
        amount: recurrence.amount,
        date: `${cursor}-${pad2(day)}`,
        createdAt: new Date().toISOString(),
      });
      recurrence.lastRunMonth = cursor;
      cursor = nextMonthKey(cursor);
      changed = true;
    }
  }

  if (changed) writeDemoStore(store);
}

export function demoApi(path: string, options: RequestInit = {}): unknown {
  const method = options.method || "GET";
  const store = readDemoStore();
  const body = options.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};

  if (path === "/api/auth/me") return { user: demoUser };
  if (path === "/api/transactions" && method === "GET") {
    materializeDemoRecurring(store);
    return store.transactions;
  }
  if (path === "/api/recurring" && method === "GET") return store.recurring;

  if (path === "/api/recurring" && method === "POST") {
    const recurrence: DemoRecurring = {
      id: `demo-rec-${Date.now()}`,
      description: String(body.description),
      category: String(body.category),
      type: body.type as Transaction["type"],
      amount: Number(body.amount),
      dayOfMonth: Number(body.dayOfMonth),
      active: true,
      lastRunMonth: null,
      createdAt: new Date().toISOString(),
    };
    store.recurring.unshift(recurrence);
    materializeDemoRecurring(store);
    writeDemoStore(store);
    return recurrence;
  }

  const recurringMatch = path.match(/^\/api\/recurring\/(.+)$/);
  if (recurringMatch) {
    const index = store.recurring.findIndex((item) => item.id === recurringMatch[1]);
    if (index < 0) throw new Error("Recorrência demonstrativa não encontrada.");
    if (method === "DELETE") {
      store.recurring.splice(index, 1);
      writeDemoStore(store);
      return null;
    }
    if (method === "PATCH") {
      store.recurring[index] = { ...store.recurring[index]!, ...body };
      writeDemoStore(store);
      return store.recurring[index];
    }
  }
  if (path === "/api/finance/intelligence") return buildDemoIntelligence(store.transactions);
  if (path === "/api/tasks" && method === "GET") return store.tasks;
  if (path === "/api/goals" && method === "GET") return store.goals;

  if (path === "/api/goals" && method === "POST") {
    const category = String(body.category);
    const monthlyLimit = Number(body.monthlyLimit);
    const existing = store.goals.find((goal) => goal.category === category);
    if (existing) {
      existing.monthlyLimit = monthlyLimit;
      writeDemoStore(store);
      return existing;
    }
    const goal: Goal = { id: `demo-goal-${Date.now()}`, category, monthlyLimit };
    store.goals.push(goal);
    writeDemoStore(store);
    return goal;
  }

  const goalMatch = path.match(/^\/api\/goals\/(.+)$/);
  if (goalMatch && method === "DELETE") {
    const index = store.goals.findIndex((goal) => goal.id === goalMatch[1]);
    if (index < 0) throw new Error("Meta demonstrativa não encontrada.");
    store.goals.splice(index, 1);
    writeDemoStore(store);
    return null;
  }

  if (path === "/api/transactions" && method === "POST") {
    const transaction = {
      ...(body as unknown as Omit<Transaction, "id" | "date" | "createdAt">),
      id: `demo-tx-${Date.now()}`,
      date: (body.date as string) || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    store.transactions.unshift(transaction);
    writeDemoStore(store);
    return transaction;
  }

  if (path === "/api/tasks" && method === "POST") {
    const task = {
      ...(body as unknown as Omit<Task, "id" | "done">),
      id: `demo-task-${Date.now()}`,
      done: false,
    };
    store.tasks.unshift(task);
    writeDemoStore(store);
    return task;
  }

  const transactionMatch = path.match(/^\/api\/transactions\/(.+)$/);
  if (transactionMatch) {
    const index = store.transactions.findIndex(
      (transaction) => transaction.id === transactionMatch[1],
    );
    if (index < 0) throw new Error("Transação demonstrativa não encontrada.");
    if (method === "DELETE") {
      store.transactions.splice(index, 1);
      writeDemoStore(store);
      return null;
    }
    if (method === "PATCH") {
      store.transactions[index] = { ...store.transactions[index]!, ...body };
      writeDemoStore(store);
      return store.transactions[index];
    }
  }

  const taskMatch = path.match(/^\/api\/tasks\/(.+)$/);
  if (taskMatch) {
    const index = store.tasks.findIndex((task) => task.id === taskMatch[1]);
    if (index < 0) throw new Error("Tarefa demonstrativa não encontrada.");
    if (method === "DELETE") {
      store.tasks.splice(index, 1);
      writeDemoStore(store);
      return null;
    }
    if (method === "PATCH") {
      store.tasks[index] = { ...store.tasks[index]!, ...body };
      writeDemoStore(store);
      return store.tasks[index];
    }
  }

  throw new Error("Ação não disponível no modo demonstrativo.");
}
