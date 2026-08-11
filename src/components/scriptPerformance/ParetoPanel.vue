<template>
  <section class="pareto-panel">
    <header class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-chart-simple" />
        <h3>¿Qué videos están trayendo los resultados?</h3>
      </div>

      <div class="metric-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="metric === 'views'"
          :class="{ active: metric === 'views' }"
          @click="$emit('update:metric', 'views')"
        >
          Vistas
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="metric === 'leads'"
          :class="{ active: metric === 'leads' }"
          @click="$emit('update:metric', 'leads')"
        >
          Leads
        </button>
      </div>
    </header>

    <!-- Loading skeleton mirrors the real layout -->
    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton headline-skeleton" />
      <div class="skeleton bar-skeleton" />
      <div class="skeleton chart-skeleton" />
    </div>

    <div v-else-if="!data || !data.totalVideos" class="empty-state">
      <i class="fa-regular fa-chart-bar" />
      <p>Todavía no hay videos vinculados con métricas para este período.</p>
      <span>
        Este panel se llena cuando cada guión queda conectado a la publicación
        que salió de él. Sin ese vínculo no hay nada que comparar.
      </span>
      <button type="button" class="empty-cta" @click="$emit('go-link')">
        <i class="fa-brands fa-instagram" /> Ir a vincular reels
      </button>
    </div>

    <div v-else class="panel-body">
      <!-- The one sentence the team should read -->
      <p class="headline">
        <strong>{{ data.winnersCount }}</strong> de
        <strong>{{ data.totalVideos }}</strong> videos concentran el
        <strong>{{ percent(data.actualShare) }}</strong> de tus {{ metricLabel }}.
      </p>

      <!-- 80/20 split bar -->
      <div class="split-bar" :aria-label="`${percent(data.actualShare)} de ${metricLabel} en ${data.winnersCount} videos`">
        <div class="segment winners" :style="{ flexGrow: Math.max(data.actualShare, 0.02) }">
          <span v-if="data.actualShare > 0.15">{{ percent(data.actualShare) }}</span>
        </div>
        <div class="segment rest" :style="{ flexGrow: Math.max(1 - data.actualShare, 0.02) }">
          <span v-if="1 - data.actualShare > 0.15">{{ percent(1 - data.actualShare) }}</span>
        </div>
      </div>
      <div class="split-legend">
        <span class="legend-item">
          <i class="dot winners-dot" />
          {{ data.winnersCount }} videos ganadores ({{ percent(data.winnersRatio) }} del catálogo)
        </span>
        <span class="legend-item">
          <i class="dot rest-dot" />
          {{ data.totalVideos - data.winnersCount }} videos restantes
        </span>
      </div>

      <!-- Cumulative curve -->
      <div class="chart-wrap">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <!-- Plain-language findings -->
      <ul v-if="data.insights.length" class="insights">
        <li v-for="(insight, i) in data.insights" :key="i">
          <i class="fa-solid fa-circle-info" />
          <span>{{ insight }}</span>
        </li>
      </ul>

      <!-- Never let a proxy pass as a real lead count -->
      <p v-if="metric === 'leads' && data.leadSourceMix" class="lead-source-note">
        <i class="fa-solid fa-triangle-exclamation" />
        {{ data.leadSourceMix.ads }} videos con leads reales de Meta Ads ·
        {{ data.leadSourceMix.proxy }} videos estimados por intención orgánica
        (comentarios, guardados, compartidos, visitas al perfil).
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ParetoResult, PerformanceMetric } from '@/services/scriptPerformance.service'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend)

const props = defineProps<{
  data: ParetoResult | null
  metric: PerformanceMetric
  loading?: boolean
}>()

defineEmits<{
  (e: 'update:metric', value: PerformanceMetric): void
  (e: 'go-link'): void
}>()

const metricLabel = computed(() => (props.metric === 'views' ? 'vistas' : 'leads'))

function percent(value: number): string {
  return `${Math.round((value || 0) * 100)}%`
}

