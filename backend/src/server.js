import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "db.json");
const port = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

async function readDatabase() {
  const file = await readFile(dbPath, "utf-8");
  return JSON.parse(file);
}

async function writeDatabase(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(data, null, 2));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "nexaflow-api",
  });
});

app.get("/api/transactions", async (req, res) => {
  const db = await readDatabase();
  res.json(db.transactions);
});

app.post("/api/transactions", async (req, res) => {
  const db = await readDatabase();
  const description = normalizeText(req.body.description);
  const category = normalizeText(req.body.category);
  const type = req.body.type === "income" ? "income" : "expense";
  const amount = normalizeAmount(req.body.amount);

  if (!description || !category || !amount) {
    res.status(400).json({ message: "Descricao, categoria e valor sao obrigatorios." });
    return;
  }

  const transaction = {
    id: randomUUID(),
    description,
    category,
    type,
    amount,
  };

  db.transactions = [transaction, ...db.transactions];
  await writeDatabase(db);
  res.status(201).json(transaction);
});

app.delete("/api/transactions/:id", async (req, res) => {
  const db = await readDatabase();
  const nextTransactions = db.transactions.filter((item) => item.id !== req.params.id);

  if (nextTransactions.length === db.transactions.length) {
    res.status(404).json({ message: "Transacao nao encontrada." });
    return;
  }

  db.transactions = nextTransactions;
  await writeDatabase(db);
  res.status(204).end();
});

app.get("/api/tasks", async (req, res) => {
  const db = await readDatabase();
  res.json(db.tasks);
});

app.post("/api/tasks", async (req, res) => {
  const db = await readDatabase();
  const title = normalizeText(req.body.title);
  const priorities = ["alta", "media", "baixa"];
  const priority = priorities.includes(req.body.priority) ? req.body.priority : "media";

  if (!title) {
    res.status(400).json({ message: "Titulo da tarefa e obrigatorio." });
    return;
  }

  const task = {
    id: randomUUID(),
    title,
    priority,
    done: false,
  };

  db.tasks = [task, ...db.tasks];
  await writeDatabase(db);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", async (req, res) => {
  const db = await readDatabase();
  const task = db.tasks.find((item) => item.id === req.params.id);

  if (!task) {
    res.status(404).json({ message: "Tarefa nao encontrada." });
    return;
  }

  task.done = Boolean(req.body.done);
  await writeDatabase(db);
  res.json(task);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const db = await readDatabase();
  const nextTasks = db.tasks.filter((item) => item.id !== req.params.id);

  if (nextTasks.length === db.tasks.length) {
    res.status(404).json({ message: "Tarefa nao encontrada." });
    return;
  }

  db.tasks = nextTasks;
  await writeDatabase(db);
  res.status(204).end();
});

app.get("/api/leads", async (req, res) => {
  const db = await readDatabase();
  res.json(db.leads);
});

app.post("/api/leads", async (req, res) => {
  const db = await readDatabase();
  const email = normalizeText(req.body.email).toLowerCase();

  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "Email invalido." });
    return;
  }

  const lead = {
    id: randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  };

  db.leads = [lead, ...db.leads];
  await writeDatabase(db);
  res.status(201).json(lead);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Erro interno no servidor." });
});

app.listen(port, () => {
  console.log(`API running on http://127.0.0.1:${port}`);
});
