import { vi, describe, test, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

const mockAlunoService = {
  importarAlunos: vi.fn(() => new Promise(() => {})),
};

const alunoServicePath = _require.resolve('../services/aluno.service');
_require.cache[alunoServicePath] = {
  id: alunoServicePath,
  filename: alunoServicePath,
  loaded: true,
  exports: mockAlunoService,
};

const { enqueueImport } = _require('../services/import-queue.service');

const listaBase = [
  {
    nome: 'Eduardo Santos',
    cpf: '52998224725',
    dt_nascimento: '1990-01-01',
    url_callback: 'https://webhook.site/teste',
    curso: {
      nome: 'Node.js',
      codigo: 'NODE-01',
      dt_inicio: '2026-01-01',
      dt_fim: '2026-06-30',
      docente: 'Prof. Silva',
    },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('import-queue.service - idempotência', () => {
  test('submeter o mesmo payload duas vezes retorna o mesmo job enquanto ativo', () => {
    const job1 = enqueueImport(listaBase, 'inst-idem-1');
    const job2 = enqueueImport(listaBase, 'inst-idem-1');

    expect(job1.id).toBe(job2.id);
    expect(['pending', 'processing']).toContain(job2.status);
  });

  test('payloads diferentes criam jobs distintos', () => {
    const listaA = [{ ...listaBase[0], cpf: '11111111111' }];
    const listaB = [{ ...listaBase[0], cpf: '22222222222' }];

    const job1 = enqueueImport(listaA, 'inst-idem-2');
    const job2 = enqueueImport(listaB, 'inst-idem-2');

    expect(job1.id).not.toBe(job2.id);
  });

  test('mesmo payload de instituições diferentes criam jobs distintos', () => {
    const job1 = enqueueImport(listaBase, 'inst-idem-3A');
    const job2 = enqueueImport(listaBase, 'inst-idem-3B');

    expect(job1.id).not.toBe(job2.id);
  });
});
