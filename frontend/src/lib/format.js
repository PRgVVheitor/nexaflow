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

export function compactCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function displayCategory(category) {
  const labels = {
    Alimentacao: "Alimentação",
    Educacao: "Educação",
    Saude: "Saúde",
    Servicos: "Serviços",
  };
  return labels[category] || category;
}

export function displayPriority(priority) {
  return priority === "media" ? "média" : priority;
}

export function priorityVariant(priority) {
  if (priority === "alta") return "danger";
  if (priority === "media") return "warning";
  return "success";
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
