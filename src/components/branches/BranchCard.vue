<script setup lang="ts">
import type { IBranch } from '@/types'

const props = defineProps({
  branch: {
    type: Object as () => IBranch,
    required: true,
  },
  color: {
    type: String,
    default: '#3b82f6',
  },
  isToggling: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'toggle', branch: IBranch): void
  (e: 'edit', branch: IBranch): void
  (e: 'delete', branch: IBranch): void
}>()
</script>

<template>
  <div
    class="branch-card"
    :class="{ 'branch-card--inactive': !props.branch.isActive }"
  >
    <!-- Top accent bar -->
    <div class="branch-card__accent" :style="{ background: props.color }" />

    <!-- Header -->
    <div class="branch-card__header">
      <div
        class="branch-card__avatar"
        :style="{ background: props.color + '18', color: props.color, boxShadow: `0 0 0 2px ${props.color}30` }"
      >
        <i class="fa-solid fa-store" />
      </div>

      <div class="branch-card__meta">
        <h4 class="branch-card__name">{{ props.branch.name }}</h4>
        <span
          class="branch-card__badge"
          :class="props.branch.isActive ? 'branch-card__badge--active' : 'branch-card__badge--inactive'"
        >
          <span class="badge-dot" />
          {{ props.branch.isActive ? 'Activa' : 'Inactiva' }}
        </span>
      </div>

      <!-- Actions top-right -->
      <div class="branch-card__actions-top">
        <button class="btn-icon" title="Editar" @click="emit('edit', props.branch)">
          <i class="fa-solid fa-pen-to-square" />
        </button>
        <button class="btn-icon btn-icon--danger" title="Eliminar" @click="emit('delete', props.branch)">
          <i class="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="branch-card__footer">
      <button
        class="btn-toggle"
        :class="props.branch.isActive ? 'btn-toggle--on' : 'btn-toggle--off'"
        :disabled="props.isToggling"
        @click="emit('toggle', props.branch)"
      >
        <template v-if="props.isToggling">
          <i class="fa-solid fa-spinner fa-spin" />
          <span>Actualizando…</span>
        </template>
        <template v-else>
          <i :class="props.branch.isActive ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
          <span>{{ props.branch.isActive ? 'Desactivar' : 'Activar' }}</span>
        </template>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.branch-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 16px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    transform: translateY(-3px);
  }

  &--inactive {
    opacity: 0.55;
    background: #f8fafc;
    filter: grayscale(0.3);
  }

  &__accent {
    height: 4px;
    width: 100%;
    flex-shrink: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 16px 14px;
  }

  &__avatar {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  &:hover &__avatar {
    transform: scale(1.05);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    flex: 1;
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;

    &--active {
      color: #059669;

      .badge-dot {
        background: #059669;
        box-shadow: 0 0 0 3px #d1fae5;
        animation: pulse-green 2s infinite;
      }
    }

    &--inactive {
      color: #94a3b8;

      .badge-dot { background: #cbd5e1; }
    }
  }

  &__actions-top {
    display: flex;
    gap: 4px;
    margin-left: auto;
    flex-shrink: 0;
  }

  &__footer {
    padding: 0 16px 16px;
    display: flex;
    align-items: center;
  }
}

.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  &--danger {
    &:hover {
      background: #fef2f2;
      color: #ef4444;
      border-color: #fecaca;
    }
  }
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;

  i { font-size: 15px; }

  &--on {
    background: #f0fdf4;
    color: #059669;
    border-color: #a7f3d0;

    &:hover:not(:disabled) {
      background: #dcfce7;
      border-color: #6ee7b7;
    }
  }

  &--off {
    background: #f8fafc;
    color: #64748b;
    border-color: #e2e8f0;

    &:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #334155;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 3px #d1fae5; }
  50% { box-shadow: 0 0 0 5px #a7f3d0; }
}
</style>
