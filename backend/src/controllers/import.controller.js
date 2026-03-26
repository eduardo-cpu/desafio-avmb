const alunoService = require('../services/aluno.service');

async function importar(req, res) {
  const body = req.body;
  const lista = Array.isArray(body) ? body : [body];

  const { resultados, errosGerais } = await alunoService.importarAlunos(lista, req.institutionId);

  if (errosGerais.length > 0 && resultados.length === 0) {
    return res.status(400).json({ status: 'error', erros: errosGerais });
  }

  return res.status(201).json({
    status: 'success',
    importados: resultados.length,
    erros: errosGerais,
    data: resultados,
  });
}

module.exports = { importar };
