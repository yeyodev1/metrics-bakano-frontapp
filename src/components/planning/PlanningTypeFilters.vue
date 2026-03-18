<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String as () => 'all' | 'production' | 'publication',
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const filters = [
  { id: 'all', label: 'Todo', icon: 'fa-layer-group' },
  { id: 'production', label: 'Días de Producción', icon: 'fa-video' },
  { id: 'publication', label: 'Publicaciones', icon: 'fa-calendar-check' },
] as const

const activeFilter = computed(() => props.modelValue)

function setFilter(id: 'all' | 'production' | 'publication') {
  emit('update:modelValue', id)
}
</script>

<template>
  <div class="planning-filters">
    <div class="planning-filters__group">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="planning-filters__btn"
        :class="{ 'is-active': activeFilter === filter.id }"
        @click="setFilter(filter.id)"
      >
        <i class="fa-solid" :class="filter.icon" />
        <span>{{ filter.label }}</span>
        <div v-if="activeFilter === filter.id" class="planning-filters__indicator" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planning-filters {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 0.5rem;

  @media (min-width: 768px) {
    justify-content: flex-start;
    padding: 0;
  }

  &__group {
    display: flex;
    background: rgba($primary-dark, 0.04);
    backdrop-filter: blur(8px);
    padding: 4px;
    border-radius: 14px;
    gap: 4px;
    border: 1px solid rgba($primary-dark, 0.05);
    width: 100%;
    
    @media (min-width: 768px) {
      width: auto;
    }
  }

  &__btn {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: $text-secondary;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;

    i {
      font-size: 0.85rem;
      opacity: 0.7;
      transition: transform 0.3s ease;
    }

    span {
      position: relative;
      z-index: 1;
    }

    &:hover:not(.is-active) {
      background: rgba($white, 0.5);
      color: $primary-dark;
      i { opacity: 1; transform: scale(1.1); }
    }

    &.is-active {
      background: $white;
      color: $primary;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);

      i {
        opacity: 1;
        color: $primary;
      }
    }
  }

  &__indicator {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: $primary;
    border-radius: 2px;
    animation: slideIn 0.3s ease;
  }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-50%) scaleX(0); }
  to { opacity: 1; transform: translateX(-50%) scaleX(1); }
}
</style>
