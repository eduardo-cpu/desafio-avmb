const { randomUUID } = require('crypto');
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

  finished.sort((a, b) => new Date(a.finishedAt || a.createdAt) - new Date(b.finishedAt || b.createdAt));

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
      const { resultados, errosGerais } = await alunoService.importarAlunos(job.lista, job.institutionId);

      job.status = 'completed';
      job.importados = resultados.length;
      job.erros = errosGerais.length;
      job.message = 'Importação concluída';
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

function enqueueImport(lista, institutionId) {
  const id = randomUUID();
  const createdAt = nowIso();

  const job = {
    id,
    institutionId,
    status: 'pending',
    createdAt,
    startedAt: null,
    finishedAt: null,
    total: lista.length,
    importados: 0,
    erros: 0,
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
