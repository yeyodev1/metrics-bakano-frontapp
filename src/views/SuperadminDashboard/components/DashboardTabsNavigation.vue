<script setup lang="ts">
const props = defineProps<{
  activeTab: 'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys' | 'traffickers'
  traffickersCount: number
}>()

const emit = defineEmits<{
  (e: 'switchTab', tab: 'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'surveys' | 'traffickers'): void
}>()
</script>

<template>
  <nav class="superadmin-dashboard__tabs">
    <button
      class="superadmin-dashboard__tab"
      :class="{ 'superadmin-dashboard__tab--active': activeTab === 'workspaces' }"
      @click="emit('switchTab', 'workspaces')"
    >
      <i class="fa-solid fa-layer-group" /> Entornos & Clientes
    </button>
    <button
      class="superadmin-dashboard__tab"
      :class="{ 'superadmin-dashboard__tab--active': activeTab === 'account-admins' }"
      @click="emit('switchTab', 'account-admins')"
    >
      <i class="fa-solid fa-users-gear" /> Admins de Cuenta
    </button>
    <button
      class="superadmin-dashboard__tab superadmin-dashboard__tab--danger"
      :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--danger-active': activeTab === 'superadmins' }"
      @click="emit('switchTab', 'superadmins')"
    >
      <i class="fa-solid fa-user-shield" /> Superadmins del Sistema
    </button>
    <button
      class="superadmin-dashboard__tab superadmin-dashboard__tab--planning"
      :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--planning-active': activeTab === 'planning' }"
      @click="emit('switchTab', 'planning')"
    >
      <i class="fa-solid fa-calendar-range" /> Planificación Global
    </button>
    <button
      class="superadmin-dashboard__tab superadmin-dashboard__tab--surveys"
      :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--surveys-active': activeTab === 'surveys' }"
      @click="emit('switchTab', 'surveys')"
    >
      <i class="fa-solid fa-clipboard-list" /> Encuestas
      <span class="superadmin-dashboard__tab-global-tag">GLOBAL</span>
    </button>
    <button
      class="superadmin-dashboard__tab superadmin-dashboard__tab--traffickers"
      :class="{ 'superadmin-dashboard__tab--active superadmin-dashboard__tab--traffickers-active': activeTab === 'traffickers' }"
      @click="emit('switchTab', 'traffickers')"
    >
      <i class="fa-solid fa-bullseye-arrow" /> Traffickers
      <span v-if="traffickersCount > 0" class="superadmin-dashboard__tab-count">{{ traffickersCount }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.superadmin-dashboard {
  &__tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid rgba($primary-dark, 0.08);
    padding-bottom: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &__tab {
    flex: none;
    white-space: nowrap;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    font-size: 0.82rem;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    position: relative;
    bottom: -2px;
    border-bottom: 2px solid transparent;

    @media (min-width: 640px) {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      gap: 0.5rem;
    }

    &:hover {
      color: $primary-dark;
      background: rgba($primary-dark, 0.03);
    }

    &--active {
      color: $primary;
      border-bottom: 2px solid $primary;
      background: $white;
    }

    &--danger {
      &:hover {
        color: $alert-error;
        background: rgba($alert-error, 0.04);
      }
    }

    &--danger-active {
      color: $alert-error !important;
      border-bottom-color: $alert-error !important;
    }

    &--planning-active {
      // Missing in extracted code but presumably exists or fallbacks to primary
    }

    &--surveys {
      i { color: $primary; }
      &:hover { color: $primary; }
    }

    &--surveys-active {
      color: $primary !important;
      border-bottom-color: $primary !important;
    }
    
    &--traffickers-active {
      color: #d97706 !important;
      border-bottom: 3px solid #d97706 !important;
      font-weight: 700;
    }
  }

  &__tab-global-tag {
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.07em;
    color: $primary;
    background: rgba($primary, 0.12);
    padding: 0.1rem 0.4rem;
    border-radius: 100px;
    border: 1px solid rgba($primary, 0.2);
  }

  &__tab-count {
    margin-left: 6px;
    font-size: 10px;
    font-weight: 800;
    background: rgba(#d97706, 0.15);
    color: #92400e;
    padding: 2px 6px;
    border-radius: 100px;
    border: 1px solid rgba(#d97706, 0.25);
  }
}
</style>
