# EduCert — Controle de Alunos

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
git clone https://github.com/seu-usuario/desafio-avmb.git
cd desafio-avmb
```

### 2. Configure as variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

### 3. Suba os containers

```bash
docker compose up --build
```

| Serviço  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3000 |
| Banco    | localhost:5432        |

### 4. Rode as migrations

Com os containers já rodando, em outro terminal:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

---

## Comandos úteis

```bash
# Subir em background
docker compose up -d

# Ver logs do backend
docker compose logs -f backend

# Parar tudo
docker compose down

# Parar e resetar o banco
docker compose down -v
```

---

## Estrutura do projeto

```
desafio-avmb/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   └── src/
│       ├── api/
│       ├── router/
│       ├── stores/
│       └── views/
└── docker-compose.yml
```
