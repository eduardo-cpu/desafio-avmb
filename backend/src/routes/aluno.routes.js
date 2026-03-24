const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, criar, atualizar, remover } = require('../controllers/aluno.controller');
const { importar } = require('../controllers/import.controller');
const { gerarHashAluno } = require('../controllers/hash.controller');

router.use(auth);

router.get('/', listar);
router.get('/:id', buscar);
router.get('/:id/download', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const aluno = await prisma.aluno.findFirst({
    where: { id: req.params.id, instituicaoId: req.institutionId, deletedAt: null },
  });
  if (!aluno?.filePath || !fs.existsSync(aluno.filePath)) {
    return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
  }
  res.download(aluno.filePath, `certificado-${aluno.id}.xml`);
});
router.post('/', criar);
router.post('/import', importar);
router.post('/:id/gerar-hash', gerarHashAluno);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
