const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, stats, criar, download, atualizar, cancelar } = require('../controllers/aluno.controller');
const { importar } = require('../controllers/import.controller');
const { gerarHashAluno } = require('../controllers/hash.controller');

router.use(auth);

router.get('/', listar);
router.get('/stats', stats);
router.get('/:id', buscar);
router.get('/:id/download', download);
router.post('/', criar);
router.post('/import', importar);
router.post('/:id/gerar-hash', gerarHashAluno);
router.put('/:id', atualizar);
router.patch('/:id/cancelar', cancelar);

module.exports = router;
