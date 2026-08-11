<template>
  <div class="script-performance">
    <header class="section-toolbar">
      <!-- Scope first: month stepper or the whole history, never both at once -->
      <div class="scope">
        <div class="scope__switch" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="!allTime"
            :class="{ 'is-active': !allTime }"
            :disabled="loading"
            @click="allTime = false"
          >
            Por mes
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="allTime"
            :class="{ 'is-active': allTime }"
            :disabled="loading"
            @click="allTime = true"
          >
            Todo el histórico
          </button>
        </div>

        <div v-if="!allTime" class="stepper">
          <button type="button" :disabled="loading" aria-label="Mes anterior" @click="shiftMonth(-1)">
            <i class="fa-solid fa-chevron-left" />
          </button>
          <span class="stepper__label">{{ monthLabel }}</span>
          <button
            type="button"
            :disabled="loading || isCurrentMonth"
            aria-label="Mes siguiente"
            @click="shiftMonth(1)"
          >
            <i class="fa-solid fa-chevron-right" />
          </button>
        </div>

        <span v-else class="scope__note">Todos los videos vinculados hasta hoy</span>
      </div>

      <button
        type="button"
        class="refresh"
        :disabled="loading"
        :aria-label="loading ? 'Actualizando' : 'Actualizar datos'"
        :title="loading ? 'Actualizando…' : 'Actualizar datos'"
        @click="load"
      >
        <i class="fa-solid fa-rotate" :class="{ spinning: loading }" />
      </button>
    </header>

    <p v-if="error" class="error-banner">
      <i class="fa-solid fa-circle-exclamation" />
      {{ error }}
    </p>

    <ParetoPanel
      :data="data"
      :metric="metric"
      :loading="loading"
      @update:metric="setMetric"
      @go-link="$emit('go-link')"
    />

    <DimensionBreakdown
      :stats="data?.byDimension ?? []"
      :metric="metric"
      :loading="loading"
    />

    <WinningPatternsCard
      :workspace-id="workspaceId"
      :metric="metric"
      :month="allTime ? undefined : month"
    />

    <ScriptPerformanceTable
      :videos="data?.videos ?? []"
      :winners-count="data?.winnersCount ?? 0"
      :metric="metric"
      :loading="loading"
    />

    <FeedbackChat :workspace-id="workspaceId" :items="items" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import ParetoPanel from './ParetoPanel.vue'
import DimensionBreakdown from './DimensionBreakdown.vue'
import ScriptPerformanceTable from './ScriptPerformanceTable.vue'
import WinningPatternsCard from './WinningPatternsCard.vue'
import FeedbackChat from './FeedbackChat.vue'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'
import {
  scriptPerformanceService,
  type ParetoResult,
  type PerformanceMetric,
} from '@/services/scriptPerformance.service'

const props = withDefaults(
  defineProps<{ workspaceId: string; items?: WorkspaceVideoItem[] }>(),
  { items: () => [] }
)

defineEmits<{ (e: 'go-link'): void }>()

const data = ref<ParetoResult | null>(null)
const loading = ref(false)
const error = ref('')
const metric = ref<PerformanceMetric>('views')
const allTime = ref(false)

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const month = ref(currentMonth())

const isCurrentMonth = computed(() => month.value >= currentMonth())

const monthLabel = computed(() => {
  if (allTime.value) return 'Todo el histórico'
  const [year, m] = month.value.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)
  const label = date.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function shiftMonth(delta: number) {
  const [year, m] = month.value.split('-').map(Number)
  const date = new Date(year, m - 1 + delta, 1)
  month.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function setMetric(value: PerformanceMetric) {
  metric.value = value
}

async function load() {
  if (!props.workspaceId) return

  loading.value = true
  error.value = ''
  try {
    data.value = await scriptPerformanceService.getWorkspacePerformance(props.workspaceId, {
      metric: metric.value,
      month: allTime.value ? undefined : month.value,
    })
  } catch (err: any) {
    // APIBase rethrows a flat { status, message, data } object, not an AxiosError.
    error.value = err?.message ?? 'No fue posible cargar el rendimiento de los guiones.'
    data.value = null
  } finally {
    loading.value = false
  }
}

watch([metric, month, allTime, () => props.workspaceId], load)

onMounted(load)
</script>

<style lang="scss" scoped>
.script-performance {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.section-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: $white;
  border: 1px solid rgba($text-secondary, 0.15);
  border-radius: 12px;
}

.scope {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.scope__switch {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: $primary-light;
  border-radius: 9px;

  button {
    padding: 0.4rem 0.8rem;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    white-space: nowrap;
    background: transparent;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s;

    &.is-active { color: $white; background: $secondary; }
    &:disabled { cursor: not-allowed; opacity: 0.6; }
  }
}

// Arrows hug the label instead of drifting to the edges of the bar.
.stepper {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem;
  border: 1.5px solid rgba($text-secondary, 0.2);
  border-radius: 9px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    font-size: 0.72rem;
    color: $primary-dark;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: $primary-light; }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }
}

.stepper__label {
  min-width: 8.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: $primary-dark;
  text-align: center;
}

.scope__note {
  font-size: 0.8rem;
  color: $text-secondary;
}

.refresh {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  font-size: 0.85rem;
  color: $secondary;
  background: $overlay-purple;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover:not(:disabled) { filter: brightness(0.95); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.spinning {
  animation: spin 1s linear infinite;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.7rem 0.85rem;
  font-size: 0.85rem;
  color: $alert-error;
  background: $alert-error-bg;
  border-radius: 8px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// On narrow screens the scope block owns the full width so the two controls
// stack cleanly instead of squeezing side by side.
@media (max-width: 560px) {
  .scope,
  .scope__switch,
  .stepper {
    width: 100%;
  }

  .scope__switch button { flex: 1; }
  .stepper__label { flex: 1; }
}
</style>
