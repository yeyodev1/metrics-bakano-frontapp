<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import SurveyResponseDrawer from '@/components/surveys/SurveyResponseDrawer.vue'
import type { ISurvey, ISurveyAssignment, ISurveyResponse, IQuestion } from '@/types/survey'

const route = useRoute()
const router = useRouter()
const surveyId = route.params.surveyId as string

// ── State ────────────────────────────────────────────────────
const survey     = ref<ISurvey | null>(null)
const assignments = ref<ISurveyAssignment[]>([])
const responses   = ref<ISurveyResponse[]>([])
const isLoading   = ref(true)
const error       = ref('')

// ── Drawer ───────────────────────────────────────────────────
const selectedAssignment = ref<ISurveyAssignment | null>(null)

const selectedResponse = computed<ISurveyResponse | null>(() => {
  if (!selectedAssignment.value) return null
  return responses.value.find(r => r.assignmentId === selectedAssignment.value!._id) ?? null
})

function openResponse(a: ISurveyAssignment) {
  if (a.status !== 'completed') return
  selectedAssignment.value = a
}

function closeDrawer() {
  selectedAssignment.value = null
}

// ── Recipients table pagination ──────────────────────────────
const PAGE_SIZE    = 15
const currentPage  = ref(1)
const searchQuery  = ref('')
const statusFilter = ref<'all' | 'completed' | 'pending'>('all')

const filteredAssignments = computed(() => {
  let list = assignments.value
  if (statusFilter.value !== 'all') {
    list = list.filter(a => statusFilter.value === 'completed' ? a.status === 'completed' : a.status !== 'completed')
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => {
      const name  = recipientName(a).toLowerCase()
      const email = recipientEmail(a).toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssignments.value.length / PAGE_SIZE)))

const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredAssignments.value.slice(start, start + PAGE_SIZE)
})

function changePage(page: number) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

// Reset page on filter change
function onSearchChange() { currentPage.value = 1 }
function onStatusChange() { currentPage.value = 1 }

// ── Data fetching ─────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await surveyService.getSurveyResults(surveyId)
    survey.value      = res.survey
    assignments.value = res.assignments
    responses.value   = res.responses
  } catch (err: any) {
    error.value = err?.message || 'Error al cargar resultados.'
  } finally {
    isLoading.value = false
  }
})

// ── Computed stats ─────────────────────────────────────────────
const totalSent      = computed(() => assignments.value.length)
const totalCompleted = computed(() => assignments.value.filter(a => a.status === 'completed').length)
const responseRate   = computed(() =>
  totalSent.value ? Math.round((totalCompleted.value / totalSent.value) * 100) : 0,
)

// ── Helper functions ───────────────────────────────────────────
function recipientName(a: ISurveyAssignment): string {
  if (typeof a.recipientId === 'object' && a.recipientId !== null)
    return (a.recipientId as any).name || (a.recipientId as any).email || '—'
  return String(a.recipientId)
}

function recipientEmail(a: ISurveyAssignment): string {
  if (typeof a.recipientId === 'object' && a.recipientId !== null)
    return (a.recipientId as any).email || ''
  return ''
}

