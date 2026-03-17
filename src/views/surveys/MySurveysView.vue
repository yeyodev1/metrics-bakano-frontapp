<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import type { ISurveyAssignment, ISurvey } from '@/types/survey'

const router = useRouter()

const pending = ref<ISurveyAssignment[]>([])
const completed = ref<ISurveyAssignment[]>([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await surveyService.getMySurveys()
    pending.value = res.pending
    completed.value = res.completed
  } catch (err: any) {
    error.value = err?.message || 'Error al cargar tus encuestas.'
  } finally {
    isLoading.value = false
  }
})

function getSurveyTitle(assignment: ISurveyAssignment): string {
  if (typeof assignment.surveyId === 'object' && assignment.surveyId !== null) {
    return (assignment.surveyId as ISurvey).title
  }
  return 'Encuesta'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="my-surveys">
    <div class="my-surveys__header">
      <h1 class="my-surveys__title">
        <i class="fa-solid fa-clipboard-list" /> Mis Encuestas
      </h1>
      <p class="my-surveys__subtitle">Aquí puedes ver y responder las encuestas que te han enviado.</p>
    </div>

    <div v-if="isLoading" class="my-surveys__loading">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando...
    </div>

    <div v-else-if="error" class="my-surveys__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>

    <template v-else>
      <!-- Pendientes -->
      <section class="my-surveys__section">
        <h2 class="my-surveys__section-title">
          <i class="fa-solid fa-hourglass-half" /> Pendientes
          <span class="my-surveys__count">{{ pending.length }}</span>
        </h2>

        <div v-if="pending.length === 0" class="my-surveys__empty">
          <i class="fa-solid fa-circle-check" />
          <p>¡Todo al día! No tienes encuestas pendientes.</p>
        </div>

        <div v-else class="my-surveys__grid">
          <div v-for="item in pending" :key="item._id" class="survey-card survey-card--pending">
            <div class="survey-card__icon">
              <i class="fa-solid fa-clipboard-question" />
            </div>
            <div class="survey-card__content">
              <h3 class="survey-card__title">{{ getSurveyTitle(item) }}</h3>
              <p class="survey-card__date">Recibida el {{ formatDate(item.sentAt) }}</p>
            </div>
            <button
              class="survey-card__btn-respond"
              @click="router.push({ name: 'SurveyFill', params: { token: item.token } })"
            >
              <i class="fa-solid fa-pen-to-square" /> Responder
            </button>
          </div>
        </div>
      </section>

      <!-- Completadas -->
      <section class="my-surveys__section">
        <h2 class="my-surveys__section-title">
          <i class="fa-solid fa-circle-check" /> Completadas
          <span class="my-surveys__count my-surveys__count--completed">{{ completed.length }}</span>
        </h2>

        <div v-if="completed.length === 0" class="my-surveys__empty">
          <i class="fa-solid fa-inbox" />
          <p>Aún no has completado ninguna encuesta.</p>
        </div>

        <div v-else class="my-surveys__grid">
          <div v-for="item in completed" :key="item._id" class="survey-card survey-card--completed">
            <div class="survey-card__icon survey-card__icon--completed">
              <i class="fa-solid fa-clipboard-check" />
            </div>
            <div class="survey-card__content">
              <h3 class="survey-card__title">{{ getSurveyTitle(item) }}</h3>
              <p class="survey-card__date">Recibida el {{ formatDate(item.sentAt) }}</p>
              <p v-if="item.completedAt" class="survey-card__completed-date">
                Respondida el {{ formatDate(item.completedAt) }}
              </p>
            </div>
            <span class="survey-card__badge-done">
              <i class="fa-solid fa-check" /> Completada
            </span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.my-surveys {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 900px;

  &__header {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.6rem;

    i { color: $primary; }
  }

  &__subtitle {
    margin-top: 0.3rem;
    font-size: 0.9rem;
    color: $text-secondary;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: $text-secondary;
    padding: 2rem;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: $alert-error;
    background: $alert-error-bg;
    border-radius: 10px;
    padding: 0.85rem 1.2rem;
    font-size: 0.9rem;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    i { color: $text-secondary; }
  }

  &__count {
    font-size: 0.8rem;
    background: rgba($primary-dark, 0.1);
    color: $primary-dark;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
    font-weight: 700;

    &--completed {
      background: $alert-success-bg;
      color: $alert-success;
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    color: $text-secondary;
    background: $primary-light;
    border-radius: 10px;
    font-size: 0.9rem;

    i { font-size: 1.3rem; opacity: 0.5; }
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.survey-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba($primary-dark, 0.07);
  }

  &--pending { border-left: 4px solid $alert-warning; }
  &--completed { border-left: 4px solid $BAKANO-GREEN; }

  &__icon {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 10px;
    background: rgba($alert-warning, 0.1);
    color: $alert-warning;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;

    &--completed {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date,
  &__completed-date {
    font-size: 0.78rem;
    color: $text-secondary;
    margin-top: 0.15rem;
  }

  &__btn-respond {
    padding: 0.5rem 1.1rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.2s;

    &:hover { opacity: 0.88; }
  }

  &__badge-done {
    font-size: 0.8rem;
    font-weight: 700;
    color: $BAKANO-GREEN;
    background: rgba($BAKANO-GREEN, 0.1);
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
}
</style>
