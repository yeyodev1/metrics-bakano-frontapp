<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace, WorkspaceUser } from '@/types'

const workspaces = ref<Workspace[]>([])
const searchQuery = ref('')
const expandedWorkspaceId = ref<string | null>(null)
const workspaceUsers = ref<Record<string, WorkspaceUser[]>>({})
const loadingWorkspaces = ref(false)
const loadingUsers = ref<Record<string, boolean>>({})
const error = ref<string | null>(null)

// ── User detail modal ─────────────────────────────────────
const selectedUser = ref<WorkspaceUser | null>(null)
const selectedUserWorkspaceName = ref<string>('')

function openUserDetail(user: WorkspaceUser, workspaceName: string) {
  selectedUser.value = user
  selectedUserWorkspaceName.value = workspaceName
}

function closeUserDetail() {
  selectedUser.value = null
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeUserDetail()
}

onMounted(() => {
  fetchWorkspaces()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

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

const filteredWorkspaces = computed(() => {
  if (!searchQuery.value.trim()) return workspaces.value
  const q = searchQuery.value.toLowerCase()
  return workspaces.value.filter(w => w.name.toLowerCase().includes(q))
})

async function fetchWorkspaces() {
  loadingWorkspaces.value = true
  error.value = null
  try {
    const res = await workspaceService.listWorkspaces()
    workspaces.value = res.workspaces
  } catch {
    error.value = 'No se pudieron cargar los clientes.'
  } finally {
    loadingWorkspaces.value = false
  }
}

async function toggleWorkspace(ws: Workspace) {
  if (expandedWorkspaceId.value === ws._id) {
    expandedWorkspaceId.value = null
    return
  }

  expandedWorkspaceId.value = ws._id

  if (!workspaceUsers.value[ws._id]) {
    loadingUsers.value[ws._id] = true
    try {
      const res = await workspaceService.listUsers(ws._id)
      workspaceUsers.value[ws._id] = res.users
    } catch {
      workspaceUsers.value[ws._id] = []
    } finally {
      loadingUsers.value[ws._id] = false
    }
  }
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

function getInitials(user: WorkspaceUser): string {
  const src = user.name || user.email
  return src.substring(0, 2).toUpperCase()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatPhone(user: WorkspaceUser): string {
  return user.phoneNumber || '—'
}
</script>

<template>
  <div class="clients-global">
    <div class="clients-global__header">
      <div class="clients-global__header-text">
        <h1 class="clients-global__title">Vista Global de Clientes</h1>
        <p class="clients-global__subtitle">Explora todos los entornos y sus usuarios.</p>
      </div>
    </div>

    <div class="clients-global__search-bar">
      <i class="fa-solid fa-magnifying-glass" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar cliente por nombre…"
        class="clients-global__search-input"
      />
    </div>

    <div v-if="loadingWorkspaces" class="clients-global__loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando clientes…</span>
    </div>

    <div v-else-if="error" class="clients-global__error">
      <i class="fa-solid fa-triangle-exclamation" />
      {{ error }}
    </div>

    <div v-else-if="filteredWorkspaces.length === 0" class="clients-global__empty">
      <i class="fa-solid fa-inbox" />
      <span>No se encontraron clientes.</span>
    </div>

    <div v-else class="clients-global__list">
      <div
        v-for="ws in filteredWorkspaces"
        :key="ws._id"
        class="clients-global__card"
        :class="{ 'clients-global__card--expanded': expandedWorkspaceId === ws._id }"
      >
        <!-- Card Header -->
        <button class="clients-global__card-header" @click="toggleWorkspace(ws)">
          <div class="clients-global__ws-avatar">
            <img
              v-if="ws.metaAds?.pageId"
              :src="`https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=normal`"
              alt="Logo"
              class="clients-global__ws-img"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <span v-else>{{ ws.name.substring(0, 2).toUpperCase() }}</span>
          </div>
          <div class="clients-global__ws-info">
            <span class="clients-global__ws-name">{{ ws.name }}</span>
            <span class="clients-global__ws-meta">
              <span class="clients-global__ws-status" :class="ws.isActive ? 'clients-global__ws-status--active' : 'clients-global__ws-status--inactive'">
                {{ ws.isActive ? 'Activo' : 'Inactivo' }}
              </span>
              <span v-if="ws.metaAds?.pageName">· {{ ws.metaAds.pageName }}</span>
            </span>
          </div>
          <i
            class="fa-solid fa-chevron-down clients-global__card-chevron"
            :class="{ 'clients-global__card-chevron--open': expandedWorkspaceId === ws._id }"
          />
        </button>

        <!-- Users Panel -->
        <Transition name="collapse">
          <div v-if="expandedWorkspaceId === ws._id" class="clients-global__users-panel">
            <div v-if="loadingUsers[ws._id]" class="clients-global__users-loading">
              <i class="fa-solid fa-circle-notch fa-spin" />
              Cargando usuarios…
            </div>

            <div v-else-if="!workspaceUsers[ws._id]?.length" class="clients-global__users-empty">
              <i class="fa-solid fa-users-slash" />
              Sin usuarios registrados.
            </div>

            <template v-else>
              <div class="clients-global__users-summary">
                <span>{{ workspaceUsers[ws._id].length }} usuario{{ workspaceUsers[ws._id].length !== 1 ? 's' : '' }}</span>
                <span class="clients-global__users-summary-breakdown">
                  <span class="clients-global__badge clients-global__badge--internal">
                    {{ workspaceUsers[ws._id].filter(u => u.isInternal).length }} internos
                  </span>
                  <span class="clients-global__badge clients-global__badge--client">
                    {{ workspaceUsers[ws._id].filter(u => !u.isInternal).length }} del entorno
                  </span>
                </span>
              </div>

              <div class="clients-global__users-list">
                <button
                  v-for="user in workspaceUsers[ws._id]"
                  :key="user._id"
                  class="clients-global__user-row"
                  :class="user.isInternal ? 'clients-global__user-row--internal' : 'clients-global__user-row--client'"
                  @click="openUserDetail(user, ws.name)"
                >
                  <div class="clients-global__user-avatar">
                    {{ getInitials(user) }}
                  </div>
                  <div class="clients-global__user-info">
                    <span class="clients-global__user-name">{{ user.name || user.email }}</span>
                    <span class="clients-global__user-email">{{ user.email }}</span>
                  </div>
                  <div class="clients-global__user-meta">
                    <span class="clients-global__user-role">{{ getUserRoleLabel(user) }}</span>
                    <span
                      class="clients-global__user-type-badge"
                      :class="user.isInternal ? 'clients-global__user-type-badge--internal' : 'clients-global__user-type-badge--client'"
                    >
                      <i :class="user.isInternal ? 'fa-solid fa-building' : 'fa-solid fa-user'" />
                      {{ getUserTypeLabel(user) }}
                    </span>
                  </div>
                  <div class="clients-global__user-status">
                    <span
                      class="clients-global__status-dot"
                      :class="user.isActive ? 'clients-global__status-dot--active' : 'clients-global__status-dot--inactive'"
                      :title="user.isActive ? 'Activo' : 'Inactivo'"
                    />
                  </div>
                  <i class="fa-solid fa-chevron-right clients-global__user-arrow" />
                </button>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </div>

  <!-- User Detail Modal -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="selectedUser" class="user-modal-backdrop" @click.self="closeUserDetail">
        <div class="user-modal">
          <div class="user-modal__header">
            <div class="user-modal__avatar" :class="selectedUser.isInternal ? 'user-modal__avatar--internal' : 'user-modal__avatar--client'">
              {{ getInitials(selectedUser) }}
            </div>
            <div class="user-modal__header-info">
              <h2 class="user-modal__name">{{ selectedUser.name || selectedUser.email }}</h2>
              <span
                class="user-modal__type-badge"
                :class="selectedUser.isInternal ? 'user-modal__type-badge--internal' : 'user-modal__type-badge--client'"
              >
                <i :class="selectedUser.isInternal ? 'fa-solid fa-building' : 'fa-solid fa-user'" />
                {{ getUserTypeLabel(selectedUser) }}
              </span>
            </div>
            <button class="user-modal__close" @click="closeUserDetail">
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
                  <span class="user-modal__field-value">{{ selectedUser.email }}</span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-phone" />
                <div>
                  <span class="user-modal__field-label">Teléfono</span>
                  <span class="user-modal__field-value">{{ formatPhone(selectedUser) }}</span>
                </div>
              </div>
            </div>

            <div class="user-modal__section">
              <p class="user-modal__section-title">Rol y acceso</p>
              <div class="user-modal__field">
                <i class="fa-solid fa-id-badge" />
                <div>
                  <span class="user-modal__field-label">Rol</span>
                  <span class="user-modal__field-value">{{ getUserRoleLabel(selectedUser) }}</span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-circle-check" />
                <div>
                  <span class="user-modal__field-label">Estado</span>
                  <span class="user-modal__field-value" :class="selectedUser.isActive ? 'user-modal__field-value--active' : 'user-modal__field-value--inactive'">
                    {{ selectedUser.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
              <div class="user-modal__field">
                <i class="fa-solid fa-building-user" />
                <div>
                  <span class="user-modal__field-label">Entorno actual</span>
                  <span class="user-modal__field-value">{{ selectedUserWorkspaceName }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedUser.workspaces && selectedUser.workspaces.length > 0" class="user-modal__section">
              <p class="user-modal__section-title">Entornos asignados ({{ selectedUser.workspaces.length }})</p>
              <div
                v-for="ws in selectedUser.workspaces"
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

            <div v-if="selectedUser.createdAt" class="user-modal__section">
              <p class="user-modal__section-title">Registro</p>
              <div class="user-modal__field">
                <i class="fa-solid fa-calendar" />
                <div>
                  <span class="user-modal__field-label">Fecha de creación</span>
                  <span class="user-modal__field-value">{{ formatDate(selectedUser.createdAt) }}</span>
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
.clients-global {
  padding: 2rem;
  max-width: 900px;

  &__header {
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.25rem;
  }

  &__subtitle {
    font-size: 0.9rem;
    color: rgba($primary-dark, 0.5);
    margin: 0;
  }

  &__search-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);

    i { color: rgba($primary-dark, 0.4); font-size: 0.95rem; }
  }

  &__search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.95rem;
    color: $primary-dark;
    background: transparent;
    font-family: inherit;
    &::placeholder { color: rgba($primary-dark, 0.35); }
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    color: rgba($primary-dark, 0.5);
    font-size: 0.95rem;
    justify-content: center;
    i { font-size: 1.2rem; }
  }

  &__error { color: $alert-error; }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  // ── Card ──────────────────────────────────────────────
  &__card {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s;

    &--expanded {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border-color: rgba($primary, 0.2);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover { background: rgba($primary-dark, 0.02); }
  }

  &__ws-avatar {
    width: 44px;
    height: 44px;
    background: $primary;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__ws-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__ws-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  &__ws-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-meta {
    font-size: 0.78rem;
    color: rgba($primary-dark, 0.5);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__ws-status {
    font-weight: 600;
    &--active { color: $alert-success; }
    &--inactive { color: $alert-error; }
  }

  &__card-chevron {
    font-size: 0.85rem;
    color: rgba($primary-dark, 0.4);
    transition: transform 0.2s;
    &--open { transform: rotate(180deg); }
  }

  // ── Users Panel ───────────────────────────────────────
  &__users-panel {
    border-top: 1px solid rgba($primary-dark, 0.07);
    padding: 1rem 1.25rem 1.25rem;
    background: rgba($primary-dark, 0.01);
  }

  &__users-loading,
  &__users-empty {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: rgba($primary-dark, 0.4);
    font-size: 0.85rem;
    padding: 0.5rem 0;
    i { font-size: 1rem; }
  }

  &__users-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.55);
    font-weight: 600;
  }

  &__users-summary-breakdown {
    display: flex;
    gap: 0.5rem;
  }

  &__badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 100px;

    &--internal {
      background: rgba($primary, 0.12);
      color: darken($primary, 10%);
      border: 1px solid rgba($primary, 0.2);
    }

    &--client {
      background: rgba(#6c757d, 0.1);
      color: #495057;
      border: 1px solid rgba(#6c757d, 0.2);
    }
  }

  &__users-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__user-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.15s, box-shadow 0.15s;
    width: 100%;
    text-align: left;
    cursor: pointer;

    &--internal {
      background: rgba($primary, 0.04);
      border-color: rgba($primary, 0.1);
    }

    &--client {
      background: rgba($primary-dark, 0.02);
      border-color: rgba($primary-dark, 0.06);
    }

    &:hover {
      background: rgba($primary, 0.07);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
  }

  &__user-arrow {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.25);
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;

    .clients-global__user-row:hover & {
      color: $primary;
      transform: translateX(2px);
    }
  }

  &__user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba($primary, 0.15);
    color: darken($primary, 5%);
    font-size: 0.78rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    min-width: 0;
  }

  &__user-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.45);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  &__user-role {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.6);
    font-weight: 500;
  }

  &__user-type-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 100px;

    i { font-size: 0.65rem; }

    &--internal {
      background: rgba($primary, 0.12);
      color: darken($primary, 10%);
      border: 1px solid rgba($primary, 0.2);
    }

    &--client {
      background: rgba(#6c757d, 0.1);
      color: #495057;
      border: 1px solid rgba(#6c757d, 0.2);
    }
  }

  &__user-status {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--active { background: $alert-success; }
    &--inactive { background: rgba($primary-dark, 0.25); }
  }
}

// Collapse transition
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

// ── User Detail Modal ────────────────────────────────────
.user-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.user-modal {
  background: $white;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1.5rem 1.25rem;
    background: linear-gradient(135deg, rgba($primary, 0.06) 0%, rgba($primary, 0.01) 100%);
    border-bottom: 1px solid rgba($primary-dark, 0.07);
  }

  &__avatar {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1rem;
    flex-shrink: 0;

    &--internal {
      background: rgba($primary, 0.15);
      color: darken($primary, 10%);
      border: 2px solid rgba($primary, 0.25);
    }

    &--client {
      background: rgba(#6c757d, 0.12);
      color: #495057;
      border: 2px solid rgba(#6c757d, 0.2);
    }
  }

  &__header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  &__name {
    font-size: 1.05rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 100px;

    i { font-size: 0.65rem; }

    &--internal {
      background: rgba($primary, 0.12);
      color: darken($primary, 10%);
      border: 1px solid rgba($primary, 0.2);
    }

    &--client {
      background: rgba(#6c757d, 0.1);
      color: #495057;
      border: 1px solid rgba(#6c757d, 0.2);
    }
  }

  &__close {
    width: 32px;
    height: 32px;
    background: rgba($primary-dark, 0.06);
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba($primary-dark, 0.5);
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: rgba($alert-error, 0.1);
      color: $alert-error;
    }
  }

  &__body {
    padding: 1.25rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__section-title {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba($primary-dark, 0.4);
    margin: 0 0 0.15rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &__field {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;

    > i {
      font-size: 0.85rem;
      color: rgba($primary-dark, 0.35);
      margin-top: 0.15rem;
      width: 16px;
      flex-shrink: 0;
    }

    > div {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
  }

  &__field-label {
    font-size: 0.7rem;
    color: rgba($primary-dark, 0.45);
    font-weight: 600;
  }

  &__field-value {
    font-size: 0.88rem;
    color: $primary-dark;
    font-weight: 500;

    &--active { color: $alert-success; font-weight: 700; }
    &--inactive { color: $alert-error; font-weight: 700; }
  }

  &__ws-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 7px;
  }

  &__ws-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $primary;
    flex-shrink: 0;
  }

  &__ws-name {
    flex: 1;
    font-size: 0.83rem;
    color: $primary-dark;
    font-weight: 500;
    min-width: 0;
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
}

// Modal transition
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
