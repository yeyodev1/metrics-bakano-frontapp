<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import type { Workspace } from '@/types'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import InternalPlanningHeader from '@/components/planning/internal/InternalPlanningHeader.vue'
import InternalPlanningSidebar from '@/components/planning/internal/InternalPlanningSidebar.vue'

const workspaces = ref<Workspace[]>([])
const selectedWorkspaceId = ref<string>('')
const isLoading = ref(true)

async function fetchWorkspaces() {
  try {
    const res = await workspaceService.listWorkspaces({ limit: 100 })
    // Defensive check: ensure res.workspaces is an array
    workspaces.value = Array.isArray(res.workspaces) ? res.workspaces : []
    
    if (workspaces.value.length > 0) {
      selectedWorkspaceId.value = workspaces.value[0]._id
    }
  } catch (error) {
    console.error('Error fetching workspaces:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWorkspaces)
</script>

<template>
  <div class="internal-planning">
    <!-- Header Section -->
    <InternalPlanningHeader :client-count="workspaces.length" />

    <!-- Main Content Grid -->
    <main class="internal-planning__content">
      <!-- Left Sidebar -->
      <InternalPlanningSidebar
        v-model:selected-workspace-id="selectedWorkspaceId"
        :workspaces="workspaces"
        :is-loading="isLoading"
      />

      <!-- Right Calendar Area -->
      <section class="internal-planning__calendar">
        <div v-if="isLoading || !selectedWorkspaceId" class="internal-planning__loader">
          <div class="internal-planning__spinner" />
          <p>Cargando planificador…</p>
        </div>
        
        <PlanningCalendar
          v-else
          :key="selectedWorkspaceId"
          :workspace-id="selectedWorkspaceId"
          default-view="global-month"
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

  &__calendar {
    flex: 1;
    width: 100%; // Ensure it takes full width on mobile
    min-width: 0; // Prevent overflow in flexbox
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
