<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  viewMode: {
    type: String as () => 'month' | 'week' | 'global-week' | 'global-month',
    required: true,
  },
  currentMonth: {
    type: Date,
    required: true,
  },
  currentWeekStart: {
    type: Date,
    required: true,
  },
  showMineOnly: {
    type: Boolean,
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
  canManage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:viewMode', 
  'update:showMineOnly', 
  'prev', 
  'next', 
  'today', 
  'create'
])

const currentMonthLabel = computed(() => {
  return props.currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

const currentWeekLabel = computed(() => {
  const start = new Date(props.currentWeekStart)
  const end = new Date(props.currentWeekStart)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', opts)}`
})

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
  <header class="planning-header">
    <div class="planning-header__left">
      <div class="planning-header__nav">
        <button class="planning-header__nav-btn" @click="emit('prev')">
          <i class="fa-solid fa-chevron-left" />
        </button>
        <h2 class="planning-header__title">
          {{ viewMode.includes('month') ? currentMonthLabel : currentWeekLabel }}
        </h2>
        <button class="planning-header__nav-btn" @click="emit('next')">
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
      <button class="planning-header__today-btn" @click="emit('today')">Hoy</button>
    </div>

    <div class="planning-header__center">
      <!-- Individual View Group -->
      <div class="planning-header__view-group">
        <div class="planning-header__view-client">
          <div class="planning-header__view-client-avatar">
            <img v-if="workspaceMetaPageId" :src="getMetaPictureUrl(workspaceMetaPageId)" />
            <span v-else>{{ getWorkspaceInitials(workspaceName) }}</span>
          </div>
          <span class="planning-header__view-client-name">{{ workspaceName }}</span>
        </div>
        <div class="planning-header__view-toggle">
          <button 
            class="planning-header__view-btn" 
            :class="{ 'is-active': viewMode === 'month' }"
            @click="emit('update:viewMode', 'month')"
          >
            <i class="fa-solid fa-calendar-days" />
            <span>Mes</span>
          </button>
          <button 
            class="planning-header__view-btn" 
            :class="{ 'is-active': viewMode === 'week' }"
            @click="emit('update:viewMode', 'week')"
          >
            <i class="fa-solid fa-list-ul" />
            <span>Semana</span>
          </button>
        </div>
      </div>

      <div v-if="isInternal" class="planning-header__divider" />

      <!-- Global View Group -->
      <div v-if="isInternal" class="planning-header__view-group is-global">
        <span class="planning-header__view-group-label">
          <i class="fa-solid fa-globe" />
          Global Bakano
        </span>
        <div class="planning-header__view-toggle is-global">
          <button 
            class="planning-header__view-btn" 
            :class="{ 'is-active': viewMode === 'global-month' }"
            @click="emit('update:viewMode', 'global-month')"
          >
            <i class="fa-solid fa-calendar-week" />
            <span>Mes</span>
          </button>
          <button 
            class="planning-header__view-btn" 
            :class="{ 'is-active': viewMode === 'global-week' }"
            @click="emit('update:viewMode', 'global-week')"
          >
            <i class="fa-solid fa-rectangle-list" />
            <span>Semana</span>
          </button>
        </div>
      </div>
    </div>

    <div class="planning-header__right">
      <button 
        class="planning-header__filter-btn" 
        :class="{ 'is-mine': showMineOnly }"
        @click="emit('update:showMineOnly', !showMineOnly)"
      >
        <i class="fa-solid" :class="showMineOnly ? 'fa-user-check' : 'fa-users'" />
        <span>{{ showMineOnly ? 'Solo mis tareas' : 'Ver todo el equipo' }}</span>
      </button>
      
      <button v-if="canManage" class="planning-header__create-btn" @click="emit('create')">
        <i class="fa-solid fa-plus" />
        <span>Nuevo Evento</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.planning-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.5rem 0 1.5rem;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
    gap: 1rem;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__nav {
    display: flex;
    align-items: center;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 0.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }

  &__nav-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: $primary-dark;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: rgba($primary, 0.08);
      color: $primary;
    }
  }

  &__title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: $primary-dark;
    min-width: 180px;
    text-align: center;
    text-transform: capitalize;

    @media (max-width: 480px) {
      font-size: 1rem;
      min-width: 140px;
    }
  }

  &__today-btn {
    padding: 0.5rem 1rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.85rem;
    color: $primary-dark;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
      transform: translateY(-1px);
    }
  }

  &__center {
    display: flex;
    align-items: flex-end;
    gap: 1rem;

    @media (max-width: 1200px) {
      order: 3;
      width: 100%;
      justify-content: center;
    }
  }

  &__view-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &.is-global {
      .planning-header__view-group-label {
        color: #7c3aed;
        i { color: #7c3aed; }
      }
    }
  }

  &__view-client {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding-left: 0.2rem;

    @media (max-width: 1100px) {
      display: none;
    }
  }

  &__view-client-avatar {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 12%) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.52rem;
    font-weight: 800;
    color: $white;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba($primary, 0.25);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    i { font-size: 0.6rem; }
  }

  &__view-client-name {
    font-size: 0.75rem;
    font-weight: 700;
    color: $primary-dark;
    max-width: 110px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__view-group-label {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $text-secondary;
    padding-left: 0.35rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;

    @media (max-width: 1100px) {
      display: none;
    }
  }

  &__divider {
    width: 1px;
    height: 36px;
    background: rgba($primary-dark, 0.1);
    align-self: flex-end;
    margin: 0 0.2rem 3px;
  }

  &__view-toggle {
    display: flex;
    background: rgba($primary-dark, 0.05);
    border-radius: 12px;
    padding: 3px;
    gap: 2px;

    &.is-global {
      background: rgba(124, 58, 237, 0.07);
    }
  }

  &__view-btn {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 0.9rem;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: $text-secondary;
    font-weight: 600;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;

    @media (max-width: 1100px) {
      span { display: none; }
      padding: 0.45rem 0.65rem;
    }

    &.is-active {
      background: $white;
      color: $primary;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);

      .planning-header__view-toggle.is-global & {
        color: #7c3aed;
        background: rgba(124, 58, 237, 0.1);
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
      }
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @media (max-width: 480px) {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border-radius: 12px;
    border: 1.5px solid rgba($primary-dark, 0.15);
    background: transparent;
    color: $text-secondary;
    font-weight: 600;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.25s;

    @media (max-width: 1100px) {
      span { display: none; }
      padding: 0.55rem 0.75rem;
    }

    &.is-mine {
      border-color: $primary;
      background: rgba($primary, 0.08);
      color: $primary;
    }
  }

  &__create-btn {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba($primary, 0.2);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba($primary, 0.3);
    }
  }
}
</style>
