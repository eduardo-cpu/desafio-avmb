const axios = require('axios');

const _dispatched = new Set();

async function dispararWebhook(aluno) {
  if (!aluno.hash || _dispatched.has(aluno.hash)) {
    return;
  }
  _dispatched.add(aluno.hash);

  const payload = {
    nome: aluno.nome,
    cpf: aluno.cpf,
    validation_code: aluno.hash,
    hash: aluno.hash,
    url_consulta: `${process.env.FRONTEND_URL}/validar/${aluno.hash}`,
  };

  try {
    await axios.post(aluno.urlCallback, payload, { timeout: 5000 });
    console.log(`✅ Webhook disparado para ${aluno.urlCallback}`);
  } catch (err) {
    console.error(`❌ Falha no webhook para ${aluno.urlCallback}:`, err.message);
  }
}

function _resetDispatched() {
  _dispatched.clear();
}

module.exports = { dispararWebhook, _resetDispatched };
