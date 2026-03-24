<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-muted-foreground text-sm">Bem-vindo, {{ auth.instituicao?.nome }}</p>
      </div>
      <Button variant="outline" @click="auth.logout() || router.push('/login')">Sair</Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card v-for="stat in statCards" :key="stat.label">
        <CardHeader class="pb-2">
          <CardDescription>{{ stat.label }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="store.loading" class="h-8 w-16" />
          <div v-else class="text-3xl font-bold">{{ stat.valor }}</div>
          <p class="text-xs text-muted-foreground mt-1">{{ stat.sub }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Alunos recentes -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Alunos Recentes</CardTitle>
          <CardDescription>Últimos 5 cadastrados</CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="router.push('/importar')">Importar JSON</Button>
          <Button variant="outline" size="sm" @click="router.push('/alunos')">Ver todos →</Button>
        </div>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastrado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="store.loading">
              <TableCell colspan="4" class="text-center py-8">
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!store.stats?.recentes?.length">
              <TableCell colspan="4" class="text-center py-8 text-muted-foreground">
                Nenhum aluno cadastrado ainda
              </TableCell>
            </TableRow>
            <TableRow v-for="aluno in store.stats?.recentes" :key="aluno.id">
              <TableCell class="font-medium">{{ aluno.nome }}</TableCell>
              <TableCell>{{ aluno.curso?.nome }}</TableCell>
              <TableCell>
                <Badge :variant="badgeVariant(aluno.status)">{{ aluno.status }}</Badge>
              </TableCell>
              <TableCell class="text-muted-foreground text-sm">
                {{ formatarData(aluno.createdAt) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const router = useRouter()
const auth = useAuthStore()
const store = useDashboardStore()

const statCards = computed(() => [
  { label: 'Total de Alunos', valor: store.stats?.total ?? '—', sub: 'cadastrados' },
  { label: 'Certificados', valor: store.stats?.certificados ?? '—', sub: 'com hash gerado' },
  { label: 'Pendentes', valor: store.stats?.pendentes ?? '—', sub: 'aguardando certificação' },
  { label: 'Cancelados', valor: store.stats?.cancelados ?? '—', sub: 'cancelamentos' },
])

function badgeVariant(status) {
  const map = {
    PENDENTE: 'secondary',
    ATIVO: 'default',
    CERTIFICADO: 'default',
    CANCELADO: 'destructive',
  }
  return map[status] || 'secondary'
}

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

onMounted(() => store.carregar())
</script>
