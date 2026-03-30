const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, stats, download, cancelar } = require('../controllers/aluno.controller');
const { importar, statusImport } = require('../controllers/import.controller');
const { gerarHashAluno } = require('../controllers/hash.controller');
const { importLimiter } = require('../middlewares/rate-limiter');

router.use(auth);

router.get('/', listar);
router.get('/stats', stats);
router.post('/import', importLimiter, importar);
router.get('/import/:jobId/status', statusImport);
router.get('/:id', buscar);
router.get('/:id/download', download);
router.post('/:id/gerar-hash', gerarHashAluno);
router.patch('/:id/cancelar', cancelar);

module.exports = router;
