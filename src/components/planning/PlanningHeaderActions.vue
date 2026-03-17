<script setup lang="ts">
defineProps({
  showMineOnly: {
    type: Boolean,
    required: true,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  canCreate: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:showMineOnly', 'create'])
</script>

<template>
  <div class="planning-header-actions">
    <button
      class="planning-header-actions__filter"
      :class="{ 'is-active': showMineOnly }"
      @click="$emit('update:showMineOnly', !showMineOnly)"
    >
      <i class="fa-solid" :class="showMineOnly ? 'fa-user-check' : 'fa-users'" />
      <span>{{ showMineOnly ? 'Mis tareas' : 'Todo el equipo' }}</span>
    </button>

    <button
      v-if="canCreate"
      class="planning-header-actions__create"
      @click="$emit('create')"
    >
      <i class="fa-solid fa-plus" />
      <span>Evento</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.planning-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;

  &__filter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.12);
    background: $white;
    color: $text-secondary;
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
    flex: 1;
    min-width: 0;
    overflow: hidden;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.is-active {
      border-color: $primary;
      background: rgba($primary, 0.07);
      color: $primary;
    }

    &:hover:not(.is-active) {
      border-color: rgba($primary, 0.35);
    }
  }

  &__create {
    flex-shrink: 0;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    padding: 0.55rem 0.9rem;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    box-shadow: 0 3px 10px rgba($primary, 0.25);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 14px rgba($primary, 0.35);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
