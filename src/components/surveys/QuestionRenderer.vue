<script setup lang="ts">
import type { IQuestion } from '@/types/survey'

const props = defineProps<{
  question: IQuestion
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

function onInput(value: any) {
  emit('update:modelValue', value)
}

function onCheckboxChange(option: string, checked: boolean) {
  const current: string[] = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  if (checked) {
    if (!current.includes(option)) current.push(option)
  } else {
    const idx = current.indexOf(option)
    if (idx > -1) current.splice(idx, 1)
  }
  emit('update:modelValue', current)
}

function isChecked(option: string): boolean {
  return Array.isArray(props.modelValue) && props.modelValue.includes(option)
}

function ratingRange(): number[] {
  const min = Number(props.question.min ?? 1)
  const max = Number(props.question.max ?? 5)
  const arr: number[] = []
  for (let i = min; i <= max; i++) arr.push(i)
  return arr
}

function npsRange(): number[] {
  const arr: number[] = []
  for (let i = 0; i <= 10; i++) arr.push(i)
  return arr
}
</script>

<template>
  <div class="question-renderer">
    <!-- short_text -->
    <input
      v-if="question.type === 'short_text'"
      class="question-renderer__input"
      type="text"
      :placeholder="question.required ? 'Respuesta requerida' : 'Tu respuesta'"
      :value="modelValue ?? ''"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />

    <!-- long_text -->
    <textarea
      v-else-if="question.type === 'long_text'"
      class="question-renderer__textarea"
      :placeholder="question.required ? 'Respuesta requerida' : 'Tu respuesta'"
      :value="modelValue ?? ''"
      rows="4"
      @input="onInput(($event.target as HTMLTextAreaElement).value)"
    />

    <!-- multiple_choice -->
    <div v-else-if="question.type === 'multiple_choice'" class="question-renderer__options">
      <label
        v-for="opt in question.options"
        :key="opt"
        class="question-renderer__radio-label"
        :class="{ 'question-renderer__radio-label--selected': modelValue === opt }"
      >
        <input
          type="radio"
          :name="`q-${question.id}`"
          :value="opt"
          :checked="modelValue === opt"
          @change="onInput(opt)"
        />
        {{ opt }}
      </label>
    </div>

    <!-- checkbox -->
    <div v-else-if="question.type === 'checkbox'" class="question-renderer__options">
      <label
        v-for="opt in question.options"
        :key="opt"
        class="question-renderer__checkbox-label"
        :class="{ 'question-renderer__checkbox-label--selected': isChecked(opt) }"
      >
        <input
          type="checkbox"
          :value="opt"
          :checked="isChecked(opt)"
          @change="onCheckboxChange(opt, ($event.target as HTMLInputElement).checked)"
        />
        {{ opt }}
      </label>
    </div>

    <!-- rating -->
    <div v-else-if="question.type === 'rating'" class="question-renderer__rating-wrap">
      <div class="question-renderer__rating">
        <button
          v-for="n in ratingRange()"
          :key="n"
          type="button"
          class="question-renderer__rating-btn"
          :class="{ 'question-renderer__rating-btn--selected': modelValue === n }"
          @click="onInput(n)"
        >
          {{ n }}
        </button>
      </div>
      <div v-if="question.minLabel || question.maxLabel" class="question-renderer__scale-labels">
        <span>{{ question.minLabel }}</span>
        <span>{{ question.maxLabel }}</span>
      </div>
    </div>

    <!-- nps -->
    <div v-else-if="question.type === 'nps'" class="question-renderer__nps">
      <div class="question-renderer__nps-track">
        <button
          v-for="n in npsRange()"
          :key="n"
          type="button"
          class="question-renderer__nps-btn"
          :class="{ 'question-renderer__nps-btn--selected': modelValue === n }"
          @click="onInput(n)"
        >
          {{ n }}
        </button>
      </div>
      <div class="question-renderer__nps-labels">
        <span>{{ question.minLabel || 'Nada probable' }}</span>
        <span>{{ question.maxLabel || 'Muy probable' }}</span>
      </div>
    </div>

    <!-- yes_no -->
    <div v-else-if="question.type === 'yes_no'" class="question-renderer__yesno">
      <button
        type="button"
        class="question-renderer__yesno-btn"
        :class="{ 'question-renderer__yesno-btn--selected': modelValue === true }"
        @click="onInput(true)"
      >
        <i class="fa-solid fa-check" /> Sí
      </button>
      <button
        type="button"
        class="question-renderer__yesno-btn question-renderer__yesno-btn--no"
        :class="{ 'question-renderer__yesno-btn--selected': modelValue === false }"
        @click="onInput(false)"
      >
        <i class="fa-solid fa-xmark" /> No
      </button>
    </div>

    <!-- image_question -->
    <div v-else-if="question.type === 'image_question'" class="question-renderer__image-q">
      <img
        v-if="question.imageUrl"
        :src="question.imageUrl"
        alt="Imagen de la pregunta"
        class="question-renderer__image-q-img"
      />

      <!-- yes_no (default) -->
      <div v-if="!question.imageAnswerType || question.imageAnswerType === 'yes_no'" class="question-renderer__yesno">
        <button type="button" class="question-renderer__yesno-btn"
          :class="{ 'question-renderer__yesno-btn--selected': modelValue === true }"
          @click="onInput(true)">
          <i class="fa-solid fa-check" /> Sí
        </button>
        <button type="button" class="question-renderer__yesno-btn question-renderer__yesno-btn--no"
          :class="{ 'question-renderer__yesno-btn--selected': modelValue === false }"
          @click="onInput(false)">
          <i class="fa-solid fa-xmark" /> No
        </button>
      </div>

      <!-- rating -->
      <div v-else-if="question.imageAnswerType === 'rating'" class="question-renderer__rating-wrap">
        <div class="question-renderer__rating">
          <button v-for="n in ratingRange()" :key="n" type="button"
            class="question-renderer__rating-btn"
            :class="{ 'question-renderer__rating-btn--selected': modelValue === n }"
            @click="onInput(n)">{{ n }}</button>
        </div>
        <div v-if="question.minLabel || question.maxLabel" class="question-renderer__scale-labels">
          <span>{{ question.minLabel }}</span>
          <span>{{ question.maxLabel }}</span>
        </div>
      </div>

      <!-- nps -->
      <div v-else-if="question.imageAnswerType === 'nps'" class="question-renderer__nps">
        <div class="question-renderer__nps-track">
          <button v-for="n in npsRange()" :key="n" type="button"
            class="question-renderer__nps-btn"
            :class="{ 'question-renderer__nps-btn--selected': modelValue === n }"
            @click="onInput(n)">{{ n }}</button>
        </div>
        <div class="question-renderer__nps-labels">
          <span>{{ question.minLabel || 'Nada probable' }}</span>
          <span>{{ question.maxLabel || 'Muy probable' }}</span>
        </div>
      </div>

      <!-- short_text -->
      <input v-else-if="question.imageAnswerType === 'short_text'"
        class="question-renderer__input" type="text"
        :placeholder="question.required ? 'Respuesta requerida' : 'Tu respuesta'"
        :value="modelValue ?? ''"
        @input="onInput(($event.target as HTMLInputElement).value)" />

      <!-- long_text -->
      <textarea v-else-if="question.imageAnswerType === 'long_text'"
        class="question-renderer__textarea"
        :placeholder="question.required ? 'Respuesta requerida' : 'Tu respuesta'"
        :value="modelValue ?? ''" rows="4"
        @input="onInput(($event.target as HTMLTextAreaElement).value)" />

      <!-- multiple_choice -->
      <div v-else-if="question.imageAnswerType === 'multiple_choice'" class="question-renderer__options">
        <label v-for="opt in question.options" :key="opt"
          class="question-renderer__radio-label"
          :class="{ 'question-renderer__radio-label--selected': modelValue === opt }">
          <input type="radio" :name="`q-${question.id}`" :value="opt" :checked="modelValue === opt" @change="onInput(opt)" />
          {{ opt }}
        </label>
      </div>

      <!-- checkbox -->
      <div v-else-if="question.imageAnswerType === 'checkbox'" class="question-renderer__options">
        <label v-for="opt in question.options" :key="opt"
          class="question-renderer__checkbox-label"
          :class="{ 'question-renderer__checkbox-label--selected': isChecked(opt) }">
          <input type="checkbox" :value="opt" :checked="isChecked(opt)"
            @change="onCheckboxChange(opt, ($event.target as HTMLInputElement).checked)" />
          {{ opt }}
        </label>
      </div>

      <!-- dropdown -->
      <select v-else-if="question.imageAnswerType === 'dropdown'"
        class="question-renderer__select"
        :value="modelValue ?? ''"
        @change="onInput(($event.target as HTMLSelectElement).value)">
        <option value="" disabled>Selecciona una opción</option>
        <option v-for="opt in question.options" :key="opt" :value="opt">{{ opt }}</option>
      </select>

      <!-- date -->
      <input v-else-if="question.imageAnswerType === 'date'"
        class="question-renderer__input" type="date"
        :value="modelValue ?? ''"
        @input="onInput(($event.target as HTMLInputElement).value)" />
    </div>

    <!-- dropdown -->
    <select
      v-else-if="question.type === 'dropdown'"
      class="question-renderer__select"
      :value="modelValue ?? ''"
      @change="onInput(($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Selecciona una opción</option>
      <option v-for="opt in question.options" :key="opt" :value="opt">{{ opt }}</option>
    </select>

    <!-- date -->
    <input
      v-else-if="question.type === 'date'"
      class="question-renderer__input"
      type="date"
      :value="modelValue ?? ''"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style lang="scss" scoped>
.question-renderer {
  width: 100%;

  &__input,
  &__textarea,
  &__select {
    width: 100%;
    padding: 0.6rem 0.9rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    font-size: 0.95rem;
    color: $primary-dark;
    background: $white;
    transition: border-color 0.2s;
    outline: none;

    &:focus {
      border-color: $primary;
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__radio-label,
  &__checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    color: $primary-dark;
    transition: border-color 0.2s, background 0.2s;

    input {
      accent-color: $primary;
    }

    &--selected {
      border-color: $primary;
      background: rgba($primary, 0.05);
    }

    &:hover {
      border-color: $primary;
    }
  }

  &__rating-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__rating {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__scale-labels {
    display: flex;
    justify-content: space-between;
    padding: 0 0.25rem;

    span {
      font-size: 0.78rem;
      color: $text-secondary;
      font-weight: 500;
    }
  }

  &__rating-btn {
    width: 2.5rem;
    height: 2.5rem;
    border: 1.5px solid rgba($primary-dark, 0.2);
    border-radius: 8px;
    background: $white;
    color: $primary-dark;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    &--selected {
      background: $primary;
      border-color: $primary;
      color: $white;
    }
  }

  &__nps {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__nps-track {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  &__nps-btn {
    width: 2.6rem;
    height: 2.6rem;
    border: 1.5px solid rgba($primary-dark, 0.2);
    border-radius: 6px;
    background: $white;
    color: $primary-dark;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    &--selected {
      background: $primary;
      border-color: $primary;
      color: $white;
    }
  }

  &__nps-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: $text-secondary;
  }

  &__image-q {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__image-q-img {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.1);
  }

  &__yesno {
    display: flex;
    gap: 1rem;
  }

  &__yesno-btn {
    flex: 1;
    padding: 0.7rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    background: $white;
    color: $primary-dark;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;

    &:hover {
      border-color: $BAKANO-GREEN;
    }

    &--no:hover {
      border-color: $alert-error;
    }

    &--selected {
      background: $BAKANO-GREEN;
      border-color: $BAKANO-GREEN;
      color: $white;

      &.question-renderer__yesno-btn--no {
        background: $alert-error;
        border-color: $alert-error;
      }
    }
  }
}
</style>
