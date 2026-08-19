<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ReviewQueueItem } from '@/services/videoPlanning.service'

/**
 * Rechazo con motivo obligatorio y categoria contable: el motivo vuelve al
 * editor en su cola de re-edicion, y la categoria alimenta el conteo de
 * "motivos principales" del sistema de banderas.
 */
const props = defineProps<{ item: ReviewQueueItem | null; saving: boolean }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { motivo: string; motivoCategoria: string }): void
}>()

const CATEGORIAS = [
  { valor: 'calidad_video', label: 'Calidad de video' },
  { valor: 'ritmo_edicion', label: 'Ritmo de edición' },
  { valor: 'audio_musica', label: 'Audio / música' },
  { valor: 'subtitulos', label: 'Subtítulos' },
  { valor: 'estructura', label: 'No sigue la estructura' },
  { valor: 'otro', label: 'Otro' },
]

const motivo = ref('')
const categoria = ref('calidad_video')

watch(
  () => props.item,
  () => {
    motivo.value = ''
    categoria.value = 'calidad_video'
  },
)

function confirmar() {
  if (!motivo.value.trim()) return
  emit('confirm', { motivo: motivo.value.trim(), motivoCategoria: categoria.value })
}
</script>

<template>
  <Transition name="global-modal">
    <div v-if="item" class="rjm__overlay" @click.self="emit('close')">
      <div class="rjm" role="dialog" aria-modal="true">
        <div class="rjm__head">
          <h3>Rechazar edición</h3>
          <button class="rjm__close" type="button" aria-label="Cerrar" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <p class="rjm__sub">
          <strong>{{ item.workspaceName }} · #{{ String(item.numero).padStart(2, '0') }} {{ item.tema }}</strong>
          vuelve a la cola del editor con tu motivo.
        </p>

        <div class="rjm__group">
          <label class="rjm__label">Categoría</label>
          <div class="rjm__chips">
            <button
              v-for="c in CATEGORIAS"
              :key="c.valor"
              type="button"
              class="rjm__chip"
              :class="{ 'is-active': categoria === c.valor }"
              @click="categoria = c.valor"
            >{{ c.label }}</button>
          </div>
        </div>

        <div class="rjm__group">
          <label class="rjm__label">Motivo (lo verá el editor)</label>
          <textarea
            v-model="motivo"
            class="rjm__textarea"
            rows="3"
            placeholder="Ej: el audio se desincroniza en el segundo 12"
          />
        </div>

        <div class="rjm__footer">
          <button type="button" class="rjm__btn-ghost" @click="emit('close')">Cancelar</button>
          <button
            type="button"
            class="rjm__btn-danger"
            :disabled="!motivo.trim() || saving"
            @click="confirmar"
          >
            <span v-if="saving" class="rjm__spinner" />
            <i v-else class="fa-solid fa-xmark" />
            Rechazar y devolver
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.rjm__overlay {
  position: fixed;
  inset: 0;
  background: rgba($primary-dark, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1300;
}

.rjm {
  background: $white;
  border-radius: 16px;
  width: min(460px, 100%);
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.rjm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 { font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
}

.rjm__close {
  background: none;
  border: none;
  cursor: pointer;
  color: $text-secondary;
  font-size: 1rem;

  &:hover { color: $primary-dark; }
}

.rjm__sub {
  font-size: 0.82rem;
  color: $text-secondary;
  margin-top: -0.4rem;

  strong { color: $primary-dark; }
}

.rjm__group { display: flex; flex-direction: column; gap: 0.4rem; }

.rjm__label {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: $primary-dark;
  opacity: 0.8;
}

.rjm__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.rjm__chip {
  border: 1.5px solid rgba($primary-dark, 0.12);
  background: $white;
  color: $text-secondary;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;

  &:hover { border-color: rgba($primary-dark, 0.3); }

  &.is-active {
    background: $alert-error-bg;
    border-color: $alert-error;
    color: $alert-error;
  }
}

.rjm__textarea {
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  font-family: inherit;
  font-size: 0.86rem;
  resize: vertical;
  color: $primary-dark;

  &:focus { outline: none; border-color: $alert-error; }
}

.rjm__footer { display: flex; justify-content: flex-end; gap: 0.6rem; }

.rjm__btn-ghost {
  background: none;
  border: none;
  color: $text-secondary;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  cursor: pointer;

  &:hover { background: rgba($primary-dark, 0.05); }
}

.rjm__btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: $alert-error;
  color: $white;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.1rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) { filter: brightness(1.05); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.rjm__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($white, 0.4);
  border-top-color: $white;
  border-radius: 50%;
  animation: rjm-spin 0.8s linear infinite;
}

@keyframes rjm-spin { to { transform: rotate(360deg); } }
</style>
