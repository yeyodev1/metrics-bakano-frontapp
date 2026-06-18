<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Workspace, WorkspaceUser } from '@/types'

const props = defineProps<{
  workspace: Workspace
  users: WorkspaceUser[]
  isLoadingUsers: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'open-user-modal', payload: { user: WorkspaceUser; workspaceName: string }): void
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

const internalUsers = computed(() => props.users.filter(u => u.isInternal))
const clientUsers = computed(() => props.users.filter(u => !u.isInternal))

const internalUsersCount = computed(() => internalUsers.value.length)
const clientUsersCount = computed(() => clientUsers.value.length)

// ── Accordeon State ───────────────────────────────────────────
const showInternal = ref(true)
const showClient = ref(true)

function toggleInternal() {
  showInternal.value = !showInternal.value
}
function toggleClient() {
  showClient.value = !showClient.value
}
</script>

<template>
  <div class="clients-global-users">
    <div class="clients-global-users__header">
      <button class="clients-global-users__back-btn" @click="emit('back')">
        <i class="fa-solid fa-arrow-left" /> Volver a Clientes Globales
      </button>
      
      <div class="clients-global-users__title-wrap">
        <h2 class="clients-global-users__title">
          Usuarios de {{ workspace.name }}
        </h2>
        <div class="clients-global-users__badges">
          <span class="clients-global-users__badge clients-global-users__badge--internal">
            {{ internalUsersCount }} internos
          </span>
          <span class="clients-global-users__badge clients-global-users__badge--client">
            {{ clientUsersCount }} del entorno
          </span>
        </div>
      </div>
    </div>

    <div v-if="isLoadingUsers" class="clients-global-users__state">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando usuarios...</span>
    </div>

    <div v-else-if="users.length === 0" class="clients-global-users__state">
      <div class="clients-global-users__empty-icon">
        <i class="fa-solid fa-users-slash" />
      </div>
      <h3>Sin usuarios registrados</h3>
      <p>Este entorno aún no tiene usuarios asignados.</p>
    </div>

    <div v-else class="clients-global-users__accordion-container">
      
      <!-- Usuarios Internos -->
      <div v-if="internalUsersCount > 0" class="clients-global-users__accordion">
        <button class="clients-global-users__accordion-toggle clients-global-users__accordion-toggle--internal" @click="toggleInternal">
          <div class="clients-global-users__accordion-title">
            <i class="fa-solid fa-building" />
            Equipo Bakano (Internos)
            <span class="clients-global-users__count-badge">{{ internalUsersCount }}</span>
          </div>
          <i :class="showInternal ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
        </button>
        <div class="clients-global-users__accordion-content" :class="{ 'clients-global-users__accordion-content--open': showInternal }">
          <div class="clients-global-users__list">
            <button
              v-for="user in internalUsers"
              :key="user._id"
              class="clients-global-users__row clients-global-users__row--internal"
              @click="emit('open-user-modal', { user, workspaceName: workspace.name })"
            >
              <div class="clients-global-users__avatar">
                <img v-if="user.photoUrl" :src="user.photoUrl" :alt="user.name" class="clients-global-users__avatar-img" />
                <span v-else>{{ getInitials(user) }}</span>
              </div>
              <div class="clients-global-users__info">
                <span class="clients-global-users__name">{{ user.name || user.email }}</span>
                <span class="clients-global-users__email">{{ user.email }}</span>
              </div>
              <div class="clients-global-users__meta">
                <span class="clients-global-users__role">{{ getUserRoleLabel(user) }}</span>
              </div>
              <div class="clients-global-users__status">
                <span
                  class="clients-global-users__status-dot"
                  :class="user.isActive ? 'clients-global-users__status-dot--active' : 'clients-global-users__status-dot--inactive'"
                  :title="user.isActive ? 'Activo' : 'Inactivo'"
                />
              </div>
              <i class="fa-solid fa-chevron-right clients-global-users__arrow" />
            </button>
          </div>
        </div>
      </div>

      <!-- Usuarios Externos -->
      <div v-if="clientUsersCount > 0" class="clients-global-users__accordion">
        <button class="clients-global-users__accordion-toggle clients-global-users__accordion-toggle--client" @click="toggleClient">
          <div class="clients-global-users__accordion-title">
            <i class="fa-solid fa-user" />
            Usuarios del Cliente (Entorno)
            <span class="clients-global-users__count-badge">{{ clientUsersCount }}</span>
          </div>
          <i :class="showClient ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
        </button>
        <div class="clients-global-users__accordion-content" :class="{ 'clients-global-users__accordion-content--open': showClient }">
          <div class="clients-global-users__list">
            <button
              v-for="user in clientUsers"
              :key="user._id"
              class="clients-global-users__row clients-global-users__row--client"
              @click="emit('open-user-modal', { user, workspaceName: workspace.name })"
            >
              <div class="clients-global-users__avatar">
                <img v-if="user.photoUrl" :src="user.photoUrl" :alt="user.name" class="clients-global-users__avatar-img" />
                <span v-else>{{ getInitials(user) }}</span>
              </div>
              <div class="clients-global-users__info">
                <span class="clients-global-users__name">{{ user.name || user.email }}</span>
                <span class="clients-global-users__email">{{ user.email }}</span>
              </div>
              <div class="clients-global-users__meta">
                <span class="clients-global-users__role">{{ getUserRoleLabel(user) }}</span>
              </div>
              <div class="clients-global-users__status">
                <span
                  class="clients-global-users__status-dot"
                  :class="user.isActive ? 'clients-global-users__status-dot--active' : 'clients-global-users__status-dot--inactive'"
                  :title="user.isActive ? 'Activo' : 'Inactivo'"
                />
              </div>
              <i class="fa-solid fa-chevron-right clients-global-users__arrow" />
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.clients-global-users {
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  padding: 1.5rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    color: rgba($primary-dark, 0.6);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    align-self: flex-start;
    padding: 0.5rem 0.5rem 0.5rem 0;
    transition: color 0.2s;

    &:hover {
      color: $primary;
    }
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  &__title {
    font-size: 1.4rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
  }

  &__badges {
    display: flex;
    gap: 0.5rem;
  }

  &__badge {
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;

    &--internal {
      background: rgba($primary, 0.1);
      color: $primary;
    }
    &--client {
      background: rgba($secondary, 0.1);
      color: $secondary-dark;
    }
  }

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: rgba($primary-dark, 0.5);
    flex: 1;

    i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: $primary-dark;
      margin: 0 0 0.5rem;
    }

    p {
      font-size: 0.9rem;
      margin: 0;
    }
  }

  &__empty-icon {
    width: 64px;
    height: 64px;
    background: rgba($primary-dark, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;

    i {
      font-size: 1.5rem;
      margin: 0;
      color: rgba($primary-dark, 0.4);
    }
  }

  &__accordion-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__accordion {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__accordion-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1rem 1.25rem;
    background: rgba($primary-dark, 0.03);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.05);
    }

    &--internal {
      border-left: 4px solid $primary;
    }
    
    &--client {
      border-left: 4px solid $secondary;
    }
  }

  &__accordion-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: $primary-dark;

    i {
      color: rgba($primary-dark, 0.5);
    }
  }

  &__count-badge {
    background: rgba($primary-dark, 0.1);
    color: $primary-dark;
    padding: 0.1rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 800;
  }

  &__accordion-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
    opacity: 0;
    
    &--open {
      grid-template-rows: 1fr;
      opacity: 1;
      padding-top: 0.5rem;
    }
  }

  &__list {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.04);
    background: #f8fafc;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;

    &:hover {
      background: #fff;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      border-color: rgba($primary, 0.2);
    }

    &--internal {
      border-left: 3px solid $primary;
    }
    &--client {
      border-left: 3px solid $secondary;
    }
  }

  &__avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba($primary-dark, 0.05);
    color: rgba($primary-dark, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: 1rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 0.8rem;
    color: rgba($primary-dark, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
  }

  &__role {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__status {
    padding-left: 1rem;
    padding-right: 0.5rem;
  }

  &__status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;

    &--active { background: #10b981; }
    &--inactive { background: #ef4444; }
  }

  &__arrow {
    color: rgba($primary-dark, 0.2);
    font-size: 1rem;
    margin-left: 0.5rem;
  }
}
</style>
