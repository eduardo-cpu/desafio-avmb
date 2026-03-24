require("dotenv").config();
const app = require("./config/app");
const prisma = require("./models");

const PORT = process.env.PORT || 3000;

async function start() {
  await prisma.$connect();
  console.log("Banco de dados conectado");
  app.listen(PORT, () =>
    console.log(`Backend rodando em http://localhost:${PORT}`),
  );
}

start().catch((err) => {
  console.error("Erro ao iniciar:", err);
  process.exit(1);
});
