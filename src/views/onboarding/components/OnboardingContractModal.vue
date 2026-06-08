<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  contractData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

function closePreviewModal() {
  emit('close')
}

function onSubmitContract() {
  emit('confirm')
}
</script>

<template>
  <div v-if="show" class="preview-modal-overlay" @click.self="closePreviewModal">
    <div class="preview-modal-content">
      <div class="modal-header">
        <h2>Previsualización del Contrato</h2>
        <button type="button" class="btn-close" @click="closePreviewModal"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="modal-body">
        <div class="contract-document">
          <h3 class="doc-title">CONTRATO DE PRESTACIÓN DE SERVICIOS DE MARKETING DIGITAL, CONSULTORÍA COMERCIAL Y PARTNER DE ESCALADO 360</h3>
          
          <p><strong>PRIMERA.- COMPARECIENTES:</strong><br/>
          Comparecen a la celebración del presente contrato, por una parte, NEGOCIOS DEL PACIFICO NEGODELPAC S.A., representada por LUIS ALBERTO REYES LEMA, en calidad de representante legal, con Ruc No. 0993213210001, en adelante y para efectos del presente contrato se lo denominará como BAKANO, y por otra parte, <strong>{{ contractData.nombreCliente }}</strong>, con RUC/C.I. No. <strong>{{ contractData.rucCliente }}</strong>, representada por <strong>{{ contractData.representanteCliente }}</strong>, en adelante y para el efecto de este contrato se lo denominará como EL CLIENTE, quienes libre y voluntariamente acuerdan celebrar el presente Contrato de Prestación de Servicios.</p>
          
          <p><strong>SEGUNDA.- ANTECEDENTES:</strong><br/>
          1.1. BAKANO es una empresa especializada en marketing digital y escalado de negocios...<br/>
          1.2. EL CLIENTE ha manifestado su interés en contratar los servicios profesionales de BAKANO.</p>

          <p><strong>TERCERA.- OBJETO DEL CONTRATO:</strong><br/>
          BAKANO se obliga a prestar a favor de EL CLIENTE servicios de marketing digital, consultoría comercial y acompañamiento estratégico bajo la modalidad de "Partner de Escalado 360".</p>

          <p><strong>CUARTA.- ALCANCE DE LOS SERVICIOS:</strong><br/>
          <template v-if="contractData.cantidadGuiones">
            A. Motor de Contenido de Conversión: <strong>{{ contractData.cantidadGuiones }}</strong> guiones, y producción de <strong>{{ contractData.videosEntretenimiento || 0 }}</strong> videos de entretenimiento y <strong>{{ contractData.videosVenta || 0 }}</strong> videos de venta mensuales.<br/>
            B. Sistema de Adquisición de Clientes: <strong>{{ contractData.numeroFunnels }}</strong> funnels.<br/>
            C. Consultoría Estratégica: Frecuencia <strong>{{ contractData.frecuenciaSesiones }}</strong>.
          </template>
          <template v-else>
            Los servicios a prestar se ejecutarán estrictamente <strong>según lo conversado y estipulado</strong> previamente entre las partes.
          </template>
          </p>

          <p><strong>DÉCIMA SEGUNDA.- HONORARIOS Y FORMA DE PAGO:</strong><br/>
          <template v-if="contractData.diasPago">
            EL CLIENTE pagará a BAKANO la suma mensual acordada más IVA. Los pagos deberán realizarse de manera anticipada dentro de los primeros <strong>{{ contractData.diasPago }}</strong> días de cada período.
          </template>
          <template v-else>
            EL CLIENTE pagará a BAKANO la suma mensual acordada más IVA. Los pagos y fechas se realizarán <strong>según lo conversado y estipulado</strong> entre las partes.
          </template>
          </p>

          <p><strong>DÉCIMA TERCERA.- PLAZO:</strong><br/>
          <template v-if="contractData.plazoMeses">
            El contrato tiene un plazo de <strong>{{ contractData.plazoMeses }}</strong> meses con una permanencia mínima de <strong>{{ contractData.mesesPermanencia }}</strong> meses y una penalidad de salida de <strong>{{ contractData.mensualidadesPenalidad }}</strong> mensualidades.
          </template>
          <template v-else>
            El contrato tiene un plazo de permanencia y vigencia <strong>según lo conversado y estipulado</strong> previamente entre las partes.
          </template>
          </p>

          <p class="mt-4 text-center"><em>Al confirmar, este documento será generado en PDF y sellado con tu firma electrónica y la de BAKANO, y se enviará una copia a <strong>{{ contractData.email }}</strong>.</em></p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closePreviewModal" :disabled="isSubmitting">Cancelar</button>
        <button type="button" class="btn-primary" @click="onSubmitContract" :disabled="isSubmitting">
          {{ isSubmitting ? 'Enviando y Firmando...' : 'Confirmar y Firmar Definitivamente' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

.preview-modal-content {
  background: white;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: $primary-dark;
  }

  .btn-close {
    background: transparent;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #ef4444;
    }
  }
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.contract-document {
  background: white;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Times New Roman', Times, serif;
  color: #111827;
  line-height: 1.6;

  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  p {
    margin-bottom: 1rem;
    font-size: 1rem;
  }
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f9fafb;

  .btn-cancel {
    background: transparent;
    border: 1px solid #d1d5db;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.mt-4 { margin-top: 1.5rem; }
.text-center { text-align: center; }

.btn-primary {
  background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
  color: $white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba($primary, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px rgba($primary, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
