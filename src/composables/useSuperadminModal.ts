import { ref } from 'vue'

export interface SuperadminModalResult {
  _id: string
  name?: string
  email: string
  role: string
}

const isVisible = ref(false)

let resolvePromise: ((user: SuperadminModalResult | null) => void) | null = null

export function useSuperadminModal() {
  const open = (): Promise<SuperadminModalResult | null> => {
    isVisible.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const close = (user: SuperadminModalResult | null = null) => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(user)
      resolvePromise = null
    }
  }

  return {
    isVisible,
    open,
    close,
  }
}
