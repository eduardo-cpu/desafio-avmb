const router = require('express').Router();
const { validar, downloadPublico } = require('../controllers/public.controller');

router.get('/validar/:hash', validar);
router.get('/validar/:hash/download', downloadPublico);

module.exports = router;
