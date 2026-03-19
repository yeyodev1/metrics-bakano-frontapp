<script setup lang="ts">
import { } from 'vue'
import ImageUploader from '@/components/surveys/ImageUploader.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String as () => string | undefined,
    required: false,
    default: undefined,
  },
  canEdit: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:title', 'update:description', 'update:coverImage'])

function onTitleInput(e: Event) {
  emit('update:title', (e.target as HTMLInputElement).value)
}

function onDescriptionInput(e: Event) {
  emit('update:description', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <section class="info-form">
    <div class="info-form__field">
      <label class="info-form__label">
        Título
        <span class="info-form__required">*</span>
      </label>
      <div class="info-form__input-wrapper">
        <i class="fa-solid fa-heading info-form__icon" />
        <input
          :value="title"
          class="info-form__input"
          type="text"
          placeholder="Ej: Encuesta de satisfacción Q1 2026"
          :disabled="!canEdit"
          @input="onTitleInput"
        />
      </div>
    </div>

    <div class="info-form__field">
      <label class="info-form__label">
        Descripción
        <span class="info-form__optional">(opcional)</span>
      </label>
      <div class="info-form__input-wrapper info-form__input-wrapper--area">
        <i class="fa-solid fa-align-left info-form__icon info-form__icon--top" />
        <textarea
          :value="description"
          class="info-form__textarea"
          rows="3"
          placeholder="Describe el propósito de esta encuesta..."
          :disabled="!canEdit"
          @input="onDescriptionInput"
        />
      </div>
    </div>

    <div class="info-form__field">
      <label class="info-form__label">
        Imagen de portada
        <span class="info-form__optional">(opcional)</span>
      </label>
      <ImageUploader
        :model-value="coverImage"
        :disabled="!canEdit"
        @update:model-value="emit('update:coverImage', $event)"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.info-form {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.05);
  border-radius: 20px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 4px 20px rgba($primary-dark, 0.02);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba($primary-dark, 0.04);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__label {
    font-size: 0.85rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__required {
    color: $primary;
    font-size: 1.1rem;
    line-height: 0;
    margin-top: 0.2rem;
  }

  &__optional {
    color: $text-secondary;
    font-weight: 500;
    font-size: 0.75rem;
  }

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    &--area {
      align-items: flex-start;
    }
  }

  &__icon {
    position: absolute;
    left: 1rem;
    color: $text-secondary;
    font-size: 0.9rem;
    pointer-events: none;
    opacity: 0.5;
    transition: all 0.3s ease;

    &--top {
      top: 1rem;
    }
  }

  &__input,
  &__textarea {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.8rem;
    border: 1.5px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    font-size: 0.95rem;
    color: $primary-dark;
    background: rgba($primary-light, 0.3);
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::placeholder {
      color: rgba($primary-dark, 0.3);
    }

    &:focus {
      border-color: $primary;
      background: $white;
      box-shadow: 0 0 0 4px rgba($primary, 0.05);

      & + .info-form__icon {
        color: $primary;
        opacity: 1;
      }
    }

    &:disabled {
      background: rgba($primary-dark, 0.02);
      cursor: not-allowed;
      border-color: transparent;
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
  }
}
</style>
