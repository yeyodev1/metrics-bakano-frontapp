<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import { useUserStore } from '@/stores/user'
import SurveySendModal from '@/components/surveys/SurveySendModal.vue'
import type { ISurvey } from '@/types/survey'

const router = useRouter()
const userStore = useUserStore()

const surveys = ref<ISurvey[]>([])
const isLoading = ref(true)
const error = ref('')
const filterStatus = ref<'all' | 'draft' | 'active' | 'closed'>('all')
const filterAssignment = ref<'all' | 'mine'>('mine')
const sendModalSurveyId = ref<string | null>(null)
const sendModalMode = ref<'clients' | 'internal'>('clients')
const sendResult = ref<{ sent: number; skipped: number } | null>(null)

// Delete confirmation modal
const deletingsurvey = ref<ISurvey | null>(null)
const deleteConfirmText = ref('')
const isDeleting = ref(false)
const DELETE_PHRASE = 'ELIMINAR PERMANENTEMENTE'

const isSuperadmin = computed(() => userStore.role === 'superadmin')
const canViewResults = computed(() =>
  isSuperadmin.value ||
  (userStore.isInternal && ['project_manager', 'content_manager'].includes(userStore.internalRole ?? ''))
)
const canManageSurveys = computed(() => isSuperadmin.value || userStore.isInternal)

const filtered = computed(() => {
  let list = surveys.value

  // 1. Assignment Filter (Internal Users)
  if (userStore.isInternal && !isSuperadmin.value && filterAssignment.value === 'mine') {
    list = list.filter(s => {
      const isCreator = (typeof s.createdBy === 'string' ? s.createdBy : s.createdBy?._id) === userStore.id
      const isAuthorized = s.authorizedSenders?.some(sender => 
        (typeof sender === 'string' ? sender : sender._id) === userStore.id
      )
      return isCreator || isAuthorized
    })
  }

  // 2. Status Filter
  if (filterStatus.value !== 'all') {
    list = list.filter((s) => s.status === filterStatus.value)
  }

  return list
})

onMounted(loadSurveys)

async function loadSurveys() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await surveyService.listSurveys()
    surveys.value = res.surveys
  } catch (err: any) {
    error.value = err?.message || 'Error al cargar encuestas.'
  } finally {
    isLoading.value = false
  }
}

function openDeleteModal(survey: ISurvey) {
  deletingsurvey.value = survey
  deleteConfirmText.value = ''
}

function closeDeleteModal() {
  deletingsurvey.value = null
  deleteConfirmText.value = ''
}

async function confirmDelete() {
  if (!deletingsurvey.value || deleteConfirmText.value !== DELETE_PHRASE) return
  isDeleting.value = true
  try {
    await surveyService.deleteSurvey(deletingsurvey.value._id)
    surveys.value = surveys.value.filter((s) => s._id !== deletingsurvey.value!._id)
    closeDeleteModal()
  } catch (err: any) {
    alert(err?.message || 'Error al eliminar.')
  } finally {
    isDeleting.value = false
  }
}

