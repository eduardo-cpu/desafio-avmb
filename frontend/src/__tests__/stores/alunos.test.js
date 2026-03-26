import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAlunosStore } from '@/stores/alunos'
import http from '@/api/http'

vi.mock('@/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockAluno = {
  id: 1, nome: 'João', cpf: '52998224725', status: 'PENDENTE', hash: null,
  curso: { nome: 'Dev Web', codigo: 'DW01', dtInicio: '2025-01-01', dtFim: '2025-06-30', docente: 'Prof Ana' },
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAlunosStore', () => {
  describe('listar()', () => {
    it('popula o array de alunos', async () => {
      http.get.mockResolvedValueOnce({ data: { alunos: [mockAluno], total: 1, page: 1, limit: 20, totalPages: 1 } })
      const store = useAlunosStore()
      await store.listar()
      expect(store.alunos).toHaveLength(1)
      expect(store.alunos[0].nome).toBe('João')
    })

    it('define loading corretamente durante a chamada', async () => {
      let resolvePromise
      http.get.mockReturnValueOnce(new Promise(r => { resolvePromise = r }))
      const store = useAlunosStore()
      const promise = store.listar()
      expect(store.loading).toBe(true)
      resolvePromise({ data: { alunos: [], total: 0, page: 1, limit: 20, totalPages: 0 } })
      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('cancelar()', () => {
    it('atualiza o status do aluno para CANCELADO', async () => {
      http.patch.mockResolvedValueOnce({})
      const store = useAlunosStore()
      store.alunos = [{ ...mockAluno }]
      await store.cancelar(1)
      expect(store.alunos[0].status).toBe('CANCELADO')
    })
  })

  describe('gerarHash()', () => {
    it('atualiza o aluno com dados retornados pela API', async () => {
      const alunoAtualizado = { ...mockAluno, hash: 'abc123', status: 'CERTIFICADO' }
      http.post.mockResolvedValueOnce({ data: { data: alunoAtualizado } })
      const store = useAlunosStore()
      store.alunos = [{ ...mockAluno }]
      await store.gerarHash(1)
      expect(store.alunos[0].hash).toBe('abc123')
      expect(store.alunos[0].status).toBe('CERTIFICADO')
    })
  })

  describe('criar()', () => {
    it('adiciona aluno no início da lista', async () => {
      const novoAluno = { ...mockAluno, id: 2, nome: 'Maria' }
      http.post.mockResolvedValueOnce({ data: { data: novoAluno } })
      const store = useAlunosStore()
      store.alunos = [mockAluno]
      await store.criar({ nome: 'Maria', cpf: '000', curso: {} })
      expect(store.alunos[0].nome).toBe('Maria')
      expect(store.alunos).toHaveLength(2)
    })
  })
})
