<script setup lang="ts">
import { ref, computed } from 'vue'
import SignaturePad from '@/components/common/SignaturePad.vue'

const props = defineProps({
  contractData: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['preview'])

const contractTermsAccepted = ref(false)
const contractSignatureText = ref('')
const hasDrawnSignature = ref(false)
const signaturePadRef = ref<InstanceType<typeof SignaturePad> | null>(null)

const isSignatureValid = computed(() => {
  if (!props.contractData.representanteCliente) return false
  const textMatches = contractSignatureText.value.trim().toLowerCase() === props.contractData.representanteCliente.trim().toLowerCase()
  return textMatches && hasDrawnSignature.value
})

function onPreview() {
  const clientSignatureBase64 = signaturePadRef.value ? signaturePadRef.value.getSignatureImage() || '' : ''
  emit('preview', {
    termsAccepted: contractTermsAccepted.value,
    signatureValid: isSignatureValid.value,
    signatureBase64: clientSignatureBase64,
    signatureText: contractSignatureText.value
  })
}
</script>

<template>
  <div class="step-content step-content--large" key="step2">
    <h1 class="main-title">Información del Contrato</h1>
    <p class="main-subtitle">Verifica la información para la generación de tu contrato PDF.</p>
    
    <form class="contract-form" @submit.prevent="onPreview">
      <div class="form-row">
        <div class="form-group">
          <label>RUC Bakano</label>
          <input type="text" :value="contractData.rucBakano" disabled />
        </div>
        <div class="form-group">
          <label>Tu RUC/C.I.</label>
          <input type="text" v-model="contractData.rucCliente" required />
        </div>
      </div>

      <div class="form-group">
        <label>Nombre o Razón Social</label>
        <input type="text" v-model="contractData.nombreCliente" required />
      </div>
      
      <div class="form-group">
        <label>Representante Legal</label>
        <input type="text" v-model="contractData.representanteCliente" required />
      </div>
      
      <div class="form-group">
        <label>Email para recibir contrato</label>
        <input type="email" v-model="contractData.email" required />
      </div>

      <div class="signature-section">
        <h3 class="signature-title">Firma Electrónica del Contrato</h3>
        <div class="contract-terms-box">
          <p>Al confirmar, aceptas voluntariamente el <strong>CONTRATO DE PRESTACIÓN DE SERVICIOS DE MARKETING DIGITAL Y CONSULTORÍA COMERCIAL</strong> con los datos estipulados.</p>
        </div>
        
        <div class="checkbox-container">
          <label class="checkbox-label">
            <input type="checkbox" v-model="contractTermsAccepted" />
            <span class="checkbox-text">He leído y acepto los términos y condiciones.</span>
          </label>
        </div>

        <div class="form-group signature-group">
          <label>1. Dibuja tu firma (con el mouse o dedo)</label>
          <SignaturePad 
            ref="signaturePadRef"
            v-model="hasDrawnSignature"
            :disabled="!contractTermsAccepted"
          />
        </div>

        <div class="form-group signature-group" :class="{ 'is-valid': isSignatureValid }">
          <label>2. Para confirmar, escribe tu nombre: <strong class="highlight-name">{{ contractData.representanteCliente || 'tu nombre' }}</strong></label>
          <input 
            type="text" 
            v-model="contractSignatureText" 
            :placeholder="contractData.representanteCliente || 'Escribe tu nombre aquí'"
            :disabled="!contractTermsAccepted"
            class="signature-input"
          />
          <div class="signature-status" v-if="contractSignatureText.length > 0 || hasDrawnSignature">
            <span v-if="isSignatureValid" class="status-valid"><i class="fa-solid fa-check-circle"></i> Firma electrónica completada</span>
            <span v-else class="status-invalid"><i class="fa-solid fa-xmark-circle"></i> Debes dibujar tu firma y escribir tu nombre idéntico al Representante Legal.</span>
          </div>
        </div>
      </div>

      <button type="button" class="btn-primary mt-4" @click="onPreview" :disabled="isSubmitting || !isSignatureValid || !contractTermsAccepted || !contractData.rucCliente.trim()">
        Previsualizar Contrato
      </button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.step-content {
  width: 100%;
}

.step-content--large {
  max-width: 700px;
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

.contract-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  width: 100%;

  .form-row {
    display: flex;
    gap: 1.5rem;
    
    @media (max-width: 600px) {
      flex-direction: column;
    }
    
    .form-group {
      flex: 1;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;

  label {
    font-weight: 600;
    color: #4b5563;
    font-size: 0.95rem;
    margin-left: 0.2rem;
  }

  input[type="text"],
  input[type="email"],
  input[type="number"] {
    padding: 1.2rem 1.5rem;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    font-size: 1.05rem;
    transition: all 0.3s ease;
    background: #f9fafb;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 4px rgba($primary, 0.1);
    }

    &:disabled {
      background: #e5e7eb;
      color: #6b7280;
      cursor: not-allowed;
    }
  }
}

.signature-section {
  margin-top: 2.5rem;
  padding-top: 2.5rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.signature-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #111827;
}

.contract-terms-box {
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #4b5563;
  border: 1px solid rgba(0, 0, 0, 0.05);

  strong {
    color: $primary-dark;
  }
}

.signature-group {
  margin-bottom: 2rem;

  label {
    font-size: 1.1rem;
    color: #374151;
    margin-bottom: 0.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .highlight-name {
    color: $primary;
    background: rgba($primary, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
  }
}

.signature-input {
  font-size: 1.2rem !important;
  padding: 1.2rem !important;
  transition: all 0.3s ease;
  border: 2px dashed rgba(0, 0, 0, 0.1) !important;

  &:focus {
    border-style: solid !important;
  }
}

.is-valid .signature-input {
  border-color: #10b981 !important;
  border-style: solid !important;
  background: #f0fdf4 !important;
  color: #065f46 !important;
}

.signature-status {
  margin-top: 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    font-size: 1.1rem;
  }

  .status-valid {
    color: #10b981;
  }

  .status-invalid {
    color: #ef4444;
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
}

.btn-primary {
  background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
  color: $white;
  border: none;
  padding: 1.3rem 2.5rem;
  border-radius: 9999px;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 10px 20px rgba($primary, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px rgba($primary, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>
