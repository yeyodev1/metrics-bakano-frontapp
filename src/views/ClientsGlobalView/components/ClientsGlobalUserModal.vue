<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WorkspaceUser, Workspace } from '@/types'
import { videoPlanningService } from '@/services/videoPlanning.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object as () => WorkspaceUser | null,
    default: null,
  },
  workspaceName: {
    type: String,
    default: '',
  },
  workspaces: {
    type: Array as () => Workspace[],
    default: () => [],
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const INTERNAL_ROLE_LABELS: Record<string, string> = {
  director: 'Director',
  estratega: 'Estratega',
  project_manager: 'Project Manager',
  content_manager: 'Content Manager',
  account_manager: 'Account Manager',
  community_manager: 'Community Manager',
  productor: 'Productor',
  editor: 'Editor',
  disenador: 'Diseñador',
  copywriter: 'Copywriter',
  analista: 'Analista',
  desarrollador: 'Desarrollador',
}

const editorEditedItems = ref<any[]>([])
const loadingEditorItems = ref(false)

watch(() => props.isOpen, async (val) => {
  if (val && props.user) {
    if (props.user.isInternal && props.user.internalRole === 'editor') {
      loadingEditorItems.value = true
      editorEditedItems.value = []
      try {
        editorEditedItems.value = await videoPlanningService.getEditorCompletedItems(props.user._id)
      } catch {
        // silent fail
      } finally {
        loadingEditorItems.value = false
      }
    }
  } else {
    editorEditedItems.value = []
  }
})

function getInitials(user: WorkspaceUser): string {
  const src = user.name || user.email
  return src.substring(0, 2).toUpperCase()
}

function getUserTypeLabel(user: WorkspaceUser): string {
  if (user.isInternal) return 'Interno'
  return 'Del entorno'
}

function getUserRoleLabel(user: WorkspaceUser): string {
  if (user.isInternal && user.internalRole) {
    return INTERNAL_ROLE_LABELS[user.internalRole] || user.internalRole
  }
  if (user.role === 'admin') return 'Admin / Owner'
  if (user.role === 'colaborador') return 'Colaborador'
  return user.role
}

function formatPhone(user: WorkspaceUser): string {
  return user.phoneNumber || '—'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && user" class="user-modal-backdrop" @click.self="emit('close')">
        <div class="user-modal">
          <div class="user-modal__header">
            <div class="user-modal__avatar" :class="user.isInternal ? 'user-modal__avatar--internal' : 'user-modal__avatar--client'">
              {{ getInitials(user) }}
            </div>
            <div class="user-modal__header-info">
              <h2 class="user-modal__name">{{ user.name || user.email }}</h2>
              <span
                class="user-modal__type-badge"
                :class="user.isInternal ? 'user-modal__type-badge--internal' : 'user-modal__type-badge--client'"
              >
                <i :class="user.isInternal ? 'fa-solid fa-building' : 'fa-solid fa-user'" />
                {{ getUserTypeLabel(user) }}
              </span>
            </div>
            <button class="user-modal__close" @click="emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="user-modal__body">
            <div class="user-modal__section">
              <p class="user-modal__section-title">Información de contacto</p>
              <div class="user-modal__field">
                <i class="fa-solid fa-envelope" />
                <div>
                  <span class="user-modal__field-label">Email</span>
                  <span class="user-modal__field-value">{{ user.email }}</span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-phone" />
                <div>
                  <span class="user-modal__field-label">Teléfono</span>
                  <span class="user-modal__field-value">{{ formatPhone(user) }}</span>
                </div>
              </div>
            </div>

            <div class="user-modal__section">
              <p class="user-modal__section-title">Rol y acceso</p>
              <div class="user-modal__field">
                <i class="fa-solid fa-id-badge" />
                <div>
                  <span class="user-modal__field-label">Rol</span>
                  <span class="user-modal__field-value">{{ getUserRoleLabel(user) }}</span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-circle-check" />
                <div>
                  <span class="user-modal__field-label">Estado</span>
                  <span class="user-modal__field-value" :class="user.isActive ? 'user-modal__field-value--active' : 'user-modal__field-value--inactive'">
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-building-user" />
                <div>
                  <span class="user-modal__field-label">Entorno actual</span>
                  <span class="user-modal__field-value">{{ workspaceName }}</span>
                </div>
              </div>
            </div>

            <div v-if="user.workspaces && user.workspaces.length > 0" class="user-modal__section">
              <p class="user-modal__section-title">Entornos asignados ({{ user.workspaces.length }})</p>
              <div
                v-for="ws in user.workspaces"
                :key="typeof ws.workspaceId === 'object' ? ws.workspaceId._id : ws.workspaceId"
                class="user-modal__ws-item"
              >
                <div class="user-modal__ws-dot" />
                <span class="user-modal__ws-name">
                  {{
                    typeof ws.workspaceId === 'object'
                      ? ws.workspaceId.name
                      : (workspaces.find(w => w._id === ws.workspaceId)?.name || ws.workspaceId)
                  }}
                </span>
                <span class="user-modal__ws-role">{{ ws.role === 'admin' ? 'Admin' : 'Colaborador' }}</span>
              </div>
            </div>

            <div v-if="user.createdAt" class="user-modal__section">
              <p class="user-modal__section-title">Registro</p>
              <div class="user-modal__field">
                <i class="fa-solid fa-calendar" />
                <div>
                  <span class="user-modal__field-label">Fecha de creación</span>
                  <span class="user-modal__field-value">{{ formatDate(user.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Editor Historial de Edición -->
            <div v-if="user.isInternal && user.internalRole === 'editor'" class="user-modal__section">
              <p class="user-modal__section-title">
                Historial de Edición
                <span v-if="!loadingEditorItems" class="user-modal__badge">
                  {{ editorEditedItems.length }}
                </span>
              </p>

              <div v-if="loadingEditorItems" style="color:rgba(0,0,0,0.5); font-size:0.85rem; padding:0.5rem 0;">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando historial...
              </div>
              <div v-else-if="editorEditedItems.length === 0" style="color:rgba(0,0,0,0.5); font-size:0.85rem; padding:0.5rem 0;">
                No hay videos marcados como editados.
              </div>
              <div v-else class="user-modal__editor-history">
                <div v-for="(item, idx) in editorEditedItems" :key="idx" class="user-modal__editor-item">
                  <div class="user-modal__editor-item-main">
                    <span class="user-modal__editor-item-ws">{{ item.workspaceName }}</span>
                    <span class="user-modal__editor-item-tema">{{ item.tema }}</span>
                  </div>
                  <div class="user-modal__editor-item-meta">
                    <span class="user-modal__editor-item-date" v-if="item.fechaPublicacion">
                      <i class="fa-solid fa-calendar-day"></i> {{ formatDate(item.fechaPublicacion) }}
                    </span>
                    <a v-if="item.linkVideo" :href="item.linkVideo" target="_blank" class="user-modal__editor-item-link" title="Ver video">
                      <i class="fa-solid fa-play"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
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
  max-height: 90vh;
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
      color: $secondary-dark;
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
      color: $secondary-dark;
    }
  }

  &__badge {
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.1rem 0.4rem;
    border-radius: 12px;
    font-size: 0.7rem;
    margin-left: 0.5rem;
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
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary-dark, 0.1);
      border-radius: 6px;
    }
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

  &__field {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;

    i {
      color: rgba($primary-dark, 0.3);
      font-size: 0.9rem;
      margin-top: 0.2rem;
      width: 16px;
      text-align: center;
    }

    > div {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    &-label {
      font-size: 0.75rem;
      color: rgba($primary-dark, 0.5);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    &-value {
      font-size: 0.9rem;
      color: $primary-dark;
      font-weight: 500;
      word-break: break-all;

      &--active { color: #10b981; font-weight: 700; }
      &--inactive { color: #ef4444; font-weight: 700; }
    }
  }

  &__ws-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba($primary-dark, 0.02);
    border-radius: 8px;
  }

  &__ws-dot {
    width: 6px;
    height: 6px;
    background: $primary;
    border-radius: 50%;
  }

  &__ws-name {
    flex: 1;
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-role {
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba($primary-dark, 0.5);
    background: rgba($primary-dark, 0.06);
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    flex-shrink: 0;
  }

  &__editor-history {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
    padding-right: 0.25rem;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary-dark, 0.15);
      border-radius: 4px;
    }
  }

  &__editor-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba($primary-dark, 0.03);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba($primary-dark, 0.06);

    &-main {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }
    
    &-ws {
      font-size: 0.75rem;
      font-weight: 700;
      color: $primary;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    &-tema {
      font-size: 0.85rem;
      font-weight: 600;
      color: $primary-dark;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    &-date {
      font-size: 0.75rem;
      color: rgba($primary-dark, 0.5);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    &-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba($primary, 0.1);
      color: $primary;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        background: $primary;
        color: $white;
      }
    }
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
