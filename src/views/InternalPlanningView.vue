<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import InternalPlanningHeader from '@/components/planning/internal/InternalPlanningHeader.vue'
import InternalPlanningSidebar from '@/components/planning/internal/InternalPlanningSidebar.vue'

const PAGE_SIZE = 6

const workspaces = ref<Workspace[]>([])
const selectedWorkspaceId = ref<string>('')
const calendarDefaultView = ref<'month' | 'week' | 'global-week' | 'global-month'>('global-month')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const activeSearch = ref('')

async function fetchWorkspaces(page = 1, search = '') {
  try {
    const params: { page: number; limit: number; search?: string } = { page, limit: PAGE_SIZE }
    if (search) params.search = search
    const res = await workspaceService.listWorkspaces(params)
    const fetched = Array.isArray(res.workspaces) ? res.workspaces : []
    workspaces.value = page === 1 ? fetched : [...workspaces.value, ...fetched]
    hasMore.value = search ? false : (res.metadata?.hasMore ?? false)
    currentPage.value = page
  } catch (error) {
    console.error('Error fetching workspaces:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function handleSearch(query: string) {
  activeSearch.value = query
  isLoading.value = true
  await fetchWorkspaces(1, query)
}

async function loadMoreWorkspaces() {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  await fetchWorkspaces(currentPage.value + 1, activeSearch.value)
}

function handleSelectWorkspace(id: string) {
  selectedWorkspaceId.value = id
  calendarDefaultView.value = 'week'
}

onMounted(() => fetchWorkspaces(1))
</script>

<template>
  <div class="internal-planning">
    <!-- Header Section -->
    <InternalPlanningHeader :client-count="workspaces.length" />

    <!-- Main Content Grid -->
    <main class="internal-planning__content">
      <!-- Left Sidebar (sticky) -->
      <div class="internal-planning__sidebar-wrapper">
        <InternalPlanningSidebar
          :selected-workspace-id="selectedWorkspaceId"
          :workspaces="workspaces"
          :is-loading="isLoading"
          :is-loading-more="isLoadingMore"
          :has-more="hasMore"
          @update:selected-workspace-id="handleSelectWorkspace"
          @load-more="loadMoreWorkspaces"
          @search="handleSearch"
        />
      </div>

      <!-- Right Calendar Area -->
      <section class="internal-planning__calendar">
        <!-- Loading -->
        <div v-if="isLoading" class="internal-planning__loader">
          <div class="internal-planning__spinner" />
          <p>Cargando clientes…</p>
        </div>

        <!-- No client selected yet -->
        <div v-else-if="!selectedWorkspaceId" class="internal-planning__empty">
          <div class="internal-planning__empty-icon">
            <i class="fa-solid fa-arrow-left" />
          </div>
          <h3>Selecciona un cliente</h3>
          <p>Elige un entorno de la lista para ver su planificación.</p>
        </div>

        <PlanningCalendar
          v-else
          :key="selectedWorkspaceId"
          :workspace-id="selectedWorkspaceId"
          :default-view="calendarDefaultView"
        />
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.internal-planning {
  padding: 1.25rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;

  @media (min-width: 768px) {
    padding: 2rem 2rem 4rem;
    gap: 2rem;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
    flex: 1;

    @media (min-width: 900px) {
      flex-direction: row;
      gap: 1.75rem;
    }
  }

  &__sidebar-wrapper {
    width: 100%;

    @media (min-width: 900px) {
      width: 260px;
      flex-shrink: 0;
      position: sticky;
      top: 1.5rem;
      align-self: flex-start;
    }
  }

  &__calendar {
    flex: 1;
    width: 100%;
    min-width: 0;
  }

  &__loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 6rem 1rem;
    color: $text-secondary;
    font-size: 0.9rem;
    background: $white;
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.06);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 6rem 2rem;
    background: $white;
    border-radius: 16px;
    border: 1.5px dashed rgba($primary-dark, 0.1);
    text-align: center;

    h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: $primary-dark;
    }

    p {
      margin: 0;
      font-size: 0.88rem;
      color: $text-secondary;
    }
  }

  &__empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba($primary, 0.08);
    border: 2px dashed rgba($primary, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: $primary;
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  &__spinner {
    width: 44px;
    height: 44px;
    border: 3.5px solid rgba($primary, 0.12);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
