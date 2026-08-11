<template>
  <section class="dimension-breakdown">
    <header class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-layer-group" />
        <h3>¿Qué tipo de guión funciona mejor?</h3>
      </div>
      <p class="subtitle">
        Promedio de {{ metricLabel }} por atributo, comparado contra el promedio de la marca.
      </p>
    </header>

    <div v-if="loading" class="skeleton-wrap">
      <div v-for="i in 4" :key="i" class="skeleton group-skeleton" />
    </div>

    <div v-else-if="!groups.length" class="empty-state">
      <i class="fa-regular fa-rectangle-list" />
      <p>Los guiones aún no están clasificados.</p>
      <span>Clasifica los guiones para ver qué estructura rinde mejor.</span>
    </div>

    <div v-else class="groups">
      <article v-for="group in groups" :key="group.dimension" class="group">
        <h4>{{ labelFor(group.dimension) }}</h4>

        <ul class="bars">
          <li v-for="stat in group.stats" :key="stat.bucket" class="bar-row">
            <div class="bar-head">
              <span class="bucket">{{ prettyBucket(stat.bucket) }}</span>
              <span class="stats">
                <span class="avg">{{ formatNumber(stat.avg) }}</span>
                <span
                  class="lift"
                  :class="{ positive: stat.liftPct > 0, negative: stat.liftPct < 0 }"
                >
                  {{ stat.liftPct > 0 ? '+' : '' }}{{ stat.liftPct }}%
                </span>
                <span
                  v-if="stat.lowConfidence"
                  class="badge-low"
                  :title="`Solo ${stat.n} videos: la muestra es demasiado chica para concluir.`"
                >
                  n={{ stat.n }}
                </span>
                <span v-else class="badge-n">n={{ stat.n }}</span>
              </span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="{ dimmed: stat.lowConfidence }"
                :style="{ width: `${widthFor(stat.avg, group.max)}%` }"
              />
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DimensionStat, PerformanceMetric } from '@/services/scriptPerformance.service'

const props = defineProps<{
  stats: DimensionStat[]
  metric: PerformanceMetric
  loading?: boolean
}>()

const metricLabel = computed(() => (props.metric === 'views' ? 'vistas' : 'leads'))

const DIMENSION_LABELS: Record<string, string> = {
  tipoGuion: 'Etapa del funnel',
  objetivo: 'Feed vs Anuncio',
  hookType: 'Tipo de gancho',
  formato: 'Formato',
  'elemento:testimonio': 'Testimonio',
  'elemento:autoridad': 'Autoridad / metodología',
  'elemento:oferta': 'Oferta concreta',
  'elemento:ctaExplicito': 'CTA explícito',
  'elemento:problemaNecesidad': 'Problema / necesidad',
}

function labelFor(dimension: string): string {
  return DIMENSION_LABELS[dimension] ?? dimension
}

function prettyBucket(bucket: string): string {
  return bucket.charAt(0).toUpperCase() + bucket.slice(1)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 }).format(value)
}

function widthFor(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(2, Math.round((value / max) * 100))
}

const groups = computed(() => {
  const byDimension = new Map<string, DimensionStat[]>()
  for (const stat of props.stats) {
    const list = byDimension.get(stat.dimension) ?? []
    list.push(stat)
    byDimension.set(stat.dimension, list)
  }

  // Preserve the declared order so the funnel stage always reads first.
  return Object.keys(DIMENSION_LABELS)
    .filter(dimension => byDimension.has(dimension))
    .map(dimension => {
      const stats = byDimension.get(dimension)!
      return {
        dimension,
        stats,
        max: Math.max(...stats.map(s => s.avg), 0),
      }
    })
})
</script>

<style lang="scss" scoped>
.dimension-breakdown {
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
  gap: 0.35rem;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: $secondary;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: $primary-dark;
  }
}

.subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: $text-secondary;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  h4 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
}

.bars {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bar-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.bucket {
  color: $primary-dark;
}

.stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avg {
  font-weight: 600;
  color: $primary-dark;
}

.lift {
  font-size: 0.75rem;
  color: $text-secondary;

  &.positive {
    color: $alert-success;
  }

  &.negative {
    color: $alert-error;
  }
}

.badge-n,
.badge-low {
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  border-radius: 4px;
}

.badge-n {
  color: $text-secondary;
  background: rgba($text-secondary, 0.12);
}

.badge-low {
  color: $alert-warning;
  background: $alert-warning-bg;
}

.bar-track {
  width: 100%;
  height: 0.5rem;
  background: rgba($text-secondary, 0.12);
  border-radius: 999px;
}

.bar-fill {
  height: 100%;
  background: $secondary;
  border-radius: 999px;

  &.dimmed {
    background: rgba($secondary, 0.35);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  color: $text-secondary;

  i {
    font-size: 1.8rem;
    opacity: 0.4;
  }

  p {
    margin: 0;
    font-weight: 600;
    color: $primary-dark;
  }

  span {
    font-size: 0.85rem;
  }
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

.group-skeleton {
  height: 5rem;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
