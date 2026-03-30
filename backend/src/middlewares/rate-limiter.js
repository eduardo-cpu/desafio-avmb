const rateLimit = require('express-rate-limit');

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.',
  },
});

module.exports = { importLimiter, authLimiter };
