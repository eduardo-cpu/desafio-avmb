import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/api/http'

function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const instituicao = ref(JSON.parse(localStorage.getItem('instituicao') || 'null'))

  const isAuthenticated = computed(() => isTokenValid(token.value))

  let expiryTimer = null

  function scheduleExpiryCheck() {
    clearTimeout(expiryTimer)
    if (!token.value) return
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const msUntilExpiry = payload.exp * 1000 - Date.now()
      if (msUntilExpiry <= 0) {
        logout()
        return
      }
      expiryTimer = setTimeout(() => { logout(); window.location.href = '/login' }, msUntilExpiry)
    } catch {
      logout()
    }
  }

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
    scheduleExpiryCheck()
    return data
  }

  function logout() {
    clearTimeout(expiryTimer)
    token.value = null
    instituicao.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('instituicao')
  }

  // Agenda verificação imediatamente se já tiver token salvo (reload de página)
  scheduleExpiryCheck()

  return { token, instituicao, isAuthenticated, register, login, logout }
})
