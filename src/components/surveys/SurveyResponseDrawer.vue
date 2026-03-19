<script setup lang="ts">
import type { ISurveyAssignment, ISurveyResponse, ISurvey, IQuestion } from '@/types/survey'

const props = defineProps({
  assignment: {
    type: Object as () => ISurveyAssignment,
    required: true,
  },
  response: {
    type: Object as () => ISurveyResponse | null,
    default: null,
  },
  survey: {
    type: Object as () => ISurvey,
    required: true,
  },
})

const emit = defineEmits<{ (e: 'close'): void }>()

// ── Helpers ──────────────────────────────────────────────
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function getAnswerValue(questionId: string): any {
  if (!props.response) return null
  return props.response.answers.find(a => a.questionId === questionId)?.value ?? null
}

function hasAnswer(questionId: string): boolean {
  const val = getAnswerValue(questionId)
  if (val === null || val === undefined) return false
  if (val === '') return false
  if (Array.isArray(val) && val.length === 0) return false
  return true
}

function formatTextAnswer(q: IQuestion): string {
  const val = getAnswerValue(q.id)
  if (!hasAnswer(q.id)) return 'Sin respuesta'
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}
</script>

<template>
  <div class="rdr__overlay" @click.self="emit('close')">
    <div class="rdr">
      <!-- Header -->
      <div class="rdr__header">
        <div class="rdr__avatar">
          {{ recipientName(assignment).charAt(0).toUpperCase() }}
        </div>
        <div class="rdr__who">
          <h3 class="rdr__name">{{ recipientName(assignment) }}</h3>
          <p class="rdr__sub">
            {{ recipientEmail(assignment) }}
            <span v-if="assignment.completedAt"> · Completada {{ formatDate(assignment.completedAt!) }}</span>
          </p>
        </div>
        <button class="rdr__close" @click="emit('close')">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <!-- Body -->
      <div class="rdr__body">
        <!-- No response found -->
        <div v-if="!response" class="rdr__no-response">
          <i class="fa-solid fa-circle-exclamation" />
          <span>No se encontró la respuesta para este destinatario.</span>
        </div>

        <!-- Q&A list -->
        <template v-else>
          <div
            v-for="(q, idx) in survey.questions"
            :key="q.id"
            class="rdr__qa"
          >
            <!-- Question -->
            <div class="rdr__question">
              <span class="rdr__qnum">P{{ idx + 1 }}</span>
              <span class="rdr__qlabel">{{ q.label }}</span>
            </div>

            <!-- Answer -->
            <div class="rdr__answer">
              <!-- No answer -->
              <span v-if="!hasAnswer(q.id)" class="rdr__ans-empty">
                <i class="fa-solid fa-minus" /> Sin respuesta
              </span>

              <!-- Yes/No -->
              <div v-else-if="q.type === 'yes_no'" class="rdr__ans-yesno" :class="getAnswerValue(q.id) ? 'rdr__ans-yesno--yes' : 'rdr__ans-yesno--no'">
                <i :class="getAnswerValue(q.id) ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'" />
                <span>{{ getAnswerValue(q.id) ? 'Sí' : 'No' }}</span>
              </div>

              <!-- Rating / NPS -->
              <div v-else-if="q.type === 'rating' || q.type === 'nps'" class="rdr__ans-score">
                <div class="rdr__ans-score-badge">
                  <i class="fa-solid fa-star rdr__ans-score-star" />
                  <span class="rdr__ans-score-val">{{ getAnswerValue(q.id) }}</span>
                </div>
                <span class="rdr__ans-score-range">
                  / {{ q.type === 'nps' ? 10 : (q.max ?? 5) }}
                </span>
              </div>

              <!-- Array (chips) -->
              <div v-else-if="Array.isArray(getAnswerValue(q.id))" class="rdr__ans-chips">
                <span
                  v-for="v in getAnswerValue(q.id)"
                  :key="v"
                  class="rdr__chip"
                >{{ v }}</span>
              </div>

              <!-- Text / Date / Other -->
              <p v-else class="rdr__ans-text">{{ formatTextAnswer(q) }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ── Overlay ────────────────────────────────────────────────
.rdr__overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(#0a192f, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

// ── Panel ──────────────────────────────────────────────────
.rdr {
  width: 100%;
  max-width: 560px;
  height: 100vh;
  background: $white;
  box-shadow: -10px 0 50px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Header ─────────────────────────────────────────────────
.rdr__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba($primary-dark, 0.08);
  background: $primary-light;
}

.rdr__avatar {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
  background: $primary;
  color: $white;
  font-size: 1.15rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba($primary, 0.28);
}

.rdr__who {
  flex: 1;
  min-width: 0;
}

.rdr__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rdr__sub {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rdr__close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  flex-shrink: 0;
  background: rgba($primary-dark, 0.08);
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: rgba($primary-dark, 0.15); }
}

// ── Body ───────────────────────────────────────────────────
.rdr__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba($primary-dark, 0.12); border-radius: 4px; }
}

.rdr__no-response {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: $text-secondary;
  font-size: 0.9rem;
  text-align: center;
  i { font-size: 2rem; color: $alert-warning; }
}

// ── Q&A Card ───────────────────────────────────────────────
.rdr__qa {
  // Simple column layout: question above, answer below
  display: flex;
  flex-direction: column;
  border: 1px solid rgba($primary-dark, 0.09);
  border-radius: 12px;
  overflow: visible; // IMPORTANT: never hide overflow here
  background: $white;
  box-shadow: 0 1px 4px rgba($primary-dark, 0.04);
}

// ── Question ───────────────────────────────────────────────
.rdr__question {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: rgba($primary-light, 0.7);
  border-bottom: 1px solid rgba($primary-dark, 0.07);
  // No overflow, no clip — question text wraps naturally
}

.rdr__qnum {
  font-size: 0.65rem;
  font-weight: 800;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
  margin-top: 2px;
  line-height: 1.4;
}

.rdr__qlabel {
  font-size: 0.9rem;
  font-weight: 600;
  color: $primary-dark;
  line-height: 1.5;
  flex: 1;
  // Allow wrapping — never truncate
}

// ── Answer ─────────────────────────────────────────────────
.rdr__answer {
  padding: 0.9rem 1rem;
  background: $white;
  // Block layout — content determines height, never clips
  display: block;
}

.rdr__ans-empty {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-style: italic;
  color: $text-secondary;
  i { color: rgba($primary-dark, 0.2); }
}

.rdr__ans-yesno {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;

  &--yes {
    color: $BAKANO-GREEN;
    background: rgba($BAKANO-GREEN, 0.08);
  }
  &--no {
    color: $alert-error;
    background: rgba($alert-error, 0.08);
  }

  i { font-size: 1rem; }
}

.rdr__ans-score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rdr__ans-score-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: $primary-light;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba($primary-dark, 0.07);
}

.rdr__ans-score-star {
  color: #f59e0b;
  font-size: 1rem;
}

.rdr__ans-score-val {
  font-size: 1.5rem;
  font-weight: 900;
  color: $primary-dark;
  line-height: 1;
}

.rdr__ans-score-range {
  font-size: 0.9rem;
  color: $text-secondary;
  font-weight: 500;
}

.rdr__ans-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.rdr__chip {
  background: rgba($primary, 0.08);
  color: $primary;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
}

.rdr__ans-text {
  margin: 0;
  font-size: 0.9rem;
  color: $primary-dark;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
