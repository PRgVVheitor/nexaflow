import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isBefore,
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Columns3,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  GitCompareArrows,
  Gauge,
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  List,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { z } from "zod";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  { id: "finance", label: "Finanças", icon: DollarSign, path: "/financas" },
  { id: "tasks", label: "Taskly", icon: ClipboardList, path: "/taskly" },
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
const transactionFormSchema = z.object({
  amount: z.coerce.number({ error: "Informe um valor." }).positive("O valor deve ser maior que zero."),
  category: z.string().min(1, "Selecione uma categoria."),
  description: z.string().trim().min(2, "Informe uma descrição com pelo menos 2 caracteres."),
  type: z.enum(["income", "expense"]),
});
const taskFormSchema = z.object({
  dueDate: z.string().optional(),
  priority: z.enum(["alta", "media", "baixa"]),
  title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres."),
});
const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});
const registerFormSchema = loginFormSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome."),
});

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
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname === "/taskly" ? "tasks" : "finance";

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
    navigate("/financas");
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
    navigate("/");
    toast.success("Sessão encerrada.");
  }

  if (authLoading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={authenticate} />;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <header className="mb-6 flex flex-col gap-5 border-b border-zinc-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-zinc-50">NexaFlow</p>
            <p className="truncate text-sm text-zinc-500">
              Finanças e produtividade conectadas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav
            aria-label="Navegação principal"
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
                  onClick={() => navigate(tab.path)}
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

      <Routes>
        <Route element={<FinanceDashboard />} path="/financas" />
        <Route element={<TasksApp />} path="/taskly" />
        <Route element={<Navigate replace to="/financas" />} path="*" />
      </Routes>
    </main>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const isRegister = mode === "register";

  async function submit(event) {
    event.preventDefault();
    const result = (isRegister ? registerFormSchema : loginFormSchema).safeParse(form);
    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          isRegister ? form : { email: form.email, password: form.password },
        ),
      });
      onAuthenticated(response);
      toast.success(isRegister ? "Conta criada com sucesso." : "Bem-vindo de volta.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function useDemo() {
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "demo@nexaflow.app", password: "demo1234" }),
      });
      onAuthenticated(response);
      toast.success("Conta demonstrativa carregada.");
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateAuthField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
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
              Sua rotina organizada em um único fluxo.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Acompanhe suas financas e tarefas em um ambiente privado, conectado e
              preparado para organizar seu dia.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Finanças pessoais", "Transações e gráficos protegidos por conta."],
              ["Taskly", "Tarefas e prioridades sincronizadas."],
              ["Sessão segura", "Senhas protegidas e acesso autenticado."],
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
                ? "Seus dados ficarão separados e protegidos."
                : "Continue de onde parou em poucos segundos."}
            </p>
          </div>

          <form className="grid gap-3" noValidate onSubmit={submit}>
            {isRegister && (
              <>
                <Input
                  aria-invalid={Boolean(fieldErrors.name)}
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(event) => updateAuthField("name", event.target.value)}
                />
                <FieldError error={fieldErrors.name} />
              </>
            )}
            <Input
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              type="email"
              value={form.email}
              onChange={(event) => updateAuthField("email", event.target.value)}
            />
            <FieldError error={fieldErrors.email} />
            <div className="relative">
              <Input
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="pr-11"
                placeholder="Senha"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateAuthField("password", event.target.value)}
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
            <FieldError error={fieldErrors.password} />

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
                setFieldErrors({});
              }}
            >
              {isRegister ? "Já tenho uma conta" : "Criar uma nova conta"}
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
  const [intelligence, setIntelligence] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [chartMode, setChartMode] = useState("evolution");
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));
  const [comparisonMonth, setComparisonMonth] = useState(() =>
    shiftMonth(monthKey(new Date()), -1),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTransactions() {
    setLoading(true);
    setIntelligenceLoading(true);
    setError("");
    try {
      const [transactionsResult, intelligenceResult] = await Promise.allSettled([
        api("/api/transactions"),
        api("/api/finance/intelligence"),
      ]);
      if (transactionsResult.status === "rejected") throw transactionsResult.reason;
      setTransactions(transactionsResult.value);
      if (intelligenceResult.status === "fulfilled") {
        setIntelligence(intelligenceResult.value);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setIntelligenceLoading(false);
    }
  }

  async function refreshIntelligence() {
    try {
      setIntelligence(await api("/api/finance/intelligence"));
    } catch (requestError) {
      toast.error(requestError.message);
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
      const matchesPeriod = transactionMatchesPeriod(transaction, periodFilter, customPeriod);
      return matchesCategory && matchesSearch && matchesPeriod;
    });
  }, [transactions, categoryFilter, search, periodFilter, customPeriod]);

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

    return Object.entries(grouped).map(([name, value]) => ({ name: displayCategory(name), value }));
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
      Saídas: selectedMonthData.expense,
      Saldo: selectedMonthData.net,
    },
    {
      name: comparisonMonthData.label,
      Entradas: comparisonMonthData.income,
      Saídas: comparisonMonthData.expense,
      Saldo: comparisonMonthData.net,
    },
  ];
  const comparisonDelta = selectedMonthData.net - comparisonMonthData.net;
  const hasFinancialActivity = filteredTransactions.length > 0;

  async function createTransaction(data) {
    try {
      const created = await api("/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setTransactions((current) => [created, ...current]);
      refreshIntelligence();
      toast.success("Transação adicionada.");
      return true;
    } catch (requestError) {
      toast.error(requestError.message);
      return false;
    }
  }

  async function deleteTransaction(id) {
    try {
      await api(`/api/transactions/${id}`, { method: "DELETE" });
      setTransactions((current) => current.filter((item) => item.id !== id));
      refreshIntelligence();
      toast.success("Transação removida.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  function startEditingTransaction(transaction) {
    setEditingTransaction({
      id: transaction.id,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: String(transaction.amount),
    });
  }

  async function saveTransaction() {
    const result = transactionFormSchema.safeParse({
      amount: editingTransaction.amount,
      category: editingTransaction.category,
      description: editingTransaction.description,
      type: editingTransaction.type,
    });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    try {
      const updated = await api(`/api/transactions/${editingTransaction.id}`, {
        method: "PATCH",
        body: JSON.stringify(result.data),
      });
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === updated.id ? updated : transaction)),
      );
      setEditingTransaction(null);
      refreshIntelligence();
      toast.success("Transação atualizada.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  function exportTransactions() {
    const rows = filteredTransactions.map((transaction) => [
      format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm"),
      transaction.description,
      displayCategory(transaction.category),
      transaction.type === "income" ? "Entrada" : "Saída",
      transaction.amount.toFixed(2).replace(".", ","),
    ]);
    const csv = [
      ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"],
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexaflow-transacoes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredTransactions.length} transações exportadas.`);
  }

  const metrics = [
    {
      title: "Saldo atual",
      value: currency.format(totals.balance),
      detail: "Disponível no período",
      icon: WalletCards,
      tone: "emerald",
    },
    {
      title: "Entradas",
      value: currency.format(totals.income),
      detail: `${filteredTransactions.filter((item) => item.type === "income").length} lançamentos`,
      icon: ArrowUpRight,
      tone: "sky",
    },
    {
      title: "Saídas",
      value: currency.format(totals.expense),
      detail: `${filteredTransactions.filter((item) => item.type === "expense").length} lançamentos`,
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
        description="Acompanhe o fluxo financeiro, compare entradas e saídas e entenda para onde seu dinheiro está indo."
        eyebrow="Painel financeiro"
        title="Visão geral"
      />

      <div className="flex flex-col gap-3 border-y border-zinc-800 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Período da análise</p>
          <p className="text-xs text-zinc-500">
            Totais, gráficos, tabela e exportação acompanham este filtro.
          </p>
        </div>
        <div
          className={cn(
            "grid gap-2",
            periodFilter === "custom" ? "sm:grid-cols-3 lg:min-w-[560px]" : "lg:min-w-[220px]",
          )}
        >
          <Select
            aria-label="Filtrar período"
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
          >
            <option value="all">Todos os períodos</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
            <option value="custom">Personalizado</option>
          </Select>
          {periodFilter === "custom" && (
            <>
              <DatePicker
                label="Data inicial"
                value={customPeriod.start}
                onChange={(start) => setCustomPeriod((current) => ({ ...current, start }))}
              />
              <DatePicker
                label="Data final"
                value={customPeriod.end}
                onChange={(end) => setCustomPeriod((current) => ({ ...current, end }))}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:sticky xl:top-2 xl:z-20 xl:grid-cols-4 xl:rounded-lg xl:bg-zinc-950/90 xl:py-2 xl:backdrop-blur">
        {loading
          ? Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)
          : metrics.map((metric, index) => (
              <MetricCard index={index} key={metric.title} {...metric} />
            ))}
      </div>

      <FinancialIntelligencePanel intelligence={intelligence} loading={intelligenceLoading} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          description="Comparativo consolidado do período"
          title="Entradas x saídas"
        >
          {loading ? (
            <ChartSkeleton />
          ) : hasFinancialActivity ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={[
                { name: "Entradas", valor: totals.income },
                { name: "Saídas", valor: totals.expense },
              ]}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="name" tickLine={false} />
              <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a", opacity: 0.45 }}
                formatter={(value) => currency.format(value)}
              />
              <Bar barSize={72} dataKey="valor" maxBarSize={72} radius={[7, 7, 0, 0]}>
                <Cell fill="#34d399" />
                <Cell fill="#fb7185" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          ) : (
            <EmptyState text="Adicione transações para visualizar entradas e saídas." />
          )}
        </ChartCard>

        <ChartCard
          description="Distribuição das despesas por categoria"
          title="Gastos por categoria"
        >
          {loading ? (
            <ChartSkeleton variant="donut" />
          ) : expenseByCategory.length ? (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      innerRadius={56}
                      nameKey="name"
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {expenseByCategory.map((item, index) => (
                        <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => currency.format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-zinc-800 pt-3">
                {expenseByCategory.map((item, index) => (
                  <div className="flex items-center gap-2 text-xs text-zinc-400" key={item.name}>
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="Adicione uma saída para visualizar o gráfico." />
          )}
        </ChartCard>
      </div>

      <ChartCard
        actions={
          <div className="grid gap-2 sm:min-w-[430px]">
            <div
              aria-label="Modo do gráfico financeiro"
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
                Evolução
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
                aria-label="Mês principal"
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
                  aria-label="Mês para comparar"
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
            ? "A onda mostra o ritmo do saldo. Clique em um ponto para selecionar o mês."
            : "Compare entradas, saídas e saldo entre dois meses."
        }
        title={chartMode === "evolution" ? "Fluxo mensal do saldo" : "Comparação mensal"}
      >
        {loading ? (
          <ChartSkeleton />
        ) : !hasFinancialActivity ? (
          <EmptyState text="Adicione transações para visualizar sua evolução mensal." />
        ) : chartMode === "evolution" ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="h-full"
              initial={{ opacity: 0 }}
              key="evolution"
            >
              <div aria-label="Gráfico de onda do saldo mensal" className="h-full" role="img">
                <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="balanceWave" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.42} />
                      <stop offset="55%" stopColor="#34d399" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" tickLine={false} />
                  <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
                  <Tooltip content={<MonthlyTooltip />} cursor={{ stroke: "#3f3f46" }} />
                  <Area
                    activeDot={{ fill: "#6ee7b7", r: 6, stroke: "#09090b", strokeWidth: 3 }}
                    dataKey="balance"
                    dot={(props) => (
                      <MonthDot
                        {...props}
                        onSelect={setSelectedMonth}
                        selected={props.payload.key === selectedMonth}
                      />
                    )}
                    fill="url(#balanceWave)"
                    name="Saldo acumulado"
                    stroke="#34d399"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    type="natural"
                  />
                </AreaChart>
                </ResponsiveContainer>
              </div>
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
                  Diferença de saldo entre os meses
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
                    <Bar dataKey="Saídas" fill="#fb7185" radius={[5, 5, 0, 0]} />
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
              <CardTitle>Transações recentes</CardTitle>
              <CardDescription>Dados sincronizados com a API Node.</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />
                <Input
                  aria-label="Buscar transação"
                  className="pl-9"
                  placeholder="Buscar transação"
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
                    {displayCategory(category)}
                  </option>
                ))}
              </Select>
              <Button
                disabled={!filteredTransactions.length}
                type="button"
                variant="secondary"
                onClick={exportTransactions}
              >
                <Download size={16} />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading && <TableSkeleton />}
            {error && <p className="p-5 text-sm text-red-300">{error}</p>}
            {!loading && !filteredTransactions.length && !error && (
              <div className="p-5">
                <EmptyState text="Nenhuma transação encontrada para os filtros selecionados." />
              </div>
            )}
            {!loading && filteredTransactions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      {editingTransaction?.id === transaction.id ? (
                        <>
                          <TableCell>
                            <Input
                              aria-label="Editar descrição da transação"
                              value={editingTransaction.description}
                              onChange={(event) =>
                                setEditingTransaction((current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              aria-label="Editar categoria da transação"
                              value={editingTransaction.category}
                              onChange={(event) =>
                                setEditingTransaction((current) => ({
                                  ...current,
                                  category: event.target.value,
                                }))
                              }
                            >
                              {transactionCategories[editingTransaction.type].map((category) => (
                                <option key={category} value={category}>
                                  {displayCategory(category)}
                                </option>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              aria-label="Editar tipo da transação"
                              value={editingTransaction.type}
                              onChange={(event) => {
                                const type = event.target.value;
                                setEditingTransaction((current) => ({
                                  ...current,
                                  type,
                                  category: transactionCategories[type].includes(current.category)
                                    ? current.category
                                    : transactionCategories[type][0],
                                }));
                              }}
                            >
                              <option value="income">Entrada</option>
                              <option value="expense">Saída</option>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              aria-label="Editar valor da transação"
                              min="0.01"
                              step="0.01"
                              type="number"
                              value={editingTransaction.amount}
                              onChange={(event) =>
                                setEditingTransaction((current) => ({
                                  ...current,
                                  amount: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                aria-label="Salvar transação"
                                size="icon"
                                type="button"
                                onClick={saveTransaction}
                              >
                                <Save size={16} />
                              </Button>
                              <Button
                                aria-label="Cancelar edição da transação"
                                size="icon"
                                type="button"
                                variant="ghost"
                                onClick={() => setEditingTransaction(null)}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium text-zinc-100">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral">{displayCategory(transaction.category)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "income" ? "success" : "danger"}>
                              {transaction.type === "income" ? "Entrada" : "Saída"}
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
                            <div className="flex justify-end gap-1">
                              <Button
                                aria-label="Editar transação"
                                size="icon"
                                type="button"
                                variant="ghost"
                                onClick={() => startEditingTransaction(transaction)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                aria-label="Remover transação"
                                size="icon"
                                type="button"
                                variant="destructive"
                                onClick={() => deleteTransaction(transaction.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TransactionForm onCreate={createTransaction} />
      </div>
    </div>
  );
}

function FinancialIntelligencePanel({ intelligence, loading }) {
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
          <p className="text-xs text-zinc-500">Análises calculadas a partir dos seus movimentos.</p>
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
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Economia, saldo, controle de gastos e consistência.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Economia", intelligence.score.components.savings, 40],
                ["Saldo", intelligence.score.components.balance, 20],
                ["Controle", intelligence.score.components.control, 20],
                ["Consistência", intelligence.score.components.consistency, 20],
              ].map(([label, value, maximum]) => (
                <div className="rounded-md border border-zinc-800 bg-zinc-950/35 px-2.5 py-2" key={label}>
                  <span className="text-zinc-500">{label}</span>
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
                  <p className="text-xs font-semibold uppercase text-zinc-500">
                    Em {period.days} dias
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">Mantendo o ritmo atual</p>
                </div>
                <strong className={period.balance >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  {currency.format(period.balance)}
                </strong>
              </div>
            ))}
            <p className="text-xs text-zinc-500">
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
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{insight.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function InsightIcon({ type }) {
  const styles = {
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

function TransactionForm({ onCreate }) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: { amount: "", category: "", description: "", type: "expense" },
    resolver: zodResolver(transactionFormSchema),
  });
  const type = watch("type");
  const category = watch("category");
  const categories = transactionCategories[type];

  function selectType(nextType) {
    setValue("type", nextType);
    if (!transactionCategories[nextType].includes(category)) setValue("category", "");
  }

  async function submit(data) {
    if (await onCreate(data)) {
      reset({ amount: "", category: "", description: "", type: data.type });
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

function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    control: taskControl,
    formState: { errors: taskErrors, isSubmitting: taskSubmitting },
    handleSubmit: handleTaskSubmit,
    register: registerTask,
    reset: resetTask,
  } = useForm({
    defaultValues: { dueDate: "", priority: "media", title: "" },
    resolver: zodResolver(taskFormSchema),
  });

  async function loadTasks() {
    setLoading(true);
    try {
      setTasks(await api("/api/tasks"));
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const deadlineTasks = tasks.filter((task) => taskMatchesDeadline(task, deadlineFilter));
  const visibleTasks = deadlineTasks.filter((task) => {
    const matchesStatus =
      filter === "pending" ? !task.done : filter === "done" ? task.done : true;
    return matchesStatus;
  });

  const counters = {
    total: tasks.length,
    pending: tasks.filter((task) => !task.done).length,
    done: tasks.filter((task) => task.done).length,
  };

  async function createTask(data) {
    try {
      const created = await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ ...data, dueDate: data.dueDate || null }),
      });
      setTasks((current) => [created, ...current]);
      resetTask({ dueDate: "", priority: "media", title: "" });
      toast.success("Tarefa adicionada.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await api(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: !task.done }),
      });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(updated.done ? "Tarefa concluída." : "Tarefa reaberta.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  function startEditingTask(task) {
    setEditingTask({
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
  }

  async function saveTask(event) {
    event.preventDefault();
    const result = taskFormSchema.safeParse(editingTask);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    try {
      const updated = await api(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: result.data.title,
          priority: result.data.priority,
          dueDate: result.data.dueDate || null,
        }),
      });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingTask(null);
      toast.success("Tarefa atualizada.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  async function deleteTask(id) {
    try {
      await api(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item.id !== id));
      if (editingTask?.id === id) setEditingTask(null);
      toast.success("Tarefa removida.");
    } catch (requestError) {
      toast.error(requestError.message);
    }
  }

  function editFromBoard(task) {
    startEditingTask(task);
    setViewMode("list");
  }

  return (
    <div className="space-y-5">
      <PageHeading
        description="Capture tarefas, defina prazos e acompanhe o que precisa de atenção."
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
              detail="Aguardando ação"
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
              title="Concluídas"
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
            <CardDescription>Adicione o próximo item da sua rotina.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" noValidate onSubmit={handleTaskSubmit(createTask)}>
              <Input
                aria-label="Título da tarefa"
                aria-invalid={Boolean(taskErrors.title)}
                className={cn(taskErrors.title && "border-red-400 focus:border-red-400")}
                placeholder="Título da tarefa"
                {...registerTask("title")}
              />
              <FieldError error={taskErrors.title} />
              <Select aria-label="Prioridade da tarefa" {...registerTask("priority")}>
                <option value="alta">Prioridade alta</option>
                <option value="media">Prioridade média</option>
                <option value="baixa">Prioridade baixa</option>
              </Select>
              <label className="grid gap-1.5 text-xs font-medium text-zinc-400">
                Prazo opcional
                <Controller
                  control={taskControl}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePicker
                      label="Prazo da tarefa"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </label>
              <Button disabled={taskSubmitting} type="submit">
                {taskSubmitting ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
                Adicionar tarefa
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 border-b border-zinc-800 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Minhas tarefas</CardTitle>
              <CardDescription>
                {viewMode === "board" ? deadlineTasks.length : visibleTasks.length} itens neste filtro
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {viewMode === "list" && (
                <div className="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-1">
                {[
                  ["all", "Todas"],
                  ["pending", "Pendentes"],
                  ["done", "Concluídas"],
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
              )}
              <Select
                aria-label="Filtrar por prazo"
                className="w-full sm:w-44"
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value)}
              >
                <option value="all">Todos os prazos</option>
                <option value="overdue">Atrasadas</option>
                <option value="today">Vencem hoje</option>
                <option value="upcoming">Próximas</option>
                <option value="none">Sem prazo</option>
              </Select>
              <div
                aria-label="Visualização das tarefas"
                className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-1"
                role="group"
              >
                <Button
                  aria-pressed={viewMode === "list"}
                  className={cn(viewMode === "list" && "bg-zinc-700 text-zinc-50")}
                  size="icon"
                  title="Lista"
                  type="button"
                  variant="ghost"
                  onClick={() => setViewMode("list")}
                >
                  <List size={17} />
                </Button>
                <Button
                  aria-pressed={viewMode === "board"}
                  className={cn(viewMode === "board" && "bg-zinc-700 text-zinc-50")}
                  size="icon"
                  title="Kanban"
                  type="button"
                  variant="ghost"
                  onClick={() => setViewMode("board")}
                >
                  <Columns3 size={17} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading && <TaskListSkeleton />}
            {!loading && viewMode === "list" && !visibleTasks.length && (
              <EmptyState text="Nenhuma tarefa encontrada neste filtro." />
            )}
            {viewMode === "list" ? (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleTasks.map((task) => (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]",
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
                    {editingTask?.id === task.id ? (
                      <form
                        className="grid min-w-0 gap-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_135px_150px_auto]"
                        onSubmit={saveTask}
                      >
                        <Input
                          aria-label="Editar título da tarefa"
                          required
                          value={editingTask.title}
                          onChange={(event) =>
                            setEditingTask((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                        <Select
                          aria-label="Editar prioridade da tarefa"
                          value={editingTask.priority}
                          onChange={(event) =>
                            setEditingTask((current) => ({
                              ...current,
                              priority: event.target.value,
                            }))
                          }
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Média</option>
                          <option value="baixa">Baixa</option>
                        </Select>
                        <DatePicker
                          label="Editar prazo da tarefa"
                          value={editingTask.dueDate}
                          onChange={(event) =>
                            setEditingTask((current) => ({
                              ...current,
                              dueDate: event,
                            }))
                          }
                        />
                        <div className="flex justify-end gap-1">
                          <Button aria-label="Salvar tarefa" size="icon" type="submit">
                            <Save size={16} />
                          </Button>
                          <Button
                            aria-label="Cancelar edição"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingTask(null)}
                          >
                            <X size={17} />
                          </Button>
                        </div>
                      </form>
                    ) : (
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
                          <Badge variant={priorityVariant(task.priority)}>
                            {displayPriority(task.priority)}
                          </Badge>
                          <TaskDeadlineBadge task={task} />
                        </div>
                      </div>
                    )}
                    {editingTask?.id !== task.id && (
                      <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
                          <Button
                            aria-label="Editar tarefa"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() => startEditingTask(task)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            aria-label="Remover tarefa"
                            size="icon"
                            type="button"
                            variant="destructive"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                      </div>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
            ) : (
              <KanbanBoard
                tasks={deadlineTasks}
                onDelete={deleteTask}
                onEdit={editFromBoard}
                onToggle={toggleTask}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KanbanBoard({ onDelete, onEdit, onToggle, tasks }) {
  const columns = [
    {
      id: "pending",
      title: "Pendentes",
      description: "Itens que ainda precisam de ação",
      tasks: tasks.filter((task) => !task.done),
      tone: "text-amber-300",
    },
    {
      id: "done",
      title: "Concluídas",
      description: "Itens finalizados no seu fluxo",
      tasks: tasks.filter((task) => task.done),
      tone: "text-emerald-300",
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {columns.map((column) => (
        <section
          className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950/30 p-3"
          key={column.id}
        >
          <div className="mb-3 flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className={cn("text-sm font-semibold", column.tone)}>{column.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{column.description}</p>
            </div>
            <Badge variant="neutral">{column.tasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {!column.tasks.length && <EmptyState text={`Nenhuma tarefa em ${column.title.toLowerCase()}.`} />}
            {column.tasks.map((task) => (
              <motion.article
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3"
                key={task.id}
                layout
              >
                <p className={cn("text-sm font-semibold text-zinc-100", task.done && "line-through text-zinc-500")}>
                  {task.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={priorityVariant(task.priority)}>
                    {displayPriority(task.priority)}
                  </Badge>
                  <TaskDeadlineBadge task={task} />
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-zinc-800 pt-3">
                  <Button
                    aria-label={task.done ? "Reabrir tarefa" : "Concluir tarefa"}
                    size="icon"
                    title={task.done ? "Reabrir" : "Concluir"}
                    type="button"
                    variant="secondary"
                    onClick={() => onToggle(task)}
                  >
                    <CheckCircle2 size={16} />
                  </Button>
                  <Button
                    aria-label="Editar tarefa no Kanban"
                    size="icon"
                    title="Editar"
                    type="button"
                    variant="ghost"
                    onClick={() => onEdit(task)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    aria-label="Remover tarefa do Kanban"
                    size="icon"
                    title="Remover"
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      ))}
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

function DatePicker({ label, onChange, value }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <div className="relative">
      <Button
        aria-expanded={open}
        aria-label={label}
        className="w-full justify-start font-normal"
        type="button"
        variant="secondary"
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className="text-emerald-300" size={16} />
        <span className={cn(!selected && "text-zinc-500")}>
          {selected ? format(selected, "dd/MM/yyyy") : "Selecionar data"}
        </span>
      </Button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[280px] rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-2xl shadow-black/50">
          <DayPicker
            classNames={{
              button_next: "grid size-8 place-items-center rounded-md text-zinc-300 hover:bg-zinc-800",
              button_previous: "grid size-8 place-items-center rounded-md text-zinc-300 hover:bg-zinc-800",
              caption_label: "text-sm font-semibold text-zinc-100",
              day: "p-0 text-center text-sm",
              day_button: "size-8 rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50",
              disabled: "opacity-30",
              month: "space-y-3",
              month_caption: "flex h-8 items-center justify-center",
              month_grid: "w-full border-collapse",
              nav: "absolute inset-x-2 top-2 flex justify-between",
              outside: "opacity-35",
              root: "relative",
              selected: "[&>button]:bg-emerald-400 [&>button]:font-bold [&>button]:text-zinc-950",
              today: "[&>button]:border [&>button]:border-emerald-400/60 [&>button]:text-emerald-300",
              week: "grid grid-cols-7",
              weekday: "py-1 text-center text-[11px] font-medium uppercase text-zinc-500",
              weekdays: "grid grid-cols-7",
            }}
            locale={ptBR}
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
          <div className="mt-2 flex justify-between border-t border-zinc-800 pt-2">
            <Button
              aria-label="Remover prazo"
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="-mt-1 text-xs text-red-300">{typeof error === "string" ? error : error.message}</p>;
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
        <TooltipRow color="#fb7185" label="Saídas" value={month.expense} />
        <TooltipRow color="#60a5fa" label="Saldo do mês" value={month.net} />
        <TooltipRow color="#a7f3d0" label="Saldo acumulado" value={month.balance} />
      </div>
      <p className="mt-2 border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
        Clique no ponto para selecionar o mês
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
    <div aria-label="Carregando transações" className="animate-pulse p-5">
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

function displayPriority(priority) {
  return priority === "media" ? "média" : priority;
}

function displayCategory(category) {
  const labels = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

function transactionMatchesPeriod(transaction, filter, customPeriod) {
  if (filter === "all") return true;

  const transactionDate = new Date(transaction.createdAt);
  if (Number.isNaN(transactionDate.getTime())) return false;

  const today = new Date();
  let start;
  let end;

  if (filter === "week") {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (filter === "month") {
    start = startOfMonth(today);
    end = endOfMonth(today);
  } else if (filter === "year") {
    start = startOfYear(today);
    end = endOfYear(today);
  } else {
    start = customPeriod.start ? startOfDay(parseISO(customPeriod.start)) : new Date(0);
    end = customPeriod.end ? endOfDay(parseISO(customPeriod.end)) : new Date(8640000000000000);
  }

  if (start > end) return false;
  return isWithinInterval(transactionDate, { start, end });
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
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
  if (daysUntilDue === 1) return { label: "Vence amanhã", variant: "default" };
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
