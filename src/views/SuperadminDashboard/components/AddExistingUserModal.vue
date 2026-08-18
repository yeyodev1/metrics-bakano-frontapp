<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import ExistingUserPickerList from './ExistingUserPickerList.vue'
import type { Workspace, WorkspaceUser } from '@/types'

/**
 * Sumar a un entorno a alguien que YA existe en la plataforma.
 *
 * Antes la unica via era "Nuevo usuario": habia que re-tipear email y datos
 * de un colaborador que ya estaba en otro entorno, y si no recordabas su
 * correo exacto simplemente "no existia". Esto lo vuelve un picker.
 */

const props = defineProps<{
  show: boolean
  workspace: Workspace | null
  /** Ids de quienes ya estan en el entorno: no tiene sentido ofrecerlos. */
  currentUserIds: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'added', user: WorkspaceUser): void
}>()

const toast = useToast()

const allUsers = ref<WorkspaceUser[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const selectedId = ref<string | undefined>(undefined)
const role = ref<'admin' | 'colaborador'>('colaborador')
const busqueda = ref('')

watch(
  () => props.show,
  async (visible) => {
    if (!visible) return
    selectedId.value = undefined
    role.value = 'colaborador'
    busqueda.value = ''
    error.value = null
    loading.value = true
    try {
      const { users } = await workspaceService.listAllCollaborators()
      allUsers.value = users
    } catch {
      error.value = 'No se pudieron cargar los usuarios.'
    } finally {
      loading.value = false
    }
  },
  // Si el modal se monta ya visible, la carga debe disparar igual.
  { immediate: true },
)

// Los internos de Bakano ya tienen acceso global: ofrecer solo externos.
const candidatos = computed(() =>
  allUsers.value.filter(
    (u) => !u.isInternal && !props.currentUserIds.includes(u._id),
  ),
)

// Lista visible y filtrable, no un dropdown: el desplegable se recortaba
// contra el borde del modal y solo dejaba ver dos o tres personas.
const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return candidatos.value
  return candidatos.value.filter((u) =>
    `${u.name ?? ''} ${u.email}`.toLowerCase().includes(q),
  )
})

const seleccionado = computed(() => candidatos.value.find((u) => u._id === selectedId.value))

async function agregar() {
  if (!props.workspace || !seleccionado.value || saving.value) return
  saving.value = true
  error.value = null
  try {
    // createUser con email existente vincula al usuario al entorno sin
    // pedir contrasena: el backend detecta que ya existe.
    const { user } = await workspaceService.createUser(props.workspace._id, {
      name: seleccionado.value.name || '',
      email: seleccionado.value.email,
      password: '',
      role: role.value,
    })
    toast.success(`${seleccionado.value.name || seleccionado.value.email} agregado al entorno.`)
    emit('added', user)
    emit('close')
  } catch (err: any) {
    if (err?.status === 409) {
      error.value = 'Ese usuario ya está en este entorno.'
    } else {
      error.value = err?.data?.message || 'No se pudo agregar el usuario.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Transition name="global-modal">
    <div v-if="show && workspace" class="aeu__overlay" @click.self="emit('close')">
      <div class="aeu" role="dialog" aria-modal="true">
        <div class="aeu__header">
          <h3>Agregar usuario existente</h3>
          <button class="aeu__close" @click="emit('close')" aria-label="Cerrar">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <p class="aeu__subtitle">
          Suma a <strong>{{ workspace.name }}</strong> a alguien que ya está en otro entorno.
        </p>

        <div v-if="loading" class="aeu__loading">Cargando usuarios…</div>

        <template v-else>
          <div class="aeu__group">
            <div class="aeu__label-row">
              <label class="aeu__label">Usuario</label>
              <span class="aeu__count">{{ filtrados.length }} disponibles</span>
            </div>
            <div class="aeu__search">
              <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                v-model="busqueda"
                type="text"
                class="aeu__search-input"
                placeholder="Filtrar por nombre o correo…"
              />
            </div>
            <ExistingUserPickerList v-model:selected-id="selectedId" :users="filtrados" />
          </div>

          <div class="aeu__group">
            <label class="aeu__label">Rol en este entorno</label>
            <div class="aeu__roles">
              <button
                type="button"
                class="aeu__role"
                :class="{ 'is-active': role === 'colaborador' }"
                @click="role = 'colaborador'"
              >
                <i class="fa-solid fa-user" /> Colaborador
              </button>
              <button
                type="button"
                class="aeu__role"
                :class="{ 'is-active': role === 'admin' }"
                @click="role = 'admin'"
              >
                <i class="fa-solid fa-user-tie" /> Administrador
              </button>
            </div>
          </div>

          <div v-if="error" class="aeu__error">
            <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
          </div>

          <div class="aeu__footer">
            <button type="button" class="aeu__btn-ghost" @click="emit('close')">Cancelar</button>
            <button
              type="button"
              class="aeu__btn-primary"
              :disabled="!seleccionado || saving"
              @click="agregar"
            >
              <span v-if="saving" class="aeu__spinner" />
              <i v-else class="fa-solid fa-user-plus" />
              Agregar al entorno
            </button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.aeu__overlay {
  position: fixed;
  inset: 0;
  background: rgba($primary-dark, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1300;
}

.aeu {
  background: $white;
  border-radius: 16px;
  width: min(480px, 100%);
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: $primary-dark;
    }
  }

  &__close {
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    font-size: 1.05rem;
    padding: 0.25rem;

    &:hover {
      color: $primary-dark;
    }
  }

  &__subtitle {
    font-size: 0.85rem;
    color: $text-secondary;
    margin-top: -0.5rem;
  }

  &__loading {
    padding: 2rem 0;
    text-align: center;
    color: $text-secondary;
    font-size: 0.88rem;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__label {
    font-size: 0.76rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $primary-dark;
    opacity: 0.8;
  }

  &__label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__count {
    font-size: 0.72rem;
    font-weight: 700;
    color: $text-secondary;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    padding: 0.55rem 0.8rem;
    background: rgba($primary-dark, 0.02);

    i { color: $text-secondary; font-size: 0.8rem; }

    &:focus-within { border-color: $primary; background: $white; }
  }

  &__search-input {
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 0.88rem;
    width: 100%;
    color: $primary-dark;
  }

  &__roles {
    display: flex;
    gap: 0.5rem;
  }

  &__role {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    background: rgba($primary-dark, 0.02);
    color: $text-secondary;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;

    &:hover {
      border-color: rgba($primary-dark, 0.25);
      color: $primary-dark;
    }

    &.is-active {
      background: rgba($primary, 0.08);
      border-color: $primary;
      color: $primary;
    }
  }

  &__error {
    font-size: 0.8rem;
    color: $alert-error;
    background: $alert-error-bg;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding-top: 0.25rem;
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    color: $text-secondary;
    font-weight: 700;
    padding: 0.65rem 1.1rem;
    border-radius: 10px;
    cursor: pointer;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }
  }

  &__btn-primary {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      filter: brightness(1.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba($white, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: aeu-spin 0.8s linear infinite;
  }
}

@keyframes aeu-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
