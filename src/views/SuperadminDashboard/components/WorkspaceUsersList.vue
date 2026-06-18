<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Workspace, WorkspaceUser } from '@/types'

defineProps<{
  selectedWorkspace: Workspace | null
  users: WorkspaceUser[]
  isLoadingUsers: boolean
}>()

const emit = defineEmits<{
  (e: 'openCreateUser'): void
  (e: 'openEditUser', user: WorkspaceUser): void
  (e: 'confirmDeleteUser', user: WorkspaceUser): void
}>()

const router = useRouter()
</script>

<template>
  <section class="superadmin-dashboard__users">
    <div v-if="!selectedWorkspace" class="superadmin-dashboard__placeholder">
      <div class="superadmin-dashboard__placeholder-content">
        <div class="superadmin-dashboard__placeholder-orb">
          <i class="fa-solid fa-briefcase" />
          <div class="superadmin-dashboard__placeholder-arrow">
            <i class="fa-solid fa-arrow-pointer" />
          </div>
        </div>
        <h3>Gestión de Usuarios</h3>
        <p>Selecciona un entorno de la lista para ver y gestionar sus miembros.</p>
      </div>
    </div>

    <template v-else>
      <div class="superadmin-dashboard__users-header">
        <div>
          <h2 class="superadmin-dashboard__users-title">Usuarios en {{ selectedWorkspace.name }}</h2>
          <p class="superadmin-dashboard__users-sub">{{ users.length }} usuarios registrados</p>
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
    </template>
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

  @media (min-width: 1024px) {
    min-height: 600px;
  }
}

.superadmin-dashboard__users-header {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.superadmin-dashboard__users-title {
  margin: 0;
  font-size: 1.1rem;
  color: $primary-dark;
  font-weight: 700;

  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
}

.superadmin-dashboard__users-sub {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
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
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.superadmin-dashboard__user-card {
  padding: 1rem;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  transition: box-shadow 0.2s ease;
  background: $white;

  &:hover {
    box-shadow: 0 4px 12px rgba($primary-dark, 0.05);
  }

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
  }

  @media (min-width: 1024px) and (max-width: 1150px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.superadmin-dashboard__user-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.superadmin-dashboard__user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
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
  font-weight: 600;
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
  padding: 0.1rem 0.4rem;
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

  @media (min-width: 1024px) and (max-width: 1150px) {
    padding-top: 0.75rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }
}

.superadmin-dashboard__action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--danger:hover {
    background: $alert-error-bg;
    color: $alert-error;
  }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: $text-secondary;

  &-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.1) 100%);
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba($primary, 0.1);

    &--users {
      background: linear-gradient(135deg, rgba($BAKANO-GREEN, 0.05) 0%, rgba($BAKANO-GREEN, 0.1) 100%);
      color: darken($BAKANO-GREEN, 10%);
      box-shadow: 0 8px 24px rgba($BAKANO-GREEN, 0.15);
    }
  }

  &-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.5rem;
  }

  &-desc {
    font-size: 0.95rem;
    max-width: 320px;
    margin: 0 0 1.5rem;
    line-height: 1.5;
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
    font-size: 0.9rem;
  }
}

.superadmin-dashboard__placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: radial-gradient(circle at center, rgba($primary, 0.02) 0%, transparent 70%);

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 320px;
    gap: 1.25rem;
    animation: fadeIn 0.8s ease-out;

    h3 {
      margin: 0;
      font-size: 1.25rem;
      color: $primary-dark;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: $text-secondary;
      line-height: 1.6;
      font-size: 0.95rem;
    }
  }

  &-orb {
    position: relative;
    width: 80px;
    height: 80px;
    background: $white;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.25rem;
    color: $primary;
    box-shadow:
      0 10px 25px rgba($primary, 0.1),
      0 4px 10px rgba($primary, 0.05);
    margin-bottom: 0.5rem;

    &::after {
      content: '';
      position: absolute;
      inset: -10px;
      border-radius: 30px;
      border: 2px dashed rgba($primary, 0.1);
      animation: rotate 20s linear infinite;
    }
  }

  &-arrow {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 32px;
    height: 32px;
    background: $primary;
    color: $white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    border: 3px solid $white;
    box-shadow: 0 4px 10px rgba($primary, 0.3);
    animation: bounceSmall 2s infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounceSmall {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.superadmin-dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: $text-secondary;
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
