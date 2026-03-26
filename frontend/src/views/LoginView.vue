<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/40 p-4">
    <div class="w-full max-w-md space-y-6">
      <!-- Brand -->
      <div class="text-center space-y-2">
        <div class="inline-flex size-12 items-center justify-center rounded-xl bg-primary mx-auto">
          <GraduationCap class="size-6 text-primary-foreground" />
        </div>
        <h1 class="text-2xl font-bold">CertFlow</h1>
        <p class="text-sm text-muted-foreground">Gestão de certificados acadêmicos</p>
      </div>

      <Card>
        <CardHeader class="pb-4">
          <CardTitle>{{ isLogin ? 'Entrar na plataforma' : 'Criar conta' }}</CardTitle>
          <CardDescription>
            {{ isLogin ? 'Acesse com suas credenciais de instituição' : 'Cadastre sua instituição de ensino' }}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div v-if="!isLogin" class="space-y-2">
              <Label for="nome">Nome da Instituição</Label>
              <Input
                id="nome"
                v-model="form.nome"
                placeholder="Ex: Universidade XYZ"
                autocomplete="organization"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="email">E-mail</Label>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="admin@instituicao.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="senha">Senha</Label>
              <div class="relative">
                <Input
                  id="senha"
                  v-model="form.senha"
                  :type="senhaVisivel ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="pr-10"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  @click="senhaVisivel = !senhaVisivel"
                >
                  <Eye v-if="!senhaVisivel" class="size-4" />
                  <EyeOff v-else class="size-4" />
                </button>
              </div>
            </div>

            <div
              v-if="erro"
              class="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle class="size-4 shrink-0" />
              {{ erro }}
            </div>

            <Button type="submit" class="w-full" :disabled="loading">
              <Loader2 v-if="loading" class="size-4 animate-spin" />
              {{ loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar conta') }}
            </Button>
          </form>
        </CardContent>

        <CardFooter class="justify-center">
          <p class="text-sm text-muted-foreground">
            {{ isLogin ? 'Não tem conta?' : 'Já tem conta?' }}
            <button
              type="button"
              class="text-primary underline-offset-4 hover:underline ml-1 font-medium"
              @click="toggleMode"
            >
              {{ isLogin ? 'Cadastre-se' : 'Faça login' }}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next'
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
const senhaVisivel = ref(false)

const form = reactive({ nome: '', email: '', senha: '' })

function toggleMode() {
  isLogin.value = !isLogin.value
  erro.value = ''
  form.nome = ''
  form.email = ''
  form.senha = ''
}

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
    erro.value = e.response?.data?.message || 'Credenciais inválidas. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>
