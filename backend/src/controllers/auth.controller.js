const authService = require('../services/auth.service');

async function register(req, res) {
  const data = await authService.registrar(req.body);
  return res.status(201).json({ status: 'success', data });
}

async function login(req, res) {
  const data = await authService.autenticar(req.body);
  return res.json({ status: 'success', data });
}

module.exports = { register, login };
