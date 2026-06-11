import { prisma } from "./db.js";

function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonthKey(key: string): [number, number] {
  const [year, month] = key.split("-").map(Number);
  return [year!, month!];
}

function nextMonthKey(key: string) {
  const [year, month] = parseMonthKey(key);
  return month === 12 ? monthKeyOf(year + 1, 1) : monthKeyOf(year, month + 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Lança as ocorrências pendentes das recorrências ativas do usuário,
 * uma por mês-competência, de forma idempotente (lastRunMonth guarda a
 * última competência materializada).
 */
export async function materializeRecurring(userId: string, now = new Date()) {
  const recurrences = await prisma.recurringTransaction.findMany({
    where: { userId, active: true },
  });
  if (!recurrences.length) return;

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentKey = monthKeyOf(now.getUTCFullYear(), now.getUTCMonth() + 1);

  for (const recurrence of recurrences) {
    const startKey = recurrence.lastRunMonth
      ? nextMonthKey(recurrence.lastRunMonth)
      : monthKeyOf(
          recurrence.createdAt.getUTCFullYear(),
          recurrence.createdAt.getUTCMonth() + 1,
        );

    const dueDates: Date[] = [];
    let cursor = startKey;
    while (cursor <= currentKey) {
      const [year, month] = parseMonthKey(cursor);
      const day = Math.min(recurrence.dayOfMonth, daysInMonth(year, month));
      const due = new Date(Date.UTC(year, month - 1, day));
      if (due > today) break;
      dueDates.push(due);
      cursor = nextMonthKey(cursor);
    }

    if (!dueDates.length) continue;

    const lastDue = dueDates[dueDates.length - 1]!;
    await prisma.$transaction([
      prisma.transaction.createMany({
        data: dueDates.map((date) => ({
          description: recurrence.description,
          category: recurrence.category,
          type: recurrence.type,
          amount: recurrence.amount,
          date,
          userId,
        })),
      }),
      prisma.recurringTransaction.update({
        where: { id: recurrence.id },
        data: {
          lastRunMonth: monthKeyOf(lastDue.getUTCFullYear(), lastDue.getUTCMonth() + 1),
        },
      }),
    ]);
  }
}
