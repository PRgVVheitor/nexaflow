export const demoModeKey = "nexaflow-demo-mode";
export const demoStoreKey = "nexaflow-demo-store";
export const demoToken = "demo-local-token";
const demoVersion = "3";
const demoVersionKey = "nexaflow-demo-version";

const demoUser = {
  id: "demo-user",
  name: "Usuário Demo",
  email: "demo@nexaflow.app",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function displayCategory(category) {
  const labels = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

function createDemoStore() {
  const now = new Date();
  const dateWithOffset = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const transactionDate = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const transactionMonth = (monthsAgo, day) => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 12);
    return date.toISOString();
  };
  const historicalTransactions = [
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
  ].flatMap(([monthsAgo, income, expense, category]) => [
    {
      id: `demo-history-income-${monthsAgo}`,
      description: "Renda mensal",
      category: "Renda",
      type: "income",
      amount: income,
      createdAt: transactionMonth(monthsAgo, 5),
    },
    {
      id: `demo-history-expense-${monthsAgo}`,
      description: `Gastos de ${displayCategory(category)}`,
      category,
      type: "expense",
      amount: expense,
      createdAt: transactionMonth(monthsAgo, 18),
    },
  ]);

  return {
    transactions: [
      {
        id: "demo-tx-1",
        description: "Salário",
        category: "Renda",
        type: "income",
        amount: 4200,
        createdAt: transactionDate(4),
      },
      {
        id: "demo-tx-2",
        description: "Projeto freelance",
        category: "Freelance",
        type: "income",
        amount: 950,
        createdAt: transactionDate(8),
      },
      {
        id: "demo-tx-3",
        description: "Aluguel",
        category: "Moradia",
        type: "expense",
        amount: 1350,
        createdAt: transactionDate(3),
      },
      {
        id: "demo-tx-4",
        description: "Mercado",
        category: "Alimentacao",
        type: "expense",
        amount: 620,
        createdAt: transactionDate(2),
      },
      {
        id: "demo-tx-5",
        description: "Assinaturas",
        category: "Servicos",
        type: "expense",
        amount: 189,
        createdAt: transactionDate(12),
      },
      ...historicalTransactions,
    ].map((transaction) => ({
      ...transaction,
      date: transaction.createdAt.slice(0, 10),
    })),
    tasks: [
      {
        id: "demo-task-1",
        title: "Revisar orçamento do mês",
        priority: "alta",
        done: false,
        dueDate: dateWithOffset(0),
      },
      {
        id: "demo-task-2",
        title: "Enviar proposta para cliente",
        priority: "media",
        done: false,
        dueDate: dateWithOffset(2),
      },
      {
        id: "demo-task-3",
        title: "Atualizar portfólio",
        priority: "baixa",
        done: true,
        dueDate: dateWithOffset(-1),
      },
    ],
  };
}

function readDemoStore() {
  try {
    return JSON.parse(localStorage.getItem(demoStoreKey)) || createDemoStore();
  } catch {
    return createDemoStore();
  }
}

function writeDemoStore(store) {
  localStorage.setItem(demoStoreKey, JSON.stringify(store));
}

function buildDemoIntelligence(transactions) {
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
    .reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      return totals;
    }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return {
    score: {
      value: score,
      label: score >= 80 ? "Excelente" : score >= 65 ? "Saudável" : score >= 45 ? "Em atenção" : "Crítico",
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

export function demoApi(path, options = {}) {
  const method = options.method || "GET";
  const store = readDemoStore();
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/api/auth/me") return { user: demoUser };
  if (path === "/api/transactions" && method === "GET") return store.transactions;
  if (path === "/api/finance/intelligence") return buildDemoIntelligence(store.transactions);
  if (path === "/api/tasks" && method === "GET") return store.tasks;

  if (path === "/api/transactions" && method === "POST") {
    const transaction = {
      ...body,
      id: `demo-tx-${Date.now()}`,
      date: body.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    store.transactions.unshift(transaction);
    writeDemoStore(store);
    return transaction;
  }

  if (path === "/api/tasks" && method === "POST") {
    const task = { ...body, id: `demo-task-${Date.now()}`, done: false };
    store.tasks.unshift(task);
    writeDemoStore(store);
    return task;
  }

  const transactionMatch = path.match(/^\/api\/transactions\/(.+)$/);
  if (transactionMatch) {
    const index = store.transactions.findIndex((transaction) => transaction.id === transactionMatch[1]);
    if (index < 0) throw new Error("Transação demonstrativa não encontrada.");
    if (method === "DELETE") {
      store.transactions.splice(index, 1);
      writeDemoStore(store);
      return null;
    }
    if (method === "PATCH") {
      store.transactions[index] = { ...store.transactions[index], ...body };
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
      store.tasks[index] = { ...store.tasks[index], ...body };
      writeDemoStore(store);
      return store.tasks[index];
    }
  }

  throw new Error("Ação não disponível no modo demonstrativo.");
}
