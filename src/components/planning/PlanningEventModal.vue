<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { PlanningEntry, WorkspaceUser } from '@/types'
import BaseTimePicker from '../common/BaseTimePicker.vue'

const router = useRouter()
const userStore = useUserStore()

// Real clients are those who are not internal. Internal staff (even with role='user') can edit depending on permissions.
const isClientUser = computed(() => !userStore.isInternal)

// Effective read-only: either prop says no-manage OR user is a client
const isReadOnly = computed(() => isClientUser.value || !props.canManage)

const assignableUsers = computed(() => {
  return props.workspaceUsers
})

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  entry: {
    type: Object as () => PlanningEntry | null,
    default: null,
  },
  workspaceId: {
    type: String,
    required: true,
  },
  workspaceUsers: {
    type: Array as () => WorkspaceUser[],
    required: true,
  },
  workspaceName: {
    type: String,
    default: '',
  },
  workspaceMetaPageId: {
    type: String,
    default: '',
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  defaultDate: {
    type: Object as () => Date | null,
    default: null,
  },
})

const emit = defineEmits(['close', 'save', 'delete'])

const form = ref({
  title: '',
  date: '',
  time: '09:00',
  notes: '',
  assignedTo: [] as string[],
})

watch(
  () => props.show,
  (isShown) => {
    if (isShown) {
      console.log('--- PlanningEventModal ABIERTO ---')
      console.log('isClientUser:', isClientUser.value)
      console.log('userStore.isInternal:', userStore.isInternal)
      console.log('isReadOnly:', isReadOnly.value)
      console.log('props.canManage:', props.canManage)

      if (props.entry) {
        const dateObj = new Date(props.entry.date)
        form.value = {
          title: props.entry.title,
          date: dateObj.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }),
          time: dateObj.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'America/Guayaquil'
          }),
          notes: props.entry.notes || '',
          assignedTo: (props.entry.assignedTo || []).map(u => u._id),
        }
      } else {
        const d = props.defaultDate || new Date()
        form.value = {
          title: '',
          date: d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }),
          time: '09:00',
          notes: '',
          assignedTo: [],
        }
      }
    }
  },
  { immediate: true }
)

function toggleAssignee(userId: string) {
  if (isReadOnly.value) return
  const current = form.value.assignedTo || []
  if (current.includes(userId)) {
    form.value.assignedTo = current.filter(id => id !== userId)
  } else {
    form.value.assignedTo = [...current, userId]
  }
}

