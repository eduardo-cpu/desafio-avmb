import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';
import request from 'supertest';

const _require = createRequire(import.meta.url);

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
  instituicao: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockImportService = {
  enfileirarImportacao: vi.fn(),
  consultarStatusImportacao: vi.fn(),
};

const modelsPath = _require.resolve('../models');
const importServicePath = _require.resolve('../services/import.service');
const morganPath = _require.resolve('morgan');

_require.cache[modelsPath] = {
  id: modelsPath,
  filename: modelsPath,
  loaded: true,
  exports: mockPrisma,
};
_require.cache[importServicePath] = {
  id: importServicePath,
  filename: importServicePath,
  loaded: true,
  exports: mockImportService,
};
_require.cache[morganPath] = {
  id: morganPath,
  filename: morganPath,
  loaded: true,
  exports: vi.fn(() => (_req, _res, next) => next()),
};

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FRONTEND_URL = 'http://localhost';

const app = _require('../config/app');
const jwt = _require('jsonwebtoken');

const TOKEN = jwt.sign({ institutionId: 'inst-1' }, 'test-secret', { expiresIn: '1h' });
const AUTH = { Authorization: `Bearer ${TOKEN}` };

beforeEach(() => {
  vi.clearAllMocks();
  mockImportService.enfileirarImportacao.mockReturnValue({
    id: 'job-1',
    total: 1,
    posicaoFila: 1,
  });
  mockImportService.consultarStatusImportacao.mockReturnValue({
    id: 'job-1',
    institutionId: 'inst-1',
    status: 'pending',
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    total: 1,
    importados: 0,
    erros: 0,
    message: 'Importacao enfileirada',
    posicaoFila: 1,
  });
});

describe('Importacao em fila', () => {
  test('202 - enfileira importacao e retorna protocolo', async () => {
    const payload = {
      nome: 'Aluno Fila',
      cpf: '52998224725',
      dt_nascimento: '1990-01-01',
      url_callback: 'https://webhook.site/teste',
      curso: {
        nome: 'Node.js Avancado',
        codigo: 'NODE-01',
        dt_inicio: '2026-01-01',
        dt_fim: '2026-06-30',
        docente: 'Prof. Silva',
      },
    };

    const res = await request(app).post('/api/alunos/import').set(AUTH).send(payload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
    expect(res.body.protocolo).toBe('job-1');
    expect(res.body.statusUrl).toBe('/api/alunos/import/job-1/status');
    expect(mockImportService.enfileirarImportacao).toHaveBeenCalledTimes(1);
  });

  test('413 - retorna erro quando service rejeita lote acima do maximo', async () => {
    mockImportService.enfileirarImportacao.mockImplementationOnce(() => {
      const error = new Error('Lote excede o máximo permitido de 1000 itens');
      error.status = 413;
      throw error;
    });

    const payload = Array.from({ length: 1001 }, (_, i) => ({ nome: `Aluno ${i}` }));
    const res = await request(app).post('/api/alunos/import').set(AUTH).send(payload);

    expect(res.status).toBe(413);
    expect(res.body.status).toBe('error');
  });

  test('200 - retorna status da importacao pelo protocolo', async () => {
    const res = await request(app).get('/api/alunos/import/job-1/status').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe('job-1');
    expect(mockImportService.consultarStatusImportacao).toHaveBeenCalledWith('job-1', 'inst-1');
  });

  test('404 - protocolo inexistente', async () => {
    mockImportService.consultarStatusImportacao.mockImplementationOnce(() => {
      const error = new Error('Protocolo de importação não encontrado');
      error.status = 404;
      throw error;
    });

    const res = await request(app).get('/api/alunos/import/nao-existe/status').set(AUTH);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
