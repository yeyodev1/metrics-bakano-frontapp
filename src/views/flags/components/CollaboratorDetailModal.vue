<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  flagsService,
  MOTIVO_LABELS,
  type CollaboratorDetail,
  type EtapaRevision,
} from '@/services/flags.service'
import FlagBadge from './FlagBadge.vue'

const props = defineProps<{
  userId: string
  nombre: string
  etapa: EtapaRevision
  from: string
  to: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const detail = ref<CollaboratorDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    detail.value = await flagsService.getCollaboratorDetail(props.userId, {
      etapa: props.etapa,
      from: props.from,
      to: props.to,
    })
  } catch {
    error.value = 'No se pudo cargar la radiografía.'
  } finally {
    loading.value = false
  }
})

function motivoLabel(categoria: string): string {
  return MOTIVO_LABELS[categoria] || categoria
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="radiografia__backdrop" @click.self="emit('close')">
    <div class="radiografia" role="dialog" aria-modal="true">
      <header class="radiografia__header">
        <div>
          <h3 class="radiografia__title">{{ nombre }}</h3>
          <p class="radiografia__subtitle">
            Radiografía de {{ etapa === 'contenido' ? 'guiones' : 'edición' }} del periodo
          </p>
        </div>
        <button type="button" class="radiografia__close" @click="emit('close')" aria-label="Cerrar">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div v-if="loading" class="radiografia__empty">Cargando…</div>
      <div v-else-if="error" class="radiografia__empty">{{ error }}</div>

      <template v-else-if="detail">
        <div class="radiografia__summary">
          <FlagBadge :stats="detail" />
          <span class="radiografia__summary-text">
            {{ detail.total }} entregas evaluadas · {{ detail.aprobados }} aprobadas ·
            {{ detail.rechazados }} rechazadas
          </span>
        </div>

        <section class="radiografia__section">
          <h4 class="radiografia__section-title">Rechazos por cliente</h4>
          <p v-if="detail.porCliente.length === 0" class="radiografia__none">
            Sin rechazos en este periodo. 💪
          </p>
          <ul v-else class="radiografia__bars">
            <li v-for="c in detail.porCliente" :key="c.workspaceId" class="radiografia__bar-row">
              <span class="radiografia__bar-label">{{ c.nombre }}</span>
              <span class="radiografia__bar-track">
                <span
                  class="radiografia__bar-fill"
                  :style="{ width: `${(c.rechazados / detail.porCliente[0].rechazados) * 100}%` }"
                />
              </span>
              <span class="radiografia__bar-count">{{ c.rechazados }}</span>
            </li>
          </ul>
        </section>

        <section class="radiografia__section">
          <h4 class="radiografia__section-title">Motivos principales</h4>
          <p v-if="detail.motivos.length === 0" class="radiografia__none">Sin motivos registrados.</p>
          <ul v-else class="radiografia__motivos">
            <li v-for="m in detail.motivos" :key="m.categoria" class="radiografia__motivo">
              <div class="radiografia__motivo-head">
                <span>{{ motivoLabel(m.categoria) }}</span>
                <strong>{{ m.count }} {{ m.count === 1 ? 'vez' : 'veces' }}</strong>
              </div>
              <p v-if="m.ejemplos.length" class="radiografia__motivo-ejemplo">
                “{{ m.ejemplos[0] }}”
              </p>
            </li>
          </ul>
        </section>

        <section class="radiografia__section">
          <h4 class="radiografia__section-title">Últimas evaluaciones</h4>
          <p v-if="detail.eventosRecientes.length === 0" class="radiografia__none">Sin eventos.</p>
          <ul v-else class="radiografia__eventos">
            <li v-for="(e, i) in detail.eventosRecientes" :key="i" class="radiografia__evento">
              <span
                class="radiografia__evento-dot"
                :class="`radiografia__evento-dot--${e.resultado}`"
              />
              <span class="radiografia__evento-body">
                <span class="radiografia__evento-tema">{{ e.videoTema || 'Sin título' }}</span>
                <span class="radiografia__evento-meta">
                  {{ e.cliente }} · {{ fechaCorta(e.fecha) }}
                  <template v-if="e.fuente === 'cliente'"> · veredicto del cliente</template>
                  <template v-if="e.motivo"> · {{ e.motivo }}</template>
                </span>
              </span>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.radiografia__backdrop {
  position: fixed;
  inset: 0;
  background: rgba($primary-dark, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

.radiografia {
  background: $white;
  border-radius: 14px;
  width: min(560px, 100%);
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.4rem;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__subtitle {
    font-size: 0.82rem;
    color: $text-secondary;
    margin-top: 0.15rem;
  }

  &__close {
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    font-size: 1.1rem;
    padding: 0.25rem;

    &:hover {
      color: $primary-dark;
    }
  }

  &__empty {
    padding: 2.5rem 0;
    text-align: center;
    color: $text-secondary;
  }

  &__summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba($secondary, 0.05);
    border-radius: 10px;
    margin-bottom: 1.1rem;
  }

  &__summary-text {
    font-size: 0.85rem;
    color: $primary-dark;
  }

  &__section {
    margin-bottom: 1.1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-secondary;
    margin-bottom: 0.5rem;
  }

  &__none {
    font-size: 0.85rem;
    color: $text-secondary;
  }

  &__bars {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__bar-row {
    display: grid;
    grid-template-columns: minmax(90px, 160px) 1fr 2rem;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
  }

  &__bar-label {
    color: $primary-dark;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar-track {
    height: 8px;
    background: rgba($primary-dark, 0.06);
    border-radius: 999px;
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    height: 100%;
    background: $alert-error;
    border-radius: 999px;
  }

  &__bar-count {
    text-align: right;
    font-weight: 700;
    color: $alert-error;
  }

  &__motivos {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__motivo {
    border: 1px solid rgba($primary-dark, 0.06);
    border-radius: 10px;
    padding: 0.55rem 0.75rem;
  }

  &__motivo-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.87rem;
    color: $primary-dark;

    strong {
      color: $alert-error;
    }
  }

  &__motivo-ejemplo {
    margin-top: 0.25rem;
    font-size: 0.78rem;
    color: $text-secondary;
    font-style: italic;
  }

  &__eventos {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__evento {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.83rem;
  }

  &__evento-dot {
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-top: 0.35rem;

    &--aprobado {
      background: $alert-success;
    }

    &--rechazado {
      background: $alert-error;
    }
  }

  &__evento-body {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__evento-tema {
    font-weight: 600;
    color: $primary-dark;
  }

  &__evento-meta {
    color: $text-secondary;
    font-size: 0.76rem;
  }
}
</style>
