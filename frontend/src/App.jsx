import { AnimatePresence, motion } from "framer-motion";
import {
  differenceInCalendarDays,
  format,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Eye,
  EyeOff,
  GitCompareArrows,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  WalletCards,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui";
import { cn } from "./lib/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
const tokenKey = "nexaflow-token";
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const shortMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});
const longMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const tabs = [
  { id: "finance", label: "Financas", icon: DollarSign },
  { id: "tasks", label: "Taskly", icon: ClipboardList },
];

const chartColors = ["#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa"];
const transactionCategories = {
  expense: [
    "Alimentacao",
    "Moradia",
    "Transporte",
    "Saude",
    "Educacao",
    "Lazer",
    "Servicos",
    "Outros",
  ],
  income: ["Renda", "Freelance", "Investimentos", "Outros"],
};

async function api(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro na API." }));
    throw new Error(error.message || "Erro na API.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function App() {
  const [activeTab, setActiveTab] = useState("finance");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
      setAuthLoading(false);
      return;
    }

    api("/api/auth/me")
      .then((response) => setUser(response.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setAuthLoading(false));
  }, []);

  function authenticate(response) {
    localStorage.setItem(tokenKey, response.token);
    setUser(response.user);
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
    setActiveTab("finance");
  }

  if (authLoading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={authenticate} />;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-5 border-b border-zinc-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-zinc-50">NexaFlow</p>
            <p className="truncate text-sm text-zinc-500">
              Financas e produtividade conectadas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav
            aria-label="Navegacao principal"
            className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  className="relative min-w-0 px-3"
                  key={tab.id}
                  title={tab.label}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-zinc-700/80"
                      layoutId="active-tab"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon className="relative" size={17} />
                  <span className="relative hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center justify-between gap-3 border-l-0 border-zinc-800 sm:border-l sm:pl-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{user.name}</p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <Button aria-label="Sair" size="icon" title="Sair" type="button" variant="ghost" onClick={logout}>
              <LogOut size={17} />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          initial={{ opacity: 0, y: 12 }}
          key={activeTab}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "finance" && <FinanceDashboard />}
          {activeTab === "tasks" && <TasksApp />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          isRegister ? form : { email: form.email, password: form.password },
        ),
      });
      onAuthenticated(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function useDemo() {
    setLoading(true);
    setError("");

    try {
      const response = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "demo@nexaflow.app", password: "demo1234" }),
      });
      onAuthenticated(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/30 lg:grid-cols-[minmax(0,1fr)_420px]"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35 }}
      >
        <section className="flex flex-col justify-between border-b border-zinc-800 p-6 sm:p-9 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
              <Sparkles size={21} />
            </div>
            <p className="mt-5 text-xl font-bold text-zinc-50">NexaFlow</p>
            <h1 className="mt-8 max-w-xl text-3xl font-bold leading-tight text-zinc-50 sm:text-5xl">
              Sua rotina organizada em um unico fluxo.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Acompanhe suas financas e tarefas em um ambiente privado, conectado e
              preparado para organizar seu dia.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Financas pessoais", "Transacoes e graficos protegidos por conta."],
              ["Taskly", "Tarefas e prioridades sincronizadas."],
              ["Sessao segura", "Senhas protegidas e acesso autenticado."],
            ].map(([title, description]) => (
              <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3" key={title}>
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-9">
          <div className="mb-7">
            <p className="text-sm font-semibold text-emerald-300">
              {isRegister ? "Nova conta" : "Bem-vindo de volta"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-50">
              {isRegister ? "Crie seu acesso" : "Entre no NexaFlow"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isRegister
                ? "Seus dados ficarao separados e protegidos."
                : "Continue de onde parou em poucos segundos."}
            </p>
          </div>

          <form className="grid gap-3" onSubmit={submit}>
            {isRegister && (
              <Input
                autoComplete="name"
                placeholder="Seu nome"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            )}
            <Input
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <div className="relative">
              <Input
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="pr-11"
                minLength={8}
                placeholder="Senha"
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <Button
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-0 top-0"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </Button>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button disabled={loading} type="submit">
              {loading ? (
                <Loader2 className="animate-spin" size={17} />
              ) : isRegister ? (
                <UserPlus size={17} />
              ) : (
                <LogIn size={17} />
              )}
              {isRegister ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 grid gap-2">
            <Button disabled={loading} type="button" variant="secondary" onClick={useDemo}>
              Usar conta demonstrativa
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
              }}
            >
              {isRegister ? "Ja tenho uma conta" : "Criar uma nova conta"}
            </Button>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

function FullPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center">
      <LoadingLabel />
    </main>
  );
}

