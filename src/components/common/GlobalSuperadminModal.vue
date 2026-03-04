<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSuperadminModal } from '@/composables/useSuperadminModal'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import type { ApiError } from '@/types'

const { isVisible, close } = useSuperadminModal()
const toast = useToast()

const name = ref('')
const email = ref('')
const password = ref('')
const isSaving = ref(false)
const errorMsg = ref('')

watch(isVisible, (visible) => {
  if (visible) {
    name.value = ''
    email.value = ''
    password.value = ''
    errorMsg.value = ''
  }
})

async function handleSubmit() {
  if (isSaving.value) return

  if (!email.value.trim()) {
    errorMsg.value = 'El correo es obligatorio.'
    return
  }
  if (password.value.length < 8) {
    errorMsg.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  isSaving.value = true
  errorMsg.value = ''

  try {
    const { user } = await workspaceService.createSuperadmin({
      name: name.value.trim() || undefined,
      email: email.value.trim(),
      password: password.value,
    })
    toast.success(`Superadmin "${user.email}" creado exitosamente.`)
    close(user)
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) {
      errorMsg.value = 'Ya existe una cuenta con ese email.'
    } else {
      toast.error('Ocurrió un error al crear el superadmin.')
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Transition name="global-modal">
    <div v-if="isVisible" class="global-modal-overlay" @click.self="close(null)">
      <div class="global-modal global-modal--danger">

        <div class="global-modal__header global-modal__header--danger">
          <div class="global-modal__danger-title">
            <div class="global-modal__danger-icon">
              <i class="fa-solid fa-user-shield" />
            </div>
            <div>
              <h3>Crear Superadmin</h3>
              <p>Acceso total e irrestricto al sistema</p>
            </div>
          </div>
          <button class="global-modal__close-btn" @click="close(null)">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div class="global-modal__danger-warning">
          <i class="fa-solid fa-triangle-exclamation" />
          Esta cuenta podrá crear/destruir entornos, gestionar cualquier usuario y modificar cualquier configuración de clientes.
        </div>

        <form class="global-modal__form" @submit.prevent="handleSubmit">
          <div class="global-modal__form-group">
            <label>Nombre <span class="global-modal__optional">(opcional)</span></label>
            <input v-model="name" type="text" placeholder="Ej: Diego Reyes" />
          </div>
          <div class="global-modal__form-group">
            <label>Email *</label>
            <input v-model="email" type="email" placeholder="admin@empresa.com" required />
          </div>
          <div class="global-modal__form-group">
            <label>Contraseña * <span class="global-modal__optional">(mín. 8 caracteres)</span></label>
            <input v-model="password" type="password" placeholder="••••••••••••" required minlength="8" />
          </div>

          <p v-if="errorMsg" class="global-modal__error-text">{{ errorMsg }}</p>

          <div class="global-modal__footer">
            <button type="button" class="global-modal__btn-ghost" :disabled="isSaving" @click="close(null)">
              Cancelar
            </button>
            <button type="submit" class="global-modal__btn-danger" :disabled="isSaving">
              <template v-if="!isSaving">
                <i class="fa-solid fa-user-shield" />
                Crear Superadmin
              </template>
              <span v-else class="global-modal__spinner" />
            </button>
          </div>
        </form>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.global-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(#0a192f, 0.7);
  backdrop-filter: blur(5px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.global-modal {
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &--danger {
    border-top: 4px solid #ef4444;
  }

  &__header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(#0a192f, 0.05);
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;

    &--danger {
      background: rgba(#ef4444, 0.03);
      border-bottom-color: rgba(#ef4444, 0.1);
    }
  }

  &__danger-title {
    display: flex;
    align-items: center;
    gap: 1rem;

    h3 {
      margin: 0 0 0.15rem;
      color: #0a192f;
      font-size: 1.15rem;
    }

    p {
      margin: 0;
      font-size: 0.8rem;
      color: #ef4444;
      font-weight: 600;
    }
  }

  &__danger-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(#ef4444, 0.1);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  &__danger-warning {
    margin: 1rem 1.5rem 0;
    padding: 0.75rem 1rem;
    background: rgba(#ef4444, 0.07);
    border: 1px solid rgba(#ef4444, 0.15);
    border-radius: 8px;
    font-size: 0.85rem;
    color: darken(#ef4444, 10%);
    font-weight: 500;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    line-height: 1.5;

    i {
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
  }

  &__close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    transition: color 0.2s;
    flex-shrink: 0;

    &:hover {
      color: #ef4444;
    }
  }

  &__form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  &__form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #0a192f;
    }

    input {
      padding: 0.75rem;
      border: 1px solid rgba(#0a192f, 0.15);
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(#ef4444, 0.1);
      }
    }
  }

  &__optional {
    font-size: 0.8em;
    font-weight: 400;
    color: #64748b;
    margin-left: 0.35rem;
  }

  &__error-text {
    color: #ef4444;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  &__btn-ghost {
    background: transparent;
    border: none;
    color: #64748b;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover:not(:disabled) {
      background: rgba(#0a192f, 0.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__btn-danger {
    background: #ef4444;
    color: #ffffff;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 160px;
    justify-content: center;
    transition: box-shadow 0.2s, opacity 0.2s;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 14px rgba(#ef4444, 0.4);
      opacity: 0.95;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  // Loading spinner dentro del botón rojo
  &__spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(#ffffff, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: global-superadmin-spin 0.8s linear infinite;
  }
}

@keyframes global-superadmin-spin {
  to {
    transform: rotate(360deg);
  }
}

// Transition — usa el mismo nombre que GlobalUserFormModal
.global-modal-enter-active,
.global-modal-leave-active {
  transition: opacity 0.25s ease;

  .global-modal {
    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.global-modal-enter-from,
.global-modal-leave-to {
  opacity: 0;

  .global-modal {
    transform: scale(0.92) translateY(16px);
  }
}
</style>
