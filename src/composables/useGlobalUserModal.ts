import { ref } from 'vue'
import type { WorkspaceUser } from '@/types'

export interface GlobalUserModalOptions {
  mode: 'create' | 'edit'
  user?: WorkspaceUser
}

const isVisible = ref(false)
const modalOptions = ref<GlobalUserModalOptions>({
  mode: 'create'
})

let resolvePromise: ((user: any | null) => void) | null = null

export function useGlobalUserModal() {
  const open = (options: GlobalUserModalOptions): Promise<any | null> => {
    modalOptions.value = options
    isVisible.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const close = (user: any | null = null) => {
    isVisible.value = false
    if (resolvePromise) {
      resolvePromise(user)
      resolvePromise = null
    }
  }

  return {
    isVisible,
    modalOptions,
    open,
    close
  }
}
