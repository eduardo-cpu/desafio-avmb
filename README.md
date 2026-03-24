Plataforma para instituições de ensino gerenciarem alunos, importarem dados via JSON, emitirem certificados em XML e notificarem alunos via webhook.

---

## Tecnologias

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT  
**Frontend:** Vue 3, Vite, Pinia, Vue Router, Axios  
**Infra:** Docker, Docker Compose

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

| Variável | Descrição | Padrão |
|---|---|---|
| `JWT_SECRET` | Chave secreta do JWT | — |
| `FRONTEND_URL` | URL base do frontend (usada no webhook) | `http://localhost:5173` |
| `DATABASE_URL` | String de conexão do PostgreSQL | — |

### 3. Suba os containers

```bash
npm run dev
# ou
docker compose up --build
```

| Serviço  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| Banco    | localhost:5432        |

As migrations são aplicadas automaticamente na inicialização.

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

- **Autenticação** — cadastro e login de instituições com JWT
- **Dashboard** — visão geral com totais por status e alunos recentes
- **CRUD de alunos** — criar, editar, visualizar e cancelar (soft delete)
- **Importação via JSON** — importação em lote com validação por JSON Schema e CPF
- **Geração de certificado** — hash SHA-256 imutável + arquivo XML
- **Download de XML** — download do certificado pela área autenticada
- **Webhook** — notificação automática ao aluno com link de consulta pública
- **Consulta pública** — página acessível via `/validar/:hash` sem autenticação

### Fluxo de status do aluno

```
PENDENTE → CERTIFICADO
PENDENTE → CANCELADO
CERTIFICADO → CANCELADO
```

Alunos certificados ou cancelados **não podem ser editados**.

---

## API — Endpoints principais

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastrar instituição |
| `POST` | `/api/auth/login` | Login — retorna JWT |

### Alunos (requer `Authorization: Bearer <token>`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/alunos` | Listar alunos da instituição |
| `POST` | `/api/alunos` | Criar aluno |
| `POST` | `/api/alunos/import` | Importar alunos via JSON |
| `PUT` | `/api/alunos/:id` | Editar aluno |
| `POST` | `/api/alunos/:id/gerar-hash` | Gerar certificado |
| `GET` | `/api/alunos/:id/download` | Baixar XML do certificado |
| `PATCH` | `/api/alunos/:id/cancelar` | Cancelar aluno |

### Pública (sem autenticação)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/validar/:hash` | Consultar certificado pelo hash |
| `GET` | `/api/validar/:hash/download` | Baixar XML pelo hash |

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
│       └── services/         # hash, xml, webhook, validation
├── frontend/
│   └── src/
│       ├── api/
│       ├── router/
│       ├── stores/           # Pinia: auth, alunos, dashboard
│       └── views/            # Login, Dashboard, Alunos, Importar, Validar
├── docker-compose.yml
└── package.json              # Scripts raiz
```
