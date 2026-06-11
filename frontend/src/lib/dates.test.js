import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  monthKey,
  shiftMonth,
  taskDeadline,
  taskMatchesDeadline,
  transactionDay,
  transactionMatchesPeriod,
} from "./dates";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 5, 10, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("monthKey e shiftMonth", () => {
  it("gera a chave do mês e desloca entre anos", () => {
    expect(monthKey(new Date(2026, 5, 10))).toBe("2026-06");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("transactionDay", () => {
  it("prefere o campo date e usa createdAt como reserva", () => {
    const withDate = transactionDay({ date: "2026-06-03", createdAt: "2026-01-01T12:00:00Z" });
    expect(monthKey(withDate)).toBe("2026-06");

    const withoutDate = transactionDay({ createdAt: "2026-05-03T12:00:00.000Z" });
    expect(monthKey(withoutDate)).toBe("2026-05");
  });
});

describe("transactionMatchesPeriod", () => {
  const inThisMonth = { date: "2026-06-03" };
  const lastMonth = { date: "2026-05-03" };

  it("aceita tudo no filtro all", () => {
    expect(transactionMatchesPeriod(lastMonth, "all", {})).toBe(true);
  });

  it("filtra pelo mês atual", () => {
    expect(transactionMatchesPeriod(inThisMonth, "month", {})).toBe(true);
    expect(transactionMatchesPeriod(lastMonth, "month", {})).toBe(false);
  });

  it("filtra por intervalo personalizado e rejeita intervalo invertido", () => {
    const period = { start: "2026-05-01", end: "2026-05-31" };
    expect(transactionMatchesPeriod(lastMonth, "custom", period)).toBe(true);
    expect(transactionMatchesPeriod(inThisMonth, "custom", period)).toBe(false);
    expect(
      transactionMatchesPeriod(lastMonth, "custom", { start: "2026-06-01", end: "2026-05-01" }),
    ).toBe(false);
  });
});

describe("taskMatchesDeadline", () => {
  it("classifica atrasadas, de hoje, próximas e sem prazo", () => {
    const overdue = { dueDate: "2026-06-09", done: false };
    const today = { dueDate: "2026-06-10", done: false };
    const upcoming = { dueDate: "2026-06-12", done: false };
    const noDeadline = { dueDate: null, done: false };

    expect(taskMatchesDeadline(overdue, "overdue")).toBe(true);
    expect(taskMatchesDeadline(today, "today")).toBe(true);
    expect(taskMatchesDeadline(upcoming, "upcoming")).toBe(true);
    expect(taskMatchesDeadline(noDeadline, "none")).toBe(true);
    expect(taskMatchesDeadline(overdue, "today")).toBe(false);
  });

  it("não marca tarefa concluída como atrasada", () => {
    expect(taskMatchesDeadline({ dueDate: "2026-06-01", done: true }, "overdue")).toBe(false);
  });
});

describe("taskDeadline", () => {
  it("monta o rótulo de prazo conforme o estado da tarefa", () => {
    expect(taskDeadline({ dueDate: null })).toMatchObject({ label: "Sem prazo" });
    expect(taskDeadline({ dueDate: "2026-06-10", done: false })).toMatchObject({
      label: "Vence hoje",
      variant: "warning",
    });
    expect(taskDeadline({ dueDate: "2026-06-11", done: false })).toMatchObject({
      label: "Vence amanhã",
    });
    expect(taskDeadline({ dueDate: "2026-06-08", done: false })).toMatchObject({
      label: "2 dias atrasada",
      variant: "danger",
    });
  });
});
