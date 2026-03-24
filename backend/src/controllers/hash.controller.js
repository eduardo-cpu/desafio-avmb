const prisma = require('../models');
const { gerarHash } = require('../services/hash.service');
const { gerarXml } = require('../services/xml.service');
const { dispararWebhook } = require('../services/webhook.service');

async function gerarHashAluno(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null, status: { not: 'CANCELADO' } },
    include: { curso: true },
  });

  if (!aluno) {
    return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
  }

  if (aluno.hash) {
    return res.status(409).json({ status: 'error', message: 'Hash já gerado para este aluno' });
  }

  // Gera hash
  const hash = gerarHash(aluno);

  // Gera XML
  const alunoComHash = { ...aluno, hash };
  const filePath = gerarXml(alunoComHash);

  // Persiste hash e filePath
  const atualizado = await prisma.aluno.update({
    where: { id: aluno.id },
    data: { hash, filePath, status: 'CERTIFICADO' },
    include: { curso: true },
  });

  // Dispara webhook em background
  dispararWebhook(atualizado).catch(() => {});

  return res.json({ status: 'success', data: atualizado });
}

module.exports = { gerarHashAluno };
