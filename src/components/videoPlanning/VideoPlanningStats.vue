<script setup lang="ts">
import { computed } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'
import { EstadoProduccion, EstadoEdicion, ClienteAprobacion, EstadoPublicacion } from '@/types/videoPlanning'

const props = defineProps<{ items: VideoItem[] }>()

const total = computed(() => props.items.length)
const grabados = computed(() => props.items.filter(i => i.estadoProduccion === EstadoProduccion.GRABADO).length)
const editados = computed(() => props.items.filter(i => i.edicion === EstadoEdicion.EDITADO).length)
const publicados = computed(() => props.items.filter(i => i.estadoPublicacion === EstadoPublicacion.PUBLICADO || i.estadoPublicacion === EstadoPublicacion.PROGRAMADO).length)
const aprobados = computed(() => props.items.filter(i => i.clienteAprobacion === ClienteAprobacion.APROBADO).length)

function pct(n: number) {
  if (!total.value) return 0
  return Math.round((n / total.value) * 100)
}
</script>

<template>
  <div class="vp-stats">
    <div class="vp-stats__card">
      <div class="vp-stats__icon vp-stats__icon--neutral">
        <i class="fa-solid fa-film" />
      </div>
      <div class="vp-stats__info">
        <span class="vp-stats__num">{{ total }}</span>
        <span class="vp-stats__label">Videos totales</span>
      </div>
    </div>

    <div class="vp-stats__card vp-stats__card--green">
      <div class="vp-stats__icon vp-stats__icon--green">
        <i class="fa-solid fa-video" />
      </div>
      <div class="vp-stats__info">
        <span class="vp-stats__num">{{ grabados }}<small>/{{ total }}</small></span>
        <span class="vp-stats__label">Grabados</span>
        <div class="vp-stats__bar">
          <div class="vp-stats__bar-fill" :style="{ width: `${pct(grabados)}%` }" />
        </div>
      </div>
    </div>

    <div class="vp-stats__card vp-stats__card--blue">
      <div class="vp-stats__icon vp-stats__icon--blue">
        <i class="fa-solid fa-scissors" />
      </div>
      <div class="vp-stats__info">
        <span class="vp-stats__num">{{ editados }}<small>/{{ total }}</small></span>
        <span class="vp-stats__label">Editados</span>
        <div class="vp-stats__bar">
          <div class="vp-stats__bar-fill vp-stats__bar-fill--blue" :style="{ width: `${pct(editados)}%` }" />
        </div>
      </div>
    </div>

    <div class="vp-stats__card vp-stats__card--purple">
      <div class="vp-stats__icon vp-stats__icon--purple">
        <i class="fa-brands fa-instagram" />
      </div>
      <div class="vp-stats__info">
        <span class="vp-stats__num">{{ publicados }}<small>/{{ total }}</small></span>
        <span class="vp-stats__label">Programados / Publicados</span>
        <div class="vp-stats__bar">
          <div class="vp-stats__bar-fill vp-stats__bar-fill--purple" :style="{ width: `${pct(publicados)}%` }" />
        </div>
      </div>
    </div>

    <div class="vp-stats__card vp-stats__card--orange">
      <div class="vp-stats__icon vp-stats__icon--orange">
        <i class="fa-solid fa-circle-check" />
      </div>
      <div class="vp-stats__info">
        <span class="vp-stats__num">{{ aprobados }}<small>/{{ total }}</small></span>
        <span class="vp-stats__label">Aprobados cliente</span>
        <div class="vp-stats__bar">
          <div class="vp-stats__bar-fill vp-stats__bar-fill--orange" :style="{ width: `${pct(aprobados)}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vp-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.875rem;

  &__card {
    background: $white;
    border-radius: 16px;
    border: 1px solid rgba($primary-dark, 0.07);
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    box-shadow: 0 1px 6px rgba($primary-dark, 0.04);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba($primary-dark, 0.08);
    }

    &--green  { border-color: rgba(#22c55e, 0.2); }
    &--blue   { border-color: rgba(#3b82f6, 0.2); }
    &--purple { border-color: rgba(#a855f7, 0.2); }
    &--orange { border-color: rgba(#f97316, 0.2); }
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    flex-shrink: 0;

    &--neutral { background: rgba($primary-dark, 0.06); color: $primary-dark; }
    &--green   { background: #dcfce7; color: #16a34a; }
    &--blue    { background: #dbeafe; color: #2563eb; }
    &--purple  { background: #f3e8ff; color: #9333ea; }
    &--orange  { background: #ffedd5; color: #ea580c; }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__num {
    font-size: 1.45rem;
    font-weight: 800;
    color: $primary-dark;
    line-height: 1;

    small {
      font-size: 0.75rem;
      font-weight: 600;
      color: $text-secondary;
      margin-left: 0.15rem;
    }
  }

  &__label {
    font-size: 0.7rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__bar {
    height: 3px;
    background: rgba($primary-dark, 0.07);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 0.15rem;
  }

  &__bar-fill {
    height: 100%;
    background: #22c55e;
    border-radius: 10px;
    transition: width 0.4s ease;

    &--blue   { background: #3b82f6; }
    &--purple { background: #a855f7; }
    &--orange { background: #f97316; }
  }
}
</style>
