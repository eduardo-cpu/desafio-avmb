const axios = require('axios');

async function dispararWebhook(aluno) {
  const payload = {
    nome: aluno.nome,
    cpf: aluno.cpf,
    validation_code: aluno.hash,
    hash: aluno.hash,
    url_consulta: `${process.env.HOST}/validar/${aluno.hash}`,
  };

  try {
    await axios.post(aluno.urlCallback, payload, { timeout: 5000 });
    console.log(`✅ Webhook disparado para ${aluno.urlCallback}`);
  } catch (err) {
    console.error(`❌ Falha no webhook para ${aluno.urlCallback}:`, err.message);
  }
}

module.exports = { dispararWebhook };
