import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectAccessible(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
}

test("landing e login nao possuem violacoes criticas de acessibilidade", async ({ page }) => {
  await page.goto("/");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Criar conta gratuita" }).click();
  await expectAccessible(page);
});

test("dashboard e Taskly nao possuem violacoes criticas de acessibilidade", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Usar conta demonstrativa" }).click();
  await expect(page).toHaveURL(/\/financas$/);
  await expectAccessible(page);
  await page.getByRole("navigation", { name: /principal/i }).getByRole("button", { name: "Taskly" }).click();
  await expectAccessible(page);
});
