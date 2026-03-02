<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace, WorkspaceAdmin, ApiError } from '@/types'

// ── State ──────────────────────────────────────────────────
const workspaces = ref<Workspace[]>([])
const isLoadingWorkspaces = ref(false)

const selectedWorkspace = ref<Workspace | null>(null)
const admins = ref<WorkspaceAdmin[]>([])
const isLoadingAdmins = ref(false)

// Create workspace modal
const showCreateWorkspace = ref(false)
const newWorkspaceName = ref('')
const isSavingWorkspace = ref(false)
const workspaceError = ref('')

// Create admin modal
const showCreateAdmin = ref(false)
const newAdminEmail = ref('')
const newAdminPassword = ref('')
const isSavingAdmin = ref(false)
const adminError = ref('')

// ── Fetch ──────────────────────────────────────────────────
async function fetchWorkspaces(): Promise<void> {
  isLoadingWorkspaces.value = true
  try {
    const { workspaces: data } = await workspaceService.listWorkspaces()
    workspaces.value = data
  } finally {
    isLoadingWorkspaces.value = false
  }
}

async function selectWorkspace(workspace: Workspace): Promise<void> {
  selectedWorkspace.value = workspace
  admins.value = []
  isLoadingAdmins.value = true
  try {
    const { admins: data } = await workspaceService.listAdmins(workspace._id)
    admins.value = data
  } finally {
    isLoadingAdmins.value = false
  }
}

// ── Create workspace ───────────────────────────────────────
function openCreateWorkspace(): void {
  newWorkspaceName.value = ''
  workspaceError.value = ''
  showCreateWorkspace.value = true
}

async function handleCreateWorkspace(): Promise<void> {
  if (!newWorkspaceName.value.trim() || isSavingWorkspace.value) return
  isSavingWorkspace.value = true
  workspaceError.value = ''
  try {
    const { workspace } = await workspaceService.createWorkspace(newWorkspaceName.value.trim())
    workspaces.value.unshift(workspace)
    showCreateWorkspace.value = false
  } catch (err: unknown) {
    const e = err as ApiError
    workspaceError.value = e.status === 409 ? 'Ya existe un entorno con ese nombre.' : 'Error al crear el entorno.'
  } finally {
    isSavingWorkspace.value = false
  }
}

// ── Create admin ───────────────────────────────────────────
function openCreateAdmin(): void {
  newAdminEmail.value = ''
  newAdminPassword.value = ''
  adminError.value = ''
  showCreateAdmin.value = true
}

