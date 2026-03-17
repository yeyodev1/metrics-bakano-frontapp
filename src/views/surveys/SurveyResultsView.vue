<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import type { ISurvey, ISurveyAssignment, ISurveyResponse, IQuestion } from '@/types/survey'

const route = useRoute()
const router = useRouter()
const surveyId = route.params.surveyId as string

const survey = ref<ISurvey | null>(null)
const assignments = ref<ISurveyAssignment[]>([])
const responses = ref<ISurveyResponse[]>([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await surveyService.getSurveyResults(surveyId)
    survey.value = res.survey
    assignments.value = res.assignments
    responses.value = res.responses
  } catch (err: any) {
    error.value = err?.message || 'Error al cargar resultados.'
  } finally {
    isLoading.value = false
  }
})

const totalSent = computed(() => assignments.value.length)
const totalCompleted = computed(() => assignments.value.filter((a) => a.status === 'completed').length)
const responseRate = computed(() =>
  totalSent.value ? Math.round((totalCompleted.value / totalSent.value) * 100) : 0,
)

function getAnswersForQuestion(questionId: string): any[] {
  return responses.value
    .map((r) => r.answers.find((a) => a.questionId === questionId))
    .filter(Boolean)
    .map((a) => a!.value)
}

function getTextAnswers(questionId: string): string[] {
  return getAnswersForQuestion(questionId).filter((v) => typeof v === 'string' && v.trim())
}

function getOptionDistribution(q: IQuestion): { label: string; count: number; pct: number }[] {
  const allAnswers = getAnswersForQuestion(q.id)
  const options = q.options || []
  const total = allAnswers.length || 1
  return options.map((opt) => {
    const count = allAnswers.filter((a) => {
      if (Array.isArray(a)) return a.includes(opt)
      return a === opt
    }).length
    return { label: opt, count, pct: Math.round((count / total) * 100) }
  })
}

