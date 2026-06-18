<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WorkspaceUser } from '@/types'

const props = defineProps({
  target: {
    type: Object as () => WorkspaceUser | null,
    default: null
  },
  isSending: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', password: string): void
}>()

const password = ref('')

watch(() => props.target, (newVal) => {
  if (newVal) {
    password.value = ''
  }
})

function handleSubmit() {
  if (password.value.length < 8 || props.isSending) return
  emit('submit', password.value)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="target" class="superadmin-dashboard__resend-overlay" @click.self="emit('close')">
      <div class="superadmin-dashboard__resend-modal">
        <div class="superadmin-dashboard__resend-header">
          <div class="superadmin-dashboard__resend-icon">
            <i class="fa-solid fa-paper-plane" />
          </div>
          <div>
            <h4>Reenviar invitación</h4>
            <p>{{ target.name || target.email }}</p>
          </div>
          <button class="superadmin-dashboard__resend-close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <p class="superadmin-dashboard__resend-desc">
          Se actualizará la contraseña y se enviará el email de bienvenida con las nuevas credenciales a <strong>{{ target.email }}</strong>.
        </p>
        <div class="superadmin-dashboard__resend-row">
          <input
            v-model="password"
            type="password"
            minlength="8"
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            class="superadmin-dashboard__resend-input"
            @keydown.enter.prevent="handleSubmit"
            autofocus
          />
        </div>
        <div class="superadmin-dashboard__resend-footer">
          <button class="superadmin-dashboard__btn-ghost" @click="emit('close')">Cancelar</button>
          <button
            class="superadmin-dashboard__btn-primary"
            :disabled="isSending || password.length < 8"
            @click="handleSubmit"
          >
            <span v-if="isSending" class="superadmin-dashboard__spinner" />
            <i v-else class="fa-solid fa-paper-plane" />
            {{ isSending ? 'Enviando...' : 'Enviar invitación' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__resend-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(#0a192f, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.superadmin-dashboard__resend-modal {
  background: $white;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: popIn 0.3s cubic-bezier(0.16,1,0.3,1);
}

.superadmin-dashboard__resend-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
    color: $primary-dark;
  }
  
  p {
    margin: 0;
    font-size: 0.8rem;
    color: $text-secondary;
  }
}

.superadmin-dashboard__resend-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
  background: rgba(#6d28d9, 0.1);
  color: #6d28d9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.superadmin-dashboard__resend-close {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba($primary-dark, 0.06);
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba($primary-dark, 0.12);
  }
}

.superadmin-dashboard__resend-desc {
  margin: 0;
  font-size: 0.83rem;
  color: $text-secondary;
  line-height: 1.6;
}

.superadmin-dashboard__resend-row {
  display: flex;
  gap: 0.5rem;
}

.superadmin-dashboard__resend-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1.5px solid rgba($primary-dark, 0.12);
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
}

.superadmin-dashboard__resend-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.superadmin-dashboard__btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  color: $text-secondary;

  &:hover {
    background: rgba($primary-dark, 0.05);
  }
}

.superadmin-dashboard__btn-primary {
  background: $primary;
  color: $white;
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
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    opacity: 0.95;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.superadmin-dashboard__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($white, 0.2);
  border-top-color: $white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes popIn {
  from { transform: scale(0.9) translateY(10px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}
</style>

<style lang="scss" scoped>
</style>
