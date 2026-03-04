import { ref } from 'vue'
import type { WorkspaceUser } from '@/types'

export interface UserFormModalOptions {
  mode: 'create' | 'edit'
  workspaceId: string
  user?: WorkspaceUser
}

const isVisible = ref(false)
const modalOptions = ref<UserFormModalOptions>({
  mode: 'create',
  workspaceId: ''
})

let resolvePromise: ((user: WorkspaceUser | null) => void) | null = null

export function useUserFormModal() {
  const open = (options: UserFormModalOptions): Promise<WorkspaceUser | null> => {
    modalOptions.value = options
    isVisible.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const close = (user: WorkspaceUser | null = null) => {
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
