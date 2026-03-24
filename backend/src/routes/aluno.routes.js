const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { listar, buscar, criar, atualizar, remover } = require('../controllers/aluno.controller');

router.use(auth);

router.get('/', listar);
router.get('/:id', buscar);
router.post('/', criar);
router.put('/:id', atualizar);
router.delete('/:id', remover);

module.exports = router;
