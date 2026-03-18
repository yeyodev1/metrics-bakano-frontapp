<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  // ── Verde ────────────────────────────────
  APROBADO:   { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#86efac' },
  GRABADO:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#86efac' },
  EDITADO:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#86efac' },
  PUBLICADO:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', border: '#86efac' },
  // ── Amarillo ─────────────────────────────
  POR_REVISAR:  { bg: '#fefce8', text: '#a16207', dot: '#eab308', border: '#fde047' },
  POR_GRABAR:   { bg: '#fefce8', text: '#a16207', dot: '#eab308', border: '#fde047' },
  POR_EDITAR:   { bg: '#fefce8', text: '#a16207', dot: '#eab308', border: '#fde047' },
  POR_PUBLICAR: { bg: '#fefce8', text: '#a16207', dot: '#eab308', border: '#fde047' },
  // ── Rojo ─────────────────────────────────
  RECHAZADO: { bg: '#fff1f2', text: '#be123c', dot: '#f43f5e', border: '#fda4af' },
  // ── Azul ─────────────────────────────────
  PROGRAMADO: { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', border: '#93c5fd' },
  // ── Gris ─────────────────────────────────
  '-':        { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', border: '#e5e7eb' },
}

const FALLBACK = { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', border: '#e5e7eb' }

const c = computed(() => COLORS[props.modelValue] ?? FALLBACK)
</script>

<template>
  <div
    class="s-select"
    :style="{
      '--s-bg':     c.bg,
      '--s-text':   c.text,
      '--s-dot':    c.dot,
      '--s-border': c.border,
    }"
    :class="{ 's-select--disabled': disabled }"
  >
    <span class="s-select__dot" />
    <select
      class="s-select__native"
      :value="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <i class="fa-solid fa-chevron-down s-select__arrow" />
  </div>
</template>

<style lang="scss" scoped>
.s-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: var(--s-bg);
  border: 1.5px solid var(--s-border);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
  min-width: 130px;

  &:focus-within {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--s-dot) 25%, transparent);
    border-color: var(--s-dot);
  }

  &--disabled { opacity: 0.55; }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--s-dot);
    flex-shrink: 0;
    margin-left: 0.55rem;
    pointer-events: none;
  }

  &__native {
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    border: none;
    padding: 0.38rem 1.85rem 0.38rem 0.45rem;
    font-size: 0.77rem;
    font-weight: 700;
    color: var(--s-text);
    cursor: pointer;
    width: 100%;

    &:focus { outline: none; }
    &:disabled { cursor: not-allowed; }

    option {
      background: #fff;
      color: #1f2937;
      font-weight: 600;
    }
  }

  &__arrow {
    position: absolute;
    right: 0.55rem;
    font-size: 0.55rem;
    color: var(--s-text);
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
