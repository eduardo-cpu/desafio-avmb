const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth.middleware');
const { register, login, me } = require('../controllers/auth.controller');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, me);

module.exports = router;
