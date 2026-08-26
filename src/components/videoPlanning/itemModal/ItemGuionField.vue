<template>
  <div class="igf">
    <label class="igf__label">
      Guión
      <span v-if="texto" class="igf__hint">
        auto-completado por IA — editable · **negritas** con dobles asteriscos
      </span>
    </label>

    <!--
      Lo editado a mano no se pisa solo. La content manager reescribe partes del
      guión; una regeneración silenciosa le borraba el trabajo sin avisar.
    -->
    <div v-if="pendiente" class="igf__alert">
      <p class="igf__alert-text">
        <i class="fa-solid fa-triangle-exclamation" />
        <span>
          Hay un guión nuevo de la IA, pero el de abajo tiene cambios tuyos.
          Reemplazarlo los borra.
        </span>
      </p>
      <div class="igf__alert-actions">
        <button type="button" class="igf__btn" @click="emit('descartar')">
          Conservar el mío
        </button>
        <button type="button" class="igf__btn igf__btn--replace" @click="emit('aplicar')">
          <i class="fa-solid fa-arrow-turn-down" /> Reemplazar con el nuevo
        </button>
      </div>

      <details class="igf__preview">
        <summary>Ver el guión nuevo antes de decidir</summary>
        <pre>{{ pendiente }}</pre>
      </details>
    </div>

    <textarea
      v-model="texto"
      rows="5"
      placeholder="Se completará automáticamente al generar con IA, o escribe aquí manualmente..."
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Guión recién generado esperando permiso para reemplazar al editado a mano. */
  pendiente: string | null
}>()

const emit = defineEmits<{ (e: 'aplicar'): void; (e: 'descartar'): void }>()

const texto = defineModel<string>({ required: true })
</script>

<style lang="scss" scoped>
.igf {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &__label {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__hint {
    font-size: 0.68rem;
    font-weight: 500;
    color: $text-secondary;
  }

  &__alert {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.75rem 0.85rem;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
  }

  &__alert-text {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: #92400e;

    i { margin-top: 0.15rem; }
  }

  &__alert-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #92400e;
    background: $white;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.18s;

    &:hover { background: #fef3c7; }

    &--replace {
      color: $white;
      background: #d97706;
      border-color: #d97706;

      &:hover { background: #b45309; }
    }
  }

  &__preview {
    font-size: 0.72rem;
    color: #92400e;

    summary { cursor: pointer; font-weight: 600; }

    pre {
      max-height: 180px;
      margin: 0.45rem 0 0;
      padding: 0.6rem;
      overflow: auto;
      font-family: inherit;
      white-space: pre-wrap;
      background: $white;
      border: 1px solid #fde68a;
      border-radius: 8px;
    }
  }

  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    font-family: inherit;
    font-size: 0.85rem;
    color: $primary-dark;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    resize: vertical;
    transition: border-color 0.18s;

    &:focus {
      border-color: $primary;
      outline: none;
    }
  }
}
</style>
