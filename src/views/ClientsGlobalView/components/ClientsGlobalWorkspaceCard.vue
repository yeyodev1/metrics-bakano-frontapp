<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Workspace, ClientMeeting } from '@/types'

const userStore = useUserStore()
const imageError = ref(false)

const props = defineProps({
  workspace: {
    type: Object as () => Workspace,
    required: true,
  },
  meeting: {
    type: Object as () => ClientMeeting | undefined,
    default: undefined,
  },
})

const emit = defineEmits<{
  (e: 'select-workspace', workspace: Workspace): void
  (e: 'open-meeting-modal', workspace: Workspace, event: Event): void
}>()

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
  if (!meeting) return 'clients-global__card-meeting--none'
  return daysUntil(meeting.nextMeetingDate) < 0
    ? 'clients-global__card-meeting--overdue'
    : 'clients-global__card-meeting--ok'
}
</script>

<template>
  <div class="clients-global__card">
    <div class="clients-global__card-header">
      <div class="clients-global__card-avatar">
        <img
          v-if="workspace.metaAds?.pageId && !imageError"
          :src="`https://graph.facebook.com/${workspace.metaAds.pageId}/picture?type=normal`"
          alt="Logo"
          class="clients-global__card-img"
          @error="imageError = true"
        />
        <span v-else>{{ workspace.name.substring(0, 2).toUpperCase() }}</span>
      </div>
      <div class="clients-global__card-info">
        <span class="clients-global__card-name">
          {{ workspace.name }}
        </span>
        <div class="clients-global__card-meta">
          <span 
            class="clients-global__card-status" 
            :class="workspace.isActive ? 'clients-global__card-status--active' : 'clients-global__card-status--inactive'"
          >
            {{ workspace.isActive ? 'Activo' : 'Inactivo' }}
          </span>
          <span v-if="workspace.metaAds?.pageName" class="clients-global__card-meta-text">
            · {{ workspace.metaAds.pageName }}
          </span>
        </div>
      </div>
    </div>

    <div class="clients-global__card-body">
      <button
        v-if="userStore.isInternal || userStore.role === 'superadmin'"
        class="clients-global__card-meeting"
        :class="meetingChipClass(meeting)"
        @click="emit('open-meeting-modal', workspace, $event)"
        :title="meeting ? 'Editar reunión' : 'Programar reunión'"
      >
        <i class="fa-solid fa-handshake" />
        {{ meetingChipLabel(meeting) }}
      </button>
    </div>

    <div class="clients-global__card-footer">
      <button class="clients-global__btn-primary clients-global__btn-primary--full" @click="emit('select-workspace', workspace)">
        <i class="fa-solid fa-users" /> Ver Usuarios
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.clients-global {
  &__card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.08);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
  }

  &__card-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid rgba($primary-dark, 0.03);
  }

  &__card-avatar {
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

  &__card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__card-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
    line-height: 1.2;
  }

  &__card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__card-status {
    font-weight: 700;
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &--active {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }
    &--inactive {
      background: rgba(#ef4444, 0.1);
      color: #ef4444;
    }
  }

  &__card-meta-text {
    font-size: 0.8rem;
    color: rgba($primary-dark, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  &__card-body {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__card-meeting {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;

    &--none {
      background: rgba($primary-dark, 0.04);
      color: rgba($primary-dark, 0.6);
      border: 1px dashed rgba($primary-dark, 0.15);
      &:hover { background: rgba($primary-dark, 0.08); color: $primary-dark; }
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

  &__card-footer {
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }

  &__btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: $primary;
    color: #fff;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba($primary, 0.2);

    &:hover {
      background: lighten($primary, 5%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba($primary, 0.3);
    }

    &--full {
      width: 100%;
    }
  }
}
</style>
