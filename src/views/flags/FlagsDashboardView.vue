<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  flagsService,
  type ClientFlags,
  type CollaboratorFlags,
} from '@/services/flags.service'
import ClientFlagsTable from './components/ClientFlagsTable.vue'
import CollaboratorLeaderboard from './components/CollaboratorLeaderboard.vue'
import CollaboratorDetailModal from './components/CollaboratorDetailModal.vue'

// ── Periodo: navegación por mes ───────────────────────────────
const hoy = new Date()
const year = ref(hoy.getFullYear())
const month = ref(hoy.getMonth()) // 0-indexed

const esMesActual = computed(
  () => year.value === hoy.getFullYear() && month.value === hoy.getMonth(),
)

const periodoLabel = computed(() =>
  new Date(year.value, month.value, 1).toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
  }),
)

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fromIso = computed(() => isoDate(new Date(year.value, month.value, 1)))
const toIso = computed(() => isoDate(new Date(year.value, month.value + 1, 0)))

function cambiarMes(delta: number) {
  const d = new Date(year.value, month.value + delta, 1)
  if (d > hoy) return
  year.value = d.getFullYear()
  month.value = d.getMonth()
  cargar()
}

// ── Datos ─────────────────────────────────────────────────────
const clientes = ref<ClientFlags[]>([])
const colaboradores = ref<CollaboratorFlags[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function cargar() {
  loading.value = true
  error.value = null
  const periodo = { from: fromIso.value, to: toIso.value }
  try {
    const [cli, col] = await Promise.all([
      flagsService.getClientFlags(periodo),
      flagsService.getCollaboratorFlags(periodo),
    ])
    clientes.value = cli
    colaboradores.value = col
  } catch {
    error.value = 'No se pudieron cargar las banderas. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

// ── Radiografía ───────────────────────────────────────────────
const seleccionado = ref<CollaboratorFlags | null>(null)

function abrirRadiografia(colaborador: CollaboratorFlags) {
  seleccionado.value = colaborador
}
</script>

<template>
  <div class="flags-view">
    <header class="flags-view__header">
      <div>
        <h1 class="flags-view__title">Sistema de Banderas</h1>
        <p class="flags-view__subtitle">
          Rendimiento operativo por cliente y colaborador, según % de aprobación.
        </p>
      </div>

      <div class="flags-view__period">
        <button
          type="button"
          class="flags-view__period-btn"
          aria-label="Mes anterior"
          @click="cambiarMes(-1)"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <span class="flags-view__period-label">{{ periodoLabel }}</span>
        <button
          type="button"
          class="flags-view__period-btn"
          aria-label="Mes siguiente"
          :disabled="esMesActual"
          @click="cambiarMes(1)"
        >
          <i class="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div v-if="error" class="flags-view__error">
      {{ error }}
      <button type="button" class="flags-view__retry" @click="cargar">Reintentar</button>
    </div>

    <div class="flags-view__grid">
      <ClientFlagsTable :clientes="clientes" :loading="loading" />
      <CollaboratorLeaderboard
        :colaboradores="colaboradores"
        :loading="loading"
        @select="abrirRadiografia"
      />
    </div>

    <CollaboratorDetailModal
      v-if="seleccionado && seleccionado.userId"
      :user-id="seleccionado.userId"
      :nombre="seleccionado.nombre"
      :etapa="seleccionado.etapa"
      :from="fromIso"
      :to="toIso"
      @close="seleccionado = null"
    />
  </div>
</template>

<style scoped lang="scss">
.flags-view {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__title {
    font-size: 1.4rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__subtitle {
    font-size: 0.85rem;
    color: $text-secondary;
    margin-top: 0.2rem;
  }

  &__period {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 999px;
    padding: 0.3rem 0.5rem;
  }

  &__period-label {
    font-weight: 700;
    font-size: 0.9rem;
    color: $primary-dark;
    text-transform: capitalize;
    min-width: 8.5rem;
    text-align: center;
  }

  &__period-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: $text-secondary;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background: rgba($secondary, 0.08);
      color: $primary-dark;
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  &__error {
    background: $alert-error-bg;
    color: $alert-error;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__retry {
    background: none;
    border: 1px solid currentColor;
    color: inherit;
    border-radius: 999px;
    padding: 0.25rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    align-items: start;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>
