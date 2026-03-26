<template>
  <div class="max-w-3xl space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>JSON de Importação</CardTitle>
        <CardDescription>
          Aceita objeto único ou array de alunos. Campos obrigatórios:
          <code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
            >nome, cpf, url_callback, curso</code
          >
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="relative">
          <textarea
            v-model="json"
            rows="14"
            spellcheck="false"
            :placeholder="PLACEHOLDER"
            :class="[
              'w-full font-mono text-sm rounded-md p-3 bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
              erroJson ? 'border border-destructive' : 'border border-input',
            ]"
          />
        </div>

        <div
          v-if="erroJson"
          class="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle class="size-4 shrink-0" />
          {{ erroJson }}
        </div>

        <div class="flex gap-2">
          <Button @click="importar" :disabled="importando || !json.trim()">
            <Loader2 v-if="importando" class="size-4 animate-spin mr-1.5" />
            <Upload v-else class="size-4 mr-1.5" />
            {{ importando ? 'Importando...' : 'Importar' }}
          </Button>
          <Button variant="outline" @click="limpar" :disabled="importando"> Limpar </Button>
          <Button variant="ghost" class="ml-auto text-xs" @click="usarExemplo">
            Usar exemplo
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Resultado -->
    <Card v-if="resultado">
      <CardHeader>
        <div class="flex items-center gap-2">
          <div v-if="resultado.importados > 0" class="flex items-center gap-2 text-green-600">
            <CheckCircle2 class="size-5" />
            <CardTitle class="text-green-700"
              >{{ resultado.importados }} aluno(s) importado(s)</CardTitle
            >
          </div>
          <div v-else class="flex items-center gap-2 text-destructive">
            <XCircle class="size-5" />
            <CardTitle class="text-destructive">Nenhum aluno importado</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Erros de validação -->
        <div v-if="resultado.erros?.length" class="space-y-2">
          <p class="text-sm font-semibold text-destructive">
            {{ resultado.erros.length }} item(s) com erro de validação:
          </p>
          <div
            v-for="(e, i) in resultado.erros"
            :key="i"
            class="border border-destructive/30 rounded-md p-3 space-y-1.5 bg-destructive/5"
          >
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Item {{ typeof e.indice === 'number' ? e.indice + 1 : e.indice }}
            </p>
            <div v-for="(err, j) in e.erros" :key="j" class="flex gap-2 text-sm items-start">
              <Badge variant="destructive" class="shrink-0 mt-0.5">{{ err.campo }}</Badge>
              <span class="text-muted-foreground">{{ err.motivo }}</span>
            </div>
          </div>
        </div>

        <!-- Importados com sucesso -->
        <div v-if="resultado.data?.length">
          <p class="text-sm font-semibold mb-2">Importados com sucesso:</p>
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
                <TableCell class="font-mono text-sm">{{ formatCpf(aluno.cpf) }}</TableCell>
                <TableCell>{{ aluno.curso?.nome }}</TableCell>
                <TableCell
                  ><Badge variant="secondary">{{ aluno.status }}</Badge></TableCell
                >
              </TableRow>
            </TableBody>
          </Table>
          <div class="pt-3">
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
import { Upload, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next'
import http from '@/api/http'
import { useToastStore } from '@/stores/toast'
import { formatCpf } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const router = useRouter()
const toast = useToastStore()

const json = ref('')
const erroJson = ref('')
const importando = ref(false)
const resultado = ref(null)

const PLACEHOLDER =
  '[\n' +
  '{\n' +
  '  "nome": "João Silva",\n' +
  '  "cpf": "123.456.789-09",\n' +
  '  "url_callback": "https://...",\n' +
  '  "curso": {\n' +
  '    "nome": "Desenvolvimento Web",\n' +
  '    "codigo": "DEV-001",\n' +
  '    "dt_inicio": "2025-01-01",\n' +
  '    "dt_fim": "2025-06-30",\n' +
  '    "docente": "Prof. Ana Souza"\n' +
  '  }\n' +
  '}\n' +
  ']'

const EXEMPLO = JSON.stringify(
  [
    {
      nome: 'João da Silva',
      cpf: '529.982.247-25',
      dt_nascimento: '1995-06-15',
      url_callback: 'https://webhook.site/exemplo',
      curso: {
        nome: 'Desenvolvimento Web',
        codigo: 'DEV-001',
        dt_inicio: '2025-01-01',
        dt_fim: '2025-06-30',
        docente: 'Prof. Ana Souza',
      },
    },
  ],
  null,
  2,
)

function usarExemplo() {
  json.value = EXEMPLO
  erroJson.value = ''
  resultado.value = null
}

async function importar() {
  erroJson.value = ''
  resultado.value = null

  let payload
  try {
    payload = JSON.parse(json.value)
  } catch {
    erroJson.value = 'JSON inválido. Verifique a sintaxe antes de importar.'
    return
  }

  importando.value = true
  try {
    const { data } = await http.post('/alunos/import', payload)
    resultado.value = data
    if (data.importados > 0) {
      toast.success(`${data.importados} aluno(s) importado(s) com sucesso`)
    }
  } catch (e) {
    const body = e.response?.data
    if (body?.erros) {
      resultado.value = { importados: 0, erros: body.erros, data: [] }
    } else {
      erroJson.value = body?.message || 'Erro ao importar. Tente novamente.'
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
</script>
