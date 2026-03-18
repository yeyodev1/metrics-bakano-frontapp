<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'
import { ClienteAprobacion } from '@/types/videoPlanning'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  items: VideoItem[]
  approvals: Record<string, ClienteAprobacion>
  rejections: Record<string, string>
  locked: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'update-approval', itemId: string, value: ClienteAprobacion): void
  (e: 'update-rejection', itemId: string, reason: string): void
  (e: 'submit'): void
}>()

const confirmed = ref(false)
const holdProgress = ref(0)
let holdInterval: ReturnType<typeof setInterval> | null = null

const reviewed = computed(() =>
  props.items.filter(i => props.approvals[i._id] && props.approvals[i._id] !== ClienteAprobacion.PENDIENTE).length
)

const allReviewed = computed(() => reviewed.value === props.items.length && props.items.length > 0)

const canHold = computed(() => allReviewed.value && confirmed.value && !props.locked && !props.isSaving)

function startHold() {
  if (!canHold.value) return
  holdProgress.value = 0
  holdInterval = setInterval(() => {
    holdProgress.value += 100 / 30
    if (holdProgress.value >= 100) {
      stopHold()
      emit('submit')
    }
  }, 100)
}

function stopHold() {
  if (holdInterval) {
    clearInterval(holdInterval)
    holdInterval = null
  }
  holdProgress.value = 0
}

const circumference = 2 * Math.PI * 22
const dashOffset = computed(() => circumference * (1 - holdProgress.value / 100))
</script>

