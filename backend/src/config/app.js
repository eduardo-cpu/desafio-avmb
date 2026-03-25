require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
require('express-async-errors');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(morgan('dev'));
app.use(express.json());

const authRoutes   = require('../routes/auth.routes');
const alunoRoutes  = require('../routes/aluno.routes');
const publicRoutes = require('../routes/public.routes');

app.use('/api/auth',   authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api',        publicRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ status: 'error', message: err.message });
});

module.exports = app;
