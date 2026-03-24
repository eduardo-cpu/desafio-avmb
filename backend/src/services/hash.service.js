const crypto = require('crypto');

function gerarHash(aluno) {
  const dados = `${aluno.cpf}-${aluno.cursoId}-${aluno.instituicaoId}-${aluno.createdAt.toISOString()}`;
  return crypto.createHash('sha256').update(dados).digest('hex');
}

module.exports = { gerarHash };
