import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
import request from 'supertest';

const _require = createRequire(import.meta.url);

// Criar mocks antes de qualquer carregamento de módulo
const mockPrisma = {
  instituicao: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

const mockBcrypt = {
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn(),
  genSalt: vi.fn(),
  genSaltSync: vi.fn(),
  hashSync: vi.fn(),
  compareSync: vi.fn(),
};

// Injetar mocks no cache do require ANTES de carregar o app
const modelsPath = _require.resolve('../models');
const bcryptPath = _require.resolve('bcryptjs');
const morganPath = _require.resolve('morgan');

_require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: mockPrisma,
};
_require.cache[bcryptPath] = {
  id: bcryptPath,
  filename: bcryptPath,
  loaded: true,
  exports: mockBcrypt,
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

// Carregar app depois que os mocks já estão prontos no cache
const app = _require('../config/app');

beforeEach(() => {
  vi.clearAllMocks();
  mockBcrypt.hash.mockResolvedValue('hashed-password');
});

// ─── Cadastro de Instituição ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('201 - cadastra instituição com sucesso', async () => {
    mockPrisma.instituicao.findUnique.mockResolvedValue(null); // e-mail não existe
    mockPrisma.instituicao.create.mockResolvedValue({
      id: 'inst-1',
      nome: 'Faculdade Teste',
      email: 'faculdade@teste.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Faculdade Teste', email: 'faculdade@teste.com', senha: '123456' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.email).toBe('faculdade@teste.com');
  });

  test('400 - campos obrigatórios faltando', async () => {
    const res = await request(app).post('/api/auth/register').send({ nome: 'Faculdade Teste' }); // sem e-mail e senha

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('409 - e-mail já cadastrado', async () => {
    mockPrisma.instituicao.findUnique.mockResolvedValue({
      id: 'inst-1',
      email: 'faculdade@teste.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Faculdade Teste', email: 'faculdade@teste.com', senha: '123456' });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('200 - login com sucesso retorna token JWT', async () => {
    mockPrisma.instituicao.findUnique.mockResolvedValue({
      id: 'inst-1',
      nome: 'Faculdade Teste',
      email: 'faculdade@teste.com',
      senhaHash: 'hashed-password',
    });
    mockBcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculdade@teste.com', senha: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.instituicao.email).toBe('faculdade@teste.com');
  });

  test('400 - campos obrigatórios faltando', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'faculdade@teste.com' }); // sem senha

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('401 - senha incorreta', async () => {
    mockPrisma.instituicao.findUnique.mockResolvedValue({
      id: 'inst-1',
      email: 'faculdade@teste.com',
      senhaHash: 'hashed-password',
    });
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculdade@teste.com', senha: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('401 - e-mail não cadastrado', async () => {
    mockPrisma.instituicao.findUnique.mockResolvedValue(null);
    mockBcrypt.compare.mockResolvedValue(false); // dummy hash sempre roda

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@teste.com', senha: '123456' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });
});
