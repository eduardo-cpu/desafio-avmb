const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { register, login, me } = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rate-limiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, me);

module.exports = router;
