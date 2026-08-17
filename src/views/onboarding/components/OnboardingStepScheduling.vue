<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits(['scheduled'])

/**
 * Confirmar no es un clic: es el compromiso con la sesión. El botón "Ya
 * agendé" solo abre el panel de compromisos; el paso se cierra cuando la
 * persona los acepta y confirma. Antes el botón marcaba agendado de una,
 * sin agendar nada ni enterarse de qué se espera de ella.
 */
const agendadoDetectado = ref(false)
const mostrarConfirmacion = ref(false)
const obligacionesAceptadas = ref(false)

/**
 * El widget de GHL avisa por postMessage cuando se completa una reserva.
 * Es detección de cortesía (los formatos cambian entre versiones): abre el
 * panel de confirmación solo. La fuente de verdad sigue siendo el Confirmar.
 */
function onMessage(e: MessageEvent) {
  if (!/leadconnectorhq|msgsndr/.test(e.origin)) return
  try {
    const texto = typeof e.data === 'string' ? e.data : JSON.stringify(e.data)
    if (/appointment|booking|booked|schedul/i.test(texto) && /success|confirm|complete|booked/i.test(texto)) {
      agendadoDetectado.value = true
      mostrarConfirmacion.value = true
    }
  } catch { /* mensajes de otros widgets, no importan */ }
}

onMounted(() => {
  if (!document.getElementById('leadconnector-script')) {
    const script = document.createElement('script')
    script.id = 'leadconnector-script'
    script.src = 'https://link.msgsndr.com/js/form_embed.js'
    script.type = 'text/javascript'
    script.async = true
    document.body.appendChild(script)
  }
  window.addEventListener('message', onMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
})

function onYaAgende() {
  mostrarConfirmacion.value = true
}

function onConfirmar() {
  if (!obligacionesAceptadas.value) return
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
      <iframe
        src="https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP"
        allow="payment"
        style="width: 100%; height: 600px; border: none; overflow: hidden;"
        scrolling="no"
        id="dEE87oPrcB9ExenFIEe5_1787004970089"
      ></iframe>
    </div>

    <!-- Paso 1: esperar el agendamiento -->
    <div v-if="!mostrarConfirmacion" class="waiting-indicator">
      <div class="waiting-content">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Esperando confirmación de agendamiento automática...
      </div>
      <button class="btn-secondary mt-3" @click="onYaAgende">
        Ya agendé mi sesión
      </button>
    </div>

    <!-- Paso 2: compromisos + confirmar -->
    <div v-else class="confirm-card">
      <div v-if="agendadoDetectado" class="detected-note">
        <i class="fa-solid fa-calendar-check"></i> Detectamos tu agendamiento en el calendario. Solo falta confirmar.
      </div>

      <h2 class="confirm-title"><i class="fa-solid fa-handshake"></i> Antes de confirmar, tus compromisos</h2>
      <p class="confirm-intro">La sesión kick-off define la estrategia de tu proyecto. Para que funcione, esto es lo que asumes al confirmar:</p>

      <ul class="confirm-list">
        <li><i class="fa-solid fa-clock"></i> <strong>Asistir puntualmente</strong> en la fecha y hora que elegiste. La sesión arranca a tiempo, con o sin retraso tuyo.</li>
        <li><i class="fa-solid fa-calendar-days"></i> <strong>Reagendar con al menos 24 horas de anticipación</strong> si no puedes asistir, desde el mismo calendario.</li>
        <li><i class="fa-solid fa-key"></i> <strong>Llegar con la información de tu negocio a la mano</strong>: accesos a tus redes, datos de tus productos o servicios y quién tomará las decisiones.</li>
        <li><i class="fa-solid fa-bullseye"></i> <strong>Tu rol comercial</strong>: vender, gestionar y cerrar los prospectos que se generen. Bakano guía, asesora, audita y provee la estrategia e infraestructura digital.</li>
      </ul>

      <label class="confirm-check">
        <input type="checkbox" v-model="obligacionesAceptadas" />
        <span>Ya agendé mi sesión en el calendario y <strong>me comprometo</strong> con estos puntos.</span>
      </label>

      <div class="confirm-actions">
        <button class="btn-ghost" @click="mostrarConfirmacion = false">Volver al calendario</button>
        <button class="btn-primary" :disabled="!obligacionesAceptadas" @click="onConfirmar">
          <i class="fa-solid fa-check"></i> Confirmar mi sesión
        </button>
      </div>
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

.confirm-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
  text-align: left;
}

.detected-note {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 10px;
  padding: 0.8rem 1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.confirm-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  i { color: $primary; }
}

.confirm-intro {
  color: #6b7280;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.confirm-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    color: #374151;
    line-height: 1.55;

    i {
      color: $primary;
      margin-top: 0.25rem;
      width: 1.2rem;
      text-align: center;
    }

    strong { color: #111827; }
  }
}

.confirm-check {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  background: rgba($primary, 0.04);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 12px;
  padding: 1rem 1.2rem;
  cursor: pointer;
  margin-bottom: 1.5rem;

  input[type='checkbox'] {
    margin-top: 3px;
    width: 22px;
    height: 22px;
    accent-color: $primary;
    cursor: pointer;
    flex-shrink: 0;
  }

  span {
    color: #374151;
    line-height: 1.5;
  }
}

.confirm-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
  color: $white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.btn-ghost {
  background: transparent;
  color: #6b7280;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;

  &:hover { color: #111827; }
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
