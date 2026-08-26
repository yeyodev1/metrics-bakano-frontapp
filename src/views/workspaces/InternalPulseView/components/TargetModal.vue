<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import type { WorkspacePulse } from '@/services/internalPulse.service'
import { money, nombreMes } from '../utils/format'
import { opcionesMes } from '../utils/meses'
import { usePulseMes } from '../usePulseMes'

const props = defineProps<{ pulse: WorkspacePulse; workspaceId: string; guardando: boolean }>()
const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', payload: {
    year: number
    month: number
    targetAmount: number
    stretchAmount?: number
    notes?: string
  }): void
}>()

const monto = ref<number | null>(props.pulse.target?.targetAmount ?? null)
const stretch = ref<number | null>(props.pulse.target?.stretchAmount ?? null)
const notas = ref(props.pulse.target?.notes ?? '')
const error = ref('')

const MESES = opcionesMes()
const { pulseMes, mesElegido, cargando: cargandoMes, errorCarga } = usePulseMes(
  props.workspaceId,
  toRef(props, 'pulse'),
)

// Cada mes trae su propia meta: al cambiar, el formulario muestra la de ese mes.
watch(pulseMes, (p) => {
  monto.value = p.target?.targetAmount ?? null
  stretch.value = p.target?.stretchAmount ?? null
  notas.value = p.target?.notes ?? ''
})

watch(errorCarga, (msg) => { if (msg) error.value = msg })

const periodo = computed(() => `${nombreMes(pulseMes.value.period.month)} ${pulseMes.value.period.year}`)

/** Lo que tendría que entrar por día si la meta se acepta tal cual. */
const porDia = computed(() =>
  monto.value && pulseMes.value.period.daysInMonth
    ? monto.value / pulseMes.value.period.daysInMonth
    : 0,
)

const faltaDesdeHoy = computed(() => {
  if (!monto.value) return 0
  const restantes = pulseMes.value.period.remainingDays || 1
  return Math.max(monto.value - pulseMes.value.totals.billed, 0) / restantes
})

/** Un mes que aún no empezó no tiene días corridos: solo aplica el por día. */
const mesEnCurso = computed(() => pulseMes.value.period.elapsedDays > 0)

const sugerencias = computed(() => {
  const opciones: { label: string; valor: number; nota: string }[] = []
  const anterior = pulseMes.value.suggestedTarget
  if (anterior) {
    opciones.push({ label: 'Repetir última meta', valor: anterior.targetAmount, nota: anterior.fromLabel })
    opciones.push({
      label: '+10% sobre la última',
      valor: Math.round(anterior.targetAmount * 1.1),
      nota: 'crecimiento moderado',
    })
  }
  if (pulseMes.value.progress.projection > 0) {
    opciones.push({
      label: 'Proyección de este mes',
      valor: Math.round(pulseMes.value.progress.projection),
      nota: 'al ritmo actual',
    })
  }
  return opciones
})

function aplicar(valor: number) {
  monto.value = valor
  error.value = ''
}

function guardar() {
  if (!monto.value || monto.value <= 0) {
    error.value = 'Escribe una meta mayor a 0.'
    return
  }
  if (stretch.value && stretch.value < monto.value) {
    error.value = 'La meta ambiciosa no puede ser menor que la meta base.'
    return
  }
  emit('guardar', {
    year: pulseMes.value.period.year,
    month: pulseMes.value.period.month,
    targetAmount: monto.value,
    stretchAmount: stretch.value ?? undefined,
    notes: notas.value.trim() || undefined,
  })
}
</script>

