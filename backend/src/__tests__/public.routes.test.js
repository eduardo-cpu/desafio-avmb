import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
import request from 'supertest';

const _require = createRequire(import.meta.url);

const mockPrisma = {
  aluno: {
    findFirst: vi.fn(),
  },
};

// Injetar mocks no cache do require ANTES de carregar o app.
const modelsPath = _require.resolve('../models');
const morganPath = _require.resolve('morgan');

_require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: mockPrisma,
};
_require.cache[morganPath] = {
  id: morganPath,
  filename: morganPath,
  loaded: true,
  exports: vi.fn(() => (_req, _res, next) => next()),
};

process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost';

// As rotas públicas delegam para public.controller, que por sua vez usa o mockPrisma acima
const app = _require('../config/app');

const ALUNO_CERTIFICADO = {
  id: 'aluno-1',
  nome: 'Eduardo Santos',
  cpf: '52998224725',
  dtNascimento: new Date('1995-01-15'),
  hash: 'abc123hashvalido',
  status: 'CERTIFICADO',
  filePath: null,
  deletedAt: null,
  curso: {
    nome: 'Node.js Avançado',
    codigo: 'NODE-01',
    dtInicio: new Date('2026-01-01'),
    dtFim: new Date('2026-06-30'),
    docente: 'Prof. Silva',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.aluno.findFirst.mockResolvedValue(null);
});

describe('GET /api/validar/:hash', () => {
  test('200 - retorna dados do certificado para hash válido', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_CERTIFICADO);

    const res = await request(app).get('/api/validar/abc123hashvalido');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.nome).toBe(ALUNO_CERTIFICADO.nome);
    expect(res.body.data.hash).toBe(ALUNO_CERTIFICADO.hash);
    expect(res.body.data.curso.nome).toBe(ALUNO_CERTIFICADO.curso.nome);
  });

  test('200 - CPF vem mascarado na resposta pública', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_CERTIFICADO);

    const res = await request(app).get('/api/validar/abc123hashvalido');

    // CPF 52998224725 deve aparecer como 529.982.247-25
    expect(res.body.data.cpf).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });

  test('404 - hash não encontrado', async () => {
    const res = await request(app).get('/api/validar/hash-que-nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('rota é pública — não exige token de autenticação', async () => {
    mockPrisma.aluno.findFirst.mockResolvedValue(ALUNO_CERTIFICADO);

    const res = await request(app).get('/api/validar/abc123hashvalido');

    expect(res.status).toBe(200);
  });
});
