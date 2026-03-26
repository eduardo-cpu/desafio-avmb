import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
import request from 'supertest';

const _require = createRequire(import.meta.url);

// Criar mocks antes de qualquer carregamento de módulo
const mockPrisma = {
  aluno: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  curso: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockGerarXml = vi.fn().mockReturnValue('/tmp/certificado-test.xml');
const mockDispararWebhook = vi.fn().mockResolvedValue(undefined);

// Injetar mocks no cache do require ANTES de carregar o app
const modelsPath = _require.resolve('../models');
const xmlPath = _require.resolve('../services/xml.service');
const webhookPath = _require.resolve('../services/webhook.service');
const morganPath = _require.resolve('morgan');

_require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: mockPrisma,
};
_require.cache[xmlPath] = {
  id: xmlPath,
  filename: xmlPath,
  loaded: true,
  exports: { gerarXml: mockGerarXml },
};
_require.cache[webhookPath] = {
  id: webhookPath,
  filename: webhookPath,
  loaded: true,
  exports: { dispararWebhook: mockDispararWebhook },
};
_require.cache[morganPath] = {
  id: morganPath,
  filename: morganPath,
  loaded: true,
  exports: vi.fn(() => (_req, _res, next) => next()),
};

// Definir variáveis de ambiente antes de carregar o app
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'http://localhost';

const app = _require('../config/app');
const jwt = _require('jsonwebtoken');

// Token válido para todos os testes autenticados
const TOKEN = jwt.sign({ institutionId: 'inst-1' }, 'test-secret', { expiresIn: '1h' });
const AUTH = { Authorization: `Bearer ${TOKEN}` };

// Fixture base reutilizada nos testes
const ALUNO_BASE = {
  id: 'aluno-1',
  nome: 'Eduardo Santos',
  cpf: '52998224725',
  dtNascimento: new Date('1995-01-15'),
  urlCallback: 'https://webhook.site/teste',
  status: 'PENDENTE',
  hash: null,
  filePath: null,
  instituicaoId: 'inst-1',
  cursoId: 'curso-1',
  deletedAt: null,
  createdAt: new Date(),
  curso: {
    id: 'curso-1',
    nome: 'Node.js Avançado',
    codigo: 'NODE-01',
    dtInicio: new Date('2026-01-01'),
    dtFim: new Date('2026-06-30'),
    docente: 'Prof. Silva',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Defaults seguros para evitar chamadas reais ao banco
  mockPrisma.aluno.findMany.mockResolvedValue([]);
  mockPrisma.aluno.findFirst.mockResolvedValue(null);
  mockPrisma.aluno.create.mockResolvedValue(null);
  mockPrisma.aluno.update.mockResolvedValue(null);
  mockPrisma.aluno.count.mockResolvedValue(0);
  mockPrisma.aluno.count.mockResolvedValue(0);
  mockPrisma.curso.findFirst.mockResolvedValue(null);
  mockPrisma.curso.create.mockResolvedValue(null);
  mockGerarXml.mockReturnValue('/tmp/certificado-test.xml');
  mockDispararWebhook.mockResolvedValue(undefined);
  mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
});

// ─── Middleware de Autenticação ───────────────────────────────────────────────

describe('Middleware de autenticação', () => {
  test('401 - requisição sem token é rejeitada', async () => {
    const res = await request(app).get('/api/alunos');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('401 - token inválido é rejeitado', async () => {
    const res = await request(app).get('/api/alunos').set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ─── Listar Alunos ────────────────────────────────────────────────────────────

describe('GET /api/alunos', () => {
  test('200 - lista todos os alunos da instituição com paginação', async () => {
    mockPrisma.aluno.findMany.mockResolvedValue([ALUNO_BASE]);
    mockPrisma.aluno.count.mockResolvedValue(1);

    const res = await request(app).get('/api/alunos').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.alunos).toHaveLength(1);
    expect(res.body.alunos[0].nome).toBe(ALUNO_BASE.nome);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  test('200 - retorna lista vazia quando não há alunos', async () => {
    mockPrisma.aluno.findMany.mockResolvedValue([]);
    mockPrisma.aluno.count.mockResolvedValue(0);

    const res = await request(app).get('/api/alunos').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.alunos).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// ─── Buscar Aluno por ID ──────────────────────────────────────────────────────

describe('GET /api/alunos/:id', () => {
  test('200 - retorna aluno encontrado', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_BASE);

    const res = await request(app).get('/api/alunos/aluno-1').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe(ALUNO_BASE.nome);
  });

  test('404 - aluno não encontrado', async () => {
    const res = await request(app).get('/api/alunos/id-inexistente').set(AUTH);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ─── Cancelar Aluno ───────────────────────────────────────────────────────────

describe('PATCH /api/alunos/:id/cancelar', () => {
  test('200 - cancela aluno com sucesso', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_BASE);
    mockPrisma.aluno.update.mockResolvedValue({ ...ALUNO_BASE, status: 'CANCELADO' });

    const res = await request(app).patch('/api/alunos/aluno-1/cancelar').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('400 - aluno já está cancelado', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue({ ...ALUNO_BASE, status: 'CANCELADO' });

    const res = await request(app).patch('/api/alunos/aluno-1/cancelar').set(AUTH);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});

// ─── Gerar Hash / Certificado ─────────────────────────────────────────────────

describe('POST /api/alunos/:id/gerar-hash', () => {
  test('200 - gera certificado com sucesso', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_BASE); // sem hash ainda
    mockPrisma.aluno.update.mockResolvedValue({
      ...ALUNO_BASE,
      hash: 'abc123hash',
      filePath: '/tmp/cert.xml',
      status: 'CERTIFICADO',
    });

    const res = await request(app).post('/api/alunos/aluno-1/gerar-hash').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('CERTIFICADO');
  });

  test('409 - hash já foi gerado anteriormente', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue({
      ...ALUNO_BASE,
      hash: 'hash-existente',
      status: 'CERTIFICADO',
    });

    const res = await request(app).post('/api/alunos/aluno-1/gerar-hash').set(AUTH);

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
  });

  test('404 - aluno não encontrado', async () => {
    const res = await request(app).post('/api/alunos/aluno-1/gerar-hash').set(AUTH);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
