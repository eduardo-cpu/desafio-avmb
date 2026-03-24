<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/40">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle class="text-2xl">{{ isLogin ? 'Entrar' : 'Cadastrar Instituição' }}</CardTitle>
        <CardDescription>
          {{ isLogin ? 'Acesse sua conta para continuar' : 'Crie sua conta para começar' }}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="!isLogin" class="space-y-2">
            <Label for="nome">Nome da Instituição</Label>
            <Input id="nome" v-model="form.nome" placeholder="Ex: Universidade XYZ" required />
          </div>

          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <Input id="email" v-model="form.email" type="email" placeholder="admin@instituicao.com" required />
          </div>

          <div class="space-y-2">
            <Label for="senha">Senha</Label>
            <Input id="senha" v-model="form.senha" type="password" placeholder="••••••••" required />
          </div>

          <p v-if="erro" class="text-sm text-destructive">{{ erro }}</p>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar') }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center">
        <p class="text-sm text-muted-foreground">
          {{ isLogin ? 'Não tem conta?' : 'Já tem conta?' }}
          <a href="#" class="text-primary underline-offset-4 hover:underline ml-1" @click.prevent="isLogin = !isLogin">
            {{ isLogin ? 'Cadastre-se' : 'Faça login' }}
          </a>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const auth = useAuthStore()

const isLogin = ref(true)
const loading = ref(false)
const erro = ref('')

const form = reactive({ nome: '', email: '', senha: '' })

async function handleSubmit() {
  erro.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      await auth.login(form.email, form.senha)
    } else {
      await auth.register(form.nome, form.email, form.senha)
      await auth.login(form.email, form.senha)
    }
    router.push('/dashboard')
  } catch (e) {
    erro.value = e.response?.data?.message || 'Erro ao autenticar'
  } finally {
    loading.value = false
  }
}
</script>
