<script setup lang="ts">
import type { Workspace } from '@/types'

const props = defineProps({
  workspace: {
    type: Object as () => Workspace,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    required: true,
  },
})

defineEmits(['select'])

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getMetaUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}
</script>

<template>
  <div
    class="internal-planning-client-item"
    :class="{ 'is-active': isActive }"
    :style="{ '--item-color': color }"
  >
    <!-- Select button -->
    <button
      class="internal-planning-client-item__main"
      :title="`Crear eventos en ${workspace.name}`"
      @click="$emit('select', workspace._id)"
    >
      <div
        class="internal-planning-client-item__avatar"
        :style="{ background: color }"
      >
        <img
          v-if="workspace.metaAds?.pageId"
          :src="getMetaUrl(workspace.metaAds.pageId)"
          :alt="workspace.name"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else>{{ getInitials(workspace.name) }}</span>
      </div>

      <div class="internal-planning-client-item__info">
        <span class="internal-planning-client-item__name">{{ workspace.name }}</span>
        <span v-if="workspace.metaAds?.pageId" class="internal-planning-client-item__badge">
          <i class="fa-brands fa-meta" /> Meta
        </span>
      </div>

      <i
        v-if="isActive"
        class="fa-solid fa-circle-check internal-planning-client-item__check"
      />
    </button>

    <!-- Go to workspace link -->
    <RouterLink
      :to="{ name: 'AppDashboard', params: { workspaceId: workspace._id } }"
      class="internal-planning-client-item__goto"
      :title="`Ir al entorno de ${workspace.name}`"
    >
      <i class="fa-solid fa-arrow-up-right-from-square" />
    </RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.internal-planning-client-item {
  display: flex;
  align-items: center;
  margin: 0.125rem 0.5rem;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    background: rgba($primary-dark, 0.025);
    border-color: rgba($primary-dark, 0.07);
  }

  &.is-active {
    background: color-mix(in srgb, var(--item-color) 7%, transparent);
    border-color: color-mix(in srgb, var(--item-color) 35%, transparent);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.6rem 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    flex: 1;
    min-width: 0;
    text-align: left;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 7px;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .is-active & {
      color: var(--item-color);
      font-weight: 700;
    }
  }

  &__badge {
    font-size: 0.65rem;
    font-weight: 700;
    color: #0866ff;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    opacity: 0.85;

    i {
      font-size: 0.65rem;
    }
  }

  &__check {
    font-size: 0.9rem;
    flex-shrink: 0;
    color: var(--item-color);
  }

  &__goto {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 0.4rem;
    border-radius: 8px;
    color: $text-secondary;
    font-size: 0.75rem;
    text-decoration: none;
    transition: all 0.18s;
    flex-shrink: 0;
    opacity: 0.4;

    &:hover {
      background: rgba($primary, 0.1);
      color: $primary;
      opacity: 1;
    }
  }
}
</style>
