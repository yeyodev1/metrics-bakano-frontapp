<script setup lang="ts">
defineProps({
  viewMode: {
    type: String as () => 'month' | 'week' | 'global-week' | 'global-month',
    required: true,
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  workspaceName: {
    type: String,
    default: '',
  },
  workspaceMetaPageId: {
    type: String,
    default: '',
  },
})

defineEmits(['update:viewMode'])

function getWorkspaceInitials(name: string): string {
  if (!name) return 'WS'
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function getMetaPictureUrl(pageId: string): string {
  return `https://graph.facebook.com/${pageId}/picture?type=square`
}
</script>

<template>
  <div class="view-selector">
    <!-- Individual Workspace Toggle -->
    <div
      class="view-selector__group"
      :class="{ 'is-dimmed': viewMode.includes('global') }"
    >
      <div class="view-selector__client">
        <div class="view-selector__avatar">
          <img v-if="workspaceMetaPageId" :src="getMetaPictureUrl(workspaceMetaPageId)" />
          <span v-else>{{ getWorkspaceInitials(workspaceName) }}</span>
        </div>
        <span class="view-selector__client-name">{{ workspaceName }}</span>
      </div>

      <div class="view-selector__toggle">
        <button
          class="view-selector__btn"
          :class="{ 'is-active': viewMode === 'month' }"
          @click="$emit('update:viewMode', 'month')"
        >
          <i class="fa-solid fa-calendar-days" />
          <span>Mes</span>
        </button>
        <button
          class="view-selector__btn"
          :class="{ 'is-active': viewMode === 'week' }"
          @click="$emit('update:viewMode', 'week')"
        >
          <i class="fa-solid fa-list-ul" />
          <span>Semana</span>
        </button>
      </div>
    </div>

    <div v-if="isInternal" class="view-selector__divider" />

    <!-- Global Toggle (Internal only) -->
    <div
      v-if="isInternal"
      class="view-selector__group is-global"
      :class="{ 'is-dimmed': !viewMode.includes('global') }"
    >
      <div class="view-selector__label-row">
        <span class="view-selector__label">
          <i class="fa-solid fa-building" />
          Vista Agencia
        </span>
        <Transition name="fade">
          <span v-if="viewMode.includes('global')" class="view-selector__badge">
            Todas las cuentas
          </span>
        </Transition>
      </div>

      <div class="view-selector__toggle is-global">
        <button
          class="view-selector__btn"
          :class="{ 'is-active': viewMode === 'global-month' }"
          @click="$emit('update:viewMode', 'global-month')"
        >
          <i class="fa-solid fa-calendar-week" />
          <span>Mes</span>
        </button>
        <button
          class="view-selector__btn"
          :class="{ 'is-active': viewMode === 'global-week' }"
          @click="$emit('update:viewMode', 'global-week')"
        >
          <i class="fa-solid fa-rectangle-list" />
          <span>Semana</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.view-selector {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  width: 100%;
  min-width: 0;
  background: $primary-light;
  padding: 0.75rem 0.875rem;
  border-radius: 14px;
  border: 1px solid rgba($primary-dark, 0.06);

  // Only go horizontal when there's truly enough space (large screens with no sidebar,
  // or when container is wide enough — e.g., non-internal single-column layout)
  @media (min-width: 1400px) {
    flex-direction: row;
    align-items: flex-end;
    width: auto;
    gap: 1.25rem;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    transition: opacity 0.3s ease;

    &.is-dimmed {
      opacity: 0.45;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  &__client {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }

  &__avatar {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 12%) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.5rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__client-name {
    font-size: 0.76rem;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  &__label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #7c3aed;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;
  }

  &__badge {
    font-size: 0.58rem;
    font-weight: 700;
    background: #7c3aed;
    color: $white;
    padding: 0.1rem 0.5rem;
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
    white-space: nowrap;
  }

  // Divider only makes sense in horizontal layout
  &__divider {
    display: none;

    @media (min-width: 1400px) {
      display: block;
      width: 1px;
      height: 32px;
      background: rgba($primary-dark, 0.08);
      margin-bottom: 4px;
    }
  }

  &__toggle {
    display: flex;
    background: rgba($primary-dark, 0.06);
    border-radius: 11px;
    padding: 3px;
    gap: 2px;
    width: 100%;

    &.is-global {
      background: rgba(124, 58, 237, 0.08);
    }

    @media (min-width: 1400px) {
      width: auto;
    }
  }

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: $text-secondary;
    font-weight: 600;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    white-space: nowrap;

    &.is-active {
      background: $white;
      color: $primary;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

      .is-global & {
        color: #7c3aed;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
      }
    }

    &:hover:not(.is-active) {
      background: rgba($white, 0.6);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
