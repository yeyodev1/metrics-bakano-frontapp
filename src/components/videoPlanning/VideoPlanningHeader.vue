<script setup lang="ts">
defineProps<{
  entryTitle: string
  planningExists: boolean
  canManageFull: boolean
  locked: boolean
}>()

const emit = defineEmits<{
  (e: 'add-video'): void
  (e: 'go-back'): void
}>()
</script>

<template>
  <div class="vp-header">
    <div class="vp-header__left">
      <button class="vp-header__back-btn" @click="emit('go-back')">
        <i class="fa-solid fa-arrow-left" />
      </button>
      <div>
        <p class="vp-header__eyebrow">
          <i class="fa-solid fa-film" />
          Planificación de Videos
        </p>
        <h1 class="vp-header__title">{{ entryTitle || 'Producción' }}</h1>
      </div>
    </div>

    <div class="vp-header__right">
      <span v-if="locked" class="vp-header__locked-chip">
        <i class="fa-solid fa-lock" />
        Bloqueado por cliente
      </span>
      <button
        v-else-if="canManageFull"
        class="vp-header__add-btn"
        @click="emit('add-video')"
      >
        <i class="fa-solid fa-plus" />
        Agregar video
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__back-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.1);
    background: $white;
    color: $primary-dark;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover { border-color: $primary; color: $primary; }
  }

  &__eyebrow {
    margin: 0 0 0.2rem;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $primary;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  &__title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    color: $primary-dark;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.25rem;
  }

  &__locked-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #fef9c3;
    color: #854d0e;
    border: 1px solid #fde047;
    border-radius: 20px;
    padding: 0.45rem 1rem;
    font-size: 0.78rem;
    font-weight: 700;
  }

  &__add-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    padding: 0.7rem 1.25rem;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba($primary, 0.3);
    transition: all 0.2s;

    &:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba($primary, 0.4); }
  }
}
</style>
