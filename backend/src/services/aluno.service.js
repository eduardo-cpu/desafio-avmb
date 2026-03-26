const prisma = require('../models');
const { gerarHash } = require('./hash.service');
const { gerarXml } = require('./xml.service');
const { dispararWebhook } = require('./webhook.service');
const { validarAluno, validarCpf } = require('./validation.service');
const serviceError = require('../utils/serviceError');

async function listarAlunos(instituicaoId, { page = 1, limit = 20, busca } = {}) {
  const where = { instituicaoId, deletedAt: null };

  if (busca) {
    const buscaLimpa = busca.replace(/\D/g, '');
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      ...(buscaLimpa.length > 0 ? [{ cpf: { contains: buscaLimpa } }] : []),
    ];
  }

  const [alunos, total] = await Promise.all([
    prisma.aluno.findMany({
      where,
      include: { curso: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aluno.count({ where }),
  ]);

  return { alunos, total, page, limit, totalPages: Math.ceil(total / limit) };
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

async function obterStats(instituicaoId) {
  const where = { instituicaoId, deletedAt: null };

  const [total, certificados, pendentes, cancelados, recentes] = await Promise.all([
    prisma.aluno.count({ where }),
    prisma.aluno.count({ where: { ...where, status: 'CERTIFICADO' } }),
    prisma.aluno.count({ where: { ...where, status: 'PENDENTE' } }),
    prisma.aluno.count({ where: { instituicaoId, status: 'CANCELADO' } }),
    prisma.aluno.findMany({
      where,
      include: { curso: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return { total, certificados, pendentes, cancelados, recentes };
}

async function cancelarAluno(id, instituicaoId) {
  const aluno = await prisma.aluno.findFirst({ where: { id, instituicaoId, deletedAt: null } });
  if (!aluno) throw serviceError('Aluno não encontrado', 404);
  if (aluno.status === 'CANCELADO') throw serviceError('Aluno já está cancelado', 400);

  return prisma.aluno.update({
    where: { id },
    data: { status: 'CANCELADO', deletedAt: new Date() },
  });
}

async function certificarAluno(id, instituicaoId) {
  const aluno = await prisma.aluno.findFirst({
    where: { id, instituicaoId, deletedAt: null, status: { not: 'CANCELADO' } },
    include: { curso: true },
  });
  if (!aluno) throw serviceError('Aluno não encontrado', 404);
  if (aluno.hash) throw serviceError('Hash já gerado para este aluno', 409);

  const hash = gerarHash(aluno);

  const atualizado = await prisma.$transaction(async (tx) => {
    const filePath = await gerarXml({ ...aluno, hash });

    return tx.aluno.update({
      where: { id: aluno.id },
      data: { hash, filePath, status: 'CERTIFICADO' },
      include: { curso: true },
    });
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
    if (!valido) {
      errosGerais.push({ indice, erros });
      continue;
    }

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
        errosGerais.push({
          indice,
          erros: [{ campo: 'cpf', motivo: 'Aluno já cadastrado neste curso' }],
        });
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
  obterStats,
  cancelarAluno,
  certificarAluno,
  importarAlunos,
};
