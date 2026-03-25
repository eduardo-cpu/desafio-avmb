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

echo ">>> Aplicando migrations..."
npx prisma migrate deploy

echo ">>> Iniciando servidor..."
if [ "$NODE_ENV" = "production" ]; then
  exec npm start
else
  exec npm run dev
fi
