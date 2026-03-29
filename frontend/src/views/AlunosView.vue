<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input v-model="busca" placeholder="Buscar por nome ou CPF..." class="pl-9" />
      </div>
      <div class="ml-auto flex gap-2">
        <Button variant="outline" size="sm" @click="router.push('/importar')">
          <Upload class="size-3.5 mr-1.5" />
          Importar
        </Button>
      </div>
    </div>

    <!-- Tabela -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="store.loading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 5" :key="j"><Skeleton class="h-4 w-full" /></TableCell>
              </TableRow>
            </template>
            <TableRow v-else-if="store.alunos.length === 0">
              <TableCell colspan="5" class="text-center py-12 text-muted-foreground">
                <div class="flex flex-col items-center gap-2">
                  <Users class="size-8 opacity-30" />
                  <p class="text-sm">{{ busca ? 'Nenhum resultado encontrado' : 'Nenhum aluno cadastrado' }}</p>
                </div>
              </TableCell>
            </TableRow>
            <TableRow
              v-else
              v-for="aluno in store.alunos"
              :key="aluno.id"
              :class="aluno.status === 'CANCELADO' ? 'opacity-60' : ''"
            >
              <TableCell class="font-medium">{{ aluno.nome }}</TableCell>
              <TableCell class="font-mono text-sm">{{ formatCpf(aluno.cpf) }}</TableCell>
              <TableCell class="text-muted-foreground">{{ aluno.curso?.nome }}</TableCell>
              <TableCell>
                <Badge :variant="badgeVariant(aluno.status)">{{ aluno.status }}</Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <!-- Visualizar — sempre visível -->
                  <Button
                    variant="ghost" size="icon-sm"
                    class="text-muted-foreground hover:text-foreground"
                    title="Visualizar dados"
                    @click="abrirDetalhes(aluno)"
                  >
                    <Eye class="size-3.5" />
                  </Button>
                  <template v-if="aluno.status !== 'CANCELADO'">
                    <Button
                      v-if="!aluno.hash"
                      variant="ghost" size="icon-sm"
                      class="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Gerar Certificado"
                      @click="confirmarGerarHash(aluno)"
                    >
                      <Award class="size-3.5" />
                    </Button>
                    <Button
                      v-if="aluno.hash"
                      variant="ghost" size="icon-sm"
                      class="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Baixar XML"
                      @click="handleDownload(aluno.id, aluno.hash)"
                    >
                      <Download class="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      class="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Cancelar aluno"
                      @click="confirmarCancelar(aluno)"
                    >
                      <Ban class="size-3.5" />
                    </Button>
                  </template>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <div v-if="store.pagination.totalPages > 1" class="flex items-center justify-between border-t px-4 py-3">
        <p class="text-sm text-muted-foreground">
          {{ store.pagination.total }} aluno(s) • Página {{ store.pagination.page }} de {{ store.pagination.totalPages }}
        </p>
        <div class="flex gap-1">
          <Button variant="outline" size="sm" :disabled="store.pagination.page <= 1" @click="irParaPagina(store.pagination.page - 1)">
            <ChevronLeft class="size-4" />
          </Button>
          <Button variant="outline" size="sm" :disabled="store.pagination.page >= store.pagination.totalPages" @click="irParaPagina(store.pagination.page + 1)">
            <ChevronRight class="size-4" />
          </Button>
        </div>
      </div>
    </Card>

    <!-- Dialog detalhes do aluno -->
    <Dialog v-model:open="detalhesDialog.aberto">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <UserCircle class="size-5" />
            Dados do Aluno
          </DialogTitle>
        </DialogHeader>
        <template v-if="detalhesDialog.aluno">
          <div class="space-y-4 text-sm">
            <!-- Status -->
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Status</span>
              <Badge :variant="badgeVariant(detalhesDialog.aluno.status)">
                {{ detalhesDialog.aluno.status }}
              </Badge>
            </div>

            <Separator />

            <!-- Dados pessoais -->
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados Pessoais</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p class="text-xs text-muted-foreground">Nome</p>
                  <p class="font-medium">{{ detalhesDialog.aluno.nome }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">CPF</p>
                  <p class="font-mono">{{ formatCpf(detalhesDialog.aluno.cpf) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Data de Nascimento</p>
                  <p>{{ formatarData(detalhesDialog.aluno.dtNascimento) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Cadastrado em</p>
                  <p>{{ formatarData(detalhesDialog.aluno.createdAt) }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-xs text-muted-foreground">URL de Notificação (Webhook)</p>
                  <p class="font-mono text-xs break-all bg-muted px-2 py-1.5 rounded mt-0.5">
                    {{ detalhesDialog.aluno.urlCallback }}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <!-- Dados do curso -->
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Curso</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                <div class="col-span-2">
                  <p class="text-xs text-muted-foreground">Nome</p>
                  <p class="font-medium">{{ detalhesDialog.aluno.curso?.nome }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Código</p>
                  <p class="font-mono">{{ detalhesDialog.aluno.curso?.codigo }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Docente</p>
                  <p>{{ detalhesDialog.aluno.curso?.docente }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Início</p>
                  <p>{{ formatarData(detalhesDialog.aluno.curso?.dtInicio) }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted-foreground">Término</p>
                  <p>{{ formatarData(detalhesDialog.aluno.curso?.dtFim) }}</p>
                </div>
              </div>
            </div>

            <!-- Hash do certificado (se certificado) -->
            <template v-if="detalhesDialog.aluno.hash">
              <Separator />
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Certificado</p>
                <div>
                  <p class="text-xs text-muted-foreground mb-1">Hash de validação</p>
                  <p class="font-mono text-xs break-all bg-muted px-2 py-1.5 rounded">
                    {{ detalhesDialog.aluno.hash }}
                  </p>
                </div>
                <Button variant="outline" size="sm" class="w-full" @click="handleDownload(detalhesDialog.aluno.id, detalhesDialog.aluno.hash)">
                  <Download class="size-3.5 mr-1.5" />
                  Baixar XML
                </Button>
              </div>
            </template>
          </div>
        </template>
        <DialogFooter>
          <Button variant="outline" @click="detalhesDialog.aberto = false">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dialog confirmação de ação crítica -->
    <Dialog v-model:open="confirmDialog.aberto">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>{{ confirmDialog.titulo }}</DialogTitle>
          <DialogDescription>{{ confirmDialog.descricao }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDialog.aberto = false">Cancelar</Button>
          <Button :variant="confirmDialog.variante" :disabled="confirmDialog.loading" @click="confirmDialog.acao()">
            <Loader2 v-if="confirmDialog.loading" class="size-4 animate-spin mr-1.5" />
            {{ confirmDialog.confirmarLabel }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Upload, Award, Download, Ban, Users, Loader2, ChevronLeft, ChevronRight, Eye, UserCircle } from 'lucide-vue-next'
import http from '@/api/http'
import { useAlunosStore } from '@/stores/alunos'
import { useToastStore } from '@/stores/toast'
import { formatCpf, formatarData, badgeVariant } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const router = useRouter()
const store = useAlunosStore()
const toast = useToastStore()

const busca = ref('')

let debounceTimer = null

function buscar() {
  store.listar({ page: 1, busca: busca.value || undefined })
}

watch(busca, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(buscar, 300)
})

function irParaPagina(page) {
  store.listar({ page, busca: busca.value || undefined })
}

// Dialog de detalhes
const detalhesDialog = reactive({
  aberto: false,
  aluno: null,
  loading: false,
})

async function abrirDetalhes(aluno) {
  detalhesDialog.loading = true
  detalhesDialog.aberto = true
  detalhesDialog.aluno = aluno
  try {
    const { data } = await http.get(`/alunos/${aluno.id}`)
    detalhesDialog.aluno = data.data
  } catch {
    toast.error('Erro ao carregar dados do aluno')
    detalhesDialog.aberto = false
  } finally {
    detalhesDialog.loading = false
  }
}

// Dialog de confirmação
const confirmDialog = reactive({
  aberto: false,
  titulo: '',
  descricao: '',
  confirmarLabel: 'Confirmar',
  variante: 'default',
  loading: false,
  acao: () => {},
})

function confirmarCancelar(aluno) {
  Object.assign(confirmDialog, {
    aberto: true,
    titulo: 'Cancelar aluno',
    descricao: `Deseja cancelar o aluno "${aluno.nome}"? Esta ação não pode ser desfeita.`,
    confirmarLabel: 'Cancelar aluno',
    variante: 'destructive',
    loading: false,
    acao: async () => {
      confirmDialog.loading = true
      try {
        await store.cancelar(aluno.id)
        toast.info(`Aluno "${aluno.nome}" cancelado`)
        confirmDialog.aberto = false
      } catch {
        toast.error('Erro ao cancelar aluno')
      } finally {
        confirmDialog.loading = false
      }
    },
  })
}

function confirmarGerarHash(aluno) {
  Object.assign(confirmDialog, {
    aberto: true,
    titulo: 'Gerar certificado',
    descricao: `Deseja gerar o certificado para "${aluno.nome}"? Esta ação é irreversível.`,
    confirmarLabel: 'Gerar certificado',
    variante: 'default',
    loading: false,
    acao: async () => {
      confirmDialog.loading = true
      try {
        await store.gerarHash(aluno.id)
        toast.success('Certificado gerado com sucesso!')
        confirmDialog.aberto = false
      } catch (e) {
        toast.error(e.response?.data?.message || 'Erro ao gerar certificado')
      } finally {
        confirmDialog.loading = false
      }
    },
  })
}

async function handleDownload(id, hash) {
  try {
    const { data } = await http.get(`/alunos/${id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([data], { type: 'application/xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `certificado-${hash.slice(0, 8)}.xml`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Erro ao baixar o certificado XML')
  }
}

onMounted(() => store.listar())
</script>
