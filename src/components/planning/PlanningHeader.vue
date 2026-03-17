<script setup lang="ts">
import { computed } from 'vue'
import PlanningHeaderNav from './PlanningHeaderNav.vue'
import PlanningHeaderActions from './PlanningHeaderActions.vue'
import PlanningHeaderViewSelector from './PlanningHeaderViewSelector.vue'

const props = defineProps({
  viewMode: {
    type: String as () => 'month' | 'week' | 'global-week' | 'global-month',
    required: true,
  },
  currentMonth: {
    type: Date,
    required: true,
  },
  currentWeekStart: {
    type: Date,
    required: true,
  },
  showMineOnly: {
    type: Boolean,
    required: true,
  },
  isInternal: {
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
  canManage: {
    type: Boolean,
    default: false,
  },
  canCreate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:viewMode',
  'update:showMineOnly',
  'prev',
  'next',
  'today',
  'create',
])

const activeLabel = computed(() => {
  if (props.viewMode.includes('month')) {
    return props.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const start = new Date(props.currentWeekStart)
  const end = new Date(props.currentWeekStart)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', opts)}`
})
</script>

<template>
  <header class="planning-header" :class="{ 'is-global': viewMode.includes('global') }">
    <!-- Top Section: Navigation & Actions -->
    <div class="planning-header__top">
      <PlanningHeaderNav
        :label="activeLabel"
        @prev="emit('prev')"
        @next="emit('next')"
        @today="emit('today')"
      />

      <PlanningHeaderActions
        :show-mine-only="showMineOnly"
        :can-manage="canManage"
        :can-create="canCreate"
        @update:show-mine-only="emit('update:showMineOnly', $event)"
        @create="emit('create')"
      />
    </div>

    <!-- Main Section: View Selection -->
    <div class="planning-header__main">
      <PlanningHeaderViewSelector
        :view-mode="viewMode"
        :is-internal="isInternal"
        :workspace-name="workspaceName"
        :workspace-meta-page-id="workspaceMetaPageId"
        @update:view-mode="emit('update:viewMode', $event)"
      />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.planning-header {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 0.875rem;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: $white;
  border-radius: 16px;
  border: 1px solid rgba($primary-dark, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  @media (min-width: 1200px) {
    gap: 1.25rem;
    padding: 1.25rem 1.5rem;
  }

  &__top {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    align-items: stretch;
    min-width: 0;

    @media (min-width: 1200px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
  }

  &__main {
    width: 100%;
    min-width: 0;
  }
}
</style>
