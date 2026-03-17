<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSurveyNotifications, type SurveyNotification } from '@/composables/useSurveyNotifications'
import { surveyService } from '@/services/survey.service'
import SurveySendModal from './SurveySendModal.vue'
import type { ISurvey } from '@/types/survey'

const { visible, isLoading, load, dismiss, dismissAll } = useSurveyNotifications()

const isExpanded = ref(true)

// Survey picker state
const pickingForNotif = ref<SurveyNotification | null>(null)
const activeSurveys = ref<ISurvey[]>([])
const isLoadingSurveys = ref(false)

// Send modal state
const sendModalOpen = ref(false)
const sendModalSurveyId = ref('')
const sendModalWorkspaceId = ref('')

onMounted(() => load())

async function handleSendSurvey(notif: SurveyNotification) {
  isLoadingSurveys.value = true
  pickingForNotif.value = notif
  try {
    const res = await surveyService.listSurveys()
    activeSurveys.value = res.surveys.filter((s) => s.status === 'active')
  } catch {
    activeSurveys.value = []
  } finally {
    isLoadingSurveys.value = false
  }
}

function selectSurvey(surveyId: string) {
  if (!pickingForNotif.value) return
  sendModalSurveyId.value = surveyId
  sendModalWorkspaceId.value = pickingForNotif.value.workspaceId
  pickingForNotif.value = null
  sendModalOpen.value = true
}

function onSent(_result: { sent: number; skipped: number }) {
  sendModalOpen.value = false
  // Auto-dismiss the notification after sending
  if (sendModalWorkspaceId.value) {
    const notif = visible.value.find((n) => n.workspaceId === sendModalWorkspaceId.value)
    if (notif) dismiss(notif.id)
  }
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }
  return date.toLocaleDateString('es-EC', options)
}
</script>

<template>
  <div v-if="visible.length > 0 && !isLoading" class="survey-notif">
    <!-- Header bar -->
    <div class="survey-notif__bar" @click="isExpanded = !isExpanded">
      <div class="survey-notif__bar-left">
        <div class="survey-notif__bell-wrapper">
          <span class="survey-notif__bell">
            <i class="fa-solid fa-bell" />
          </span>
          <span class="survey-notif__badge">{{ visible.length }}</span>
        </div>
        <span class="survey-notif__bar-text">
          {{ visible.length === 1 ? '1 evento reciente sin encuesta' : `${visible.length} eventos recientes sin encuesta` }}
        </span>
      </div>
      <div class="survey-notif__bar-actions">
        <button
          class="survey-notif__dismiss-all"
          @click.stop="dismissAll"
          title="Descartar todas"
        >
          Descartar todas
        </button>
        <div class="chevron-wrapper" :class="{ 'is-active': isExpanded }">
          <i class="fa-solid fa-chevron-down" />
        </div>
      </div>
    </div>

    <!-- Expanded panel -->
    <Transition name="expand">
      <div v-if="isExpanded" class="survey-notif__panel">
        <TransitionGroup name="list-stagger">
          <div
            v-for="notif in visible"
            :key="notif.id"
            class="survey-notif__item"
          >
            <div class="survey-notif__item-icon">
              <i class="fa-solid fa-calendar-check" />
            </div>
            <div class="survey-notif__item-body">
              <p class="survey-notif__item-msg">
                El evento <strong>{{ notif.title }}</strong> con
                <strong>{{ notif.workspaceName }}</strong> ya pasó.
                <span class="survey-notif__item-date">({{ formatDate(notif.date) }})</span>
              </p>
              <p class="survey-notif__item-submsg">¿Deseas enviar la encuesta de satisfacción?</p>
            </div>
            <div class="survey-notif__item-actions">
              <button
                class="survey-notif__btn-send"
                @click="handleSendSurvey(notif)"
              >
                <i class="fa-solid fa-paper-plane" />
                <span>Enviar</span>
              </button>
              <button
                class="survey-notif__btn-dismiss"
                @click="dismiss(notif.id)"
                title="Descartar"
              >
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </Transition>

    <!-- Survey picker overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="pickingForNotif"
          class="survey-picker__backdrop"
          @click.self="pickingForNotif = null"
        >
          <Transition name="picker-scale">
            <div v-if="pickingForNotif" class="survey-picker">
              <div class="survey-picker__header">
                <div class="picker-header-icon">
                  <i class="fa-solid fa-clipboard-list" />
                </div>
                <div class="picker-header-text">
                  <h3>Selecciona la encuesta</h3>
                  <p class="survey-picker__subtitle">
                    Para <strong>{{ pickingForNotif.title }}</strong>
                  </p>
                </div>
                <button class="survey-picker__close" @click="pickingForNotif = null">
                  <i class="fa-solid fa-xmark" />
                </button>
              </div>

              <div class="survey-picker__body">
                <!-- Loading Skeleton -->
                <div v-if="isLoadingSurveys" class="survey-picker__list">
                  <div v-for="n in 3" :key="n" class="survey-picker__option survey-picker__option--skeleton">
                    <div class="survey-picker__option-info">
                      <div class="skeleton-block skeleton-block--title"></div>
                      <div class="skeleton-block skeleton-block--meta"></div>
                    </div>
                    <div class="skeleton-block skeleton-block--arrow"></div>
                  </div>
                </div>
                <div v-else-if="activeSurveys.length === 0" class="survey-picker__empty">
                  <i class="fa-solid fa-clipboard-question" />
                  <p>No hay encuestas activas. Activa una primero.</p>
                </div>
                <div v-else class="survey-picker__list">
                  <button
                    v-for="survey in activeSurveys"
                    :key="survey._id"
                    class="survey-picker__option"
                    @click="selectSurvey(survey._id)"
                  >
                    <div class="survey-picker__option-info">
                      <span class="survey-picker__option-title">{{ survey.title }}</span>
                      <span class="survey-picker__option-meta">
                        {{ survey.questions.length }} enunciados
                        <span v-if="survey.description"> · {{ survey.description }}</span>
                      </span>
                    </div>
                    <div class="arrow-circle">
                      <i class="fa-solid fa-chevron-right" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Send modal -->
    <SurveySendModal
      :survey-id="sendModalSurveyId"
      :visible="sendModalOpen"
      :initial-workspace-id="sendModalWorkspaceId"
      @close="sendModalOpen = false"
      @sent="onSent"
    />
  </div>
