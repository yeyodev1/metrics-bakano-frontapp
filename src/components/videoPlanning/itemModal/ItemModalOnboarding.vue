<template>
  <!--
    Shown before the form when the brand is not set up yet.
    A script written without strategy comes out generic, and no amount of
    regenerating fixes it — so the missing pieces are stated up front with the
    way to solve each one.
  -->
  <section v-if="steps.length" class="imo">
    <header class="imo__head">
      <div class="imo__icon"><i class="fa-solid fa-flag-checkered" /></div>
      <div>
        <h4>Antes de crear el guión</h4>
        <p>
          Falta {{ steps.length === 1 ? 'un dato' : `${steps.length} datos` }} de la marca.
          Sin ellos la IA escribe genérico y ningún "regenerar" lo arregla.
        </p>
      </div>
      <button type="button" class="imo__toggle" @click="open = !open">
        {{ open ? 'Ocultar' : 'Ver qué falta' }}
        <i :class="open ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
      </button>
    </header>

    <AccordionTransition>
      <ol v-if="open" class="imo__steps">
        <li v-for="(s, i) in steps" :key="s.key" class="imo__step">
          <span class="imo__num">{{ i + 1 }}</span>
          <div class="imo__step-body">
            <strong>{{ s.title }}</strong>
            <span>{{ s.why }}</span>
          </div>
          <button type="button" class="imo__go" @click="$emit('go', s.target)">
            Definir <i class="fa-solid fa-arrow-right" />
          </button>
        </li>
      </ol>
    </AccordionTransition>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AccordionTransition from '@/components/common/AccordionTransition.vue'
import type { BrandProfile } from '@/types'

/**
 * Where each gap is actually filled.
 *
 * `brand-profile` is its own page; the other three live in the strategy wizard
 * behind the builder's Journey tab. Sending them all to a builder tab was the
 * bug: "Perfil de marca" pointed at the script matrix, which has no way to
 * define a profile, so the button led nowhere.
 */
export type OnboardingTarget = 'brand-profile' | 'journey'

const props = defineProps<{ brandProfile?: BrandProfile | null }>()

defineEmits<{ (e: 'go', target: OnboardingTarget): void }>()

const open = ref(true)

/** Ordered by how much each gap hurts the generated script. */
const steps = computed(() => {
  const bp = props.brandProfile
  const list: Array<{ key: string; title: string; why: string; target: OnboardingTarget }> = []

  if (!bp?.descripcion) {
    list.push({
      key: 'perfil',
      title: 'Perfil de marca',
      why: 'Qué vende, a quién y con qué tono. Es la base de todo.',
      target: 'brand-profile',
    })
  }

  if (!bp?.customerJourneyCases?.length) {
    list.push({
      key: 'journey',
      title: 'Customer Journey',
      why: 'De aquí sale el gancho: el dolor concreto de un tipo de cliente.',
      target: 'journey',
    })
  }

  if (!bp?.propuestaValor) {
    list.push({
      key: 'propuesta',
      title: 'Propuesta de valor',
      why: 'Lo que hace distinta a la marca. Sin esto el guión suena a cualquiera.',
      target: 'journey',
    })
  }

  if (!bp?.segmentosMercado?.length) {
    list.push({
      key: 'segmentos',
      title: 'Segmentos de mercado',
      why: 'A quién le habla la marca, en sus propias palabras.',
      target: 'journey',
    })
  }

  return list
})
</script>

<style scoped lang="scss">
.imo {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  background: $alert-warning-bg;
  border: 1.5px solid rgba($alert-warning, 0.35);
  border-radius: 12px;
}

.imo__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;

  h4 { margin: 0 0 0.15rem; font-size: 0.9rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.78rem; line-height: 1.45; color: $text-secondary; }

  > div:nth-child(2) { flex: 1 1 14rem; min-width: 0; }
}

.imo__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
  color: $white;
  background: $alert-warning;
  border-radius: 10px;
}

.imo__toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  color: $alert-warning;
  background: $white;
  border: 1.5px solid rgba($alert-warning, 0.4);
  border-radius: 8px;
  cursor: pointer;
}

.imo__steps {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.imo__step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  background: $white;
  border-radius: 9px;
}

.imo__num {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 0.66rem;
  font-weight: 800;
  color: $white;
  background: $alert-warning;
  border-radius: 50%;
}

.imo__step-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.8rem; color: $primary-dark; }
  span { font-size: 0.72rem; line-height: 1.4; color: $text-secondary; }
}

.imo__go {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 700;
  color: $secondary-dark;
  background: $overlay-purple;
  border: none;
  border-radius: 7px;
  cursor: pointer;

  &:hover { background: rgba($secondary, 0.18); }

  i { font-size: 0.6rem; }
}
</style>
