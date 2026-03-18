<script setup lang="ts">
import type { PlanningEntry } from '@/types'

const props = defineProps({
  entry: {
    type: Object as () => PlanningEntry,
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
  compact: {
    type: Boolean,
    default: false,
  },
  workspaceName: {
    type: String,
    default: '',
  },
  workspaceMetaPageId: {
    type: String,
    default: '',
  },
  videoCount: {
    type: Number,
    default: 0,
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
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getMetaPictureUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}
</script>

<template>
  <div
    class="planning-entry-card"
    :class="{ 
      'is-past': isPast, 
      'is-compact': compact,
      'is-editable': canManage 
    }"
    @click.stop="emit('edit', entry)"
  >
    <div class="planning-entry-card__main">
      <!-- Workspace logo header -->
      <div v-if="workspaceName" class="planning-entry-card__ws-header">
        <div class="planning-entry-card__ws-avatar">
          <img
            v-if="workspaceMetaPageId"
            :src="getMetaPictureUrl(workspaceMetaPageId)"
            :alt="workspaceName"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <span v-else>{{ getWorkspaceInitials(workspaceName) }}</span>
        </div>
        <span class="planning-entry-card__ws-name">{{ workspaceName }}</span>
      </div>
      <span class="planning-entry-card__time">{{ formatTime(entry.date) }}</span>
      <div class="planning-entry-card__title-row">
        <span class="planning-entry-card__title">{{ entry.title }}</span>
        <span v-if="videoCount > 0" class="planning-entry-card__video-badge" title="Videos planificados">
          <i class="fa-solid fa-film" />
          {{ videoCount }}
        </span>
      </div>
    </div>

    <!-- Avatars: only in non-compact mode (week view) -->
    <div v-if="!compact && entry.assignedTo && entry.assignedTo.length" class="planning-entry-card__avatars">
      <span
        v-for="(person, i) in entry.assignedTo.slice(0, 3)"
        :key="person._id"
        class="planning-entry-card__avatar"
        :style="{ zIndex: 3 - i }"
        :title="person.name || person.email"
      >
        {{ getInitials(person) }}
      </span>
      <span v-if="entry.assignedTo.length > 3" class="planning-entry-card__avatar is-more">
        +{{ entry.assignedTo.length - 3 }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planning-entry-card {
  padding: 0.5rem 0.75rem;
  background: $white;
  border-radius: 10px;
  border: 1px solid rgba($primary-dark, 0.08);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &.is-editable:hover {
    transform: translateY(-2px);
    border-color: $primary;
    box-shadow: 0 4px 12px rgba($primary, 0.12);
  }

  &.is-past {
    opacity: 0.6;
    background: rgba($primary-dark, 0.02);
    border-color: transparent;
    cursor: default;
    
    .planning-entry-card__time, 
    .planning-entry-card__title {
      color: $text-secondary;
    }
  }

  &.is-compact {
    padding: 0.35rem 0.6rem;
    border-radius: 8px;
    
    .planning-entry-card__time {
      font-size: 0.65rem;
    }
    
    .planning-entry-card__title {
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 0;
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__time {
    font-size: 0.7rem;
    font-weight: 700;
    color: $primary;
    letter-spacing: 0.02em;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.15rem;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 600;
    color: $primary-dark;
    line-height: 1.3;
  }

  &__video-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    background: rgba($primary, 0.1);
    color: $primary;
    border-radius: 6px;
    padding: 0.05rem 0.35rem;
    font-size: 0.6rem;
    font-weight: 800;
    white-space: nowrap;
  }

  &__ws-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.2rem;
    padding-bottom: 0.2rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    min-width: 0;
  }

  &__ws-avatar {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 12%) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.48rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__ws-name {
    font-size: 0.62rem;
    font-weight: 800;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__avatars {
    display: flex;
    align-items: center;
    padding-left: 6px;
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-dark 0%, #4b5563 100%);
    color: $white;
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid $white;
    margin-left: -6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;

    &.is-more {
      background: #e5e7eb;
      color: #374151;
      font-weight: 800;
      font-size: 0.55rem;
    }
  }
}
</style>
