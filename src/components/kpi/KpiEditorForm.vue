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
  workingDays: props.record?.workingDays ?? 20,
  targetVideos: props.record?.targetVideos ?? 240,
  deliveredVideos: props.record?.deliveredVideos ?? null,
  returnedVideos: props.record?.returnedVideos ?? null,
  approvedFirstPass: props.record?.approvedFirstPass ?? null,
  urgencies: props.record?.urgencies ?? null,
  urgenciesOnTime: props.record?.urgenciesOnTime ?? null,
})

// Live preview
const productivity = computed(() => {
  if (!form.value.targetVideos || !form.value.deliveredVideos) return null
  return Math.min(1, form.value.deliveredVideos / form.value.targetVideos)
})
const quality = computed(() => {
  if (!form.value.deliveredVideos || !form.value.approvedFirstPass) return null
  return Math.min(1, form.value.approvedFirstPass / form.value.deliveredVideos)
})
const sla = computed(() => {
  if (!form.value.urgencies || !form.value.urgenciesOnTime) return null
  return Math.min(1, form.value.urgenciesOnTime / form.value.urgencies)
})
const finalScore = computed(() => {
  const p = productivity.value ?? 1
  const q = quality.value ?? 1
  const s = sla.value ?? 1
  return (p * q * s * 100).toFixed(1)
})

function submit() {
  const clean = Object.fromEntries(
    Object.entries(form.value).map(([k, v]) => [k, v === null ? undefined : v])
  )
  emit('save', clean as Partial<TeamKpiRecord>)
}
</script>

<template>
  <div class="kef">
    <div class="kef__grid">
      <!-- Working Days -->
      <div class="kef__field">
        <label>Días Hábiles</label>
        <input v-model.number="form.workingDays" type="number" min="1" max="31" />
      </div>

      <!-- Target Videos -->
      <div class="kef__field">
        <label>Meta Mensual Videos</label>
        <input v-model.number="form.targetVideos" type="number" min="0" />
      </div>

      <!-- Delivered Videos -->
      <div class="kef__field">
        <label>Videos Entregados (Real)</label>
        <input v-model.number="form.deliveredVideos" type="number" min="0" />
      </div>

      <!-- Returned Videos -->
      <div class="kef__field">
        <label>Videos Devueltos (Errores)</label>
        <input v-model.number="form.returnedVideos" type="number" min="0" />
      </div>

      <!-- Approved First Pass -->
      <div class="kef__field">
        <label>Videos Aprobados a la 1ra</label>
        <input v-model.number="form.approvedFirstPass" type="number" min="0" />
      </div>

      <!-- Urgencies -->
      <div class="kef__field">
        <label>Urgencias Asignadas</label>
        <input v-model.number="form.urgencies" type="number" min="0" />
      </div>

      <!-- Urgencies on Time -->
      <div class="kef__field">
        <label>Urgencias a Tiempo</label>
        <input v-model.number="form.urgenciesOnTime" type="number" min="0" />
      </div>
    </div>

    <!-- Live preview -->
    <div class="kef__preview">
      <div class="kef__preview-row">
        <span>% Productividad</span>
        <strong>{{ productivity !== null ? (productivity * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kef__preview-row">
        <span>% Calidad</span>
        <strong>{{ quality !== null ? (quality * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kef__preview-row">
        <span>% SLA Urgencias</span>
        <strong>{{ sla !== null ? (sla * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kef__preview-row kef__preview-row--total">
        <span>Rendimiento Final</span>
        <strong>{{ finalScore }}%</strong>
      </div>
    </div>

    <div class="kef__actions">
      <button class="kef__btn kef__btn--cancel" type="button" @click="emit('cancel')">Cancelar</button>
      <button class="kef__btn kef__btn--save" type="button" :disabled="saving" @click="submit">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kef {
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
      color: $primary-dark;
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
