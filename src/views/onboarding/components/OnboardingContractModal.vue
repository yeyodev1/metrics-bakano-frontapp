<script setup lang="ts">
import type { PropType } from 'vue'
import type { TextoContrato } from '@/types'

/**
 * Vista previa del contrato. El texto llega del servidor, el mismo con el que
 * se arma el PDF: antes estaba copiado aquí y ya no decía lo mismo.
 */
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  contrato: {
    type: Object as PropType<TextoContrato | null>,
    default: null
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
        <div v-if="contrato" class="contract-document">
          <h3 class="doc-title">{{ contrato.titulo }}</h3>

          <p v-for="c in contrato.clausulas" :key="c.titulo">
            <strong>{{ c.titulo }}</strong><br />
            <span class="clausula-texto">{{ c.texto }}</span>
          </p>

          <p class="mt-4 text-center"><em>Al confirmar, este documento será generado en PDF y sellado con tu firma electrónica y la de BAKANO, y se enviará una copia a <strong>{{ contractData.email }}</strong>. También puedes pedírselo al bot de Telegram cuando quieras.</em></p>
        </div>
        <p v-else class="text-center">No pudimos cargar el texto del contrato. Recarga la página o pídeselo al bot de Telegram.</p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closePreviewModal" :disabled="isSubmitting">Cancelar</button>
        <button type="button" class="btn-primary" @click="onSubmitContract" :disabled="isSubmitting || !contrato">
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

  .clausula-texto {
    white-space: pre-line;
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
