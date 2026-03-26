const prisma = require('../models');
const serviceError = require('../utils/serviceError');


async function buscarPorHash(hash) {
  const aluno = await prisma.aluno.findFirst({
    where: { hash, deletedAt: null, status: { not: 'CANCELADO' } },
    include: { curso: true },
  });
  if (!aluno) throw serviceError('Certificado não encontrado ou cancelado', 404);
  return aluno;
}

async function buscarArquivoPorHash(hash) {
  const aluno = await prisma.aluno.findFirst({
    where: { hash, deletedAt: null, status: { not: 'CANCELADO' } },
  });
  if (!aluno) throw serviceError('Certificado não encontrado ou cancelado', 404);
  return aluno;
}

module.exports = { buscarPorHash, buscarArquivoPorHash };
