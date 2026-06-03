<script setup lang="ts">
import type { IBranch } from '@/types'
import { computed } from 'vue'

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
  currentMonthTotal: {
    type: Number,
    default: 0,
  },
  monthLabel: {
    type: String,
    default: 'este mes',
  },
  isVirtual: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'fa-solid fa-store',
  }
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

// Helper to convert hex to rgba for backgrounds
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const softBgColor = computed(() => {
  return props.branch.isActive || props.isVirtual ? hexToRgba(props.color, 0.05) : '#f8fafc'
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
    :class="{ 'branch-card--inactive': !props.branch.isActive && !props.isVirtual }"
  >
    <!-- Top accent bar (thinner and more elegant) -->
    <div class="branch-card__accent" :style="{ background: props.color }" />

    <!-- Header -->
    <div class="branch-card__header">
      <div
        class="branch-card__avatar"
        :style="{ background: hexToRgba(props.color, 0.12), color: props.color }"
      >
        <i :class="props.icon" />
      </div>

      <div class="branch-card__meta">
        <h4 class="branch-card__name">{{ props.branch.name }}</h4>
        <div class="branch-card__tags">
          <span
            v-if="!props.isVirtual"
            class="branch-badge"
            :class="props.branch.isActive ? 'branch-badge--active' : 'branch-badge--inactive'"
          >
            <span class="badge-dot" />
            {{ props.branch.isActive ? 'Activa' : 'Inactiva' }}
          </span>
          <span
            v-else
            class="branch-badge branch-badge--virtual"
          >
            <i class="fa-solid fa-globe" /> Canal Digital
          </span>
        </div>
      </div>

      <!-- Actions top-right -->
      <div v-if="!props.isVirtual" class="branch-card__actions-top">
        <button class="action-icon" title="Editar" @click="emit('edit', props.branch)">
          <i class="fa-solid fa-pen" />
        </button>
        <button class="action-icon action-icon--danger" title="Eliminar" @click="emit('delete', props.branch)">
          <i class="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>

    <!-- Main Content: Revenue inside a soft colored box -->
    <div class="branch-card__body">
      <div class="revenue-box" :style="{ backgroundColor: softBgColor, border: `1px solid ${hexToRgba(props.color, 0.1)}` }">
        <div class="revenue-box__header">
          <span class="revenue-box__label">
            <i class="fa-solid fa-chart-simple" :style="{ color: props.color }" /> 
            Facturado en {{ props.monthLabel.split(' ')[0] }}
          </span>
        </div>
        <h3 
          class="revenue-box__amount" 
          :style="{ color: props.branch.isActive || props.isVirtual ? '#0f172a' : '#94a3b8' }"
        >
          {{ formatCurrency(props.currentMonthTotal) }}
        </h3>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="!props.isVirtual" class="branch-card__footer">
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
          <i :class="props.branch.isActive ? 'fa-solid fa-pause' : 'fa-solid fa-play'" />
          <span>{{ props.branch.isActive ? 'Pausar sucursal' : 'Activar sucursal' }}</span>
        </template>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.branch-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
  overflow: hidden;
  position: relative;

  &:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    border-color: #cbd5e1;
  }

  &--inactive {
    background: #f8fafc;
    filter: grayscale(0.4);
    opacity: 0.8;
  }

  &__accent {
    height: 4px;
    width: 100%;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 20px 12px;
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
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.3px;
  }

  &__tags {
    display: flex;
    align-items: center;
  }

  .branch-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 6px;

    &--active {
      color: #059669;
      background: #ecfdf5;
      .badge-dot { background: #10b981; }
    }

    &--inactive {
      color: #64748b;
      background: #f1f5f9;
      .badge-dot { background: #94a3b8; }
    }

    &--virtual {
      color: #7c3aed;
      background: #f3e8ff;
      i { font-size: 12px; }
    }
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &__actions-top {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .action-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    &--danger:hover {
      background: #fee2e2;
      color: #ef4444;
    }
  }

  &__body {
    padding: 8px 20px 20px;
  }

  .revenue-box {
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: all 0.3s;

    &__header {
      display: flex;
      align-items: center;
    }

    &__label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      i {
        font-size: 13px;
      }
    }

    &__amount {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
  }

  &__footer {
    padding: 0 20px 20px;
    display: flex;
  }

  .btn-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;

    i { font-size: 14px; }

    &--on {
      background: #f8fafc;
      color: #334155;
      border-color: #e2e8f0;

      &:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
        border-color: #cbd5e1;
      }
    }

    &--off {
      background: #0f172a;
      color: #fff;

      &:hover:not(:disabled) {
        background: #1e293b;
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
