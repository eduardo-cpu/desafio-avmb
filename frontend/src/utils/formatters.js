export function formatCpf(cpf) {
  if (!cpf) return '—'
  const digits = cpf.replace(/\D/g, '')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatarData(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = String(iso).split('T')[0].split('-')
  return `${dia}/${mes}/${ano}`
}

export function badgeVariant(status) {
  const map = {
    PENDENTE: 'secondary',
    ATIVO: 'default',
    CERTIFICADO: 'default',
    CANCELADO: 'destructive',
  }
  return map[status] ?? 'secondary'
}
