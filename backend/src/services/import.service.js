const queueService = require('./import-queue.service');
const serviceError = require('../utils/serviceError');

const IMPORT_MAX_BATCH_SIZE = Number.parseInt(process.env.IMPORT_MAX_BATCH_SIZE || '1000', 10);

function validarConfiguracaoLote() {
  if (!Number.isInteger(IMPORT_MAX_BATCH_SIZE) || IMPORT_MAX_BATCH_SIZE <= 0) {
    throw serviceError('Configuração inválida de IMPORT_MAX_BATCH_SIZE', 500);
  }
}

function enfileirarImportacao(lista, institutionId) {
  validarConfiguracaoLote();

  if (lista.length > IMPORT_MAX_BATCH_SIZE) {
    throw serviceError(`Lote excede o máximo permitido de ${IMPORT_MAX_BATCH_SIZE} itens`, 413);
  }

  return queueService.enqueueImport(lista, institutionId);
}

function consultarStatusImportacao(jobId, institutionId) {
  const job = queueService.getImportStatus(jobId, institutionId);

  if (!job) {
    throw serviceError('Protocolo de importação não encontrado', 404);
  }

  return job;
}

module.exports = {
  enfileirarImportacao,
  consultarStatusImportacao,
};
