<template>
  <div class="tgs">
    <p class="tgs__label">
      <i class="fa-solid fa-sliders" />
      Tipo de guión
    </p>
    <div class="tgs__buttons">
      <button
        v-for="t in TIPO_GUION_VALUES"
        :key="t"
        type="button"
        :class="['tgs__btn', { 'is-active': modelValue === t }]"
        :style="modelValue === t ? activeStyle(t) : {}"
        @click="$emit('update:modelValue', t)"
      >
        <i :class="TIPO_GUION_INFO[t].icon" />
        <span class="tgs__btn-text">{{ TIPO_GUION_INFO[t].label }}</span>
        <span class="tgs__btn-stage">{{ t }}</span>
        <span class="tgs__btn-tooltip">{{ TIPO_GUION_INFO[t].desc }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TipoGuion } from '@/types/videoPlanning'
import { TIPO_GUION_INFO, TIPO_GUION_VALUES } from './constants'

defineProps<{ modelValue: TipoGuion }>()
defineEmits<{ (e: 'update:modelValue', value: TipoGuion): void }>()

function activeStyle(t: TipoGuion) {
  const { color } = TIPO_GUION_INFO[t]
  return { background: `${color}14`, borderColor: color, color }
}
</script>

<style lang="scss" scoped>
.tgs {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &__label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.06em;

    i { font-size: 0.65rem; }
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.6rem 0.5rem;
    font-family: inherit;
    font-size: 0.75rem;
    color: $text-secondary;
    background: rgba($primary-dark, 0.02);
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s;
    overflow: visible;

    &:hover {
      color: $primary-dark;
      background: rgba($primary-dark, 0.04);
      border-color: rgba($primary-dark, 0.25);
    }

    &.is-active { font-weight: 700; }

    i { font-size: 0.9rem; }

    &:hover .tgs__btn-tooltip {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }
  }

  &__btn-text {
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.1;
  }

  &__btn-stage {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.65;
  }

  &__btn-tooltip {
    position: absolute;
    bottom: calc(100% + 7px);
    left: 50%;
    z-index: 100;
    min-width: 200px;
    max-width: 240px;
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
    font-weight: 400;
    line-height: 1.45;
    color: $white;
    text-align: center;
    white-space: normal;
    background: $primary-dark;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
    pointer-events: none;
    transition: all 0.18s;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      border: 5px solid transparent;
      border-top-color: $primary-dark;
      transform: translateX(-50%);
    }
  }

  @media (min-width: 481px) {
    &__buttons { flex-direction: row; }
    &__btn { flex: 1; }
  }
}
</style>
