<script setup lang="ts">
import type { StageStats } from '@/services/flags.service'

const props = defineProps<{ stats: StageStats }>()

const EMOJI: Record<string, string> = { verde: '🟢', amarillo: '🟡', rojo: '🔴' }

function emoji(): string {
  return props.stats.flag ? EMOJI[props.stats.flag] : '⚪'
}
</script>

<template>
  <span
    class="flag-badge"
    :class="stats.flag ? `flag-badge--${stats.flag}` : 'flag-badge--empty'"
    :title="
      stats.total > 0
        ? `${stats.aprobados} aprobados / ${stats.rechazados} rechazados`
        : 'Sin decisiones en el periodo'
    "
  >
    <span class="flag-badge__emoji">{{ emoji() }}</span>
    <span v-if="stats.pct !== null" class="flag-badge__pct">{{ stats.pct }}%</span>
    <span v-else class="flag-badge__pct flag-badge__pct--empty">—</span>
  </span>
</template>

<style scoped lang="scss">
.flag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;

  &--verde {
    background: $alert-success-bg;
    color: $alert-success;
  }

  &--amarillo {
    background: $alert-warning-bg;
    color: $alert-warning;
  }

  &--rojo {
    background: $alert-error-bg;
    color: $alert-error;
  }

  &--empty {
    background: rgba($text-secondary, 0.08);
    color: $text-secondary;
  }

  &__pct--empty {
    font-weight: 500;
  }
}
</style>
