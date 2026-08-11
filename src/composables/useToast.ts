export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
}

import { ref } from 'vue'
import { play, type SoundName } from 'cuelume'

const toasts = ref<ToastMessage[]>([])
let nextId = 0

/**
 * A toast is the app answering back, so each kind gets its own cue.
 * Playback respects the global enabled/volume set by `useSoundStore`.
 */
const TOAST_SOUND: Record<ToastMessage['type'], SoundName> = {
  success: 'success',
  error: 'error',
  warning: 'pulse',
  info: 'droplet',
}

export function useToast() {
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = nextId++
    const duration = toast.duration ?? 4000

    toasts.value.push({ ...toast, id })

    // Sound is decorative — it must never break the notification itself.
    try {
      play(TOAST_SOUND[toast.type])
    } catch {
      /* ignored */
    }

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
