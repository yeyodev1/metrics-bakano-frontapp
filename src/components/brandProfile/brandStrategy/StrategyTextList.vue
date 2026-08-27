<template>
  <div class="stl">
    <div v-for="(_, idx) in items" :key="idx" class="stl__row">
      <span class="stl__bullet">•</span>
      <input
        v-model="items[idx]"
        type="text"
        :placeholder="placeholder"
        @keydown.enter.prevent="emit('add')"
      />
      <button
        type="button"
        class="stl__del"
        title="Quitar"
        @click="emit('remove', idx)"
      >
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <button type="button" class="stl__add" @click="emit('add')">
      <i class="fa-solid fa-plus" /> {{ addLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  placeholder: string
  addLabel: string
}>()

const emit = defineEmits<{ (e: 'add'): void; (e: 'remove', idx: number): void }>()

const items = defineModel<string[]>({ required: true })
</script>

<style lang="scss" scoped>
.stl {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  &__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__bullet {
    color: $text-secondary;
    font-size: 0.9rem;
    line-height: 1;
  }

  input {
    flex: 1;
    padding: 0.35rem 0.2rem;
    font-family: inherit;
    font-size: 0.87rem;
    color: $primary-dark;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba($primary-dark, 0.12);
    outline: none;
    transition: border-color 0.18s;

    &:focus { border-bottom-color: #a855f7; }
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
    margin-top: 0.25rem;
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