<template>
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="tituloMeta" @click.self="emit('cerrar')">
    <div class="modal__card">
      <header class="modal__head">
        <div>
          <p class="modal__eyebrow">{{ pulse.workspace.name }} · {{ periodo }}</p>
          <h2 id="tituloMeta" class="modal__title">
            {{ pulseMes.target ? 'Ajustar meta mensual' : 'Definir meta mensual' }}
          </h2>
        </div>
        <button type="button" class="modal__close" aria-label="Cerrar" @click="emit('cerrar')">
          <i class="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <div class="modal__body">
        <p class="modal__label">Mes de la meta</p>
        <SearchableSelect
          v-model="mesElegido"
          :opciones="MESES.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))"
          :disabled="cargandoMes || guardando"
          placeholder="Elige el mes"
        />
        <p v-if="cargandoMes" class="modal__cargando">
          <i class="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Cargando {{ periodo }}…
        </p>
        <p v-else-if="pulseMes.target" class="modal__ya-tiene">
          <i class="fa-solid fa-circle-info" aria-hidden="true" />
          {{ periodo }} ya tiene meta de {{ money(pulseMes.target.targetAmount, true) }}. Guardar la reemplaza.
        </p>

        <label class="modal__label" for="metaMonto">Meta de facturación del mes</label>
        <div class="modal__input-wrap">
          <span>$</span>
          <input
            id="metaMonto"
            v-model.number="monto"
            type="number"
            min="0"
            step="100"
            inputmode="decimal"
            placeholder="0.00"
            @input="error = ''"
          />
        </div>

        <div v-if="sugerencias.length" class="modal__chips">
          <button v-for="s in sugerencias" :key="s.label" type="button" class="modal__chip" @click="aplicar(s.valor)">
            <strong>{{ s.label }}</strong>
            <span>{{ money(s.valor, true) }} · {{ s.nota }}</span>
          </button>
        </div>

        <div v-if="monto" class="modal__calc">
          <div>
            <p class="modal__calc-label">Por día del mes</p>
            <p class="modal__calc-value">{{ money(porDia, true) }}</p>
          </div>
          <!-- Un mes que todavía no arranca no tiene días corridos ni facturación. -->
          <div v-if="mesEnCurso">
            <p class="modal__calc-label">Por día restante</p>
            <p class="modal__calc-value">{{ money(faltaDesdeHoy, true) }}</p>
          </div>
          <div v-if="mesEnCurso">
            <p class="modal__calc-label">Ya facturado</p>
            <p class="modal__calc-value">{{ money(pulseMes.totals.billed, true) }}</p>
          </div>
        </div>

        <label class="modal__label" for="metaStretch">Meta ambiciosa (opcional)</label>
        <div class="modal__input-wrap">
          <span>$</span>
          <input
            id="metaStretch"
            v-model.number="stretch"
            type="number"
            min="0"
            step="100"
            inputmode="decimal"
            placeholder="Sin meta ambiciosa"
            @input="error = ''"
          />
        </div>

        <label class="modal__label" for="metaNotas">Nota para el equipo (opcional)</label>
        <textarea
          id="metaNotas"
          v-model="notas"
          class="modal__textarea"
          rows="2"
          placeholder="Por qué esta meta: temporada, campaña nueva, acuerdo con el cliente…"
        />

        <p v-if="error" class="modal__error">{{ error }}</p>
      </div>

      <footer class="modal__foot">
        <button type="button" class="modal__ghost" @click="emit('cerrar')">Cancelar</button>
        <button type="button" class="modal__save" :disabled="guardando || cargandoMes" @click="guardar">
          {{ guardando ? 'Guardando…' : `Guardar meta de ${periodo}` }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(25, 20, 35, 0.55);
  backdrop-filter: blur(3px);
}

.modal__card {
  width: min(520px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 20px;
  background: $white;
  box-shadow: 0 24px 60px rgba(25, 20, 35, 0.3);
}

.modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem 0.75rem;
}

.modal__eyebrow {
  margin: 0;
  color: $primary;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.modal__title { margin: 0.25rem 0 0; color: $primary-dark; font-size: 1.2rem; font-weight: 800; }

.modal__close {
  border: 0;
  border-radius: 9px;
  padding: 0.4rem 0.55rem;
  background: #f4f2f8;
  color: $text-secondary;
  cursor: pointer;
}

.modal__body { padding: 0.5rem 1.5rem 1rem; }

.modal__label {
  display: block;
  margin: 1rem 0 0.35rem;
  color: $primary-dark;
  font-size: 0.78rem;
  font-weight: 700;
}

.modal__input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid #e2dfe9;
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  background: #fbfafd;

  &:focus-within { border-color: $primary; background: $white; }

  span { color: $text-secondary; font-weight: 800; }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: $primary-dark;
    font: inherit;
    font-size: 1.1rem;
    font-weight: 800;
    outline: none;
  }
}

.modal__chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.6rem; }

.modal__chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  border: 1px solid #e2dfe9;
  border-radius: 10px;
  padding: 0.45rem 0.7rem;
  background: $white;
  cursor: pointer;
  text-align: left;

  &:hover { border-color: $primary; background: rgba($primary, 0.04); }

  strong { color: $primary-dark; font-size: 0.75rem; font-weight: 800; }
  span { color: $text-secondary; font-size: 0.7rem; }
}

.modal__calc {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.85rem;
  border-radius: 12px;
  padding: 0.75rem;
  background: linear-gradient(110deg, rgba($primary, 0.07), rgba($secondary, 0.07));
}

.modal__calc-label { margin: 0; color: $text-secondary; font-size: 0.66rem; font-weight: 700; text-transform: uppercase; }
.modal__calc-value { margin: 0.15rem 0 0; color: $primary-dark; font-size: 0.95rem; font-weight: 800; }

.modal__textarea {
  width: 100%;
  border: 1.5px solid #e2dfe9;
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  background: #fbfafd;
  color: $primary-dark;
  font: inherit;
  font-size: 0.85rem;
  resize: vertical;
  outline: none;

  &:focus { border-color: $primary; background: $white; }
}

.modal__error { margin: 0.7rem 0 0; color: $alert-error; font-size: 0.8rem; font-weight: 700; }

.modal__cargando,
.modal__ya-tiene {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: $text-secondary;
}

.modal__ya-tiene {
  padding: 0.5rem 0.65rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.75rem 1.5rem 1.35rem;
}

.modal__ghost,
.modal__save {
  border-radius: 11px;
  padding: 0.7rem 1.2rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
}

.modal__ghost { border: 1px solid #e2dfe9; background: $white; color: $text-secondary; }

.modal__save {
  border: 0;
  background: $primary;
  color: $white;

  &:disabled { opacity: 0.65; cursor: wait; }
}
</style>