function senderName(a: ISurveyAssignment): string {
  if (typeof a.sentBy === 'object' && a.sentBy !== null)
    return (a.sentBy as any).name || (a.sentBy as any).email || '—'
  return String(a.sentBy || '—')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Aggregated question stats ──────────────────────────────────

function getAnswersForQuestion(questionId: string): any[] {
  return responses.value
    .map(r => r.answers.find(a => a.questionId === questionId))
    .filter(Boolean)
    .map(a => a!.value)
}

function getTextAnswers(questionId: string): string[] {
  return getAnswersForQuestion(questionId).filter(v => typeof v === 'string' && v.trim())
}

function getOptionDistribution(q: IQuestion): { label: string; count: number; pct: number }[] {
  const allAnswers = getAnswersForQuestion(q.id)
  const options    = q.options || []
  const total      = allAnswers.length || 1
  return options.map(opt => {
    const count = allAnswers.filter(a => Array.isArray(a) ? a.includes(opt) : a === opt).length
    return { label: opt, count, pct: Math.round((count / total) * 100) }
  })
}

function getAverage(questionId: string): string {
  const vals = getAnswersForQuestion(questionId).map(Number).filter(v => !isNaN(v))
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function getRatingRange(q: IQuestion): number[] {
  const min = Number(q.min ?? 1)
  const max = Number(q.max ?? 5)
  const arr: number[] = []
  for (let i = min; i <= max; i++) arr.push(i)
  return arr
}

function getRatingCount(questionId: string, n: number): number {
  return getAnswersForQuestion(questionId).filter(v => Number(v) === n).length
}

function getRatingPct(questionId: string, n: number): number {
  const total = responses.value.length || 1
  return Math.round((getRatingCount(questionId, n) / total) * 100)
}

function getNpsDistribution(questionId: string): { score: number; count: number }[] {
  const vals = getAnswersForQuestion(questionId)
  return Array.from({ length: 11 }, (_, i) => ({
    score: i,
    count: vals.filter(v => Number(v) === i).length,
  }))
}

function getYesNoStats(questionId: string) {
  const vals  = getAnswersForQuestion(questionId)
  const yes   = vals.filter(v => v === true).length
  const no    = vals.filter(v => v === false).length
  const total = yes + no || 1
  return { yes, no, yesPct: Math.round((yes / total) * 100), noPct: Math.round((no / total) * 100) }
}
</script>

<template>
  <div class="sr">
    <!-- Header -->
    <div class="sr__header">
      <button class="sr__back" @click="router.push({ name: 'SurveyList' })">
        <i class="fa-solid fa-arrow-left" /> Volver
      </button>
      <h1 class="sr__title">
        <i class="fa-solid fa-chart-bar" /> Resultados
      </h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="sr__loading">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando resultados...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="sr__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>

    <template v-else-if="survey">
      <!-- Survey Meta -->
      <div class="sr__meta">
        <div class="sr__meta-text">
          <h2 class="sr__meta-title">{{ survey.title }}</h2>
          <p v-if="survey.description" class="sr__meta-desc">{{ survey.description }}</p>
        </div>
        <span class="sr__badge" :class="`sr__badge--${survey.status}`">
          {{ survey.status === 'draft' ? 'Borrador' : survey.status === 'active' ? 'Activa' : 'Cerrada' }}
        </span>
      </div>

      <!-- Stats -->
      <div class="sr__stats">
        <div class="stat-card">
          <i class="fa-solid fa-paper-plane stat-card__icon" />
          <span class="stat-card__value">{{ totalSent }}</span>
          <span class="stat-card__label">Enviadas</span>
        </div>
        <div class="stat-card">
          <i class="fa-solid fa-circle-check stat-card__icon stat-card__icon--green" />
          <span class="stat-card__value">{{ totalCompleted }}</span>
          <span class="stat-card__label">Completadas</span>
        </div>
        <div class="stat-card stat-card--highlight">
          <i class="fa-solid fa-chart-pie stat-card__icon stat-card__icon--primary" />
          <span class="stat-card__value">{{ responseRate }}%</span>
          <span class="stat-card__label">Tasa de respuesta</span>
          <div class="stat-card__bar-wrap">
            <div class="stat-card__bar" :style="{ width: responseRate + '%' }" />
          </div>
        </div>
      </div>

      <!-- Per-question results -->
      <section class="sr__section">
        <h2 class="sr__section-title">
          <i class="fa-solid fa-list-check" /> Respuestas por pregunta
        </h2>

        <div class="sr__questions">
          <div v-for="(q, idx) in survey.questions" :key="q.id" class="qr">
            <div class="qr__header">
              <span class="qr__num">P{{ idx + 1 }}</span>
              <span class="qr__label">{{ q.label }}</span>
              <span class="qr__type-badge">{{ q.type }}</span>
            </div>

            <div class="qr__body">
              <!-- Short / Long text -->
              <template v-if="q.type === 'short_text' || q.type === 'long_text'">
                <p v-if="getTextAnswers(q.id).length === 0" class="qr__empty">Sin respuestas.</p>
                <div v-else class="qr__text-list">
                  <div v-for="(ans, i) in getTextAnswers(q.id)" :key="i" class="qr__text-item">
                    <i class="fa-solid fa-quote-left qr__text-icon" />
                    {{ ans }}
                  </div>
                </div>
              </template>

              <!-- Multiple choice / Checkbox / Dropdown -->
              <template v-else-if="['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)">
                <div class="qr__bar-list">
                  <div v-for="opt in getOptionDistribution(q)" :key="opt.label" class="qr__bar-row">
                    <span class="qr__bar-label" :title="opt.label">{{ opt.label }}</span>
                    <div class="qr__bar-track">
                      <div class="qr__bar-fill" :style="{ width: opt.pct + '%' }" />
                    </div>
                    <span class="qr__bar-meta">{{ opt.pct }}% <em>({{ opt.count }})</em></span>
                  </div>
                </div>
              </template>

              <!-- Rating -->
              <template v-else-if="q.type === 'rating'">
                <div class="qr__avg-row">
                  <span class="qr__avg-label">Promedio</span>
                  <strong class="qr__avg-value">{{ getAverage(q.id) }}</strong>
                  <span class="qr__avg-range">/ {{ q.max ?? 5 }}</span>
                </div>
                <div class="qr__bar-list">
                  <div v-for="n in getRatingRange(q)" :key="n" class="qr__bar-row">
                    <span class="qr__bar-label">
                      <i class="fa-solid fa-star qr__star" /> {{ n }}
                    </span>
                    <div class="qr__bar-track">
                      <div class="qr__bar-fill" :style="{ width: getRatingPct(q.id, n) + '%' }" />
                    </div>
                    <span class="qr__bar-meta">{{ getRatingCount(q.id, n) }} resp.</span>
                  </div>
                </div>
              </template>

              <!-- NPS -->
              <template v-else-if="q.type === 'nps'">
                <div class="qr__avg-row">
                  <span class="qr__avg-label">Promedio NPS</span>
                  <strong class="qr__avg-value">{{ getAverage(q.id) }}</strong>
                  <span class="qr__avg-range">/ 10</span>
                </div>
                <div class="qr__nps-grid">
                  <div
                    v-for="item in getNpsDistribution(q.id)"
                    :key="item.score"
                    class="qr__nps-cell"
                    :class="{
                      'qr__nps-cell--detractor': item.score <= 6,
                      'qr__nps-cell--passive':   item.score >= 7 && item.score <= 8,
                      'qr__nps-cell--promoter':  item.score >= 9,
                    }"
                  >
                    <span class="qr__nps-score">{{ item.score }}</span>
                    <span class="qr__nps-count">{{ item.count }}</span>
                  </div>
                </div>
              </template>

              <!-- Yes / No -->
              <template v-else-if="q.type === 'yes_no'">
                <div class="qr__yesno">
                  <div class="qr__yesno-item qr__yesno-item--yes">
                    <i class="fa-solid fa-circle-check" />
                    <span class="qr__yesno-label">Sí</span>
                    <div class="qr__bar-track">
                      <div class="qr__bar-fill qr__bar-fill--yes" :style="{ width: getYesNoStats(q.id).yesPct + '%' }" />
                    </div>
                    <span class="qr__yesno-meta">{{ getYesNoStats(q.id).yesPct }}% ({{ getYesNoStats(q.id).yes }})</span>
                  </div>
                  <div class="qr__yesno-item qr__yesno-item--no">
                    <i class="fa-solid fa-circle-xmark" />
                    <span class="qr__yesno-label">No</span>
                    <div class="qr__bar-track">
                      <div class="qr__bar-fill qr__bar-fill--no" :style="{ width: getYesNoStats(q.id).noPct + '%' }" />
                    </div>
                    <span class="qr__yesno-meta">{{ getYesNoStats(q.id).noPct }}% ({{ getYesNoStats(q.id).no }})</span>
                  </div>
                </div>
              </template>

              <!-- Date -->
              <template v-else-if="q.type === 'date'">
                <p v-if="getAnswersForQuestion(q.id).length === 0" class="qr__empty">Sin respuestas.</p>
                <div v-else class="qr__text-list">
                  <div v-for="(val, i) in getAnswersForQuestion(q.id)" :key="i" class="qr__text-item">
                    <i class="fa-solid fa-calendar-day qr__text-icon" /> {{ val }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Recipients table -->
      <section class="sr__section">
        <div class="sr__section-head">
          <h2 class="sr__section-title">
            <i class="fa-solid fa-users" /> Destinatarios
            <span class="sr__section-count">({{ filteredAssignments.length }})</span>
          </h2>
          <div class="sr__table-controls">
            <div class="sr__search-wrap">
              <i class="fa-solid fa-magnifying-glass" />
              <input
                v-model="searchQuery"
                class="sr__search"
                placeholder="Buscar por nombre o email..."
                @input="onSearchChange"
              />
            </div>
            <select v-model="statusFilter" class="sr__filter" @change="onStatusChange">
              <option value="all">Todos</option>
              <option value="completed">Completadas</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>

        <div class="sr__table-wrap">
          <table class="sr__table">
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Enviada por</th>
                <th>Estado</th>
                <th>Enviada</th>
                <th>Completada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in paginatedAssignments"
                :key="a._id"
                :class="{ 'sr__row--clickable': a.status === 'completed' }"
                @click="openResponse(a)"
              >
                <td>
                  <div class="sr__recipient">
                    <div class="sr__recipient-avatar">{{ recipientName(a).charAt(0).toUpperCase() }}</div>
                    <div class="sr__recipient-info">
                      <span class="sr__recipient-name">{{ recipientName(a) }}</span>
                      <span v-if="recipientEmail(a)" class="sr__recipient-email">{{ recipientEmail(a) }}</span>
                    </div>
                  </div>
                </td>
                <td class="sr__cell-secondary">{{ senderName(a) }}</td>
                <td>
                  <span
                    class="sr__badge sr__badge--sm"
                    :class="a.status === 'completed' ? 'sr__badge--active' : 'sr__badge--draft'"
                  >
                    {{ a.status === 'completed' ? 'Completada' : 'Pendiente' }}
                  </span>
                </td>
                <td class="sr__cell-secondary">{{ formatDate(a.sentAt) }}</td>
                <td class="sr__cell-secondary">{{ a.completedAt ? formatDate(a.completedAt) : '—' }}</td>
                <td>
                  <span v-if="a.status === 'completed'" class="sr__view-hint">
                    <i class="fa-solid fa-eye" /> Ver
                  </span>
                </td>
              </tr>
              <tr v-if="paginatedAssignments.length === 0">
                <td colspan="6" class="sr__table-empty">No hay resultados para los filtros aplicados.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="sr__pagination">
          <button class="sr__page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
            <i class="fa-solid fa-chevron-left" />
          </button>
          <span class="sr__page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="sr__page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
            <i class="fa-solid fa-chevron-right" />
          </button>
        </div>
      </section>
    </template>

    <!-- Individual response drawer -->
    <Transition name="drawer">
      <SurveyResponseDrawer
        v-if="selectedAssignment && survey"
        :assignment="selectedAssignment"
        :response="selectedResponse"
        :survey="survey"
        @close="closeDrawer"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
// ─────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────
.sr {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 1100px;

  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
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
    display: flex; align-items: center; gap: 0.6rem;
    padding: 3rem; color: $text-secondary;
  }

  &__error {
    color: $alert-error; background: $alert-error-bg;
    border-radius: 10px; padding: 1rem 1.2rem;
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.9rem;
  }
}

// ─────────────────────────────────────────────────────────
// Survey meta
// ─────────────────────────────────────────────────────────
.sr__meta {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 1.5rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  box-shadow: 0 4px 20px rgba($primary-dark, 0.04);
  border-radius: 16px;
  padding: 1.75rem;

  &-title { font-size: 1.25rem; font-weight: 800; color: $primary-dark; }
  &-desc  { margin-top: 0.35rem; font-size: 0.9rem; color: $text-secondary; }
}

// ─────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────
.sr__badge {
  font-size: 0.75rem; font-weight: 700;
  padding: 0.3rem 0.8rem; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.03em;
  white-space: nowrap; flex-shrink: 0;

  &--draft  { background: rgba($text-secondary, 0.12); color: $text-secondary; }
  &--active { background: $alert-success-bg; color: $alert-success; }
  &--closed { background: $alert-error-bg; color: $alert-error; }
  &--sm     { font-size: 0.72rem; padding: 0.2rem 0.6rem; }
}

// ─────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────
.sr__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex; flex-direction: column; align-items: center;
  gap: 0.4rem; text-align: center;
  box-shadow: 0 4px 15px rgba($primary-dark, 0.02);
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba($primary-dark, 0.05); }

  &__icon {
    font-size: 1.1rem; color: $text-secondary; margin-bottom: 0.25rem;
    &--green   { color: $BAKANO-GREEN; }
    &--primary { color: $primary; }
  }

  &__value {
    font-size: 2.25rem; font-weight: 900; color: $primary-dark;
    letter-spacing: -0.02em; line-height: 1;
  }

  &__label {
    font-size: 0.8rem; color: $text-secondary; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  &__bar-wrap {
    width: 100%; height: 4px; background: rgba($primary, 0.12);
    border-radius: 4px; overflow: hidden; margin-top: 0.5rem;
  }
  &__bar { height: 100%; background: $primary; border-radius: 4px; transition: width 0.6s ease; }

  &--highlight .stat-card__value { color: $primary; }
}

