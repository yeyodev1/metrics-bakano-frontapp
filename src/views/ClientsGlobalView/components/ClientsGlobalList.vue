<script setup lang="ts">
import type { PropType } from 'vue'
import type { Workspace, WorkspaceUser, ClientMeeting } from '@/types'
import ClientsGlobalWorkspaceCard from './ClientsGlobalWorkspaceCard.vue'

const props = defineProps({
  workspaces: {
    type: Array as () => Workspace[],
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String as PropType<string | null>,
    default: null,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  loadingMore: {
    type: Boolean,
    default: false,
  },
  meetingMap: {
    type: Object as PropType<Map<string, ClientMeeting>>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'load-more'): void
  (e: 'toggle-workspace', workspace: Workspace): void
  (e: 'open-meeting-modal', workspace: Workspace, event: Event): void
}>()
</script>

<template>
  <div class="clients-global__list-container">
    <div v-if="loading" class="clients-global__loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando clientes…</span>
    </div>

    <div v-else-if="error" class="clients-global__error">
      <i class="fa-solid fa-triangle-exclamation" />
      {{ error }}
    </div>

    <div v-else-if="workspaces.length === 0" class="clients-global__empty">
      <i class="fa-solid fa-inbox" />
      <span>No se encontraron clientes.</span>
    </div>

    <div v-else class="clients-global__list">
      <ClientsGlobalWorkspaceCard
        v-for="ws in workspaces"
        :key="ws._id"
        :workspace="ws"
        :meeting="meetingMap.get(ws._id)"
        @select-workspace="emit('toggle-workspace', ws)"
        @open-meeting-modal="(wsParam, ev) => emit('open-meeting-modal', wsParam, ev)"
      />

      <div v-if="hasMore" class="clients-global__load-more">
        <button class="clients-global__load-more-btn" :disabled="loadingMore" @click="emit('load-more')">
          <i :class="loadingMore ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-chevron-down'" />
          {{ loadingMore ? 'Cargando…' : 'Cargar más clientes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.clients-global {
  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    background: #fff;
    border-radius: 16px;
    border: 1px dashed rgba($primary-dark, 0.15);
    color: rgba($primary-dark, 0.5);
    gap: 1rem;
    font-size: 1rem;

    i {
      font-size: 2rem;
      opacity: 0.5;
    }
  }

  &__error {
    color: #ef4444;
    border-color: rgba(#ef4444, 0.2);
    background: rgba(#ef4444, 0.02);
    i { color: #ef4444; opacity: 1; }
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
    align-items: stretch;
  }

  &__load-more {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
  }

  &__load-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #fff;
    border: 1.5px solid rgba($primary-dark, 0.1);
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    color: $primary-dark;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary, 0.1);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}
</style>
