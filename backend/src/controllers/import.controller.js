const prisma = require("../models");
const { validarAluno, validarCpf } = require("../services/validation.service");

async function importar(req, res) {
  const body = req.body;

  // Aceita objeto único ou array
  const lista = Array.isArray(body) ? body : [body];

  const resultados = [];
  const errosGerais = [];

  for (let i = 0; i < lista.length; i++) {
    const item = lista[i];
    const indice = `item[${i}]`;

    // Valida contra JSON Schema
    const { valido, erros } = validarAluno(item);
    if (!valido) {
      errosGerais.push({ indice, erros });
      continue;
    }

    // Valida CPF real
    const cpfLimpo = item.cpf.replace(/\D/g, "");
    if (!validarCpf(cpfLimpo)) {
      errosGerais.push({
        indice,
        erros: [{ campo: "cpf", motivo: "CPF inválido" }],
      });
      continue;
    }

    try {
      // Cria ou reutiliza curso pelo código
      let curso = await prisma.curso.findFirst({
        where: { codigo: item.curso.codigo },
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

      // Verifica duplicidade CPF + curso
      const existe = await prisma.aluno.findFirst({
        where: { cpf: cpfLimpo, cursoId: curso.id, deletedAt: null },
      });

      if (existe) {
        errosGerais.push({
          indice,
          erros: [{ campo: "cpf", motivo: "Aluno já cadastrado neste curso" }],
        });
        continue;
      }

      const aluno = await prisma.aluno.create({
        data: {
          nome: item.nome,
          cpf: cpfLimpo,
          dtNascimento: item.dt_nascimento
            ? new Date(item.dt_nascimento)
            : null,
          urlCallback: item.url_callback,
          instituicaoId: req.institutionId,
          cursoId: curso.id,
        },
        include: { curso: true },
      });

      resultados.push(aluno);
    } catch (e) {
      errosGerais.push({
        indice,
        erros: [{ campo: "geral", motivo: e.message }],
      });
    }
  }

  if (errosGerais.length > 0 && resultados.length === 0) {
    return res.status(400).json({ status: "error", erros: errosGerais });
  }

  return res.status(201).json({
    status: "success",
    importados: resultados.length,
    erros: errosGerais,
    data: resultados,
  });
}

module.exports = { importar };
