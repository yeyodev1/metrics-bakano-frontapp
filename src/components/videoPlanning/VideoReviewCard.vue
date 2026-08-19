<script setup lang="ts">
import { computed } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'

/**
 * Un video terminado esperando el veredicto del cliente. La tarjeta no guarda
 * estado propio: el veredicto vive en la vista, que es quien lo envía junto.
 */
const props = defineProps<{
  item: VideoItem
  verdict: { estado: 'APROBADO' | 'RECHAZADO' | null; motivo: string }
  locked: boolean
}>()

const emit = defineEmits<{
  (e: 'set-estado', estado: 'APROBADO' | 'RECHAZADO' | null): void
  (e: 'set-motivo', motivo: string): void
}>()

/** El link que el cliente puede abrir: el video final primero, Drive de respaldo. */
const enlaceVideo = computed(() => props.item.linkVideo || props.item.driveLink || '')

function toggle(estado: 'APROBADO' | 'RECHAZADO') {
  if (props.locked) return
  emit('set-estado', props.verdict.estado === estado ? null : estado)
}
</script>

<template>
  <article
    class="vrc"
    :class="{
      'vrc--aprobado': verdict.estado === 'APROBADO',
      'vrc--rechazado': verdict.estado === 'RECHAZADO',
    }"
  >
    <header class="vrc__head">
      <span class="vrc__num">#{{ String(item.numero).padStart(2, '0') }}</span>
      <h3 class="vrc__tema">{{ item.tema }}</h3>
    </header>

    <a
      v-if="enlaceVideo"
      :href="enlaceVideo"
      target="_blank"
      rel="noopener"
      class="vrc__video-link"
    >
      <i class="fa-solid fa-circle-play" />
      Ver el video
      <i class="fa-solid fa-arrow-up-right-from-square vrc__ext" />
    </a>
    <p v-else class="vrc__sin-link">
      <i class="fa-solid fa-circle-info" />
      El video se está subiendo; pregunta a tu equipo por el enlace.
    </p>

    <div class="vrc__actions">
      <button
        type="button"
        class="vrc__btn vrc__btn--ok"
        :class="{ 'is-active': verdict.estado === 'APROBADO' }"
        :disabled="locked"
        @click="toggle('APROBADO')"
      >
        <i class="fa-solid fa-thumbs-up" /> Me gusta
      </button>
      <button
        type="button"
        class="vrc__btn vrc__btn--no"
        :class="{ 'is-active': verdict.estado === 'RECHAZADO' }"
        :disabled="locked"
        @click="toggle('RECHAZADO')"
      >
        <i class="fa-solid fa-thumbs-down" /> Pedir cambios
      </button>
    </div>

    <textarea
      v-if="verdict.estado === 'RECHAZADO'"
      class="vrc__motivo"
      :value="verdict.motivo"
      :disabled="locked"
      rows="2"
      placeholder="Cuéntanos qué quieres cambiar de este video (obligatorio)"
      @input="emit('set-motivo', ($event.target as HTMLTextAreaElement).value)"
    />
  </article>
</template>

<style scoped lang="scss">
.vrc {
  background: #fff;
  border: 1px solid rgba($primary, 0.12);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  transition: border-color 0.15s ease;

  &--aprobado { border-color: rgba(#10b981, 0.5); }
  &--rechazado { border-color: rgba(#ef4444, 0.45); }

  &__head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
  }

  &__num {
    font-size: 0.75rem;
    font-weight: 800;
    color: $primary;
    background: rgba($primary, 0.08);
    border-radius: 8px;
    padding: 0.2rem 0.5rem;
    flex-shrink: 0;
  }

  &__tema {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
    color: $primary-dark;
    line-height: 1.35;
  }

  &__video-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    align-self: flex-start;
    background: rgba($primary, 0.07);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 10px;
    padding: 0.55rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.15s ease;

    &:hover { background: rgba($primary, 0.12); }
  }

  &__ext { font-size: 0.65rem; opacity: 0.7; }

  &__sin-link {
    margin: 0;
    font-size: 0.78rem;
    color: $text-secondary;

    i { margin-right: 0.35rem; }
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }

  &__btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    background: #fff;
    transition: all 0.15s ease;

    &:disabled { opacity: 0.55; cursor: not-allowed; }

    &--ok {
      border: 1px solid rgba(#10b981, 0.4);
      color: #059669;

      &.is-active {
        background: #10b981;
        border-color: #10b981;
        color: #fff;
      }
    }

    &--no {
      border: 1px solid rgba(#ef4444, 0.35);
      color: #dc2626;

      &.is-active {
        background: #ef4444;
        border-color: #ef4444;
        color: #fff;
      }
    }
  }

  &__motivo {
    width: 100%;
    border: 1px solid rgba(#ef4444, 0.35);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    font-size: 0.82rem;
    font-family: inherit;
    resize: vertical;
    color: $primary-dark;

    &:focus {
      outline: none;
      border-color: #ef4444;
    }
  }
}
</style>
