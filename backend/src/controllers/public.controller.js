const fs = require('fs');
const publicService = require('../services/public.service');

async function validar(req, res) {
  const aluno = await publicService.buscarPorHash(req.params.hash);

  return res.json({
    status: 'success',
    data: {
      nome: aluno.nome,
      cpf: aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      dtNascimento: aluno.dtNascimento?.toISOString().split('T')[0] || null,
      curso: {
        nome: aluno.curso.nome,
        codigo: aluno.curso.codigo,
        dtInicio: aluno.curso.dtInicio.toISOString().split('T')[0],
        dtFim: aluno.curso.dtFim.toISOString().split('T')[0],
        docente: aluno.curso.docente,
      },
      hash: aluno.hash,
      status: aluno.status,
      url_download: `${process.env.FRONTEND_URL}/validar/${aluno.hash}`,
    },
  });
}

async function downloadPublico(req, res) {
  const aluno = await publicService.buscarArquivoPorHash(req.params.hash);

  if (!aluno?.filePath || !fs.existsSync(aluno.filePath)) {
    return res.status(404).json({ status: 'error', message: 'Arquivo não encontrado' });
  }

  res.download(aluno.filePath, `certificado-${aluno.hash.slice(0, 8)}.xml`);
}

module.exports = { validar, downloadPublico };
