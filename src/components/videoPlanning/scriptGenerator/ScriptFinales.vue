<template>
  <div class="fin">
    <div class="fin__head">
      <i class="fa-solid fa-flag-checkered" />
      <span>Los dos finales</span>
      <small>Mismo guión, distinto cierre. Graba los dos seguidos.</small>
    </div>

    <div class="fin__grid">
      <article
        v-for="opcion in opciones"
        :key="opcion.key"
        class="fin__card"
        :class="[`fin__card--${opcion.key}`, { 'is-used': usado === opcion.key }]"
      >
        <header class="fin__card-head">
          <span class="fin__tag">
            <i :class="opcion.icon" /> {{ opcion.label }}
          </span>
          <span v-if="usado === opcion.key" class="fin__used">
            <i class="fa-solid fa-check" /> En el guión
          </span>
        </header>

        <p class="fin__why">{{ opcion.why }}</p>
        <p class="fin__text">{{ opcion.texto || 'Este guión se generó antes de los dos finales.' }}</p>

        <footer class="fin__actions">
          <button type="button" class="fin__btn" :disabled="!opcion.texto" @click="copiar(opcion)">
            <i :class="copiado === opcion.key ? 'fa-solid fa-check' : 'fa-regular fa-copy'" />
            {{ copiado === opcion.key ? 'Copiado' : 'Copiar' }}
          </button>
          <button
            type="button"
            class="fin__btn fin__btn--use"
            :disabled="!opcion.texto || usado === opcion.key"
            @click="emit('use', opcion.key, opcion.texto)"
          >
            <i class="fa-solid fa-arrow-turn-down" /> Usar este final
          </button>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FinalKey } from './constants'
import type { GuionIA } from '@/types/videoPlanning'

interface Opcion {
  key: FinalKey
  label: string
  icon: string
  why: string
  texto: string
}

const props = defineProps<{ guionIA: GuionIA; usado?: FinalKey | null }>()
const emit = defineEmits<{ (e: 'use', key: FinalKey, texto: string): void }>()

// Los guiones viejos solo tienen `cta`: se muestra en la tarjeta de feed en vez
// de dejar las dos vacías, que se leería como que la generación falló.
const opciones = computed<Opcion[]>(() => [
  {
    key: 'feed',
    label: 'Feed',
    icon: 'fa-brands fa-instagram',
    why: 'Para quien ya te sigue. Pide comentar, guardar o seguir.',
    texto: (props.guionIA.ctaFeed || props.guionIA.cta || '').trim(),
  },
  {
    key: 'ads',
    label: 'Anuncio',
    icon: 'fa-solid fa-bullhorn',
    why: 'Para quien no te conoce. Una sola acción: link, WhatsApp o compra.',
    texto: (props.guionIA.ctaAds || '').trim(),
  },
])

const copiado = ref<FinalKey | null>(null)

async function copiar(opcion: Opcion) {
  try {
    await navigator.clipboard.writeText(opcion.texto)
    copiado.value = opcion.key
    setTimeout(() => { copiado.value = null }, 1600)
  } catch {
    // Sin permiso de portapapeles queda el texto a la vista para copiarlo a mano.
  }
}
</script>

<style lang="scss" scoped>
.fin {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fin__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  > i { font-size: 0.7rem; color: $primary; }

  small {
    font-size: 0.68rem;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }
}

.fin__grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fin__card {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  padding: 0.7rem 0.8rem;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;

  &--feed { background: rgba(#e1306c, 0.03); border-color: rgba(#e1306c, 0.16); }
  &--ads { background: rgba($primary, 0.03); border-color: rgba($primary, 0.16); }

  &.is-used {
    border-width: 2px;
    border-color: $alert-success;
  }
}

.fin__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.fin__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: $primary-dark;
}

.fin__used {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.62rem;
  font-weight: 800;
  color: $alert-success;
}

.fin__why {
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.4;
  color: $text-secondary;
}

.fin__text {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.5;
  color: $primary-dark;
  white-space: pre-wrap;
}

.fin__actions {
  display: flex;
  gap: 0.4rem;
  margin-top: auto;
  padding-top: 0.35rem;
}

.fin__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.6rem;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.04);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) { color: $primary-dark; background: rgba($primary-dark, 0.09); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  &--use {
    color: $white;
    background: $primary;

    &:hover:not(:disabled) { color: $white; filter: brightness(1.08); }
  }
}

@media (min-width: 601px) {
  .fin__grid { flex-direction: row; }
}
</style>
