<template>
  <!-- Arrastrar y hacer clic hacen lo mismo. El `accept` sale de la misma lista
       que valida, para que el selector no ofrezca lo que se va a rechazar. -->
  <label
    :class="['rdz', { 'is-over': isOver, 'is-busy': busy }]"
    @dragover.prevent="isOver = true"
    @dragleave="isOver = false"
    @drop.prevent="onDrop"
  >
    <input type="file" :accept="accept" hidden :disabled="busy" @change="onInput" />

    <span class="rdz__icon">
      <i :class="busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-up-from-bracket'" />
    </span>

    <span class="rdz__text">
      <strong>{{ busy ? 'Subiendo…' : title }}</strong>
      <small>{{ hint }}</small>
    </span>

    <span v-if="!busy" class="rdz__cta">Elegir</span>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  hint: string
  accept: string
  busy: boolean
}>()

const emit = defineEmits<{ (e: 'file', file: File): void }>()

const isOver = ref(false)

function onDrop(event: DragEvent) {
  isOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('file', file)
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Se limpia antes de emitir para que elegir el mismo archivo dos veces
  // vuelva a disparar el evento change.
  input.value = ''
  if (file) emit('file', file)
}
</script>

<style scoped lang="scss">
.rdz {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  overflow: hidden;
  background: $primary-light;
  border: 1.5px dashed rgba($primary-dark, 0.15);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;

  // Barrido de luz al pasar el cursor.
  &::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -60%;
    width: 45%;
    background: linear-gradient(90deg, transparent, rgba($white, 0.5), transparent);
    transform: skewX(-18deg);
    content: '';
    transition: left 0.55s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: var(--accent, #{$secondary});
    background: $white;

    &::after { left: 115%; }
    .rdz__cta { color: $white; background: var(--accent, #{$secondary}); }
    .rdz__icon { transform: translateY(-2px); }
  }

  &.is-over {
    background: var(--accent-soft, #{$overlay-purple});
    border-style: solid;
    border-color: var(--accent, #{$secondary});
    transform: scale(1.01);
  }

  &.is-busy { cursor: progress; opacity: 0.75; }
}

.rdz__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
  color: var(--accent, #{$secondary});
  background: $white;
  border-radius: 11px;
  box-shadow: 0 1px 3px rgba($primary-dark, 0.08);
  transition: transform 0.2s;
}

.rdz__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.85rem; color: $primary-dark; }
  small { font-size: 0.72rem; line-height: 1.4; color: $text-secondary; }
}

.rdz__cta {
  flex-shrink: 0;
  padding: 0.35rem 0.85rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--accent, #{$secondary});
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

@media (max-width: 480px) {
  .rdz__cta { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .rdz,
  .rdz::after,
  .rdz__icon,
  .rdz__cta { transition: none; }

  .rdz.is-over { transform: none; }
}
</style>
