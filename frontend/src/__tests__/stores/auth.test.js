import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'

vi.mock('@/api/http', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  describe('isAuthenticated', () => {
    it('é false quando não há token', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('é true quando há token no localStorage', () => {
      localStorage.setItem('token', 'abc123')
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('login()', () => {
    it('armazena token e instituição após login bem-sucedido', async () => {
      http.post.mockResolvedValueOnce({
        data: { data: { token: 'tok123', instituicao: { id: 1, nome: 'TESTE' } } },
      })
      const store = useAuthStore()
      await store.login('admin@teste.br', 'senha123')

      expect(store.token).toBe('tok123')
      expect(store.instituicao).toEqual({ id: 1, nome: 'TESTE' })
      expect(localStorage.getItem('token')).toBe('tok123')
    })

    it('propaga erro em caso de falha', async () => {
      http.post.mockRejectedValueOnce(new Error('401'))
      const store = useAuthStore()
      await expect(store.login('x', 'y')).rejects.toThrow()
    })
  })

  describe('logout()', () => {
    it('limpa token e instituição', async () => {
      http.post.mockResolvedValueOnce({
        data: { data: { token: 'tok', instituicao: { id: 1, nome: 'X' } } },
      })
      const store = useAuthStore()
      await store.login('a@a.com', '123')
      store.logout()

      expect(store.token).toBeNull()
      expect(store.instituicao).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('register()', () => {
    it('chama o endpoint correto', async () => {
      http.post.mockResolvedValueOnce({ data: {} })
      const store = useAuthStore()
      await store.register('Nova Inst', 'nova@inst.com', 'senha')
      expect(http.post).toHaveBeenCalledWith('/auth/register', {
        nome: 'Nova Inst',
        email: 'nova@inst.com',
        senha: 'senha',
      })
    })
  })
})
