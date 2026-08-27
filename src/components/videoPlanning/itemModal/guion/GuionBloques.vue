<template>
  <div class="gbl">
    <div v-for="(bloque, idx) in bloques" :key="bloque.id" class="gbl__bloque">
      <div class="gbl__head">
        <span class="gbl__rotulo">{{ rotulos[idx] }}</span>
        <div class="gbl__acciones">
          <button
            type="button"
            title="Subir bloque"
            :disabled="idx === 0"
            @click="emit('mover', idx, -1)"
          >
            <i class="fa-solid fa-arrow-up" />
          </button>
          <button
            type="button"
            title="Bajar bloque"
            :disabled="idx === bloques.length - 1"
            @click="emit('mover', idx, 1)"
          >
            <i class="fa-solid fa-arrow-down" />
          </button>
          <button type="button" title="Quitar bloque" @click="emit('quitar', idx)">
            <i class="fa-solid fa-trash-can" />
          </button>
        </div>
      </div>
      <textarea
        v-model="bloque.texto"
        :rows="filas(bloque.texto)"
        placeholder="Escribe este bloque..."
        @input="emit('cambio')"
      />
    </div>

    <button type="button" class="gbl__add" @click="emit('agregar')">
      <i class="fa-solid fa-plus" /> Agregar bloque
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GuionBloque } from '@/composables/useGuionBloques'

defineProps<{ rotulos: string[] }>()

const emit = defineEmits<{
  (e: 'cambio'): void
  (e: 'agregar'): void
  (e: 'quitar', idx: number): void
  (e: 'mover', idx: number, delta: number): void
}>()

const bloques = defineModel<GuionBloque[]>({ required: true })

/** Que el bloque se vea completo sin scroll interno, dentro de un tope. */
function filas(texto: string) {
  const lineas = texto.split('\n').length + Math.floor(texto.length / 90)
  return Math.min(Math.max(lineas + 1, 3), 12)
}
</script>

<style lang="scss" scoped>
.gbl {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  &__bloque {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__rotulo {
    font-size: 0.7rem;
    font-weight: 800;
    color: $primary;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__acciones {
    display: flex;
    gap: 0.15rem;
    margin-left: auto;

    button {
      padding: 0.2rem 0.35rem;
      font-size: 0.7rem;
      color: rgba($primary-dark, 0.35);
      background: none;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover:not(:disabled) { color: $primary-dark; background: rgba($primary-dark, 0.06); }
      &:last-child:hover:not(:disabled) { color: #ef4444; background: rgba(#ef4444, 0.08); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }
  }

  textarea {
    width: 100%;
    padding: 0.6rem 0.8rem;
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1.55;
    color: $primary-dark;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    resize: vertical;
    transition: border-color 0.18s;

    &:focus { border-color: $primary; outline: none; }
  }

  &__add {
    align-self: flex-start;
    padding: 0.2rem 0;
    font-size: 0.74rem;
    font-weight: 700;
    color: $primary;
    background: none;
    border: none;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }
}
</style>
