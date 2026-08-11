<template>
  <div class="jcs">
    <span class="jcs__label">
      <i class="fa-solid fa-route" /> Caso de Uso / Customer Journey
    </span>

    <div v-if="options.length" class="jcs__options">
      <button
        v-for="c in options"
        :key="c.casoNumero"
        type="button"
        :class="['jcs__btn', { 'is-active': modelValue === c.casoNumero }]"
        @click="$emit('update:modelValue', modelValue === c.casoNumero ? null : c.casoNumero)"
      >
        <i :class="modelValue === c.casoNumero ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
        <span>{{ c.nombreCaso }}</span>
      </button>
    </div>

    <!-- Better no option than someone else's options -->
    <p v-else class="jcs__empty">
      <i class="fa-solid fa-circle-info" />
      Esta marca aún no tiene definido su Customer Journey. Defínelo en
      "Definir Estrategia de Marca" para poder clasificar los videos por caso.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CustomerJourneyCase } from '@/types'

const props = defineProps<{
  modelValue: number | null
  cases?: CustomerJourneyCase[]
}>()

defineEmits<{ (e: 'update:modelValue', value: number | null): void }>()

/**
 * Only this workspace's own cases. A hardcoded fallback used to offer every
 * brand the cases of one specific client, and whatever got picked was saved as
 * this video's `casoUsoRef` — poisoning the dimension the analysis groups by.
 */
const options = computed(() =>
  (props.cases ?? []).map((c) => ({
    casoNumero: c.casoNumero,
    nombreCaso:
      c.nombreCaso ||
      `Caso ${c.casoNumero}: ${c.potencialCliente?.substring(0, 40) || 'Sin título'}`,
  }))
)
</script>

<style scoped lang="scss">
.jcs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.jcs__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: $primary-dark;

  i { color: $secondary; }
}

.jcs__options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.jcs__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  font-size: 0.82rem;
  color: $primary-dark;
  text-align: left;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;

  &:hover { border-color: rgba($secondary, 0.4); }

  &.is-active {
    font-weight: 700;
    color: $secondary-dark;
    background: $overlay-purple;
    border-color: $secondary;

    i { color: $secondary; }
  }

  i { flex-shrink: 0; color: rgba($primary-dark, 0.25); }
}

.jcs__empty {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.65rem 0.8rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: $primary-dark;
  background: $alert-info-bg;
  border-radius: 8px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-info; }
}
</style>
