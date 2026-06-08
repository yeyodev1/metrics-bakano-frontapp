<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

defineProps({
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accept'])

const responsibilitiesChecked = ref(false)
const videoFinished = ref(false)
const timeLeft = ref(120)
let timer: ReturnType<typeof setInterval>

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

function onAcceptVideo() {
  if (!responsibilitiesChecked.value || !videoFinished.value) return
  emit('accept')
}

onMounted(() => {
  if (!document.querySelector('script[src="https://fast.wistia.com/player.js"]')) {
    const playerScript = document.createElement('script')
    playerScript.src = 'https://fast.wistia.com/player.js'
    playerScript.async = true
    document.head.appendChild(playerScript)
  }

  if (!document.querySelector('script[src="https://fast.wistia.com/embed/ph8sog4lkp.js"]')) {
    const embedScript = document.createElement('script')
    embedScript.src = 'https://fast.wistia.com/embed/ph8sog4lkp.js'
    embedScript.async = true
    embedScript.type = 'module'
    document.head.appendChild(embedScript)
  }

  // Iniciar temporizador de 2 minutos (120 segundos)
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      videoFinished.value = true
      clearInterval(timer)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="step-content" key="step1">
    <h1 class="main-title">Video de Onboarding: Aquí empieza todo</h1>
    <p class="main-subtitle">Por favor revisa el siguiente video de nuestro Project Manager atentamente antes de continuar.</p>
    
    <div class="video-container">
      <wistia-player media-id="ph8sog4lkp" aspect="1.7777777777777777"></wistia-player>
    </div>

    <div class="checkbox-container" :class="{ 'is-disabled': !videoFinished }">
      <label class="checkbox-label">
        <input type="checkbox" v-model="responsibilitiesChecked" :disabled="!videoFinished" />
        <span class="checkbox-text">
          <strong>Acepto las responsabilidades:</strong> Mi responsabilidad como CLIENTE es vender, gestionar y realizar el cierre comercial efectivo de todos los prospectos generados. La responsabilidad de BAKANO es guiar, asesorar, auditar y proveer la estrategia e infraestructura digital.
        </span>
      </label>
      
      <div v-if="!videoFinished" class="timer-warning">
        <i class="fas fa-hourglass-half warning-icon"></i>
        <div class="warning-content">
          <p class="warning-title">Por favor, mira el video completo</p>
          <p class="warning-desc">Podrás aceptar las responsabilidades en <strong class="time-left">{{ formattedTime }}</strong></p>
        </div>
      </div>
    </div>

    <button 
      class="btn-primary" 
      :disabled="!responsibilitiesChecked || !videoFinished || isSubmitting"
      @click="onAcceptVideo"
    >
      Aceptar y Continuar
    </button>
  </div>
</template>

<style lang="scss" scoped>
.step-content {
  max-width: 600px;
  width: 100%;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: $secondary;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.main-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.video-container {
  border-radius: 30px;
  overflow: hidden;
  margin-bottom: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  border: 4px solid $white;
  background: #000;

  wistia-player[media-id='ph8sog4lkp']:not(:defined) {
    background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/ph8sog4lkp/swatch');
    display: block;
    filter: blur(5px);
    padding-top: 56.25%;
  }
}

.checkbox-container {
  background: rgba(255, 255, 255, 0.8);
  padding: 1.8rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  margin-bottom: 2.5rem;
  text-align: left;
  transition: all 0.3s ease;

  &:hover:not(.is-disabled) {
    background: $white;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  &.is-disabled {
    opacity: 0.8;
  }
}

.timer-warning {
  margin-top: 1.5rem;
  padding: 1rem 1.2rem;
  background: rgba(#c91e4c, 0.05);
  border: 1px solid rgba(#c91e4c, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-content {
  display: flex;
  flex-direction: column;
}

.warning-title {
  color: #c91e4c;
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0 0 0.2rem 0;
}

.warning-desc {
  color: #4b5563;
  font-size: 0.9rem;
  margin: 0;
}

.time-left {
  color: #c91e4c;
  font-weight: 800;
  font-size: 1rem;
  background: rgba(#c91e4c, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  margin-left: 0.3rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  cursor: pointer;

  input[type="checkbox"] {
    margin-top: 5px;
    width: 24px;
    height: 24px;
    accent-color: $primary;
    cursor: pointer;
  }
}

.checkbox-text {
  font-size: 1.05rem;
  color: #4b5563;
  line-height: 1.6;
  font-weight: 500;

  strong {
    color: #111827;
    display: block;
    margin-bottom: 0.3rem;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
  color: $white;
  border: none;
  padding: 1.3rem 2.5rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