function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [chartMode, setChartMode] = useState("evolution");
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));
  const [comparisonMonth, setComparisonMonth] = useState(() =>
    shiftMonth(monthKey(new Date()), -1),
  );
  const [form, setForm] = useState({
    description: "",
    category: "",
    amount: "",
    type: "expense",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    setLoading(true);
    setError("");
    try {
      setTransactions(await api("/api/transactions"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.category))].sort(),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesCategory =
        categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [transactions, categoryFilter, search]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((total, item) => total + item.amount, 0);
    const expense = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((total, item) => total + item.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      savingsRate: income ? Math.round(((income - expense) / income) * 100) : 0,
    };
  }, [filteredTransactions]);

  const expenseByCategory = useMemo(() => {
    const grouped = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((result, item) => {
        result[item.category] = (result[item.category] || 0) + item.amount;
        return result;
      }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    const endMonth = monthKey(new Date());
    const months = Array.from({ length: 6 }, (_, index) =>
      shiftMonth(endMonth, index - 5),
    );
    const grouped = Object.fromEntries(
      months.map((key) => [
        key,
        {
          expense: 0,
          income: 0,
          key,
          label: formatMonth(key, shortMonth),
          fullLabel: formatMonth(key, longMonth),
        },
      ]),
    );

    filteredTransactions.forEach((item) => {
      const key = monthKey(item.createdAt ? new Date(item.createdAt) : new Date());
      if (!grouped[key]) return;
      grouped[key][item.type === "income" ? "income" : "expense"] += item.amount;
    });

    let balance = 0;
    return months.map((key) => {
      const month = grouped[key];
      const net = month.income - month.expense;
      balance += net;
      return { ...month, balance, net };
    });
  }, [filteredTransactions]);

  useEffect(() => {
    if (selectedMonth === comparisonMonth) {
      const alternative = monthlyData.find((item) => item.key !== selectedMonth);
      if (alternative) setComparisonMonth(alternative.key);
    }
  }, [comparisonMonth, monthlyData, selectedMonth]);

  const selectedMonthData =
    monthlyData.find((item) => item.key === selectedMonth) || monthlyData.at(-1);
  const comparisonMonthData =
    monthlyData.find((item) => item.key === comparisonMonth) || monthlyData.at(-2);
  const comparisonData = [
    {
      name: selectedMonthData.label,
      Entradas: selectedMonthData.income,
      Saidas: selectedMonthData.expense,
      Saldo: selectedMonthData.net,
    },
    {
      name: comparisonMonthData.label,
      Entradas: comparisonMonthData.income,
      Saidas: comparisonMonthData.expense,
      Saldo: comparisonMonthData.net,
    },
  ];
  const comparisonDelta = selectedMonthData.net - comparisonMonthData.net;
  const hasFinancialActivity = filteredTransactions.length > 0;

  async function createTransaction(event) {
    event.preventDefault();
    const created = await api("/api/transactions", {
      method: "POST",
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setTransactions((current) => [created, ...current]);
    setForm({ description: "", category: "", amount: "", type: "expense" });
  }

  async function deleteTransaction(id) {
    await api(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  const metrics = [
    {
      title: "Saldo atual",
      value: currency.format(totals.balance),
      detail: "Disponivel no periodo",
      icon: WalletCards,
      tone: "emerald",
    },
    {
      title: "Entradas",
      value: currency.format(totals.income),
      detail: `${filteredTransactions.filter((item) => item.type === "income").length} lancamentos`,
      icon: ArrowUpRight,
      tone: "sky",
    },
    {
      title: "Saidas",
      value: currency.format(totals.expense),
      detail: `${filteredTransactions.filter((item) => item.type === "expense").length} lancamentos`,
      icon: ArrowDownRight,
      tone: "rose",
    },
    {
      title: "Taxa de economia",
      value: `${totals.savingsRate}%`,
      detail: "Do total de entradas",
      icon: Target,
      tone: "amber",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeading
        description="Acompanhe o fluxo financeiro, compare entradas e saidas e entenda para onde seu dinheiro esta indo."
        eyebrow="Painel financeiro"
        title="Visao geral"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:sticky xl:top-2 xl:z-20 xl:grid-cols-4 xl:rounded-lg xl:bg-zinc-950/90 xl:py-2 xl:backdrop-blur">
        {loading
          ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)
          : metrics.map((metric, index) => (
              <MetricCard index={index} key={metric.title} {...metric} />
            ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          description="Comparativo consolidado do periodo"
          title="Entradas x saidas"
        >
          {loading ? (
            <ChartSkeleton />
          ) : hasFinancialActivity ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={[
                { name: "Entradas", valor: totals.income },
                { name: "Saidas", valor: totals.expense },
              ]}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="name" tickLine={false} />
              <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a", opacity: 0.45 }}
                formatter={(value) => currency.format(value)}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                <Cell fill="#34d399" />
                <Cell fill="#fb7185" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <EmptyState text="Adicione transacoes para visualizar entradas e saidas." />
          )}
        </ChartCard>

        <ChartCard
          description="Distribuicao das despesas por categoria"
          title="Gastos por categoria"
        >
          {loading ? (
            <ChartSkeleton variant="donut" />
          ) : expenseByCategory.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  innerRadius={62}
                  nameKey="name"
                  outerRadius={98}
                  paddingAngle={3}
                >
                  {expenseByCategory.map((item, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => currency.format(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Adicione uma saida para visualizar o grafico." />
          )}
        </ChartCard>
      </div>

      <ChartCard
        actions={
          <div className="grid gap-2 sm:min-w-[430px]">
            <div
              aria-label="Modo do grafico financeiro"
              className="grid grid-cols-2 rounded-md border border-zinc-800 bg-zinc-950/60 p-1"
              role="group"
            >
              <Button
                className="min-h-8 h-8"
                size="sm"
                type="button"
                variant={chartMode === "evolution" ? "secondary" : "ghost"}
                onClick={() => setChartMode("evolution")}
              >
                <CalendarDays size={15} />
                Evolucao
              </Button>
              <Button
                className="min-h-8 h-8"
                size="sm"
                type="button"
                variant={chartMode === "comparison" ? "secondary" : "ghost"}
                onClick={() => setChartMode("comparison")}
              >
                <GitCompareArrows size={15} />
                Comparar meses
              </Button>
            </div>

            <div className={cn("grid gap-2", chartMode === "comparison" && "grid-cols-2")}>
              <Select
                aria-label="Mes principal"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {monthlyData
                  .slice()
                  .reverse()
                  .map((month) => (
                    <option key={month.key} value={month.key}>
                      {capitalize(month.fullLabel)}
                    </option>
                  ))}
              </Select>
              {chartMode === "comparison" && (
                <Select
                  aria-label="Mes para comparar"
                  value={comparisonMonth}
                  onChange={(event) => setComparisonMonth(event.target.value)}
                >
                  {monthlyData
                    .slice()
                    .reverse()
                    .map((month) => (
                      <option
                        disabled={month.key === selectedMonth}
                        key={month.key}
                        value={month.key}
                      >
                        {capitalize(month.fullLabel)}
                      </option>
                    ))}
                </Select>
              )}
            </div>
          </div>
        }
        contentClassName="h-80"
        description={
          chartMode === "evolution"
            ? "Passe o mouse para ver os detalhes e clique em um ponto para selecionar o mes."
            : "Compare entradas, saidas e saldo entre dois meses."
        }
        title={chartMode === "evolution" ? "Evolucao mensal do saldo" : "Comparacao mensal"}
      >
        {loading ? (
          <ChartSkeleton />
        ) : !hasFinancialActivity ? (
          <EmptyState text="Adicione transacoes para visualizar sua evolucao mensal." />
        ) : chartMode === "evolution" ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="h-full"
              initial={{ opacity: 0 }}
              key="evolution"
            >
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tickLine={false} />
                  <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
                  <Tooltip content={<MonthlyTooltip />} cursor={{ stroke: "#3f3f46" }} />
                  <Line
                    activeDot={{ fill: "#6ee7b7", r: 6, stroke: "#09090b", strokeWidth: 3 }}
                    dataKey="balance"
                    dot={(props) => (
                      <MonthDot
                        {...props}
                        onSelect={setSelectedMonth}
                        selected={props.payload.key === selectedMonth}
                      />
                    )}
                    name="Saldo acumulado"
                    stroke="#34d399"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col gap-3"
              initial={{ opacity: 0, y: 6 }}
              key="comparison"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-sm">
                <span className="text-zinc-400">
                  Diferenca de saldo entre os meses
                </span>
                <strong className={comparisonDelta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {comparisonDelta >= 0 ? "+" : ""}
                  {currency.format(comparisonDelta)}
                </strong>
              </div>
              <div className="min-h-0 flex-1">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                    <XAxis axisLine={false} dataKey="name" tickLine={false} />
                    <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
                    <Tooltip
                      content={<ComparisonTooltip />}
                      cursor={{ fill: "#27272a", opacity: 0.35 }}
                    />
                    <Bar dataKey="Entradas" fill="#34d399" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="Saidas" fill="#fb7185" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="Saldo" fill="#60a5fa" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
        )}
      </ChartCard>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <Card>
          <CardHeader className="gap-4 border-b border-zinc-800">
            <div>
              <CardTitle>Transacoes recentes</CardTitle>
              <CardDescription>Dados sincronizados com a API Node.</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />
                <Input
                  aria-label="Buscar transacao"
                  className="pl-9"
                  placeholder="Buscar transacao"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select
                aria-label="Filtrar categoria"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && <TableSkeleton />}
            {error && <p className="p-5 text-sm text-red-300">{error}</p>}
            {!loading && !filteredTransactions.length && !error && (
              <div className="p-5">
                <EmptyState text="Nenhuma transacao encontrada para os filtros selecionados." />
              </div>
            )}
            {!loading && filteredTransactions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-zinc-100">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "income" ? "success" : "danger"}>
                          {transaction.type === "income" ? "Entrada" : "Saida"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          transaction.type === "income"
                            ? "text-emerald-300"
                            : "text-red-300",
                        )}
                      >
                        {currency.format(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-label="Remover transacao"
                          size="icon"
                          type="button"
                          variant="destructive"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TransactionForm form={form} setForm={setForm} onSubmit={createTransaction} />
      </div>
    </div>
  );
}

function TransactionForm({ form, onSubmit, setForm }) {
  const categories = transactionCategories[form.type];

  function selectType(type) {
    setForm({
      ...form,
      category: transactionCategories[type].includes(form.category) ? form.category : "",
      type,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova transacao</CardTitle>
        <CardDescription>Registre uma entrada ou saida no painel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Input
            aria-label="Descricao"
            placeholder="Descricao"
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <Select
            aria-label="Categoria"
            required
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option disabled value="">
              Selecione uma categoria
            </option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Valor"
            min="0.01"
            placeholder="Valor"
            required
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
          />
          <div
            aria-label="Tipo da transacao"
            className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1"
            role="group"
          >
            <Button
              aria-pressed={form.type === "expense"}
              className={cn(form.type === "expense" && "bg-rose-400/15 text-rose-300")}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => selectType("expense")}
            >
              <ArrowDownRight size={16} />
              Saida
            </Button>
            <Button
              aria-pressed={form.type === "income"}
              className={cn(form.type === "income" && "bg-emerald-400/15 text-emerald-300")}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => selectType("income")}
            >
              <ArrowUpRight size={16} />
              Entrada
            </Button>
          </div>
          <Button type="submit">
            <Plus size={17} />
            Adicionar transacao
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("media");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    setLoading(true);
    setTasks(await api("/api/tasks"));
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const visibleTasks = tasks.filter((task) => {
    const matchesStatus =
      filter === "pending" ? !task.done : filter === "done" ? task.done : true;
    const matchesDeadline = taskMatchesDeadline(task, deadlineFilter);
    return matchesStatus && matchesDeadline;
  });

  const counters = {
    total: tasks.length,
    pending: tasks.filter((task) => !task.done).length,
    done: tasks.filter((task) => task.done).length,
  };

  async function createTask(event) {
    event.preventDefault();
    const created = await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, priority, dueDate: dueDate || null }),
    });
    setTasks((current) => [created, ...current]);
    setTitle("");
    setPriority("media");
    setDueDate("");
  }

  async function toggleTask(task) {
    const updated = await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !task.done }),
    });
    setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function deleteTask(id) {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-5">
      <PageHeading
        description="Capture tarefas, defina prazos e acompanhe o que precisa de atencao."
        eyebrow="Organizador de tarefas"
        title="Taskly"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => <TaskStatSkeleton key={index} />)
        ) : (
          <>
            <TaskStatCard
              detail="Progresso geral"
              index={0}
              progress={counters.total ? (counters.done / counters.total) * 100 : 0}
              title="Total"
              tone="sky"
              value={counters.total}
            />
            <TaskStatCard
              detail="Aguardando acao"
              index={1}
              progress={counters.total ? (counters.pending / counters.total) * 100 : 0}
              title="Pendentes"
              tone="amber"
              value={counters.pending}
            />
            <TaskStatCard
              detail="Progresso registrado"
              index={2}
              progress={counters.total ? (counters.done / counters.total) * 100 : 0}
              title="Concluidas"
              tone="emerald"
              value={counters.done}
            />
          </>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Nova tarefa</CardTitle>
            <CardDescription>Adicione o proximo item da sua rotina.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={createTask}>
              <Input
                placeholder="Titulo da tarefa"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="alta">Prioridade alta</option>
                <option value="media">Prioridade media</option>
                <option value="baixa">Prioridade baixa</option>
              </Select>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-400">
                Prazo opcional
                <Input
                  aria-label="Prazo da tarefa"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
              <Button type="submit">
                <Plus size={17} />
                Adicionar tarefa
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 border-b border-zinc-800 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Minhas tarefas</CardTitle>
              <CardDescription>{visibleTasks.length} itens neste filtro</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-1">
                {[
                  ["all", "Todas"],
                  ["pending", "Pendentes"],
                  ["done", "Concluidas"],
                ].map(([id, label]) => (
                  <Button
                    className={cn(filter === id && "bg-zinc-700 text-zinc-50")}
                    key={id}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Select
                aria-label="Filtrar por prazo"
                className="w-full sm:w-44"
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value)}
              >
                <option value="all">Todos os prazos</option>
                <option value="overdue">Atrasadas</option>
                <option value="today">Vencem hoje</option>
                <option value="upcoming">Proximas</option>
                <option value="none">Sem prazo</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading && <TaskListSkeleton />}
            {!loading && !visibleTasks.length && (
              <EmptyState text="Nenhuma tarefa encontrada neste filtro." />
            )}
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleTasks.map((task) => (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3",
                      task.done && "opacity-60",
                    )}
                    exit={{ opacity: 0, x: 20 }}
                    initial={{ opacity: 0, y: 8 }}
                    key={task.id}
                    layout
                  >
                    <Button
                      aria-label="Alternar tarefa"
                      className={cn(task.done && "bg-emerald-400 text-zinc-950")}
                      size="icon"
                      type="button"
                      variant="secondary"
                      onClick={() => toggleTask(task)}
                    >
                      <CheckCircle2 size={17} />
                    </Button>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold text-zinc-100",
                          task.done && "text-zinc-500 line-through",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                        <TaskDeadlineBadge task={task} />
                      </div>
                    </div>
                    <Button
                      aria-label="Remover tarefa"
                      size="icon"
                      type="button"
                      variant="destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TaskDeadlineBadge({ task }) {
  const deadline = taskDeadline(task);

  return (
    <Badge className="gap-1 normal-case" variant={deadline.variant}>
      <CalendarDays size={12} />
      {deadline.label}
    </Badge>
  );
}

function PageHeading({ description, eyebrow, title }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase text-emerald-300">{eyebrow}</p>
      <h1 className="text-3xl font-bold text-zinc-50 sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

function MetricCard({ detail, icon: Icon, index, title, tone, value }) {
  const tones = {
    emerald: "bg-emerald-400/10 text-emerald-300",
    sky: "bg-sky-400/10 text-sky-300",
    rose: "bg-rose-400/10 text-rose-300",
    amber: "bg-amber-400/10 text-amber-300",
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className="mt-2 truncate text-2xl font-bold text-zinc-50">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{detail}</p>
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon size={19} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TaskStatCard({ detail, index, progress, title, tone, value }) {
  const tones = {
    amber: { color: "#fbbf24", text: "text-amber-300" },
    emerald: { color: "#34d399", text: "text-emerald-300" },
    sky: { color: "#60a5fa", text: "text-sky-300" },
  };
  const selectedTone = tones[tone];
  const roundedProgress = Math.round(progress);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <p className={cn("mt-1 text-4xl font-bold", selectedTone.text)}>{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{detail}</p>
          </div>
          <div
            aria-label={`${roundedProgress}% ${title.toLowerCase()}`}
            className="relative grid size-16 shrink-0 place-items-center rounded-full"
            role="img"
            style={{
              background: `conic-gradient(${selectedTone.color} ${roundedProgress}%, #27272a 0)`,
            }}
          >
            <div className="absolute inset-[6px] rounded-full bg-zinc-900" />
            <span className="relative text-xs font-bold text-zinc-200">{roundedProgress}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ChartCard({ actions, children, contentClassName, description, title }) {
  return (
    <Card>
      <CardHeader className={cn(actions && "gap-4 lg:flex-row lg:items-end lg:justify-between")}>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent className={cn("h-72", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

function MonthDot({ cx, cy, onSelect, payload, selected }) {
  return (
    <circle
      aria-label={`Selecionar ${payload.fullLabel}`}
      className="cursor-pointer"
      cx={cx}
      cy={cy}
      fill={selected ? "#a7f3d0" : "#34d399"}
      r={selected ? 6 : 4}
      role="button"
      stroke="#09090b"
      strokeWidth={selected ? 3 : 2}
      tabIndex={0}
      onClick={() => onSelect(payload.key)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(payload.key);
      }}
    />
  );
}

function MonthlyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const month = payload[0].payload;

  return (
    <div className="min-w-48 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold text-zinc-100">{capitalize(month.fullLabel)}</p>
      <div className="mt-2 grid gap-1.5 text-xs">
        <TooltipRow color="#34d399" label="Entradas" value={month.income} />
        <TooltipRow color="#fb7185" label="Saidas" value={month.expense} />
        <TooltipRow color="#60a5fa" label="Saldo do mes" value={month.net} />
        <TooltipRow color="#a7f3d0" label="Saldo acumulado" value={month.balance} />
      </div>
      <p className="mt-2 border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
        Clique no ponto para selecionar o mes
      </p>
    </div>
  );
}

function ComparisonTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-md border border-zinc-700 bg-zinc-950/95 p-3 shadow-xl shadow-black/30">
      <p className="font-semibold capitalize text-zinc-100">{label}</p>
      <div className="mt-2 grid gap-1.5 text-xs">
        {payload.map((item) => (
          <TooltipRow
            color={item.color}
            key={item.dataKey}
            label={item.dataKey}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
}

function TooltipRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-5 text-zinc-400">
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <strong className="font-semibold text-zinc-200">{currency.format(value)}</strong>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex h-full min-h-28 items-center justify-center rounded-lg border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}

function MetricSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex animate-pulse items-start justify-between gap-4 p-4">
        <div className="w-full">
          <div className="h-4 w-24 rounded bg-zinc-800" />
          <div className="mt-3 h-7 w-36 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-28 rounded bg-zinc-800/70" />
        </div>
        <div className="size-10 shrink-0 rounded-lg bg-zinc-800" />
      </CardContent>
    </Card>
  );
}

function TaskStatSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="flex animate-pulse items-center justify-between gap-4 p-4">
        <div className="w-full">
          <div className="h-4 w-20 rounded bg-zinc-800" />
          <div className="mt-2 h-10 w-14 rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-28 rounded bg-zinc-800/70" />
        </div>
        <div className="size-16 shrink-0 rounded-full border-[6px] border-zinc-800" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ variant = "chart" }) {
  if (variant === "donut") {
    return (
      <div className="grid h-full animate-pulse place-items-center">
        <div className="size-40 rounded-full border-[28px] border-zinc-800" />
      </div>
    );
  }

  return (
    <div className="flex h-full animate-pulse items-end gap-3 border-b border-l border-zinc-800 p-5">
      {[45, 72, 38, 88, 60, 76].map((height, index) => (
        <div
          className="flex-1 rounded-t bg-zinc-800"
          key={index}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-label="Carregando transacoes" className="animate-pulse p-5">
      <div className="mb-4 h-4 w-40 rounded bg-zinc-800" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="grid grid-cols-[1.4fr_1fr_1fr_100px] gap-3" key={index}>
            <div className="h-9 rounded bg-zinc-800/80" />
            <div className="h-9 rounded bg-zinc-800/60" />
            <div className="h-9 rounded bg-zinc-800/60" />
            <div className="h-9 rounded bg-zinc-800/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div aria-label="Carregando tarefas" className="animate-pulse space-y-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 rounded-lg border border-zinc-800 p-3"
          key={index}
        >
          <div className="size-10 rounded-md bg-zinc-800" />
          <div>
            <div className="h-4 w-2/3 rounded bg-zinc-800" />
            <div className="mt-2 h-5 w-20 rounded-full bg-zinc-800/70" />
          </div>
          <div className="size-10 rounded-md bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function LoadingLabel() {
  return (
    <p className="flex items-center gap-2 p-5 text-sm text-zinc-400">
      <Loader2 className="animate-spin" size={17} />
      Carregando API...
    </p>
  );
}

function priorityVariant(priority) {
  if (priority === "alta") return "danger";
  if (priority === "media") return "warning";
  return "success";
}

function taskMatchesDeadline(task, filter) {
  if (filter === "all") return true;
  if (!task.dueDate) return filter === "none";

  const dueDate = parseISO(task.dueDate);
  const today = startOfDay(new Date());

  if (filter === "overdue") return !task.done && isBefore(dueDate, today);
  if (filter === "today") return isToday(dueDate);
  if (filter === "upcoming") return !isBefore(dueDate, today) && !isToday(dueDate);
  return false;
}

function taskDeadline(task) {
  if (!task.dueDate) return { label: "Sem prazo", variant: "neutral" };

  const dueDate = parseISO(task.dueDate);
  const today = startOfDay(new Date());
  const formattedDate = format(dueDate, "dd 'de' MMM", { locale: ptBR }).replace(".", "");
  const daysUntilDue = differenceInCalendarDays(dueDate, today);

  if (task.done) return { label: `Prazo ${formattedDate}`, variant: "neutral" };
  if (isToday(dueDate)) return { label: "Vence hoje", variant: "warning" };
  if (isBefore(dueDate, today)) {
    const daysLate = Math.abs(daysUntilDue);
    return {
      label: `${daysLate} ${daysLate === 1 ? "dia" : "dias"} atrasada`,
      variant: "danger",
    };
  }
  if (daysUntilDue === 1) return { label: "Vence amanha", variant: "default" };
  return { label: `Em ${daysUntilDue} dias - ${formattedDate}`, variant: "default" };
}

function compactCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(key, offset) {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + offset, 1));
}

function formatMonth(key, formatter) {
  const [year, month] = key.split("-").map(Number);
  return formatter.format(new Date(year, month - 1, 1)).replace(".", "");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default App;
