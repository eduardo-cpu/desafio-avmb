import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '@/stores/toast'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
})

describe('useToastStore', () => {
  it('adiciona um toast', () => {
    const store = useToastStore()
    store.add('Olá', 'info')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].message).toBe('Olá')
    expect(store.toasts[0].type).toBe('info')
  })

  it('remove o toast após a duração', () => {
    const store = useToastStore()
    store.add('Temporário', 'default', 1000)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(store.toasts).toHaveLength(0)
  })

  it('remove toast manualmente pelo id', () => {
    const store = useToastStore()
    store.add('Manual')
    const id = store.toasts[0].id
    store.remove(id)
    expect(store.toasts).toHaveLength(0)
  })

  it('success() adiciona toast do tipo success', () => {
    const store = useToastStore()
    store.success('Salvo!')
    expect(store.toasts[0].type).toBe('success')
  })

  it('error() adiciona toast do tipo error', () => {
    const store = useToastStore()
    store.error('Falhou')
    expect(store.toasts[0].type).toBe('error')
  })

  it('suporta múltiplos toasts simultâneos', () => {
    const store = useToastStore()
    store.success('A')
    store.error('B')
    store.info('C')
    expect(store.toasts).toHaveLength(3)
    const types = store.toasts.map(t => t.type)
    expect(types).toContain('success')
    expect(types).toContain('error')
    expect(types).toContain('info')
  })
})
