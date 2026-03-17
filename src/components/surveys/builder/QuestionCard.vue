<script setup lang="ts">
import { } from 'vue'
import type { IQuestion, QuestionType } from '@/types/survey'

const props = defineProps({
  question: {
    type: Object as () => IQuestion,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  canEdit: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'remove',
  'moveUp',
  'moveDown',
  'typeChange',
  'addOption',
  'removeOption',
  'update:question'
])

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
  { value: 'short_text', label: 'Texto corto', icon: 'fa-font' },
  { value: 'long_text', label: 'Texto largo', icon: 'fa-paragraph' },
  { value: 'multiple_choice', label: 'Opción múltiple', icon: 'fa-circle-dot' },
  { value: 'checkbox', label: 'Casillas', icon: 'fa-square-check' },
  { value: 'rating', label: 'Calificación', icon: 'fa-star' },
  { value: 'nps', label: 'NPS (0–10)', icon: 'fa-gauge-high' },
  { value: 'yes_no', label: 'Sí / No', icon: 'fa-toggle-on' },
  { value: 'dropdown', label: 'Desplegable', icon: 'fa-caret-down' },
  { value: 'date', label: 'Fecha', icon: 'fa-calendar-days' },
]

function hasOptions(type: QuestionType) {
  return ['multiple_choice', 'checkbox', 'dropdown'].includes(type)
}

function hasMinMax(type: QuestionType) {
  return type === 'rating' || type === 'nps'
}

function onTypeChange(e: Event) {
  const newType = (e.target as HTMLSelectElement).value as QuestionType
  emit('typeChange', newType)
}
</script>

<template>
  <div class="question-card" :class="{ 'question-card--readonly': !canEdit }">
    <div class="question-card__header">
      <div v-if="canEdit" class="drag-handle" title="Arrastrar para reordenar">
        <i class="fa-solid fa-grip-vertical" />
      </div>

      <div class="question-card__badge">
        <span class="question-card__number">Q{{ index + 1 }}</span>
      </div>

      <button v-if="canEdit" type="button" class="drag-handle" title="Arrastrar para reordenar">
        <i class="fa-solid fa-grip-vertical" />
      </button>

      <div class="question-card__reorder" v-if="canEdit">
        <button
          type="button"
          class="reorder-btn"
          :disabled="index === 0"
          @click="emit('moveUp')"
          title="Subir"
        >
          <i class="fa-solid fa-chevron-up" />
        </button>
        <button
          type="button"
          class="reorder-btn"
          :disabled="index === totalQuestions - 1"
          @click="emit('moveDown')"
          title="Bajar"
        >
          <i class="fa-solid fa-chevron-down" />
        </button>
      </div>

      <button
        v-if="canEdit"
        type="button"
        class="question-card__delete"
        @click="emit('remove')"
        aria-label="Eliminar pregunta"
      >
        <i class="fa-solid fa-trash-can" />
      </button>
    </div>

    <div class="question-card__body">
      <div class="question-card__row">
        <!-- Type Selector -->
        <div class="field field--type">
          <label class="field__label">Tipo de pregunta</label>
          <div class="select-wrapper">
            <i class="fa-solid field__type-icon" :class="QUESTION_TYPES.find(t => t.value === question.type)?.icon" />
            <select
              :value="question.type"
              class="field__select"
              :disabled="!canEdit"
              @change="onTypeChange"
            >
              <option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Label Input -->
        <div class="field field--label">
          <label class="field__label">Enunciado de la pregunta</label>
          <input
            v-model="question.label"
            class="field__input"
            type="text"
            placeholder="Escribe la pregunta..."
            :disabled="!canEdit"
          />
        </div>
      </div>

      <!-- Settings Row -->
      <div class="question-card__settings">
        <label class="toggle">
          <input type="checkbox" v-model="question.required" :disabled="!canEdit" />
          <span class="toggle__slider"></span>
          <span class="toggle__text">Respuesta obligatoria</span>
        </label>
      </div>

      <!-- Options Editor -->
      <Transition name="expand">
        <div v-if="hasOptions(question.type)" class="options-editor">
          <label class="field__label">Opciones de respuesta</label>
          <div class="options-list">
            <div
              v-for="(_, optIdx) in question.options"
              :key="optIdx"
              class="option-row"
            >
              <div class="option-row__bullet">
                <i v-if="question.type === 'multiple_choice' || question.type === 'dropdown'" class="fa-regular fa-circle" />
                <i v-else class="fa-regular fa-square" />
              </div>
              <input
                v-model="question.options![optIdx]"
                class="option-row__input"
                type="text"
                :placeholder="`Opción ${optIdx + 1}`"
                :disabled="!canEdit"
              />
              <button
                v-if="canEdit && (question.options?.length ?? 0) > 1"
                type="button"
                class="option-row__remove"
                @click="emit('removeOption', optIdx)"
              >
                <i class="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <button
            v-if="canEdit"
            type="button"
            class="btn-add-option"
            @click="emit('addOption')"
          >
            <i class="fa-solid fa-plus" />
            <span>Agregar opción</span>
          </button>
        </div>
      </Transition>

      <!-- Range Settings -->
      <div v-if="hasMinMax(question.type)" class="range-settings">
        <div class="range-settings__col">
          <div class="field">
            <label class="field__label">Valor mínimo</label>
            <input
              v-model.number="question.min"
              class="field__input field__input--small"
              type="number"
              :disabled="!canEdit"
            />
          </div>
          <div class="field field--grow">
            <label class="field__label">Etiqueta mínimo</label>
            <input
              v-model="question.minLabel"
              class="field__input"
              type="text"
              placeholder="Ej: No suficiente"
              :disabled="!canEdit"
            />
          </div>
        </div>
        <div class="range-settings__col">
          <div class="field">
            <label class="field__label">Valor máximo</label>
            <input
              v-model.number="question.max"
              class="field__input field__input--small"
              type="number"
              :disabled="!canEdit"
            />
          </div>
          <div class="field field--grow">
            <label class="field__label">Etiqueta máximo</label>
            <input
              v-model="question.maxLabel"
              class="field__input"
              type="text"
              placeholder="Ej: Excelente"
              :disabled="!canEdit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-card {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1rem;

  &:hover {
    border-color: rgba($primary, 0.15);
    box-shadow: 0 8px 30px rgba($primary-dark, 0.06);
    transform: translateY(-2px);
  }

  &--readonly {
    opacity: 0.8;
    pointer-events: none;
    background: rgba($primary-light, 0.2);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba($primary-light, 0.3);
    border-bottom: 1px solid rgba($primary-dark, 0.03);
  }

  .drag-handle {
    cursor: grab;
    color: rgba($primary-dark, 0.2);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.2s;

    &:hover { color: $primary; }
    &:active { cursor: grabbing; }
  }

  &__badge {
    margin-right: auto;
  }

  &__number {
    font-size: 0.75rem;
    font-weight: 800;
    color: $primary;
    background: rgba($primary, 0.1);
    padding: 0.3rem 0.75rem;
    border-radius: 100px;
    letter-spacing: 0.05em;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: rgba($primary-dark, 0.25);
  cursor: grab;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: rgba($primary, 0.05);
    color: $primary;
  }

  i { font-size: 0.9rem; }
}

