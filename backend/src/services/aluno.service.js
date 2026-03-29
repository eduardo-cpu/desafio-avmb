const prisma = require('../models');
const { gerarHash } = require('./hash.service');
const { gerarXml } = require('./xml.service');
const { dispararWebhook } = require('./webhook.service');
const { validarAluno, validarCpf } = require('./validation.service');
const serviceError = require('../utils/serviceError');
const { setTimeout: delay } = require('timers/promises');

const IMPORT_PROCESS_CHUNK_SIZE = Number.parseInt(
  process.env.IMPORT_PROCESS_CHUNK_SIZE || '100',
  10,
);

function* chunkList(list, chunkSize) {
  for (let offset = 0; offset < list.length; offset += chunkSize) {
    yield {
      offset,
      chunk: list.slice(offset, offset + chunkSize),
    };
  }
}

const yieldToEventLoop = () => delay(0);

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
      select: {
        id: true,
        nome: true,
        cpf: true,
        dtNascimento: true,
        status: true,
        hash: true,
        createdAt: true,
        curso: {
          select: { id: true, nome: true, codigo: true, dtInicio: true, dtFim: true, docente: true },
        },
      },
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
    select: {
      id: true,
      nome: true,
      cpf: true,
      dtNascimento: true,
      status: true,
      hash: true,
      createdAt: true,
      curso: {
        select: { id: true, nome: true, codigo: true, dtInicio: true, dtFim: true, docente: true },
      },
    },
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
      select: {
        id: true,
        nome: true,
        cpf: true,
        dtNascimento: true,
        status: true,
        hash: true,
        createdAt: true,
        curso: {
          select: { id: true, nome: true, codigo: true, dtInicio: true, dtFim: true, docente: true },
        },
      },
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

  // Gera o XML fora da transação — I/O de disco não deve manter conexão de banco aberta
  const filePath = await gerarXml({ ...aluno, hash });

  let atualizado;
  try {
    atualizado = await prisma.aluno.update({
      where: { id: aluno.id },
      data: { hash, filePath, status: 'CERTIFICADO' },
      select: {
        id: true,
        nome: true,
        cpf: true,
        dtNascimento: true,
        status: true,
        hash: true,
        createdAt: true,
        curso: {
          select: { id: true, nome: true, codigo: true, dtInicio: true, dtFim: true, docente: true },
        },
      },
    });
  } catch (err) {
    // Se o update falhar, remove o arquivo gerado para evitar arquivo órfão
    const fs = require('fs/promises');
    await fs.unlink(filePath).catch(() => {});
    throw err;
  }

  dispararWebhook({ ...aluno, hash }).catch(() => {});
  return atualizado;
}

async function importarAlunos(lista, instituicaoId) {
  const resultados = [];
  const errosGerais = [];

  for (const { offset, chunk } of chunkList(lista, IMPORT_PROCESS_CHUNK_SIZE)) {
    for (let j = 0; j < chunk.length; j++) {
      const item = chunk[j];
      const i = offset + j;
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
        const motivo = e.code === 'P2002'
          ? 'Aluno já cadastrado neste curso'
          : e.message;
        errosGerais.push({ indice, erros: [{ campo: 'geral', motivo }] });
      }
    }

    if (offset + chunk.length < lista.length) {
      await yieldToEventLoop();
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
