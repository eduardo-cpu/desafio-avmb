<template>
  <div class="space-y-6">
    <!-- Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card v-for="stat in statCards" :key="stat.label">
        <CardContent class="pt-6">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{{ stat.label }}</p>
              <Skeleton v-if="store.loading" class="h-8 w-14" />
              <p v-else class="text-3xl font-bold tabular-nums">{{ stat.valor }}</p>
            </div>
            <div :class="['p-2 rounded-lg', stat.iconBg]">
              <component :is="stat.icon" :class="['size-4', stat.iconColor]" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-2">{{ stat.sub }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Alunos Recentes -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle class="text-base">Alunos Recentes</CardTitle>
          <CardDescription>Últimos 5 cadastrados na plataforma</CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="router.push('/importar')">
            <Upload class="size-3.5 mr-1.5" />
            Importar
          </Button>
          <Button size="sm" @click="router.push('/alunos')">
            Ver todos
          </Button>
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
            <template v-if="store.loading">
              <TableRow v-for="i in 3" :key="i">
                <TableCell v-for="j in 4" :key="j">
                  <Skeleton class="h-4 w-24" />
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-else-if="!store.stats?.recentes?.length">
              <TableCell colspan="4" class="text-center py-10 text-muted-foreground">
                <div class="flex flex-col items-center gap-2">
                  <Users class="size-8 opacity-30" />
                  <p class="text-sm">Nenhum aluno cadastrado ainda</p>
                  <Button variant="link" size="sm" @click="router.push('/importar')">Importar alunos →</Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else v-for="aluno in store.stats.recentes" :key="aluno.id">
              <TableCell class="font-medium">{{ aluno.nome }}</TableCell>
              <TableCell class="text-muted-foreground">{{ aluno.curso?.nome }}</TableCell>
              <TableCell>
                <Badge :variant="badgeVariant(aluno.status)">{{ aluno.status }}</Badge>
              </TableCell>
              <TableCell class="text-muted-foreground text-sm">{{ formatarData(aluno.createdAt) }}</TableCell>
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
import { Users, Award, Clock, XCircle, Upload } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { formatarData, badgeVariant } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const router = useRouter()
const store = useDashboardStore()

const statCards = computed(() => [
  {
    label: 'Total', valor: store.stats?.total ?? '—', sub: 'alunos cadastrados',
    icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
  },
  {
    label: 'Certificados', valor: store.stats?.certificados ?? '—', sub: 'com XML gerado',
    icon: Award, iconBg: 'bg-green-50', iconColor: 'text-green-600',
  },
  {
    label: 'Pendentes', valor: store.stats?.pendentes ?? '—', sub: 'aguardando certificação',
    icon: Clock, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600',
  },
  {
    label: 'Cancelados', valor: store.stats?.cancelados ?? '—', sub: 'cancelamentos',
    icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600',
  },
])

onMounted(() => store.carregar())
</script>
