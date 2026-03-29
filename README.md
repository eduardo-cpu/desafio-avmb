Plataforma para instituições de ensino gerenciarem alunos, importarem dados via JSON, emitirem certificados em XML e notificarem alunos via webhook.

---

## Tecnologias

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT  
**Frontend:** Vue 3, Vite, Pinia, Vue Router, Axios  
**Infra:** Docker, Docker Compose, Nginx

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Git

---

## Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/eduardo-cpu/desafio-avmb.git
cd desafio-avmb
```

### 2. Configure as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite o `backend/.env` e ajuste as variáveis conforme necessário. Principais:

| Variável       | Descrição                               | Padrão             |
| -------------- | --------------------------------------- | ------------------ |
| `JWT_SECRET`   | Chave secreta do JWT                    | —                  |
| `FRONTEND_URL` | URL base do frontend (usada no webhook) | `http://localhost` |
| `DATABASE_URL` | String de conexão do PostgreSQL         | —                  |

### 3. Suba os containers

```bash
npm run dev
# ou
docker compose up --build
# caso a migration não funcione de primeira utilize após iniciar o docker
docker exec -it desafioavmb_backend npx prisma migrate deploy

```

| Serviço       | URL                   |
| ------------- | --------------------- |
| App           | http://localhost      |
| API           | http://localhost/api  |
| Banco         | localhost:5432        |
| Prisma Studio | http://localhost:5555 |

As migrations são aplicadas automaticamente na inicialização.

### Prisma Studio (opcional)

Para inspecionar o banco via interface visual:

```bash
docker compose exec -d backend npx prisma studio --port 5555 --browser none
```

Acesse em **http://localhost:5555**.

---

## Scripts disponíveis (raiz)

```bash
npm run dev          # Sobe todos os containers
npm run dev:build    # Rebuild e sobe
npm run stop         # Para os containers
npm run stop:volumes # Para e remove volumes (reseta o banco)
npm run logs         # Logs de todos os serviços
npm run logs:backend # Logs só do backend
npm run logs:frontend # Logs só do frontend
npm run test         # Roda testes do backend e frontend
npm run test:backend # Só backend
npm run test:frontend # Só frontend
```

---

## Funcionalidades

- **Autenticação** — cadastro e login de instituições com JWT (senha com bcrypt)
- **Dashboard** — visão geral com totais por status e alunos recentes
- **Importação via JSON** — importação em lote com fila assíncrona, validação por JSON Schema e CPF
- **Geração de certificado** — hash SHA-256 imutável + arquivo XML
- **Download de XML** — download do certificado pela área autenticada ou pela URL pública
- **Webhook** — notificação automática ao aluno com link de consulta pública
- **Consulta pública** — página acessível via `/validar/:hash` sem autenticação
- **Cancelamento** — soft delete que preserva histórico e libera o CPF+curso para reimportação

### Fluxo de status do aluno

```
PENDENTE → CERTIFICADO
PENDENTE → CANCELADO
CERTIFICADO → CANCELADO
```

Alunos cancelados **não podem ser certificados**. O cancelamento não remove o registro do banco — ele é preservado para auditoria e o slot CPF+curso é liberado para uma nova importação com dados corretos.

### Idempotência

| Ponto              | Comportamento                                                        |
| ------------------ | -------------------------------------------------------------------- |
| Geração de hash    | Bloqueada se o hash já existe — retorna `409 Conflict`               |
| Hash em si         | Determinístico: `SHA-256(cpf + cursoId + instituicaoId + createdAt)` |
| Webhook            | Disparado apenas uma vez por hash (deduplicação em memória)          |
| Fila de importação | Mesmo payload ativo não cria novo job — retorna o job existente      |

---

## API — Endpoints principais

### Autenticação

| Método | Rota                 | Descrição                        |
| ------ | -------------------- | -------------------------------- |
| `POST` | `/api/auth/register` | Cadastrar instituição            |
| `POST` | `/api/auth/login`    | Login — retorna JWT              |
| `GET`  | `/api/auth/me`       | Dados da instituição autenticada |

### Alunos (requer `Authorization: Bearer <token>`)

| Método  | Rota                               | Descrição                             |
| ------- | ---------------------------------- | ------------------------------------- |
| `GET`   | `/api/alunos`                      | Listar alunos da instituição          |
| `GET`   | `/api/alunos/stats`                | Totais por status (dashboard)         |
| `GET`   | `/api/alunos/:id`                  | Buscar aluno por ID                   |
| `POST`  | `/api/alunos/import`               | Importar alunos via JSON (assíncrono) |
| `GET`   | `/api/alunos/import/:jobId/status` | Consultar status do job de importação |
| `POST`  | `/api/alunos/:id/gerar-hash`       | Gerar certificado (hash + XML)        |
| `GET`   | `/api/alunos/:id/download`         | Baixar XML do certificado             |
| `PATCH` | `/api/alunos/:id/cancelar`         | Cancelar aluno                        |

### Pública (sem autenticação)

| Método | Rota                          | Descrição                       |
| ------ | ----------------------------- | ------------------------------- |
| `GET`  | `/api/validar/:hash`          | Consultar certificado pelo hash |
| `GET`  | `/api/validar/:hash/download` | Baixar XML pelo hash            |

## Arquitetura

Todo o tráfego passa pelo Nginx na porta 80:

```
Navegador
    │
    ▼
nginx:80
    ├── /api/*  ──▶  backend:3000  (API REST + JWT)
    └── /*      ──▶  frontend:5173 (Vue 3 + Vite)
```

O backend e o frontend **não expõem portas diretamente ao host** — apenas o Nginx é ponto de entrada. O Prisma Studio fica disponível em `localhost:5555` somente para uso em desenvolvimento.

---

## Estrutura do projeto

```
desafio-avmb/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── schemas/          # JSON Schema de validação
│       └── services/         # hash, xml, webhook, validation, import-queue
├── frontend/
│   └── src/
│       ├── api/
│       ├── router/
│       ├── stores/           # Pinia: auth, alunos, dashboard, toast
│       └── views/            # Login, Dashboard, Alunos, Importar, Validar
├── nginx/
│   └── nginx.conf            # Proxy reverso — /api → backend, / → frontend
├── docker-compose.yml
└── package.json              # Scripts raiz
```
