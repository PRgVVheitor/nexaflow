import type { BadgeVariant } from "../components/ui";

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const shortMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
});

export const longMonth = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function displayCategory(category: string) {
  const labels: Record<string, string> = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

export function displayPriority(priority: string) {
  return priority === "media" ? "média" : priority;
}

export function priorityVariant(priority: string): BadgeVariant {
  if (priority === "alta") return "danger";
  if (priority === "media") return "warning";
  return "success";
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
