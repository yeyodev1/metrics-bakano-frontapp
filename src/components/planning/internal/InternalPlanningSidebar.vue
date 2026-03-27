<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Workspace } from '@/types'
import InternalPlanningClientItem from './InternalPlanningClientItem.vue'

const props = defineProps({
  workspaces: {
    type: Array as () => Workspace[],
    required: true,
  },
  selectedWorkspaceId: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isLoadingMore: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:selectedWorkspaceId', 'load-more', 'search'])

const searchQuery = ref('')

// All filtering is handled server-side; local list reflects what the parent passes
const filteredWorkspaces = computed(() => props.workspaces)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search', searchQuery.value.trim())
  }, 350)
}

function clearSearch() {
  searchQuery.value = ''
  emit('search', '')
}

const selectedWorkspace = computed(() =>
  props.workspaces.find(w => w._id === props.selectedWorkspaceId)
)

// Color management (same logic as before but more robust)
const PILL_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#db2777', '#2563eb', '#ea580c', '#65a30d', '#0d9488',
]

function getClientColor(wsId: string): string {
  const index = props.workspaces.findIndex(w => w._id === wsId)
  if (index === -1) return PILL_COLORS[0]
  return PILL_COLORS[index % PILL_COLORS.length]
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getMetaUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}

function handleSelect(id: string) {
  emit('update:selectedWorkspaceId', id)
}
</script>

<template>
  <aside class="internal-planning-sidebar">
    <div class="internal-planning-sidebar__header">
      <div class="internal-planning-sidebar__title">
        <i class="fa-solid fa-building" />
        <span>Clientes</span>
      </div>
      <span class="internal-planning-sidebar__count">
        {{ filteredWorkspaces.length }}
      </span>
    </div>

    <!-- Search Box -->
    <div class="internal-planning-sidebar__search">
      <i class="fa-solid fa-magnifying-glass" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar cliente…"
        autocomplete="off"
        @input="onSearchInput"
      />
      <button
        v-if="searchQuery"
        class="internal-planning-sidebar__search-clear"
        @click="clearSearch"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <!-- Scrollable Client List -->
    <div class="internal-planning-sidebar__list">
      <!-- Skeletons -->
      <template v-if="isLoading">
        <div v-for="n in 6" :key="n" class="internal-planning-sidebar__skeleton" />
      </template>

      <!-- Empty Result -->
      <div v-else-if="filteredWorkspaces.length === 0" class="internal-planning-sidebar__empty">
        <i class="fa-solid fa-magnifying-glass" />
        <span>Sin resultados para "{{ searchQuery }}"</span>
      </div>

      <!-- Result List -->
      <template v-else>
        <InternalPlanningClientItem
          v-for="ws in filteredWorkspaces"
          :key="ws._id"
          :workspace="ws"
          :is-active="ws._id === selectedWorkspaceId"
          :color="getClientColor(ws._id)"
          @select="handleSelect"
        />
        <button
          v-if="hasMore && !searchQuery.trim()"
          class="internal-planning-sidebar__load-more"
          :disabled="isLoadingMore"
          @click="emit('load-more')"
        >
          <i :class="isLoadingMore ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chevron-down'" />
          {{ isLoadingMore ? 'Cargando…' : 'Ver 6 más' }}
        </button>
      </template>
    </div>

    <!-- Active Workspace Hint (sticky at bottom) -->
    <Transition name="hint-slide">
      <div v-if="selectedWorkspace" class="internal-planning-sidebar__hint">
        <div class="internal-planning-sidebar__hint-avatar"
          :style="{ background: getClientColor(selectedWorkspace._id) }"
        >
          <img
            v-if="selectedWorkspace.metaAds?.pageId"
            :src="getMetaUrl(selectedWorkspace.metaAds.pageId)"
            :alt="selectedWorkspace.name"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <span v-else>{{ getInitials(selectedWorkspace.name) }}</span>
        </div>
        <div class="internal-planning-sidebar__hint-details">
          <span class="internal-planning-sidebar__hint-label">Creando en</span>
          <span class="internal-planning-sidebar__hint-name">{{ selectedWorkspace.name }}</span>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<style lang="scss" scoped>
.internal-planning-sidebar {
  display: flex;
  flex-direction: column;
  background: $white;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.1rem 0.85rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;

    i {
      color: $primary;
      font-size: 0.8rem;
    }
  }

  &__count {
    font-size: 0.7rem;
    font-weight: 700;
    color: $white;
    background: $primary;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    min-width: 22px;
    text-align: center;
  }

  &__search {
    position: relative;
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);

    i:first-child {
      position: absolute;
      left: 1.55rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: $text-secondary;
      opacity: 0.5;
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 0.55rem 2.2rem 0.55rem 2.1rem;
      border-radius: 10px;
      border: 1.5px solid rgba($primary-dark, 0.08);
      background: rgba($primary-dark, 0.025);
      font-size: 0.85rem;
      color: $primary-dark;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: $primary;
        background: $white;
        box-shadow: 0 0 0 3px rgba($primary, 0.08);
      }
    }
  }

  &__search-clear {
    position: absolute;
    right: 1.4rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: $text-secondary;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    max-height: 280px; // Mobile friendly height
    padding: 0.5rem 0;
    scrollbar-width: thin;

    @media (min-width: 900px) {
      max-height: 500px;
    }
  }

  &__skeleton {
    height: 48px;
    margin: 0.25rem 0.75rem;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba($primary-dark, 0.06) 25%, rgba($primary-dark, 0.03) 50%, rgba($primary-dark, 0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2.5rem 1rem;
    color: $text-secondary;
    font-size: 0.85rem;
    opacity: 0.7;
    text-align: center;

    i {
      font-size: 1.2rem;
    }
  }

  &__load-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: calc(100% - 1.5rem);
    margin: 0.25rem 0.75rem 0.5rem;
    padding: 0.55rem 1rem;
    border-radius: 10px;
    border: 1.5px dashed rgba($primary-dark, 0.12);
    background: transparent;
    color: $text-secondary;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    i { font-size: 0.72rem; }

    &:hover {
      background: rgba($primary, 0.05);
      border-color: rgba($primary, 0.3);
      color: $primary;
    }
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
    background: rgba($primary-dark, 0.015);
  }

  &__hint-avatar {
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

  &__hint-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__hint-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.1rem;
  }

  &__hint-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Transitions
.hint-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hint-slide-leave-active {
  transition: all 0.2s ease;
}
.hint-slide-enter-from,
.hint-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
