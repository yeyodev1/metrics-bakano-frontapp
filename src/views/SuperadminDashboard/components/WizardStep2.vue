<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import type { WorkspaceUser } from '@/types'

const props = defineProps<{
  selectedInternal: WorkspaceUser[]
}>()

const emit = defineEmits<{
  (e: 'toggle-internal', user: WorkspaceUser): void
  (e: 'next'): void
  (e: 'back'): void
}>()

const toast = useToast()
const wizardInternalSearch = ref('')
const wizardInternalList = ref<WorkspaceUser[]>([])
const isLoadingWizardInternal = ref(false)

const ROLE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  director:          { icon: 'fa-solid fa-crown',          color: '#e6285c', label: 'Director' },
  estratega:         { icon: 'fa-solid fa-chess-knight',   color: '#7c3aed', label: 'Estratega' },
  project_manager:   { icon: 'fa-solid fa-clipboard-list', color: '#2563eb', label: 'PM' },
  content_manager:   { icon: 'fa-solid fa-pen-nib',        color: '#d97706', label: 'Content' },
  account_manager:   { icon: 'fa-solid fa-handshake',      color: '#059669', label: 'Account' },
  community_manager: { icon: 'fa-solid fa-comments',       color: '#db2777', label: 'Community' },
  editor:            { icon: 'fa-solid fa-film',            color: '#7c3aed', label: 'Editor' },
  productor:         { icon: 'fa-solid fa-clapperboard',   color: '#b45309', label: 'Productor' },
  disenador:         { icon: 'fa-solid fa-pen-ruler',      color: '#0891b2', label: 'Diseñador' },
  copywriter:        { icon: 'fa-solid fa-i-cursor',       color: '#6d28d9', label: 'Copywriter' },
  analista:          { icon: 'fa-solid fa-chart-line',     color: '#047857', label: 'Analista' },
  desarrollador:     { icon: 'fa-solid fa-code',           color: '#1d4ed8', label: 'Dev' },
  trafficker:        { icon: 'fa-solid fa-bullseye',       color: '#dc2626', label: 'Trafficker' },
}

function getRoleConfig(role: string | undefined) {
  if (!role) return { icon: 'fa-solid fa-user', color: '#6b7280', label: '—' }
  return ROLE_CONFIG[role] ?? { icon: 'fa-solid fa-user', color: '#6b7280', label: role }
}

async function wizardLoadInternalUsers(): Promise<void> {
  isLoadingWizardInternal.value = true
  try {
    const { users } = await workspaceService.listAllCollaborators(wizardInternalSearch.value || undefined)
    wizardInternalList.value = (users as WorkspaceUser[]).filter(u => u.isInternal)
  } catch {
    toast.error('Error cargando equipo interno.')
  } finally {
    isLoadingWizardInternal.value = false
  }
}

onMounted(() => {
  wizardLoadInternalUsers()
})
</script>

