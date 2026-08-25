<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import {
  internalPulseService,
  type WorkspacePulse,
  type TargetHistoryRow,
} from '@/services/internalPulse.service'
import { nombreMes } from './utils/format'

import PulseHero from './components/PulseHero.vue'
import PulseStats from './components/PulseStats.vue'
import PulseTrack from './components/PulseTrack.vue'
import PulseAlerts from './components/PulseAlerts.vue'
import PulseTeam from './components/PulseTeam.vue'
import PulseHistory from './components/PulseHistory.vue'
import TargetModal from './components/TargetModal.vue'

const route = useRoute()
const toast = useToast()
const workspaceId = route.params.workspaceId as string

// El mes se calcula en Ecuador: en la madrugada UTC el navegador del equipo ya
// estaría mostrando el mes siguiente y el tablero abriría vacío.
const ahoraEc = new Date(Date.now() - 5 * 60 * 60 * 1000)
const year = ref(ahoraEc.getUTCFullYear())
const month = ref(ahoraEc.getUTCMonth() + 1)

const pulse = ref<WorkspacePulse | null>(null)
const history = ref<TargetHistoryRow[]>([])
const cargando = ref(true)
const errorCarga = ref('')
const modalAbierto = ref(false)
const guardando = ref(false)
const recordando = ref(false)

const periodoLabel = computed(() => `${nombreMes(month.value)} ${year.value}`)

const mesesDisponibles = computed(() => {
  // Seis meses hacia atrás: suficiente para revisar cierres sin volver la barra
  // un menú infinito.
  const opciones: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(ahoraEc.getUTCFullYear(), ahoraEc.getUTCMonth() - i, 1))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    opciones.push({ year: y, month: m, label: `${nombreMes(m)} ${y}` })
  }
  return opciones
})

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [datos, hist] = await Promise.all([
      internalPulseService.getWorkspacePulse(workspaceId, year.value, month.value),
      internalPulseService.getHistory(workspaceId, 6),
    ])
    pulse.value = datos
    history.value = hist
  } catch (error: any) {
    errorCarga.value = error?.message || 'No se pudo cargar el pulso del cliente.'
  } finally {
    cargando.value = false
  }
}

function cambiarPeriodo(valor: string) {
  const [y, m] = valor.split('-').map(Number)
  year.value = y
  month.value = m
}

async function guardarMeta(payload: { targetAmount: number; stretchAmount?: number; notes?: string }) {
  guardando.value = true
  try {
    await internalPulseService.setTarget(workspaceId, {
      year: year.value,
      month: month.value,
      ...payload,
    })
    modalAbierto.value = false
    toast.success(`Meta de ${periodoLabel.value} guardada.`, 'Listo')
    await cargar()
  } catch (error: any) {
    toast.error(error?.message || 'No se pudo guardar la meta.', 'Error')
  } finally {
    guardando.value = false
  }
}

async function recordarEquipo() {
  recordando.value = true
  try {
    const res = await internalPulseService.remindTeam(workspaceId)
    toast.success(res.message, 'Recordatorio')
  } catch (error: any) {
    toast.error(error?.message || 'No se pudo enviar el recordatorio.', 'Error')
  } finally {
    recordando.value = false
  }
}

watch([year, month], cargar)
onMounted(cargar)
</script>

