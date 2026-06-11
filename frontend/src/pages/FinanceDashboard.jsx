import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  GitCompareArrows,
  Pencil,
  Save,
  Search,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CategoryBarTooltip,
  ChartCard,
  ComparisonTooltip,
  MonthDot,
  WaveTooltip,
} from "../components/charts";
import { DatePicker } from "../components/DatePicker";
import { EmptyState } from "../components/EmptyState";
import { FinancialCopilot } from "../components/FinancialCopilot";
import { FinancialIntelligencePanel } from "../components/FinancialIntelligencePanel";
import { MetricCard } from "../components/MetricCard";
import { PageHeading } from "../components/PageHeading";
import { ChartSkeleton, MetricSkeleton, TableSkeleton } from "../components/skeletons";
import { TransactionForm } from "../components/TransactionForm";
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
} from "../components/ui";
import { api } from "../lib/api";
import { chartColors, transactionCategories, waveMetrics } from "../lib/constants";
import {
  formatMonth,
  monthKey,
  shiftMonth,
  transactionDay,
  transactionMatchesPeriod,
} from "../lib/dates";
import {
  capitalize,
  compactCurrency,
  csvCell,
  currency,
  displayCategory,
  longMonth,
  shortMonth,
} from "../lib/format";
import { transactionFormSchema } from "../lib/schemas";
import { cn } from "../lib/utils";

