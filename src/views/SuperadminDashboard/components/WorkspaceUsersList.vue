<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Workspace, WorkspaceUser } from '@/types'

defineProps<{
  selectedWorkspace: Workspace | null
  users: WorkspaceUser[]
  isLoadingUsers: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'openCreateUser'): void
  (e: 'openEditUser', user: WorkspaceUser): void
  (e: 'confirmDeleteUser', user: WorkspaceUser): void
}>()

const router = useRouter()
</script>

<template>
  <section v-if="selectedWorkspace" class="superadmin-dashboard__users">
    <div class="superadmin-dashboard__users-header">
      <div class="superadmin-dashboard__users-header-left">
        <button class="superadmin-dashboard__btn-back" @click="emit('back')">
          <i class="fa-solid fa-arrow-left" /> Volver a Entornos
        </button>
        <div>
          <h2 class="superadmin-dashboard__users-title">Usuarios en {{ selectedWorkspace.name }}</h2>
          <p class="superadmin-dashboard__users-sub">{{ users.length }} usuarios registrados</p>
        </div>
      </div>
      <div class="superadmin-dashboard__users-actions-top">
        <button
          class="superadmin-dashboard__btn-outline"
          type="button"
          @click="router.push({ name: 'BillingRoas', params: { workspaceId: selectedWorkspace?._id } })"
        >
          <i class="fa-solid fa-right-to-bracket" />
          Ingresar al entorno
        </button>
        <button
          class="superadmin-dashboard__btn-primary"
          type="button"
          @click="emit('openCreateUser')"
        >
          <i class="fa-solid fa-user-plus" />
          Nuevo usuario
        </button>
      </div>
    </div>

    <div v-if="isLoadingUsers" class="superadmin-dashboard__loading">
      <span class="superadmin-dashboard__spinner" />
    </div>

    <div v-else-if="users.length === 0" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-state-icon superadmin-dashboard__empty-state-icon--users">
        <i class="fa-solid fa-users" />
      </div>
      <h4 class="superadmin-dashboard__empty-state-title">Sin usuarios registrados</h4>
      <p class="superadmin-dashboard__empty-state-desc">Este entorno está vacío. Añade administradores y colaboradores para que puedan analizar los datos.</p>
      <button class="superadmin-dashboard__btn-primary superadmin-dashboard__btn-primary--sm" @click="emit('openCreateUser')">
        <i class="fa-solid fa-user-plus" /> Invitar Usuario
      </button>
    </div>

    <div v-else class="superadmin-dashboard__user-grid">
      <div
        v-for="user in users"
        :key="user._id"
        class="superadmin-dashboard__user-card"
      >
        <div class="superadmin-dashboard__user-main">
          <div class="superadmin-dashboard__user-avatar" :class="`superadmin-dashboard__user-avatar--${user.role}`">
            {{ (user.name || user.email).charAt(0).toUpperCase() }}
          </div>
          <div class="superadmin-dashboard__user-info">
            <div class="superadmin-dashboard__user-name-row">
              <span class="superadmin-dashboard__user-name">{{ user.name || 'Sin nombre' }}</span>
              <span class="superadmin-dashboard__role-badge" :class="`superadmin-dashboard__role-badge--${user.role}`">
                {{ user.role }}
              </span>
            </div>
            <span class="superadmin-dashboard__user-email">{{ user.email }}</span>
          </div>
        </div>
        
        <div class="superadmin-dashboard__user-actions">
          <button class="superadmin-dashboard__action-btn" title="Editar" @click="emit('openEditUser', user)">
            <i class="fa-solid fa-pen-to-square" />
          </button>
          <button class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--danger" title="Eliminar" @click="emit('confirmDeleteUser', user)">
            <i class="fa-solid fa-trash-can" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__users {
  width: 100%;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1px solid rgba($primary-dark, 0.05);
  min-height: 400px;
}

.superadmin-dashboard__users-header {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.superadmin-dashboard__users-header-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.superadmin-dashboard__btn-back {
  background: rgba($primary-dark, 0.04);
  color: $text-secondary;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($primary-dark, 0.08);
    color: $primary-dark;
  }
}

.superadmin-dashboard__users-title {
  margin: 0;
  font-size: 1.25rem;
  color: $primary-dark;
  font-weight: 800;
}

.superadmin-dashboard__users-sub {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: $text-secondary;
}

.superadmin-dashboard__users-actions-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  width: 100%;

  button {
    flex: 1;
    justify-content: center;

    @media (min-width: 640px) {
      flex: auto;
    }
  }

  @media (min-width: 640px) {
    width: auto;
    flex-wrap: nowrap;
  }
}

.superadmin-dashboard__user-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

.superadmin-dashboard__user-card {
  padding: 1.25rem;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  background: $white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

  &:hover {
    box-shadow: 0 8px 24px rgba($primary-dark, 0.06);
    transform: translateY(-2px);
  }

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.superadmin-dashboard__user-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.superadmin-dashboard__user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  background: $primary-light;
  color: $primary;

  &--admin {
    background: rgba($secondary, 0.1);
    color: $secondary;
  }

  &--colaborador {
    background: rgba($BAKANO-GREEN, 0.1);
    color: $BAKANO-GREEN;
  }
}

.superadmin-dashboard__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.superadmin-dashboard__user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.superadmin-dashboard__user-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__role-badge {
  flex-shrink: 0;
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: #eee;

  &--admin {
    background: rgba($secondary, 0.1);
    color: $secondary;
  }

  &--colaborador {
    background: rgba($BAKANO-GREEN, 0.1);
    color: $BAKANO-GREEN;
  }
}

.superadmin-dashboard__user-email {
  font-size: 0.85rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__user-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid rgba($primary-dark, 0.05);
  flex-shrink: 0;

  @media (min-width: 640px) {
    padding-top: 0;
    border-top: none;
  }
}

.superadmin-dashboard__action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;

  &:hover {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--danger:hover {
    background: rgba(#ef4444, 0.1);
    color: #ef4444;
  }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem;
  color: $text-secondary;

  &-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($BAKANO-GREEN, 0.05) 0%, rgba($BAKANO-GREEN, 0.1) 100%);
    color: darken($BAKANO-GREEN, 10%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba($BAKANO-GREEN, 0.15);
  }

  &-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.5rem;
  }

  &-desc {
    font-size: 1rem;
    max-width: 380px;
    margin: 0 0 2rem;
    line-height: 1.6;
  }
}

.superadmin-dashboard__btn-outline {
  background: transparent;
  border: 1px solid rgba($primary-dark, 0.15);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: $primary-dark;
  transition: all 0.2s;

  &:hover {
    background: rgba($primary-dark, 0.03);
    border-color: $primary;
    color: $primary;
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

  &--sm {
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }
}

.superadmin-dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: $text-secondary;
}

.superadmin-dashboard__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
