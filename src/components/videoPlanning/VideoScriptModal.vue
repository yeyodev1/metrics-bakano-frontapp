<script setup lang="ts">
import type { VideoItem } from '@/types/videoPlanning'
import { conNegritas } from '@/utils/negritas'

const props = defineProps<{
  show: boolean
  item: VideoItem | null
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

function handlePrint() {
  if (!props.item) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Guión — ${props.item.tema}</title>
      <style>
        body { font-family: 'Georgia', serif; max-width: 700px; margin: 2rem auto; padding: 2rem; color: #1f2937; }
        h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }
        pre { white-space: pre-wrap; line-height: 1.8; font-family: inherit; font-size: 1rem; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>${props.item.tema}</h1>
      <p class="meta">${props.item.tipo ? `Tipo: ${props.item.tipo}` : ''} ${props.item.lugarGrabacion ? `· Lugar: ${props.item.lugarGrabacion}` : ''}</p>
      <pre>${conNegritas(props.item.guion || '(Sin guión)')}</pre>
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show && item" class="script-modal">
      <div class="script-modal__overlay" @click="emit('close')" />
      <div class="script-modal__container">
        <div class="script-modal__header">
          <div class="script-modal__header-left">
            <i class="fa-solid fa-scroll" />
            <div>
              <p class="script-modal__eyebrow">Guión</p>
              <h3 class="script-modal__title">{{ item.tema }}</h3>
            </div>
          </div>
          <div class="script-modal__header-actions">
            <button class="script-modal__print-btn" @click="handlePrint">
              <i class="fa-solid fa-print" />
              Imprimir
            </button>
            <button class="script-modal__close" @click="emit('close')">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div class="script-modal__meta" v-if="item.tipo || item.lugarGrabacion">
          <span v-if="item.tipo"><i class="fa-solid fa-tag" /> {{ item.tipo }}</span>
          <span v-if="item.lugarGrabacion"><i class="fa-solid fa-location-dot" /> {{ item.lugarGrabacion }}</span>
        </div>

        <div class="script-modal__body">
          <div v-if="item.descripcion" class="script-modal__description">
            <p class="script-modal__section-label">Descripción</p>
            <p>{{ item.descripcion }}</p>
          </div>

          <div class="script-modal__script-block">
            <p class="script-modal__section-label">Guión</p>
            <!-- v-html seguro: conNegritas escapa el HTML antes de convertir los asteriscos -->
            <pre v-if="item.guion" class="script-modal__script-text" v-html="conNegritas(item.guion)" />
            <p v-else class="script-modal__empty">Sin guión registrado.</p>
          </div>

          <div v-if="item.linkEjemplo" class="script-modal__link-block">
            <p class="script-modal__section-label">Ejemplo de referencia</p>
            <a :href="item.linkEjemplo" target="_blank" rel="noopener noreferrer" class="script-modal__link">
              <i class="fa-solid fa-arrow-up-right-from-square" />
              Ver ejemplo
            </a>
          </div>

          <div v-if="item.recursos" class="script-modal__resources">
            <p class="script-modal__section-label">Recursos necesarios</p>
            <p>{{ item.recursos }}</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.script-modal {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  z-index: 1200; padding: 1.5rem;

  &__overlay { position: absolute; inset: 0; background: rgba($primary-dark, 0.65); backdrop-filter: blur(10px); }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 720px;
    border-radius: 22px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
    max-height: 90dvh; display: flex; flex-direction: column;
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__header {
    padding: 1.25rem 1.75rem; border-bottom: 1px solid rgba($primary-dark, 0.06);
    display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  }
  &__header-left { display: flex; align-items: center; gap: 0.75rem; i { font-size: 1.4rem; color: $primary; } }
  &__eyebrow { margin: 0; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: $text-secondary; opacity: 0.6; }
  &__title { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }

  &__header-actions { display: flex; align-items: center; gap: 0.5rem; }

  &__print-btn {
    display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 10px;
    background: rgba($primary, 0.08); color: $primary; border: none; font-weight: 700;
    font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
    &:hover { background: $primary; color: $white; }
  }

  &__close {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: rgba($primary-dark, 0.05); color: $text-secondary; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: #fee2e2; color: #dc2626; }
  }

  &__meta {
    padding: 0.6rem 1.75rem; background: rgba($primary, 0.03); border-bottom: 1px solid rgba($primary-dark, 0.04);
    display: flex; gap: 1rem;
    span { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600; color: $text-secondary; }
    i { color: $primary; opacity: 0.7; font-size: 0.72rem; }
  }

  &__body { flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; }

  &__section-label {
    margin: 0 0 0.5rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.04em; color: $primary; opacity: 0.8;
  }

  &__description { p:last-child { margin: 0; font-size: 0.95rem; color: $primary-dark; line-height: 1.6; } }

  &__script-block {}

  &__script-text {
    margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 0.95rem;
    line-height: 1.8; color: $primary-dark;
    background: rgba($primary-dark, 0.02); border-radius: 12px; padding: 1rem 1.25rem;
    border: 1px solid rgba($primary-dark, 0.06);
  }

  &__empty { margin: 0; font-size: 0.9rem; color: $text-secondary; font-style: italic; }

  &__link {
    display: inline-flex; align-items: center; gap: 0.4rem; color: $primary; font-weight: 700;
    font-size: 0.88rem; text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  &__resources p { margin: 0; font-size: 0.9rem; color: $primary-dark; }
}

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
