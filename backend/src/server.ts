import { app } from "./app.js";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "NexaFlow API iniciada");
});

async function shutdown() {
  logger.info("Encerrando NexaFlow API");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
