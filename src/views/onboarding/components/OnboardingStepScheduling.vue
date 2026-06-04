<script setup lang="ts">
import { onMounted, ref } from 'vue'

onMounted(() => {
  if (!document.getElementById('leadconnector-script')) {
    const script = document.createElement('script')
    script.id = 'leadconnector-script'
    script.src = 'https://link.msgsndr.com/js/form_embed.js'
    script.type = 'text/javascript'
    script.async = true
    document.body.appendChild(script)
  }
})

const emit = defineEmits(['scheduled'])
const isSubmitting = ref(false)

function onScheduled() {
  emit('scheduled')
}
</script>

<template>
  <div class="step-content" key="step3">
    <h1 class="main-title">Agenda tu Sesión Kick-off</h1>
    <p class="main-subtitle">Es momento de reunirnos y estructurar tu estrategia.</p>
    
    <div class="alert-box">
      <i class="fa-solid fa-circle-check"></i>
      <p><strong>¡Excelente!</strong> Hemos registrado tu aceptación del video del Project Manager y tu contrato ha sido firmado. En breve, nuestro equipo creará el grupo oficial de WhatsApp para la comunicación de tu proyecto.</p>
    </div>

    <div class="scheduling-container">
      <iframe src="https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP" style="width: 100%; height: 600px; border:none; overflow: hidden;" scrolling="no" id="b5NvXSgq2EWig4ebtSv4_1780602631241"></iframe>
    </div>

    <div class="waiting-indicator">
      <div class="waiting-content">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Esperando confirmación de agendamiento automática...
      </div>
      <button class="btn-secondary mt-3" @click="onScheduled">
        Ya he agendado mi sesión
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.step-content {
  width: 100%;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.main-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.alert-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  color: #166534;

  i {
    font-size: 1.5rem;
    color: #22c55e;
    margin-top: 0.2rem;
  }

  p {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.5;
  }
}

.scheduling-container {
  margin-bottom: 2.5rem;
}

.waiting-indicator {
  padding: 1.5rem;
  background: rgba($primary, 0.05);
  border-radius: 12px;
  text-align: center;
  color: $primary;
  border: 1px dashed rgba($primary, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  .waiting-content {
    font-weight: 600;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.8rem;
    
    i {
      font-size: 1.3rem;
    }
  }
}

.btn-secondary {
  background: transparent;
  color: $primary;
  border: 2px solid $primary;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($primary, 0.05);
    transform: translateY(-2px);
  }
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>
