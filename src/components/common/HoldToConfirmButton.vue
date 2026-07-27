<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  holdTimeMs: {
    type: Number,
    default: 1200 // 1.2 seconds default
  },
  btnClass: {
    type: String,
    default: 'superadmin-dashboard__btn-danger'
  },
  text: {
    type: String,
    default: 'Mantener para Confirmar'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm'])

const isHolding = ref(false)
const progress = ref(0)
let animationFrameId: number | null = null
let startTime: number = 0
let pointerStart: { x: number; y: number } | null = null

const startHold = (event: PointerEvent) => {
  if (props.disabled) return
  event.preventDefault()
  pointerStart = { x: event.clientX, y: event.clientY }
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)
  isHolding.value = true
  progress.value = 0
  startTime = performance.now()

  const updateProgress = (timestamp: number) => {
    if (!isHolding.value) return

    const elapsed = timestamp - startTime
    progress.value = Math.min((elapsed / props.holdTimeMs) * 100, 100)

    if (elapsed >= props.holdTimeMs) {
      // Hold complete
      isHolding.value = false
      progress.value = 100
      emit('confirm')
      return // Stop animation
    }

    animationFrameId = requestAnimationFrame(updateProgress)
  }

  animationFrameId = requestAnimationFrame(updateProgress)
}

const cancelHold = () => {
  pointerStart = null
  isHolding.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Smoothly revert progress back to 0
  const revertProgress = () => {
    if (isHolding.value) return // User started holding again

    progress.value = Math.max(progress.value - 5, 0)
    if (progress.value > 0) {
      requestAnimationFrame(revertProgress)
    }
  }
  requestAnimationFrame(revertProgress)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!pointerStart || !isHolding.value) return
  const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y)
  if (moved > 12) cancelHold()
}

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <button
    :class="['hold-btn', btnClass]"
    @pointerdown="startHold"
    @pointerup="cancelHold"
    @pointercancel="cancelHold"
    @pointermove="handlePointerMove"
    @contextmenu.prevent
    @dragstart.prevent
    @selectstart.prevent
    type="button"
    :disabled="disabled"
  >
    <div 
      class="hold-btn__progress" 
      :style="{ width: `${progress}%` }"
    />
    <span class="hold-btn__text">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as *;

.hold-btn {
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  color: $white;
  // Fallback if no btnClass provided
  background: $alert-error;
  transition: transform 0.1s ease;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__progress {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.25);
    z-index: 1;
    pointer-events: none;
  }

  &__text {
    position: relative;
    z-index: 2;
  }
}
</style>
