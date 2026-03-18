<script setup lang="ts">
import type { GlobalPlanningEntry } from '@/types'

const props = defineProps({
  entry: {
    type: Object as () => GlobalPlanningEntry,
    required: true,
  },
  isPast: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  colors: {
    type: Object as () => { bg: string; dark: string; shadow: string },
    required: true,
  },
})

const emit = defineEmits(['edit'])

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'America/Guayaquil'
  })
}

function getInitials(person: any): string {
  if (!person.name) return person.email[0].toUpperCase()
  return person.name
    .split(' ')
    .filter((n: string) => n.length > 0)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function getWorkspaceInitials(name: string): string {
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
</script>

<template>
  <div
    class="planning-global-card"
    :class="{ 
      'is-past': isPast, 
      'is-editable': canManage 
    }"
    :style="!isPast ? {
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.dark} 100%)`,
      boxShadow: `0 3px 8px ${colors.shadow}`
    } : undefined"
    @click.stop="emit('edit', entry)"
  >
    <div class="planning-global-card__ws-header">
      <img
        v-if="entry.workspaceMetaPageId"
        :src="getMetaPictureUrl(entry.workspaceMetaPageId)"
        class="planning-global-card__ws-img"
        :alt="entry.workspaceName"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <span v-else class="planning-global-card__ws-avatar">
        {{ getWorkspaceInitials(entry.workspaceName || 'WS') }}
      </span>
      <span class="planning-global-card__ws-name">
        {{ entry.workspaceName || 'Workspace' }}
      </span>
    </div>

    <span
      class="planning-global-card__time"
      :style="!isPast ? { color: colors.bg } : undefined"
    >
      {{ formatTime(entry.date) }}
    </span>

    <span class="planning-global-card__title">{{ entry.title }}</span>

    <div v-if="entry.assignedTo && entry.assignedTo.length" class="planning-global-card__avatars">
      <span
        v-for="(person, i) in entry.assignedTo.slice(0, 3)"
        :key="person._id"
        class="planning-global-card__avatar"
        :style="{ zIndex: 3 - i }"
        :title="person.name || person.email"
      >
        {{ getInitials(person) }}
      </span>
      <span v-if="entry.assignedTo.length > 3" class="planning-global-card__avatar is-more">
        +{{ entry.assignedTo.length - 3 }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planning-global-card {
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: $white;

  &.is-editable:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  &.is-past {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
    box-shadow: none !important;
    opacity: 0.7;
    cursor: default;
    
    .planning-global-card__time {
      background: $white;
      color: #6b7280 !important;
    }
  }

  &__ws-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }

  &__ws-img {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    object-fit: cover;
    border: 1px solid rgba($white, 0.4);
  }

  &__ws-avatar {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    background: rgba($white, 0.2);
    color: $white;
    font-size: 0.55rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__ws-name {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    display: inline-flex;
    font-size: 0.65rem;
    font-weight: 900;
    background: $white;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    width: fit-content;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 0.15rem;
  }

  &__avatars {
    display: flex;
    align-items: center;
    padding-left: 5px;
    margin-top: 0.2rem;
  }

  &__avatar {
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: rgba($white, 0.25);
    backdrop-filter: blur(4px);
    color: $white;
    font-size: 0.52rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba($white, 0.6);
    margin-left: -5px;
    flex-shrink: 0;

    &.is-more {
      background: rgba($white, 0.15);
      border-color: rgba($white, 0.3);
      font-weight: 800;
    }
  }
}
</style>