// ─────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────
.sr__section {
  display: flex; flex-direction: column; gap: 1rem;

  &-head {
    display: flex; align-items: center;
    justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  }

  &-title {
    font-size: 1.05rem; font-weight: 700; color: $primary-dark;
    display: flex; align-items: center; gap: 0.5rem;
    i { color: $primary; }
  }

  &-count { font-size: 0.85rem; color: $text-secondary; font-weight: 500; }
}

// ─────────────────────────────────────────────────────────
// Table controls
// ─────────────────────────────────────────────────────────
.sr__table-controls {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}

.sr__search-wrap {
  display: flex; align-items: center; gap: 0.5rem;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 8px; padding: 0.4rem 0.75rem;
  background: $white;
  i { color: $text-secondary; font-size: 0.8rem; }
}

.sr__search {
  border: none; outline: none; font-size: 0.85rem;
  color: $primary-dark; width: 200px; background: transparent;
  &::placeholder { color: $text-secondary; }
}

.sr__filter {
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 8px; padding: 0.45rem 0.75rem;
  font-size: 0.85rem; color: $primary-dark;
  background: $white; outline: none; cursor: pointer;
}

// ─────────────────────────────────────────────────────────
// Recipients table
// ─────────────────────────────────────────────────────────
.sr__table-wrap {
  overflow-x: auto;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  background: $white;
}

