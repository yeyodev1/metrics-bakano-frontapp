<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KpiUser } from '@/services/teamKpi.service'

interface Workspace {
  _id: string
  name: string
}

const props = defineProps<{
  workspaces: Workspace[]
  teamUsers: KpiUser[]
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'save', payload: { workspaceId: string; visitDate: string; attendees: string[]; notes: string }): void
  (e: 'cancel'): void
}>()

const today = new Date().toISOString().split('T')[0]

const form = ref({
  workspaceId: '',
  visitDate: today,
  notes: '',
})
const selectedAttendees = ref<string[]>([])

const isValid = computed(() =>
  form.value.workspaceId && form.value.visitDate && selectedAttendees.value.length > 0
)

function toggleAttendee(userId: string) {
  const idx = selectedAttendees.value.indexOf(userId)
  if (idx >= 0) {
    selectedAttendees.value.splice(idx, 1)
  } else {
    selectedAttendees.value.push(userId)
  }
}

function submit() {
  if (!isValid.value) return
  emit('save', {
    workspaceId: form.value.workspaceId,
    visitDate: new Date(form.value.visitDate).toISOString(),
    attendees: selectedAttendees.value,
    notes: form.value.notes.trim(),
  })
}
</script>

<template>
  <div class="vlm__overlay" @click.self="emit('cancel')">
    <div class="vlm">
      <div class="vlm__header">
        <div class="vlm__header-icon"><i class="fa-solid fa-map-pin" /></div>
        <h2 class="vlm__title">Registrar Visita</h2>
        <button class="vlm__close" type="button" @click="emit('cancel')">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <div class="vlm__body">
        <!-- Workspace -->
        <div class="vlm__field">
          <label>Cliente visitado <span class="vlm__req">*</span></label>
          <select v-model="form.workspaceId">
            <option value="" disabled>Selecciona un cliente</option>
            <option v-for="ws in workspaces" :key="ws._id" :value="ws._id">
              {{ ws.name }}
            </option>
          </select>
        </div>

        <!-- Date -->
        <div class="vlm__field">
          <label>Fecha de visita <span class="vlm__req">*</span></label>
          <input v-model="form.visitDate" type="date" :max="today" />
        </div>

        <!-- Attendees -->
        <div class="vlm__field">
          <label>¿Quiénes asistieron? <span class="vlm__req">*</span></label>
          <p class="vlm__hint">Marca a todos los que fueron a esta visita</p>
          <div class="vlm__attendees">
            <button
              v-for="user in teamUsers"
              :key="user._id"
              type="button"
              class="vlm__attendee"
              :class="{ 'vlm__attendee--selected': selectedAttendees.includes(user._id) }"
              @click="toggleAttendee(user._id)"
            >
              <span class="vlm__attendee-avatar">{{ user.name.charAt(0).toUpperCase() }}</span>
              <span class="vlm__attendee-name">{{ user.name }}</span>
              <span class="vlm__attendee-role">{{ user.internalRole.replace(/_/g, ' ') }}</span>
              <i
                v-if="selectedAttendees.includes(user._id)"
                class="fa-solid fa-circle-check vlm__attendee-check"
              />
            </button>
          </div>
          <p v-if="selectedAttendees.length === 0" class="vlm__error">Selecciona al menos un asistente</p>
        </div>

        <!-- Notes -->
        <div class="vlm__field">
          <label>Notas (opcional)</label>
          <textarea v-model="form.notes" rows="2" maxlength="500" placeholder="Observaciones de la visita..." />
        </div>
      </div>

      <div class="vlm__actions">
        <button class="vlm__btn vlm__btn--cancel" type="button" @click="emit('cancel')">
          Cancelar
        </button>
        <button
          class="vlm__btn vlm__btn--save"
          type="button"
          :disabled="!isValid || saving"
          @click="submit"
        >
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
          {{ saving ? 'Guardando...' : 'Registrar visita' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vlm {
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  background: $white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.07);
  }

  &__header-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    i { font-size: 0.9rem; color: #fff; }
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
    flex: 1;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    &:hover { background: rgba(#ef4444, 0.06); color: #dc2626; border-color: rgba(#ef4444, 0.3); }
    i { font-size: 0.85rem; }
  }

  &__body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    max-height: 65vh;
    overflow-y: auto;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    label {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $primary-dark;
      opacity: 0.7;
    }

    select, input, textarea {
      padding: 0.55rem 0.75rem;
      border: 1.5px solid rgba($primary-dark, 0.12);
      border-radius: 8px;
      font-size: 0.9rem;
      color: $primary-dark;
      font-family: inherit;
      background: $white;
      transition: border-color 0.2s;
      &:focus { outline: none; border-color: $primary; }
    }

    textarea { resize: vertical; min-height: 60px; }
  }

  &__req { color: #ef4444; }

  &__hint {
    font-size: 0.75rem;
    color: $text-secondary;
    margin: 0;
    font-style: italic;
  }

  &__attendees {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__attendee {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.1);
    background: transparent;
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;

    &:hover { border-color: rgba($primary, 0.35); background: rgba($primary, 0.03); }

    &--selected {
      border-color: #f59e0b;
      background: rgba(#f59e0b, 0.06);
    }

    &-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, $primary, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }

    &-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: $primary-dark;
      flex: 1;
    }

    &-role {
      font-size: 0.7rem;
      color: $text-secondary;
      text-transform: capitalize;
    }

    &-check {
      color: #f59e0b;
      font-size: 1rem;
      flex-shrink: 0;
    }
  }

  &__error {
    font-size: 0.75rem;
    color: #ef4444;
    margin: 0.1rem 0 0;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem 1.25rem;
    border-top: 1px solid rgba($primary-dark, 0.07);
  }

  &__btn {
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &--cancel {
      background: transparent;
      border: 1.5px solid rgba($primary-dark, 0.15);
      color: $text-secondary;
      &:hover { border-color: rgba($primary-dark, 0.3); color: $primary-dark; }
    }

    &--save {
      background: #f59e0b;
      border: none;
      color: #fff;
      box-shadow: 0 3px 10px rgba(#f59e0b, 0.3);
      &:hover:not(:disabled) { filter: brightness(1.08); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}
</style>
