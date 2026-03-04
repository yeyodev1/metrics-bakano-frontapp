<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserFormModal } from '@/composables/useUserFormModal'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import type { CreateUserPayload, UpdateUserPayload, ApiError } from '@/types'

const { isVisible, modalOptions, close } = useUserFormModal()
const toast = useToast()

const userForm = ref<CreateUserPayload>({
  name: '',
  email: '',
  password: '',
  role: 'colaborador'
})
const isSaving = ref(false)
const userError = ref('')

watch(isVisible, (newVal) => {
  if (newVal) {
    userError.value = ''
    if (modalOptions.value.mode === 'edit' && modalOptions.value.user) {
      userForm.value = {
        name: modalOptions.value.user.name || '',
        email: modalOptions.value.user.email,
        password: '',
        role: modalOptions.value.user.role
      }
    } else {
      userForm.value = { name: '', email: '', password: '', role: 'colaborador' }
    }
  }
})

async function handleSubmit() {
  if (isSaving.value) return

  if (!userForm.value.email.trim()) {
    userError.value = 'El correo es obligatorio.'
    return
  }
  if (modalOptions.value.mode === 'create' && userForm.value.password.length < 8) {
    userError.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  isSaving.value = true
  userError.value = ''

  try {
    if (modalOptions.value.mode === 'edit' && modalOptions.value.user) {
      const payload: UpdateUserPayload = {
        name: userForm.value.name,
        email: userForm.value.email
      }
      if (userForm.value.password) payload.password = userForm.value.password

      const { user } = await workspaceService.updateUser(
        modalOptions.value.workspaceId,
        modalOptions.value.user._id,
        payload
      )
      toast.success('Usuario actualizado correctamente.')
      close(user)
    } else {
      const { user } = await workspaceService.createUser(modalOptions.value.workspaceId, {
        name: userForm.value.name,
        email: userForm.value.email,
        password: userForm.value.password,
        role: userForm.value.role
      })
      toast.success('Usuario invitado correctamente.')
      close(user)
    }
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) {
      userError.value = 'Ese correo ya está en uso.'
    } else {
      toast.error('Ocurrió un error al guardar o invitar al usuario.')
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Transition name="global-modal">
    <div v-if="isVisible" class="global-modal-overlay" @click.self="close(null)">
      <div class="global-modal">
        <div class="global-modal__header">
          <h3>{{ modalOptions.mode === 'edit' ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button class="global-modal__close-btn" @click="close(null)">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="global-modal__form">
          <div class="global-modal__form-group">
            <label>Nombre</label>
            <input v-model="userForm.name" type="text" placeholder="Ej: Carlos Silva" />
          </div>
          <div class="global-modal__form-group">
            <label>Email</label>
            <input v-model="userForm.email" type="email" required placeholder="email@ejemplo.com" />
          </div>
          <div class="global-modal__form-group">
            <label>Contraseña {{ modalOptions.mode === 'edit' ? '(opcional)' : '' }}</label>
            <input v-model="userForm.password" type="password" :required="modalOptions.mode === 'create'" minlength="8" placeholder="••••••••" />
          </div>
          <div v-if="modalOptions.mode === 'create'" class="global-modal__form-group">
            <label>Nivel de acceso (Rol)</label>
            <select v-model="userForm.role" class="global-modal__select">
              <option value="admin">Administrador (Control total del entorno)</option>
              <option value="colaborador">Colaborador (Solo ver reportes y configurar)</option>
            </select>
          </div>
          <p v-if="userError" class="global-modal__error-text">{{ userError }}</p>
          <div class="global-modal__footer">
            <button type="button" class="global-modal__btn-ghost" @click="close(null)">Cancelar</button>
            <button type="submit" class="global-modal__btn-primary" :disabled="isSaving">
              <span v-if="!isSaving">{{ modalOptions.mode === 'edit' ? 'Guardar Cambios' : 'Invitar Usuario' }}</span>
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
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.global-modal {
  background: #ffffff;
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  &__header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(#0a192f, 0.05);
    background: #fafafa;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      color: #0a192f;
      font-size: 1.2rem;
    }
  }

  &__close-btn {
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    transition: color 0.2s;

    &:hover {
      color: #ff4757;
    }
  }

  &__form {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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

    input,
    select {
      padding: 0.75rem;
      border: 1px solid rgba(#0a192f, 0.2);
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: #6d67e4;
        box-shadow: 0 0 0 3px rgba(#6d67e4, 0.1);
      }
    }
  }

  &__error-text {
    color: #ff4757;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
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

    &:hover {
      background: rgba(#0a192f, 0.05);
    }
  }

  &__btn-primary {
    background: #6d67e4;
    color: #ffffff;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: box-shadow 0.2s, opacity 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(#6d67e4, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(#ffffff, 0.4);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: global-spin 0.8s linear infinite;
  }
}

@keyframes global-spin {
  to {
    transform: rotate(360deg);
  }
}

.global-modal-enter-active,
.global-modal-leave-active {
  transition: opacity 0.3s;

  .global-modal {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.global-modal-enter-from,
.global-modal-leave-to {
  opacity: 0;

  .global-modal {
    transform: scale(0.9) translateY(20px);
  }
}
</style>
