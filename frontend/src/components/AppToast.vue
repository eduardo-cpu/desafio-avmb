<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <Transition
        v-for="toast in store.toasts"
        :key="toast.id"
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
        appear
      >
        <div
          :class="[
            'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm',
            toastClass(toast.type)
          ]"
        >
          <component :is="toastIcon(toast.type)" class="size-4 mt-0.5 shrink-0" />
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            @click="store.remove(toast.id)"
          >
            <X class="size-3.5" />
          </button>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const store = useToastStore()

function toastClass(type) {
  const map = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    default: 'bg-background border-border text-foreground',
  }
  return map[type] ?? map.default
}

function toastIcon(type) {
  const map = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    default: AlertCircle,
  }
  return map[type] ?? map.default
}
</script>
