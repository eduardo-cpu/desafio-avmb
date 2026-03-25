const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../models');

// Hash dummy para evitar timing attack — tempo constante independente de o e-mail existir
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

async function register(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ status: 'error', message: 'nome, email e senha são obrigatórios' });
  }

  const existe = await prisma.instituicao.findUnique({ where: { email } });
  if (existe) {
    return res.status(409).json({ status: 'error', message: 'E-mail já cadastrado' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const instituicao = await prisma.instituicao.create({
    data: { nome, email, senhaHash },
  });

  return res.status(201).json({
    status: 'success',
    data: { id: instituicao.id, nome: instituicao.nome, email: instituicao.email },
  });
}

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ status: 'error', message: 'email e senha são obrigatórios' });
  }

  const instituicao = await prisma.instituicao.findUnique({ where: { email } });

  // Sempre executa bcrypt.compare para tempo de resposta constante (evita timing attack)
  const hashParaComparar = instituicao ? instituicao.senhaHash : DUMMY_HASH;
  const senhaValida = await bcrypt.compare(senha, hashParaComparar);

  if (!instituicao || !senhaValida) {
    return res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { institutionId: instituicao.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return res.json({
    status: 'success',
    data: {
      token,
      instituicao: { id: instituicao.id, nome: instituicao.nome, email: instituicao.email },
    },
  });
}

module.exports = { register, login };
