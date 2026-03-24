import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const instituicao = ref(JSON.parse(localStorage.getItem('instituicao') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  async function register(nome, email, senha) {
    const { data } = await http.post('/auth/register', { nome, email, senha })
    return data
  }

  async function login(email, senha) {
    const { data } = await http.post('/auth/login', { email, senha })
    token.value = data.data.token
    instituicao.value = data.data.instituicao
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('instituicao', JSON.stringify(data.data.instituicao))
    return data
  }

  function logout() {
    token.value = null
    instituicao.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('instituicao')
  }

  return { token, instituicao, isAuthenticated, register, login, logout }
})
