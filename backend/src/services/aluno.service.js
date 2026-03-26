const prisma = require('../models');
const { gerarHash } = require('./hash.service');
const { gerarXml } = require('./xml.service');
const { dispararWebhook } = require('./webhook.service');
const { validarAluno, validarCpf } = require('./validation.service');
const serviceError = require('../utils/serviceError');


function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

async function listarAlunos(instituicaoId) {
  return prisma.aluno.findMany({
    where: { instituicaoId, deletedAt: null },
    include: { curso: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function buscarAluno(id, instituicaoId) {
  return prisma.aluno.findFirst({
    where: { id, instituicaoId, deletedAt: null },
    include: { curso: true },
  });
}

async function buscarArquivoAluno(id, instituicaoId) {
  return prisma.aluno.findFirst({
    where: { id, instituicaoId, deletedAt: null },
  });
}

async function criarAluno({ nome, cpf, dtNascimento, urlCallback, curso }, instituicaoId) {
  if (!nome || !cpf || !urlCallback || !curso) {
    throw serviceError('Campos obrigatórios faltando', 400);
  }
  if (!isValidDate(curso.dt_inicio) || !isValidDate(curso.dt_fim)) {
    throw serviceError('Datas do curso inválidas', 400);
  }

  const cpfLimpo = cpf.replace(/\D/g, '');

  let cursoCriado = await prisma.curso.findFirst({ where: { codigo: curso.codigo } });
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

  const existe = await prisma.aluno.findFirst({
    where: { cpf: cpfLimpo, cursoId: cursoCriado.id, deletedAt: null },
  });
  if (existe) throw serviceError('Aluno já matriculado neste curso', 409);

  return prisma.aluno.create({
    data: {
      nome,
      cpf: cpfLimpo,
      dtNascimento: dtNascimento ? new Date(dtNascimento) : null,
      urlCallback,
      instituicaoId,
      cursoId: cursoCriado.id,
    },
    include: { curso: true },
  });
}

async function atualizarAluno(id, instituicaoId, { nome, cpf, dtNascimento, urlCallback }) {
  const aluno = await prisma.aluno.findFirst({ where: { id, instituicaoId, deletedAt: null } });
  if (!aluno) throw serviceError('Aluno não encontrado', 404);
  if (aluno.status === 'CANCELADO' || aluno.status === 'CERTIFICADO') {
    throw serviceError('Aluno certificado ou cancelado não pode ser editado', 400);
  }

  return prisma.aluno.update({
    where: { id },
    data: {
      ...(nome && { nome }),
      ...(cpf && { cpf: cpf.replace(/\D/g, '') }),
      ...(dtNascimento && { dtNascimento: new Date(dtNascimento) }),
      ...(urlCallback && { urlCallback }),
    },
    include: { curso: true },
  });
}

async function cancelarAluno(id, instituicaoId) {
  const aluno = await prisma.aluno.findFirst({ where: { id, instituicaoId, deletedAt: null } });
  if (!aluno) throw serviceError('Aluno não encontrado', 404);
  if (aluno.status === 'CANCELADO') throw serviceError('Aluno já está cancelado', 400);

  return prisma.aluno.update({ where: { id }, data: { status: 'CANCELADO' } });
}

async function certificarAluno(id, instituicaoId) {
  const aluno = await prisma.aluno.findFirst({
    where: { id, instituicaoId, deletedAt: null, status: { not: 'CANCELADO' } },
    include: { curso: true },
  });
  if (!aluno) throw serviceError('Aluno não encontrado', 404);
  if (aluno.hash) throw serviceError('Hash já gerado para este aluno', 409);

  const hash = gerarHash(aluno);
  const filePath = gerarXml({ ...aluno, hash });

  const atualizado = await prisma.aluno.update({
    where: { id: aluno.id },
    data: { hash, filePath, status: 'CERTIFICADO' },
    include: { curso: true },
  });

  dispararWebhook(atualizado).catch(() => {});
  return atualizado;
}

async function importarAlunos(lista, instituicaoId) {
  const resultados = [];
  const errosGerais = [];

  for (let i = 0; i < lista.length; i++) {
    const item = lista[i];
    const indice = `item[${i}]`;

    const { valido, erros } = validarAluno(item);
    if (!valido) { errosGerais.push({ indice, erros }); continue; }

    const cpfLimpo = item.cpf.replace(/\D/g, '');
    if (!validarCpf(cpfLimpo)) {
      errosGerais.push({ indice, erros: [{ campo: 'cpf', motivo: 'CPF inválido' }] });
      continue;
    }

    try {
      let curso = await prisma.curso.findFirst({
        where: {
          codigo: item.curso.codigo,
          alunos: { some: { instituicaoId } },
        },
      });

      if (!curso) {
        curso = await prisma.curso.create({
          data: {
            nome: item.curso.nome,
            codigo: item.curso.codigo,
            dtInicio: new Date(item.curso.dt_inicio),
            dtFim: new Date(item.curso.dt_fim),
            docente: item.curso.docente,
          },
        });
      }

      const existe = await prisma.aluno.findFirst({
        where: { cpf: cpfLimpo, cursoId: curso.id, deletedAt: null },
      });
      if (existe) {
        errosGerais.push({ indice, erros: [{ campo: 'cpf', motivo: 'Aluno já cadastrado neste curso' }] });
        continue;
      }

      const aluno = await prisma.aluno.create({
        data: {
          nome: item.nome,
          cpf: cpfLimpo,
          dtNascimento: item.dt_nascimento ? new Date(item.dt_nascimento) : null,
          urlCallback: item.url_callback,
          instituicaoId,
          cursoId: curso.id,
        },
        include: { curso: true },
      });
      resultados.push(aluno);
    } catch (e) {
      errosGerais.push({ indice, erros: [{ campo: 'geral', motivo: e.message }] });
    }
  }

  return { resultados, errosGerais };
}

module.exports = {
  listarAlunos,
  buscarAluno,
  buscarArquivoAluno,
  criarAluno,
  atualizarAluno,
  cancelarAluno,
  certificarAluno,
  importarAlunos,
};
