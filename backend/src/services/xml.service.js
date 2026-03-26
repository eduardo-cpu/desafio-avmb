const { create } = require('xmlbuilder2');
const fs = require('fs/promises');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

async function gerarXml(aluno) {
  const dir = path.resolve('storage');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('certificado')
      .ele('aluno')
        .ele('id').txt(aluno.id).up()
        .ele('nome').txt(aluno.nome).up()
        .ele('cpf').txt(aluno.cpf).up()
        .ele('dtNascimento').txt(aluno.dtNascimento?.toISOString().split('T')[0] || '').up()
      .up()
      .ele('curso')
        .ele('nome').txt(aluno.curso.nome).up()
        .ele('codigo').txt(aluno.curso.codigo).up()
        .ele('dtInicio').txt(aluno.curso.dtInicio.toISOString().split('T')[0]).up()
        .ele('dtFim').txt(aluno.curso.dtFim.toISOString().split('T')[0]).up()
        .ele('docente').txt(aluno.curso.docente).up()
      .up()
      .ele('certificacao')
        .ele('hash').txt(aluno.hash).up()
        .ele('geradoEm').txt(new Date().toISOString()).up()
      .up()
    .up()
    .end({ prettyPrint: true });

  const filePath = path.join(dir, `${aluno.hash}.xml`);
  await fs.writeFile(filePath, doc);

  return filePath;
}

module.exports = { gerarXml };
