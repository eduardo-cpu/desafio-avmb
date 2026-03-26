import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'

export const useAlunosStore = defineStore('alunos', () => {
  const alunos = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })

  async function listar({ page, limit, busca } = {}) {
    loading.value = true
    try {
      const params = {}
      if (page) params.page = page
      if (limit) params.limit = limit
      if (busca) params.busca = busca
      const { data } = await http.get('/alunos', { params })
      alunos.value = data.alunos
      pagination.value = { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }
    } finally {
      loading.value = false
    }
  }

  async function cancelar(id) {
    await http.patch(`/alunos/${id}/cancelar`)
    const index = alunos.value.findIndex(a => a.id === id)
    if (index !== -1) alunos.value[index].status = 'CANCELADO'
  }

  async function gerarHash(id) {
    const { data } = await http.post(`/alunos/${id}/gerar-hash`)
    const index = alunos.value.findIndex(a => a.id === id)
    if (index !== -1) alunos.value[index] = data.data
    return data.data
  }

  return { alunos, loading, pagination, listar, cancelar, gerarHash }
})
