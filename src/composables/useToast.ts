export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
}

import { ref } from 'vue'

const toasts = ref<ToastMessage[]>([])
let nextId = 0

export function useToast() {
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = nextId++
    const duration = toast.duration ?? 4000

    toasts.value.push({ ...toast, id })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, title?: string, duration?: number) => {
    addToast({ type: 'success', message, title, duration })
  }

  const error = (message: string, title?: string, duration?: number) => {
    addToast({ type: 'error', message, title, duration })
  }

  const info = (message: string, title?: string, duration?: number) => {
    addToast({ type: 'info', message, title, duration })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    addToast({ type: 'warning', message, title, duration })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
