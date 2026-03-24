import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/http'

export const useAlunosStore = defineStore('alunos', () => {
  const alunos = ref([])
  const loading = ref(false)

  async function listar() {
    loading.value = true
    try {
      const { data } = await http.get('/alunos')
      alunos.value = data.data
    } finally {
      loading.value = false
    }
  }

  async function criar(payload) {
    const { data } = await http.post('/alunos', payload)
    alunos.value.unshift(data.data)
    return data.data
  }

  async function atualizar(id, payload) {
    const { data } = await http.put(`/alunos/${id}`, payload)
    const index = alunos.value.findIndex(a => a.id === id)
    if (index !== -1) alunos.value[index] = data.data
    return data.data
  }

  async function remover(id) {
    await http.delete(`/alunos/${id}`)
    alunos.value = alunos.value.filter(a => a.id !== id)
  }

  return { alunos, loading, listar, criar, atualizar, remover }
})
