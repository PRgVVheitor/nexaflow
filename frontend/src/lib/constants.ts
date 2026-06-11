import type { TransactionType } from "./types";

export const chartColors = ["#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa"];

export type WaveMetricKey = "balance" | "income" | "expense";

export const waveMetrics: Record<WaveMetricKey, { dataKey: WaveMetricKey; label: string }> = {
  balance: { dataKey: "balance", label: "Saldo" },
  income: { dataKey: "income", label: "Entradas" },
  expense: { dataKey: "expense", label: "Saídas" },
};

export const transactionCategories: Record<TransactionType, string[]> = {
  expense: [
    "Alimentacao",
    "Moradia",
    "Transporte",
    "Saude",
    "Educacao",
    "Lazer",
    "Servicos",
    "Outros",
  ],
  income: ["Renda", "Freelance", "Investimentos", "Outros"],
};
