import { describe, it, expect } from 'vitest'
import { formatCpf, formatarData, badgeVariant } from '@/utils/formatters'

describe('formatCpf', () => {
  it('formata CPF com 11 dígitos', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
  })

  it('formata CPF já mascarado removendo e reaplicando máscara', () => {
    expect(formatCpf('529.982.247-25')).toBe('529.982.247-25')
  })

  it('retorna "—" para valor nulo', () => {
    expect(formatCpf(null)).toBe('—')
  })

  it('retorna "—" para string vazia', () => {
    expect(formatCpf('')).toBe('—')
  })
})

describe('formatarData', () => {
  it('formata data ISO para dd/mm/aaaa', () => {
    expect(formatarData('1995-06-15')).toBe('15/06/1995')
  })

  it('formata data com timestamp', () => {
    expect(formatarData('2025-01-01T00:00:00.000Z')).toBe('01/01/2025')
  })

  it('retorna "—" para valor nulo', () => {
    expect(formatarData(null)).toBe('—')
  })

  it('retorna "—" para valor undefined', () => {
    expect(formatarData(undefined)).toBe('—')
  })
})

describe('badgeVariant', () => {
  it('retorna "secondary" para PENDENTE', () => {
    expect(badgeVariant('PENDENTE')).toBe('secondary')
  })

  it('retorna "default" para CERTIFICADO', () => {
    expect(badgeVariant('CERTIFICADO')).toBe('default')
  })

  it('retorna "destructive" para CANCELADO', () => {
    expect(badgeVariant('CANCELADO')).toBe('destructive')
  })

  it('retorna "secondary" para status desconhecido', () => {
    expect(badgeVariant('DESCONHECIDO')).toBe('secondary')
  })
})
