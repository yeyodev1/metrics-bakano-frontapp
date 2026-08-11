<template>
  <div class="gsc">
    <div class="gsc__header">
      <i class="fa-solid fa-sparkles" />
      <span>Resultado generado</span>
      <span v-if="generatedAtLabel" class="gsc__at">{{ generatedAtLabel }}</span>
    </div>

    <div class="gsc__fields">
      <Transition name="gsc-field">
        <div v-if="isFieldVisible(0)" class="gsc__field">
          <div class="gsc__field-header">
            <i class="fa-solid fa-clapperboard" /><span>Concepto Visual / Dirección de Arte</span>
          </div>
          <div class="gsc__field-content">{{ guionIA.conceptoVisual }}</div>
        </div>
      </Transition>

      <Transition name="gsc-field">
        <div v-if="isFieldVisible(1)" class="gsc__field-row">
          <div class="gsc__field gsc__field--highlight">
            <div class="gsc__field-header">
              <i class="fa-solid fa-bolt" /><span>Hook 1 (0-3 seg)</span>
              <span class="gsc__chip">Voz</span>
            </div>
            <div class="gsc__field-content gsc__field-content--bold">{{ guionIA.gancho }}</div>
          </div>
          <div class="gsc__field">
            <div class="gsc__field-header">
              <i class="fa-solid fa-mobile-screen-button" /><span>Texto en pantalla</span>
              <span class="gsc__chip">Overlay</span>
            </div>
            <div class="gsc__field-content">{{ guionIA.textoPantalla }}</div>
          </div>
        </div>
      </Transition>

      <Transition name="gsc-field">
        <div v-if="isFieldVisible(3)" class="gsc__field">
          <div class="gsc__field-header">
            <i class="fa-solid fa-scroll" /><span>Cuerpo — abre con el Hook 2 (máx. 45 seg)</span>
          </div>
          <div class="gsc__field-content gsc__field-content--script">{{ guionIA.cuerpo }}</div>
        </div>
      </Transition>

      <Transition name="gsc-field">
        <div v-if="isFieldVisible(4)" class="gsc__field-row">
          <div class="gsc__field gsc__field--cta">
            <div class="gsc__field-header">
              <i class="fa-solid fa-bullhorn" /><span>CTA (Llamado a acción)</span>
            </div>
            <div class="gsc__field-content gsc__field-content--bold">{{ guionIA.cta }}</div>
          </div>
          <div class="gsc__field">
            <div class="gsc__field-header">
              <i class="fa-solid fa-film" /><span>B-Roll / Apoyo visual</span>
            </div>
            <div class="gsc__field-content">{{ guionIA.broll }}</div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GuionIA } from '@/types/videoPlanning'

const props = defineProps<{
  guionIA: GuionIA
  isFieldVisible: (index: number) => boolean
}>()

const generatedAtLabel = computed(() => {
  if (!props.guionIA.generadoEn) return ''
  return new Date(props.guionIA.generadoEn).toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<style lang="scss" scoped>
.gsc {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  &__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: $primary;
    border-bottom: 1px solid rgba($primary, 0.12);

    i { font-size: 0.8rem; }
  }

  &__at {
    margin-left: auto;
    font-size: 0.7rem;
    font-weight: 400;
    color: $text-secondary;
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__field-row {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__field {
    flex: 1;
    min-width: 0;
    padding: 0.65rem 0.8rem;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 10px;

    &--highlight {
      background: rgba($primary, 0.04);
      border-color: rgba($primary, 0.15);
    }

    &--cta {
      background: rgba($alert-error, 0.03);
      border-color: rgba($alert-error, 0.12);
    }
  }

  &__field-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    > i { font-size: 0.7rem; color: $primary; }
  }

  &__chip {
    padding: 0.1rem 0.35rem;
    font-size: 0.6rem;
    font-weight: 700;
    color: $primary-dark;
    text-transform: none;
    letter-spacing: 0;
    background: rgba($primary-dark, 0.08);
    border-radius: 6px;
  }

  &__field-content {
    font-size: 0.82rem;
    line-height: 1.5;
    color: $primary-dark;
    white-space: pre-wrap;

    &--bold { font-weight: 700; }
    &--script { line-height: 1.65; }
  }

  @media (min-width: 601px) {
    &__field-row { flex-direction: row; }
  }
}

.gsc-field-enter-active { transition: all 0.3s ease; }
.gsc-field-enter-from { opacity: 0; transform: translateY(10px); }
.gsc-field-enter-to { opacity: 1; transform: translateY(0); }
</style>
