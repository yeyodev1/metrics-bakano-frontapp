<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TeamKpiRecord } from '@/services/teamKpi.service'

const props = defineProps({
  record: {
    type: Object as () => TeamKpiRecord | null,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'save', payload: Partial<TeamKpiRecord>): void
  (e: 'cancel'): void
}>()

const form = ref({
  prodClients: props.record?.prodClients ?? 27,
  targetVisits: props.record?.targetVisits ?? 54,
  completedVisits: props.record?.completedVisits ?? null,
  targetVideosMade: props.record?.targetVideosMade ?? 520,
  videosMade: props.record?.videosMade ?? null,
  onTimeDeliveriesToEditor: props.record?.onTimeDeliveriesToEditor ?? null,
})

const visitsRate = computed(() => {
  if (!form.value.targetVisits || form.value.completedVisits === null) return null
  return Math.min(1, (form.value.completedVisits ?? 0) / form.value.targetVisits)
})
const extractionRate = computed(() => {
  if (!form.value.targetVideosMade || form.value.videosMade === null) return null
  return Math.min(1, (form.value.videosMade ?? 0) / form.value.targetVideosMade)
})
const punctualityRate = computed(() => {
  if (!form.value.targetVideosMade || form.value.onTimeDeliveriesToEditor === null) return null
  return Math.min(1, (form.value.onTimeDeliveriesToEditor ?? 0) / form.value.targetVideosMade)
})
const finalScore = computed(() => {
  const v = visitsRate.value ?? 1
  const e = extractionRate.value ?? 1
  const p = punctualityRate.value ?? 1
  return (((v + e + p) / 3) * 100).toFixed(1)
})

function submit() {
  const clean = Object.fromEntries(
    Object.entries(form.value).map(([k, v]) => [k, v === null ? undefined : v])
  )
  emit('save', clean as Partial<TeamKpiRecord>)
}
</script>

<template>
  <div class="kpf">
    <div class="kpf__grid">
      <div class="kpf__field">
        <label>Clientes Asignados</label>
        <input v-model.number="form.prodClients" type="number" min="0" />
      </div>
      <div class="kpf__field">
        <label>Meta Visitas</label>
        <input v-model.number="form.targetVisits" type="number" min="0" />
      </div>
      <div class="kpf__field">
        <label>Visitas Realizadas (Real)</label>
        <input v-model.number="form.completedVisits" type="number" min="0" />
      </div>
      <div class="kpf__field">
        <label>Meta Videos a Producir</label>
        <input v-model.number="form.targetVideosMade" type="number" min="0" />
      </div>
      <div class="kpf__field">
        <label>Videos Entregados (Real)</label>
        <input v-model.number="form.videosMade" type="number" min="0" />
      </div>
      <div class="kpf__field">
        <label>Entregas a Tiempo al Editor</label>
        <input v-model.number="form.onTimeDeliveriesToEditor" type="number" min="0" />
      </div>
    </div>

    <div class="kpf__preview">
      <div class="kpf__preview-row">
        <span>% Visitas</span>
        <strong>{{ visitsRate !== null ? (visitsRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kpf__preview-row">
        <span>% Extracción Videos</span>
        <strong>{{ extractionRate !== null ? (extractionRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kpf__preview-row">
        <span>% Puntualidad</span>
        <strong>{{ punctualityRate !== null ? (punctualityRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kpf__preview-row kpf__preview-row--total">
        <span>Rendimiento Productor</span>
        <strong>{{ finalScore }}%</strong>
      </div>
    </div>

    <div class="kpf__actions">
      <button class="kpf__btn kpf__btn--cancel" type="button" @click="emit('cancel')">Cancelar</button>
      <button class="kpf__btn kpf__btn--save" type="button" :disabled="saving" @click="submit">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kpf {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
    @media (max-width: 500px) { grid-template-columns: 1fr; }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: $primary-dark;
      opacity: 0.7;
    }
    input {
      padding: 0.55rem 0.75rem;
      border: 1.5px solid rgba($primary-dark, 0.12);
      border-radius: 8px;
      font-size: 0.9rem;
      color: $primary-dark;
      font-family: inherit;
      transition: border-color 0.2s;
      &:focus { outline: none; border-color: $primary; }
    }
  }

  &__preview {
    background: rgba($primary-dark, 0.03);
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__preview-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: $text-secondary;
    strong { color: $primary-dark; }

    &--total {
      padding-top: 0.45rem;
      margin-top: 0.25rem;
      border-top: 1px solid rgba($primary-dark, 0.1);
      font-weight: 700;
      font-size: 0.9rem;
      strong { color: $primary; font-size: 1rem; }
    }
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  &__btn {
    padding: 0.55rem 1.2rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &--cancel {
      background: transparent;
      border: 1.5px solid rgba($primary-dark, 0.15);
      color: $text-secondary;
      &:hover { border-color: rgba($primary-dark, 0.3); color: $primary-dark; }
    }
    &--save {
      background: $primary;
      border: none;
      color: #fff;
      box-shadow: 0 3px 10px rgba($primary, 0.25);
      &:hover:not(:disabled) { filter: brightness(1.08); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}
</style>
