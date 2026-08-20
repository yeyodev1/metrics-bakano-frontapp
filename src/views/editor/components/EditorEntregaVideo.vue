<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DriveUploadCard from '@/components/videoPlanning/DriveUploadCard.vue'
import type { VideoItem } from '@/types/videoPlanning'

/**
 * Entrega del video terminado, desde la card del editor.
 *
 * Antes el editor solo podia "marcar como editado": la subida a Drive estaba
 * escondida hasta marcarlo y no habia forma de pegar un enlace. El cliente
 * recibia el aviso de revision y aterrizaba en una pagina sin video. Aqui hay
 * dos caminos, siempre visibles: pegar el enlace (Drive, WeTransfer, Frame.io,
 * lo que use el editor) o subir el master a la carpeta de Drive del cliente.
 */
const props = defineProps<{ item: VideoItem; saving: boolean }>()
const emit = defineEmits<{ (e: 'save-link', link: string): void }>()

const link = ref(props.item.linkVideo ?? '')
watch(() => props.item.linkVideo, (v) => { link.value = v ?? '' })

const enlaceActual = computed(() => props.item.linkVideo || props.item.driveLink || null)
const linkValido = computed(() => /^https?:\/\/\S+\.\S+/.test(link.value.trim()))
const cambio = computed(() => link.value.trim() !== (props.item.linkVideo ?? ''))

function guardar() {
  if (!linkValido.value || !cambio.value || props.saving) return
  emit('save-link', link.value.trim())
}
</script>

<template>
  <div class="eev" :class="{ 'eev--done': enlaceActual }">
    <div class="eev__head">
      <i class="fa-solid" :class="enlaceActual ? 'fa-circle-check' : 'fa-paper-plane'" />
      <div class="eev__head-text">
        <strong>{{ enlaceActual ? 'Video entregado' : 'Entregar el video editado' }}</strong>
        <span v-if="enlaceActual">El cliente lo verá con este enlace cuando se le avise.</span>
        <span v-else>Pega el enlace o sube el archivo. Sin esto el cliente no tiene qué revisar.</span>
      </div>
      <a
        v-if="enlaceActual"
        :href="enlaceActual"
        target="_blank"
        rel="noopener"
        class="eev__open"
      >
        <i class="fa-solid fa-arrow-up-right-from-square" /> Abrir
      </a>
    </div>

    <form class="eev__form" @submit.prevent="guardar">
      <label class="eev__label" :for="`eev-link-${item._id}`">Enlace del video</label>
      <div class="eev__row">
        <input
          :id="`eev-link-${item._id}`"
          v-model="link"
          type="url"
          class="eev__input"
          placeholder="https://drive.google.com/… o WeTransfer, Frame.io…"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          type="submit"
          class="eev__save"
          :disabled="!linkValido || !cambio || saving"
          :title="item.edicion === 'EDITADO' ? 'Guardar enlace' : 'Guardar enlace y marcar como editado'"
        >
          <i v-if="saving" class="fa-solid fa-circle-notch fa-spin" />
          <i v-else class="fa-solid fa-check" />
          {{ item.edicion === 'EDITADO' ? 'Guardar' : 'Guardar y marcar editado' }}
        </button>
      </div>
      <span v-if="link && !linkValido" class="eev__hint eev__hint--error">
        Debe empezar con https://
      </span>
    </form>

    <div class="eev__sep"><span>o sube el archivo</span></div>

    <DriveUploadCard :item="item" />
  </div>
</template>

<style lang="scss" scoped>
.eev {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px dashed rgba($primary, 0.45);
  background: rgba($primary, 0.035);

  &--done {
    border-style: solid;
    border-color: rgba(#10b981, 0.4);
    background: rgba(#10b981, 0.05);
  }
}

.eev__head {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;

  > i { font-size: 1.05rem; color: $primary; margin-top: 0.15rem; }
  .eev--done & > i { color: #059669; }
}

.eev__head-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;

  strong { font-size: 0.9rem; color: $primary-dark; }
  span { font-size: 0.78rem; color: rgba($primary-dark, 0.6); }
}

.eev__open {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #059669;
  text-decoration: none;
  white-space: nowrap;
  &:hover { text-decoration: underline; }
}

.eev__form { display: flex; flex-direction: column; gap: 0.3rem; }

.eev__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba($primary-dark, 0.5);
}

.eev__row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.eev__input {
  flex: 1 1 220px;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border-radius: 9px;
  border: 1px solid rgba($primary-dark, 0.15);
  font-size: 0.85rem;
  color: $primary-dark;
  background: $white;

  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.12); }
}

.eev__save {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border: none;
  border-radius: 9px;
  background: $primary;
  color: $white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { filter: brightness(1.08); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.eev__hint {
  font-size: 0.74rem;
  color: rgba($primary-dark, 0.55);
  &--error { color: #dc2626; }
}

.eev__sep {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.72rem;
  color: rgba($primary-dark, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba($primary-dark, 0.1); }
}
</style>