function creatorName(survey: ISurvey): string {
  if (typeof survey.createdBy === 'object' && survey.createdBy !== null) {
    return survey.createdBy.name || survey.createdBy.email
  }
  return '—'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const tabs = [
  { key: 'all', label: 'Todas' },
  { key: 'draft', label: 'Borrador' },
  { key: 'active', label: 'Activas' },
  { key: 'closed', label: 'Cerradas' },
] as const

function onSent(result: { sent: number; skipped: number }) {
  sendResult.value = result
  sendModalSurveyId.value = null
  setTimeout(() => { sendResult.value = null }, 5000)
}
</script>

<template>
  <div class="survey-list">
    <div class="survey-list__header">
      <div>
        <h1 class="survey-list__title">
          <i class="fa-solid fa-clipboard-list" /> Encuestas
        </h1>
        <p class="survey-list__subtitle">Gestiona y envía encuestas a tus clientes</p>
      </div>
      <button
        v-if="canManageSurveys"
        class="survey-list__btn-new"
        @click="router.push({ name: 'SurveyNew' })"
      >
        <i class="fa-solid fa-plus" /> Nueva Encuesta
      </button>
    </div>

    <!-- Send result toast -->
    <div v-if="sendResult" class="survey-list__toast">
      <i class="fa-solid fa-circle-check" />
      {{ sendResult.sent }} enviada(s). {{ sendResult.skipped }} omitida(s) (ya respondidas).
    </div>

    <!-- Filter tabs -->
    <div class="survey-list__filters">
      <div class="survey-list__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="survey-list__tab"
          :class="{ 'survey-list__tab--active': filterStatus === tab.key }"
          @click="filterStatus = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="userStore.isInternal && !isSuperadmin" class="survey-list__assignment-toggle">
        <button 
          class="survey-list__toggle-btn"
          :class="{ 'is-active': filterAssignment === 'mine' }"
          @click="filterAssignment = 'mine'"
        >
          Mis Asignaciones
        </button>
        <button 
          class="survey-list__toggle-btn"
          :class="{ 'is-active': filterAssignment === 'all' }"
          @click="filterAssignment = 'all'"
        >
          Todas
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="survey-list__grid">
      <div v-for="n in 6" :key="n" class="survey-card survey-card--skeleton">
        <div class="survey-card__top">
          <div class="skeleton-block skeleton-block--badge"></div>
          <div class="skeleton-block skeleton-block--date"></div>
        </div>
        <div class="skeleton-block skeleton-block--title"></div>
        <div class="skeleton-block skeleton-block--desc"></div>
        <div class="survey-card__meta">
          <div class="skeleton-block skeleton-block--meta"></div>
          <div class="skeleton-block skeleton-block--meta"></div>
        </div>
        <div class="survey-card__actions">
          <div class="skeleton-block skeleton-block--btn"></div>
          <div class="skeleton-block skeleton-block--btn"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="survey-list__error">
      <i class="fa-solid fa-circle-exclamation" /> {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="survey-list__empty">
      <i class="fa-solid fa-clipboard-question" />
      <p>No hay encuestas{{ filterStatus !== 'all' ? ' en este estado' : '' }}.</p>
      <button
        v-if="canManageSurveys && filterStatus === 'all'"
        class="survey-list__btn-new"
        @click="router.push({ name: 'SurveyNew' })"
      >
        <i class="fa-solid fa-plus" /> Crear primera encuesta
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="survey-list__grid">
      <div v-for="survey in filtered" :key="survey._id" class="survey-card">
        <div class="survey-card__top">
          <div class="survey-card__badges">
            <span class="survey-card__status" :class="`survey-card__status--${survey.status}`">
              {{ survey.status === 'draft' ? 'Borrador' : survey.status === 'active' ? 'Activa' : 'Cerrada' }}
            </span>
            <span 
              v-if="(typeof survey.createdBy === 'string' ? survey.createdBy : survey.createdBy?._id) === userStore.id || survey.authorizedSenders?.some(s => (typeof s === 'string' ? s : s._id) === userStore.id)"
              class="survey-card__badge survey-card__badge--assigned"
              title="Eres responsable o creador de esta encuesta"
            >
              <i class="fa-solid fa-user-check" /> Tu asignación
            </span>
          </div>
          <span class="survey-card__date">{{ formatDate(survey.createdAt) }}</span>
        </div>

        <h3 class="survey-card__title">{{ survey.title }}</h3>
        <p v-if="survey.description" class="survey-card__desc">{{ survey.description }}</p>

        <div class="survey-card__meta">
          <span><i class="fa-solid fa-circle-question" /> {{ survey.questions.length }} pregunta(s)</span>
          <span v-if="isSuperadmin">
            <i class="fa-solid fa-user" /> {{ creatorName(survey) }}
          </span>
        </div>

        <div class="survey-card__actions">
          <button
            v-if="survey.status === 'draft' && canManageSurveys"
            class="survey-card__btn survey-card__btn--edit"
            @click="router.push({ name: 'SurveyEdit', params: { surveyId: survey._id } })"
          >
            <i class="fa-solid fa-pen" /> Editar
          </button>

          <button
            v-if="survey.status === 'active' && canManageSurveys"
            class="survey-card__btn survey-card__btn--send"
            @click="sendModalSurveyId = survey._id; sendModalMode = 'clients'"
          >
            <i class="fa-solid fa-paper-plane" /> Enviar
          </button>

          <button
            v-if="survey.status === 'active' && isSuperadmin"
            class="survey-card__btn survey-card__btn--assign"
            @click="sendModalSurveyId = survey._id; sendModalMode = 'internal'"
          >
            <i class="fa-solid fa-users-gear" /> Asignar Equipo
          </button>

          <button
            v-if="(survey.status === 'active' || survey.status === 'closed') && canViewResults"
            class="survey-card__btn survey-card__btn--results"
            @click="router.push({ name: 'SurveyResults', params: { surveyId: survey._id } })"
          >
            <i class="fa-solid fa-chart-bar" /> Resultados
          </button>

          <button
            v-if="canManageSurveys"
            class="survey-card__btn survey-card__btn--delete"
            @click="openDeleteModal(survey)"
          >
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </div>
    </div>

    <!-- Send modal -->
    <SurveySendModal
      :survey-id="sendModalSurveyId ?? ''"
      :visible="!!sendModalSurveyId"
      :initial-mode="sendModalMode"
      @close="sendModalSurveyId = null"
      @sent="onSent"
    />

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="deletingsurvey" class="delete-modal-overlay" @click.self="closeDeleteModal">
        <div class="delete-modal">
          <div class="delete-modal__icon">
            <i class="fa-solid fa-triangle-exclamation" />
          </div>
          <h2 class="delete-modal__title">Eliminar encuesta permanentemente</h2>
          <p class="delete-modal__desc">
            Estás a punto de eliminar <strong>{{ deletingsurvey.title }}</strong>.
            Esta acción es <strong>irreversible</strong>: se borrarán la encuesta, todas las asignaciones y todas las respuestas asociadas.
          </p>
          <p class="delete-modal__instruction">
            Para confirmar, escribe exactamente:
          </p>
          <code class="delete-modal__phrase">{{ DELETE_PHRASE }}</code>
          <input
            v-model="deleteConfirmText"
            class="delete-modal__input"
            :class="{ 'delete-modal__input--valid': deleteConfirmText === DELETE_PHRASE }"
            type="text"
            placeholder="Escribe la frase de confirmación..."
            autocomplete="off"
            spellcheck="false"
          />
          <div class="delete-modal__actions">
            <button class="delete-modal__btn delete-modal__btn--cancel" @click="closeDeleteModal">
              Cancelar
            </button>
            <button
              class="delete-modal__btn delete-modal__btn--confirm"
              :disabled="deleteConfirmText !== DELETE_PHRASE || isDeleting"
              @click="confirmDelete"
            >
              <i v-if="isDeleting" class="fa-solid fa-spinner fa-spin" />
              <i v-else class="fa-solid fa-trash" />
              {{ isDeleting ? 'Eliminando...' : 'Eliminar permanentemente' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.survey-list {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1400px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
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
    font-size: 0.9rem;
    color: $text-secondary;
    margin-top: 0.25rem;
  }

  &__btn-new {
    padding: 0.65rem 1.3rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: opacity 0.2s;
    white-space: nowrap;

    &:hover { opacity: 0.88; }
  }

  &__toast {
    background: $alert-success-bg;
    color: $alert-success;
    border: 1px solid rgba($alert-success, 0.25);
    border-radius: 10px;
    padding: 0.8rem 1.2rem;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__assignment-toggle {
    display: flex;
    background: rgba($primary-dark, 0.05);
    padding: 0.25rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.05);
  }

  &__toggle-btn {
    padding: 0.4rem 0.9rem;
    border: none;
    background: transparent;
    border-radius: 7px;
    font-size: 0.8rem;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: $primary-dark;
    }

    &.is-active {
      background: $white;
      color: $primary;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
  }

  &__tab {
    padding: 0.45rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 20px;
    background: $white;
    color: $text-secondary;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: $primary; color: $primary; }

    &--active {
      background: $primary;
      border-color: $primary;
      color: $white;
    }
  }

  &__loading,
  &__error {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: $text-secondary;
    font-size: 0.95rem;
    padding: 2rem;
  }

  &__error { color: $alert-error; }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: $text-secondary;
    text-align: center;

    i { font-size: 2.5rem; opacity: 0.3; }
    p { font-size: 1rem; }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
}

.survey-card {
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.2s, border-color 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 20px rgba($primary-dark, 0.08);
    border-color: rgba($primary, 0.2);
  }

  &--skeleton {
    cursor: default;
    pointer-events: none;
    border-color: rgba($primary-dark, 0.05);

    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        rgba($white, 0) 0,
        rgba($white, 0.3) 50%,
        rgba($white, 0) 100%
      );
      animation: shimmer 2s infinite;
    }
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__status {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.7rem;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    &--draft {
      background: rgba($text-secondary, 0.12);
      color: $text-secondary;
    }
    &--active {
      background: $alert-success-bg;
      color: $alert-success;
    }
    &--closed {
      background: $alert-error-bg;
      color: $alert-error;
    }
  }

  &__badges {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__badge {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    text-transform: uppercase;

    &--assigned {
      background: rgba($primary, 0.1);
      color: $primary;
      border: 1px solid rgba($primary, 0.1);
    }
  }

  &__date {
    font-size: 0.78rem;
    color: $text-secondary;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 700;
    color: $primary-dark;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.85rem;
    color: $text-secondary;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: $text-secondary;

    span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-top: 0.25rem;
    border-top: 1px solid rgba($primary-dark, 0.06);
    margin-top: auto;
  }

  &__btn {
    padding: 0.45rem 0.9rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;
    border: none;

    &--edit {
      background: rgba($alert-info, 0.1);
      color: $alert-info;
      &:hover { background: rgba($alert-info, 0.2); }
    }
    &--send {
      background: rgba($BAKANO-GREEN, 0.1);
      color: $BAKANO-GREEN;
      &:hover { background: rgba($BAKANO-GREEN, 0.2); }
    }
    &--results {
      background: rgba($secondary, 0.1);
      color: $secondary;
      &:hover { background: rgba($secondary, 0.2); }
    }
    &--assign {
      background: rgba(#7c3aed, 0.1);
      color: #7c3aed;
      &:hover { background: rgba(#7c3aed, 0.2); }
    }
    &--delete {
      background: rgba($alert-error, 0.1);
      color: $alert-error;
      margin-left: auto;
      &:hover { background: rgba($alert-error, 0.2); }
    }
  }
}

.skeleton-block {
  background: rgba($primary-dark, 0.06);
  border-radius: 4px;

  &--badge { width: 60px; height: 18px; border-radius: 20px; }
  &--date { width: 80px; height: 14px; }
  &--title { width: 85%; height: 20px; margin-top: 0.5rem; }
  &--desc { width: 100%; height: 35px; margin-top: 0.25rem; }
  &--meta { width: 100px; height: 14px; }
  &--btn { width: 80px; height: 30px; border-radius: 8px; }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

// ── Delete confirmation modal ────────────────────────────────
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba($primary-dark, 0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.delete-modal {
  background: $white;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 20px 60px rgba($primary-dark, 0.2);

  &__icon {
    font-size: 2.5rem;
    color: $alert-error;
    text-align: center;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 800;
    color: $primary-dark;
    text-align: center;
  }

  &__desc {
    font-size: 0.9rem;
    color: $text-secondary;
    line-height: 1.6;
    text-align: center;

    strong { color: $primary-dark; }
  }

  &__instruction {
    font-size: 0.88rem;
    color: $text-secondary;
    text-align: center;
    margin-bottom: -0.5rem;
  }

  &__phrase {
    display: block;
    text-align: center;
    background: $alert-error-bg;
    color: $alert-error;
    border: 1px solid rgba($alert-error, 0.25);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    user-select: all;
  }

  &__input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 10px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:focus { border-color: $primary; }
    &--valid { border-color: $alert-success !important; }
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 0.5rem;
  }

  &__btn {
    padding: 0.65rem 1.25rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: opacity 0.2s;

    &--cancel {
      background: rgba($primary-dark, 0.07);
      color: $primary-dark;
      &:hover { opacity: 0.75; }
    }

    &--confirm {
      background: $alert-error;
      color: $white;
      &:hover:not(:disabled) { opacity: 0.88; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  }
}
</style>
