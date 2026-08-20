<script setup lang="ts">
import EditorEntregaVideo from './EditorEntregaVideo.vue'
import type { VideoItem } from '@/types/videoPlanning'

/**
 * Un video dentro de la produccion, desde los ojos del editor: fecha limite
 * a la vista, guion expandible y el boton de marcar editado. La fecha viene
 * calculada desde la vista (real si hay fechaPublicacion, estimada si no).
 */
defineProps<{
  item: VideoItem
  expanded: boolean
  updating: boolean
  /** null cuando no aplica (ya editado o sin datos para estimar). */
  deadline: { texto: string; urgente: boolean; estimado: boolean } | null
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'advance'): void
  (e: 'save-link', link: string): void
}>()

const TIPO_STYLE: Record<string, { bg: string; color: string }> = {
  TOFU: { bg: '#ede9fe', color: '#7c3aed' },
  MOFU: { bg: '#fef3c7', color: '#b45309' },
  BOFU: { bg: '#fee2e2', color: '#dc2626' },
}

const EDICION_LABEL: Record<string, string> = {
  POR_EDITAR: 'Por editar',
  EDITADO: 'Editado',
  RECHAZADO: 'Re-editar',
}
</script>

<template>
  <div
    class="epi"
    :class="{
      'epi--done': item.edicion === 'EDITADO',
      'epi--rejected': item.edicion === 'RECHAZADO',
      'epi--open': expanded,
    }"
  >
    <div class="epi__row" @click="emit('toggle')">
      <span class="epi__num">#{{ item.numero }}</span>

      <div class="epi__main">
        <span class="epi__tema">{{ item.tema }}</span>
        <span v-if="item.edicion === 'RECHAZADO' && item.motivoRechazo" class="epi__motivo">
          <i class="fa-solid fa-circle-xmark" /> {{ item.motivoRechazo }}
        </span>
        <span v-else-if="item.tipo" class="epi__tipo-sub">{{ item.tipo }}</span>
        <span v-if="item.linkVideo || item.driveLink" class="epi__entregado">
          <i class="fa-solid fa-link" /> Video entregado
        </span>
        <span v-else-if="item.edicion === 'EDITADO'" class="epi__sin-link">
          <i class="fa-solid fa-triangle-exclamation" /> Editado sin enlace: el cliente no lo puede ver
        </span>
      </div>

      <div class="epi__right">
        <span
          v-if="deadline"
          class="epi__deadline"
          :class="{ 'epi__deadline--urgente': deadline.urgente }"
          :title="deadline.estimado ? 'Fecha estimada: reparto de los pendientes en los días que quedan del mes' : 'Según la fecha de publicación'"
        >
          <i class="fa-regular fa-clock" />
          {{ deadline.texto }}
          <em v-if="deadline.estimado">est.</em>
        </span>

        <span
          v-if="item.tipoGuion"
          class="epi__tipo-chip"
          :style="TIPO_STYLE[item.tipoGuion] ? { background: TIPO_STYLE[item.tipoGuion].bg, color: TIPO_STYLE[item.tipoGuion].color } : {}"
        >
          {{ item.tipoGuion }}
        </span>

        <button
          class="epi__state-btn"
          :class="{
            'epi__state-btn--done': item.edicion === 'EDITADO',
            'epi__state-btn--rejected': item.edicion === 'RECHAZADO',
          }"
          :disabled="updating"
          :title="item.edicion === 'EDITADO' ? 'Click para revertir a Por editar' : 'Marcar como Editado'"
          @click.stop="emit('advance')"
        >
          <i v-if="updating" class="fa-solid fa-circle-notch fa-spin" />
          <template v-else>
            <i v-if="item.edicion === 'EDITADO'" class="fa-solid fa-circle-check" />
            <i v-else class="fa-regular fa-circle" />
            <span>{{ EDICION_LABEL[item.edicion] ?? item.edicion }}</span>
          </template>
        </button>

        <i class="fa-solid fa-chevron-down epi__chevron" :class="{ 'epi__chevron--open': expanded }" />
      </div>
    </div>

    <Transition name="epi-slide">
      <div v-if="expanded" class="epi__script">
        <template v-if="item.guionIA?.gancho">
          <div v-if="item.guionIA.conceptoVisual" class="epi__block epi__block--concept">
            <span class="epi__block-label">Concepto visual</span>
            <p>{{ item.guionIA.conceptoVisual }}</p>
          </div>
          <div class="epi__block epi__block--hook">
            <span class="epi__block-label">Gancho</span>
            <p>{{ item.guionIA.gancho }}</p>
          </div>
          <div v-if="item.guionIA.textoPantalla" class="epi__block">
            <span class="epi__block-label">Texto en pantalla</span>
            <p>{{ item.guionIA.textoPantalla }}</p>
          </div>
          <div class="epi__block">
            <span class="epi__block-label">Cuerpo</span>
            <p class="epi__pre">{{ item.guionIA.cuerpo }}</p>
          </div>
          <div class="epi__block epi__block--cta">
            <span class="epi__block-label">CTA</span>
            <p>{{ item.guionIA.cta }}</p>
          </div>
          <div v-if="item.guionIA.broll" class="epi__block epi__block--broll">
            <span class="epi__block-label">B-Roll / Referencias</span>
            <p>{{ item.guionIA.broll }}</p>
          </div>
        </template>

        <template v-else-if="item.guion?.trim()">
          <div class="epi__block">
            <span class="epi__block-label">Guión</span>
            <p class="epi__pre">{{ item.guion }}</p>
          </div>
        </template>

        <div v-else class="epi__no-script">
          <i class="fa-solid fa-file-pen" />
          Sin guión generado todavía
        </div>

        <div v-if="item.descripcion" class="epi__block epi__block--muted">
          <span class="epi__block-label">Descripción</span>
          <p>{{ item.descripcion }}</p>
        </div>

        <a v-if="item.linkEjemplo" :href="item.linkEjemplo" target="_blank" rel="noopener" class="epi__ref-link">
          <i class="fa-solid fa-arrow-up-right-from-square" />
          Ver referencia
        </a>

        <!-- Entrega: enlace o subida a Drive. Siempre visible, no solo al
             marcar editado — si no, el cliente recibia avisos sin video. -->
        <div class="epi__block">
          <EditorEntregaVideo :item="item" :saving="updating" @save-link="emit('save-link', $event)" />
        </div>

        <div class="epi__script-footer">
          <button
            class="epi__mark-btn"
            :class="{ 'epi__mark-btn--done': item.edicion === 'EDITADO' }"
            :disabled="updating"
            @click="emit('advance')"
          >
            <i v-if="updating" class="fa-solid fa-circle-notch fa-spin" />
            <template v-else>
              <i v-if="item.edicion === 'EDITADO'" class="fa-solid fa-rotate-left" />
              <i v-else class="fa-solid fa-check" />
              {{ item.edicion === 'EDITADO' ? 'Revertir a Por editar' : 'Marcar como Editado' }}
            </template>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.epi-slide-enter-active,