<template>
  <div class="pulse-view">
    <div class="pulse-view__bar">
      <div class="pulse-view__bar-info">
        <span class="pulse-view__tag">Interno</span>
        <p>
          Lo ve todo el equipo de Bakano — el cliente no lo tiene en su menú.
          Cualquiera del equipo puede definir o ajustar la meta.
        </p>
      </div>
      <label class="pulse-view__period">
        <span>Periodo</span>
        <select :value="`${year}-${month}`" @change="cambiarPeriodo(($event.target as HTMLSelectElement).value)">
          <option v-for="op in mesesDisponibles" :key="`${op.year}-${op.month}`" :value="`${op.year}-${op.month}`">
            {{ op.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="cargando" class="pulse-view__skeleton">
      <div class="pulse-view__sk pulse-view__sk--hero" />
      <div class="pulse-view__sk-grid">
        <div v-for="n in 6" :key="n" class="pulse-view__sk pulse-view__sk--card" />
      </div>
      <div class="pulse-view__sk pulse-view__sk--chart" />
    </div>

    <div v-else-if="errorCarga" class="pulse-view__error">
      <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      <p>{{ errorCarga }}</p>
      <button type="button" @click="cargar">Reintentar</button>
    </div>

    <template v-else-if="pulse">
      <PulseHero
        :pulse="pulse"
        :recordando="recordando"
        @definir-meta="modalAbierto = true"
        @recordar="recordarEquipo"
      />

      <PulseStats :pulse="pulse" />

      <PulseTrack
        class="pulse-view__block"
        :days="pulse.days"
        :target-amount="pulse.target?.targetAmount ?? 0"
        :days-in-month="pulse.period.daysInMonth"
      />

      <div class="pulse-view__cols">
        <PulseAlerts :alerts="pulse.alerts" :missing-days="pulse.discipline.missingDays" />
        <PulseTeam :team="pulse.team" :billed="pulse.totals.billed" />
      </div>

      <PulseHistory v-if="history.length" class="pulse-view__block" :history="history" />

      <p v-if="pulse.target" class="pulse-view__footnote">
        Última edición de la meta: {{ pulse.target.setBy?.name ?? 'el equipo' }}
        <template v-if="pulse.target.notes"> · “{{ pulse.target.notes }}”</template>
      </p>

      <TargetModal
        v-if="modalAbierto"
        :pulse="pulse"
        :guardando="guardando"
        @cerrar="modalAbierto = false"
        @guardar="guardarMeta"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.pulse-view {
  padding: 16px 16px 80px;
  width: 100%;
  max-width: 1280px;

  @media (min-width: 640px) { padding: 28px 32px 80px; }
}

.pulse-view__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.pulse-view__bar-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;

  p { margin: 0; color: $text-secondary; font-size: 0.8rem; }
}

.pulse-view__tag {
  border-radius: 7px;
  padding: 0.25rem 0.5rem;
  background: rgba($secondary, 0.12);
  color: $secondary-dark;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pulse-view__period {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: $text-secondary;
  font-size: 0.76rem;
  font-weight: 700;

  select {
    border: 1px solid #e2dfe9;
    border-radius: 10px;
    padding: 0.5rem 0.7rem;
    background: $white;
    color: $primary-dark;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }
}

.pulse-view__block { margin-top: 1.25rem; }

.pulse-view__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.25rem;

  @media (max-width: 960px) { grid-template-columns: 1fr; }
}

.pulse-view__footnote { margin: 1rem 0 0; color: $text-secondary; font-size: 0.76rem; }

.pulse-view__skeleton { display: grid; gap: 1.1rem; }

.pulse-view__sk {
  border-radius: 18px;
  background: linear-gradient(100deg, #f1eff5 30%, #f8f7fb 50%, #f1eff5 70%);
  background-size: 220% 100%;
  animation: pulseShimmer 1.4s infinite linear;

  &--hero { height: 240px; }
  &--card { height: 92px; }
  &--chart { height: 280px; }
}

.pulse-view__sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.9rem; }

@keyframes pulseShimmer {
  from { background-position: 200% 0; }
  to { background-position: -20% 0; }
}

.pulse-view__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #f3d8de;
  border-radius: 18px;
  padding: 2.5rem 1.5rem;
  background: #fff8f9;
  text-align: center;

  i { color: $primary; font-size: 1.5rem; }
  p { margin: 0; color: $primary-dark; font-size: 0.9rem; font-weight: 600; }

  button {
    border: 0;
    border-radius: 10px;
    padding: 0.6rem 1.1rem;
    background: $primary;
    color: $white;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
  }
}
</style>
