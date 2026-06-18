<script setup lang="ts">
const props = defineProps({
  canManageFull: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add'): void
}>()
</script>

<template>
  <div class="vp-view__empty">
    <div class="vp-view__empty-icon">
      <i class="fa-solid fa-film" />
    </div>
    <h3>Sin planificación todavía</h3>
    <p>Agrega el primer video para comenzar a organizar la producción de REELs.</p>
    <button v-if="props.canManageFull" class="vp-view__start-btn" @click="emit('add')">
      <i class="fa-solid fa-circle-plus" /> Crear primera planificación
    </button>
  </div>
</template>

<style lang="scss" scoped>
.vp-view__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 5rem 2rem; gap: 0.75rem;
}
.vp-view__empty-icon {
  width: 72px; height: 72px; border-radius: 20px;
  background: rgba($primary, 0.07); border: 2px dashed rgba($primary, 0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.75rem; color: $primary; opacity: 0.7; margin-bottom: 0.5rem;
}
.vp-view__empty h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: $primary-dark; }
.vp-view__empty p  { margin: 0; font-size: 0.85rem; color: $text-secondary; max-width: 320px; }

.vp-view__start-btn {
  display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;
  background: $primary; color: $white; border: none;
  padding: 0.8rem 1.75rem; border-radius: 12px; font-weight: 700; font-size: 0.88rem;
  cursor: pointer; box-shadow: 0 4px 14px rgba($primary, 0.3); transition: all 0.2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba($primary, 0.4); }
}
</style>
