<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Alunos</h1>
        <p class="text-muted-foreground text-sm">Gerencie os alunos da sua instituição</p>
      </div>
      <Button @click="abrirModal()">+ Novo Aluno</Button>
    </div>

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
            <TableRow v-if="store.loading">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground">Carregando...</TableCell>
            </TableRow>
            <TableRow v-else-if="store.alunos.length === 0">
              <TableCell colspan="5" class="text-center py-8 text-muted-foreground">Nenhum aluno cadastrado</TableCell>
            </TableRow>
            <TableRow v-for="aluno in store.alunos" :key="aluno.id">
              <TableCell class="font-medium">{{ aluno.nome }}</TableCell>
              <TableCell>{{ formatCpf(aluno.cpf) }}</TableCell>
              <TableCell>{{ aluno.curso?.nome }}</TableCell>
              <TableCell>
                <Badge :variant="badgeVariant(aluno.status)">{{ aluno.status }}</Badge>
              </TableCell>
              <TableCell class="text-right space-x-2">
                <Button variant="outline" size="sm" @click="abrirModal(aluno)">Editar</Button>
                <Button variant="destructive" size="sm" @click="confirmarRemover(aluno.id)">Remover</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Modal criar/editar -->
    <Dialog v-model:open="modalAberto">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ alunoEditando ? 'Editar Aluno' : 'Novo Aluno' }}</DialogTitle>
          <DialogDescription>Preencha os dados do aluno</DialogDescription>
        </DialogHeader>

        <form @submit.prevent="salvar" class="space-y-4">
          <div class="space-y-2">
            <Label>Nome completo</Label>
            <Input v-model="form.nome" placeholder="João da Silva" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>CPF</Label>
              <Input v-model="form.cpf" placeholder="000.000.000-00" required />
            </div>
            <div class="space-y-2">
              <Label>Data de nascimento</Label>
              <Input v-model="form.dtNascimento" type="date" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>URL de callback</Label>
            <Input v-model="form.urlCallback" placeholder="https://..." required />
          </div>

          <Separator />
          <p class="text-sm font-medium">Curso</p>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Nome do curso</Label>
              <Input v-model="form.curso.nome" placeholder="Desenvolvimento Web" required />
            </div>
            <div class="space-y-2">
              <Label>Código</Label>
              <Input v-model="form.curso.codigo" placeholder="DEV-001" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Data início</Label>
              <Input v-model="form.curso.dt_inicio" type="date" required />
            </div>
            <div class="space-y-2">
              <Label>Data fim</Label>
              <Input v-model="form.curso.dt_fim" type="date" required />
            </div>
          </div>
          <div class="space-y-2">
            <Label>Docente</Label>
            <Input v-model="form.curso.docente" placeholder="Prof. Carlos" required />
          </div>

          <p v-if="erro" class="text-sm text-destructive">{{ erro }}</p>

          <DialogFooter>
            <Button type="button" variant="outline" @click="modalAberto = false">Cancelar</Button>
            <Button type="submit" :disabled="salvando">
              {{ salvando ? 'Salvando...' : 'Salvar' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAlunosStore } from '@/stores/alunos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'

const store = useAlunosStore()

const modalAberto = ref(false)
const alunoEditando = ref(null)
const salvando = ref(false)
const erro = ref('')

const formPadrao = () => ({
  nome: '', cpf: '', dtNascimento: '', urlCallback: '',
  curso: { nome: '', codigo: '', dt_inicio: '', dt_fim: '', docente: '' }
})

const form = reactive(formPadrao())

function abrirModal(aluno = null) {
  erro.value = ''
  alunoEditando.value = aluno
  if (aluno) {
    form.nome = aluno.nome
    form.cpf = aluno.cpf
    form.dtNascimento = aluno.dtNascimento?.split('T')[0] || ''
    form.urlCallback = aluno.urlCallback
    form.curso.nome = aluno.curso?.nome || ''
    form.curso.codigo = aluno.curso?.codigo || ''
    form.curso.dt_inicio = aluno.curso?.dtInicio?.split('T')[0] || ''
    form.curso.dt_fim = aluno.curso?.dtFim?.split('T')[0] || ''
    form.curso.docente = aluno.curso?.docente || ''
  } else {
    Object.assign(form, formPadrao())
  }
  modalAberto.value = true
}

async function salvar() {
  erro.value = ''
  salvando.value = true
  try {
    if (alunoEditando.value) {
      await store.atualizar(alunoEditando.value.id, form)
    } else {
      await store.criar(form)
    }
    modalAberto.value = false
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao salvar'
  } finally {
    salvando.value = false
  }
}

async function confirmarRemover(id) {
  if (confirm('Deseja remover este aluno?')) {
    await store.remover(id)
  }
}

function formatCpf(cpf) {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function badgeVariant(status) {
  const map = {
    PENDENTE: 'secondary',
    ATIVO: 'default',
    CERTIFICADO: 'default',
    CANCELADO: 'destructive',
  }
  return map[status] || 'secondary'
}

onMounted(() => store.listar())
</script>
