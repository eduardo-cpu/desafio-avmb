<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Importar Alunos</h1>
        <p class="text-muted-foreground text-sm">Cole um JSON com um ou mais alunos para importar em lote</p>
      </div>
      <Button variant="outline" @click="router.push('/alunos')">← Voltar</Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>JSON de importação</CardTitle>
        <CardDescription>
          Aceita objeto único ou array. Campos obrigatórios: <code class="text-xs bg-muted px-1 rounded">nome, cpf, url_callback, curso</code>
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <textarea
          v-model="json"
          rows="14"
          placeholder='[
  {
    "nome": "João Silva",
    "cpf": "123.456.789-09",
    "dt_nascimento": "1990-01-15",
    "url_callback": "https://meusite.com/webhook",
    "curso": {
      "nome": "Desenvolvimento Web",
      "codigo": "DEV-001",
      "dt_inicio": "2025-01-01",
      "dt_fim": "2025-06-30",
      "docente": "Prof. Carlos"
    }
  }
]'
          class="w-full font-mono text-sm border rounded-md p-3 bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          :class="erroJson ? 'border-destructive' : 'border-input'"
        />
        <p v-if="erroJson" class="text-sm text-destructive">{{ erroJson }}</p>

        <div class="flex gap-2">
          <Button @click="importar" :disabled="importando || !json.trim()">
            {{ importando ? 'Importando...' : 'Importar' }}
          </Button>
          <Button variant="outline" @click="limpar">Limpar</Button>
        </div>
      </CardContent>
    </Card>

    <!-- Resultado -->
    <Card v-if="resultado">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <span v-if="resultado.importados > 0" class="text-green-600">
            ✓ {{ resultado.importados }} aluno(s) importado(s)
          </span>
          <span v-else class="text-destructive">Nenhum aluno importado</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">

        <!-- Erros por item -->
        <div v-if="resultado.erros?.length">
          <p class="text-sm font-medium text-destructive mb-2">
            {{ resultado.erros.length }} item(s) com erro:
          </p>
          <div
            v-for="(e, i) in resultado.erros"
            :key="i"
            class="border border-destructive/40 rounded-md p-3 space-y-1 bg-destructive/5"
          >
            <p class="text-xs font-semibold text-muted-foreground uppercase">{{ e.indice }}</p>
            <div v-for="(err, j) in e.erros" :key="j" class="flex gap-2 text-sm">
              <Badge variant="destructive" class="shrink-0">{{ err.campo }}</Badge>
              <span>{{ err.motivo }}</span>
            </div>
          </div>
        </div>

        <!-- Importados com sucesso -->
        <div v-if="resultado.data?.length">
          <p class="text-sm font-medium mb-2">Importados:</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="aluno in resultado.data" :key="aluno.id">
                <TableCell class="font-medium">{{ aluno.nome }}</TableCell>
                <TableCell>{{ formatCpf(aluno.cpf) }}</TableCell>
                <TableCell>{{ aluno.curso?.nome }}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{{ aluno.status }}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div class="pt-2">
            <Button variant="outline" size="sm" @click="router.push('/alunos')">
              Ver todos os alunos →
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const router = useRouter()

const json = ref('')
const erroJson = ref('')
const importando = ref(false)
const resultado = ref(null)

async function importar() {
  erroJson.value = ''
  resultado.value = null

  let payload
  try {
    payload = JSON.parse(json.value)
  } catch {
    erroJson.value = 'JSON inválido. Verifique a sintaxe.'
    return
  }

  importando.value = true
  try {
    const { data } = await http.post('/alunos/import', payload)
    resultado.value = data
  } catch (e) {
    const body = e.response?.data
    if (body?.erros) {
      resultado.value = { importados: 0, erros: body.erros, data: [] }
    } else {
      erroJson.value = body?.message || 'Erro ao importar'
    }
  } finally {
    importando.value = false
  }
}

function limpar() {
  json.value = ''
  erroJson.value = ''
  resultado.value = null
}

function formatCpf(cpf) {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
</script>
