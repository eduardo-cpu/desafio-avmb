const { randomUUID, createHash } = require('crypto');
const alunoService = require('./aluno.service');
const { setTimeout: delay } = require('timers/promises');

const IMPORT_QUEUE_DELAY_MS = Number.parseInt(process.env.IMPORT_QUEUE_DELAY_MS || '50', 10);
const IMPORT_QUEUE_MAX_JOBS = Number.parseInt(process.env.IMPORT_QUEUE_MAX_JOBS || '10000', 10);

const jobs = new Map();
const queue = [];
let processing = false;

function nowIso() {
  return new Date().toISOString();
}

function sanitizeJob(job) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    total: job.total,
    importados: job.importados,
    erros: job.erros,
    errosDetalhes: job.errosDetalhes,
    message: job.message,
  };
}

function cleanupFinishedJobs() {
  if (jobs.size <= IMPORT_QUEUE_MAX_JOBS) return;

  const finished = [];
  for (const job of jobs.values()) {
    if (job.status === 'completed' || job.status === 'failed') {
      finished.push(job);
    }
  }

  finished.sort(
    (a, b) => new Date(a.finishedAt || a.createdAt) - new Date(b.finishedAt || b.createdAt),
  );

  while (jobs.size > IMPORT_QUEUE_MAX_JOBS && finished.length > 0) {
    const oldest = finished.shift();
    jobs.delete(oldest.id);
  }
}

async function runQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const jobId = queue.shift();
    const job = jobs.get(jobId);

    if (!job || job.status !== 'pending') {
      continue;
    }

    job.status = 'processing';
    job.startedAt = nowIso();

    try {
      const { resultados, errosGerais } = await alunoService.importarAlunos(
        job.lista,
        job.institutionId,
      );

      const todosComErro = resultados.length === 0 && errosGerais.length > 0;
      const parcialmenteImportado = resultados.length > 0 && errosGerais.length > 0;
      job.status = todosComErro ? 'completed_with_errors'
        : parcialmenteImportado ? 'completed_with_errors'
        : 'completed';
      job.importados = resultados.length;
      job.erros = errosGerais.length;
      job.errosDetalhes = errosGerais;
      job.message = todosComErro
        ? 'Nenhum aluno importado — verifique os erros de validação'
        : parcialmenteImportado
        ? `${resultados.length} importado(s), ${errosGerais.length} com erro`
        : 'Importação concluída';
      job.finishedAt = nowIso();
    } catch (error) {
      job.status = 'failed';
      job.importados = 0;
      job.erros = job.total;
      job.message = error.message;
      job.finishedAt = nowIso();
    }

    cleanupFinishedJobs();

    if (IMPORT_QUEUE_DELAY_MS > 0 && queue.length > 0) {
      await delay(IMPORT_QUEUE_DELAY_MS);
    }
  }

  processing = false;
}

function calcularFingerprint(lista, institutionId) {
  const key = JSON.stringify(lista) + institutionId;
  return createHash('sha256').update(key).digest('hex');
}

function enqueueImport(lista, institutionId) {
  const fingerprint = calcularFingerprint(lista, institutionId);

  for (const job of jobs.values()) {
    if (
      job.fingerprint === fingerprint &&
      job.institutionId === institutionId &&
      (job.status === 'pending' || job.status === 'processing')
    ) {
      let posicaoFila = 0;
      if (job.status === 'pending') {
        const index = queue.indexOf(job.id);
        posicaoFila = index >= 0 ? index + 1 : 0;
      }
      return { ...sanitizeJob(job), posicaoFila };
    }
  }

  const id = randomUUID();
  const createdAt = nowIso();

  const job = {
    id,
    institutionId,
    fingerprint,
    status: 'pending',
    createdAt,
    startedAt: null,
    finishedAt: null,
    total: lista.length,
    importados: 0,
    erros: 0,
    errosDetalhes: [],
    message: 'Importação enfileirada',
    lista,
  };

  jobs.set(id, job);
  const posicaoFila = queue.push(id);

  runQueue().catch((error) => {
    console.error('Erro no worker da fila de importação:', error);
  });

  return {
    ...sanitizeJob(job),
    posicaoFila,
  };
}

function getImportStatus(jobId, institutionId) {
  const job = jobs.get(jobId);
  if (!job || job.institutionId !== institutionId) {
    return null;
  }

  let posicaoFila = 0;
  if (job.status === 'pending') {
    const index = queue.indexOf(jobId);
    posicaoFila = index >= 0 ? index + 1 : 0;
  }

  return {
    ...sanitizeJob(job),
    posicaoFila,
  };
}

module.exports = {
  enqueueImport,
  getImportStatus,
};
