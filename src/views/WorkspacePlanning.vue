<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const workspaceId = route.params.workspaceId as string

// El builder es material del equipo, no entregable del cliente: mismo criterio
// que el guard de la ruta.
const userStore = useUserStore()
const esInterno = computed(() => userStore.isInternal || userStore.role === 'superadmin')
</script>

<template>
  <div class="workspace-planning">
    <div class="workspace-planning__container">
      <!-- El puente que faltaba: desde el calendario se llega a los guiones de
           lo agendado, en vez de tener que adivinar que viven en otra sección. -->
      <RouterLink
        v-if="esInterno"
        class="workspace-planning__builder"
        :to="{ name: 'WorkspaceContentBuilder', params: { workspaceId } }"
      >
        <span class="workspace-planning__builder-icon">
          <i class="fa-solid fa-wand-magic-sparkles" />
        </span>
        <span class="workspace-planning__builder-text">
          <strong>Guiones de esta planificación <em>PRO</em></strong>
          <span>Cada video agendado aquí tiene su guion allá: escríbelos, vincúlalos con el Reel y mira cuáles funcionan.</span>
        </span>
        <i class="fa-solid fa-arrow-right" />
      </RouterLink>

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

  &__builder {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1.25rem;
    padding: 0.9rem 1.1rem;
    text-decoration: none;
    background: $white;
    border: 1.5px solid rgba($secondary, 0.25);
    border-radius: 14px;
    transition: border-color 0.15s ease, transform 0.15s ease;

    &:hover { border-color: $secondary; transform: translateY(-1px); }

    > i:last-child { color: $secondary-dark; font-size: 0.85rem; }
  }

  &__builder-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: $overlay-purple;
    color: $secondary-dark;
  }

  &__builder-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;

    strong {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.92rem;
      font-weight: 800;
      color: $primary-dark;
    }

    em {
      font-style: normal;
      padding: 0.1rem 0.35rem;
      font-size: 0.6rem;
      font-weight: 800;
      color: $white;
      background: $secondary;
      border-radius: 4px;
    }

    > span { font-size: 0.8rem; color: $text-secondary; line-height: 1.45; }
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
