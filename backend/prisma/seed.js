import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const transactions = [
  { id: "tx-1", description: "Salario", category: "Renda", type: "income", amount: 3200 },
  {
    id: "tx-2",
    description: "Freelance landing page",
    category: "Renda",
    type: "income",
    amount: 850,
  },
  { id: "tx-3", description: "Aluguel", category: "Moradia", type: "expense", amount: 1100 },
  {
    id: "tx-4",
    description: "Mercado",
    category: "Alimentacao",
    type: "expense",
    amount: 540,
  },
  {
    id: "tx-5",
    description: "Internet",
    category: "Servicos",
    type: "expense",
    amount: 120,
  },
];

const tasks = [
  { id: "task-1", title: "Criar README do projeto", priority: "alta", done: false },
  { id: "task-2", title: "Publicar no GitHub", priority: "media", done: false },
  { id: "task-3", title: "Revisar responsividade", priority: "baixa", done: true },
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
