<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accept'])

const responsibilitiesChecked = ref(false)

function onAcceptVideo() {
  if (!responsibilitiesChecked.value) return
  emit('accept')
}
</script>

<template>
  <div class="step-content" key="step1">
    <h1 class="main-title">Video de Community Manager</h1>
    <p class="main-subtitle">Por favor revisa el siguiente video de nuestro Community Manager atentamente antes de continuar.</p>
    
    <div class="video-container">
      <iframe 
        width="100%" 
        height="100%" 
        src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
        title="Video de Community Manager" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    </div>

    <div class="checkbox-container">
      <label class="checkbox-label">
        <input type="checkbox" v-model="responsibilitiesChecked" />
        <span class="checkbox-text">
          <strong>Acepto las responsabilidades:</strong> Mi responsabilidad como CLIENTE es vender, gestionar y realizar el cierre comercial efectivo de todos los prospectos generados. La responsabilidad de BAKANO es guiar, asesorar, auditar y proveer la estrategia e infraestructura digital.
        </span>
      </label>
    </div>

    <button 
      class="btn-primary" 
      :disabled="!responsibilitiesChecked || isSubmitting"
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
  aspect-ratio: 16 / 9;
  background: #000;
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

  &:hover {
    background: $white;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
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
