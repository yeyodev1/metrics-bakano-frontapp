<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PlanningCalendar from '@/components/PlanningCalendar.vue'
import { planningService } from '@/services/planning.service'
import { useUserStore } from '@/stores/user'
import type { MonthlyProductionStatus } from '@/types'

const route = useRoute()
const workspaceId = route.params.workspaceId as string

// El builder es material del equipo, no entregable del cliente: mismo criterio
// que el guard de la ruta.
const userStore = useUserStore()
const esInterno = computed(() => userStore.isInternal || userStore.role === 'superadmin')

// ── Producción del mes: cumplida cuando el productor marca el guion como grabado ──
const hoy = new Date()
const mesActual = { year: hoy.getFullYear(), month: hoy.getMonth() + 1 }
const mesTexto = hoy.toLocaleDateString('es-EC', { month: 'long' })
const estadoMes = ref<MonthlyProductionStatus | null>(null)
const cargandoEstado = ref(true)

function fechaCorta(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: 'numeric', month: 'short' })
}

onMounted(async () => {
  try {
    const res = await planningService.monthlyStatus(mesActual)
    estadoMes.value = res.status[workspaceId] ?? { cumplida: false, cumplidaEn: null, producciones: 0, proximaFecha: null, fechaCumplida: null }
  } catch {
    estadoMes.value = null
  } finally {
    cargandoEstado.value = false
  }
})
</script>

<template>
  <div class="workspace-planning">
    <div class="workspace-planning__container">
      <!-- Estado de la producción del mes -->
      <div
        v-if="!cargandoEstado && estadoMes"
        class="workspace-planning__month"
        :class="{
          'workspace-planning__month--done': estadoMes.cumplida,
          'workspace-planning__month--none': !estadoMes.cumplida && estadoMes.producciones === 0,
        }"
      >
        <span class="workspace-planning__month-icon">
          <i :class="estadoMes.cumplida ? 'fa-solid fa-circle-check' : estadoMes.producciones ? 'fa-solid fa-clapperboard' : 'fa-solid fa-calendar-plus'" />
        </span>
        <span class="workspace-planning__month-text">
          <strong>Producción de {{ mesTexto }}: {{ estadoMes.cumplida ? 'cumplida' : estadoMes.producciones ? 'pendiente' : 'sin agendar' }}</strong>
          <span v-if="estadoMes.cumplida">
            Grabada el {{ fechaCorta(estadoMes.fechaCumplida) }}<template v-if="estadoMes.producciones > 1"> · {{ estadoMes.producciones }} producciones este mes</template>.
          </span>
          <span v-else-if="estadoMes.producciones">
            Próxima producción el {{ fechaCorta(estadoMes.proximaFecha) }}. Se marca cumplida cuando el productor pone el guion como grabado.
          </span>
          <span v-else>
            Aún no hay un día de producción agendado para este mes.
          </span>
        </span>
      </div>

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

  &__month {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 1rem;
    padding: 0.8rem 1.1rem;
    border-radius: 14px;
    background: #fffbeb;
    border: 1.5px solid #fcd34d;
    color: #78350f;

    &--done {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
      .workspace-planning__month-icon { background: rgba(#16a34a, 0.12); color: #16a34a; }
    }
    &--none {
      background: $white;
      border-color: rgba($primary-dark, 0.1);
      color: $text-secondary;
      .workspace-planning__month-icon { background: rgba($primary-dark, 0.06); color: $text-secondary; }
    }
  }

  &__month-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: rgba(#d97706, 0.14);
    color: #d97706;
  }

  &__month-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    strong { font-size: 0.9rem; font-weight: 800; text-transform: capitalize; }
    strong::first-letter { text-transform: uppercase; }
    span { font-size: 0.8rem; opacity: 0.9; }
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
