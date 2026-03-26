<template>
  <div class="min-h-screen bg-muted/40 flex items-start justify-center p-6">
    <!-- Loading -->
    <div v-if="loading" class="mt-24 flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 class="size-8 animate-spin" />
      <p class="text-sm">Verificando certificado...</p>
    </div>

    <!-- Erro -->
    <Card v-else-if="erro" class="w-full max-w-md mt-24">
      <CardContent class="pt-10 pb-8 text-center space-y-3">
        <div class="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
          <XCircle class="size-7 text-destructive" />
        </div>
        <h2 class="text-lg font-semibold">Certificado não encontrado</h2>
        <p class="text-sm text-muted-foreground">{{ erro }}</p>
      </CardContent>
    </Card>

    <!-- Certificado válido -->
    <div v-else-if="dados" class="w-full max-w-lg mt-10 space-y-4">
      <!-- Badge de verificação -->
      <div class="flex justify-center">
        <div class="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-green-200">
          <ShieldCheck class="size-4" />
          Certificado Autêntico e Verificado
        </div>
      </div>

      <Card class="overflow-hidden">
        <!-- Header do certificado -->
        <div class="bg-gradient-to-br from-primary to-primary/80 px-6 py-8 text-primary-foreground text-center space-y-1">
          <GraduationCap class="size-10 mx-auto mb-3 opacity-90" />
          <p class="text-sm font-medium opacity-80 uppercase tracking-widest">Certificado de Conclusão</p>
          <h1 class="text-2xl font-bold">{{ dados.nome }}</h1>
          <p class="text-base opacity-90">{{ dados.curso.nome }}</p>
        </div>

        <CardContent class="pt-6 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">CPF</p>
              <p class="font-medium font-mono text-sm">{{ dados.cpf }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Data de Nascimento</p>
              <p class="font-medium">{{ formatarData(dados.dtNascimento) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Docente</p>
              <p class="font-medium">{{ dados.curso.docente }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Código do Curso</p>
              <p class="font-medium font-mono text-sm">{{ dados.curso.codigo }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Período</p>
              <p class="font-medium text-sm">{{ formatarData(dados.curso.dtInicio) }} — {{ formatarData(dados.curso.dtFim) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Conclusão</p>
              <p class="font-medium">{{ formatarData(dados.curso.dtFim) }}</p>
            </div>
          </div>

          <div class="bg-muted rounded-lg p-3 space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hash de Verificação</p>
            <p class="font-mono text-xs break-all text-foreground leading-relaxed">{{ dados.hash }}</p>
          </div>

          <Button class="w-full" @click="baixarXml" :disabled="baixando">
            <Loader2 v-if="baixando" class="size-4 animate-spin mr-1.5" />
            <Download v-else class="size-4 mr-1.5" />
            {{ baixando ? 'Baixando...' : 'Baixar Certificado (XML)' }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2, XCircle, ShieldCheck, GraduationCap, Download } from 'lucide-vue-next'
import http from '@/api/http'
import { formatarData } from '@/utils/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const route = useRoute()
const loading = ref(true)
const erro = ref('')
const dados = ref(null)
const baixando = ref(false)

onMounted(async () => {
  try {
    const { data } = await http.get(`/validar/${route.params.hash}`)
    dados.value = data.data
  } catch (e) {
    erro.value = e.response?.data?.message || 'Certificado não encontrado ou inválido'
  } finally {
    loading.value = false
  }
})

async function baixarXml() {
  baixando.value = true
  try {
    const { data } = await http.get(`/validar/${dados.value.hash}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `certificado-${dados.value.hash.slice(0, 8)}.xml`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    erro.value = 'Erro ao baixar o certificado. Tente novamente.'
  } finally {
    baixando.value = false
  }
}
</script>