.sr__table {
  width: 100%; border-collapse: collapse;

  th {
    background: $primary-light;
    padding: 0.9rem 1.1rem;
    text-align: left; font-weight: 800; color: $primary-dark;
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em;
  }

  td {
    padding: 0.9rem 1.1rem; color: $primary-dark;
    border-top: 1px solid rgba($primary-dark, 0.05);
    font-size: 0.88rem; vertical-align: middle;
  }
}

.sr__row--clickable {
  cursor: pointer; transition: background 0.15s;
  &:hover td { background: rgba($primary, 0.025) !important; }
}

.sr__recipient {
  display: flex; align-items: center; gap: 0.65rem;
  &-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba($primary, 0.1); color: $primary;
    font-size: 0.82rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  &-info { display: flex; flex-direction: column; gap: 0.05rem; }
  &-name  { font-weight: 700; font-size: 0.88rem; color: $primary-dark; }
  &-email { font-size: 0.75rem; color: $text-secondary; }
}

.sr__cell-secondary { font-size: 0.82rem; color: $text-secondary; }

.sr__view-hint {
  font-size: 0.75rem; font-weight: 700; color: $primary;
  display: flex; align-items: center; gap: 0.3rem; opacity: 0.6;
  .sr__row--clickable:hover & { opacity: 1; }
}

