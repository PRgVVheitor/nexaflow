import { app } from "./app.js";
import { prisma } from "./db.js";
import { env } from "./env.js";

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://127.0.0.1:${env.PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
