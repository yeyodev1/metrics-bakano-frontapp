<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'
import PlanningCalendar from '@/components/PlanningCalendar.vue'

const workspaces = ref<Workspace[]>([])
const selectedWorkspaceId = ref<string>('')
const isLoading = ref(true)
const searchQuery = ref('')

const selectedWorkspace = computed(() =>
  workspaces.value.find(w => w._id === selectedWorkspaceId.value)
)

const filteredWorkspaces = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return workspaces.value
  return workspaces.value.filter(w => w.name.toLowerCase().includes(q))
})

// Color palette (same order as PlanningCalendar for visual consistency)
const PILL_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#db2777', '#2563eb', '#ea580c', '#65a30d', '#0d9488',
]

function getPillColor(index: number): string {
  return PILL_COLORS[index % PILL_COLORS.length]
}

// Stable color index by original position (not filtered position)
function getColorIndex(wsId: string): number {
  return workspaces.value.findIndex(w => w._id === wsId)
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

function getMetaUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}

async function fetchWorkspaces() {
  try {
    const res = await workspaceService.listWorkspaces({ limit: 100 })
    workspaces.value = res.workspaces
    if (res.workspaces.length > 0) {
      selectedWorkspaceId.value = res.workspaces[0]._id
    }
  } catch {
    // silent
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="internal-planning">

    <!-- Page header -->
    <div class="internal-planning__header">
      <div class="internal-planning__header-text">
        <div class="internal-planning__header-icon">
          <i class="fa-solid fa-calendar-range" />
        </div>
        <div>
          <h1>Planificador Global</h1>
          <p>Visión completa de todos los clientes en tiempo real</p>
        </div>
      </div>
      <div class="internal-planning__header-stats">
        <div class="internal-planning__stat">
          <span class="internal-planning__stat-value">{{ workspaces.length }}</span>
          <span class="internal-planning__stat-label">Clientes</span>
        </div>
      </div>
    </div>

    <!-- Main layout: sidebar + calendar -->
    <div class="internal-planning__body">

      <!-- Client sidebar -->
      <aside class="internal-planning__sidebar">
        <div class="internal-planning__sidebar-header">
          <span class="internal-planning__sidebar-title">
            <i class="fa-solid fa-building" />
            Clientes
          </span>
          <span class="internal-planning__sidebar-count">
            {{ filteredWorkspaces.length }}<template v-if="searchQuery"> / {{ workspaces.length }}</template>
          </span>
        </div>

        <!-- Search -->
        <div class="internal-planning__search">
          <i class="fa-solid fa-magnifying-glass" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar cliente…"
            autocomplete="off"
          />
          <button
            v-if="searchQuery"
            class="internal-planning__search-clear"
            @click="searchQuery = ''"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- List -->
        <div class="internal-planning__client-list">
          <!-- Skeletons -->
          <template v-if="isLoading">
            <div v-for="n in 6" :key="n" class="internal-planning__client-skeleton" />
          </template>

          <!-- Empty search -->
          <div v-else-if="filteredWorkspaces.length === 0" class="internal-planning__client-empty">
            <i class="fa-solid fa-magnifying-glass" />
            <span>Sin resultados para "{{ searchQuery }}"</span>
          </div>

          <!-- Items -->
          <template v-else>
            <div
              v-for="ws in filteredWorkspaces"
              :key="ws._id"
              class="internal-planning__client-item"
              :class="{ 'is-active': ws._id === selectedWorkspaceId }"
              :style="{ '--item-color': getPillColor(getColorIndex(ws._id)) }"
            >
              <!-- Select button -->
              <button
                class="internal-planning__client-item-main"
                :title="`Crear eventos en ${ws.name}`"
                @click="selectedWorkspaceId = ws._id"
              >
                <div
                  class="internal-planning__client-item-avatar"
                  :style="{ background: getPillColor(getColorIndex(ws._id)) }"
                >
                  <img
                    v-if="ws.metaAds?.pageId"
                    :src="getMetaUrl(ws.metaAds.pageId)"
                    :alt="ws.name"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                  <span v-else>{{ getInitials(ws.name) }}</span>
                </div>
                <div class="internal-planning__client-item-info">
                  <span class="internal-planning__client-item-name">{{ ws.name }}</span>
                  <span v-if="ws.metaAds?.pageId" class="internal-planning__client-item-badge">
                    <i class="fa-brands fa-meta" /> Meta
                  </span>
                </div>
                <i
                  v-if="ws._id === selectedWorkspaceId"
                  class="fa-solid fa-circle-check internal-planning__client-item-check"
                />
              </button>

              <!-- Go to workspace -->
              <RouterLink
                :to="{ name: 'AppDashboard', params: { workspaceId: ws._id } }"
                class="internal-planning__client-item-goto"
                :title="`Ir al entorno de ${ws.name}`"
              >
                <i class="fa-solid fa-arrow-up-right-from-square" />
              </RouterLink>
            </div>
          </template>
        </div>

        <!-- Active workspace hint -->
        <Transition name="hint-slide">
          <div v-if="selectedWorkspace" class="internal-planning__active-hint">
            <div class="internal-planning__active-hint-avatar"
              :style="{ background: getPillColor(getColorIndex(selectedWorkspace._id)) }"
            >
              <img
                v-if="selectedWorkspace.metaAds?.pageId"
                :src="getMetaUrl(selectedWorkspace.metaAds.pageId)"
                :alt="selectedWorkspace.name"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-else>{{ getInitials(selectedWorkspace.name) }}</span>
            </div>
            <div class="internal-planning__active-hint-text">
              <span class="internal-planning__active-hint-label">Creando en</span>
              <span class="internal-planning__active-hint-name">{{ selectedWorkspace.name }}</span>
            </div>
          </div>
        </Transition>
      </aside>

      <!-- Calendar -->
      <div class="internal-planning__calendar-wrap">
        <div v-if="isLoading || !selectedWorkspaceId" class="internal-planning__calendar-placeholder">
          <div class="internal-planning__calendar-spinner" />
          <p>Cargando clientes…</p>
        </div>
        <PlanningCalendar
          v-else
          :key="selectedWorkspaceId"
          :workspaceId="selectedWorkspaceId"
          default-view="global-month"
        />
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.internal-planning {
  padding: 2rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem 3rem;
  }

  // ── Header ───────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  &__header-text {
    display: flex;
    align-items: center;
    gap: 1.25rem;

    h1 {
      margin: 0 0 0.2rem;
      font-size: 1.75rem;
      font-weight: 800;
      color: $primary-dark;
      letter-spacing: -0.03em;

      @media (max-width: 480px) {
        font-size: 1.4rem;
      }
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: $text-secondary;
    }
  }

  &__header-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 12%) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 20px rgba($primary, 0.25);

    i {
      font-size: 1.4rem;
      color: $white;
    }
  }

  &__header-stats {
    display: flex;
    gap: 1rem;
  }

  &__stat {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 14px;
    padding: 0.75rem 1.5rem;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary;
    line-height: 1;
  }

  &__stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $text-secondary;
    font-weight: 600;
  }

  // ── Body: sidebar + calendar ──────────────────────────────
  &__body {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    flex: 1;

    @media (max-width: 900px) {
      flex-direction: column;
    }
  }

  // ── Sidebar ───────────────────────────────────────────────
  &__sidebar {
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

  &__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.1rem 0.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__sidebar-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 0.45rem;

    i { color: $primary; font-size: 0.8rem; }
  }

  &__sidebar-count {
    font-size: 0.72rem;
    font-weight: 700;
    color: $white;
    background: $primary;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    min-width: 22px;
    text-align: center;
  }

  // ── Search ────────────────────────────────────────────────
  &__search {
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

      &::placeholder { color: rgba($text-secondary, 0.5); }

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

    &:hover { opacity: 1; }
  }

  // ── Client list ───────────────────────────────────────────
  &__client-list {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
    padding: 0.4rem 0;
    scrollbar-width: thin;
    scrollbar-color: rgba($primary, 0.18) transparent;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
      background: rgba($primary, 0.18);
      border-radius: 4px;
    }

    @media (max-width: 900px) {
      max-height: 220px;
    }
  }

  &__client-skeleton {
    height: 44px;
    margin: 0.25rem 0.6rem;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba($primary-dark, 0.06) 25%, rgba($primary-dark, 0.03) 50%, rgba($primary-dark, 0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  &__client-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    color: $text-secondary;
    font-size: 0.8rem;
    opacity: 0.6;
    text-align: center;

    i { font-size: 1.1rem; }
  }

  &__client-item {
    display: flex;
    align-items: center;
    margin: 0.2rem 0.5rem;
    border-radius: 10px;
    border: 1.5px solid transparent;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
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

  &__client-item-main {
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

  &__client-item-avatar {
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

  &__client-item-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
  }

  &__client-item-name {
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

  &__client-item-badge {
    font-size: 0.62rem;
    font-weight: 700;
    color: #0866ff;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    opacity: 0.8;

    i { font-size: 0.6rem; }
  }

  &__client-item-check {
    font-size: 0.85rem;
    flex-shrink: 0;
    color: var(--item-color, #{$primary});
  }

  &__client-item-goto {
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

  // ── Active hint (bottom of sidebar) ──────────────────────
  &__active-hint {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
    background: rgba($primary-dark, 0.015);
  }

  &__active-hint-avatar {
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

    img { width: 100%; height: 100%; object-fit: cover; border-radius: 7px; }
  }

  &__active-hint-text {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  &__active-hint-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    font-weight: 700;
  }

  &__active-hint-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Calendar wrap ────────────────────────────────────────
  &__calendar-wrap {
    flex: 1;
    min-width: 0;
  }

  &__calendar-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 6rem 0;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__calendar-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba($primary, 0.12);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
}

// Transition for the active hint
.hint-slide-enter-active {
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hint-slide-leave-active {
  transition: all 0.18s ease;
}
.hint-slide-enter-from,
.hint-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
