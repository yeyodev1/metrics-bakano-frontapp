<script setup lang="ts">
import { ref, watch } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'

const props = defineProps<{
  show: boolean
  item: VideoItem | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save-link', itemId: string, payload: { linkVideo: string; fechaPublicacion: string }): void
}>()

const localLink = ref('')
const localFecha = ref('')

watch(() => props.show, (isShown) => {
  if (isShown && props.item) {
    localLink.value = props.item.linkVideo || ''
    localFecha.value = props.item.fechaPublicacion ? (props.item.fechaPublicacion.split('T')[0] || '') : ''
  }
})

function handleSave() {
  if (!props.item) return
  emit('save-link', props.item._id, { 
    linkVideo: localLink.value, 
    fechaPublicacion: localFecha.value 
  })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show && item" class="vcm">
      <div class="vcm__overlay" @click="emit('close')" />
      <div class="vcm__container">
        <!-- Celebration header -->
        <div class="vcm__header">
          <div class="vcm__celebration">
            <div class="vcm__icon-ring">
              <i class="fa-solid fa-clapperboard" />
            </div>
            <div class="vcm__sparkles">
              <span /><span /><span /><span />
            </div>
          </div>
          <h2 class="vcm__title">¡Video listo!</h2>
          <p class="vcm__subtitle">El video <strong>fue marcado como editado</strong></p>
          <button class="vcm__close" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Video info card -->
        <div class="vcm__card">
          <div class="vcm__card-num">#{{ item.numero }}</div>
          <div class="vcm__card-info">
            <span class="vcm__card-tema">{{ item.tema }}</span>
            <span v-if="item.tipo" class="vcm__card-tipo">{{ item.tipo }}</span>
          </div>
          <div class="vcm__status-chips">
            <span class="vcm__chip vcm__chip--done">
              <i class="fa-solid fa-scissors" /> Editado
            </span>
          </div>
        </div>

        <!-- Form inputs -->
        <div class="vcm__form-section">
          <!-- Link -->
          <div class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-solid fa-link" /> Link del video final
            </label>
            <div class="vcm__input-row">
              <input
                v-model="localLink"
                type="url"
                class="vcm__input"
                placeholder="https://drive.google.com/..."
                @keydown.enter.prevent="handleSave"
              />
              <a
                v-if="localLink"
                :href="localLink"
                target="_blank"
                rel="noopener"
                class="vcm__link-preview"
                title="Abrir link"
              >
                <i class="fa-solid fa-arrow-up-right-from-square" />
              </a>
            </div>
            <span class="vcm__form-hint">Proporciona el enlace de Drive, Dropbox, etc.</span>
          </div>

          <!-- Date -->
          <div class="vcm__form-group">
            <label class="vcm__form-label">
              <i class="fa-regular fa-calendar" /> Fecha de publicación
            </label>
            <input
              v-model="localFecha"
              type="date"
              class="vcm__input"
              @keydown.enter.prevent="handleSave"
            />
            <span class="vcm__form-hint">Día en el que está planificado que el video salga en redes.</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="vcm__footer">
          <button class="vcm__btn-ghost" @click="emit('close')">
            Cerrar sin guardar
          </button>
          <button
            class="vcm__btn-primary"
            :disabled="isSaving"
            @click="handleSave"
          >
            <span v-if="isSaving" class="vcm__spinner" />
            <i v-else class="fa-solid fa-floppy-disk" />
            <span>{{ localLink || localFecha ? 'Guardar datos' : 'Marcar sin detalles' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.vcm {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  z-index: 1200; padding: 1.5rem;

  &__overlay { position: absolute; inset: 0; background: rgba($primary-dark, 0.55); backdrop-filter: blur(10px); }

  &__container {
    position: relative; background: $white; width: 100%; max-width: 460px;
    border-radius: 24px; box-shadow: 0 30px 60px -10px rgba(0,0,0,0.3);
    overflow: hidden; animation: popIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__header {
    padding: 2.5rem 2rem 1.5rem;
    background: linear-gradient(160deg, #f0fdf4 0%, #dcfce7 100%);
    text-align: center; position: relative;
  }

  &__celebration {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    margin-bottom: 1rem;
  }

  &__icon-ring {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(#16a34a, 0.4);
    i { font-size: 2rem; color: #fff; }
  }

  &__sparkles {
    position: absolute; inset: -12px;
    span {
      position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #16a34a;
      opacity: 0.7;
      // top/bottom sparks: centered horizontally
      &:nth-child(1) { top: -2px; left: 50%; animation: sparkleH 1.8s ease-in-out 0s infinite; }
      &:nth-child(3) { bottom: -2px; left: 50%; animation: sparkleH 1.8s ease-in-out 0.9s infinite; }
      // left/right sparks: centered vertically
      &:nth-child(2) { right: -2px; top: 50%; animation: sparkleV 1.8s ease-in-out 0.45s infinite; }
      &:nth-child(4) { left: -2px; top: 50%; animation: sparkleV 1.8s ease-in-out 1.35s infinite; }
    }
  }

  &__title {
    margin: 0 0 0.35rem; font-size: 1.5rem; font-weight: 900; color: #14532d;
  }
  &__subtitle {
    margin: 0; font-size: 0.88rem; color: #166534;
    strong { font-weight: 800; }
  }

  &__close {
    position: absolute; top: 1rem; right: 1rem;
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: rgba(#14532d, 0.08); color: #166534; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: rgba(#14532d, 0.15); }
  }

  &__card {
    margin: 1.25rem 1.5rem; padding: 1rem 1.25rem;
    background: rgba($primary, 0.04); border: 1.5px solid rgba($primary, 0.1);
    border-radius: 14px; display: flex; align-items: center; gap: 1rem;
  }

  &__card-num {
    font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: $text-secondary;
    background: rgba($primary-dark, 0.06); padding: 0.25rem 0.6rem; border-radius: 8px;
    white-space: nowrap; flex-shrink: 0;
  }

  &__card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
  &__card-tema { font-size: 0.95rem; font-weight: 700; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__card-tipo { font-size: 0.65rem; font-weight: 700; color: $primary; background: rgba($primary, 0.1); border-radius: 6px; padding: 0.1rem 0.45rem; display: inline-block; width: fit-content; }

  &__status-chips { display: flex; gap: 0.4rem; flex-shrink: 0; }
  &__chip {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 20px;
    &--done { background: #dcfce7; color: #166534; }
  }

  &__form-section {
    padding: 0 1.5rem 1.25rem;
    display: flex; flex-direction: column; gap: 1rem;
  }

  &__form-group {
    display: flex; flex-direction: column; gap: 0.4rem;
  }

  &__form-label {
    font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    color: $primary-dark; opacity: 0.8; display: flex; align-items: center; gap: 0.45rem;
    i { color: $primary; }
  }

  &__form-hint { font-weight: 400; font-size: 0.72rem; color: $text-secondary; }

  &__input-row { display: flex; gap: 0.5rem; }

  &__input {
    flex: 1; padding: 0.75rem 1rem; border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.12); background: rgba($primary-dark, 0.02);
    font-family: inherit; font-size: 0.9rem; transition: all 0.2s;
    &:focus { outline: none; border-color: $primary; background: $white; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
  }

  &__link-preview {
    width: 44px; height: 44px; border-radius: 12px; background: rgba($primary, 0.08);
    color: $primary; display: flex; align-items: center; justify-content: center;
    text-decoration: none; font-size: 0.85rem; transition: all 0.2s; flex-shrink: 0;
    &:hover { background: $primary; color: $white; }
  }

  &__footer {
    padding: 1rem 1.5rem 1.75rem; border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex; justify-content: flex-end; gap: 0.75rem;
  }

  &__btn-ghost {
    background: transparent; border: none; color: $text-secondary; font-weight: 700;
    padding: 0.75rem 1.25rem; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    &:hover { background: rgba($primary-dark, 0.05); }
  }

  &__btn-primary {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: $white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
    font-weight: 700; cursor: pointer; box-shadow: 0 6px 16px rgba(#16a34a, 0.3);
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    &:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(#16a34a, 0.4); }
    &:disabled { background: #d1d5db; box-shadow: none; cursor: not-allowed; transform: none; }
  }

  &__spinner {
    width: 18px; height: 18px; border: 2px solid rgba($white, 0.3);
    border-top-color: $white; border-radius: 50%; animation: spin 0.8s linear infinite;
  }
}

@keyframes popIn {
  from { transform: scale(0.88) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes sparkleH {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
  50% { transform: translateX(-50%) scale(1.6); opacity: 0.15; }
}

@keyframes sparkleV {
  0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.7; }
  50% { transform: translateY(-50%) scale(1.6); opacity: 0.15; }
}

@keyframes spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
