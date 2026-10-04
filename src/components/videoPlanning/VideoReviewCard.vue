<script setup lang="ts">
import { computed } from 'vue'
import { MAX_RONDAS_VIDEO, type CambioVideo, type VideoItem } from '@/types/videoPlanning'

/**
 * Un video terminado esperando el veredicto del cliente. La tarjeta no guarda
 * estado propio: el veredicto vive en la vista, que es quien lo envía junto.
 *
 * Pedir cambios es por segundo: cada cambio dice en qué momento del video
 * está y qué cambiar. Hay dos rondas por video; sin rondas, solo se aprueba.
 */
const props = defineProps<{
  item: VideoItem
  verdict: { estado: 'APROBADO' | 'RECHAZADO' | null; cambios: CambioVideo[] }
  locked: boolean
  /** Error del servidor sobre este video (ej. cambio de vanidad). */
  error?: string
}>()

const emit = defineEmits<{
  (e: 'set-estado', estado: 'APROBADO' | 'RECHAZADO' | null): void
  (e: 'set-cambios', cambios: CambioVideo[]): void
}>()

/** El link que el cliente puede abrir: el video final primero, Drive de respaldo. */
const enlaceVideo = computed(() => props.item.linkVideo || props.item.driveLink || '')
const version = computed(() => props.item.versiones?.length || 1)
const rondasRestantes = computed(() => Math.max(0, MAX_RONDAS_VIDEO - (props.item.rondasUsadas ?? 0)))
const SEGUNDO = /^\s*\d{1,2}:[0-5]?\d\s*$|^\s*\d{1,4}\s*s?\s*$/

function toggle(estado: 'APROBADO' | 'RECHAZADO') {
  if (props.locked) return
  if (estado === 'RECHAZADO' && !rondasRestantes.value) return
  const nuevo = props.verdict.estado === estado ? null : estado
  emit('set-estado', nuevo)
  if (nuevo === 'RECHAZADO' && !props.verdict.cambios.length) emit('set-cambios', [{ segundo: '', texto: '' }])
}

function editar(i: number, campo: keyof CambioVideo, valor: string) {
  const cambios = props.verdict.cambios.map((c, j) => (j === i ? { ...c, [campo]: valor } : c))
  emit('set-cambios', cambios)
}

function agregar() {
  emit('set-cambios', [...props.verdict.cambios, { segundo: '', texto: '' }])
}

function quitar(i: number) {
  emit('set-cambios', props.verdict.cambios.filter((_, j) => j !== i))
}

function segundoInvalido(c: CambioVideo): boolean {
  return !!c.segundo && !SEGUNDO.test(c.segundo)
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
      <span v-if="version > 1" class="vrc__version">Versión {{ version }}</span>
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

    <p class="vrc__rondas" :class="{ 'vrc__rondas--fin': !rondasRestantes }">
      <i class="fa-solid fa-rotate" />
      <template v-if="rondasRestantes">
        Te {{ rondasRestantes === 1 ? 'queda 1 ronda' : `quedan ${rondasRestantes} rondas` }} de cambios para este video.
      </template>
      <template v-else>Ya usaste tus {{ MAX_RONDAS_VIDEO }} rondas de cambios: esta versión solo se puede aprobar.</template>
    </p>

    <div class="vrc__actions">
      <button
        type="button"
        class="vrc__btn vrc__btn--ok"
        :class="{ 'is-active': verdict.estado === 'APROBADO' }"
        :disabled="locked"
        @click="toggle('APROBADO')"
      >
        <i class="fa-solid fa-thumbs-up" /> Aprobar
      </button>
      <button
        type="button"
        class="vrc__btn vrc__btn--no"
        :class="{ 'is-active': verdict.estado === 'RECHAZADO' }"
        :disabled="locked || !rondasRestantes"
        @click="toggle('RECHAZADO')"
      >
        <i class="fa-solid fa-pen-to-square" /> Pedir cambios
      </button>
    </div>

    <div v-if="verdict.estado === 'RECHAZADO'" class="vrc__cambios">
      <p class="vrc__regla">
        <i class="fa-solid fa-chart-line" />
        Solo hacemos cambios que te ayuden a vender: el mensaje, la oferta, un precio o dato incorrecto, el llamado a la acción o algo que no se entiende.
        Colores, letras, música o estilo por gusto no entran: no somos una productora audiovisual, somos tu equipo de crecimiento.
      </p>
      <div v-for="(c, i) in verdict.cambios" :key="i" class="vrc__cambio">
        <label class="vrc__seg">
          <span>Segundo</span>
          <input
            :value="c.segundo"
            :disabled="locked"
            :class="{ 'is-error': segundoInvalido(c) }"
            inputmode="numeric"
            placeholder="0:15"
            maxlength="6"
            @input="editar(i, 'segundo', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="vrc__txt">
          <span>Qué cambiar</span>
          <textarea
            :value="c.texto"
            :disabled="locked"
            rows="2"
            placeholder="Ej: el precio es $25, no $20"
            @input="editar(i, 'texto', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>
        <button
          v-if="verdict.cambios.length > 1"
          type="button"
          class="vrc__quitar"
          :disabled="locked"
          aria-label="Quitar este cambio"
          @click="quitar(i)"
        >
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <button type="button" class="vrc__agregar" :disabled="locked" @click="agregar">
        <i class="fa-solid fa-plus" /> Agregar otro cambio
      </button>
    </div>

    <p v-if="error" class="vrc__error"><i class="fa-solid fa-triangle-exclamation" /> {{ error }}</p>
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

  &__version {
    margin-left: auto;
    font-size: 0.7rem;
    font-weight: 700;
    color: #7c3aed;
    background: rgba(#7c3aed, 0.08);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    flex-shrink: 0;
  }

  &__rondas {
    margin: 0;
    font-size: 0.76rem;
    color: #2563eb;

    i { margin-right: 0.35rem; }

    &--fin { color: #b45309; }
  }

  &__cambios {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__regla {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: #92400e;
    background: rgba(#f59e0b, 0.1);
    border: 1px solid rgba(#f59e0b, 0.3);
    border-radius: 10px;
    padding: 0.55rem 0.7rem;

    i { color: #d97706; margin-right: 0.35rem; }
  }

  &__cambio {
    display: grid;
    grid-template-columns: 4.6rem 1fr auto;
    gap: 0.5rem;
    align-items: start;
  }

  &__seg,
  &__txt {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;

    span {
      font-size: 0.68rem;
      font-weight: 700;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid rgba(#ef4444, 0.35);
      border-radius: 10px;
      padding: 0.5rem 0.6rem;
      font-size: 0.82rem;
      font-family: inherit;
      color: $primary-dark;
      resize: vertical;

      &:focus { outline: none; border-color: #ef4444; }
      &.is-error { border-color: #dc2626; background: rgba(#ef4444, 0.05); }
    }

    input { font-variant-numeric: tabular-nums; text-align: center; }
  }

  &__quitar {
    margin-top: 1.2rem;
    border: none;
    background: none;
    color: $text-secondary;
    cursor: pointer;
    padding: 0.4rem;

    &:hover { color: #dc2626; }
  }

  &__agregar {
    align-self: flex-start;
    border: 1px dashed rgba($primary, 0.3);
    background: none;
    color: $primary;
    border-radius: 10px;
    padding: 0.45rem 0.8rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;

    i { margin-right: 0.3rem; }
  }

  &__error {
    margin: 0;
    font-size: 0.78rem;
    color: #b91c1c;
    line-height: 1.45;

    i { margin-right: 0.35rem; }
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
