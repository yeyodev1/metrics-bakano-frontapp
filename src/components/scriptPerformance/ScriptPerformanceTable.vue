<template>
  <section class="script-table">
    <header class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-table-list" />
        <h3>Guión ↔ Video ↔ Resultados</h3>
      </div>
      <p class="subtitle">Ordenado por {{ metricLabel }}. Los ganadores están marcados.</p>
    </header>

    <div v-if="loading" class="skeleton-wrap">
      <div v-for="i in 5" :key="i" class="skeleton row-skeleton" />
    </div>

    <div v-else-if="!videos.length" class="empty-state">
      <i class="fa-regular fa-file-lines" />
      <p>Sin videos vinculados en este período.</p>
    </div>

    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="col-rank">#</th>
            <th class="col-script">Guión</th>
            <th class="col-tags">Atributos</th>
            <th class="col-value">{{ metricLabel }}</th>
            <th class="col-share">% del total</th>
            <th class="col-link"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(video, index) in videos"
            :key="video.videoItemId"
            :class="{ winner: index < winnersCount }"
          >
            <td class="col-rank">
              <span class="rank">{{ index + 1 }}</span>
              <i v-if="index < winnersCount" class="fa-solid fa-trophy winner-icon" title="Video ganador" />
            </td>
            <td class="col-script">
              <span class="tema">{{ video.tema }}</span>
              <span class="resumen">{{ video.guionResumen }}</span>
              <span v-if="video.measuredAt === 'latest'" class="warn-note">
                Sin histórico de los primeros días — cifra no normalizada
              </span>
            </td>
            <td class="col-tags">
              <span v-if="video.tipoGuion" class="tag">{{ video.tipoGuion }}</span>
              <span v-if="video.objetivo" class="tag">{{ video.objetivo }}</span>
              <span v-if="video.hookType" class="tag tag-hook">{{ video.hookType }}</span>
              <span v-if="!video.tipoGuion && !video.objetivo && !video.hookType" class="tag tag-empty">
                sin clasificar
              </span>
            </td>
            <td class="col-value">
              <strong>{{ formatNumber(video.value) }}</strong>
              <span v-if="video.leadSource === 'proxy'" class="proxy-note" title="Estimado por intención orgánica, no son leads reales de Ads">
                est.
              </span>
            </td>
            <td class="col-share">{{ percent(video.share) }}</td>
            <td class="col-link">
              <a
                v-if="video.igPermalink"
                :href="video.igPermalink"
                target="_blank"
                rel="noopener noreferrer"
                title="Ver publicación"
              >
                <i class="fa-brands fa-instagram" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScoredVideo, PerformanceMetric } from '@/services/scriptPerformance.service'

const props = defineProps<{
  videos: ScoredVideo[]
  winnersCount: number
  metric: PerformanceMetric
  loading?: boolean
}>()

const metricLabel = computed(() => (props.metric === 'views' ? 'Vistas' : 'Leads'))

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 }).format(value)
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
</script>

<style lang="scss" scoped>
.script-table {
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
    color: $BAKANO-GREEN;
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

// Wide content scrolls inside its own container so the page never does.
.table-scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 0.85rem;
}

thead th {
  padding: 0.5rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: $text-secondary;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba($text-secondary, 0.2);
}

tbody td {
  padding: 0.7rem 0.6rem;
  vertical-align: top;
  border-bottom: 1px solid rgba($text-secondary, 0.1);
}

tbody tr.winner {
  background: rgba($primary, 0.04);
}

.col-rank {
  width: 3.5rem;
  white-space: nowrap;
}

.rank {
  font-weight: 600;
  color: $text-secondary;
}

.winner-icon {
  margin-left: 0.3rem;
  font-size: 0.75rem;
  color: $primary;
}

.col-script {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 15rem;
}

.tema {
  font-weight: 600;
  color: $primary-dark;
}

.resumen {
  font-size: 0.78rem;
  line-height: 1.4;
  color: $text-secondary;
}

.warn-note {
  font-size: 0.7rem;
  color: $alert-warning;
}

.col-tags {
  min-width: 9rem;
}

.tag {
  display: inline-block;
  margin: 0 0.25rem 0.25rem 0;
  padding: 0.12rem 0.45rem;
  font-size: 0.7rem;
  color: $secondary-dark;
  background: $overlay-purple;
  border-radius: 4px;
}

.tag-hook {
  color: $primary;
  background: rgba($primary, 0.1);
}

.tag-empty {
  color: $text-secondary;
  background: rgba($text-secondary, 0.12);
}

.col-value {
  white-space: nowrap;

  strong {
    color: $primary-dark;
  }
}

.proxy-note {
  margin-left: 0.3rem;
  font-size: 0.68rem;
  color: $alert-warning;
}

.col-share {
  white-space: nowrap;
  color: $text-secondary;
}

.col-link {
  width: 2.5rem;
  text-align: center;

  a {
    color: $secondary;
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
}

.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.row-skeleton {
  height: 3rem;
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
