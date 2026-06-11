import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isBefore,
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BadgeVariant } from "../components/ui";

export interface DatedTransaction {
  date?: string;
  createdAt?: string;
}

export interface DeadlineTask {
  dueDate: string | null;
  done?: boolean;
}

export interface CustomPeriod {
  start?: string;
  end?: string;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(key: string, offset: number) {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year!, month! - 1 + offset, 1));
}

export function formatMonth(key: string, formatter: Intl.DateTimeFormat) {
  const [year, month] = key.split("-").map(Number);
  return formatter.format(new Date(year!, month! - 1, 1)).replace(".", "");
}

export function transactionDay(transaction: DatedTransaction) {
  return parseISO(transaction.date || transaction.createdAt || "");
}

export function transactionMatchesPeriod(
  transaction: DatedTransaction,
  filter: string,
  customPeriod: CustomPeriod,
) {
  if (filter === "all") return true;

  const transactionDate = transactionDay(transaction);
  if (Number.isNaN(transactionDate.getTime())) return false;

  const today = new Date();
  let start: Date;
  let end: Date;

  if (filter === "week") {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (filter === "month") {
    start = startOfMonth(today);
    end = endOfMonth(today);
  } else if (filter === "year") {
    start = startOfYear(today);
    end = endOfYear(today);
  } else {
    start = customPeriod.start ? startOfDay(parseISO(customPeriod.start)) : new Date(0);
    end = customPeriod.end ? endOfDay(parseISO(customPeriod.end)) : new Date(8640000000000000);
  }

  if (start > end) return false;
  return isWithinInterval(transactionDate, { start, end });
}

export function taskMatchesDeadline(task: DeadlineTask, filter: string) {
  if (filter === "all") return true;
  if (!task.dueDate) return filter === "none";

  const dueDate = parseISO(task.dueDate);
  const today = startOfDay(new Date());

  if (filter === "overdue") return !task.done && isBefore(dueDate, today);
  if (filter === "today") return isToday(dueDate);
  if (filter === "upcoming") return !isBefore(dueDate, today) && !isToday(dueDate);
  return false;
}

export interface DeadlineInfo {
  label: string;
  variant: BadgeVariant;
}

export function taskDeadline(task: DeadlineTask): DeadlineInfo {
  if (!task.dueDate) return { label: "Sem prazo", variant: "neutral" };

  const dueDate = parseISO(task.dueDate);
  const today = startOfDay(new Date());
  const formattedDate = format(dueDate, "dd 'de' MMM", { locale: ptBR }).replace(".", "");
  const daysUntilDue = differenceInCalendarDays(dueDate, today);

  if (task.done) return { label: `Prazo ${formattedDate}`, variant: "neutral" };
  if (isToday(dueDate)) return { label: "Vence hoje", variant: "warning" };
  if (isBefore(dueDate, today)) {
    const daysLate = Math.abs(daysUntilDue);
    return {
      label: `${daysLate} ${daysLate === 1 ? "dia" : "dias"} atrasada`,
      variant: "danger",
    };
  }
  if (daysUntilDue === 1) return { label: "Vence amanhã", variant: "default" };
  return { label: `Em ${daysUntilDue} dias - ${formattedDate}`, variant: "default" };
}
