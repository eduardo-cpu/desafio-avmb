function validarCpf(cpf) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function isUrl(str) {
  return /^https?:\/\/.+/.test(str)
}

export function validarFormAluno(form) {
  const e = {}

  if (!form.nome || form.nome.trim().length < 3)
    e.nome = 'Nome deve ter no mínimo 3 caracteres'
  else if (form.nome.trim().length > 255)
    e.nome = 'Nome deve ter no máximo 255 caracteres'

  if (!form.cpf)
    e.cpf = 'CPF é obrigatório'
  else if (!validarCpf(form.cpf))
    e.cpf = 'CPF inválido'

  if (form.dtNascimento) {
    const nascimento = new Date(form.dtNascimento)
    if (isNaN(nascimento.getTime()))
      e.dtNascimento = 'Data de nascimento inválida'
    else if (nascimento >= new Date())
      e.dtNascimento = 'Data de nascimento não pode ser no futuro'
  }

  if (!form.urlCallback || form.urlCallback.trim().length < 3)
    e.urlCallback = 'URL de callback é obrigatória'
  else if (!isUrl(form.urlCallback))
    e.urlCallback = 'Informe uma URL válida (ex: https://...)'

  const c = form.curso
  if (!c.nome || c.nome.trim().length < 3)
    e['curso.nome'] = 'Nome do curso deve ter no mínimo 3 caracteres'

  if (!c.codigo || c.codigo.trim().length < 2)
    e['curso.codigo'] = 'Código deve ter no mínimo 2 caracteres'

  if (!c.dt_inicio)
    e['curso.dt_inicio'] = 'Data de início é obrigatória'

  if (!c.dt_fim)
    e['curso.dt_fim'] = 'Data de término é obrigatória'
  else if (c.dt_inicio && c.dt_fim <= c.dt_inicio)
    e['curso.dt_fim'] = 'Data de término deve ser após a data de início'

  if (!c.docente || c.docente.trim().length < 3)
    e['curso.docente'] = 'Docente deve ter no mínimo 3 caracteres'

  return e
}