</template>

<style lang="scss" scoped>
// ── Notification bar ───────────────────────────────────────────
.survey-notif {
  border-bottom: 2px solid rgba($alert-warning, 0.15);
  background: rgba($alert-warning, 0.04);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 100;

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease;

    &:hover { 
      background: rgba($alert-warning, 0.08); 
    }
  }

  &__bar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__bell-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__bell {
    font-size: 1.1rem;
    color: $alert-warning;
    animation: bell-ring 3s infinite;
  }

  &__badge {
    position: absolute;
    top: -5px;
    right: -7px;
    background: $alert-warning;
    color: $white;
    font-size: 0.65rem;
    font-weight: 800;
    min-width: 1.1rem;
    height: 1.1rem;
    padding: 0 4px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba($white, 0.8);
    box-shadow: 0 2px 4px rgba($alert-warning, 0.3);
  }

  &__bar-text {
    font-size: 0.9rem;
    font-weight: 700;
    color: darken($alert-warning, 20%);
    letter-spacing: -0.01em;
  }

  &__bar-actions {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  &__dismiss-all {
    background: none;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    cursor: pointer;
    opacity: 0.8;
    transition: all 0.2s;
    padding: 2px 0;
    border-bottom: 1px solid transparent;

    &:hover { 
      opacity: 1;
      color: $primary-dark;
      border-bottom-color: rgba($primary-dark, 0.2);
    }
  }

  .chevron-wrapper {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-active {
      transform: rotate(180deg);
    }
  }

  // ── Panel ────────────────────────────────────────────────────
  &__panel {
    border-top: 1px solid rgba($alert-warning, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow-y: auto;
    background: rgba($white, 0.3);

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba($alert-warning, 0.2); border-radius: 10px; }
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid rgba($alert-warning, 0.08);
    background: transparent;
    transition: all 0.2s ease;

    &:last-child { border-bottom: none; }

    &:hover { 
      background: rgba($white, 0.6);
      padding-left: 2rem;
    }
  }

  &__item-icon {
    width: 40px;
    height: 40px;
    background: rgba($alert-warning, 0.1);
    color: $alert-warning;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  &__item-body {
    flex: 1;
    min-width: 0;
  }

  &__item-msg {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
    color: $primary-dark;
    line-height: 1.5;
    font-weight: 500;

    strong { font-weight: 800; }
  }

  &__item-submsg {
    margin: 0;
    font-size: 0.85rem;
    color: $text-secondary;
    font-weight: 500;
  }

  &__item-date {
    color: $text-secondary;
    font-size: 0.85rem;
    margin-left: 0.4rem;
    opacity: 0.7;
  }

  &__item-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  &__btn-send {
    padding: 0.6rem 1.1rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    box-shadow: 0 4px 10px rgba($primary, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover { 
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba($primary, 0.3);
      filter: brightness(1.05);
    }

    &:active { transform: translateY(0); }
  }

  &__btn-dismiss {
    width: 2.25rem;
    height: 2.25rem;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    background: $white;
    color: $text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover { 
      border-color: $alert-error; 
      color: $alert-error;
      background: rgba($alert-error, 0.04);
    }
  }
}

// ── Survey picker ──────────────────────────────────────────────
.survey-picker {
  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgba($primary-dark, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1.5rem;
  }

  background: $white;
  border-radius: 24px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba($primary-dark, 0.25);
  overflow: hidden;
  border: 1px solid rgba($primary-dark, 0.05);

  &__header {
    padding: 1.75rem 2rem 1.25rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    background: rgba($primary-light, 0.3);
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    position: relative;

    .picker-header-icon {
      width: 48px;
      height: 48px;
      background: $white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      font-size: 1.4rem;
      box-shadow: 0 4px 6px rgba($primary-dark, 0.05);
      flex-shrink: 0;
    }

    .picker-header-text {
      flex: 1;
      padding-right: 2.5rem;
    }

    h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: $primary-dark;
      margin: 0 0 0.35rem;
    }
  }

  &__subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: $text-secondary;
    line-height: 1.4;
    font-weight: 500;
  }

  &__close {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba($primary-dark, 0.04);
    border-radius: 8px;
    cursor: pointer;
    color: $primary-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover { background: rgba($alert-error, 0.1); color: $alert-error; transform: rotate(90deg); }
  }

  &__body {
    padding: 1.5rem 2rem 2rem;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 3rem 0;
    color: $text-secondary;
    text-align: center;

    i { font-size: 2.5rem; opacity: 0.2; }
    span { font-weight: 600; font-size: 0.95rem; }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    padding: 1.1rem 1.4rem;
    border: 2px solid rgba($primary-dark, 0.08);
    border-radius: 16px;
    background: $white;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.02);
      transform: translateX(6px);

      .arrow-circle {
        background: $primary;
        color: $white;
        transform: scale(1.1);
      }
    }

    .arrow-circle {
      width: 32px;
      height: 32px;
      background: rgba($primary-dark, 0.04);
      color: $text-secondary;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
  }

  &__option--skeleton {
    cursor: default;
    pointer-events: none;
    border-color: rgba($primary-dark, 0.05);
    position: relative;
    overflow: hidden;

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

  &__option-info {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    flex: 1;
  }

  &__option-title {
    font-size: 1rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__option-meta {
    font-size: 0.8rem;
    color: $text-secondary;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .skeleton-block {
    background: rgba($primary-dark, 0.05);
    border-radius: 4px;

    &--title { width: 180px; height: 16px; margin-bottom: 0.25rem; }
    &--meta { width: 240px; height: 12px; }
    &--arrow { width: 32px; height: 32px; border-radius: 50%; }
  }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bell-ring {
  0%, 100% { transform: rotate(0); }
  5%, 15% { transform: rotate(15deg); }
  10%, 20% { transform: translate(0); transform: rotate(-15deg); }
  25% { transform: rotate(0); }
}

// ── Transitions ──────────────────────────────────────────────
.expand-enter-active, .expand-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 400px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.picker-scale-enter-active, .picker-scale-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.picker-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}
.picker-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.list-stagger-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-stagger-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
