import { describe, expect, it } from "vitest";
import { buildFinancialIntelligence } from "../src/finance-intelligence.js";

const now = new Date("2026-06-06T12:00:00.000Z");

function transaction(daysAgo: number, type: string, amount: number, category = "Outros") {
  return {
    amount,
    category,
    date: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    type,
  };
}

describe("inteligência financeira", () => {
  it("calcula score e previsão de saldo explicáveis", () => {
    const result = buildFinancialIntelligence(
      [transaction(10, "income", 3000, "Renda"), transaction(9, "expense", 1000, "Moradia")],
      now,
    );

    expect(result.score.value).toBeGreaterThan(60);
    expect(result.forecast.currentBalance).toBe(2000);
    expect(result.forecast.periods).toHaveLength(3);
    expect(result.forecast.periods[2]!.balance).toBeGreaterThan(2000);
    expect(result.insights).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "savings" })]),
    );
  });

  it("detecta categoria com gasto semanal fora do padrão", () => {
    const result = buildFinancialIntelligence(
      [
        transaction(0, "expense", 300, "Lazer"),
        transaction(7, "expense", 100, "Lazer"),
        transaction(14, "expense", 100, "Lazer"),
        transaction(21, "expense", 100, "Lazer"),
        transaction(28, "expense", 100, "Lazer"),
      ],
      now,
    );

    expect(result.anomalies[0]!).toMatchObject({ category: "Lazer", percentage: 200 });
    expect(result.insights).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: "Gasto fora do padrão" })]),
    );
  });

  it("orienta o usuário quando ainda não existem dados", () => {
    const result = buildFinancialIntelligence([], now);

    expect(result.score.value).toBe(0);
    expect(result.forecast.periods[2]!.balance).toBe(0);
    expect(result.insights[0]!.id).toBe("start");
  });
});
