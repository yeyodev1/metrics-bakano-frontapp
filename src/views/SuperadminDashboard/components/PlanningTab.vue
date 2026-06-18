<script setup lang="ts">
import { ref } from 'vue'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import PlanningSidebar from './PlanningSidebar.vue'

const planningSelectedId = ref<string>('')
</script>

<template>
  <div class="superadmin-dashboard__planning">
    <div class="superadmin-dashboard__planning-body">
      <!-- Sidebar -->
      <PlanningSidebar v-model="planningSelectedId" />

      <!-- Calendar -->
      <div class="superadmin-dashboard__planning-calendar">
        <div v-if="!planningSelectedId" class="superadmin-dashboard__planning-placeholder">
          <span class="superadmin-dashboard__spinner" />
          <p>Selecciona un cliente para comenzar…</p>
        </div>
        <PlanningCalendar
          v-else
          :key="planningSelectedId"
          :workspaceId="planningSelectedId"
          default-view="global-month"
          allow-global
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__planning {
  padding: 1.5rem 0 0;
}

.superadmin-dashboard__planning-body {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.superadmin-dashboard__planning-calendar {
  flex: 1;
  min-width: 0;
}

.superadmin-dashboard__planning-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 6rem 0;
  color: $text-secondary;
  font-size: 0.9rem;
  background: $white;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.06);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
