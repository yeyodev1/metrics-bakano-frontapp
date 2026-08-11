<template>
  <div class="gcf">
    <p class="gcf__label">
      <i class="fa-solid fa-calendar-day" />
      Contexto del mes <em>(opcional — mejora el resultado)</em>
    </p>

    <div class="gcf__grid">
      <div class="gcf__field">
        <label>Producto o servicio a destacar</label>
        <input v-model="model.productoMes" type="text" placeholder="Ej: Plan mensual, Catering empresarial..." />
      </div>
      <div class="gcf__field">
        <label>Oferta especial</label>
        <input v-model="model.ofertaEspecial" type="text" placeholder="Ej: 20% off en planes anuales..." />
      </div>
    </div>

    <div class="gcf__field">
      <label>Referencias adicionales</label>
      <textarea
        v-model="model.referenciasAdicionales"
        rows="2"
        placeholder="Evento próximo, temporada, tono especial, referencias de videos..."
      />
    </div>

    <p v-if="error" class="gcf__error">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </p>

    <div class="gcf__actions">
      <span class="gcf__llm" :class="llmStateClass">
        <template v-if="llmChecking">
          <i class="fa-solid fa-spinner fa-spin" /><span>Verificando IA...</span>
        </template>
        <template v-else-if="llmAvailable">
          <i class="fa-solid fa-circle-check" /><span>IA lista</span>
        </template>
        <template v-else>
          <i class="fa-solid fa-triangle-exclamation" /><span>IA no disponible</span>
        </template>
      </span>

      <!-- Three options beat one when there is nothing to compare against -->
      <button
        v-if="canGenerateVariants"
        type="button"
        class="gcf__variants"
        :disabled="generating || !canGenerate"
        @click="$emit('generate-variants')"
      >
        <i class="fa-solid fa-layer-group" /> 3 versiones
      </button>

      <!-- Variants need a saved item to write onto; say so instead of hiding it -->
      <span v-else class="gcf__variants-note">
        <i class="fa-solid fa-circle-info" />
        Guarda el video para poder generar 3 versiones y elegir
      </span>

      <button
        type="button"
        class="gcf__generate"
        :disabled="generating || !canGenerate"
        @click="$emit('generate')"
      >
        <i :class="generating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'" />
        {{ buttonLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ContextoMes {
  productoMes: string
  ofertaEspecial: string
  referenciasAdicionales: string
}

const props = defineProps<{
  generating: boolean
  canGenerate: boolean
  llmChecking: boolean
  llmAvailable: boolean
  hasExistingScript: boolean
  error: string | null
  /** Variants need an existing item to save onto, so create mode hides it. */
  canGenerateVariants?: boolean
}>()

defineEmits<{ (e: 'generate'): void; (e: 'generate-variants'): void }>()

const model = defineModel<ContextoMes>({ required: true })

const llmStateClass = computed(() => {
  if (props.llmChecking) return 'is-checking'
  return props.llmAvailable ? 'is-ok' : 'is-down'
})

const buttonLabel = computed(() => {
  if (props.generating) return 'Generando...'
  return props.hasExistingScript ? 'Regenerar guión' : 'Generar guión con IA'
})
</script>

<style lang="scss" scoped>
.gcf {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem;
  background: rgba($primary-dark, 0.02);
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;

  &__label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;

    em { font-style: normal; font-weight: 400; }
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;

    label {
      font-size: 0.72rem;
      font-weight: 600;
      color: $text-secondary;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.45rem 0.65rem;
      font-family: inherit;
      font-size: 0.8rem;
      color: $primary-dark;
      background: $white;
      border: 1.5px solid rgba($primary-dark, 0.12);
      border-radius: 7px;
      resize: vertical;
      transition: border-color 0.15s;

      &:focus { outline: none; border-color: rgba($primary, 0.4); }
      &::placeholder { color: rgba($primary-dark, 0.35); }
    }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.55rem 0.75rem;
    font-size: 0.78rem;
    color: $alert-error;
    background: $alert-error-bg;
    border-radius: 8px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
  }

  &__llm {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 20px;

    &.is-checking { color: $text-secondary; background: rgba($text-secondary, 0.12); }
    &.is-ok { color: $alert-success; background: $alert-success-bg; }
    &.is-down { color: $alert-error; background: $alert-error-bg; }
  }

  &__variants {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    color: $secondary-dark;
    background: $overlay-purple;
    border: 1.5px solid rgba($secondary, 0.3);
    border-radius: 8px;
    cursor: pointer;

    &:hover:not(:disabled) { background: rgba($secondary, 0.16); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__variants-note {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    line-height: 1.35;
    color: $text-secondary;

    i { color: $alert-info; }
  }

  &__generate {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: $white;
    background: linear-gradient(135deg, $primary, $secondary);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  @media (min-width: 561px) {
    &__grid { flex-direction: row; }
  }
}
</style>
