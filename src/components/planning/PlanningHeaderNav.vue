<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
})

defineEmits(['prev', 'next', 'today'])
</script>

<template>
  <div class="planning-header-nav">
    <div class="planning-header-nav__controls">
      <button
        class="planning-header-nav__btn"
        title="Anterior"
        @click="$emit('prev')"
      >
        <i class="fa-solid fa-chevron-left" />
      </button>

      <h2 class="planning-header-nav__label">{{ label }}</h2>

      <button
        class="planning-header-nav__btn"
        title="Siguiente"
        @click="$emit('next')"
      >
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>

    <button
      class="planning-header-nav__today"
      @click="$emit('today')"
    >
      Hoy
    </button>
  </div>
</template>

<style lang="scss" scoped>
.planning-header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
  justify-content: space-between;

  &__controls {
    display: flex;
    align-items: center;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 0.2rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    flex: 1;
    min-width: 0;
    justify-content: space-between;
  }

  &__btn {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: $primary-dark;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: rgba($primary, 0.08);
      color: $primary;
    }
  }

  &__label {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: $primary-dark;
    text-align: center;
    text-transform: capitalize;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__today {
    padding: 0.45rem 0.75rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.76rem;
    color: $primary-dark;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    transition: border-color 0.2s, color 0.2s, transform 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
      transform: translateY(-1px);
    }
  }
}
</style>
