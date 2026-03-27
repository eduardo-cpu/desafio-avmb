const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, stats, download, cancelar } = require('../controllers/aluno.controller');
const { importar, statusImport } = require('../controllers/import.controller');
const { gerarHashAluno } = require('../controllers/hash.controller');

const importLimiter = rateLimit({
  windowMs: Number.parseInt(process.env.IMPORT_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: Number.parseInt(process.env.IMPORT_RATE_LIMIT_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas importações em pouco tempo. Tente novamente em instantes.',
  },
});

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
