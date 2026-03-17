<script setup lang="ts">
import { useRoute } from 'vue-router'
import PlanningCalendar from '@/components/PlanningCalendar.vue'

const route = useRoute()
const workspaceId = route.params.workspaceId as string
</script>

<template>
  <div class="workspace-planning">
    <div class="workspace-planning__container">
      <PlanningCalendar :workspaceId="workspaceId" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.workspace-planning {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

  &__container {
    animation: fadeIn 0.5s ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .workspace-planning {
    padding: 1rem;
  }
}
</style>
