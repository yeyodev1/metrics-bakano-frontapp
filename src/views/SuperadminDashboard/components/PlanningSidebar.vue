<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const workspaces = ref<Workspace[]>([])
const isLoading = ref(false)
const planningSearch = ref<string>('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const PLANNING_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#db2777', '#2563eb', '#ea580c', '#65a30d', '#0d9488',
]

function planningColor(wsId: string): string {
  const idx = workspaces.value.findIndex(w => w._id === wsId)
  return PLANNING_COLORS[idx % PLANNING_COLORS.length] as string
}

function planningInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function planningMetaUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}

const planningSelectedWorkspace = computed(() =>
  workspaces.value.find(w => w._id === props.modelValue)
)

async function fetchPlanningWorkspaces() {
  isLoading.value = true
  try {
    const response = await workspaceService.listWorkspaces({
      search: planningSearch.value.trim() || undefined,
      limit: 100,
      page: 1
    })
    workspaces.value = response.workspaces
    
    if (response.workspaces.length > 0) {
      const exists = response.workspaces.some(w => w._id === props.modelValue)
      if (!exists) {
        emit('update:modelValue', response.workspaces[0]._id)
      }
    } else {
      emit('update:modelValue', '')
    }
  } catch (err) {
    // Fail silently
  } finally {
    isLoading.value = false
  }
}

watch(planningSearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchPlanningWorkspaces()
  }, 450)
})

onMounted(() => {
  fetchPlanningWorkspaces()
})
</script>

<template>
  <aside class="superadmin-dashboard__planning-sidebar">
    <div class="superadmin-dashboard__planning-sidebar-header">
      <span class="superadmin-dashboard__planning-sidebar-title">
        <i class="fa-solid fa-building" /> Clientes
      </span>
      <span class="superadmin-dashboard__planning-sidebar-count">{{ workspaces.length }}</span>
    </div>

    <div class="superadmin-dashboard__planning-search">
      <i class="fa-solid fa-magnifying-glass" />
      <input 
        v-model="planningSearch" 
        type="text" 
        placeholder="Buscar cliente…" 
        autocomplete="off" 
      />
      <button 
        v-if="planningSearch" 
        class="superadmin-dashboard__planning-search-clear" 
        @click="planningSearch = ''"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <div class="superadmin-dashboard__planning-list">
      <div v-if="isLoading" v-for="n in 5" :key="n" class="superadmin-dashboard__planning-skeleton" />
      <div v-else-if="workspaces.length === 0" class="superadmin-dashboard__planning-empty">
        <i class="fa-solid fa-magnifying-glass" />
        <span>Sin resultados</span>
      </div>
      <template v-else>
        <div
          v-for="ws in workspaces"
          :key="ws._id"
          class="superadmin-dashboard__planning-item"
          :class="{ 'is-active': ws._id === modelValue }"
          :style="{ '--item-color': planningColor(ws._id) }"
        >
          <button
            class="superadmin-dashboard__planning-item-main"
            @click="emit('update:modelValue', ws._id)"
          >
            <div
              class="superadmin-dashboard__planning-item-avatar"
              :style="{ background: planningColor(ws._id) }"
            >
              <img
                v-if="ws.metaAds?.pageId"
                :src="planningMetaUrl(ws.metaAds.pageId)"
                :alt="ws.name"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-else>{{ planningInitials(ws.name) }}</span>
            </div>
            <div class="superadmin-dashboard__planning-item-info">
              <span class="superadmin-dashboard__planning-item-name">{{ ws.name }}</span>
              <span v-if="ws.metaAds?.pageId" class="superadmin-dashboard__planning-item-badge">
                <i class="fa-brands fa-meta" /> Meta
              </span>
            </div>
            <i v-if="ws._id === modelValue" class="fa-solid fa-circle-check superadmin-dashboard__planning-item-check" />
          </button>
          <RouterLink
            :to="{ name: 'BillingRoas', params: { workspaceId: ws._id } }"
            class="superadmin-dashboard__planning-item-goto"
            :title="`Ir al entorno de ${ws.name}`"
          >
            <i class="fa-solid fa-arrow-up-right-from-square" />
          </RouterLink>
        </div>
      </template>
    </div>

    <div v-if="planningSelectedWorkspace" class="superadmin-dashboard__planning-active-hint">
      <div
        class="superadmin-dashboard__planning-active-avatar"
        :style="{ background: planningColor(planningSelectedWorkspace._id) }"
      >
        <img
          v-if="planningSelectedWorkspace.metaAds?.pageId"
          :src="planningMetaUrl(planningSelectedWorkspace.metaAds.pageId)"
          :alt="planningSelectedWorkspace.name"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else>{{ planningInitials(planningSelectedWorkspace.name) }}</span>
      </div>
      <div>
        <span class="superadmin-dashboard__planning-active-label">Creando en</span>
        <span class="superadmin-dashboard__planning-active-name">{{ planningSelectedWorkspace.name }}</span>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__planning-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: $white;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 1rem;

  @media (max-width: 900px) {
    width: 100%;
    position: static;
  }
}

