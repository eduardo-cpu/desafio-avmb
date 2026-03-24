<template>
  <div style="padding: 2rem">
    <h1>Dashboard</h1>
    <p>Bem-vindo, {{ auth.instituicao?.nome }}!</p>
    <button @click="sair">Sair</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push('/login')
}
</script>
