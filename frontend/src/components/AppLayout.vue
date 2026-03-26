<template>
  <div class="min-h-screen bg-muted/30 flex">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <!-- Brand -->
      <div class="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div class="size-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <GraduationCap class="size-4 text-primary-foreground" />
        </div>
        <span class="font-semibold text-sm text-sidebar-foreground truncate">
          {{ auth.instituicao?.nome ?? 'Instituição' }}
        </span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-3 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'"
        >
          <component :is="item.icon" class="size-4 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-sidebar-border">
        <button
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          @click="handleLogout"
        >
          <LogOut class="size-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-14 bg-background border-b border-border flex items-center px-6 shrink-0">
        <div>
          <h2 class="text-sm font-semibold">{{ currentTitle }}</h2>
          <p class="text-xs text-muted-foreground">{{ currentDescription }}</p>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { GraduationCap, LayoutDashboard, Users, Upload, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alunos', label: 'Alunos', icon: Users },
  { to: '/importar', label: 'Importar', icon: Upload },
]

const routeMeta = {
  '/dashboard': { title: 'Dashboard', description: 'Visão geral da instituição' },
  '/alunos': { title: 'Alunos', description: 'Gerencie os alunos cadastrados' },
  '/importar': { title: 'Importar Alunos', description: 'Importe alunos via JSON em lote' },
}

const currentTitle = computed(() => routeMeta[route.path]?.title ?? '')
const currentDescription = computed(() => routeMeta[route.path]?.description ?? '')

function isActive(to) {
  return route.path === to
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
