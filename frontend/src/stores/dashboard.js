import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref(null)
  const loading = ref(false)

  async function carregar() {
    loading.value = true
    try {
      const { data } = await http.get('/alunos/stats')
      stats.value = data.data
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, carregar }
})
