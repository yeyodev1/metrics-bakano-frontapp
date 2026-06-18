<script setup lang="ts">
import { ref } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useToast } from '@/composables/useToast'
import type { WorkspaceUser } from '@/types'

const props = defineProps<{
  clientMode: 'new' | 'existing'
  newClient: any
  selectedExistingClient: WorkspaceUser | null
  sendBrandProfileInvite: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:clientMode', val: 'new' | 'existing'): void
  (e: 'update:selectedExistingClient', val: WorkspaceUser | null): void
  (e: 'update:sendBrandProfileInvite', val: boolean): void
  (e: 'submit'): void
  (e: 'back'): void
}>()

const toast = useToast()
const wizardClientSearch = ref('')
const wizardClientResults = ref<WorkspaceUser[]>([])
const isSearchingClient = ref(false)

async function wizardSearchExistingClient(): Promise<void> {
  if (!wizardClientSearch.value.trim()) return
  isSearchingClient.value = true
  try {
    const { users } = await workspaceService.listAllCollaborators(wizardClientSearch.value)
    wizardClientResults.value = (users as WorkspaceUser[]).filter(u => !u.isInternal)
  } catch {
    toast.error('Error buscando cliente.')
  } finally {
    isSearchingClient.value = false
  }
}
</script>

<template>
  <div class="superadmin-dashboard__wizard-body">
    <!-- Mode toggle -->
    <div class="superadmin-dashboard__wizard-mode-toggle">
      <button
        type="button"
        :class="['superadmin-dashboard__wizard-mode-btn', { 'is-active': clientMode === 'new' }]"
        @click="emit('update:clientMode', 'new')"
      ><i class="fa-solid fa-user-plus" /> Nuevo cliente</button>
      <button
        type="button"
        :class="['superadmin-dashboard__wizard-mode-btn', { 'is-active': clientMode === 'existing' }]"
        @click="emit('update:clientMode', 'existing')"
      ><i class="fa-solid fa-magnifying-glass" /> Ya existe</button>
    </div>

    <!-- New client form -->
    <template v-if="clientMode === 'new'">
      <div class="superadmin-dashboard__form-group">
        <label>Nombre completo (opcional)</label>
        <input v-model="newClient.name" type="text" placeholder="Ej: Juan Pérez" />
      </div>
      <div class="superadmin-dashboard__form-group">
        <label>Email <span class="superadmin-dashboard__required">*</span></label>
        <input v-model="newClient.email" type="email" placeholder="cliente@empresa.com" />
      </div>
      <div class="superadmin-dashboard__form-group">
        <label>Contraseña <span class="superadmin-dashboard__required">*</span></label>
        <input v-model="newClient.password" type="password" placeholder="Mínimo 8 caracteres" minlength="8" />
      </div>
      <label class="superadmin-dashboard__wizard-checkbox">
        <input v-model="newClient.sendWelcomeEmail" type="checkbox" />
        <span>Enviar email con credenciales de acceso</span>
      </label>
    </template>

    <!-- Existing client search -->
    <template v-else>
      <div class="superadmin-dashboard__form-group">
        <label>Buscar cliente por nombre o email</label>
        <div class="superadmin-dashboard__wizard-search-row">
          <input 
            v-model="wizardClientSearch" 
            type="text" 
            placeholder="Nombre o email..." 
            @keydown.enter.prevent="wizardSearchExistingClient" 
          />
          <button 
            type="button" 
            class="superadmin-dashboard__btn-primary superadmin-dashboard__btn-primary--sm" 
            :disabled="isSearchingClient" 
            @click="wizardSearchExistingClient"
          >
            <span v-if="!isSearchingClient"><i class="fa-solid fa-magnifying-glass" /></span>
            <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
          </button>
        </div>
      </div>
      <div class="superadmin-dashboard__wizard-list">
        <button
          v-for="u in wizardClientResults"
          :key="u._id"
          type="button"
          :class="['superadmin-dashboard__wizard-user-row', { 'is-selected': selectedExistingClient?._id === u._id }]"
          @click="emit('update:selectedExistingClient', u)"
        >
          <span class="superadmin-dashboard__wizard-avatar superadmin-dashboard__wizard-avatar--client">
            {{ (u.name || u.email).charAt(0).toUpperCase() }}
          </span>
          <span class="superadmin-dashboard__wizard-user-info">
            <strong>{{ u.name || 'Sin nombre' }}</strong>
            <small>{{ u.email }}</small>
          </span>
          <i :class="selectedExistingClient?._id === u._id ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
        </button>
        <p v-if="wizardClientResults.length === 0 && wizardClientSearch && !isSearchingClient" class="superadmin-dashboard__wizard-empty">
          Sin resultados. Prueba con otro término.
        </p>
      </div>
    </template>

    <!-- Brand profile invite -->
    <div class="superadmin-dashboard__wizard-invite-box">
      <label class="superadmin-dashboard__wizard-checkbox">
        <input 
          :checked="sendBrandProfileInvite" 
          type="checkbox" 
          @change="emit('update:sendBrandProfileInvite', ($event.target as HTMLInputElement).checked)" 
        />
        <span>
          <strong>Enviar invitación de Perfil de Marca</strong>
          <small>El cliente recibirá un email para llenar su perfil directamente. Esto es clave para crear contenido que venda.</small>
        </span>
      </label>
    </div>

    <div class="superadmin-dashboard__modal-footer">
      <button type="button" class="superadmin-dashboard__btn-ghost" @click="emit('back')">
        <i class="fa-solid fa-arrow-left" /> Atrás
      </button>
      <button 
        type="button" 
        class="superadmin-dashboard__btn-primary" 
        :disabled="isSaving" 
        @click="emit('submit')"
      >
        <span v-if="!isSaving"><i class="fa-solid fa-rocket" /> Crear entorno</span>
        <span v-else class="superadmin-dashboard__spinner superadmin-dashboard__spinner--sm" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__wizard-mode-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.superadmin-dashboard__wizard-mode-btn {
  flex: 1;
  padding: 0.6rem;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-secondary;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  &.is-active {
    border-color: #a855f7;
    background: rgba(#a855f7, 0.06);
    color: #a855f7;
  }
}

.superadmin-dashboard__wizard-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: $primary-dark;

  input[type='checkbox'] { margin-top: 3px; flex-shrink: 0; }

  span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  small { color: $text-secondary; font-size: 0.78rem; line-height: 1.4; }
}

.superadmin-dashboard__wizard-invite-box {
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(#a855f7, 0.04), rgba(#a855f7, 0.02));
  border: 1.5px solid rgba(#a855f7, 0.15);
  border-radius: 10px;
  margin-top: 0.5rem;
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

  &--client {
    background: rgba($primary, 0.1);
    color: $primary;
  }
}

.superadmin-dashboard__wizard-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;

  strong { font-size: 0.875rem; color: $primary-dark; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  small { font-size: 0.75rem; color: $text-secondary; }
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
