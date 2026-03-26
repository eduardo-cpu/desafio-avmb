import { describe, it, expect } from 'vitest'
import { validarFormAluno } from '@/utils/validarAluno'

const formValido = () => ({
  nome: 'João da Silva',
  cpf: '529.982.247-25',
  dtNascimento: '',
  urlCallback: 'https://webhook.site/test',
  curso: {
    nome: 'Desenvolvimento Web',
    codigo: 'DEV-001',
    dt_inicio: '2025-01-01',
    dt_fim: '2025-06-30',
    docente: 'Prof. Ana',
  },
})

describe('validarFormAluno', () => {
  it('retorna objeto vazio para formulário válido', () => {
    expect(validarFormAluno(formValido())).toEqual({})
  })

  describe('nome', () => {
    it('erro quando nome tem menos de 3 caracteres', () => {
      const form = formValido()
      form.nome = 'ab'
      expect(validarFormAluno(form)).toHaveProperty('nome')
    })

    it('sem erro para nome com exatamente 3 caracteres', () => {
      const form = formValido()
      form.nome = 'Ana'
      expect(validarFormAluno(form)).not.toHaveProperty('nome')
    })
  })

  describe('cpf', () => {
    it('erro quando CPF está vazio', () => {
      const form = formValido()
      form.cpf = ''
      expect(validarFormAluno(form)).toHaveProperty('cpf')
    })

    it('erro para CPF com dígitos verificadores inválidos', () => {
      const form = formValido()
      form.cpf = '111.111.111-11'
      expect(validarFormAluno(form)).toHaveProperty('cpf')
    })

    it('sem erro para CPF válido sem máscara', () => {
      const form = formValido()
      form.cpf = '52998224725'
      expect(validarFormAluno(form)).not.toHaveProperty('cpf')
    })

    it('sem erro para CPF válido com máscara', () => {
      const form = formValido()
      form.cpf = '529.982.247-25'
      expect(validarFormAluno(form)).not.toHaveProperty('cpf')
    })
  })

  describe('urlCallback', () => {
    it('erro para URL sem protocolo', () => {
      const form = formValido()
      form.urlCallback = 'webhook.site/test'
      expect(validarFormAluno(form)).toHaveProperty('urlCallback')
    })

    it('sem erro para URL https válida', () => {
      const form = formValido()
      form.urlCallback = 'https://meusite.com/hook'
      expect(validarFormAluno(form)).not.toHaveProperty('urlCallback')
    })
  })

  describe('curso.dt_fim', () => {
    it('erro quando dt_fim é anterior à dt_inicio', () => {
      const form = formValido()
      form.curso.dt_inicio = '2025-06-01'
      form.curso.dt_fim = '2025-01-01'
      expect(validarFormAluno(form)).toHaveProperty('curso.dt_fim')
    })

    it('erro quando dt_fim é igual à dt_inicio', () => {
      const form = formValido()
      form.curso.dt_inicio = '2025-06-01'
      form.curso.dt_fim = '2025-06-01'
      expect(validarFormAluno(form)).toHaveProperty('curso.dt_fim')
    })

    it('sem erro quando dt_fim é posterior à dt_inicio', () => {
      const form = formValido()
      form.curso.dt_inicio = '2025-01-01'
      form.curso.dt_fim = '2025-12-31'
      expect(validarFormAluno(form)).not.toHaveProperty('curso.dt_fim')
    })
  })

  describe('curso.codigo', () => {
    it('erro para código com menos de 2 caracteres', () => {
      const form = formValido()
      form.curso.codigo = 'A'
      expect(validarFormAluno(form)).toHaveProperty('curso.codigo')
    })

    it('sem erro para código com 2 ou mais caracteres', () => {
      const form = formValido()
      form.curso.codigo = 'AB'
      expect(validarFormAluno(form)).not.toHaveProperty('curso.codigo')
    })
  })
})
