<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WorkspaceUser } from '@/types'

const props = defineProps({
  member: {
    type: Object as () => WorkspaceUser,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['close', 'submit'])

const evaluationRating = ref(0)
const evaluationFeedback = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    evaluationRating.value = 0
    evaluationFeedback.value = ''
  }
})

const submitEvaluation = () => {
  if (evaluationRating.value === 0) {
    alert('Por favor selecciona una calificación de estrellas.')
    return
  }
  emit('submit', { rating: evaluationRating.value, feedback: evaluationFeedback.value })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="evaluate-modal">
      <button class="close-btn" @click="emit('close')">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="modal-header">
        <h2>Evaluar a {{ member.name }}</h2>
        <p>Tu opinión nos ayuda a mejorar continuamente.</p>
      </div>
      <div class="modal-body">
        <div class="rating-stars">
          <i 
            v-for="star in 5" 
            :key="star"
            class="fa-star"
            :class="star <= evaluationRating ? 'fa-solid active' : 'fa-regular'"
            @click="evaluationRating = star"
          ></i>
        </div>
        <div class="feedback-input">
          <label for="feedback">Comentarios adicionales (opcional)</label>
          <textarea 
            id="feedback" 
            v-model="evaluationFeedback" 
            placeholder="¿Qué hizo bien? ¿Qué puede mejorar?"
            rows="4"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">Cancelar</button>
        <button class="btn-submit" @click="submitEvaluation">Enviar Evaluación</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeInModal 0.3s ease;
}

@keyframes fadeInModal {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUpModal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.evaluate-modal {
  background: #1a1a24;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  padding: 2.5rem;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #ffffff;
    }
  }

  .modal-header {
    margin-bottom: 2rem;
    text-align: center;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }
  }

  .modal-body {
    .rating-stars {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 2.5rem;
      color: rgba(255, 255, 255, 0.1);
      cursor: pointer;

      i {
        transition: all 0.2s ease;
        
        &:hover, &.active {
          color: #f1c40f;
          transform: scale(1.1);
        }
      }
    }

    .feedback-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
      }

      textarea {
        width: 100%;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1rem;
        color: #ffffff;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: $primary;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;

    button {
      padding: 0.75rem 1.5rem;
      border-radius: 100px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .btn-submit {
      background: $primary;
      border: none;
      color: #ffffff;

      &:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
    }
  }
}
</style>
