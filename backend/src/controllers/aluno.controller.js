const prisma = require('../models');

async function listar(req, res) {
  const alunos = await prisma.aluno.findMany({
    where: {
      instituicaoId: req.institutionId,
      deletedAt: null,
    },
    include: { curso: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ status: 'success', data: alunos });
}

async function buscar(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
    include: { curso: true },
  });
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
  return res.json({ status: 'success', data: aluno });
}

async function criar(req, res) {
  const { nome, cpf, dtNascimento, urlCallback, curso } = req.body;

  if (!nome || !cpf || !urlCallback || !curso) {
    return res.status(400).json({ status: 'error', message: 'Campos obrigatórios faltando' });
  }

  const cursoCriado = await prisma.curso.create({
    data: {
      nome: curso.nome,
      codigo: curso.codigo,
      dtInicio: new Date(curso.dt_inicio),
      dtFim: new Date(curso.dt_fim),
      docente: curso.docente,
    },
  });

  const aluno = await prisma.aluno.create({
    data: {
      nome,
      cpf: cpf.replace(/\D/g, ''),
      dtNascimento: dtNascimento ? new Date(dtNascimento) : null,
      urlCallback,
      instituicaoId: req.institutionId,
      cursoId: cursoCriado.id,
    },
    include: { curso: true },
  });

  return res.status(201).json({ status: 'success', data: aluno });
}

async function atualizar(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });

  const { nome, cpf, dtNascimento, urlCallback, status } = req.body;

  const atualizado = await prisma.aluno.update({
    where: { id: req.params.id },
    data: {
      ...(nome && { nome }),
      ...(cpf && { cpf: cpf.replace(/\D/g, '') }),
      ...(dtNascimento && { dtNascimento: new Date(dtNascimento) }),
      ...(urlCallback && { urlCallback }),
      ...(status && { status }),
    },
    include: { curso: true },
  });

  return res.json({ status: 'success', data: atualizado });
}

async function remover(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });

  await prisma.aluno.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), status: 'CANCELADO' },
  });

  return res.json({ status: 'success', message: 'Aluno removido com sucesso' });
}

module.exports = { listar, buscar, criar, atualizar, remover };
