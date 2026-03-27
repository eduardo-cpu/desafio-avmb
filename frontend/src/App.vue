<template>
  <RouterView />
  <AppToast />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppToast from '@/components/AppToast.vue'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!auth.isAuthenticated) return
  try {
    await http.get('/auth/me')
  } catch {
    auth.logout()
    router.push('/login')
  }
})
</script>