.sr__table-empty {
  text-align: center; padding: 2rem !important;
  color: $text-secondary; font-size: 0.9rem; font-style: italic;
}

// ─────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────
.sr__pagination {
  display: flex; align-items: center; justify-content: center; gap: 1rem;
}

.sr__page-btn {
  width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid rgba($primary-dark, 0.12);
  background: $white; color: $primary-dark; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-size: 0.8rem;
  &:hover:not(:disabled) { border-color: $primary; color: $primary; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.sr__page-info { font-size: 0.85rem; color: $text-secondary; font-weight: 600; }

// ─────────────────────────────────────────────────────────
// Questions per-question result
// ─────────────────────────────────────────────────────────
.sr__questions {
  display: flex; flex-direction: column; gap: 1.25rem;
}

.qr {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 12px rgba($primary-dark, 0.03);

  &__header {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: $primary-light;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
  }

  &__num {
    font-size: 0.72rem; font-weight: 800; color: $primary;
    background: rgba($primary, 0.08); padding: 0.25rem 0.55rem;
    border-radius: 6px; flex-shrink: 0;
  }

  &__label { font-size: 0.95rem; font-weight: 600; color: $primary-dark; flex: 1; }

  &__type-badge {
    font-size: 0.65rem; font-weight: 700; color: $text-secondary;
    background: rgba($primary-dark, 0.05); padding: 0.2rem 0.5rem;
    border-radius: 6px; text-transform: uppercase; flex-shrink: 0;
  }

  &__body {
    padding: 1.25rem 1.5rem;
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  &__empty { color: $text-secondary; font-size: 0.88rem; font-style: italic; }

  // Text answers
  &__text-list { display: flex; flex-direction: column; gap: 0.5rem; }
  &__text-item {
    background: $primary-light;
    border-left: 3px solid rgba($primary, 0.35);
    padding: 0.7rem 1rem; border-radius: 0 8px 8px 0;
    font-size: 0.9rem; color: $primary-dark; display: flex; gap: 0.6rem;
  }
  &__text-icon { color: rgba($primary, 0.4); font-size: 0.75rem; margin-top: 3px; flex-shrink: 0; }

  // Bar chart
  &__bar-list { display: flex; flex-direction: column; gap: 0.55rem; }
  &__bar-row  { display: flex; align-items: center; gap: 0.75rem; }
  &__bar-label {
    width: 110px; font-size: 0.83rem; color: $primary-dark;
    flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  &__bar-track {
    flex: 1; height: 10px; background: rgba($primary-dark, 0.06);
    border-radius: 5px; overflow: hidden;
  }
  &__bar-fill {
    height: 100%; background: $primary; border-radius: 5px;
    transition: width 0.5s ease; min-width: 2px;
    &--yes { background: $BAKANO-GREEN; }
    &--no  { background: $alert-error; }
  }
  &__bar-meta { width: 90px; font-size: 0.8rem; color: $text-secondary; text-align: right; flex-shrink: 0; }
  &__star { color: #f59e0b; font-size: 0.75rem; }

  // Avg row
  &__avg-row {
    display: flex; align-items: baseline; gap: 0.4rem;
    padding: 0.5rem 0; border-bottom: 1px solid rgba($primary-dark, 0.06);
  }
  &__avg-label { font-size: 0.82rem; color: $text-secondary; }
  &__avg-value { font-size: 1.6rem; font-weight: 900; color: $primary-dark; }
  &__avg-range { font-size: 0.85rem; color: $text-secondary; }

  // NPS
  &__nps-grid { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  &__nps-cell {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.15rem; padding: 0.5rem 0.4rem;
    border-radius: 8px; min-width: 2.5rem; text-align: center;
    &--detractor { background: rgba($alert-error, 0.08); }
    &--passive   { background: rgba($alert-warning, 0.08); }
    &--promoter  { background: rgba($BAKANO-GREEN, 0.08); }
  }
  &__nps-score { font-size: 0.75rem; font-weight: 700; color: $primary-dark; }
  &__nps-count { font-size: 1.1rem; font-weight: 900; color: $primary-dark; }

  // Yes/No
  &__yesno { display: flex; flex-direction: column; gap: 0.65rem; }
  &__yesno-item {
    display: flex; align-items: center; gap: 0.75rem;
    i { font-size: 1rem; flex-shrink: 0; }
    &--yes i { color: $BAKANO-GREEN; }
    &--no  i { color: $alert-error; }
  }
  &__yesno-label { width: 24px; font-size: 0.85rem; font-weight: 700; color: $primary-dark; }
  &__yesno-meta  { width: 90px; font-size: 0.8rem; color: $text-secondary; text-align: right; flex-shrink: 0; }
}

// ─────────────────────────────────────────────────────────
// Response Drawer overlay
// ─────────────────────────────────────────────────────────
.sr__overlay {
  position: fixed; inset: 0; z-index: 1300;
  background: rgba(#0a192f, 0.5); backdrop-filter: blur(4px);
  display: flex; justify-content: flex-end; align-items: stretch;
}

.sr__drawer {
  width: 100%; max-width: 540px; height: 100vh;
  background: $white; box-shadow: -10px 0 50px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; overflow: hidden;

  &-header {
    flex-shrink: 0;
    display: flex; align-items: center; gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.08);
    background: $primary-light;
  }

  &-who {
    display: flex; align-items: center; gap: 0.9rem; flex: 1; min-width: 0;
  }

  &-who-info {
    min-width: 0;
    h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    p  { margin: 0; font-size: 0.75rem; color: $text-secondary; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  }

  &-avatar {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: $primary; color: $white;
    font-size: 1.1rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba($primary, 0.25);
  }

  &-close {
    width: 34px; height: 34px; border-radius: 50%; border: none; flex-shrink: 0;
    background: rgba($primary-dark, 0.08); color: $text-secondary; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
    &:hover { background: rgba($primary-dark, 0.14); }
  }

  &-body {
    flex: 1; min-height: 0;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex; flex-direction: column; gap: 0.75rem;

    // Custom scrollbar
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba($primary-dark, 0.12); border-radius: 4px; }
  }

  &-empty {
    display: flex; align-items: center; gap: 0.5rem;
    color: $text-secondary; font-size: 0.9rem;
    padding: 2rem; justify-content: center; text-align: center;
    flex-direction: column;
    i { font-size: 1.5rem; color: $alert-warning; }
  }
}

// ─────────────────────────────────────────────────────────
// Drawer Q&A cards
// ─────────────────────────────────────────────────────────
.dr__qa {
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px; overflow: hidden;
  background: $white;
}

.dr__q {
  display: flex; align-items: flex-start; gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: rgba($primary-light, 0.6);
  border-bottom: 1px solid rgba($primary-dark, 0.05);
}

.dr__qnum {
  font-size: 0.65rem; font-weight: 800; color: $primary;
  background: rgba($primary, 0.1); padding: 0.2rem 0.5rem;
  border-radius: 6px; flex-shrink: 0; margin-top: 2px;
}

.dr__qlabel {
  font-size: 0.9rem; font-weight: 600; color: $primary-dark;
  line-height: 1.45; flex: 1;
}

.dr__a {
  padding: 0.85rem 1rem;
  font-size: 0.9rem; color: $primary-dark; line-height: 1.6;
  background: $white;
  // Ensure minimum height so it's always visible
  min-height: 44px;
  display: flex; align-items: center;
}

.dr__a-empty {
  color: $text-secondary; font-style: italic; font-size: 0.85rem;
  display: flex; align-items: center; gap: 0.4rem;
  i { color: rgba($primary-dark, 0.2); }
}

.dr__a-yes {
  color: $BAKANO-GREEN; font-weight: 700;
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem;
}

.dr__a-no {
  color: $alert-error; font-weight: 700;
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem;
}

.dr__a-score {
  display: inline-flex; align-items: center; gap: 0.6rem;
  background: $primary-light;
  padding: 0.4rem 0.9rem; border-radius: 10px;
  i { color: #f59e0b; }
  strong { font-size: 1.4rem; font-weight: 900; color: $primary-dark; line-height: 1; }
}

.dr__a-range {
  font-size: 0.85rem; color: $text-secondary; font-weight: 500;
}

.dr__a-chips {
  display: flex; flex-wrap: wrap; gap: 0.4rem;
}

.dr__chip {
  background: rgba($primary, 0.08); color: $primary;
  font-size: 0.78rem; font-weight: 700;
  padding: 0.25rem 0.65rem; border-radius: 20px;
}

.dr__a-text {
  // Text answer - full width line
  display: block; word-break: break-word;
}

// ─────────────────────────────────────────────────────────
// Drawer transition
// ─────────────────────────────────────────────────────────
.drawer-enter-active { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s; }
.drawer-leave-active { transition: transform 0.22s ease-in, opacity 0.2s; }
.drawer-enter-from   { transform: translateX(100%); opacity: 0; }
.drawer-leave-to     { transform: translateX(100%); opacity: 0; }
</style>
