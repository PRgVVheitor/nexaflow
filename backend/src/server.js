import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./db.js";

const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`API running on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