/** Only the head of the distribution is legible; the tail is visual noise. */
const CHART_LIMIT = 15

const chartData = computed(() => {
  const videos = (props.data?.videos ?? []).slice(0, CHART_LIMIT)
  return {
    labels: videos.map(v => `#${v.numero}`),
    datasets: [
      {
        type: 'bar' as const,
        label: props.metric === 'views' ? 'Vistas' : 'Leads',
        data: videos.map(v => v.value),
        backgroundColor: videos.map((_, i) =>
          i < (props.data?.winnersCount ?? 0) ? '#e6285c' : 'rgba(107, 114, 128, 0.35)'
        ),
        borderRadius: 4,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Acumulado',
        data: videos.map(v => Math.round(v.cumulativeShare * 100)),
        borderColor: '#85529c',
        backgroundColor: '#85529c',
        borderWidth: 2,
        pointRadius: 3,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: true, position: 'bottom' as const },
    tooltip: {
      callbacks: {
        afterBody: (items: any[]) => {
          const video = props.data?.videos?.[items[0]?.dataIndex]
          return video ? [video.tema, video.guionResumen] : []
        },
      },
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      position: 'left' as const,
      beginAtZero: true,
      title: { display: true, text: props.metric === 'views' ? 'Vistas' : 'Leads' },
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      beginAtZero: true,
      max: 100,
      grid: { drawOnChartArea: false },
      title: { display: true, text: '% acumulado' },
      ticks: { callback: (v: any) => `${v}%` },
    },
  },
}))
</script>

<style lang="scss" scoped>
.pareto-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: 1.25rem;
  background: $white;
  border: 1px solid rgba($text-secondary, 0.15);
  border-radius: 12px;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: $primary;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: $primary-dark;
  }
}

.metric-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: $primary-light;
  border-radius: 8px;

  button {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    color: $text-secondary;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;

    &.active {
      color: $white;
      background: $primary;
    }
  }
}

.headline {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.5;
  color: $primary-dark;

  strong {
    color: $primary;
  }
}

.split-bar {
  display: flex;
  overflow: hidden;
  height: 2.25rem;
  border-radius: 8px;

  .segment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: $white;
  }

  .winners {
    background: $primary;
  }

  .rest {
    background: rgba($text-secondary, 0.35);
  }
}

.split-legend {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: $text-secondary;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;

  &.winners-dot {
    background: $primary;
  }

  &.rest-dot {
    background: rgba($text-secondary, 0.35);
  }
}

.chart-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 300px;
}

.insights {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
    line-height: 1.45;
    color: $primary-dark;
    background: $alert-info-bg;
    border-radius: 8px;

    i {
      flex-shrink: 0;
      margin-top: 0.15rem;
      color: $alert-info;
    }
  }
}

.lead-source-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: $primary-dark;
  background: $alert-warning-bg;
  border-radius: 8px;

  i {
    flex-shrink: 0;
    margin-top: 0.15rem;
    color: $alert-warning;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
  color: $text-secondary;

  i {
    font-size: 2rem;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-weight: 600;
    color: $primary-dark;
  }

  span {
    max-width: 34rem;
    font-size: 0.85rem;
    line-height: 1.5;
  }
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.4rem;
  padding: 0.6rem 1.1rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: $white;
  background: $primary;
  border: none;
  border-radius: 9px;
  cursor: pointer;

  &:hover { filter: brightness(1.08); }
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba($text-secondary, 0.1) 25%,
    rgba($text-secondary, 0.18) 50%,
    rgba($text-secondary, 0.1) 75%
  );
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.4s infinite;
}

.headline-skeleton {
  height: 1.5rem;
  width: 70%;
}

.bar-skeleton {
  height: 2.25rem;
}

.chart-skeleton {
  height: 300px;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (min-width: 768px) {
  .panel-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .metric-toggle {
    flex: 0 0 auto;
  }

  .split-legend {
    flex-direction: row;
    gap: 1.25rem;
  }
}
</style>
