<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { useSurveyBuilder } from '@/composables/surveys/useSurveyBuilder'
import type { IQuestion, QuestionType } from '@/types/survey'

// Sub-components
import SurveyBuilderHeader from '@/components/surveys/builder/SurveyBuilderHeader.vue'
import SurveyInfoForm from '@/components/surveys/builder/SurveyInfoForm.vue'
import QuestionCard from '@/components/surveys/builder/QuestionCard.vue'
import SurveyBuilderActions from '@/components/surveys/builder/SurveyBuilderActions.vue'

const route = useRoute()
const router = useRouter()

const surveyIdArg = route.params.surveyId as string | undefined
const {
  title,
  description,
  coverImage,
  questions,
  currentStatus,
  isLoading,
  isSaving,
  error,
  successMsg,
  isEditMode,
  isDraft,
  canEdit,
  loadSurvey,
  addQuestion,
  removeQuestion,
  moveUp,
  moveDown,
  onTypeChange,
  addOption,
  removeOption,
  saveAsDraft,
  activate,
} = useSurveyBuilder(surveyIdArg)

onMounted(() => {
  loadSurvey()
})
</script>

<template>
  <div class="survey-builder">
    <SurveyBuilderHeader
      :is-edit-mode="isEditMode"
      :current-status="currentStatus"
      @back="router.push({ name: 'SurveyList' })"
    />

    <Transition name="fade-slide" mode="out-in">
      <div v-if="isLoading" class="survey-builder__loading">
        <div class="loader-spinner"></div>
        <span>Cargando encuesta...</span>
      </div>

      <div v-else class="survey-builder__content">
        <!-- Notices & Messages -->
        <TransitionGroup name="list">
          <div v-if="!isDraft && isEditMode" key="readonly" class="notice notice--warning">
            <i class="fa-solid fa-lock" />
            <span>Esta encuesta ya no puede editarse porque está <strong>{{ currentStatus === 'active' ? 'activa' : 'cerrada' }}.</strong></span>
          </div>

          <div v-if="error" key="error" class="notice notice--error">
            <i class="fa-solid fa-circle-exclamation" />
            <span>{{ error }}</span>
          </div>

          <div v-if="successMsg" key="success" class="notice notice--success">
            <i class="fa-solid fa-circle-check" />
            <span>{{ successMsg }}</span>
          </div>
        </TransitionGroup>

        <!-- Survey Info -->
        <SurveyInfoForm
          v-model:title="title"
          v-model:description="description"
          :cover-image="coverImage"
          :can-edit="canEdit"
          @update:cover-image="coverImage = $event"
        />

        <!-- Questions List -->
        <div class="survey-builder__questions">
          <div class="questions-header">
            <div class="questions-header__info">
              <h2 class="questions-header__title">
                <i class="fa-solid fa-list-check" />
                Preguntas
              </h2>
              <span class="questions-header__count">{{ questions.length }} enunciados</span>
            </div>
          </div>

          <div v-if="questions.length === 0" class="questions-empty">
            <div class="questions-empty__illustration">
              <i class="fa-solid fa-circle-question" />
            </div>
            <p>Aún no hay preguntas. Haz clic en "Agregar pregunta" para comenzar.</p>
          </div>

          <draggable
            v-model="questions"
            item-key="id"
            handle=".drag-handle"
            :animation="200"
            class="questions-container"
            ghost-class="question-ghost"
            :disabled="!canEdit"
          >
            <template #item="{ element: q, index: idx }">
              <QuestionCard
                :question="q"
                :index="idx"
                :total-questions="questions.length"
                :can-edit="canEdit"
                @remove="removeQuestion(idx)"
                @moveUp="moveUp(idx)"
                @moveDown="moveDown(idx)"
                @update:question="(val: IQuestion) => questions[idx] = val"
                @typeChange="(newType: QuestionType) => {
                  q.type = newType;
                  onTypeChange(q);
                }"
                @addOption="addOption(q)"
                @removeOption="(optIdx: number) => removeOption(q, optIdx)"
              />
            </template>
          </draggable>

          <button v-if="canEdit" class="btn-add-main" @click="addQuestion">
            <i class="fa-solid fa-plus" />
            <span>Agregar pregunta</span>
          </button>
        </div>

        <!-- Actions -->
        <SurveyBuilderActions
          :is-saving="isSaving"
          :can-edit="canEdit"
          @saveDraft="saveAsDraft"
          @activate="activate"
        />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.survey-builder {
  padding: 2.5rem;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  min-height: 100vh;
  background: rgba($primary-light, 0.1);

  @media (max-width: 640px) {
    padding: 1.5rem 1rem;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 4rem;
    color: $text-secondary;
    
    span {
      font-weight: 600;
      letter-spacing: 0.02em;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__questions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($primary, 0.1);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.notice {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  font-size: 0.95rem;
  border: 1px solid transparent;

  i { font-size: 1.1rem; }

  &--warning {
    background: rgba($alert-warning, 0.08);
    color: darken($alert-warning, 20%);
    border-color: rgba($alert-warning, 0.2);
  }

  &--error {
    background: rgba($alert-error, 0.08);
    color: $alert-error;
    border-color: rgba($alert-error, 0.2);
  }

  &--success {
    background: rgba($alert-success, 0.08);
    color: $alert-success;
    border-color: rgba($alert-success, 0.2);
  }
}

.questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 800;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.6rem;

    i { color: $primary; font-size: 1.1rem; }
  }

  &__count {
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.btn-add-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: $white;
  color: $primary;
  border: 2px dashed rgba($primary, 0.4);
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($primary, 0.05);
    border-color: $primary;
    transform: scale(1.02);
  }
}

.questions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  background: $white;
  border: 1.5px dashed rgba($primary-dark, 0.1);
  border-radius: 24px;
  text-align: center;
  color: $text-secondary;

  &__illustration {
    font-size: 3rem;
    opacity: 0.2;
    color: $primary-dark;
  }

  p { font-size: 1rem; max-width: 300px; line-height: 1.5; }
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-ghost {
  opacity: 0.4;
  background: rgba($primary, 0.05);
  border: 2px dashed rgba($primary, 0.3);
  border-radius: 20px;
}

/* Animations */
.list-enter-active, .list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.list-move {
  transition: transform 0.4s ease;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
