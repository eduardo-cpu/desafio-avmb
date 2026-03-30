const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const schema = require('../schemas/aluno.schema.json');

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

const LABELS_CAMPO = {
  nome: 'Nome',
  cpf: 'CPF',
  dt_nascimento: 'Data de nascimento',
  url_callback: 'URL de callback',
  curso: 'Curso',
  'curso/nome': 'Nome do curso',
  'curso/codigo': 'Código do curso',
  'curso/dt_inicio': 'Data de início do curso',
  'curso/dt_fim': 'Data de término do curso',
  'curso/docente': 'Docente',
};

function traduzirErroAjv(err) {
  const campoRaw = err.instancePath.replace(/^\//, '').replace(/\//g, '/') ||
    err.params?.missingProperty || 'desconhecido';
  const campo = LABELS_CAMPO[campoRaw] || campoRaw;

  switch (err.keyword) {
    case 'required':
      return { campo: LABELS_CAMPO[err.params.missingProperty] || err.params.missingProperty, motivo: 'Campo obrigatório' };
    case 'minLength':
      return { campo, motivo: `Deve ter no mínimo ${err.params.limit} caractere(s)` };
    case 'maxLength':
      return { campo, motivo: `Deve ter no máximo ${err.params.limit} caractere(s)` };
    case 'type':
      return { campo, motivo: `Tipo inválido (esperado: ${err.params.type})` };
    case 'format':
      return { campo, motivo: err.params.format === 'date' ? 'Data inválida (use o formato AAAA-MM-DD)' : `Formato inválido (${err.params.format})` };
    case 'pattern':
      return { campo, motivo: 'Formato inválido' };
    case 'additionalProperties':
      return { campo: err.params.additionalProperty, motivo: 'Propriedade não permitida' };
    case 'enum':
      return { campo, motivo: `Valor inválido. Opções: ${err.params.allowedValues?.join(', ')}` };
    default:
      return { campo, motivo: err.message };
  }
}


function validarAluno(data) {
  const valid = validate(data);
  if (valid) return { valido: true, erros: [] };

  const erros = validate.errors.map(traduzirErroAjv);

  return { valido: false, erros };
}

function validarCpf(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

module.exports = { validarAluno, validarCpf };
