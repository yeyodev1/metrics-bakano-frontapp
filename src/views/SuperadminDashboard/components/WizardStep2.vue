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
      <label class="superadmin-dashboard__label">Buscar en equipo interno</label>
      <div class="superadmin-dashboard__wizard-search-row">
        <i class="fa-solid fa-magnifying-glass superadmin-dashboard__search-icon" />
        <input 
          v-model="wizardInternalSearch" 
          type="text" 
          class="superadmin-dashboard__wizard-input"
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
.superadmin-dashboard__wizard-body {
  padding: 1.5rem 1.5rem 1rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1.25rem !important;
}

.superadmin-dashboard__wizard-hint {
  margin: 0 !important;
  padding: 0.85rem 1.1rem !important;
  background: rgba(#a855f7, 0.06) !important;
  border: 1px solid rgba(#a855f7, 0.15) !important;
  border-radius: 10px !important;
  font-size: 0.85rem !important;
  color: $primary-dark !important;
  line-height: 1.5 !important;
  display: flex !important;
  align-items: flex-start !important;
  gap: 0.6rem !important;

  i { color: #a855f7 !important; margin-top: 2px !important; flex-shrink: 0 !important; font-size: 0.95rem !important; }
  span { flex: 1 !important; }
}

.superadmin-dashboard__form-group {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.5rem !important;
}

.superadmin-dashboard__label {
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  color: $primary-dark !important;
  margin-bottom: 0.2rem !important;
  display: block !important;
}

.superadmin-dashboard__wizard-search-row {
  position: relative !important;
  display: flex !important;
  gap: 0.5rem !important;
  align-items: center !important;
  width: 100% !important;

  .superadmin-dashboard__search-icon {
    position: absolute !important;
    left: 0.85rem !important;
    font-size: 0.85rem !important;
    color: $text-secondary !important;
    pointer-events: none !important;
    z-index: 2 !important;
  }
}

.superadmin-dashboard__wizard-input {
  width: 100% !important;
  padding: 0.75rem 1rem 0.75rem 2.4rem !important;
  border: 1.5px solid rgba($primary-dark, 0.15) !important;
  border-radius: 10px !important;
  font-size: 0.9rem !important;
  color: $primary-dark !important;
  background: rgba($primary-dark, 0.02) !important;
  transition: all 0.2s ease !important;
  outline: none !important;
  box-sizing: border-box !important;

  &::placeholder {
    color: rgba($primary-dark, 0.4) !important;
  }

  &:hover {
    border-color: rgba($primary-dark, 0.3) !important;
    background: $white !important;
  }

  &:focus {
    border-color: #a855f7 !important;
    background: $white !important;
    box-shadow: 0 0 0 4px rgba(#a855f7, 0.15) !important;
  }
}

.superadmin-dashboard__wizard-list {
  max-height: 200px !important;
  overflow-y: auto !important;
  border: 1.5px solid rgba($primary-dark, 0.1) !important;
  border-radius: 10px !important;
  display: flex !important;
  flex-direction: column !important;
  background: $white !important;
}

.superadmin-dashboard__wizard-user-row {
  display: flex !important;
  align-items: center !important;
  gap: 0.85rem !important;
  padding: 0.7rem 0.95rem !important;
  background: none !important;
  border: none !important;
  cursor: pointer !important;
  text-align: left !important;
  transition: background 0.15s !important;
  border-bottom: 1px solid rgba($primary-dark, 0.05) !important;
  width: 100% !important;

  &:last-child { border-bottom: none !important; }
  &:hover { background: rgba(#a855f7, 0.04) !important; }

  &.is-selected {
    background: rgba(#a855f7, 0.08) !important;
    > i:last-child { color: #a855f7 !important; }
  }

  > i:last-child { margin-left: auto !important; color: $text-secondary !important; font-size: 0.85rem !important; flex-shrink: 0 !important; }
}

.superadmin-dashboard__wizard-add-icon {
  margin-left: auto !important;
  color: rgba($primary-dark, 0.3) !important;
  font-size: 0.85rem !important;
  flex-shrink: 0 !important;
  transition: color 0.15s !important;

  .superadmin-dashboard__wizard-user-row:hover & { color: #a855f7 !important; }
}

.superadmin-dashboard__wizard-avatar {
  width: 34px !important;
  height: 34px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 0.85rem !important;
  font-weight: 800 !important;
  flex-shrink: 0 !important;
  transition: all 0.2s !important;
}

.superadmin-dashboard__wizard-user-info {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.2rem !important;
  flex: 1 !important;
  min-width: 0 !important;
  overflow: hidden !important;

  strong { font-size: 0.88rem !important; color: $primary-dark !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
}

.superadmin-dashboard__wizard-role-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.35rem !important;
  padding: 0.2rem 0.6rem !important;
  border-radius: 20px !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  width: fit-content !important;

  i { font-size: 0.65rem !important; }
}

.superadmin-dashboard__wizard-chips {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 0.5rem !important;
  margin-top: 0.25rem !important;
}

.superadmin-dashboard__wizard-chip {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.4rem !important;
  padding: 0.3rem 0.65rem 0.3rem 0.55rem !important;
  border: 1px solid transparent !important;
  border-radius: 20px !important;
  font-size: 0.8rem !important;
  font-weight: 600 !important;
  color: $primary-dark !important;

  > i:first-child { font-size: 0.7rem !important; }

  button {
    background: none !important;
    border: none !important;
    cursor: pointer !important;
    color: rgba($primary-dark, 0.4) !important;
    padding: 0 !important;
    line-height: 1 !important;
    font-size: 0.75rem !important;
    margin-left: 0.15rem !important;
    display: flex !important;
    align-items: center !important;
    transition: color 0.15s !important;

    &:hover { color: #ef4444 !important; }
  }
}

.superadmin-dashboard__wizard-empty {
  padding: 1rem !important;
  color: $text-secondary !important;
  font-size: 0.88rem !important;
  text-align: center !important;
  margin: 0 !important;
}

.superadmin-dashboard__modal-footer {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 0.75rem !important;
  margin-top: 1rem !important;
  padding-top: 1.25rem !important;
  border-top: 1px solid rgba($primary-dark, 0.08) !important;
}

.superadmin-dashboard__btn-ghost {
  appearance: none !important;
  -webkit-appearance: none !important;
  background: transparent !important;
  border: 1.5px solid rgba($primary-dark, 0.18) !important;
  color: $primary-dark !important;
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  padding: 0.65rem 1.3rem !important;
  border-radius: 10px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.2s ease !important;
  box-shadow: none !important;

  &:hover {
    background: rgba($primary-dark, 0.05) !important;
    border-color: rgba($primary-dark, 0.35) !important;
  }
}

.superadmin-dashboard__btn-primary {
  appearance: none !important;
  -webkit-appearance: none !important;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important;
  color: $white !important;
  border: none !important;
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 10px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 4px 14px rgba(#a855f7, 0.35) !important;

  &:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 18px rgba(#a855f7, 0.45) !important;
  }

  &:active:not(:disabled) {
    transform: translateY(0) !important;
  }

  &:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
  }
}

.superadmin-dashboard__spinner {
  width: 14px !important;
  height: 14px !important;
  border: 2px solid rgba($primary, 0.2) !important;
  border-top-color: $primary !important;
  border-radius: 50% !important;
  animation: spin 0.8s linear infinite !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
