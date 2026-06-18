<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { Workspace, ClientMeeting } from '@/types'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  workspace: {
    type: Object as () => Workspace | null,
    default: null,
  },
  meeting: {
    type: Object as () => ClientMeeting | undefined,
    default: undefined,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String as PropType<string | null>,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { nextMeetingDate: string; agenda: string }): void
}>()

const localDate = ref('')
const localAgenda = ref('')
const validationError = ref<string | null>(null)

watch(() => props.isOpen, (val) => {
  if (val) {
    validationError.value = null
    localDate.value = props.meeting?.nextMeetingDate ? (props.meeting.nextMeetingDate.split('T')[0] || '') : ''
    localAgenda.value = props.meeting?.agenda || ''
  }
})

function handleSave() {
  if (!localDate.value) {
    validationError.value = 'Selecciona una fecha.'
    return
  }
  validationError.value = null
  emit('save', {
    nextMeetingDate: localDate.value,
    agenda: localAgenda.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && workspace" class="user-modal-backdrop" @click.self="emit('close')">
        <div class="user-modal">
          <div class="user-modal__header">
            <div class="user-modal__avatar user-modal__avatar--internal">
              <i class="fa-solid fa-handshake" style="font-size:1.1rem" />
            </div>
            <div class="user-modal__header-info">
              <h2 class="user-modal__name">{{ meeting ? 'Editar reunión' : 'Programar reunión' }}</h2>
              <span class="user-modal__type-badge user-modal__type-badge--internal">
                {{ workspace.name }}
              </span>
            </div>
            <button class="user-modal__close" @click="emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
          <div class="user-modal__body">
            <div class="user-modal__section">
              <p class="user-modal__section-title">Fecha de reunión</p>
              <input
                v-model="localDate"
                type="date"
                class="meeting-modal-input"
              />
            </div>
            <div class="user-modal__section">
              <p class="user-modal__section-title">Agenda <span class="optional-text">(opcional)</span></p>
              <textarea
                v-model="localAgenda"
                rows="3"
                placeholder="Temas a tratar en la reunión…"
                class="meeting-modal-textarea"
              />
            </div>
            <p v-if="validationError || error" class="meeting-modal-error">
              <i class="fa-solid fa-circle-exclamation" /> {{ validationError || error }}
            </p>
            <div class="meeting-modal-actions">
              <button
                class="meeting-modal-btn meeting-modal-btn--cancel"
                @click="emit('close')"
              >Cancelar</button>
              <button
                class="meeting-modal-btn meeting-modal-btn--save"
                :disabled="saving"
                @click="handleSave"
              >
                <i :class="saving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-check'" />
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.meeting-modal-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
}

.meeting-modal-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid rgba(0,0,0,0.12);
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.optional-text {
  font-weight: 400;
  color: rgba(0,0,0,0.35);
}

.meeting-modal-error {
  color: #ef4444;
  font-size: 0.82rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.meeting-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.meeting-modal-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &--cancel {
    border: 1.5px solid rgba(0,0,0,0.12);
    background: transparent;
    font-weight: 600;
  }

  &--save {
    background: #e6285c;
    color: #fff;
    border: none;
    font-weight: 700;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

// Minimal modal styles that might be needed if they are scoped in the parent.
// Since user-modal is used, we might need to copy its CSS or define it globally.
// In the original file, .user-modal is scoped to the component.
.user-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.user-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    background: #f8fafc;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    flex-shrink: 0;

    &--internal {
      background: rgba($primary, 0.1);
      color: $primary;
    }

    &--client {
      background: rgba($secondary, 0.1);
      color: $primary-dark;
    }
  }

  &__header-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__type-badge {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &--internal {
      background: $primary;
      color: #fff;
    }
    &--client {
      background: $secondary;
      color: #ffffff;
    }
  }

  &__close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: transparent;
    border: none;
    color: rgba($primary-dark, 0.4);
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(0,0,0,0.05);
      color: $primary-dark;
    }
  }

  &__body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__section-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba($primary-dark, 0.4);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
  .user-modal { transition: transform 0.2s ease, opacity 0.2s ease; }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .user-modal { transform: scale(0.95); opacity: 0; }
}
</style>
