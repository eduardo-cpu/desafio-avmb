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
        <Button size="sm" @click="abrirModal()">
          <Plus class="size-3.5 mr-1.5" />
          Novo Aluno
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
            <TableRow v-else-if="alunosFiltrados.length === 0">
              <TableCell colspan="5" class="text-center py-12 text-muted-foreground">
                <div class="flex flex-col items-center gap-2">
                  <Users class="size-8 opacity-30" />
                  <p class="text-sm">{{ busca ? 'Nenhum resultado encontrado' : 'Nenhum aluno cadastrado' }}</p>
                </div>
              </TableCell>
            </TableRow>
            <TableRow
              v-else
              v-for="aluno in alunosFiltrados"
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
                <template v-if="aluno.status !== 'CANCELADO'">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      v-if="aluno.status !== 'CERTIFICADO'"
                      variant="ghost" size="icon-sm"
                      title="Editar"
                      @click="abrirModal(aluno)"
                    >
                      <Pencil class="size-3.5" />
                    </Button>
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
                  </div>
                </template>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Modal criar/editar -->
    <Dialog v-model:open="modalAberto">
      <DialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ alunoEditando ? 'Editar Aluno' : 'Novo Aluno' }}</DialogTitle>
          <DialogDescription>Preencha os dados do aluno abaixo</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="salvar" class="space-y-4 py-2">
          <div class="space-y-2">
            <Label>Nome completo</Label>
            <Input
              v-model="form.nome"
              :class="errosForm.nome ? 'border-destructive focus-visible:ring-destructive' : ''"
              placeholder="João da Silva"
            />
            <p v-if="errosForm.nome" class="text-xs text-destructive flex items-center gap-1">
              <AlertCircle class="size-3" />{{ errosForm.nome }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>CPF</Label>
              <Input
                v-model="form.cpf"
                :class="errosForm.cpf ? 'border-destructive focus-visible:ring-destructive' : ''"
                placeholder="000.000.000-00"
              />
              <p v-if="errosForm.cpf" class="text-xs text-destructive flex items-center gap-1">
                <AlertCircle class="size-3" />{{ errosForm.cpf }}
              </p>
            </div>
            <div class="space-y-2">
              <Label>Data de nascimento</Label>
              <Input v-model="form.dtNascimento" type="date" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>URL de callback <span class="text-muted-foreground font-normal text-xs">(webhook)</span></Label>
            <Input
              v-model="form.urlCallback"
              :class="errosForm.urlCallback ? 'border-destructive focus-visible:ring-destructive' : ''"
              placeholder="https://..."
            />
            <p v-if="errosForm.urlCallback" class="text-xs text-destructive flex items-center gap-1">
              <AlertCircle class="size-3" />{{ errosForm.urlCallback }}
            </p>
          </div>

          <Separator />

          <p class="text-sm font-semibold">Dados do Curso</p>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Nome do curso</Label>
              <Input
                v-model="form.curso.nome"
                :class="errosForm['curso.nome'] ? 'border-destructive focus-visible:ring-destructive' : ''"
                placeholder="Desenvolvimento Web"
              />
              <p v-if="errosForm['curso.nome']" class="text-xs text-destructive flex items-center gap-1">
                <AlertCircle class="size-3" />{{ errosForm['curso.nome'] }}
              </p>
            </div>
            <div class="space-y-2">
              <Label>Código</Label>
              <Input
                v-model="form.curso.codigo"
                :class="errosForm['curso.codigo'] ? 'border-destructive focus-visible:ring-destructive' : ''"
                placeholder="DEV-001"
              />
              <p v-if="errosForm['curso.codigo']" class="text-xs text-destructive flex items-center gap-1">
                <AlertCircle class="size-3" />{{ errosForm['curso.codigo'] }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Data início</Label>
              <Input
                v-model="form.curso.dt_inicio"
                type="date"
                :class="errosForm['curso.dt_inicio'] ? 'border-destructive focus-visible:ring-destructive' : ''"
              />
              <p v-if="errosForm['curso.dt_inicio']" class="text-xs text-destructive flex items-center gap-1">
                <AlertCircle class="size-3" />{{ errosForm['curso.dt_inicio'] }}
              </p>
            </div>
            <div class="space-y-2">
              <Label>Data fim</Label>
              <Input
                v-model="form.curso.dt_fim"
                type="date"
                :class="errosForm['curso.dt_fim'] ? 'border-destructive focus-visible:ring-destructive' : ''"
              />
              <p v-if="errosForm['curso.dt_fim']" class="text-xs text-destructive flex items-center gap-1">
                <AlertCircle class="size-3" />{{ errosForm['curso.dt_fim'] }}
              </p>
            </div>
          </div>
          <div class="space-y-2">
            <Label>Docente responsável</Label>
            <Input
              v-model="form.curso.docente"
              :class="errosForm['curso.docente'] ? 'border-destructive focus-visible:ring-destructive' : ''"
              placeholder="Prof. Carlos"
            />
            <p v-if="errosForm['curso.docente']" class="text-xs text-destructive flex items-center gap-1">
              <AlertCircle class="size-3" />{{ errosForm['curso.docente'] }}
            </p>
          </div>

          <div
            v-if="erroForm"
            class="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle class="size-4 shrink-0" />
            {{ erroForm }}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="modalAberto = false">Cancelar</Button>
            <Button type="submit" :disabled="salvando">
              <Loader2 v-if="salvando" class="size-4 animate-spin mr-1.5" />
              {{ salvando ? 'Salvando...' : 'Salvar' }}
            </Button>
          </DialogFooter>
        </form>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Upload, Pencil, Award, Download, Ban, Users, AlertCircle, Loader2 } from 'lucide-vue-next'
import http from '@/api/http'
import { useAlunosStore } from '@/stores/alunos'
import { useToastStore } from '@/stores/toast'
import { formatCpf, badgeVariant } from '@/utils/formatters'
import { validarFormAluno } from '@/utils/validarAluno'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const router = useRouter()
const store = useAlunosStore()
const toast = useToastStore()

const busca = ref('')
const modalAberto = ref(false)
const alunoEditando = ref(null)
const salvando = ref(false)
const erroForm = ref('')
const errosForm = reactive({})

const alunosFiltrados = computed(() => {
  const q = busca.value.toLowerCase().replace(/\D/g, '')
  if (!busca.value.trim()) return store.alunos
  return store.alunos.filter(a => {
    const nomeMatch = a.nome?.toLowerCase().includes(busca.value.toLowerCase())
    const cpfMatch = q && a.cpf?.replace(/\D/g, '').includes(q)
    return nomeMatch || cpfMatch
  })
})

const confirmDialog = reactive({
  aberto: false,
  titulo: '',
  descricao: '',
  confirmarLabel: 'Confirmar',
  variante: 'default',
  loading: false,
  acao: () => {},
})

const formPadrao = () => ({
  nome: '', cpf: '', dtNascimento: '', urlCallback: '',
  curso: { nome: '', codigo: '', dt_inicio: '', dt_fim: '', docente: '' },
})

const form = reactive(formPadrao())

function abrirModal(aluno = null) {
  erroForm.value = ''
  Object.keys(errosForm).forEach(k => delete errosForm[k])
  alunoEditando.value = aluno
  if (aluno) {
    Object.assign(form, {
      nome: aluno.nome,
      cpf: aluno.cpf,
      dtNascimento: aluno.dtNascimento?.split('T')[0] || '',
      urlCallback: aluno.urlCallback,
      curso: {
        nome: aluno.curso?.nome || '',
        codigo: aluno.curso?.codigo || '',
        dt_inicio: aluno.curso?.dtInicio?.split('T')[0] || '',
        dt_fim: aluno.curso?.dtFim?.split('T')[0] || '',
        docente: aluno.curso?.docente || '',
      },
    })
  } else {
    Object.assign(form, formPadrao())
  }
  modalAberto.value = true
}

async function salvar() {
  erroForm.value = ''
  Object.keys(errosForm).forEach(k => delete errosForm[k])
  const erros = validarFormAluno(form)
  if (Object.keys(erros).length) {
    Object.assign(errosForm, erros)
    return
  }
  salvando.value = true
  try {
    if (alunoEditando.value) {
      await store.atualizar(alunoEditando.value.id, form)
      toast.success('Aluno atualizado com sucesso')
    } else {
      await store.criar(form)
      toast.success('Aluno cadastrado com sucesso')
    }
    modalAberto.value = false
  } catch (e) {
    erroForm.value = e.response?.data?.message || 'Erro ao salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

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
