const alunoService = require('../services/aluno.service');

async function gerarHashAluno(req, res) {
  const atualizado = await alunoService.certificarAluno(req.params.id, req.institutionId);
  return res.json({ status: 'success', data: atualizado });
}

module.exports = { gerarHashAluno };
