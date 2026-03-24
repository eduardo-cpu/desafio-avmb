const router = require('express').Router();
router.get('/ping', (req, res) => res.json({ ok: true, route: 'alunos' }));
module.exports = router;
