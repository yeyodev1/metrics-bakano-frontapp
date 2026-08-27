<template>
  <div class="ssg">
    <div v-for="(seg, idx) in segmentos" :key="idx" class="ssg__item">
      <div class="ssg__head">
        <span class="ssg__bullet">•</span>
        <input
          v-model="seg.nombre"
          type="text"
          class="ssg__nombre"
          placeholder="Nombre del segmento (opcional)..."
        />
        <button type="button" class="ssg__del" title="Quitar" @click="emit('remove', idx)">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <textarea
        v-model="seg.descripcion"
        rows="2"
        placeholder="Ej: Empresas que buscan optimizar costos trayendo equipos de China con facturación por encima de 50,000 dólares..."
      />
    </div>

    <button type="button" class="ssg__add" @click="emit('add')">
      <i class="fa-solid fa-plus" /> Agregar segmento
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SegmentoMercado } from '@/types'

const emit = defineEmits<{ (e: 'add'): void; (e: 'remove', idx: number): void }>()

const segmentos = defineModel<SegmentoMercado[]>({ required: true })
</script>

<style lang="scss" scoped>
.ssg {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-left: 0.1rem;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__bullet {
    color: $text-secondary;
    font-size: 0.9rem;
    line-height: 1;
  }

  &__nombre {
    flex: 1;
    padding: 0.25rem 0.2rem;
    font-family: inherit;
    font-size: 0.87rem;
    font-weight: 700;
    color: $primary-dark;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba($primary-dark, 0.12);
    outline: none;

    &:focus { border-bottom-color: #a855f7; }
    &::placeholder { font-weight: 500; color: rgba($primary-dark, 0.3); }
  }

  textarea {
    margin-left: 1rem;
    padding: 0.4rem 0.55rem;
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1.5;
    color: $primary-dark;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.09);
    border-radius: 8px;
    outline: none;
    resize: vertical;

    &:focus { border-color: #a855f7; }
    &::placeholder { color: rgba($primary-dark, 0.3); }
  }

  &__del {
    padding: 0.2rem 0.35rem;
    color: rgba($primary-dark, 0.3);
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { color: #ef4444; background: rgba(#ef4444, 0.08); }
  }

  &__add {
    align-self: flex-start;
    padding: 0.2rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: #a855f7;
    background: none;
    border: none;
    cursor: pointer;

    &:hover { text-decoration: underline; }
  }
}
</style>
