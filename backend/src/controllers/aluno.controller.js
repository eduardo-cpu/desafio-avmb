const fs = require('fs');
const alunoService = require('../services/aluno.service');

async function listar(req, res) {
  const alunos = await alunoService.listarAlunos(req.institutionId);
  return res.json({ status: 'success', data: alunos });
}

async function buscar(req, res) {
  const aluno = await alunoService.buscarAluno(req.params.id, req.institutionId);
  if (!aluno) return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
  return res.json({ status: 'success', data: aluno });
}

async function criar(req, res) {
  const aluno = await alunoService.criarAluno(req.body, req.institutionId);
  return res.status(201).json({ status: 'success', data: aluno });
}

async function download(req, res) {
  const aluno = await alunoService.buscarArquivoAluno(req.params.id, req.institutionId);
  if (!aluno?.filePath || !fs.existsSync(aluno.filePath)) {
    return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
  }
  res.download(aluno.filePath, `certificado-${aluno.id}.xml`);
}

async function atualizar(req, res) {
  const aluno = await alunoService.atualizarAluno(req.params.id, req.institutionId, req.body);
  return res.json({ status: 'success', data: aluno });
}

async function cancelar(req, res) {
  await alunoService.cancelarAluno(req.params.id, req.institutionId);
  return res.json({ status: 'success', message: 'Aluno cancelado com sucesso' });
}

module.exports = { listar, buscar, criar, download, atualizar, cancelar };
