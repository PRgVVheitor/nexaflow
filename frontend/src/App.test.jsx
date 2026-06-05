import { cleanup, render, screen } from "@testing-library/react";
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
  "/api/tasks": defaultTasks,
};

beforeEach(() => {
  localStorage.clear();
  responses["/api/transactions"] = defaultTransactions;
  responses["/api/tasks"] = defaultTasks;
  delete responses["/api/tasks/task-test"];
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

    expect(screen.getByRole("heading", { name: "Entre no NexaFlow" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar uma nova conta" }));

    expect(screen.getByRole("heading", { name: "Crie seu acesso" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu nome")).toBeInTheDocument();
  });

  it("entra com a conta demonstrativa", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Usar conta demonstrativa" }));

    expect(await screen.findByText("Heitor Teste")).toBeInTheDocument();
    expect(localStorage.getItem("nexaflow-token")).toBe("token-demo");
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

    expect(screen.getByText("Informe um email valido.")).toBeInTheDocument();
    expect(screen.getByText("A senha deve ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("carrega o painel financeiro com dados da API", async () => {
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(await screen.findByText("Heitor Teste")).toBeInTheDocument();
    expect(screen.queryByTitle("Estudos")).not.toBeInTheDocument();
    expect(await screen.findByText("Salario de teste")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Grafico de onda do saldo mensal" })).toBeInTheDocument();
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

    expect(screen.getByLabelText("Mes principal")).toBeInTheDocument();
    expect(screen.getByLabelText("Mes para comparar")).toBeInTheDocument();
    expect(screen.getByText("Diferenca de saldo entre os meses")).toBeInTheDocument();
  });

  it("exibe um estado vazio em vez de graficos zerados", async () => {
    responses["/api/transactions"] = [];
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(
      await screen.findByText("Adicione transacoes para visualizar sua evolucao mensal."),
    ).toBeInTheDocument();
  });

  it("usa categorias predefinidas e toggle para o tipo da transacao", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    const category = await screen.findByLabelText("Categoria");
    expect(category).toHaveTextContent("Alimentacao");
    expect(screen.getByRole("button", { name: "Saida" })).toHaveAttribute(
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

    await user.click(await screen.findByRole("button", { name: "Adicionar transacao" }));

    expect(screen.getByText("Informe uma descricao com pelo menos 2 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Selecione uma categoria.")).toBeInTheDocument();
    expect(screen.getByLabelText("Descricao")).toHaveAttribute("aria-invalid", "true");
  });

  it("navega para o Taskly e exibe as tarefas", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));

    expect(await screen.findByRole("heading", { level: 1, name: "Taskly" })).toBeInTheDocument();
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
      dueDate: null,
    };
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));
    await user.click(await screen.findByRole("button", { name: "Editar tarefa" }));

    const title = screen.getByLabelText("Editar titulo da tarefa");
    await user.clear(title);
    await user.type(title, "Publicar versao final");
    await user.selectOptions(screen.getByLabelText("Editar prioridade da tarefa"), "baixa");
    await user.clear(screen.getByLabelText("Editar prazo da tarefa"));
    await user.click(screen.getByRole("button", { name: "Salvar tarefa" }));

    expect(await screen.findByText("Publicar versao final")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/tasks/task-test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          title: "Publicar versao final",
          priority: "baixa",
          dueDate: null,
        }),
      }),
    );
  });

  it("alterna entre lista e Kanban e move uma tarefa concluida", async () => {
    const user = userEvent.setup();
    responses["/api/tasks/task-test"] = { ...defaultTasks[0], done: true };
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));
    await user.click(await screen.findByTitle("Kanban"));

    expect(screen.getByRole("heading", { name: "Pendentes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Concluidas" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluir tarefa" }));

    expect(await screen.findByRole("button", { name: "Reabrir tarefa" })).toBeInTheDocument();
  });
});
