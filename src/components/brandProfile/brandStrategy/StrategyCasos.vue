<template>
  <div class="scs">
    <div v-for="(caso, idx) in casos" :key="idx" class="scs__caso">
      <div class="scs__head">
        <h4 class="scs__num">Caso {{ caso.casoNumero }}</h4>
        <input
          v-model="caso.nombreCaso"
          type="text"
          class="scs__nombre"
          placeholder="— nombre del caso (opcional)"
        />
        <button type="button" class="scs__del" title="Quitar caso" @click="emit('remove', idx)">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <div class="scs__campo">
        <label>¿Quién es?</label>
        <textarea
          v-model="caso.potencialCliente"
          rows="2"
          placeholder="Hombres y mujeres, gerentes o dueños de empresas..."
        />
      </div>
      <div class="scs__campo">
        <label>Al ver el anuncio:</label>
        <textarea
          v-model="caso.efectoAnuncio"
          rows="2"
          placeholder="Se ve reflejado ante la necesidad de..."
        />
      </div>
      <div class="scs__campo">
        <label>Acción esperada:</label>
        <textarea
          v-model="caso.accionEsperada"
          rows="2"
          placeholder="Se obtiene que el cliente..."
        />
      </div>
    </div>

    <button type="button" class="scs__add" @click="emit('add')">
      <i class="fa-solid fa-plus" /> Agregar caso
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CustomerJourneyCase } from '@/types'

const emit = defineEmits<{ (e: 'add'): void; (e: 'remove', idx: number): void }>()

const casos = defineModel<CustomerJourneyCase[]>({ required: true })
</script>

<style lang="scss" scoped>
.scs {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;

  &__caso {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__head {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
  }

  &__num {
    margin: 0;
    font-size: 0.87rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
  }

  &__nombre {
    flex: 1;
    padding: 0.2rem 0;
    font-family: inherit;
    font-size: 0.87rem;
    font-weight: 700;
    color: $primary-dark;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba($primary-dark, 0.1);
    outline: none;

    &:focus { border-bottom-color: #a855f7; }
    &::placeholder { font-weight: 500; color: rgba($primary-dark, 0.3); }
  }

  &__campo {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding-left: 0.9rem;

    label {
      font-size: 0.8rem;
      font-weight: 700;
      color: $primary-dark;
    }

    textarea {
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
