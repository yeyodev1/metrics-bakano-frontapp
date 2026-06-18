<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { surveyService } from '@/services/survey.service'
import type { ISurvey } from '@/types/survey'

const surveys = ref<ISurvey[]>([])
const isLoading = ref(false)
const surveyFilterStatus = ref<'all' | 'draft' | 'active' | 'closed'>('all')

const filteredDashboardSurveys = computed(() => {
  if (surveyFilterStatus.value === 'all') return surveys.value
  return surveys.value.filter(s => s.status === surveyFilterStatus.value)
})

async function fetchDashboardSurveys(): Promise<void> {
  isLoading.value = true
  try {
    const { surveys: data } = await surveyService.listSurveys()
    surveys.value = data
  } catch {
    // Fail silently
  } finally {
    isLoading.value = false
  }
}

function surveyCreatorName(survey: ISurvey): string {
  if (typeof survey.createdBy === 'object' && survey.createdBy !== null) {
    return (survey.createdBy as any).name || (survey.createdBy as any).email
  }
  return '—'
}

function formatSurveyDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(fetchDashboardSurveys)
</script>

<template>
  <div class="superadmin-dashboard__surveys">
    <div class="superadmin-dashboard__surveys-header">
      <div class="superadmin-dashboard__surveys-notice">
        <i class="fa-solid fa-earth-americas" />
        <span>Las encuestas son <strong>globales</strong> — no están vinculadas a ningún entorno ni cliente específico.</span>
      </div>
      <div class="superadmin-dashboard__surveys-filters">
        <button
          v-for="f in [{ key: 'all', label: 'Todas' }, { key: 'draft', label: 'Borrador' }, { key: 'active', label: 'Activas' }, { key: 'closed', label: 'Cerradas' }]"
          :key="f.key"
          class="superadmin-dashboard__surveys-filter-btn"
          :class="{ 'superadmin-dashboard__surveys-filter-btn--active': surveyFilterStatus === f.key }"
          @click="surveyFilterStatus = f.key as any"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="superadmin-dashboard__surveys-list">
      <div v-for="n in 5" :key="n" class="superadmin-dashboard__survey-card superadmin-dashboard__survey-card--skeleton">
        <div class="superadmin-dashboard__survey-card-left">
          <div class="skeleton-block skeleton-block--status"></div>
          <div class="superadmin-dashboard__survey-info">
            <div class="skeleton-block skeleton-block--title"></div>
            <div class="skeleton-block skeleton-block--meta"></div>
          </div>
        </div>
        <div class="superadmin-dashboard__survey-actions">
          <div class="skeleton-block skeleton-block--action"></div>
          <div class="skeleton-block skeleton-block--action"></div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredDashboardSurveys.length === 0" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-state-icon">
        <i class="fa-solid fa-clipboard-list" />
      </div>
      <h4 class="superadmin-dashboard__empty-state-title">No hay encuestas</h4>
      <p class="superadmin-dashboard__empty-state-desc">Crea una nueva encuesta para comenzar.</p>
      <RouterLink :to="{ name: 'SurveyNew' }" class="superadmin-dashboard__btn-primary">
        <i class="fa-solid fa-plus" /> Nueva encuesta
      </RouterLink>
    </div>

    <div v-else class="superadmin-dashboard__surveys-list">
      <div
        v-for="survey in filteredDashboardSurveys"
        :key="survey._id"
        class="superadmin-dashboard__survey-card"
      >
        <div class="superadmin-dashboard__survey-card-left">
          <span
            class="superadmin-dashboard__survey-status"
            :class="`superadmin-dashboard__survey-status--${survey.status}`"
          >
            {{ survey.status === 'draft' ? 'Borrador' : survey.status === 'active' ? 'Activa' : 'Cerrada' }}
          </span>
          <div class="superadmin-dashboard__survey-info">
            <span class="superadmin-dashboard__survey-title">{{ survey.title }}</span>
            <span class="superadmin-dashboard__survey-meta">
              {{ survey.questions.length }} preguntas · Creada por {{ surveyCreatorName(survey) }} · {{ formatSurveyDate(survey.createdAt) }}
            </span>
          </div>
        </div>
        <div class="superadmin-dashboard__survey-actions">
          <RouterLink
            v-if="survey.status === 'draft'"
            :to="{ name: 'SurveyEdit', params: { surveyId: survey._id } }"
            class="superadmin-dashboard__action-btn"
            title="Editar"
          >
            <i class="fa-solid fa-pen-to-square" />
          </RouterLink>
          <RouterLink
            :to="{ name: 'SurveyResults', params: { surveyId: survey._id } }"
            class="superadmin-dashboard__action-btn"
            title="Ver resultados"
          >
            <i class="fa-solid fa-chart-bar" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__surveys {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.superadmin-dashboard__surveys-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.superadmin-dashboard__surveys-notice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba($primary, 0.06);
  border: 1px solid rgba($primary, 0.15);
  border-radius: 10px;
  font-size: 0.875rem;
  color: $primary-dark;
  i { color: $primary; font-size: 1rem; flex-shrink: 0; }
}

.superadmin-dashboard__surveys-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.superadmin-dashboard__surveys-filter-btn {
  padding: 0.45rem 1rem;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 100px;
  background: $white;
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: $primary; color: $primary; }
  &--active { background: $primary; border-color: $primary; color: $white; }
}

.superadmin-dashboard__surveys-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.superadmin-dashboard__survey-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.06);
  border-radius: 12px;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    border-color: rgba($primary, 0.15);
    box-shadow: 0 4px 16px rgba($primary-dark, 0.04);
  }
}

.superadmin-dashboard__survey-card-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.superadmin-dashboard__survey-status {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.7rem;
  border-radius: 100px;
  &--draft { background: rgba($text-secondary, 0.1); color: $text-secondary; }
  &--active { background: rgba($alert-success, 0.1); color: $alert-success; }
  &--closed { background: rgba($alert-error, 0.08); color: $alert-error; }
}

.superadmin-dashboard__survey-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.superadmin-dashboard__survey-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__survey-meta {
  font-size: 0.78rem;
  color: $text-secondary;
}

.superadmin-dashboard__survey-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.superadmin-dashboard__survey-card--skeleton {
  cursor: default;
  pointer-events: none;
  border-color: rgba($primary-dark, 0.04);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, rgba($white, 0) 0, rgba($white, 0.3) 50%, rgba($white, 0) 100%);
    animation: shimmer 2s infinite;
  }
}

.skeleton-block {
  background: rgba($primary-dark, 0.05);
  border-radius: 4px;
  &--status { width: 60px; height: 18px; border-radius: 100px; flex-shrink: 0; }
  &--title { width: 220px; height: 16px; margin-bottom: 0.25rem; }
  &--meta { width: 350px; height: 12px; }
  &--action { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

.superadmin-dashboard__action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;

  &:hover { background: rgba($primary, 0.1); color: $primary; }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  height: 100%;
  color: $text-secondary;
}

.superadmin-dashboard__empty-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.1) 100%);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba($primary, 0.1);
}

.superadmin-dashboard__empty-state-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: $primary-dark;
  margin: 0 0 0.5rem;
}

.superadmin-dashboard__empty-state-desc {
  font-size: 0.95rem;
  max-width: 320px;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.superadmin-dashboard__btn-primary {
  background: $primary;
  color: $white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: box-shadow 0.2s, opacity 0.2s;
  text-decoration: none;

  &:hover { box-shadow: 0 4px 12px rgba($primary, 0.3); opacity: 0.95; }
}
</style>
