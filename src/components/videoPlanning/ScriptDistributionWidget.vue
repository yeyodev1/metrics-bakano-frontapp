<script setup lang="ts">
import { computed } from 'vue'
import type { VideoItem, TipoGuion } from '@/types/videoPlanning'

/**
 * Target mix for ONE monthly planning: 10 TOFU · 5 MOFU · 5 BOFU = 20 videos.
 *
 * It only means something within a single planning. Across a whole workspace
 * the counts blow past it ("74/10"), which reads as a bug — so callers working
 * at workspace level pass `showTargets: false` and get plain proportions.
 */
const TARGETS: Record<TipoGuion, number> = { TOFU: 10, MOFU: 5, BOFU: 5 }

const TIPO_CONFIG: Record<TipoGuion, { label: string; shortLabel: string; icon: string; color: string; desc: string }> = {
  TOFU: {
    label: 'Educativo',
    shortLabel: 'Edu',
    icon: 'fa-solid fa-lightbulb',
    color: '#3b82f6',
    desc: 'Top of Funnel — alcance y viralidad. Ganchos, derribo de mitos, educación rápida.',
  },
  MOFU: {
    label: 'Creación de Valor',
    shortLabel: 'Valor',
    icon: 'fa-solid fa-heart-pulse',
    color: '#8b5cf6',
    desc: 'Middle of Funnel — confianza. El usuario identifica su problema y tú eres el experto.',
  },
  BOFU: {
    label: 'Venta',
    shortLabel: 'Venta',
    icon: 'fa-solid fa-fire',
    color: '#ef4444',
    desc: 'Bottom of Funnel — venta directa. CTA claros hacia WhatsApp o agenda.',
  },
}

const TYPES: TipoGuion[] = ['TOFU', 'MOFU', 'BOFU']

const props = withDefaults(
  defineProps<{
    items: VideoItem[]
    compact?: boolean
    /** Off when the items span several plannings — the monthly goal makes no sense there. */
    showTargets?: boolean
  }>(),
  { showTargets: true }
)

const counts = computed(() => {
  const c: Record<TipoGuion, number> = { TOFU: 0, MOFU: 0, BOFU: 0 }
  for (const item of props.items) {
    if (item.tipoGuion && item._id) {
      c[item.tipoGuion]++
    }
  }
  return c
})

const totalAssigned = computed(() => counts.value.TOFU + counts.value.MOFU + counts.value.BOFU)
const totalTarget = 20

/** Share of the classified scripts, used when there is no monthly goal. */
function share(t: TipoGuion) {
  return totalAssigned.value ? Math.round((counts.value[t] / totalAssigned.value) * 100) : 0
}
</script>

<template>
  <!-- ── Compact mode (inside modal / panel) ── -->
  <div v-if="compact" class="sdw-compact">
    <span class="sdw-compact__label">
      <i class="fa-solid fa-chart-simple" />
      Distribución
    </span>
    <div class="sdw-compact__pills">
      <span
        v-for="t in TYPES"
        :key="t"
        class="sdw-compact__pill"
        :class="{ 'is-complete': showTargets && counts[t] >= TARGETS[t] }"
        :style="{ '--pill-color': TIPO_CONFIG[t].color }"
        :title="TIPO_CONFIG[t].desc"
      >
        <i :class="TIPO_CONFIG[t].icon" />
        {{ TIPO_CONFIG[t].shortLabel }}
        <strong v-if="showTargets">{{ counts[t] }}/{{ TARGETS[t] }}</strong>
        <strong v-else>{{ counts[t] }} · {{ share(t) }}%</strong>
      </span>
    </div>
  </div>

  <!-- ── Full mode (main view) ── -->
  <div v-else class="sdw">
    <div class="sdw__header">
      <div class="sdw__header-left">
        <i class="fa-solid fa-chart-gantt sdw__icon" />
        <span class="sdw__title">Distribución de guiones</span>
        <span class="sdw__subtitle">10 TOFU · 5 MOFU · 5 BOFU</span>
      </div>
      <div class="sdw__total">
        <span class="sdw__total-num">{{ totalAssigned }}/{{ totalTarget }}</span>
        <span class="sdw__total-label">asignados</span>
      </div>
    </div>

    <div class="sdw__rows">
      <div v-for="t in TYPES" :key="t" class="sdw__row">
        <div class="sdw__row-info">
          <span class="sdw__row-icon" :style="{ color: TIPO_CONFIG[t].color }">
            <i :class="TIPO_CONFIG[t].icon" />
          </span>
          <div class="sdw__row-text">
            <span class="sdw__row-label">{{ TIPO_CONFIG[t].label }}</span>
            <span class="sdw__row-stage">{{ t }}</span>
          </div>
        </div>
        <div class="sdw__bar-wrap">
          <div class="sdw__bar">
            <div
              class="sdw__bar-fill"
              :style="{
                width: Math.min((counts[t] / TARGETS[t]) * 100, 100) + '%',
                background: TIPO_CONFIG[t].color,
              }"
            />
          </div>
          <span
            class="sdw__bar-count"
            :class="{ 'is-complete': counts[t] >= TARGETS[t] }"
            :style="counts[t] >= TARGETS[t] ? { color: TIPO_CONFIG[t].color } : {}"
          >
            {{ counts[t] }}/{{ TARGETS[t] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ── Compact ──────────────────────────────────────────────────────────
.sdw-compact {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;

  &__label {
    font-size: 0.68rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;

    i { font-size: 0.65rem; }
  }

  &__pills {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.55rem;
    border-radius: 20px;
    font-size: 0.68rem;
    font-weight: 600;
    background: rgba(var(--pill-color), 0.08);
    color: var(--pill-color);
    border: 1px solid color-mix(in srgb, var(--pill-color) 25%, transparent);
    cursor: default;
    transition: all 0.15s;

    i { font-size: 0.62rem; }
    strong { font-weight: 800; }

    &.is-complete {
      background: color-mix(in srgb, var(--pill-color) 12%, transparent);
      border-color: var(--pill-color);
    }
  }
}

// ── Full ─────────────────────────────────────────────────────────────
.sdw {
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.07);
  border-radius: 16px;
  padding: 1.1rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  &__icon {
    font-size: 1rem;
    color: $primary;
  }

  &__title {
    font-size: 0.85rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__subtitle {
    font-size: 0.7rem;
    color: $text-secondary;
    font-weight: 500;

    @media (max-width: 480px) { display: none; }
  }

  &__total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  &__total-num {
    font-size: 1rem;
    font-weight: 900;
    color: $primary-dark;
    line-height: 1.1;
  }

  &__total-label {
    font-size: 0.62rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    @media (max-width: 480px) {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }

  &__row-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 145px;
    flex-shrink: 0;
  }

  &__row-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: currentColor;
    opacity: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      color: $white;
      font-size: 0.72rem;
    }
  }

  &__row-text {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  &__row-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: $primary-dark;
    line-height: 1.2;
  }

  &__row-stage {
    font-size: 0.62rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  &__bar-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  &__bar {
    flex: 1;
    height: 6px;
    background: rgba($primary-dark, 0.07);
    border-radius: 99px;
    overflow: hidden;
    min-width: 60px;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__bar-count {
    font-size: 0.75rem;
    font-weight: 700;
    color: $text-secondary;
    white-space: nowrap;
    min-width: 32px;
    text-align: right;

    &.is-complete {
      font-weight: 900;
    }
  }
}
</style>