function getInitials(user: WorkspaceUser): string {
  if (!user.name) return (user.email?.[0] || 'U').toUpperCase()
  return user.name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function getWorkspaceInitials(name: string): string {
  if (!name) return 'WS'
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function getMetaPictureUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}

function handleSubmit() {
  emit('save', { ...form.value })
}

function goToVideoPlanning() {
  if (!props.entry) return
  router.push({
    name: 'VideoPlanning',
    params: { workspaceId: props.workspaceId, entryId: props.entry._id },
    query: { title: props.entry.title },
  })
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="planning-modal">
      <div class="planning-modal__overlay" @click="emit('close')" />
      
      <div class="planning-modal__container">
        <!-- Header -->
        <div class="planning-modal__header">
          <div class="planning-modal__header-title">
            <i class="fa-solid" :class="entry && isReadOnly ? 'fa-calendar-day' : entry ? 'fa-pen-to-square' : 'fa-calendar-plus'" />
            <h3>{{ entry && isReadOnly ? 'Plan del Día' : entry ? 'Editar Evento' : 'Nueva Producción' }}</h3>
          </div>
          <button class="planning-modal__close-btn" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Workspace Banner -->
        <div class="planning-modal__ws-banner">
          <img
            v-if="workspaceMetaPageId"
            class="planning-modal__ws-img"
            :src="getMetaPictureUrl(workspaceMetaPageId)"
            :alt="workspaceName"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div v-else class="planning-modal__ws-avatar">
            {{ getWorkspaceInitials(workspaceName) }}
          </div>
          <div class="planning-modal__ws-info">
            <span class="planning-modal__ws-label">Cliente</span>
            <span class="planning-modal__ws-name">{{ workspaceName }}</span>
          </div>
          <div v-if="workspaceMetaPageId" class="planning-modal__meta-badge">
            <i class="fa-brands fa-meta" />
            <span>Meta conectado</span>
          </div>
        </div>

        <!-- Hint -->
        <div class="planning-modal__hint">
          <i class="fa-solid fa-circle-info" />
          <span v-if="!entry">
            Este evento se registrará en <strong>{{ workspaceName || 'este cliente' }}</strong>.
          </span>
          <span v-else-if="!isReadOnly">
            Editando un evento de <strong>{{ workspaceName || 'este cliente' }}</strong>.
          </span>
          <span v-else>
            Actividades programadas por la agencia para <strong>{{ workspaceName || 'tu cuenta' }}</strong>.
          </span>
        </div>

        <!-- Read-only view (client / no-manage) -->
        <div v-if="entry && isReadOnly" class="planning-modal__readonly">
          <div class="planning-modal__readonly-field">
            <span class="planning-modal__readonly-label"><i class="fa-solid fa-heading" /> Título</span>
            <span class="planning-modal__readonly-value">{{ form.title || '—' }}</span>
          </div>
          <div class="planning-modal__readonly-row">
            <div class="planning-modal__readonly-field">
              <span class="planning-modal__readonly-label"><i class="fa-solid fa-calendar" /> Fecha</span>
              <span class="planning-modal__readonly-value">{{ form.date || '—' }}</span>
            </div>
            <div class="planning-modal__readonly-field">
              <span class="planning-modal__readonly-label"><i class="fa-solid fa-clock" /> Hora <span class="planning-modal__tz-tag">Ecuador (UTC-5)</span></span>
              <span class="planning-modal__readonly-value">{{ form.time || '—' }}</span>
            </div>
          </div>
          <div v-if="form.notes" class="planning-modal__readonly-field">
            <span class="planning-modal__readonly-label"><i class="fa-solid fa-align-left" /> Notas</span>
            <span class="planning-modal__readonly-value planning-modal__readonly-value--notes">{{ form.notes }}</span>
          </div>
          <div v-if="(form.assignedTo || []).length > 0" class="planning-modal__readonly-field">
            <span class="planning-modal__readonly-label"><i class="fa-solid fa-users" /> Responsables</span>
            <div class="planning-modal__readonly-assignees">
              <div
                v-for="user in workspaceUsers.filter(u => (form.assignedTo || []).includes(u._id))"
                :key="user._id"
                class="planning-modal__readonly-chip"
              >
                <span class="planning-modal__assignee-avatar">{{ getInitials(user) }}</span>
                <span class="planning-modal__assignee-name">{{ user.name || user.email }}</span>
              </div>
            </div>
          </div>

          <!-- Video planning CTA -->
          <div v-if="entry" class="planning-modal__video-cta" @click="goToVideoPlanning">
            <div class="planning-modal__video-cta-icon">
              <i class="fa-solid fa-clapperboard" />
            </div>
            <div class="planning-modal__video-cta-text">
              <span class="planning-modal__video-cta-label">{{ isClientUser ? 'Planificación' : 'Plan de Videos REELs' }}</span>
              <span class="planning-modal__video-cta-sublabel">{{ isClientUser ? 'Aprueba y visualiza la planificación para ti' : 'Ver guiones, estados de producción y aprobaciones' }}</span>
            </div>
            <i class="fa-solid fa-chevron-right planning-modal__video-cta-arrow" />
          </div>

          <!-- Footer read-only -->
          <div class="planning-modal__footer">
            <div class="planning-modal__footer-spacer" />
            <button type="button" class="planning-modal__btn-ghost" @click="emit('close')">
              Cerrar
            </button>
          </div>
        </div>

        <!-- Editable form (managers / superadmin) -->
        <form v-else-if="!isReadOnly" @submit.prevent="handleSubmit" class="planning-modal__form">
          <div class="planning-modal__form-content">
            <!-- Title -->
            <div class="planning-modal__form-group">
              <label>Título / Actividad</label>
              <div class="planning-modal__input-wrapper">
                <i class="fa-solid fa-heading" />
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="Ej: Ingreso Backup"
                  required
                  :disabled="isReadOnly"
                />
              </div>
            </div>

            <!-- Date + Time -->
            <div class="planning-modal__form-row">
              <div class="planning-modal__form-group">
                <label>Fecha</label>
                <div class="planning-modal__input-wrapper">
                  <i class="fa-solid fa-calendar" />
                  <input
                    v-model="form.date"
                    type="date"
                    required
                    :disabled="isReadOnly"
                  />
                </div>
              </div>

              <div class="planning-modal__form-group planning-modal__form-group--time">
                <label>
                  Hora
                  <span class="planning-modal__tz-tag">Ecuador (UTC-5)</span>
                </label>
                <div class="planning-modal__input-wrapper">
                  <i class="fa-solid fa-clock" />
                  <BaseTimePicker
                    v-model="form.time"
                    :disabled="isReadOnly"
                  />
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="planning-modal__form-group">
              <label>Notas / Descripción</label>
              <div class="planning-modal__input-wrapper planning-modal__input-wrapper--textarea">
                <i class="fa-solid fa-align-left" />
                <textarea
                  v-model="form.notes"
                  placeholder="Instrucciones adicionales..."
                  :disabled="isReadOnly"
                ></textarea>
              </div>
            </div>

            <!-- Assignees -->
            <div class="planning-modal__form-group">
              <label>Responsables</label>
              <p class="planning-modal__assignee-hint">Toca a una persona para incluirla</p>
              <div class="planning-modal__assignee-grid">
                <button
                  v-for="user in assignableUsers"
                  :key="user._id"
                  type="button"
                  class="planning-modal__assignee-chip"
                  :class="{ 'is-selected': (form.assignedTo || []).includes(user._id) }"
                  :disabled="isReadOnly"
                  @click="toggleAssignee(user._id)"
                >
                  <span class="planning-modal__assignee-avatar">
                    {{ getInitials(user) }}
                  </span>
                  <div class="planning-modal__assignee-info">
                    <span class="planning-modal__assignee-name">{{ user.name || user.email }}</span>
                    <span v-if="user.internalRole" class="planning-modal__assignee-role">
                      {{ {
                        director: 'Director', estratega: 'Estratega', account_manager: 'Account Manager',
                        community_manager: 'CM', productor: 'Productor', disenador: 'Diseñador',
                        editor: 'Editor', copywriter: 'Copywriter', analista: 'Analista', desarrollador: 'Dev'
                      }[user.internalRole] || user.internalRole }}
                    </span>
                    <span v-else class="planning-modal__assignee-role is-client">
                      <i class="fa-solid fa-building" />
                      Usuario Cliente
                    </span>
                  </div>
                  <span class="planning-modal__assignee-toggle">
                    <i class="fa-solid" :class="(form.assignedTo || []).includes(user._id) ? 'fa-circle-check' : 'fa-plus'" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="planning-modal__footer">
            <button
              v-if="entry && !isReadOnly"
              type="button"
              class="planning-modal__btn-danger"
              @click="emit('delete')"
            >
              <i class="fa-solid fa-trash-can" />
              <span>Eliminar</span>
            </button>
            <button
              v-if="entry"
              type="button"
              class="planning-modal__btn-video"
              @click="goToVideoPlanning"
            >
              <i class="fa-solid fa-clapperboard" />
              <span>{{ isClientUser ? 'Planificación' : 'Planificación de Videos REELs' }}</span>
            </button>
            <div class="planning-modal__footer-spacer" />
            <button
              type="button"
              class="planning-modal__btn-ghost"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              v-if="!isReadOnly"
              type="submit"
              class="planning-modal__btn-primary"
              :disabled="isSaving"
            >
              <span v-if="isSaving" class="planning-modal__spinner" />
              <span v-else>{{ entry ? 'Guardar Cambios' : 'Agendar Producción' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.planning-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba($primary-dark, 0.6);
    backdrop-filter: blur(8px);
  }

  &__container {
    position: relative;
    background: $white;
    width: 100%;
    max-width: 580px;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

    @media (max-width: 480px) {
      border-radius: 18px;
      max-height: 95dvh;
    }
  }

  &__header {
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba($primary, 0.03), transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    @media (max-width: 480px) {
      padding: 1.25rem 1.5rem;
    }
  }

  &__header-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    i { font-size: 1.4rem; color: $primary; }
    h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: $primary-dark; }
  }

  &__close-btn {
    width: 34px; height: 34px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.05); color: $text-secondary;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: $alert-error-bg; color: $alert-error; transform: rotate(90deg); }
  }

  &__ws-banner {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.75rem 2rem; background: rgba($primary, 0.02);
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    @media (max-width: 480px) { padding: 0.75rem 1.25rem; }
  }

  &__ws-img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
  &__ws-avatar {
    width: 42px; height: 42px; border-radius: 10px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white; font-size: 0.9rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }

  &__ws-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  &__ws-label { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; color: $text-secondary; opacity: 0.6; }
  &__ws-name { font-size: 1rem; font-weight: 700; color: $primary-dark; }

  &__meta-badge {
    display: flex; align-items: center; gap: 0.35rem;
    background: #0866ff; color: $white; font-size: 0.65rem; font-weight: 700;
    padding: 0.25rem 0.65rem; border-radius: 20px;
    @media (max-width: 480px) { span { display: none; } }
  }

  &__hint {
    padding: 0.6rem 2rem; background: rgba($primary-dark, 0.02); border-bottom: 1px solid rgba($primary-dark, 0.04);
    display: flex; align-items: center; gap: 0.6rem;
    i { font-size: 0.8rem; color: $text-secondary; opacity: 0.5; }
    span { font-size: 0.75rem; color: $text-secondary; }
    @media (max-width: 480px) { padding: 0.5rem 1.25rem; }
  }

  &__form {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    scrollbar-width: thin; scrollbar-color: rgba($primary, 0.15) transparent;
  }

  &__form-content {
    padding: 1.75rem 2rem; display: flex; flex-direction: column; gap: 1.5rem;
    @media (max-width: 480px) { padding: 1.25rem; gap: 1.25rem; }
  }

  &__form-group {
    display: flex; flex-direction: column; gap: 0.6rem;
    label { 
      font-size: 0.82rem; font-weight: 800; color: $primary-dark; 
      text-transform: uppercase; letter-spacing: 0.02em; opacity: 0.8;
      display: flex; align-items: center; gap: 0.5rem;
    }
  }

  &__form-row { display: flex; gap: 1.25rem; @media (max-width: 480px) { flex-direction: column; } }
  &__form-group--time { width: 45%; @media (max-width: 480px) { width: 100%; } }

  &__tz-tag {
    font-size: 0.6rem; background: $primary; color: $white;
    padding: 0.1rem 0.45rem; border-radius: 10px; font-weight: 900;
  }

  &__input-wrapper {
    position: relative;
    i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: $text-secondary; opacity: 0.6; pointer-events: none; }
    
    input, textarea {
      width: 100%; padding: 0.8rem 1rem 0.8rem 2.75rem;
      border-radius: 14px; border: 1.5px solid rgba($primary-dark, 0.1);
      background: rgba($primary-dark, 0.02); font-family: inherit; font-size: 0.95rem;
      transition: all 0.2s;
      
      &:focus { outline: none; border-color: $primary; background: $white; box-shadow: 0 0 0 4px rgba($primary, 0.1); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    &--textarea {
      i { top: 1.15rem; transform: none; }
      textarea { min-height: 100px; padding-top: 0.85rem; resize: vertical; }
    }
  }

  &__assignee-hint { font-size: 0.72rem; color: $text-secondary; margin: -0.25rem 0 0.25rem 0.25rem; }

  &__assignee-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
  }

  &__assignee-chip {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
    border-radius: 14px; border: 1.5px solid rgba($primary-dark, 0.06);
    background: rgba($primary-dark, 0.015); cursor: pointer; transition: all 0.25s;
    text-align: left; position: relative;

    &:hover { border-color: rgba($primary, 0.3); background: $white; }
    &.is-selected { border-color: $primary; background: rgba($primary, 0.05); }
    &:disabled { cursor: not-allowed; opacity: 0.8; }
  }

  &__assignee-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, $primary-dark 0%, #4b5563 100%);
    color: $white; font-size: 0.7rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    .is-selected & { background: $primary; }
  }

  &__assignee-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  &__assignee-name { font-size: 0.85rem; font-weight: 700; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__assignee-role { 
    font-size: 0.65rem; font-weight: 700; color: $text-secondary; opacity: 0.8; 
    &.is-client { color: $primary; opacity: 1; }
  }

  &__assignee-toggle { font-size: 0.95rem; color: rgba($primary-dark, 0.15); transition: all 0.2s; .is-selected & { color: $primary; } }

  &__footer {
    padding: 1.25rem 2rem 1.75rem; border-top: 1px solid rgba($primary-dark, 0.05);
    background: rgba($primary-dark, 0.015); display: flex; align-items: center; gap: 1rem;
    @media (max-width: 480px) { flex-direction: column-reverse; align-items: stretch; padding: 1.25rem; }
  }

  &__footer-spacer { flex: 1; }

  &__btn-ghost {
    background: transparent; border: none; color: $text-secondary; font-weight: 700;
    padding: 0.75rem 1.25rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.05); color: $primary-dark; }
  }

  &__btn-primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white; border: none; padding: 0.85rem 2rem; border-radius: 14px;
    font-weight: 700; cursor: pointer; box-shadow: 0 8px 20px rgba($primary, 0.25);
    transition: all 0.3s;
    &:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba($primary, 0.35); }
    &:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }
  }

  &__btn-danger {
    background: rgba($alert-error, 0.08); color: $alert-error; border: none;
    padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    &:hover { background: $alert-error; color: $white; }
  }

  &__btn-video {
    background: rgba($primary, 0.06); color: $primary; border: none;
    padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    &:hover { background: rgba($primary, 0.15); }
  }

  &__readonly {
    flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    scrollbar-width: thin; scrollbar-color: rgba($primary, 0.15) transparent;
  }

  &__readonly-field {
    display: flex; flex-direction: column; gap: 0.4rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba($primary-dark, 0.04);
    &:last-of-type { border-bottom: none; }
    @media (max-width: 480px) { padding: 0.9rem 1.25rem; }
  }

  &__readonly-row {
    display: flex; gap: 0;
    .planning-modal__readonly-field { flex: 1; border-right: 1px solid rgba($primary-dark, 0.04); &:last-child { border-right: none; } }
    @media (max-width: 480px) { flex-direction: column; }
  }

  &__readonly-label {
    font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    color: $text-secondary; opacity: 0.65; display: flex; align-items: center; gap: 0.4rem;
    i { font-size: 0.7rem; }
  }

  &__readonly-value {
    font-size: 1rem; font-weight: 600; color: $primary-dark;
    &--notes { font-size: 0.88rem; font-weight: 400; white-space: pre-wrap; line-height: 1.6; color: $text-secondary; }
  }

  &__readonly-assignees {
    display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem;
  }

  &__readonly-chip {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.4rem 0.8rem 0.4rem 0.4rem;
    background: rgba($primary, 0.06); border-radius: 30px;
    .planning-modal__assignee-avatar { width: 26px; height: 26px; border-radius: 50%; font-size: 0.6rem; background: $primary; color: $white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .planning-modal__assignee-name { font-size: 0.8rem; font-weight: 700; color: $primary-dark; }
  }

  &__video-cta {
    margin: 0.75rem 2rem 0;
    display: flex; align-items: center; gap: 1rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba($primary, 0.06) 0%, rgba($primary, 0.1) 100%);
    border: 1.5px solid rgba($primary, 0.15);
    border-radius: 16px; cursor: pointer; transition: all 0.2s;

    &:hover {
      background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.16) 100%);
      border-color: rgba($primary, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba($primary, 0.12);
    }

    @media (max-width: 480px) { margin: 0.75rem 1.25rem 0; }
  }

  &__video-cta-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba($primary, 0.3);
    i { font-size: 1.1rem; color: $white; }
  }

  &__video-cta-text {
    flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem;
  }

  &__video-cta-label {
    font-size: 0.95rem; font-weight: 800; color: $primary-dark;
  }

  &__video-cta-sublabel {
    font-size: 0.72rem; color: $text-secondary; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }

  &__video-cta-arrow {
    font-size: 0.75rem; color: $primary; opacity: 0.6; flex-shrink: 0;
  }

  &__spinner {
    width: 20px; height: 20px; border: 2.5px solid rgba($white, 0.3);
    border-top-color: $white; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
