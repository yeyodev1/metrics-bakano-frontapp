<template>
  <div class="obs">
    <p class="obs__label">
      <i class="fa-solid fa-bullseye" />
      ¿Dónde va este video?
    </p>
    <div class="obs__buttons">
      <button
        v-for="o in OBJETIVO_OPTIONS"
        :key="o.value"
        type="button"
        :class="['obs__btn', { 'is-active': modelValue === o.value }]"
        @click="$emit('update:modelValue', o.value)"
      >
        <span class="obs__btn-head">
          <i :class="o.icon" />
          <span class="obs__btn-label">{{ o.label }}</span>
        </span>
        <span class="obs__btn-desc">{{ o.desc }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ObjetivoGuion } from '@/types/videoPlanning'
import { OBJETIVO_OPTIONS } from './constants'

defineProps<{ modelValue: ObjetivoGuion }>()
defineEmits<{ (e: 'update:modelValue', value: ObjetivoGuion): void }>()
</script>

<style lang="scss" scoped>
.obs {
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
    gap: 0.4rem;
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    padding: 0.55rem 0.7rem;
    font-family: inherit;
    text-align: left;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: rgba($secondary, 0.4); }

    &.is-active {
      background: $overlay-purple;
      border-color: $secondary;

      .obs__btn-label { color: $secondary-dark; }
      i { color: $secondary; }
    }
  }

  &__btn-head {
    display: flex;
    align-items: center;
    gap: 0.35rem;

    i {
      font-size: 0.75rem;
      color: $text-secondary;
    }
  }

  &__btn-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__btn-desc {
    font-size: 0.7rem;
    line-height: 1.35;
    color: $text-secondary;
  }

  @media (min-width: 520px) {
    &__buttons { flex-direction: row; }
    &__btn { flex: 1; }
  }
}
</style>
