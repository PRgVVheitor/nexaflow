import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

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
  "/api/transactions": [
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
  ],
  "/api/tasks": [
    {
      id: "task-test",
      title: "Publicar NexaFlow",
      priority: "alta",
      done: false,
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
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

  it("carrega o painel financeiro com dados da API", async () => {
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    expect(await screen.findByText("Heitor Teste")).toBeInTheDocument();
    expect(screen.queryByTitle("Estudos")).not.toBeInTheDocument();
    expect(await screen.findByText("Salario de teste")).toBeInTheDocument();
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

  it("navega para o Taskly e exibe as tarefas", async () => {
    const user = userEvent.setup();
    localStorage.setItem("nexaflow-token", "token-test");
    render(<App />);

    await user.click(await screen.findByTitle("Taskly"));

    expect(await screen.findByRole("heading", { level: 1, name: "Taskly" })).toBeInTheDocument();
    expect(await screen.findByText("Publicar NexaFlow")).toBeInTheDocument();
  });
});
