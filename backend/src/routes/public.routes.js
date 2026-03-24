const router = require('express').Router();
router.get('/validar/:hash', (req, res) => res.json({ hash: req.params.hash, status: 'placeholder' }));
module.exports = router;