<template>
  <div class="superadmin-dashboard__wizard-body">
    <div class="superadmin-dashboard__wizard-hint">
      <i class="fa-solid fa-circle-info" />
      <span>Selecciona los miembros del equipo Bakano que trabajarán en este entorno. Es <strong>obligatorio</strong> asignar al menos uno.</span>
    </div>
    
    <div class="superadmin-dashboard__form-group">
      <label>Buscar en equipo interno</label>
      <div class="superadmin-dashboard__wizard-search-row">
        <input 
          v-model="wizardInternalSearch" 
          type="text" 
          placeholder="Nombre o email..." 
          @input="wizardLoadInternalUsers" 
        />
        <span v-if="isLoadingWizardInternal" class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
      </div>
    </div>

    <!-- Results list -->
    <div class="superadmin-dashboard__wizard-list">
      <button
        v-for="u in wizardInternalList.filter(u => !selectedInternal.find(s => s._id === u._id))"
        :key="u._id"
        type="button"
        class="superadmin-dashboard__wizard-user-row"
        @click="emit('toggle-internal', u)"
      >
        <span
          class="superadmin-dashboard__wizard-avatar"
          :style="{ background: getRoleConfig(u.internalRole).color + '22', color: getRoleConfig(u.internalRole).color }"
        >{{ (u.name || u.email).charAt(0).toUpperCase() }}</span>
        <span class="superadmin-dashboard__wizard-user-info">
          <strong>{{ u.name || 'Sin nombre' }}</strong>
          <span 
            class="superadmin-dashboard__wizard-role-badge" 
            :style="{ background: getRoleConfig(u.internalRole).color + '18', color: getRoleConfig(u.internalRole).color }"
          >
            <i :class="getRoleConfig(u.internalRole).icon" />
            {{ getRoleConfig(u.internalRole).label }}
          </span>
        </span>
        <i class="fa-solid fa-plus superadmin-dashboard__wizard-add-icon" />
      </button>
      <p v-if="wizardInternalList.length === 0 && !isLoadingWizardInternal" class="superadmin-dashboard__wizard-empty">
        Escribe para buscar usuarios internos.
      </p>
    </div>

    <!-- Selected chips -->
    <div v-if="selectedInternal.length" class="superadmin-dashboard__wizard-chips">
      <span
        v-for="u in selectedInternal"
        :key="u._id"
        class="superadmin-dashboard__wizard-chip"
        :style="{ background: getRoleConfig(u.internalRole).color + '15', borderColor: getRoleConfig(u.internalRole).color + '40' }"
      >
        <i :class="getRoleConfig(u.internalRole).icon" :style="{ color: getRoleConfig(u.internalRole).color }" />
        <span>{{ u.name || u.email }}</span>
        <button type="button" @click="emit('toggle-internal', u)"><i class="fa-solid fa-xmark" /></button>
      </span>
    </div>

    <div class="superadmin-dashboard__modal-footer">
      <button type="button" class="superadmin-dashboard__btn-ghost" @click="emit('back')">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <button 
        type="button" 
        class="superadmin-dashboard__btn-primary" 
        :disabled="selectedInternal.length === 0"
        @click="emit('next')"
      >
        Siguiente <i class="fa-solid fa-arrow-right" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__wizard-hint {
  margin: 0;
  padding: 0.75rem 1rem;
  background: rgba(#a855f7, 0.05);
  border: 1px solid rgba(#a855f7, 0.12);
  border-radius: 8px;
  font-size: 0.85rem;
  color: $primary-dark;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  i { color: #a855f7; margin-top: 2px; flex-shrink: 0; }
  span { flex: 1; }
}

.superadmin-dashboard__wizard-search-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  input { flex: 1; }
}

.superadmin-dashboard__wizard-list {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.superadmin-dashboard__wizard-user-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  border-bottom: 1px solid rgba($primary-dark, 0.05);
  width: 100%;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba($primary-dark, 0.025); }

  &.is-selected {
    background: rgba(#a855f7, 0.05);
    > i:last-child { color: #a855f7; }
  }

  > i:last-child { margin-left: auto; color: $text-secondary; font-size: 0.85rem; flex-shrink: 0; }
}

.superadmin-dashboard__wizard-add-icon {
  margin-left: auto;
  color: rgba($primary-dark, 0.2) !important;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: color 0.15s;

  .superadmin-dashboard__wizard-user-row:hover & { color: $primary !important; }
}

.superadmin-dashboard__wizard-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  flex-shrink: 0;
  transition: all 0.2s;
}

.superadmin-dashboard__wizard-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;

  strong { font-size: 0.875rem; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.superadmin-dashboard__wizard-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  width: fit-content;

  i { font-size: 0.62rem; }
}

.superadmin-dashboard__wizard-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.superadmin-dashboard__wizard-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.55rem 0.25rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  color: $primary-dark;

  > i:first-child { font-size: 0.65rem; }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba($primary-dark, 0.4);
    padding: 0;
    line-height: 1;
    font-size: 0.72rem;
    margin-left: 0.1rem;
    display: flex;
    align-items: center;
    transition: color 0.15s;

    &:hover { color: #ef4444; }
  }
}

.superadmin-dashboard__wizard-empty {
  padding: 0.75rem;
  color: $text-secondary;
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
}

.superadmin-dashboard__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
