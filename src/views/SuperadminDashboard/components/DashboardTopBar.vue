<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Workspace } from '@/types'

const props = defineProps<{
  activeTab: 'workspaces' | 'account-admins' | 'superadmins' | 'planning' | 'traffickers'
  selectedWorkspace: Workspace | null
}>()

const emit = defineEmits<{
  (e: 'createWorkspace'): void
  (e: 'createSuperadmin'): void
}>()

const router = useRouter()
</script>

<template>
  <header class="superadmin-dashboard__topbar">
    <div class="superadmin-dashboard__topbar-left">
      <div v-if="activeTab === 'workspaces' && selectedWorkspace" class="superadmin-dashboard__ws-badge">
        <i class="fa-solid fa-briefcase" />
        <span>{{ selectedWorkspace.name }}</span>
      </div>
      <div v-else>
        <h1 class="superadmin-dashboard__title">Superadmin Panel</h1>
      </div>
    </div>
    
    <div class="superadmin-dashboard__topbar-right">
      <div class="superadmin-dashboard__superadmin-badge">
        <i class="fa-solid fa-shield-check" /> Superadmin Mode
      </div>
      <button
        v-if="activeTab === 'workspaces'"
        id="btn-create-workspace"
        class="superadmin-dashboard__btn-primary"
        type="button"
        @click="emit('createWorkspace')"
      >
        <i class="fa-solid fa-plus" aria-hidden="true" />
        Nuevo entorno
      </button>
      <button
        v-else
        class="superadmin-dashboard__btn-danger-outline"
        type="button"
        @click="emit('createSuperadmin')"
      >
        <i class="fa-solid fa-user-shield" />
        Nuevo Superadmin
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.superadmin-dashboard {
  &__topbar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.1);

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      gap: 0;
    }
  }

  &__ws-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: $primary-light;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 99px;
    color: $primary;
    font-weight: 600;
  }

  &__title {
    font-size: 1.5rem;
    margin: 0;
  }

  &__topbar-right {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  &__superadmin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: linear-gradient(135deg, rgba($primary, 0.1) 0%, rgba($primary, 0.05) 100%);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: fadeIn 0.5s ease-out;

    i {
      font-size: 0.9rem;
      color: $primary; // Override icon color for consistency
    }
  }

  &__btn-primary {
    background: $primary;
    color: $white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: box-shadow 0.2s, opacity 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba($primary, 0.3);
      opacity: 0.95;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__btn-danger-outline {
    background: transparent;
    border: 1px solid rgba($alert-error, 0.4);
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $alert-error;
    transition: all 0.2s;

    &:hover {
      background: rgba($alert-error, 0.06);
      border-color: $alert-error;
    }
  }
}
</style>
