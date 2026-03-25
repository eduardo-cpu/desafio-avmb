const fs = require('fs');
const prisma = require('../models');

function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

async function listar(req, res) {
  const alunos = await prisma.aluno.findMany({
    where: { instituicaoId: req.institutionId, deletedAt: null },
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

  if (!isValidDate(curso.dt_inicio) || !isValidDate(curso.dt_fim)) {
    return res.status(400).json({ status: 'error', message: 'Datas do curso inválidas' });
  }

  const cpfLimpo = cpf.replace(/\D/g, '');

  // Reutilizar curso existente do mesmo código; criar se não existir
  let cursoCriado = await prisma.curso.findFirst({
    where: { codigo: curso.codigo },
  });

  if (!cursoCriado) {
    cursoCriado = await prisma.curso.create({
      data: {
        nome: curso.nome,
        codigo: curso.codigo,
        dtInicio: new Date(curso.dt_inicio),
        dtFim: new Date(curso.dt_fim),
        docente: curso.docente,
      },
    });
  }

  // Verificar duplicata antes de criar (evita vazar erro P2002 do Prisma)
  const existe = await prisma.aluno.findFirst({
    where: { cpf: cpfLimpo, cursoId: cursoCriado.id, deletedAt: null },
  });
  if (existe) {
    return res.status(409).json({ status: 'error', message: 'Aluno já matriculado neste curso' });
  }

  const aluno = await prisma.aluno.create({
    data: {
      nome,
      cpf: cpfLimpo,
      dtNascimento: dtNascimento ? new Date(dtNascimento) : null,
      urlCallback,
      instituicaoId: req.institutionId,
      cursoId: cursoCriado.id,
    },
    include: { curso: true },
  });

  return res.status(201).json({ status: 'success', data: aluno });
}

async function download(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno?.filePath || !fs.existsSync(aluno.filePath)) {
    return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
  }
  res.download(aluno.filePath, `certificado-${aluno.id}.xml`);
}

async function atualizar(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
  if (aluno.status === 'CANCELADO' || aluno.status === 'CERTIFICADO') {
    return res.status(400).json({ status: 'error', message: 'Aluno certificado ou cancelado não pode ser editado' });
  }

  // status não é permitido via body — mudanças de status só ocorrem via endpoints dedicados
  const { nome, cpf, dtNascimento, urlCallback } = req.body;

  const atualizado = await prisma.aluno.update({
    where: { id: req.params.id },
    data: {
      ...(nome && { nome }),
      ...(cpf && { cpf: cpf.replace(/\D/g, '') }),
      ...(dtNascimento && { dtNascimento: new Date(dtNascimento) }),
      ...(urlCallback && { urlCallback }),
    },
    include: { curso: true },
  });

  return res.json({ status: 'success', data: atualizado });
}

async function cancelar(req, res) {
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
  if (aluno.status === 'CANCELADO') {
    return res.status(400).json({ status: 'error', message: 'Aluno já está cancelado' });
  }

  await prisma.aluno.update({
    where: { id: req.params.id },
    data: { status: 'CANCELADO' },
  });

  return res.json({ status: 'success', message: 'Aluno cancelado com sucesso' });
}

module.exports = { listar, buscar, criar, download, atualizar, cancelar };
