<script setup lang="ts">
import type { CollaboratorFlags } from '@/services/flags.service'
import FlagBadge from './FlagBadge.vue'

defineProps<{ colaboradores: CollaboratorFlags[]; loading: boolean }>()

const emit = defineEmits<{
  (e: 'select', colaborador: CollaboratorFlags): void
}>()

const ROL_LABELS: Record<string, string> = {
  content: 'Content',
  editor: 'Editor',
}

function entregaLabel(c: CollaboratorFlags): string {
  const unidad = c.rol === 'content' ? 'guiones' : 'videos'
  return `Entregó ${c.total} ${unidad} · ${c.aprobados} aprobados · ${c.rechazados} rechazos`
}
</script>

<template>
  <section class="leaderboard">
    <header class="leaderboard__header">
      <h2 class="leaderboard__title">
        <i class="fa-solid fa-ranking-star" aria-hidden="true" />
        Ranking de colaboradores
      </h2>
      <p class="leaderboard__hint">Clic en un colaborador para ver su radiografía</p>
    </header>

    <div v-if="loading" class="leaderboard__empty">Cargando ranking…</div>
    <div v-else-if="colaboradores.length === 0" class="leaderboard__empty">
      Sin entregas evaluadas en este periodo.
    </div>

    <ol v-else class="leaderboard__list">
      <li v-for="(c, index) in colaboradores" :key="`${c.userId}-${c.etapa}`">
        <button
          type="button"
          class="leaderboard__row"
          :disabled="!c.userId"
          @click="c.userId && emit('select', c)"
        >
          <span class="leaderboard__rank">{{ index + 1 }}</span>
          <span class="leaderboard__who">
            <span class="leaderboard__name">
              {{ c.nombre }}
              <span class="leaderboard__rol">({{ ROL_LABELS[c.rol] || c.rol }})</span>
            </span>
            <span class="leaderboard__detail">{{ entregaLabel(c) }}</span>
          </span>
          <FlagBadge :stats="c" />
          <i v-if="c.userId" class="fa-solid fa-chevron-right leaderboard__chevron" aria-hidden="true" />
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped lang="scss">
.leaderboard {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i {
      color: $primary;
    }
  }

  &__hint {
    font-size: 0.8rem;
    color: $text-secondary;
  }

  &__empty {
    padding: 2rem 0;
    text-align: center;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: rgba($secondary, 0.06);
    }

    &:disabled {
      cursor: default;
    }
  }

  &__rank {
    flex-shrink: 0;
    width: 1.8rem;
    height: 1.8rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba($primary-dark, 0.06);
    color: $primary-dark;
    font-weight: 700;
    font-size: 0.8rem;
  }

  &__who {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  &__name {
    font-weight: 700;
    color: $primary-dark;
    font-size: 0.92rem;
  }

  &__rol {
    font-weight: 500;
    color: $text-secondary;
    font-size: 0.8rem;
  }

  &__detail {
    font-size: 0.78rem;
    color: $text-secondary;
  }

  &__chevron {
    color: $text-secondary;
    font-size: 0.75rem;
  }
}
</style>
