import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Plus,
  Search,
  Send,
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

const tabs = [
  { id: "finance", label: "Financas", icon: DollarSign },
  { id: "landing", label: "Estudos", icon: BookOpenCheck },
  { id: "tasks", label: "Taskly", icon: ClipboardList },
];

const chartColors = ["#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa"];

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
              Financas, estudos e tarefas conectados
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav
            aria-label="Navegacao principal"
            className="grid grid-cols-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-1"
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
          {activeTab === "landing" && <StudyLanding />}
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
        body: JSON.stringify(form),
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
              Acompanhe financas, estudos e tarefas em um ambiente privado, conectado e
              preparado para acompanhar seu progresso.
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

  const balanceTrend = useMemo(() => {
    let balance = 0;
    return [...filteredTransactions].reverse().map((item, index) => {
      balance += item.type === "income" ? item.amount : -item.amount;
      return { name: `Mov. ${index + 1}`, saldo: balance };
    });
  }, [filteredTransactions]);

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard index={index} key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          description="Comparativo consolidado do periodo"
          title="Entradas x saidas"
        >
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
        </ChartCard>

        <ChartCard
          description="Distribuicao das despesas por categoria"
          title="Gastos por categoria"
        >
          {expenseByCategory.length ? (
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
        description="Saldo acumulado a cada movimentacao cadastrada"
        title="Evolucao do saldo"
      >
        {balanceTrend.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={balanceTrend}>
              <CartesianGrid stroke="#27272a" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="name" tickLine={false} />
              <YAxis axisLine={false} tickFormatter={compactCurrency} tickLine={false} />
              <Tooltip formatter={(value) => currency.format(value)} />
              <Line
                dataKey="saldo"
                dot={{ fill: "#34d399", r: 3 }}
                stroke="#34d399"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Cadastre movimentacoes para visualizar a evolucao." />
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
            {loading && <LoadingLabel />}
            {error && <p className="p-5 text-sm text-red-300">{error}</p>}
            {!loading && (
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova transacao</CardTitle>
        <CardDescription>Registre uma entrada ou saida no painel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Input
            placeholder="Descricao"
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <Input
            placeholder="Categoria"
            required
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
          <Input
            min="0.01"
            placeholder="Valor"
            required
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
          />
          <Select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          >
            <option value="expense">Saida</option>
            <option value="income">Entrada</option>
          </Select>
          <Button type="submit">
            <Plus size={17} />
            Adicionar transacao
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StudyLanding() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submitLead(event) {
    event.preventDefault();
    setMessage("");
    await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setEmail("");
    setMessage("Email salvo no back-end.");
  }

  const schedule = [
    ["JavaScript moderno", "09:00", "Concluido"],
    ["React e componentes", "14:00", "Em andamento"],
    ["Node API", "19:30", "Planejado"],
  ];

  return (
    <div className="grid min-h-[calc(100vh-130px)] items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_480px]">
      <motion.section
        animate={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.35 }}
      >
        <Badge variant="success">
          <Sparkles size={13} />
          Rotina conectada
        </Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-zinc-50 sm:text-6xl">
          Transforme seus estudos em progresso visivel.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Organize blocos de foco, acompanhe sua evolucao e conecte sua rotina aos
          outros modulos do NexaFlow.
        </p>
        <form className="mt-7 flex max-w-xl flex-col gap-2 sm:flex-row" onSubmit={submitLead}>
          <div className="relative flex-1">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={17}
            />
            <Input
              className="pl-9"
              placeholder="seuemail@exemplo.com"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit">
            <Send size={17} />
            Quero acompanhar
          </Button>
        </form>
        {message && <p className="mt-3 text-sm font-medium text-emerald-300">{message}</p>}
      </motion.section>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 18 }}
        transition={{ delay: 0.08, duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Plano de hoje</CardTitle>
                <CardDescription>Quinta-feira, 5 de junho</CardDescription>
              </div>
              <Badge variant="warning">82% foco</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Blocos" value="3" />
              <MiniStat label="Tempo focado" value="4h 20m" />
            </div>
            <div className="space-y-2">
              {schedule.map(([title, time, status], index) => (
                <motion.article
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
                  initial={{ opacity: 0, x: 12 }}
                  key={title}
                  transition={{ delay: 0.15 + index * 0.08 }}
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-300">
                    <BookOpenCheck size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{title}</p>
                    <p className="text-xs text-zinc-500">{status}</p>
                  </div>
                  <span className="text-sm font-medium text-zinc-400">{time}</span>
                </motion.article>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TasksApp() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("media");
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
    if (filter === "pending") return !task.done;
    if (filter === "done") return task.done;
    return true;
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
      body: JSON.stringify({ title, priority }),
    });
    setTasks((current) => [created, ...current]);
    setTitle("");
    setPriority("media");
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
        description="Capture tarefas, escolha prioridades e acompanhe o que ja foi concluido."
        eyebrow="Organizador de tarefas"
        title="Taskly"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          detail="Itens cadastrados"
          icon={ClipboardList}
          index={0}
          title="Total"
          tone="sky"
          value={counters.total}
        />
        <MetricCard
          detail="Aguardando acao"
          icon={Target}
          index={1}
          title="Pendentes"
          tone="amber"
          value={counters.pending}
        />
        <MetricCard
          detail="Progresso registrado"
          icon={CheckCircle2}
          index={2}
          title="Concluidas"
          tone="emerald"
          value={counters.done}
        />
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
              <Button type="submit">
                <Plus size={17} />
                Adicionar tarefa
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 border-b border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Minhas tarefas</CardTitle>
              <CardDescription>{visibleTasks.length} itens neste filtro</CardDescription>
            </div>
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
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading && <LoadingLabel />}
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
                      <Badge className="mt-1" variant={priorityVariant(task.priority)}>
                        {task.priority}
                      </Badge>
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

function ChartCard({ children, description, title }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-zinc-100">{value}</p>
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

function compactCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default App;
