import { expect, test } from "@playwright/test";

test.describe("fluxo da conta demonstrativa", () => {
  test("landing → login demo → criar transação → Taskly", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Suas finanças e tarefas em um painel único." }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Criar conta gratuita" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entre no NexaFlow" })).toBeVisible();

    await page.getByRole("button", { name: "Usar conta demonstrativa" }).click();
    await expect(page).toHaveURL(/\/financas$/);
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
    await expect(page.getByText("Demo local")).toBeVisible();
    await expect(page.getByText("Mercado").first()).toBeVisible();

    await page.getByLabel("Descrição", { exact: true }).fill("Compra teste E2E");
    await page.getByLabel("Categoria", { exact: true }).selectOption("Lazer");
    await page.getByLabel("Valor", { exact: true }).fill("123.45");
    await page.getByRole("button", { name: "Adicionar transação" }).click();

    await expect(page.getByText("Transação adicionada.")).toBeVisible();
    await expect(page.getByText("Compra teste E2E")).toBeVisible();

    await page.getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: "Taskly" })
      .click();
    await expect(page).toHaveURL(/\/taskly$/);
    await expect(page.getByRole("heading", { level: 1, name: "Taskly" })).toBeVisible();

    await page.getByLabel("Título da tarefa").fill("Tarefa criada no E2E");
    await page.getByRole("button", { name: "Adicionar tarefa" }).click();

    await expect(page.getByText("Tarefa adicionada.")).toBeVisible();
    await expect(page.getByText("Tarefa criada no E2E")).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(page.getByRole("heading", { name: "Entre no NexaFlow" })).toBeVisible();
  });
});
