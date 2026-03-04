import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  requireHold?: boolean // if true, uses 1.2s hold-to-confirm button
}

const isVisible = ref(false)
const options = ref<ConfirmOptions>({
  title: '¿Estás seguro?',
  message: 'Esta acción no se puede deshacer.',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  requireHold: false,
})

let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    options.value = { ...options.value, ...opts }
    isVisible.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const proceed = () => {
    if (resolvePromise) resolvePromise(true)
    close()
  }

  const cancel = () => {
    if (resolvePromise) resolvePromise(false)
    close()
  }

  const close = () => {
    isVisible.value = false
    resolvePromise = null
  }

  return {
    isVisible,
    options,
    confirm,
    proceed,
    cancel,
    close,
  }
}