function getAverage(questionId: string): string {
  const vals = getAnswersForQuestion(questionId).filter((v) => typeof v === 'number')
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function getNpsDistribution(questionId: string): { score: number; count: number }[] {
  const vals = getAnswersForQuestion(questionId)
  const dist: { score: number; count: number }[] = []
  for (let i = 0; i <= 10; i++) {
    dist.push({ score: i, count: vals.filter((v) => v === i).length })
  }
  return dist
}

function getYesNoStats(questionId: string): { yes: number; no: number; yesPct: number; noPct: number } {
  const vals = getAnswersForQuestion(questionId)
  const yes = vals.filter((v) => v === true).length
  const no = vals.filter((v) => v === false).length
  const total = yes + no || 1
  return { yes, no, yesPct: Math.round((yes / total) * 100), noPct: Math.round((no / total) * 100) }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="survey-results">
    <div class="survey-results__header">
      <button class="survey-results__back" @click="router.push({ name: 'SurveyList' })">
        <i class="fa-solid fa-arrow-left" /> Volver
      </button>
      <div class="survey-results__header-info">
        <h1 class="survey-results__title">
          <i class="fa-solid fa-chart-bar" /> Resultados
        </h1>
      </div>
    </div>

    <div v-if="isLoading" class="survey-results__loading">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando resultados...
    </div>

    <div v-else-if="error" class="survey-results__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>

    <template v-else-if="survey">
      <!-- Survey info -->
      <div class="survey-results__survey-info">
        <div>
          <h2 class="survey-results__survey-title">{{ survey.title }}</h2>
          <p v-if="survey.description" class="survey-results__survey-desc">{{ survey.description }}</p>
        </div>
        <span class="survey-results__status-badge" :class="`survey-results__status-badge--${survey.status}`">
          {{ survey.status === 'draft' ? 'Borrador' : survey.status === 'active' ? 'Activa' : 'Cerrada' }}
        </span>
      </div>

      <!-- Stats summary -->
      <div class="survey-results__stats">
        <div class="stat-card">
          <span class="stat-card__value">{{ totalSent }}</span>
          <span class="stat-card__label">Enviadas</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__value">{{ totalCompleted }}</span>
          <span class="stat-card__label">Completadas</span>
        </div>
        <div class="stat-card stat-card--highlight">
          <span class="stat-card__value">{{ responseRate }}%</span>
          <span class="stat-card__label">Tasa de respuesta</span>
        </div>
      </div>

      <!-- Per-question results -->
      <div class="survey-results__questions">
        <h2 class="survey-results__section-title">
          <i class="fa-solid fa-list-check" /> Respuestas por pregunta
        </h2>

        <div
          v-for="(q, idx) in survey.questions"
          :key="q.id"
          class="question-result"
        >
          <div class="question-result__header">
            <span class="question-result__num">P{{ idx + 1 }}</span>
            <span class="question-result__label">{{ q.label }}</span>
          </div>

          <div class="question-result__body">
            <!-- Text answers -->
            <template v-if="q.type === 'short_text' || q.type === 'long_text'">
              <div v-if="getTextAnswers(q.id).length === 0" class="question-result__empty">
                Sin respuestas.
              </div>
              <div v-else class="question-result__text-list">
                <div
                  v-for="(ans, i) in getTextAnswers(q.id)"
                  :key="i"
                  class="question-result__text-item"
                >
                  "{{ ans }}"
                </div>
              </div>
            </template>

            <!-- Option distribution: multiple_choice, checkbox, dropdown -->
            <template v-else-if="['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)">
              <div class="question-result__bar-list">
                <div
                  v-for="opt in getOptionDistribution(q)"
                  :key="opt.label"
                  class="question-result__bar-row"
                >
                  <span class="question-result__bar-label">{{ opt.label }}</span>
                  <div class="question-result__bar-track">
                    <div
                      class="question-result__bar-fill"
                      :style="{ width: opt.pct + '%' }"
                    />
                  </div>
                  <span class="question-result__bar-pct">{{ opt.pct }}% ({{ opt.count }})</span>
                </div>
              </div>
            </template>

            <!-- Rating: average + distribution -->
            <template v-else-if="q.type === 'rating'">
              <p class="question-result__avg">Promedio: <strong>{{ getAverage(q.id) }}</strong></p>
              <div class="question-result__bar-list">
                <div
                  v-for="n in (q.max ?? 5)"
                  :key="n"
                  class="question-result__bar-row"
                >
                  <span class="question-result__bar-label">{{ n }}</span>
                  <div class="question-result__bar-track">
                    <div
                      class="question-result__bar-fill"
                      :style="{ width: (getAnswersForQuestion(q.id).filter(v => v === n).length / (responses.length || 1) * 100) + '%' }"
                    />
                  </div>
                  <span class="question-result__bar-pct">{{ getAnswersForQuestion(q.id).filter(v => v === n).length }}</span>
                </div>
              </div>
            </template>

            <!-- NPS -->
            <template v-else-if="q.type === 'nps'">
              <p class="question-result__avg">Promedio: <strong>{{ getAverage(q.id) }}</strong></p>
              <div class="question-result__nps-grid">
                <div
                  v-for="item in getNpsDistribution(q.id)"
                  :key="item.score"
                  class="question-result__nps-cell"
                  :class="{
                    'question-result__nps-cell--detractor': item.score <= 6,
                    'question-result__nps-cell--passive': item.score >= 7 && item.score <= 8,
                    'question-result__nps-cell--promoter': item.score >= 9,
                  }"
                >
                  <span class="question-result__nps-score">{{ item.score }}</span>
                  <span class="question-result__nps-count">{{ item.count }}</span>
                </div>
              </div>
            </template>

            <!-- Yes/No -->
            <template v-else-if="q.type === 'yes_no'">
              <div class="question-result__yesno">
                <div class="question-result__bar-row">
                  <span class="question-result__bar-label">Sí</span>
                  <div class="question-result__bar-track">
                    <div
                      class="question-result__bar-fill question-result__bar-fill--yes"
                      :style="{ width: getYesNoStats(q.id).yesPct + '%' }"
                    />
                  </div>
                  <span class="question-result__bar-pct">{{ getYesNoStats(q.id).yesPct }}% ({{ getYesNoStats(q.id).yes }})</span>
                </div>
                <div class="question-result__bar-row">
                  <span class="question-result__bar-label">No</span>
                  <div class="question-result__bar-track">
                    <div
                      class="question-result__bar-fill question-result__bar-fill--no"
                      :style="{ width: getYesNoStats(q.id).noPct + '%' }"
                    />
                  </div>
                  <span class="question-result__bar-pct">{{ getYesNoStats(q.id).noPct }}% ({{ getYesNoStats(q.id).no }})</span>
                </div>
              </div>
            </template>

            <!-- Date -->
            <template v-else-if="q.type === 'date'">
              <div class="question-result__text-list">
                <div
                  v-for="(val, i) in getAnswersForQuestion(q.id)"
                  :key="i"
                  class="question-result__text-item"
                >
                  {{ val }}
                </div>
              </div>
              <div v-if="getAnswersForQuestion(q.id).length === 0" class="question-result__empty">
                Sin respuestas.
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Assignments table -->
      <div class="survey-results__assignments">
        <h2 class="survey-results__section-title">
          <i class="fa-solid fa-users" /> Destinatarios
        </h2>
        <div class="survey-results__table-wrap">
          <table class="survey-results__table">
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Estado</th>
                <th>Enviada</th>
                <th>Completada</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in assignments" :key="a._id">
                <td>{{ a.recipientId }}</td>
                <td>
                  <span
                    class="survey-results__status-badge survey-results__status-badge--sm"
                    :class="a.status === 'completed' ? 'survey-results__status-badge--active' : 'survey-results__status-badge--draft'"
                  >
                    {{ a.status === 'completed' ? 'Completada' : 'Pendiente' }}
                  </span>
                </td>
                <td>{{ formatDate(a.sentAt) }}</td>
                <td>{{ a.completedAt ? formatDate(a.completedAt) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.survey-results {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  width: 100%;
  max-width: 1100px;

  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
  }

  &__back {
    background: none;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    padding: 0.45rem 0.9rem;
    color: $primary-dark;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &:hover { border-color: $primary; color: $primary; }
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 800;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.6rem;

    i { color: $primary; }
  }

  &__loading {
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 2rem;
  }

  &__error {
    color: $alert-error;
    background: $alert-error-bg;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  &__survey-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 14px;
    padding: 1.5rem;
  }

  &__survey-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__survey-desc {
    margin-top: 0.35rem;
    font-size: 0.9rem;
    color: $text-secondary;
  }

  &__status-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
    flex-shrink: 0;

    &--draft { background: rgba($text-secondary, 0.12); color: $text-secondary; }
    &--active { background: $alert-success-bg; color: $alert-success; }
    &--closed { background: $alert-error-bg; color: $alert-error; }

    &--sm { font-size: 0.72rem; padding: 0.2rem 0.6rem; }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  &__questions {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;

    i { color: $primary; }
  }

  &__assignments {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;

    th {
      background: $primary-light;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 700;
      color: $primary-dark;
      font-size: 0.8rem;
    }

    td {
      padding: 0.75rem 1rem;
      color: $primary-dark;
      border-top: 1px solid rgba($primary-dark, 0.06);
    }

    tr:hover td { background: rgba($primary, 0.02); }
  }
}

.stat-card {
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  text-align: center;

  &__value {
    font-size: 2rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__label {
    font-size: 0.82rem;
    color: $text-secondary;
    font-weight: 500;
  }

  &--highlight &__value { color: $primary; }
}

.question-result {
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.25rem;
    background: $primary-light;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &__num {
    font-size: 0.78rem;
    font-weight: 700;
    color: $primary;
    background: rgba($primary, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    flex-shrink: 0;
  }

  &__label {
    font-size: 0.95rem;
    font-weight: 600;
    color: $primary-dark;
  }

  &__body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__empty {
    color: $text-secondary;
    font-size: 0.88rem;
    font-style: italic;
  }

  &__text-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__text-item {
    background: $primary-light;
    border-left: 3px solid rgba($primary, 0.3);
    padding: 0.6rem 0.9rem;
    border-radius: 0 6px 6px 0;
    font-size: 0.9rem;
    color: $primary-dark;
    font-style: italic;
  }

  &__bar-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__bar-label {
    width: 120px;
    font-size: 0.85rem;
    color: $primary-dark;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bar-track {
    flex: 1;
    height: 12px;
    background: rgba($primary-dark, 0.07);
    border-radius: 6px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: $primary;
    border-radius: 6px;
    transition: width 0.4s ease;
    min-width: 2px;

    &--yes { background: $BAKANO-GREEN; }
    &--no { background: $alert-error; }
  }

  &__bar-pct {
    width: 80px;
    font-size: 0.82rem;
    color: $text-secondary;
    text-align: right;
    flex-shrink: 0;
  }

  &__avg {
    font-size: 0.9rem;
    color: $text-secondary;

    strong { color: $primary-dark; font-size: 1.1rem; }
  }

  &__nps-grid {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  &__nps-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.5rem 0.4rem;
    border-radius: 8px;
    min-width: 2.5rem;
    text-align: center;

    &--detractor { background: rgba($alert-error, 0.08); }
    &--passive { background: rgba($alert-warning, 0.08); }
    &--promoter { background: rgba($BAKANO-GREEN, 0.08); }
  }

  &__nps-score {
    font-size: 0.8rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__nps-count {
    font-size: 1rem;
    font-weight: 700;
    color: $primary-dark;
  }
}
</style>
