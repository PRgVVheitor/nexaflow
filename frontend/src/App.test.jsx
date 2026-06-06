import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const today = new Date();
const todayDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

const defaultTransactions = [
  {
    id: "tx-test",
    description: "Salario de teste",
    category: "Renda",
    type: "income",
    amount: 5000,
    createdAt: "2026-06-03T12:00:00.000Z",
  },
  {
    id: "tx-previous-month",
    description: "Aluguel de teste",
    category: "Moradia",
    type: "expense",
    amount: 1200,
    createdAt: "2026-05-03T12:00:00.000Z",
  },
];

const defaultTasks = [
  {
    id: "task-test",
    title: "Publicar NexaFlow",
    priority: "alta",
    done: false,
    dueDate: todayDate,
  },
];

const defaultIntelligence = {
  score: {
    value: 78,
    label: "Saudável",
    components: { savings: 30, balance: 20, control: 14, consistency: 14 },
  },
  forecast: {
    currentBalance: 3800,
    dailyNet: 25,
    risk: "low",
    riskLabel: "Baixo risco",
    periods: [
      { days: 7, balance: 3975 },
      { days: 15, balance: 4175 },
      { days: 30, balance: 4550 },
    ],
  },
  anomalies: [],
  insights: [
    {
      id: "forecast",
      type: "success",
      title: "Projeção positiva",
      message: "Mantendo o ritmo atual, seu saldo seguirá positivo.",
    },
  ],
};

