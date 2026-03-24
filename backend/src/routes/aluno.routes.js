const router = require('express').Router();
const fs = require('fs');
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, criar, atualizar, cancelar } = require('../controllers/aluno.controller');
const { importar } = require('../controllers/import.controller');
const { gerarHashAluno } = require('../controllers/hash.controller');
const prisma = require('../models');

router.use(auth);

router.get('/', listar);
router.get('/:id', buscar);
router.get('/:id/download', async (req, res) => {
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
router.patch('/:id/cancelar', cancelar);

module.exports = router;
