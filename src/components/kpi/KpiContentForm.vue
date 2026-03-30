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
  contentClients: props.record?.contentClients ?? 27,
  targetPlans: props.record?.targetPlans ?? 27,
  deliveredPlans: props.record?.deliveredPlans ?? null,
  completePlans20: props.record?.completePlans20 ?? null,
  plansOnTime: props.record?.plansOnTime ?? null,
  postsTarget: props.record?.postsTarget ?? 50,
  postsDelivered: props.record?.postsDelivered ?? null,
  publishRate: props.record?.publishRate ?? null,
})

const volumeRate = computed(() => {
  if (!form.value.targetPlans || form.value.deliveredPlans === null) return null
  return Math.min(1, (form.value.deliveredPlans ?? 0) / form.value.targetPlans)
})
const qualityRate = computed(() => {
  if (!form.value.deliveredPlans || form.value.completePlans20 === null) return null
  return Math.min(1, (form.value.completePlans20 ?? 0) / form.value.deliveredPlans)
})
const punctualityRate = computed(() => {
  if (!form.value.targetPlans || form.value.plansOnTime === null) return null
  return Math.min(1, (form.value.plansOnTime ?? 0) / form.value.targetPlans)
})
const finalScore = computed(() => {
  const v = volumeRate.value ?? 1
  const q = qualityRate.value ?? 1
  const p = punctualityRate.value ?? 1
  return (((v + q + p) / 3) * 100).toFixed(1)
})

function submit() {
  const clean = Object.fromEntries(
    Object.entries(form.value).map(([k, v]) => [k, v === null ? undefined : v])
  )
  emit('save', clean as Partial<TeamKpiRecord>)
}
</script>

<template>
  <div class="kcf">
    <div class="kcf__grid">
      <div class="kcf__field">
        <label>Clientes (Meta Planes)</label>
        <input v-model.number="form.contentClients" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Meta Planes</label>
        <input v-model.number="form.targetPlans" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Planes Entregados (Real)</label>
        <input v-model.number="form.deliveredPlans" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Planes Completos (20 videos)</label>
        <input v-model.number="form.completePlans20" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Planes Entregados a Tiempo</label>
        <input v-model.number="form.plansOnTime" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Meta Posts</label>
        <input v-model.number="form.postsTarget" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>Posts Entregados a Tiempo</label>
        <input v-model.number="form.postsDelivered" type="number" min="0" />
      </div>
      <div class="kcf__field">
        <label>% Publicación Efectiva (0–1)</label>
        <input v-model.number="form.publishRate" type="number" min="0" max="1" step="0.01" />
      </div>
    </div>

    <div class="kcf__preview">
      <div class="kcf__preview-row">
        <span>% Volumen</span>
        <strong>{{ volumeRate !== null ? (volumeRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kcf__preview-row">
        <span>% Calidad (planes completos)</span>
        <strong>{{ qualityRate !== null ? (qualityRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kcf__preview-row">
        <span>% Puntualidad</span>
        <strong>{{ punctualityRate !== null ? (punctualityRate * 100).toFixed(1) + '%' : '—' }}</strong>
      </div>
      <div class="kcf__preview-row kcf__preview-row--total">
        <span>Rendimiento Content</span>
        <strong>{{ finalScore }}%</strong>
      </div>
    </div>

    <div class="kcf__actions">
      <button class="kcf__btn kcf__btn--cancel" type="button" @click="emit('cancel')">Cancelar</button>
      <button class="kcf__btn kcf__btn--save" type="button" :disabled="saving" @click="submit">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kcf {
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