.question-card {
  &__reorder {
    display: flex;
    gap: 0.25rem;
    background: $white;
    padding: 0.25rem;
    border-radius: 10px;
    border: 1px solid rgba($primary-dark, 0.05);
  }

  .reorder-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba($primary, 0.05);
      color: $primary;
    }

    &:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }
  }

  &__delete {
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    background: rgba($alert-error, 0.05);
    border-radius: 10px;
    color: $alert-error;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $alert-error;
      color: $white;
      transform: scale(1.05);
    }
  }

  &__body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__row {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__settings {
    padding-top: 0.5rem;
    border-top: 1px solid rgba($primary-dark, 0.03);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__label {
    font-size: 0.75rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__type-icon {
    position: absolute;
    left: 1rem;
    color: $primary;
    pointer-events: none;
  }

  &__select,
  &__input {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    font-size: 0.9rem;
    color: $primary-dark;
    background: $white;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.05);
    }
  }

  &__select {
    padding-left: 2.75rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
  }

  &__input--small {
    width: 80px;
  }
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;

  input {
    display: none;

    &:checked + .toggle__slider {
      background: $primary;
      &::before {
        transform: translateX(1.25rem);
      }
    }
  }

  &__slider {
    width: 2.75rem;
    height: 1.5rem;
    background: rgba($primary-dark, 0.1);
    border-radius: 100px;
    position: relative;
    transition: all 0.3s ease;

    &::before {
      content: '';
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
      width: 1rem;
      height: 1rem;
      background: $white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  }

  &__text {
    font-size: 0.85rem;
    font-weight: 600;
    color: $primary-dark;
  }
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba($primary-light, 0.2);
  border-radius: 16px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &__bullet {
    color: rgba($primary-dark, 0.2);
    font-size: 1rem;
  }

  &__input {
    flex: 1;
    padding: 0.6rem 0.85rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
      border-color: $primary;
      background: $white;
    }
  }

  &__remove {
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: transparent;
    color: $text-secondary;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: rgba($alert-error, 0.1);
      color: $alert-error;
    }
  }
}

.btn-add-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1.5px dashed rgba($primary, 0.3);
  border-radius: 10px;
  color: $primary;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($primary, 0.05);
    border-color: $primary;
    transform: translateX(4px);
  }
}

.range-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba($primary-light, 0.2);
  border-radius: 16px;

  &__col {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
  }
}

.field--grow {
  flex: 1;
}

// Transitions
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin: 0;
}
</style>
