<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  total: {
    type: Number,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
}>()

const localQuery = ref(props.modelValue)
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (val) => {
  localQuery.value = val
})

function onSearchInput() {
  emit('update:modelValue', localQuery.value)
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    emit('search')
  }, 350)
}
</script>

<template>
  <div class="clients-global__header">
    <div class="clients-global__header-text">
      <h1 class="clients-global__title">Vista Global de Clientes</h1>
      <p class="clients-global__subtitle">
        {{ total > 0 ? `${total} clientes en total` : 'Explora todos los entornos y sus usuarios.' }}
      </p>
    </div>

    <div class="clients-global__search-bar">
      <i class="fa-solid fa-magnifying-glass" />
      <input
        v-model="localQuery"
        type="text"
        placeholder="Buscar cliente por nombre…"
        class="clients-global__search-input"
        @input="onSearchInput"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.clients-global {
  &__header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }

  &__header-text {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 0.9rem;
    color: rgba($primary-dark, 0.6);
    margin: 0;
  }

  &__search-bar {
    position: relative;
    width: 100%;
    
    @media (min-width: 768px) {
      width: 320px;
    }

    i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba($primary-dark, 0.4);
    }
  }

  &__search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.8rem;
    border-radius: 12px;
    border: 1px solid rgba($primary-dark, 0.1);
    background: #fff;
    font-size: 0.9rem;
    font-family: inherit;
    color: $primary-dark;
    transition: all 0.2s;
    outline: none;

    &::placeholder {
      color: rgba($primary-dark, 0.4);
    }

    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }
  }
}
</style>