const responses = {
  "/api/auth/login": {
    token: "token-demo",
    user: {
      id: "user-test",
      name: "Heitor Teste",
      email: "heitor@example.com",
    },
  },
  "/api/auth/me": {
    user: {
      id: "user-test",
      name: "Heitor Teste",
      email: "heitor@example.com",
    },
  },
  "/api/transactions": defaultTransactions,
  "/api/finance/intelligence": defaultIntelligence,
  "/api/tasks": defaultTasks,
};

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  responses["/api/transactions"] = defaultTransactions;
  responses["/api/finance/intelligence"] = defaultIntelligence;
  responses["/api/tasks"] = defaultTasks;
  delete responses["/api/transactions/tx-test"];
  delete responses["/api/tasks/task-test"];
  URL.createObjectURL = vi.fn(() => "blob:nexaflow-test");
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
  globalThis.fetch = vi.fn(async (url) => {
    const path = new URL(url).pathname;
    return {
      ok: true,
      status: 200,
      json: async () => responses[path] || [],
    };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("NexaFlow", () => {
  it("exibe login e permite abrir o cadastro", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("img", { name: "Logo NexaFlow" })).toHaveAttribute(
      "src",
      "/nexaflow-mark.svg",
    );
    expect(screen.getByRole("heading", { name: "Entre no NexaFlow" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar uma nova conta" }));

    expect(screen.getByRole("heading", { name: "Crie seu acesso" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu nome")).toBeInTheDocument();
  });

  it("entra com a conta demonstrativa", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Usar conta demonstrativa" }));

    expect(await screen.findByText("Usuário Demo")).toBeInTheDocument();
    expect(await screen.findByText("Mercado")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Nexa Score/ })).toBeInTheDocument();
    expect(localStorage.getItem("nexaflow-token")).toBe("demo-local-token");
    expect(localStorage.getItem("nexaflow-demo-mode")).toBe("true");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("envia somente email e senha no login", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText("seuemail@exemplo.com"), "heitor@example.com");
    await user.type(screen.getByPlaceholderText("Senha"), "senha-segura-123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "heitor@example.com",
          password: "senha-segura-123",
        }),
      }),
    );
  });

  it("valida email e senha antes de tentar entrar", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Informe um email válido.")).toBeInTheDocument();
    expect(screen.getByText("A senha deve ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("carrega o painel financeiro com dados da API", async () => {
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(await screen.findByText("Heitor Teste")).toBeInTheDocument();
    expect(screen.queryByTitle("Estudos")).not.toBeInTheDocument();
    expect(await screen.findByText("Salario de teste")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Gráfico de onda de saldo" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Gráfico de barras horizontais dos gastos por categoria" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Nexa Score 78 de 100" })).toBeInTheDocument();
    expect(screen.getByText("Previsão de saldo")).toBeInTheDocument();
    expect(screen.getByText("Projeção positiva")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/transactions",
      expect.any(Object),
    );
  });

  it("permite comparar dois meses no painel financeiro", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Comparar meses" }));

    expect(screen.getByLabelText("Mês principal")).toBeInTheDocument();
    expect(screen.getByLabelText("Mês para comparar")).toBeInTheDocument();
    expect(screen.getByText("Diferença de saldo entre os meses")).toBeInTheDocument();
  });

  it("alterna o indicador do gráfico de onda", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await screen.findByRole("img", { name: "Gráfico de onda de saldo" });
    const metricSelector = screen.getByRole("group", { name: "Indicador do gráfico de onda" });
    await user.click(within(metricSelector).getByRole("button", { name: "Entradas" }));

    expect(screen.getByRole("img", { name: "Gráfico de onda de entradas" })).toBeInTheDocument();
    expect(screen.getByText("Período anterior")).toBeInTheDocument();
  });

  it("abre o Mikal e responde usando os dados da conta", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Abrir Mikal" }));
    expect(screen.getByRole("dialog", { name: "Mikal" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Qual meu saldo em 30 dias?" }));

    expect(
      screen.getByText(/a projeção de saldo em 30 dias é R\$ 4.550,00/i),
    ).toBeInTheDocument();
  });

  it("exibe um estado vazio em vez de graficos zerados", async () => {
    responses["/api/transactions"] = [];
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(
      await screen.findByText("Adicione transações para visualizar sua evolução mensal."),
    ).toBeInTheDocument();
  });

  it("usa categorias predefinidas e toggle para o tipo da transacao", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    const category = await screen.findByLabelText("Categoria");
    expect(category).toHaveTextContent("Alimentação");
    expect(screen.getByRole("button", { name: "Saída" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Entrada" }));

    expect(screen.getByRole("button", { name: "Entrada" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(category).toHaveTextContent("Freelance");
  });

  it("mostra validacao visual ao enviar uma transacao incompleta", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Adicionar transação" }));

    expect(screen.getByText("Informe uma descrição com pelo menos 2 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Selecione uma categoria.")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toHaveAttribute("aria-invalid", "true");
  });

  it("filtra o dashboard por período", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(await screen.findByText("Aluguel de teste")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar período"), "month");

    expect(screen.queryByText("Aluguel de teste")).not.toBeInTheDocument();
    expect(screen.getByText("Salario de teste")).toBeInTheDocument();
  });

  it("exporta somente as transações filtradas em CSV", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await screen.findByText("Salario de teste");
    await user.selectOptions(screen.getByLabelText("Filtrar período"), "month");
    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:nexaflow-test");
  });

  it("permite editar uma transação inline", async () => {
    const user = userEvent.setup();
    responses["/api/transactions/tx-test"] = {
      ...defaultTransactions[0],
      description: "Salario atualizado",
      category: "Freelance",
      amount: 6100,
    };
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click((await screen.findAllByRole("button", { name: "Editar transação" }))[0]);
    const description = screen.getByLabelText("Editar descrição da transação");
    const category = screen.getByLabelText("Editar categoria da transação");
    const amount = screen.getByLabelText("Editar valor da transação");

    await user.clear(description);
    await user.type(description, "Salario atualizado");
    await user.selectOptions(category, "Freelance");
    await user.clear(amount);
    await user.type(amount, "6100");
    await user.click(screen.getByRole("button", { name: "Salvar transação" }));

    expect(await screen.findByText("Salario atualizado")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/transactions/tx-test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          amount: 6100,
          category: "Freelance",
          description: "Salario atualizado",
          type: "income",
        }),
      }),
    );
  });

  it("navega para o Taskly e exibe as tarefas", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));

    expect(await screen.findByRole("heading", { level: 1, name: "Taskly" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/taskly");
    expect(await screen.findByText("Publicar NexaFlow")).toBeInTheDocument();
    expect(screen.getByText("Vence hoje")).toBeInTheDocument();
    expect(screen.getByLabelText("Prazo da tarefa")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por prazo")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "100% pendentes" })).toBeInTheDocument();
  });

  it("permite editar titulo, prioridade e prazo de uma tarefa", async () => {
    const user = userEvent.setup();
    responses["/api/tasks/task-test"] = {
      ...defaultTasks[0],
      title: "Publicar versao final",
      priority: "baixa",
      dueDate: todayDate,
    };
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));
    await user.click(await screen.findByRole("button", { name: "Editar tarefa" }));

    const title = screen.getByLabelText("Editar título da tarefa");
    const priority = screen.getByLabelText("Editar prioridade da tarefa");
    expect(screen.getByRole("button", { name: "Salvar tarefa" })).toBeInTheDocument();
    await user.clear(title);
    expect(screen.getByRole("button", { name: "Salvar tarefa" })).toBeInTheDocument();
    await user.type(title, "Publicar versao final");
    expect(screen.getByRole("button", { name: "Salvar tarefa" })).toBeInTheDocument();
    await user.selectOptions(priority, "baixa");
    await user.click(screen.getByRole("button", { name: "Salvar tarefa" }));

    expect(await screen.findByText("Publicar versao final")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/tasks/task-test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          title: "Publicar versao final",
          priority: "baixa",
          dueDate: todayDate,
        }),
      }),
    );
  });

  it("abre o calendário customizado para escolher o prazo", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));
    await user.click(screen.getByLabelText("Prazo da tarefa"));

    expect(screen.getByRole("button", { name: "Remover prazo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });

  it("alterna entre lista e Kanban e move uma tarefa concluida", async () => {
    const user = userEvent.setup();
    responses["/api/tasks/task-test"] = { ...defaultTasks[0], done: true };
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));
    await user.click(await screen.findByTitle("Kanban"));

    expect(screen.getByRole("heading", { name: "Pendentes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Concluídas" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluir tarefa" }));

    expect(await screen.findByRole("button", { name: "Reabrir tarefa" })).toBeInTheDocument();
  });
});
