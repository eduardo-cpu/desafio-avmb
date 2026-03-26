#!/bin/sh
set -e

if [ ! -d "node_modules" ]; then
  echo ">>> Instalando dependências..."
  npm install
else
  echo ">>> Dependências já instaladas, pulando npm install."
fi

echo ">>> Gerando Prisma Client..."
npx prisma generate

echo ">>> Aguardando banco de dados em postgres:5432..."
until node -e "
const net = require('net');
const t = setTimeout(() => process.exit(1), 1000);
const c = net.createConnection(5432, 'postgres', () => { clearTimeout(t); c.destroy(); process.exit(0); });
c.on('error', () => { clearTimeout(t); process.exit(1); });
" 2>/dev/null; do
  echo "  banco indisponível, aguardando 2s..."
  sleep 2
done

echo ">>> Aplicando migrations..."
npx prisma migrate deploy

echo ">>> Iniciando servidor..."
if [ "$NODE_ENV" = "production" ]; then
  exec npm start
else
  exec npm run dev
fi
