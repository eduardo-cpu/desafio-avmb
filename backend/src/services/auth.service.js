const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models');
const serviceError = require('../utils/serviceError');

// Hash dummy para evitar timing attack — tempo constante independente de o e-mail existir
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';


async function registrar({ nome, email, senha }) {
  if (!nome || !email || !senha) {
    throw serviceError('nome, email e senha são obrigatórios', 400);
  }

  const existe = await prisma.instituicao.findUnique({ where: { email } });
  if (existe) throw serviceError('E-mail já cadastrado', 409);

  const senhaHash = await bcrypt.hash(senha, 10);
  const instituicao = await prisma.instituicao.create({
    data: { nome, email, senhaHash },
  });

  return { id: instituicao.id, nome: instituicao.nome, email: instituicao.email };
}

async function autenticar({ email, senha }) {
  if (!email || !senha) {
    throw serviceError('email e senha são obrigatórios', 400);
  }

  const instituicao = await prisma.instituicao.findUnique({ where: { email } });

  // Sempre executa bcrypt.compare para tempo de resposta constante (evita timing attack)
  const hashParaComparar = instituicao ? instituicao.senhaHash : DUMMY_HASH;
  const senhaValida = await bcrypt.compare(senha, hashParaComparar);

  if (!instituicao || !senhaValida) {
    throw serviceError('Credenciais inválidas', 401);
  }

  const token = jwt.sign(
    { institutionId: instituicao.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    token,
    instituicao: { id: instituicao.id, nome: instituicao.nome, email: instituicao.email },
  };
}

async function me(institutionId) {
  const instituicao = await prisma.instituicao.findUnique({ where: { id: institutionId } });
  if (!instituicao) throw serviceError('Instituição não encontrada', 401);
  return { id: instituicao.id, nome: instituicao.nome, email: instituicao.email };
}

module.exports = { registrar, autenticar, me };