.superadmin-dashboard__planning-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.1rem 0.75rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
}

.superadmin-dashboard__planning-sidebar-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 0.45rem;

  i {
    color: $primary;
    font-size: 0.8rem;
  }
}

.superadmin-dashboard__planning-sidebar-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: $white;
  background: $primary;
  padding: 0.15rem 0.55rem;
  border-radius: 20px;
  min-width: 22px;
  text-align: center;
}

.superadmin-dashboard__planning-search {
  position: relative;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid rgba($primary-dark, 0.05);

  i:first-child {
    position: absolute;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    color: $text-secondary;
    opacity: 0.5;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 1.9rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.08);
    background: rgba($primary-dark, 0.025);
    font-size: 0.83rem;
    color: $primary-dark;
    font-family: inherit;
    transition: all 0.2s;

    &::placeholder {
      color: rgba($text-secondary, 0.5);
    }

    &:focus {
      outline: none;
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 3px rgba($primary, 0.08);
    }
  }
}

.superadmin-dashboard__planning-search-clear {
  position: absolute;
  right: 1.35rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  opacity: 0.5;
  font-size: 0.75rem;
  padding: 0.2rem;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 1;
  }
}

.superadmin-dashboard__planning-list {
  flex: 1;
  overflow-y: auto;
  max-height: 380px;
  padding: 0.4rem 0;
  scrollbar-width: thin;
  scrollbar-color: rgba($primary, 0.18) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($primary, 0.18);
    border-radius: 4px;
  }

  @media (max-width: 900px) {
    max-height: 200px;
  }
}

.superadmin-dashboard__planning-skeleton {
  height: 44px;
  margin: 0.25rem 0.6rem;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba($primary-dark, 0.06) 25%, rgba($primary-dark, 0.03) 50%, rgba($primary-dark, 0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.superadmin-dashboard__planning-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: $text-secondary;
  font-size: 0.8rem;
  opacity: 0.6;
  text-align: center;

  i {
    font-size: 1.1rem;
  }
}

.superadmin-dashboard__planning-item {
  display: flex;
  align-items: center;
  margin: 0.2rem 0.5rem;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: all 0.18s;
  overflow: hidden;

  &:hover {
    background: rgba($primary-dark, 0.025);
    border-color: rgba($primary-dark, 0.07);
  }

  &.is-active {
    background: color-mix(in srgb, var(--item-color, #{$primary}) 7%, transparent);
    border-color: color-mix(in srgb, var(--item-color, #{$primary}) 35%, transparent);
  }
}

.superadmin-dashboard__planning-item-main {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  background: transparent;
  border: none;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  text-align: left;
}

.superadmin-dashboard__planning-item-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  color: $white;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
}

.superadmin-dashboard__planning-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.superadmin-dashboard__planning-item-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .is-active & {
    color: var(--item-color, #{$primary});
    font-weight: 700;
  }
}

.superadmin-dashboard__planning-item-badge {
  font-size: 0.62rem;
  font-weight: 700;
  color: #0866ff;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  opacity: 0.8;

  i {
    font-size: 0.6rem;
  }
}

.superadmin-dashboard__planning-item-check {
  font-size: 0.85rem;
  flex-shrink: 0;
  color: var(--item-color, #{$primary});
}

.superadmin-dashboard__planning-item-goto {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-right: 0.35rem;
  border-radius: 7px;
  color: $text-secondary;
  font-size: 0.7rem;
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

.superadmin-dashboard__planning-active-hint {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid rgba($primary-dark, 0.06);
  background: rgba($primary-dark, 0.015);
}

.superadmin-dashboard__planning-active-avatar {
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

.superadmin-dashboard__planning-active-label {
  display: block;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: $text-secondary;
  font-weight: 700;
}

.superadmin-dashboard__planning-active-name {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
