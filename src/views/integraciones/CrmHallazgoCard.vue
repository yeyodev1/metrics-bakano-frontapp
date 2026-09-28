<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { CrmHallazgoTipo, CrmHallazgoVista } from '@/services/integraciones.service'
import { montoUsd } from './format'

/** Un hallazgo de la revisión: quién, qué pasó, qué hacer y el mensaje listo. */
const props = defineProps<{ hallazgo: CrmHallazgoVista }>()

const TIPOS: Record<CrmHallazgoTipo, { emoji: string; label: string }> = {
  cierre_casi_solo: { emoji: '🎯', label: 'Cierre casi solo' },
  lead_sin_respuesta: { emoji: '⏰', label: 'Lead sin respuesta' },
  oportunidad_estancada: { emoji: '🧊', label: 'Oportunidad estancada' },
}

const tipo = computed(() => TIPOS[props.hallazgo.tipo] ?? { emoji: '•', label: props.hallazgo.tipo })
const nombre = computed(() => props.hallazgo.contacto?.nombre || 'Contacto sin nombre')
const telefono = computed(() => props.hallazgo.contacto?.telefono || '')

const copiado = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copiar() {
  try {
    await navigator.clipboard.writeText(props.hallazgo.mensajeSugerido)
    copiado.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copiado.value = false), 2000)
  } catch {
    copiado.value = false
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <article class="hz" :class="`hz--${hallazgo.tipo}`">
    <header class="hz__head">
      <span class="hz__tag"><span aria-hidden="true">{{ tipo.emoji }}</span> {{ tipo.label }}</span>
      <span v-if="hallazgo.monto !== null" class="hz__monto">{{ montoUsd(hallazgo.monto) }}</span>
    </header>

    <div class="hz__who">
      <strong>{{ nombre }}</strong>
      <a v-if="telefono" :href="`tel:${telefono}`" class="hz__tel">
        <i class="fa-solid fa-phone" aria-hidden="true" /> {{ telefono }}
      </a>
      <span v-if="hallazgo.contacto?.email" class="hz__email">{{ hallazgo.contacto.email }}</span>
    </div>

    <p class="hz__resumen">{{ hallazgo.resumen }}</p>

    <dl class="hz__info">
      <div v-if="hallazgo.porQueEsCierre">
        <dt>Por qué</dt>
        <dd>{{ hallazgo.porQueEsCierre }}</dd>
      </div>
      <div v-if="hallazgo.queHacer">
        <dt>Qué hacer</dt>
        <dd>{{ hallazgo.queHacer }}</dd>
      </div>
    </dl>

    <div v-if="hallazgo.mensajeSugerido" class="hz__msg">
      <span class="hz__msg-label">Mensaje sugerido</span>
      <blockquote>{{ hallazgo.mensajeSugerido }}</blockquote>
      <button type="button" class="hz__copy" @click="copiar">
        <i :class="copiado ? 'fa-solid fa-check' : 'fa-regular fa-copy'" aria-hidden="true" />
        {{ copiado ? 'Copiado' : 'Copiar' }}
      </button>
      <span class="sr-only" aria-live="polite">{{ copiado ? 'Mensaje copiado' : '' }}</span>
    </div>
  </article>
</template>

<style lang="scss" scoped>
@mixin hz-tone($color) {
  border-left-color: $color;
  .hz__tag { background: rgba($color, 0.12); color: $primary-dark; }
}

.hz {
  display: flex; flex-direction: column; gap: 0.65rem;
  padding: 0.9rem; border-radius: 12px;
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-left: 4px solid $text-secondary;

  &--cierre_casi_solo { @include hz-tone($alert-success); }
  &--lead_sin_respuesta { @include hz-tone($alert-warning); }
  &--oportunidad_estancada { @include hz-tone($alert-info); }
}

.hz__head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }

.hz__tag {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.25rem 0.65rem; border-radius: 999px;
  font-size: 0.74rem; font-weight: 800;
}

.hz__monto { font-size: 0.86rem; font-weight: 800; color: $primary-dark; }

.hz__who {
  display: flex; flex-direction: column; gap: 0.15rem; min-width: 0;
  strong { font-size: 0.92rem; color: $primary-dark; overflow-wrap: anywhere; }
}

.hz__tel {
  display: inline-flex; align-items: center; gap: 0.35rem; align-self: flex-start;
  min-height: 32px; font-size: 0.82rem; font-weight: 600; color: $secondary; text-decoration: none;
  i { font-size: 0.72rem; }
}

.hz__email { font-size: 0.76rem; color: $text-secondary; overflow-wrap: anywhere; }

.hz__resumen { margin: 0; font-size: 0.84rem; line-height: 1.5; color: $primary-dark; }

.hz__info {
  margin: 0; display: flex; flex-direction: column; gap: 0.5rem;
  dt { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: $text-secondary; }
  dd { margin: 0.1rem 0 0; font-size: 0.82rem; line-height: 1.45; color: $primary-dark; }
}

.hz__msg {
  display: flex; flex-direction: column; gap: 0.45rem;
  padding: 0.7rem 0.75rem; border-radius: 10px; background: $primary-light;

  blockquote { margin: 0; font-size: 0.84rem; line-height: 1.5; color: $primary-dark; white-space: pre-wrap; }
}

.hz__msg-label { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: $text-secondary; }

.hz__copy {
  align-self: flex-start; min-height: 40px; padding: 0.45rem 0.9rem; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: $white; color: $primary-dark; border: 1px solid rgba($primary-dark, 0.14);
  font-family: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer;
  &:hover { border-color: rgba($primary-dark, 0.3); }
  &:focus-visible { outline: 2px solid $secondary; outline-offset: 2px; }
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