async function handleCreateAdmin(): Promise<void> {
  if (!newAdminEmail.value.trim() || newAdminPassword.value.length < 8 || isSavingAdmin.value) return
  if (!selectedWorkspace.value) return
  isSavingAdmin.value = true
  adminError.value = ''
  try {
    const { admin } = await workspaceService.createAdmin(selectedWorkspace.value._id, {
      email: newAdminEmail.value.trim(),
      password: newAdminPassword.value,
    })
    admins.value.push(admin)
    showCreateAdmin.value = false
  } catch (err: unknown) {
    const e = err as ApiError
    if (e.status === 409) adminError.value = 'Ese correo ya está en uso.'
    else adminError.value = 'Error al crear el admin.'
  } finally {
    isSavingAdmin.value = false
  }
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="superadmin-dashboard">

    <!-- Top bar -->
    <header class="superadmin-dashboard__topbar">
      <div class="superadmin-dashboard__topbar-left">
        <h1 class="superadmin-dashboard__title">Entornos de trabajo</h1>
        <p class="superadmin-dashboard__subtitle">Gestiona los negocios y sus administradores</p>
      </div>
      <button
        id="btn-create-workspace"
        class="superadmin-dashboard__btn-primary"
        type="button"
        @click="openCreateWorkspace"
      >
        <i class="fa-solid fa-plus" aria-hidden="true" />
        Nuevo entorno
      </button>
    </header>

    <!-- Content: split -->
    <div class="superadmin-dashboard__body">

      <!-- Left: workspace list -->
      <section class="superadmin-dashboard__workspaces">
        <div v-if="isLoadingWorkspaces" class="superadmin-dashboard__loading">
          <span class="superadmin-dashboard__spinner" />
          <p>Cargando entornos...</p>
        </div>

        <div v-else-if="workspaces.length === 0" class="superadmin-dashboard__empty">
          <i class="fa-regular fa-building-circle-xmark superadmin-dashboard__empty-icon" aria-hidden="true" />
          <p>No hay entornos de trabajo aún.</p>
          <button class="superadmin-dashboard__btn-outline" type="button" @click="openCreateWorkspace">
            Crear el primero
          </button>
        </div>

        <ul v-else class="superadmin-dashboard__workspace-list" role="list">
          <li
            v-for="ws in workspaces"
            :key="ws._id"
            class="superadmin-dashboard__workspace-card"
            :class="{ 'superadmin-dashboard__workspace-card--active': selectedWorkspace?._id === ws._id }"
            role="button"
            :aria-pressed="selectedWorkspace?._id === ws._id"
            tabindex="0"
            @click="selectWorkspace(ws)"
            @keydown.enter="selectWorkspace(ws)"
          >
            <div class="superadmin-dashboard__ws-icon" aria-hidden="true">
              <i class="fa-solid fa-briefcase" />
            </div>
            <div class="superadmin-dashboard__ws-info">
              <span class="superadmin-dashboard__ws-name">{{ ws.name }}</span>
              <span class="superadmin-dashboard__ws-meta">
                {{ ws.adminId ? ws.adminId.email : 'Sin admin asignado' }}
              </span>
            </div>
            <i class="fa-solid fa-chevron-right superadmin-dashboard__ws-arrow" aria-hidden="true" />
          </li>
        </ul>
      </section>

      <!-- Right: admins panel -->
      <section class="superadmin-dashboard__admins">
        <div v-if="!selectedWorkspace" class="superadmin-dashboard__admins-placeholder">
          <i class="fa-regular fa-hand-pointer superadmin-dashboard__empty-icon" aria-hidden="true" />
          <p>Selecciona un entorno para gestionar sus admins</p>
        </div>

        <template v-else>
          <div class="superadmin-dashboard__admins-header">
            <div>
              <h2 class="superadmin-dashboard__admins-title">{{ selectedWorkspace.name }}</h2>
              <p class="superadmin-dashboard__admins-sub">{{ admins.length }} admin{{ admins.length !== 1 ? 's' : '' }}</p>
            </div>
            <button
              id="btn-create-admin"
              class="superadmin-dashboard__btn-primary"
              type="button"
              @click="openCreateAdmin"
            >
              <i class="fa-solid fa-user-plus" aria-hidden="true" />
              Añadir admin
            </button>
          </div>

          <div v-if="isLoadingAdmins" class="superadmin-dashboard__loading">
            <span class="superadmin-dashboard__spinner" />
          </div>

          <div v-else-if="admins.length === 0" class="superadmin-dashboard__empty superadmin-dashboard__empty--inline">
            <i class="fa-regular fa-user-slash superadmin-dashboard__empty-icon superadmin-dashboard__empty-icon--sm" aria-hidden="true" />
            <p>Este entorno no tiene admins todavía.</p>
          </div>

          <ul v-else class="superadmin-dashboard__admin-list" role="list">
            <li
              v-for="admin in admins"
              :key="admin._id"
              class="superadmin-dashboard__admin-card"
            >
              <div class="superadmin-dashboard__admin-avatar" aria-hidden="true">
                {{ admin.email.charAt(0).toUpperCase() }}
              </div>
              <div class="superadmin-dashboard__admin-info">
                <span class="superadmin-dashboard__admin-email">{{ admin.email }}</span>
                <span class="superadmin-dashboard__admin-badge">
                  <i class="fa-solid fa-circle" :class="admin.isActive ? 'superadmin-dashboard__dot--green' : 'superadmin-dashboard__dot--red'" aria-hidden="true" />
                  {{ admin.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </li>
          </ul>
        </template>
      </section>
    </div>

    <!-- Modal: create workspace -->
    <Transition name="modal">
      <div v-if="showCreateWorkspace" class="superadmin-dashboard__overlay" @click.self="showCreateWorkspace = false">
        <div class="superadmin-dashboard__modal" role="dialog" aria-modal="true" aria-labelledby="modal-ws-title">
          <div class="superadmin-dashboard__modal-header">
            <h3 id="modal-ws-title" class="superadmin-dashboard__modal-title">Nuevo entorno de trabajo</h3>
            <button class="superadmin-dashboard__modal-close" type="button" aria-label="Cerrar" @click="showCreateWorkspace = false">
              <i class="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <form class="superadmin-dashboard__modal-form" @submit.prevent="handleCreateWorkspace">
            <div class="superadmin-dashboard__field">
              <label class="superadmin-dashboard__label" for="ws-name">Nombre del entorno</label>
              <input
                id="ws-name"
                v-model="newWorkspaceName"
                class="superadmin-dashboard__input"
                type="text"
                placeholder="Ej: Empresa Acme"
                autocomplete="off"
                required
              />
            </div>

            <Transition name="fade-slide">
              <p v-if="workspaceError" class="superadmin-dashboard__form-error">
                <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {{ workspaceError }}
              </p>
            </Transition>

            <div class="superadmin-dashboard__modal-actions">
              <button class="superadmin-dashboard__btn-ghost" type="button" @click="showCreateWorkspace = false">
                Cancelar
              </button>
              <button
                class="superadmin-dashboard__btn-primary"
                type="submit"
                :disabled="!newWorkspaceName.trim() || isSavingWorkspace"
              >
                <span v-if="!isSavingWorkspace">Crear entorno</span>
                <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Modal: create admin -->
    <Transition name="modal">
      <div v-if="showCreateAdmin" class="superadmin-dashboard__overlay" @click.self="showCreateAdmin = false">
        <div class="superadmin-dashboard__modal" role="dialog" aria-modal="true" aria-labelledby="modal-admin-title">
          <div class="superadmin-dashboard__modal-header">
            <h3 id="modal-admin-title" class="superadmin-dashboard__modal-title">
              Añadir admin — <span class="superadmin-dashboard__modal-ws">{{ selectedWorkspace?.name }}</span>
            </h3>
            <button class="superadmin-dashboard__modal-close" type="button" aria-label="Cerrar" @click="showCreateAdmin = false">
              <i class="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <form class="superadmin-dashboard__modal-form" @submit.prevent="handleCreateAdmin">
            <div class="superadmin-dashboard__field">
              <label class="superadmin-dashboard__label" for="admin-email">Correo electrónico</label>
              <input
                id="admin-email"
                v-model="newAdminEmail"
                class="superadmin-dashboard__input"
                type="email"
                placeholder="admin@empresa.com"
                required
              />
            </div>

            <div class="superadmin-dashboard__field">
              <label class="superadmin-dashboard__label" for="admin-password">Contraseña <span class="superadmin-dashboard__label-hint">(mín. 8 caracteres)</span></label>
              <input
                id="admin-password"
                v-model="newAdminPassword"
                class="superadmin-dashboard__input"
                type="password"
                placeholder="••••••••"
                required
                minlength="8"
              />
            </div>

            <Transition name="fade-slide">
              <p v-if="adminError" class="superadmin-dashboard__form-error">
                <i class="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {{ adminError }}
              </p>
            </Transition>

            <div class="superadmin-dashboard__modal-actions">
              <button class="superadmin-dashboard__btn-ghost" type="button" @click="showCreateAdmin = false">
                Cancelar
              </button>
              <button
                class="superadmin-dashboard__btn-primary"
                type="submit"
                :disabled="!newAdminEmail.trim() || newAdminPassword.length < 8 || isSavingAdmin"
              >
                <span v-if="!isSavingAdmin">Crear admin</span>
                <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
$sidebar-w: 240px;

.superadmin-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 2rem;
  gap: 2rem;

  @media (min-width: 768px) {
    padding: 2.5rem 2.5rem;
  }

  // ── Top bar ──────────────────────────────────────────────
  &__topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  &__title {
    font-size: clamp(1.4rem, 2.5vw, 1.875rem);
    font-weight: 700;
    color: $primary-dark;
    letter-spacing: -0.025em;
    margin: 0 0 0.25rem;
  }

  &__subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: $text-secondary;
  }

  // ── Body ─────────────────────────────────────────────────
  &__body {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    flex: 1;

    @media (min-width: 900px) {
      grid-template-columns: 320px 1fr;
    }
  }

  // ── Workspaces ────────────────────────────────────────────
  &__workspaces,
  &__admins {
    background-color: $white;
    border-radius: 14px;
    border: 1px solid rgba($primary-dark, 0.08);
    padding: 1.25rem;
    overflow: hidden;
  }

  &__workspace-list,
  &__admin-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__workspace-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      background-color: rgba($primary, 0.04);
      border-color: rgba($primary, 0.1);
    }

    &--active {
      background-color: rgba($primary, 0.06);
      border-color: rgba($primary, 0.25);
    }
  }

  &__ws-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: rgba($primary-dark, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary-dark;
    font-size: 1rem;
    flex-shrink: 0;

    .superadmin-dashboard__workspace-card--active & {
      background: rgba($primary, 0.12);
      color: $primary;
    }
  }

  &__ws-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  &__ws-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-meta {
    font-size: 0.78rem;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__ws-arrow {
    color: rgba($text-secondary, 0.5);
    font-size: 0.75rem;
    flex-shrink: 0;
    transition: transform 0.15s ease;

    .superadmin-dashboard__workspace-card:hover &,
    .superadmin-dashboard__workspace-card--active & {
      color: $primary;
      transform: translateX(2px);
    }
  }

  // ── Admins ────────────────────────────────────────────────
  &__admins-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  &__admins-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__admins-sub {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 0;
  }

  &__admin-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.07);
  }

  &__admin-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba($secondary, 0.12);
    color: $secondary;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__admin-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  &__admin-email {
    font-size: 0.875rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__admin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: $text-secondary;
  }

  &__dot {
    &--green {
      color: $BAKANO-GREEN;
      font-size: 0.5rem;
    }

    &--red {
      color: $alert-error;
      font-size: 0.5rem;
    }
  }

  // ── Empty / Loading states ────────────────────────────────
  &__empty,
  &__admins-placeholder,
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 1rem;
    text-align: center;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__empty--inline {
    padding: 2rem 1rem;
  }

  &__empty-icon {
    font-size: 2.5rem;
    color: rgba($primary-dark, 0.15);

    &--sm {
      font-size: 1.75rem;
    }
  }

  // ── Buttons ───────────────────────────────────────────────
  &__btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 8%) 100%);
    color: $white;
    font-family: $font-principal;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba($primary, 0.3);
    transition: box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 16px rgba($primary, 0.45);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    border: 1.5px solid rgba($primary-dark, 0.2);
    background: transparent;
    color: $primary-dark;
    font-family: $font-principal;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;

    &:hover {
      border-color: $primary;
      background-color: rgba($primary, 0.04);
    }
  }

  &__btn-ghost {
    display: inline-flex;
    align-items: center;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    border: none;
    background: none;
    color: $text-secondary;
    font-family: $font-principal;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: rgba($primary-dark, 0.05);
    }
  }

  // ── Modals ────────────────────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  &__modal {
    width: 100%;
    max-width: 440px;
    background: $white;
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba($primary-dark, 0.25);
    overflow: hidden;
  }

  &__modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 1.5rem 0;
  }

  &__modal-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0;
  }

  &__modal-ws {
    color: $primary;
  }

  &__modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: none;
    color: $text-secondary;
    cursor: pointer;
    font-size: 1rem;
    flex-shrink: 0;
    transition: background-color 0.15s ease;

    &:hover {
      background-color: rgba($primary-dark, 0.06);
    }
  }

  &__modal-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__label-hint {
    font-weight: 400;
    color: $text-secondary;
    font-size: 0.8rem;
  }

  &__input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    background: rgba($primary-dark, 0.025);
    color: $primary-dark;
    font-family: $font-principal;
    font-size: 0.9375rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;

    &::placeholder {
      color: rgba($text-secondary, 0.6);
    }

    &:focus {
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 4px rgba($primary, 0.1);
    }
  }

  &__modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.25rem;
  }

  &__form-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.875rem;
    border-radius: 8px;
    background: $alert-error-bg;
    border: 1px solid rgba($alert-error, 0.25);
    color: $alert-error;
    font-size: 0.85rem;
    margin: 0;
  }

  // ── Spinner ───────────────────────────────────────────────
  &__spinner {
    display: inline-block;
    width: 22px;
    height: 22px;
    border: 3px solid rgba($primary-dark, 0.15);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;

    &--sm {
      width: 16px;
      height: 16px;
      border-width: 2px;
      border-color: rgba($white, 0.3);
      border-top-color: $white;
    }
  }
}

// ── Transitions ─────────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .superadmin-dashboard__modal {
    transition: transform 0.25s ease, opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .superadmin-dashboard__modal {
    transform: scale(0.95) translateY(12px);
    opacity: 0;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
