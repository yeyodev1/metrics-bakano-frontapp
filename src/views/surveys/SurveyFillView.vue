<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import QuestionRenderer from '@/components/surveys/QuestionRenderer.vue'
import type { ISurvey, ISurveyAssignment, IQuestion } from '@/types/survey'

const route = useRoute()
const token = route.params.token as string

const survey = ref<ISurvey | null>(null)
const assignment = ref<ISurveyAssignment | null>(null)
const answers = ref<Record<string, any>>({})
const confirmed = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const submitted = ref(false)
const errorState = ref<'NOT_FOUND' | 'ALREADY_COMPLETED' | 'GENERAL' | null>(null)
const submitError = ref('')

onMounted(async () => {
  try {
    const res = await surveyService.getSurveyForFill(token)
    survey.value = res.survey
    assignment.value = res.assignment
  } catch (err: any) {
    const code = err?.data?.code || err?.data?.error || ''
    if (code === 'ALREADY_COMPLETED' || err?.status === 409) {
      errorState.value = 'ALREADY_COMPLETED'
    } else {
      errorState.value = 'NOT_FOUND'
    }
  } finally {
    isLoading.value = false
  }
})

function getAnswer(questionId: string) {
  return answers.value[questionId] ?? null
}

function setAnswer(questionId: string, value: any) {
  answers.value[questionId] = value
}

const canSubmit = computed(() => {
  if (!confirmed.value) return false
  if (!survey.value) return false
  for (const q of survey.value.questions) {
    if (q.required) {
      const val = answers.value[q.id]
      if (val === null || val === undefined || val === '') return false
      if (Array.isArray(val) && val.length === 0) return false
    }
  }
  return true
})

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    const payload = Object.entries(answers.value).map(([questionId, value]) => ({
      questionId,
      value,
    }))
    await surveyService.submitSurveyResponse(token, payload)
    submitted.value = true
  } catch (err: any) {
    const code = err?.data?.code || ''
    if (code === 'ALREADY_COMPLETED') {
      errorState.value = 'ALREADY_COMPLETED'
    } else {
      submitError.value = err?.message || 'Error al enviar la respuesta. Intenta de nuevo.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="survey-fill">
    <!-- Loading -->
    <div v-if="isLoading" class="survey-fill__loading">
      <i class="fa-solid fa-spinner fa-spin fa-2x" />
      <p>Cargando encuesta...</p>
    </div>

    <!-- Error: already completed -->
    <div v-else-if="errorState === 'ALREADY_COMPLETED'" class="survey-fill__error-screen">
      <div class="survey-fill__error-icon survey-fill__error-icon--info">
        <i class="fa-solid fa-circle-check" />
      </div>
      <h2>Ya respondiste esta encuesta</h2>
      <p>Tu respuesta ha sido registrada anteriormente. No puedes responder nuevamente.</p>
    </div>

    <!-- Error: not found / forbidden -->
    <div v-else-if="errorState === 'NOT_FOUND' || errorState === 'GENERAL'" class="survey-fill__error-screen">
      <div class="survey-fill__error-icon survey-fill__error-icon--error">
        <i class="fa-solid fa-circle-xmark" />
      </div>
      <h2>Encuesta no disponible</h2>
      <p>El enlace es inválido, ha expirado, o no tienes acceso a esta encuesta.</p>
    </div>

    <!-- Success screen -->
    <div v-else-if="submitted" class="survey-fill__success-screen">
      <div class="survey-fill__success-icon">
        <i class="fa-solid fa-circle-check" />
      </div>
      <h2>¡Respuesta enviada!</h2>
      <p>Gracias por completar esta encuesta. Tus respuestas han sido registradas.</p>
    </div>

    <!-- Survey form -->
    <div v-else-if="survey" class="survey-fill__form">
      <div class="survey-fill__survey-header">
        <h1 class="survey-fill__survey-title">{{ survey.title }}</h1>
        <p v-if="survey.description" class="survey-fill__survey-desc">{{ survey.description }}</p>
      </div>

      <div class="survey-fill__questions">
        <div
          v-for="(q, idx) in survey.questions"
          :key="q.id"
          class="survey-fill__question"
        >
          <div class="survey-fill__question-label">
            <span class="survey-fill__question-num">{{ idx + 1 }}.</span>
            {{ q.label }}
            <span v-if="q.required" class="survey-fill__required">*</span>
          </div>
          <QuestionRenderer
            :question="q"
            :model-value="getAnswer(q.id)"
            @update:model-value="setAnswer(q.id, $event)"
          />
        </div>
      </div>

      <!-- Confirmation checkbox -->
      <label class="survey-fill__confirm">
        <input type="checkbox" v-model="confirmed" />
        <span>Entiendo que esta es mi única respuesta y no podrá modificarse.</span>
      </label>

      <!-- Submit error -->
      <div v-if="submitError" class="survey-fill__submit-error">
        <i class="fa-solid fa-circle-exclamation" /> {{ submitError }}
      </div>

      <button
        class="survey-fill__submit-btn"
        :disabled="!canSubmit || isSubmitting"
        @click="handleSubmit"
      >
        <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin" />
        <i v-else class="fa-solid fa-paper-plane" />
        {{ isSubmitting ? 'Enviando...' : 'Enviar respuesta' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.survey-fill {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: 60vh;

  &__loading,
  &__error-screen,
  &__success-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    max-width: 480px;
    margin: auto;
    padding: 3rem 1rem;

    h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: $primary-dark;
    }

    p {
      color: $text-secondary;
      font-size: 0.95rem;
      line-height: 1.6;
    }
  }

  &__loading {
    color: $text-secondary;
    font-size: 0.95rem;
    gap: 0.75rem;
  }

  &__error-icon {
    font-size: 3rem;
    &--info { color: $alert-success; }
    &--error { color: $alert-error; }
  }

  &__success-icon {
    font-size: 4rem;
    color: $BAKANO-GREEN;
  }

  &__form {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__survey-header {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__survey-title {
    font-size: 1.7rem;
    font-weight: 800;
    color: $primary-dark;
    line-height: 1.3;
  }

  &__survey-desc {
    margin-top: 0.5rem;
    color: $text-secondary;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  &__questions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__question {
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  &__question-label {
    font-size: 1rem;
    font-weight: 600;
    color: $primary-dark;
    line-height: 1.4;
  }

  &__question-num {
    color: $primary;
    margin-right: 0.25rem;
  }

  &__required {
    color: $primary;
    margin-left: 0.2rem;
  }

  &__confirm {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: $alert-warning-bg;
    border: 1px solid rgba($alert-warning, 0.3);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: $primary-dark;
    font-weight: 500;
    line-height: 1.5;

    input {
      accent-color: $primary;
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
  }

  &__submit-error {
    background: $alert-error-bg;
    color: $alert-error;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__submit-btn {
    padding: 0.85rem 2rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    transition: opacity 0.2s;
    align-self: flex-end;

    &:hover:not(:disabled) { opacity: 0.88; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }
}
</style>
