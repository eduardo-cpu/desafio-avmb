require("dotenv").config();
const app = require("./config/app");
const prisma = require("./models");

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET não está definido no .env");
  process.exit(1);
}

async function start() {
  await prisma.$connect();
  console.log("Banco de dados conectado");

  const server = app.listen(PORT, () =>
    console.log(`Backend rodando em http://localhost:${PORT}`),
  );

  async function shutdown(signal) {
    console.log(`\nRecebido ${signal}. Encerrando graciosamente...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Conexão com banco encerrada. Bye.");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Erro ao iniciar:", err);
  process.exit(1);
});
