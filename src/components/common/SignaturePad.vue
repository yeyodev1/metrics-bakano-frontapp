<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const isDrawing = ref(false)
const hasSignature = ref(false)
let lastX = 0
let lastY = 0

onMounted(() => {
  if (!canvasRef.value) return
  
  // Set up canvas context
  const canvas = canvasRef.value
  ctx.value = canvas.getContext('2d')
  if (ctx.value) {
    ctx.value.lineJoin = 'round'
    ctx.value.lineCap = 'round'
    ctx.value.lineWidth = 3
    ctx.value.strokeStyle = '#191423' // Dark text color
  }
  
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  
  // Save current drawing if we are resizing
  const data = canvas.toDataURL()
  
  // Make it visually fill the positioned parent
  const rect = canvas.parentElement?.getBoundingClientRect()
  if (rect) {
    canvas.width = rect.width
    canvas.height = 200 // Fixed height for signature pad
  }
  
  // Restore drawing (though simple resize might clear it if we don't redraw carefully)
  // For a simple pad, clearing on resize is usually acceptable or we can reload the image
  if (ctx.value) {
    ctx.value.lineJoin = 'round'
    ctx.value.lineCap = 'round'
    ctx.value.lineWidth = 3
    ctx.value.strokeStyle = '#191423'
  }
  clear()
}

function getPointerPos(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  
  let clientX, clientY
  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    const touch = e.touches?.[0] || e.changedTouches?.[0]
    clientX = touch?.clientX ?? 0
    clientY = touch?.clientY ?? 0
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

function startDrawing(e: MouseEvent | TouchEvent) {
  if (props.disabled) return
  e.preventDefault()
  
  isDrawing.value = true
  hasSignature.value = true
  
  const { x, y } = getPointerPos(e)
  lastX = x
  lastY = y
  
  emit('update:modelValue', true)
  emit('change', true)
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx.value || props.disabled) return
  e.preventDefault()
  
  const { x, y } = getPointerPos(e)
  
  ctx.value.beginPath()
  ctx.value.moveTo(lastX, lastY)
  ctx.value.lineTo(x, y)
  ctx.value.stroke()
  
  lastX = x
  lastY = y
}

function stopDrawing() {
  isDrawing.value = false
}

function clear() {
  if (!canvasRef.value || !ctx.value) return
  ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  hasSignature.value = false
  emit('update:modelValue', false)
  emit('change', false)
}

function getSignatureImage() {
  if (!canvasRef.value || !hasSignature.value) return null
  return canvasRef.value.toDataURL('image/png')
}

defineExpose({
  clear,
  getSignatureImage,
  hasSignature
})
</script>

<template>
  <div class="signature-pad-container" :class="{ 'is-disabled': disabled }">
    <div class="canvas-wrapper">
      <canvas
        ref="canvasRef"
        class="signature-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseout="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
        @touchcancel="stopDrawing"
      ></canvas>
      <div v-if="!hasSignature && !disabled" class="signature-placeholder">
        <i class="fa-solid fa-pen-nib"></i> Dibuja tu firma aquí
      </div>
    </div>
    
    <div class="signature-actions">
      <button 
        type="button" 
        class="btn-clear" 
        @click="clear"
        :disabled="disabled || !hasSignature"
      >
        <i class="fa-solid fa-eraser"></i> Limpiar firma
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.signature-pad-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.is-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  background: white;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: rgba($primary, 0.4);
  }
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 200px;
  cursor: crosshair;
  touch-action: none; /* Prevent scrolling on mobile while drawing */
}

.signature-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #9ca3af;
  pointer-events: none;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.7;
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-clear {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: rgba(0,0,0,0.05);
    color: #ef4444;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