export function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customPeriod, setCustomPeriod] = useState({ start: "", end: "" });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [chartMode, setChartMode] = useState("evolution");
  const [waveMetric, setWaveMetric] = useState("balance");
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

    return Object.entries(grouped)
      .map(([name, value]) => ({ name: displayCategory(name), value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyHistory = useMemo(() => {
    const endMonth = monthKey(new Date());
    const months = Array.from({ length: 12 }, (_, index) =>
      shiftMonth(endMonth, index - 11),
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
      const key = monthKey(transactionDay(item));
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

  const monthlyData = useMemo(() => monthlyHistory.slice(-6), [monthlyHistory]);

  const waveData = useMemo(() => {
    const previousMonths = monthlyHistory.slice(0, 6);
    const currentMonths = monthlyHistory.slice(-6);
    const metric = waveMetrics[waveMetric].dataKey;
    let currentBalance = 0;
    let previousBalance = 0;

    return currentMonths.map((month, index) => {
      const previousMonth = previousMonths[index];
      currentBalance += month.net;
      previousBalance += previousMonth.net;

      return {
        ...month,
        current: metric === "balance" ? currentBalance : month[metric],
        previous: metric === "balance" ? previousBalance : previousMonth[metric],
        previousFullLabel: previousMonth.fullLabel,
        previousLabel: previousMonth.label,
      };
    });
  }, [monthlyHistory, waveMetric]);

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
  const waveInsight = useMemo(() => {
    const bestMonth = waveData.reduce(
      (best, month) => (!best || month.current > best.current ? month : best),
      null,
    );
    if (!bestMonth) return "";

    const difference = bestMonth.current - bestMonth.previous;
    const percentage = bestMonth.previous
      ? Math.round((difference / Math.abs(bestMonth.previous)) * 100)
      : null;
    const comparisonText =
      percentage === null
        ? "sem base equivalente no período anterior"
        : `${percentage >= 0 ? "+" : ""}${percentage}% contra o período anterior`;

    return `${capitalize(bestMonth.fullLabel)} teve o melhor resultado em ${waveMetrics[
      waveMetric
    ].label.toLowerCase()}: ${currency.format(bestMonth.current)} (${comparisonText}).`;
  }, [waveData, waveMetric]);

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
      date: transaction.date,
      type: transaction.type,
      amount: String(transaction.amount),
    });
  }

  async function saveTransaction() {
    const result = transactionFormSchema.safeParse({
      amount: editingTransaction.amount,
      category: editingTransaction.category,
      date: editingTransaction.date,
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
      format(transactionDay(transaction), "dd/MM/yyyy"),
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
          description="Compare rapidamente onde suas despesas estão concentradas"
          title="Gastos por categoria"
        >
          {loading ? (
            <ChartSkeleton variant="horizontal-bars" />
          ) : expenseByCategory.length ? (
            <div aria-label="Gráfico de barras horizontais dos gastos por categoria" className="h-full" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  data={expenseByCategory}
                  layout="vertical"
                  margin={{ bottom: 4, left: 10, right: 58, top: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="4 4" />
                  <XAxis
                    axisLine={false}
                    tickFormatter={compactCurrency}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="name"
                    tickLine={false}
                    type="category"
                    width={92}
                  />
                  <Tooltip
                    content={<CategoryBarTooltip />}
                    cursor={{ fill: "#27272a", opacity: 0.35 }}
                  />
                  <Bar barSize={24} dataKey="value" name="Gastos" radius={[0, 7, 7, 0]}>
                    {expenseByCategory.map((item, index) => (
                      <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
                    ))}
                    <LabelList
                      dataKey="value"
                      fill="#a1a1aa"
                      fontSize={11}
                      formatter={compactCurrency}
                      position="right"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Adicione uma saída para visualizar o gráfico." />
          )}
        </ChartCard>
      </div>

      <ChartCard
        actions={
          <div className="grid gap-2 sm:min-w-[520px]">
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

            {chartMode === "evolution" ? (
              <div
                aria-label="Indicador do gráfico de onda"
                className="grid grid-cols-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-1"
                role="group"
              >
                {Object.entries(waveMetrics).map(([key, metric]) => (
                  <Button
                    aria-pressed={waveMetric === key}
                    className="min-h-8 h-8"
                    key={key}
                    size="sm"
                    type="button"
                    variant={waveMetric === key ? "secondary" : "ghost"}
                    onClick={() => setWaveMetric(key)}
                  >
                    {metric.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
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
              </div>
            )}
          </div>
        }
        contentClassName="h-[25rem]"
        description={
          chartMode === "evolution"
            ? "Compare o ritmo dos seis meses atuais com o período equivalente anterior."
            : "Compare entradas, saídas e saldo entre dois meses."
        }
        title={chartMode === "evolution" ? "Evolução financeira" : "Comparação mensal"}
      >
        {loading ? (
          <ChartSkeleton />
        ) : !hasFinancialActivity ? (
          <EmptyState text="Adicione transações para visualizar sua evolução mensal." />
        ) : chartMode === "evolution" ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex h-full flex-col gap-3"
              initial={{ opacity: 0 }}
              key="evolution"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded-full bg-emerald-400" />
                  Período atual
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded-full bg-zinc-500" />
                  Período anterior
                </span>
              </div>
              <div
                aria-label={`Gráfico de onda de ${waveMetrics[waveMetric].label.toLowerCase()}`}
                className="min-h-0 flex-1"
                role="img"
              >
                <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={waveData}>
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
                  <Tooltip
                    content={<WaveTooltip metricLabel={waveMetrics[waveMetric].label} />}
                    cursor={{ stroke: "#3f3f46" }}
                  />
                  <Area
                    dataKey="previous"
                    dot={false}
                    fill="transparent"
                    name="Período anterior"
                    stroke="#71717a"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    type="natural"
                  />
                  <Area
                    activeDot={{ fill: "#6ee7b7", r: 6, stroke: "#09090b", strokeWidth: 3 }}
                    dataKey="current"
                    dot={(props) => (
                      <MonthDot
                        {...props}
                        onSelect={setSelectedMonth}
                        selected={props.payload.key === selectedMonth}
                      />
                    )}
                    fill="url(#balanceWave)"
                    name="Período atual"
                    stroke="#34d399"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    type="natural"
                  />
                </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-start gap-2 border-t border-zinc-800 pt-3 text-xs leading-5 text-zinc-400">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-400" />
                <span>{waveInsight}</span>
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
                    <TableHead>Data</TableHead>
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
                              aria-label="Editar data da transação"
                              className="min-w-36"
                              type="date"
                              value={editingTransaction.date}
                              onChange={(event) =>
                                setEditingTransaction((current) => ({
                                  ...current,
                                  date: event.target.value,
                                }))
                              }
                            />
                          </TableCell>
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
                          <TableCell className="whitespace-nowrap text-zinc-400">
                            {format(transactionDay(transaction), "dd/MM/yyyy")}
                          </TableCell>
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

      <FinancialCopilot
        intelligence={intelligence}
        totals={totals}
        transactions={filteredTransactions}
      />
    </div>
  );
}
