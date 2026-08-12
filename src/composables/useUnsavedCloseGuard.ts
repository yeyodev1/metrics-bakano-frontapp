import { ref, computed, watch, nextTick, onUnmounted, type Ref } from 'vue'
import { useConfirm } from './useConfirm'

interface UnsavedCloseGuardOptions {
  /** Prop `show` del modal: dispara la foto inicial y el listener de Escape. */
  show: Ref<boolean>
  /** Todo lo que el usuario puede haber escrito, serializable. */
  state: () => unknown
  /** Qué hacer cuando sí se cierra (normalmente `emit('close')`). */
  onClose: () => void
  /** Mientras esté en true no se cierra por ningún camino. */
  isBusy?: Ref<boolean>
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

/**
 * Confirmación antes de cerrar un modal con datos sin guardar.
 *
 * Se hizo porque los modales de este proyecto guardan al final, y un clic fuera
 * borraba todo lo escrito. Sin cambios respecto a lo que había al abrir cierra
 * directo: preguntar cuando no hay nada que perder solo estorba.
 */
export function useUnsavedCloseGuard(options: UnsavedCloseGuardOptions) {
  const { confirm } = useConfirm()

  const snapshot = ref('')
  const asking = ref(false)

  const serialize = () => JSON.stringify(options.state())

  const isDirty = computed(() => snapshot.value !== serialize())

  /**
   * La foto se toma en el siguiente tick: el padre suele rellenar el formulario
   * en su propio watcher de `show`, y el orden de registro no está garantizado.
   */
  async function takeSnapshot() {
    await nextTick()
    snapshot.value = serialize()
  }

  /** Devuelve true si de verdad se cerró — útil para abortar navegaciones. */
  async function requestClose(): Promise<boolean> {
    if (options.isBusy?.value || asking.value) return false

    if (!isDirty.value) {
      options.onClose()
      return true
    }

    asking.value = true
    const salir = await confirm({
      title: options.title ?? '¿Cerrar sin guardar?',
      message:
        options.message ??
        'Lo que escribiste todavía no se ha guardado. Si cierras ahora se pierde.',
      confirmText: options.confirmText ?? 'Salir y descartar',
      cancelText: options.cancelText ?? 'Seguir editando',
    })
    asking.value = false

    if (salir) options.onClose()
    return salir
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    requestClose()
  }

  watch(
    options.show,
    (visible) => {
      if (visible) {
        takeSnapshot()
        document.addEventListener('keydown', onKeydown)
      } else {
        document.removeEventListener('keydown', onKeydown)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => document.removeEventListener('keydown', onKeydown))

  return { isDirty, requestClose, takeSnapshot }
}
