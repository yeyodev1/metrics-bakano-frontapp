<template>
  <!--
    Una fuente de métricas del guion, con identidad visual propia.

    Orgánico y pautado traen números distintos (vistas y guardados vs gasto y
    conversaciones) y se vinculan por separado. Antes el anuncio vivía escondido
    tras un acordeón rotulado "(Opcional)" y nadie notaba que existía.
  -->
  <section :class="['lss', `lss--${kind}`, { 'is-active': selected }]">
    <button type="button" class="lss__head" :aria-expanded="open" @click="$emit('toggle')">
      <span class="lss__icon"><i :class="icon" /></span>

      <span class="lss__titles">
        <strong>{{ title }}</strong>
        <small>{{ hint }}</small>
      </span>

      <span v-if="selected" class="lss__state">
        <i class="fa-solid fa-circle-check" /> {{ selectedLabel }}
      </span>
      <span v-else class="lss__state lss__state--empty">Sin vincular</span>

      <i class="lss__chevron fa-solid fa-chevron-down" :class="{ 'is-open': open }" />
    </button>

    <AccordionTransition>
      <div v-if="open" class="lss__body">
        <slot />
      </div>
    </AccordionTransition>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AccordionTransition from '@/components/common/AccordionTransition.vue'

const props = defineProps<{
  kind: 'reel' | 'ad'
  title: string
  hint: string
  selected: boolean
  selectedLabel: string
  open: boolean
}>()

defineEmits<{ (e: 'toggle'): void }>()

const icon = computed(() =>
  props.kind === 'reel' ? 'fa-brands fa-instagram' : 'fa-solid fa-bullhorn'
)
</script>

<style scoped lang="scss">
.lss {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  transition: border-color 0.2s;
}

// Cada fuente tiene su color para que se distingan de un vistazo.
.lss--reel.is-active { border-color: rgba($secondary, 0.45); }
.lss--ad.is-active { border-color: rgba($primary, 0.45); }

.lss__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  font-family: inherit;
  text-align: left;
  background: $white;
  border: 0;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba($primary-dark, 0.02); }
}

.lss__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 0.9rem;
  color: $white;
  border-radius: 9px;
}

.lss--reel .lss__icon { background: $secondary; }
.lss--ad .lss__icon { background: $primary; }

.lss__titles {
  display: flex;
  flex: 1 1 12rem;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.88rem; color: $primary-dark; }
  small { font-size: 0.72rem; line-height: 1.4; color: $text-secondary; }
}

.lss__state {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 20px;
}

.lss--reel .lss__state { color: $secondary-dark; background: $overlay-purple; }
.lss--ad .lss__state { color: $primary; background: rgba($primary, 0.12); }

.lss__state--empty {
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
}

.lss__chevron {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: $text-secondary;
  transition: transform 0.22s ease;

  &.is-open { transform: rotate(180deg); }
}

@media (prefers-reduced-motion: reduce) {
  .lss__chevron { transition: none; }
}

.lss__body {
  padding: 0 0.9rem 0.9rem;
  border-top: 1px solid rgba($primary-dark, 0.06);
}
</style>
