import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const responses = {
  "/api/transactions": [
    {
      id: "tx-test",
      description: "Salario de teste",
      category: "Renda",
      type: "income",
      amount: 5000,
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
  it("carrega o painel financeiro com dados da API", async () => {
    render(<App />);

    expect(screen.getByText("NexaFlow")).toBeInTheDocument();
    expect(await screen.findByText("Salario de teste")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/api/transactions",
      expect.any(Object),
    );
  });

  it("navega para o Taskly e exibe as tarefas", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTitle("Taskly"));

    expect(await screen.findByRole("heading", { level: 1, name: "Taskly" })).toBeInTheDocument();
    expect(await screen.findByText("Publicar NexaFlow")).toBeInTheDocument();
  });
});
