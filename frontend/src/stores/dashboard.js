import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref(null)
  const loading = ref(false)

  async function carregar() {
    loading.value = true
    try {
      const { data } = await http.get('/alunos')
      const alunos = data.data

      stats.value = {
        total: alunos.length,
        certificados: alunos.filter(a => a.status === 'CERTIFICADO').length,
        pendentes: alunos.filter(a => a.status === 'PENDENTE').length,
        cancelados: alunos.filter(a => a.status === 'CANCELADO').length,
        recentes: alunos.slice(0, 5),
      }
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, carregar }
})
