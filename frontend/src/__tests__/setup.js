import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  setActivePinia(createPinia())
})

// Stub RouterLink e RouterView globalmente
config.global.stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' },
}

// Stub window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: { createObjectURL: vi.fn(() => 'blob:stub'), revokeObjectURL: vi.fn() },
  writable: true,
})