<template>
  <!-- Locked state: just show status per item -->
  <div v-if="locked" class="cap cap--locked">
    <div class="cap__locked-header">
      <i class="fa-solid fa-lock-keyhole" />
      <span>Aprobación confirmada e irreversible</span>
    </div>
    <div class="cap__locked-items">
      <div v-for="item in items" :key="item._id" class="cap__locked-item">
        <div class="cap__locked-item-info">
          <span class="cap__locked-item-name">{{ item.numero }}. {{ item.tema }}</span>
          <p v-if="item.motivoRechazo" class="cap__locked-rejection">
            <i class="fa-solid fa-comment-dots" />
            {{ item.motivoRechazo }}
          </p>
        </div>
        <StatusBadge :status="item.clienteAprobacion" type="aprobacion" />
      </div>
    </div>
  </div>

  <!-- Active approval panel -->
  <div v-else class="cap">
    <div class="cap__header">
      <div>
        <h4 class="cap__title">Aprobación de videos</h4>
        <p class="cap__subtitle">{{ reviewed }} / {{ items.length }} videos revisados</p>
      </div>
      <div class="cap__progress-bar">
        <div class="cap__progress-fill" :style="{ width: `${items.length ? (reviewed / items.length) * 100 : 0}%` }" />
      </div>
    </div>

    <div class="cap__items">
      <div v-for="item in items" :key="item._id" class="cap__item-wrapper">
        <div class="cap__item">
          <span class="cap__item-name">{{ item.numero }}. {{ item.tema }}</span>
          <div class="cap__item-radios">
            <label class="cap__radio cap__radio--approve">
              <input
                type="radio"
                :name="`approval-${item._id}`"
                :value="ClienteAprobacion.APROBADO"
                :checked="approvals[item._id] === ClienteAprobacion.APROBADO"
                @click="emit('update-approval', item._id, ClienteAprobacion.APROBADO)"
              />
              Aprobar
            </label>
            <label class="cap__radio cap__radio--reject">
              <input
                type="radio"
                :name="`approval-${item._id}`"
                :value="ClienteAprobacion.RECHAZADO"
                :checked="approvals[item._id] === ClienteAprobacion.RECHAZADO"
                @click="emit('update-approval', item._id, ClienteAprobacion.RECHAZADO)"
              />
              Rechazar
            </label>
          </div>
        </div>
        <div
          v-if="approvals[item._id] === ClienteAprobacion.RECHAZADO"
          class="cap__rejection-row"
        >
          <textarea
            :value="rejections[item._id] || ''"
            @input="emit('update-rejection', item._id, ($event.target as HTMLTextAreaElement).value)"
            placeholder="¿Por qué rechazas este video? (opcional)"
            rows="2"
            class="cap__rejection-textarea"
          />
        </div>
      </div>
    </div>

    <div class="cap__confirm-row">
      <label class="cap__checkbox">
        <input type="checkbox" v-model="confirmed" :disabled="!allReviewed" />
        <span>Entiendo que esta decisión es irreversible</span>
      </label>
    </div>

    <div class="cap__hold-row">
      <button
        class="cap__hold-btn"
        :class="{ 'cap__hold-btn--active': canHold, 'cap__hold-btn--saving': isSaving }"
        :disabled="!canHold"
        @mousedown="startHold"
        @mouseup="stopHold"
        @mouseleave="stopHold"
        @touchstart.prevent="startHold"
        @touchend.prevent="stopHold"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" class="cap__hold-svg">
          <circle cx="30" cy="30" r="22" fill="none" stroke="#e5e7eb" stroke-width="4"/>
          <circle
            cx="30" cy="30" r="22" fill="none"
            stroke="currentColor" stroke-width="4"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 30 30)"
            style="transition: stroke-dashoffset 0.1s linear"
          />
          <i class="fa-solid fa-check" />
        </svg>
        <span class="cap__hold-label">
          {{ isSaving ? 'Enviando...' : (canHold ? 'Mantén presionado para confirmar' : 'Revisa todos los videos primero') }}
        </span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cap {
  background: $white;
  border-radius: 20px;
  border: 1.5px solid rgba($primary-dark, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 8px 24px rgba($primary-dark, 0.06);

  &--locked {
    background: #f0fdf4;
    border-color: #86efac;
  }

  &__locked-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #166534;
    font-size: 0.9rem;
    i { color: #16a34a; }
  }

  &__locked-items { display: flex; flex-direction: column; gap: 0.5rem; }
  &__locked-item { display: flex; justify-content: space-between; align-items: center; }
  &__locked-item-name { font-size: 0.85rem; font-weight: 600; color: $primary-dark; }

  &__header { display: flex; flex-direction: column; gap: 0.5rem; }
  &__title { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  &__subtitle { margin: 0; font-size: 0.78rem; color: $text-secondary; }

  &__progress-bar {
    height: 5px;
    background: rgba($primary-dark, 0.08);
    border-radius: 10px;
    overflow: hidden;
  }
  &__progress-fill {
    height: 100%;
    background: $primary;
    border-radius: 10px;
    transition: width 0.3s;
  }

  &__items { display: flex; flex-direction: column; gap: 0.6rem; max-height: 260px; overflow-y: auto; }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.05);
  }

  &__item-name { font-size: 0.83rem; font-weight: 600; color: $primary-dark; flex: 1; }

  &__item-radios { display: flex; gap: 0.5rem; }

  &__radio {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.3rem 0.65rem;
    border-radius: 8px;
    border: 1.5px solid rgba($primary-dark, 0.1);
    transition: all 0.2s;
    user-select: none;

    input { margin: 0; accent-color: currentColor; }

    &--approve { color: #166534; &:has(input:checked) { background: #dcfce7; border-color: #86efac; } }
    &--reject  { color: #991b1b; &:has(input:checked) { background: #fee2e2; border-color: #fca5a5; } }
  }

  &__confirm-row {}

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    font-size: 0.83rem;
    font-weight: 600;
    color: $primary-dark;

    input { accent-color: $primary; width: 16px; height: 16px; cursor: pointer; }
    input:disabled + span { opacity: 0.45; }
  }

  &__hold-row { display: flex; justify-content: center; }

  &__hold-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba($primary-dark, 0.04);
    border: 2px solid rgba($primary-dark, 0.1);
    border-radius: 16px;
    padding: 0.75rem 1.5rem;
    cursor: not-allowed;
    transition: all 0.2s;
    color: #9ca3af;
    width: 100%;
    max-width: 400px;

    &--active {
      cursor: pointer;
      color: $primary;
      border-color: rgba($primary, 0.3);
      background: rgba($primary, 0.05);
      &:hover { border-color: $primary; }
    }

    &--saving { cursor: wait; }
    &:disabled { pointer-events: none; }
  }

  &__hold-svg { flex-shrink: 0; }

  &__hold-label {
    font-size: 0.83rem;
    font-weight: 700;
    line-height: 1.3;
  }

  &__item-wrapper { display: flex; flex-direction: column; gap: 0.4rem; }
  &__rejection-row {}
  &__rejection-textarea {
    width: 100%; resize: none; border: 1.5px solid #fca5a5;
    border-radius: 8px; padding: 0.45rem 0.65rem;
    font-size: 0.78rem; color: #991b1b; background: #fff5f5;
    font-family: inherit; outline: none; box-sizing: border-box;
    &::placeholder { color: #fca5a5; }
    &:focus { border-color: #f87171; }
  }
  &__locked-item-info { display: flex; flex-direction: column; gap: 0.2rem; flex: 1; }
  &__locked-rejection {
    margin: 0; font-size: 0.73rem; color: #991b1b; font-style: italic;
    display: flex; align-items: flex-start; gap: 0.3rem;
    i { flex-shrink: 0; margin-top: 0.1rem; }
  }
}
</style>
