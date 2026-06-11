import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function dayOffset(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const transactions = [
  {
    id: "tx-1",
    description: "Salario",
    category: "Renda",
    type: "income",
    amount: 3200,
    date: dayOffset(-5),
  },
  {
    id: "tx-2",
    description: "Freelance landing page",
    category: "Renda",
    type: "income",
    amount: 850,
    date: dayOffset(-8),
  },
  {
    id: "tx-3",
    description: "Aluguel",
    category: "Moradia",
    type: "expense",
    amount: 1100,
    date: dayOffset(-3),
  },
  {
    id: "tx-4",
    description: "Mercado",
    category: "Alimentacao",
    type: "expense",
    amount: 540,
    date: dayOffset(-2),
  },
  {
    id: "tx-5",
    description: "Internet",
    category: "Servicos",
    type: "expense",
    amount: 120,
    date: dayOffset(-12),
  },
];

const goals = [
  { id: "goal-1", category: "Alimentacao", monthlyLimit: 800 },
  { id: "goal-2", category: "Moradia", monthlyLimit: 1500 },
  { id: "goal-3", category: "Lazer", monthlyLimit: 400 },
];

const tasks = [
  {
    id: "task-1",
    title: "Criar README do projeto",
    priority: "alta",
    done: false,
    dueDate: dayOffset(-1),
  },
  {
    id: "task-2",
    title: "Publicar no GitHub",
    priority: "media",
    done: false,
    dueDate: dayOffset(0),
  },
  {
    id: "task-3",
    title: "Revisar responsividade",
    priority: "baixa",
    done: true,
    dueDate: dayOffset(3),
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@nexaflow.app" },
    update: {
      name: "Usuario Demo",
      passwordHash,
    },
    create: {
      id: "demo-user",
      name: "Usuario Demo",
      email: "demo@nexaflow.app",
      passwordHash,
    },
  });

  await prisma.$transaction([
    ...transactions.map((transaction) =>
      prisma.transaction.upsert({
        where: { id: transaction.id },
        update: { ...transaction, userId: demoUser.id },
        create: { ...transaction, userId: demoUser.id },
      }),
    ),
    ...goals.map((goal) =>
      prisma.goal.upsert({
        where: { id: goal.id },
        update: { ...goal, userId: demoUser.id },
        create: { ...goal, userId: demoUser.id },
      }),
    ),
    ...tasks.map((task) =>
      prisma.task.upsert({
        where: { id: task.id },
        update: { ...task, userId: demoUser.id },
        create: { ...task, userId: demoUser.id },
      }),
    ),
  ]);
}

main()
  .then(async () => {
    console.log("Dados demonstrativos do NexaFlow sincronizados sem apagar registros.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
