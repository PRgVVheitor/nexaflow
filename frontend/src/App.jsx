import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const tabs = [
  { id: "finance", label: "Financas", icon: DollarSign },
  { id: "landing", label: "Landing", icon: BarChart3 },
  { id: "tasks", label: "Tarefas", icon: ClipboardList },
];

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">React + Node</p>
          <h1>Portfolio fullstack</h1>
          <p className="header-copy">
            Uma evolucao dos projetos estaticos para uma aplicacao com frontend em
            React, backend em Node e APIs reais.
          </p>
        </div>
        <nav className="tab-bar" aria-label="Navegacao principal">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {activeTab === "finance" && <FinanceDashboard />}
      {activeTab === "landing" && <LandingPage />}
      {activeTab === "tasks" && <TasksApp />}
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

  async function createTransaction(event) {
    event.preventDefault();
    const created = await api("/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
      }),
    });
    setTransactions((current) => [created, ...current]);
    setForm({ description: "", category: "", amount: "", type: "expense" });
  }

  async function deleteTransaction(id) {
    await api(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="view-stack">
      <div className="metric-grid">
        <Metric title="Saldo" value={currency.format(totals.balance)} tone="blue" />
        <Metric title="Entradas" value={currency.format(totals.income)} tone="green" />
        <Metric title="Saidas" value={currency.format(totals.expense)} tone="red" />
        <Metric title="Economia" value={`${totals.savingsRate}%`} tone="yellow" />
      </div>

      <div className="workspace-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">API / Financas</p>
              <h2>Transacoes</h2>
            </div>
            <div className="filters">
              <input
                aria-label="Buscar transacao"
                placeholder="Buscar"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                aria-label="Filtrar categoria"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <LoadingLabel />}
          {error && <p className="error">{error}</p>}
          {!loading && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Descricao</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.description}</td>
                      <td>
                        <span className="tag">{transaction.category}</span>
                      </td>
                      <td>{transaction.type === "income" ? "Entrada" : "Saida"}</td>
                      <td className={transaction.type === "income" ? "positive" : "negative"}>
                        {currency.format(transaction.amount)}
                      </td>
                      <td>
                        <IconButton
                          label="Remover transacao"
                          tone="danger"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="panel">
          <p className="eyebrow">Node API</p>
          <h2>Nova transacao</h2>
          <form className="form-stack" onSubmit={createTransaction}>
            <input
              placeholder="Descricao"
              required
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <input
              placeholder="Categoria"
              required
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
            <input
              min="0.01"
              placeholder="Valor"
              required
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option value="expense">Saida</option>
              <option value="income">Entrada</option>
            </select>
            <button className="primary-button" type="submit">
              <Plus size={18} />
              Adicionar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

function LandingPage() {
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

  return (
    <section className="landing-view">
      <div className="landing-copy">
        <p className="eyebrow">Landing + API</p>
        <h2>FocoFlow agora conectado ao Node.</h2>
        <p>
          A landing page continua com cara de produto, mas o formulario envia leads
          para o backend Express em vez de ficar so no navegador.
        </p>
        <form className="lead-form" onSubmit={submitLead}>
          <input
            placeholder="seuemail@exemplo.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="primary-button" type="submit">
            <Send size={18} />
            Enviar
          </button>
        </form>
        {message && <p className="success">{message}</p>}
      </div>

      <div className="product-panel">
        <div className="product-grid">
          <article>
            <span>Hoje</span>
            <strong>3 blocos</strong>
          </article>
          <article>
            <span>Foco</span>
            <strong>82%</strong>
          </article>
        </div>
        <ul className="timeline">
          <li>
            <span>JavaScript</span>
            <strong>09:00</strong>
          </li>
          <li>
            <span>React</span>
            <strong>14:00</strong>
          </li>
          <li>
            <span>Node API</span>
            <strong>19:30</strong>
          </li>
        </ul>
      </div>
    </section>
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
    if (filter === "pending") {
      return !task.done;
    }
    if (filter === "done") {
      return task.done;
    }
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
    <section className="view-stack">
      <div className="metric-grid three">
        <Metric title="Total" value={counters.total} tone="blue" />
        <Metric title="Pendentes" value={counters.pending} tone="yellow" />
        <Metric title="Concluidas" value={counters.done} tone="green" />
      </div>

      <div className="workspace-grid">
        <aside className="panel">
          <p className="eyebrow">Node API</p>
          <h2>Nova tarefa</h2>
          <form className="form-stack" onSubmit={createTask}>
            <input
              placeholder="Titulo da tarefa"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baixa">Baixa</option>
            </select>
            <button className="primary-button" type="submit">
              <Plus size={18} />
              Adicionar
            </button>
          </form>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">React state</p>
              <h2>Minhas tarefas</h2>
            </div>
            <div className="filters">
              {[
                ["all", "Todas"],
                ["pending", "Pendentes"],
                ["done", "Concluidas"],
              ].map(([id, label]) => (
                <button
                  className={filter === id ? "active" : ""}
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading && <LoadingLabel />}
          <ul className="task-list">
            {visibleTasks.map((task) => (
              <li className={task.done ? "done" : ""} key={task.id}>
                <button
                  aria-label="Alternar tarefa"
                  className="check-button"
                  type="button"
                  onClick={() => toggleTask(task)}
                >
                  <CheckCircle2 size={20} />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </div>
                <IconButton
                  label="Remover tarefa"
                  tone="danger"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function Metric({ title, value, tone }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function IconButton({ children, label, tone = "neutral", onClick }) {
  return (
    <button aria-label={label} className={`icon-button ${tone}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function LoadingLabel() {
  return (
    <p className="loading-label">
      <Loader2 size={18} />
      Carregando API...
    </p>
  );
}

export default App;
