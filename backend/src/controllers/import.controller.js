const importService = require('../services/import.service');

async function importar(req, res) {
  const body = req.body;
  const lista = Array.isArray(body) ? body : [body];

  const job = importService.enfileirarImportacao(lista, req.institutionId);

  return res.status(202).json({
    status: 'accepted',
    message: 'Importação enfileirada para processamento assíncrono',
    protocolo: job.id,
    posicaoFila: job.posicaoFila,
    total: job.total,
    statusUrl: `/api/alunos/import/${job.id}/status`,
  });
}

async function statusImport(req, res) {
  const job = importService.consultarStatusImportacao(req.params.jobId, req.institutionId);

  return res.json({
    status: 'success',
    data: job,
  });
}

module.exports = { importar, statusImport };
