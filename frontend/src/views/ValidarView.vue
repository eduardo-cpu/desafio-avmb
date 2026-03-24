<template>
  <div class="min-h-screen bg-muted/40 flex items-center justify-center p-6">

    <!-- Carregando -->
    <div v-if="loading" class="text-muted-foreground text-sm">Verificando certificado...</div>

    <!-- Erro -->
    <Card v-else-if="erro" class="w-full max-w-md text-center">
      <CardHeader>
        <div class="text-5xl mb-2">❌</div>
        <CardTitle>Certificado não encontrado</CardTitle>
        <CardDescription>{{ erro }}</CardDescription>
      </CardHeader>
    </Card>

    <!-- Sucesso -->
    <Card v-else-if="dados" class="w-full max-w-lg">
      <CardHeader class="text-center">
        <div class="text-5xl mb-2">🎓</div>
        <div class="inline-flex items-center justify-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-2 mx-auto w-fit">
          ✓ Certificado Verificado
        </div>
        <CardTitle class="text-2xl">{{ dados.nome }}</CardTitle>
        <CardDescription class="text-base">{{ dados.curso.nome }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">CPF</p>
            <p class="font-medium">{{ dados.cpf }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Nascimento</p>
            <p class="font-medium">{{ formatarData(dados.dtNascimento) }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Docente</p>
            <p class="font-medium">{{ dados.curso.docente }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Conclusão</p>
            <p class="font-medium">{{ formatarData(dados.curso.dtFim) }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Início</p>
            <p class="font-medium">{{ formatarData(dados.curso.dtInicio) }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Código do curso</p>
            <p class="font-medium">{{ dados.curso.codigo }}</p>
          </div>
        </div>

        <div class="bg-muted rounded-lg p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Hash de verificação</p>
          <p class="font-mono text-xs break-all text-foreground">{{ dados.hash }}</p>
        </div>

        <Button class="w-full" @click="baixarXml">↓ Baixar Certificado (XML)</Button>

      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const route = useRoute()
const loading = ref(true)
const erro = ref('')
const dados = ref(null)

onMounted(async () => {
  try {
    const { data } = await axios.get(`/api/validar/${route.params.hash}`)
    dados.value = data.data
  } catch (e) {
    erro.value = e.response?.data?.message || 'Certificado não encontrado'
  } finally {
    loading.value = false
  }
})

function formatarData(data) {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

async function baixarXml() {
  try {
    const response = await axios.get(`/api/validar/${dados.value.hash}/download`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `certificado-${dados.value.hash.slice(0, 8)}.xml`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch {
    alert('Erro ao baixar o certificado')
  }
}
</script>
