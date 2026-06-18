<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import type { Workspace, WorkspaceUser, ClientMeeting } from '@/types'

const userStore = useUserStore()

const props = defineProps({
  workspace: {
    type: Object as () => Workspace,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  meeting: {
    type: Object as () => ClientMeeting | undefined,
    default: undefined,
  },
  users: {
    type: Array as () => WorkspaceUser[],
    default: () => [],
  },
  loadingUsers: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'open-meeting-modal', workspace: Workspace, event: Event): void
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

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

function meetingChipLabel(meeting: ClientMeeting | undefined): string {
  if (!meeting) return 'Sin programar'
  const d = daysUntil(meeting.nextMeetingDate)
  if (d === 0) return 'Reunión: Hoy'
  if (d === 1) return 'Reunión: Mañana'
  if (d < 0) return `Atrasada ${Math.abs(d)}d`
  return `En ${d}d · ${new Date(meeting.nextMeetingDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}`
}

function meetingChipClass(meeting: ClientMeeting | undefined): string {
  if (!meeting) return 'clients-global__meeting-chip--none'
  return daysUntil(meeting.nextMeetingDate) < 0
    ? 'clients-global__meeting-chip--overdue'
    : 'clients-global__meeting-chip--ok'
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
</script>

<template>
  <div
    class="clients-global__card"
    :class="{ 'clients-global__card--expanded': isExpanded }"
  >
    <!-- Card Header -->
    <button class="clients-global__card-header" @click="emit('toggle')">
      <div class="clients-global__ws-avatar">
        <img
          v-if="workspace.metaAds?.pageId"
          :src="`https://graph.facebook.com/${workspace.metaAds.pageId}/picture?type=normal`"
          alt="Logo"
          class="clients-global__ws-img"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else>{{ workspace.name.substring(0, 2).toUpperCase() }}</span>
      </div>
      <div class="clients-global__ws-info">
        <span class="clients-global__ws-name">{{ workspace.name }}</span>
        <span class="clients-global__ws-meta">
          <span class="clients-global__ws-status" :class="workspace.isActive ? 'clients-global__ws-status--active' : 'clients-global__ws-status--inactive'">
            {{ workspace.isActive ? 'Activo' : 'Inactivo' }}
          </span>
          <span v-if="workspace.metaAds?.pageName">· {{ workspace.metaAds.pageName }}</span>
        </span>
      </div>
      <!-- Meeting chip (internal users only) -->
      <button
        v-if="userStore.isInternal || userStore.role === 'superadmin'"
        class="clients-global__meeting-chip"
        :class="meetingChipClass(meeting)"
        @click="emit('open-meeting-modal', workspace, $event)"
        :title="meeting ? 'Editar reunión' : 'Programar reunión'"
      >
        <i class="fa-solid fa-handshake" />
        {{ meetingChipLabel(meeting) }}
      </button>
      <i
        class="fa-solid fa-chevron-down clients-global__card-chevron"
        :class="{ 'clients-global__card-chevron--open': isExpanded }"
      />
    </button>

    <!-- Users Panel -->
    <Transition name="collapse">
      <div v-if="isExpanded" class="clients-global__users-panel">
        <div v-if="loadingUsers" class="clients-global__users-loading">
          <i class="fa-solid fa-circle-notch fa-spin" />
          Cargando usuarios…
        </div>

        <div v-else-if="!users?.length" class="clients-global__users-empty">
          <i class="fa-solid fa-users-slash" />
          Sin usuarios registrados.
        </div>

        <template v-else>
          <div class="clients-global__users-summary">
            <span>{{ users?.length || 0 }} usuario{{ users?.length !== 1 ? 's' : '' }}</span>
            <span class="clients-global__users-summary-breakdown">
              <span class="clients-global__badge clients-global__badge--internal">
                {{ users?.filter(u => u.isInternal).length || 0 }} internos
              </span>
              <span class="clients-global__badge clients-global__badge--client">
                {{ users?.filter(u => !u.isInternal).length || 0 }} del entorno
              </span>
            </span>
          </div>

          <div class="clients-global__users-list">
            <button
              v-for="user in (users || [])"
              :key="user._id"
              class="clients-global__user-row"
              :class="user.isInternal ? 'clients-global__user-row--internal' : 'clients-global__user-row--client'"
              @click="emit('open-user-modal', { user, workspaceName: workspace.name })"
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
</template>

<style lang="scss" scoped>
.clients-global {
  &__card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.08);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    overflow: hidden;
    transition: all 0.2s;

    &--expanded {
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      border-color: rgba($primary, 0.2);
    }
  }

  &__card-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;

    &:hover {
      background: rgba($primary-dark, 0.01);
    }
  }

  &__card-chevron {
    color: rgba($primary-dark, 0.3);
    font-size: 1rem;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-left: 0.5rem;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__ws-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary-dark, 0.05));
    color: $primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
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
  }

  &__ws-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
  }

  &__ws-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: rgba($primary-dark, 0.6);
  }

  &__ws-status {
    font-weight: 700;
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;

    &--active {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }
    &--inactive {
      background: rgba(#ef4444, 0.1);
      color: #ef4444;
    }
  }

  &__meeting-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &--none {
      background: rgba($primary-dark, 0.05);
      color: rgba($primary-dark, 0.5);
      &:hover { background: rgba($primary-dark, 0.1); color: $primary-dark; }
    }
    &--ok {
      background: rgba($primary, 0.1);
      color: $primary;
      &:hover { background: rgba($primary, 0.15); }
    }
    &--overdue {
      background: rgba(#ef4444, 0.1);
      color: #ef4444;
      &:hover { background: rgba(#ef4444, 0.15); }
    }
  }

  &__users-panel {
    border-top: 1px solid rgba($primary-dark, 0.05);
    background: #f8fafc;
    padding: 1rem 1.25rem;
  }

  &__users-loading,
  &__users-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    color: rgba($primary-dark, 0.5);
    font-size: 0.9rem;
  }

  &__users-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba($primary-dark, 0.6);
  }

  &__users-summary-breakdown {
    display: flex;
    gap: 0.5rem;
  }

  &__badge {
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
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

  &__users-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__user-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.04);
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    &--internal {
      border-left: 3px solid $primary;
    }
    &--client {
      border-left: 3px solid $secondary;
    }
  }

  &__user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba($primary-dark, 0.05);
    color: rgba($primary-dark, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  &__user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__user-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 0.75rem;
    color: rgba($primary-dark, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
  }

  &__user-role {
    font-size: 0.75rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__user-type-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    text-transform: uppercase;

    &--internal {
      background: rgba($primary, 0.1);
      color: $primary;
    }
    &--client {
      background: rgba($secondary, 0.1);
      color: $secondary-dark;
    }
  }

  &__user-status {
    padding-left: 0.5rem;
  }

  &__status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--active { background: #10b981; }
    &--inactive { background: #ef4444; }
  }

  &__user-arrow {
    color: rgba($primary-dark, 0.2);
    font-size: 0.8rem;
    margin-left: 0.5rem;
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
