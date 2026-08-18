<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Workspace } from '@/types'
import WorkspaceCard from './WorkspaceCard.vue'

const props = defineProps<{
  workspaces: Workspace[]
  searchQuery: string
  isLoadingWorkspaces: boolean
  hasMore: boolean
  isLoadingMore: boolean
  selectedWorkspace: Workspace | null
  togglingWorkspaceId: string | null
  deletingWorkspaceId: string | null
  /** Total del filtro actual, para la paginación honesta "Mostrando X de Y". */
  total: number
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'selectWorkspace', ws: Workspace): void
  (e: 'handleToggleWorkspaceActive', ws: Workspace, ev: Event): void
  (e: 'handleDeleteWorkspace', ws: Workspace, ev: Event): void
  (e: 'fetchWorkspaces', loadMore: boolean): void
  (e: 'openCreateWorkspace'): void
}>()

const router = useRouter()

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
})
</script>

<template>
  <section class="wsl">
    <div class="wsl__header">
      <div class="wsl__search">
        <i v-if="isLoadingWorkspaces" class="fa-solid fa-spinner fa-spin" />
        <i v-else class="fa-solid fa-magnifying-glass" />
        <input
          v-model="localSearchQuery"
          type="text"
          placeholder="Buscar entorno..."
          class="wsl__search-input"
        />
      </div>
    </div>

    <div v-if="isLoadingWorkspaces && workspaces.length === 0" class="wsl__loading">
      <span class="wsl__spinner" />
    </div>

    <div v-else-if="workspaces.length === 0 && !isLoadingWorkspaces" class="wsl__empty">
      <div class="wsl__empty-icon"><i class="fa-solid fa-layer-group" aria-hidden="true" /></div>
      <h4 class="wsl__empty-title">No hay entornos aquí</h4>
      <p class="wsl__empty-desc">Prueba con otro filtro o crea un nuevo entorno para empezar.</p>
      <button class="wsl__btn-primary" @click="emit('openCreateWorkspace')">
        <i class="fa-solid fa-plus" /> Crear entorno
      </button>
    </div>

    <div v-else class="wsl__grid" :class="{ 'is-loading': isLoadingWorkspaces }">
      <WorkspaceCard
        v-for="ws in workspaces"
        :key="ws._id"
        :ws="ws"
        :busy="togglingWorkspaceId === ws._id || deletingWorkspaceId === ws._id"
        @select="emit('selectWorkspace', ws)"
        @toggle-active="(ev) => emit('handleToggleWorkspaceActive', ws, ev)"
        @remove="(ev) => emit('handleDeleteWorkspace', ws, ev)"
        @enter="router.push({ name: 'BillingRoas', params: { workspaceId: ws._id } })"
      />
    </div>

    <!-- Paginación honesta: cuántos se ven y cuántos hay en el filtro actual. -->
    <div v-if="workspaces.length > 0" class="wsl__footer">
      <span class="wsl__footer-count">
        Mostrando <strong>{{ workspaces.length }}</strong> de <strong>{{ total }}</strong>
      </span>
      <button
        v-if="hasMore"
        class="wsl__btn-outline"
        type="button"
        :disabled="isLoadingMore"
        @click="emit('fetchWorkspaces', true)"
      >
        <span v-if="!isLoadingMore">Cargar más</span>
        <span v-else class="wsl__spinner wsl__spinner--sm" />
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
// Mobile-first: 1 columna; 2 desde 640px; 3 desde 1100px.
.wsl {
  width: 100%;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.05);
  border: 1px solid rgba($primary-dark, 0.05);
  min-height: 400px;
  padding: 1rem;

  @media (min-width: 768px) { padding: 1.25rem 1.5rem; }
}

.wsl__header { margin-bottom: 1rem; }

.wsl__search {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba($primary-dark, 0.02);
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 12px;
  padding: 0.65rem 0.9rem;

  i { color: $text-secondary; font-size: 0.85rem; }

  &:focus-within { border-color: $primary; background: $white; }

  @media (min-width: 768px) { max-width: 340px; }
}

.wsl__search-input {
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.9rem;
  width: 100%;
  color: $primary-dark;
}

.wsl__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;

  &.is-loading { opacity: 0.6; }

  @media (min-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 1100px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.wsl__btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: $primary;
  color: $white;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.2rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba($primary, 0.25);

  &:hover { filter: brightness(1.05); }
}

.wsl__btn-outline {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.14);
  color: $primary-dark;
  border-radius: 10px;
  padding: 0.55rem 1.2rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover { border-color: rgba($primary-dark, 0.3); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.wsl__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 1rem 0 0.25rem;

  strong { color: $primary-dark; }
}

.wsl__footer-count { font-size: 0.8rem; color: $text-secondary; }

.wsl__loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.wsl__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
}

.wsl__empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba($primary, 0.08);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-bottom: 0.4rem;
}

.wsl__empty-title { font-size: 1rem; font-weight: 800; color: $primary-dark; }
.wsl__empty-desc { font-size: 0.85rem; color: $text-secondary; max-width: 320px; }

.wsl__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: wsl-spin 0.8s linear infinite;

  &--sm { width: 14px; height: 14px; border-width: 2px; }
}

@keyframes wsl-spin { to { transform: rotate(360deg); } }
</style>