.epi-slide-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease;
  max-height: 1200px;
  overflow: hidden;
}
.epi-slide-enter-from,
.epi-slide-leave-to { max-height: 0; opacity: 0; }

.epi {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 13px;
  overflow: hidden;

  &--done { background: #f6fdf9; border-color: rgba(#10b981, 0.25); }
  &--rejected { border-color: rgba(#ef4444, 0.35); }
  &--open { box-shadow: 0 4px 14px rgba($primary-dark, 0.07); }
}

.epi__entregado,
.epi__sin-link {
  font-size: 0.72rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.15rem;
}
.epi__entregado { color: #059669; }
.epi__sin-link { color: #b45309; }

.epi__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;
  cursor: pointer;

  &:hover { background: rgba($primary-dark, 0.015); }
}

.epi__num {
  font-size: 0.72rem;
  font-weight: 800;
  color: $text-secondary;
  flex-shrink: 0;
  min-width: 26px;
}

.epi__main {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.epi__tema { font-size: 0.88rem; font-weight: 800; color: $primary-dark; }

.epi__tipo-sub { font-size: 0.72rem; color: $text-secondary; }

.epi__motivo {
  font-size: 0.74rem;
  font-weight: 600;
  color: #ef4444;
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;

  i { margin-top: 0.14rem; font-size: 0.68rem; }
}

.epi__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.epi__deadline {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;

  em { font-style: normal; font-size: 0.6rem; opacity: 0.7; }

  &--urgente { color: #b45309; background: rgba(#d97706, 0.12); }
}

.epi__tipo-chip {
  font-size: 0.64rem;
  font-weight: 800;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.epi__state-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba($primary-dark, 0.15);
  background: $white;
  color: $text-secondary;
  border-radius: 999px;
  padding: 0.32rem 0.75rem;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) { border-color: rgba(#6366f1, 0.4); color: #6366f1; }

  &--done { background: rgba(#10b981, 0.08); border-color: rgba(#10b981, 0.3); color: #0d9668; }

  &--rejected { background: rgba(#ef4444, 0.07); border-color: rgba(#ef4444, 0.35); color: #dc2626; }
}

.epi__chevron {
  font-size: 0.62rem;
  color: $text-secondary;
  transition: transform 0.2s;
  flex-shrink: 0;

  &--open { transform: rotate(180deg); }
}

.epi__script {
  border-top: 1px solid rgba($primary-dark, 0.07);
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  background: #fbfcfe;
}

.epi__block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  p { font-size: 0.84rem; color: $primary-dark; line-height: 1.5; margin: 0; }

  &--concept p { color: #7c3aed; }
  &--hook p { font-weight: 700; }
  &--cta p { font-weight: 700; color: #0d9668; }
  &--broll p, &--muted p { color: $text-secondary; }
}

.epi__block-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $text-secondary;
}

.epi__pre { white-space: pre-wrap; }

.epi__no-script {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: $text-secondary;
  font-style: italic;
}

.epi__ref-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: #6366f1;

  &:hover { text-decoration: underline; color: #6366f1; }
}

.epi__script-footer { display: flex; justify-content: flex-end; }

.epi__mark-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #6366f1;
  color: $white;
  border: none;
  border-radius: 9px;
  padding: 0.55rem 1rem;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(1.08); }

  &--done { background: rgba($primary-dark, 0.08); color: $primary-dark; }
}
</style>
