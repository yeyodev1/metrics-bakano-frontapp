<script setup lang="ts">
/**
 * Pad de firma.
 *
 * El problema que resuelve: antes, cada vez que el navegador disparaba un
 * resize se borraba lo dibujado. En el celular eso pasa todo el tiempo —al
 * abrirse el teclado para escribir el nombre, al aparecer o esconderse la
 * barra del navegador de Telegram al hacer scroll— asi que el cliente firmaba
 * y su firma desaparecia sola.
 *
 * Ahora el lienzo solo se rehace cuando cambia el ANCHO (una rotacion, otra
 * ventana) y, cuando eso pasa, la firma se vuelve a pintar encima.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const ALTO = 200

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const isDrawing = ref(false)
const hasSignature = ref(false)
let lastX = 0
let lastY = 0
/** Ancho con el que se armó el lienzo: si no cambia, no se rehace nada. */
let anchoActual = 0
let temporizador: number | undefined

function aplicarEstilo() {
  if (!ctx.value) return
  ctx.value.lineJoin = 'round'
  ctx.value.lineCap = 'round'
  ctx.value.lineWidth = 2.5
  ctx.value.strokeStyle = '#191423'
}

onMounted(() => {
  if (!canvasRef.value) return
  ctx.value = canvasRef.value.getContext('2d')
  aplicarEstilo()
  ajustarLienzo(true)
  window.addEventListener('resize', alRedimensionar)
  window.addEventListener('orientationchange', alRedimensionar)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', alRedimensionar)
  window.removeEventListener('orientationchange', alRedimensionar)
  if (temporizador) window.clearTimeout(temporizador)
})

function alRedimensionar() {
  if (temporizador) window.clearTimeout(temporizador)
  temporizador = window.setTimeout(() => ajustarLienzo(false), 120)
}

/**
 * Rehace el lienzo al ancho disponible. `forzar` solo en el montaje: en los
 * demás casos, si el ancho es el mismo, no se toca nada (así el teclado del
 * celular no se lleva la firma por delante).
 */
function ajustarLienzo(forzar: boolean) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.parentElement?.getBoundingClientRect()
  const ancho = Math.round(rect?.width || canvas.clientWidth || 0)
  if (!ancho) return
  if (!forzar && ancho === anchoActual) return

  // Lo dibujado se guarda y se vuelve a pintar sobre el lienzo nuevo.
  const anterior = hasSignature.value ? canvas.toDataURL('image/png') : null
  anchoActual = ancho

  // En pantallas densas se dibuja al doble de resolución para que el trazo no
  // salga pixelado; el contexto trabaja igual en píxeles CSS.
  const densidad = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = Math.round(ancho * densidad)
  canvas.height = Math.round(ALTO * densidad)
  canvas.style.height = `${ALTO}px`

  ctx.value = canvas.getContext('2d')
  ctx.value?.setTransform(densidad, 0, 0, densidad, 0, 0)
  aplicarEstilo()

  if (anterior) {
    const imagen = new Image()
    imagen.onload = () => ctx.value?.drawImage(imagen, 0, 0, ancho, ALTO)
    imagen.src = anterior
  }
}

function posicion(e: MouseEvent | TouchEvent | PointerEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  let clientX = 0
  let clientY = 0

  if ('touches' in e) {
    const touch = e.touches?.[0] || e.changedTouches?.[0]
    clientX = touch?.clientX ?? 0
    clientY = touch?.clientY ?? 0
  } else {
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }

  return { x: clientX - rect.left, y: clientY - rect.top }
}

function startDrawing(e: MouseEvent | TouchEvent) {
  if (props.disabled) return
  e.preventDefault()

  isDrawing.value = true
  const { x, y } = posicion(e)
  lastX = x
  lastY = y

  // Un toque seco también deja marca: sin esto, firmar con un punto no valía.
  if (ctx.value) {
    ctx.value.beginPath()
    ctx.value.arc(x, y, 1.25, 0, Math.PI * 2)
    ctx.value.fillStyle = '#191423'
    ctx.value.fill()
  }

  if (!hasSignature.value) {
    hasSignature.value = true
    emit('update:modelValue', true)
    emit('change', true)
  }
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx.value || props.disabled) return
  e.preventDefault()

  const { x, y } = posicion(e)
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
  const canvas = canvasRef.value
  if (!canvas || !ctx.value) return
  ctx.value.save()
  ctx.value.setTransform(1, 0, 0, 1, 0, 0)
  ctx.value.clearRect(0, 0, canvas.width, canvas.height)
  ctx.value.restore()
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
  hasSignature,
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
  /* Sin esto, arrastrar el dedo para firmar mueve la página. */
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
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
