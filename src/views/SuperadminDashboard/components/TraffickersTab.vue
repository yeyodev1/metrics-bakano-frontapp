<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useGlobalUserModal } from '@/composables/useGlobalUserModal'
import { useToast } from '@/composables/useToast'
import type { WorkspaceUser } from '@/types'
import TraffickersPreviewPanel from './TraffickersPreviewPanel.vue'

const globalUserModal = useGlobalUserModal()
const toast = useToast()

const traffickers = ref<WorkspaceUser[]>([])
const isLoading = ref(false)

const emit = defineEmits<{
  (e: 'refresh-count'): void
}>()

const previewPanel = ref<InstanceType<typeof TraffickersPreviewPanel> | null>(null)

async function fetchTraffickers(): Promise<void> {
  isLoading.value = true
  try {
    const { users } = await workspaceService.listAllCollaborators()
    traffickers.value = users.filter((u: any) => u.internalRole === 'trafficker')
  } catch {
    toast.error('Error al cargar traffickers')
  } finally {
    isLoading.value = false
  }
}

async function openCreateGlobalUser(): Promise<void> {
  const newUser = await globalUserModal.open({ mode: 'create' })
  if (newUser) {
    if (newUser.internalRole === 'trafficker') {
      traffickers.value.unshift(newUser)
    } else {
      await fetchTraffickers()
    }
    emit('refresh-count')
  }
}

async function openEditGlobalUser(user: WorkspaceUser): Promise<void> {
  const updatedUser = await globalUserModal.open({ mode: 'edit', user })
  if (updatedUser) {
    if (updatedUser.internalRole === 'trafficker') {
      const index = traffickers.value.findIndex(u => u._id === updatedUser._id)
      if (index !== -1) {
        traffickers.value[index] = updatedUser
      } else {
        await fetchTraffickers()
      }
    } else {
      traffickers.value = traffickers.value.filter(u => u._id !== updatedUser._id)
    }
    emit('refresh-count')
  }
}

onMounted(fetchTraffickers)
</script>

<template>
  <div class="superadmin-dashboard__traffickers">
    <div class="superadmin-dashboard__section-header superadmin-dashboard__section-header--row">
      <div class="superadmin-dashboard__section-title">
        <h3>Traffickers</h3>
        <p>Media buyers y sus entornos asignados. Haz clic en "Ver como" para simular su vista.</p>
      </div>
      <button class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
        <i class="fa-solid fa-user-plus" />
        Nuevo Trafficker
      </button>
    </div>

    <div v-if="isLoading" class="superadmin-dashboard__loading">
      <div class="superadmin-dashboard__spinner" />
      <p>Cargando traffickers...</p>
    </div>

    <div v-else-if="traffickers.length === 0" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-state-icon">
        <i class="fa-solid fa-bullseye" />
      </div>
      <h4 class="superadmin-dashboard__empty-state-title">Sin traffickers registrados</h4>
      <p class="superadmin-dashboard__empty-state-desc">Crea un usuario con rol interno "Trafficker" y asígnale sus entornos.</p>
      <button class="superadmin-dashboard__btn-primary" @click="openCreateGlobalUser">
        <i class="fa-solid fa-plus" /> Crear Trafficker
      </button>
    </div>

    <div v-else class="superadmin-dashboard__trf-grid">
      <div
        v-for="trf in traffickers"
        :key="trf._id"
        class="superadmin-dashboard__trf-card"
      >
        <div class="superadmin-dashboard__trf-card-head">
          <div class="superadmin-dashboard__trf-avatar">
            {{ (trf.name || trf.email || '?')[0].toUpperCase() }}
          </div>
          <div class="superadmin-dashboard__trf-info">
            <strong>{{ trf.name || 'Sin nombre' }}</strong>
            <span>{{ trf.email }}</span>
            <span
              class="superadmin-dashboard__status-chip"
              :class="{ 'superadmin-dashboard__status-chip--active': trf.isActive }"
              style="width: fit-content; margin-top: 4px;"
            >
              {{ trf.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <div class="superadmin-dashboard__trf-ws-section">
          <p class="superadmin-dashboard__trf-ws-label">
            <i class="fa-solid fa-layer-group" />
            {{ trf.workspaces?.length || 0 }} entorno{{ trf.workspaces?.length !== 1 ? 's' : '' }} asignado{{ trf.workspaces?.length !== 1 ? 's' : '' }}
          </p>
          <div class="superadmin-dashboard__trf-ws-chips">
            <template v-if="trf.workspaces?.length">
              <span
                v-for="ws in trf.workspaces.slice(0, 4)"
                :key="ws.workspaceId?._id"
                class="superadmin-dashboard__trf-ws-chip"
              >
                {{ ws.workspaceId?.name || '---' }}
              </span>
              <span
                v-if="trf.workspaces.length > 4"
                class="superadmin-dashboard__trf-ws-chip superadmin-dashboard__trf-ws-chip--more"
                :title="trf.workspaces.slice(4).map((w: any) => w.workspaceId?.name || '---').join(', ')"
              >
                +{{ trf.workspaces.length - 4 }} más
              </span>
            </template>
            <span v-else class="superadmin-dashboard__trf-ws-chip superadmin-dashboard__trf-ws-chip--empty">
              Sin entornos asignados
            </span>
          </div>
        </div>

        <div class="superadmin-dashboard__trf-card-actions">
          <button
            class="superadmin-dashboard__trf-view-btn"
            @click="previewPanel?.open(trf)"
            :disabled="!trf.workspaces?.length"
            title="Ver como Trafficker"
          >
            <i class="fa-solid fa-eye" />
            Ver como
          </button>
          <button class="superadmin-dashboard__action-btn" @click="openEditGlobalUser(trf)" title="Editar">
            <i class="fa-solid fa-pen" />
          </button>
        </div>
      </div>
    </div>

    <!-- Teleport panel component -->
    <TraffickersPreviewPanel ref="previewPanel" />
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__traffickers {
  padding: 0;
}

.superadmin-dashboard__trf-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 20px;

  @media (min-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
}

.superadmin-dashboard__trf-card {
  background: $white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: box-shadow 0.15s;

  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); }
}

.superadmin-dashboard__trf-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.superadmin-dashboard__trf-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706, #b45309);
  color: $white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  flex-shrink: 0;
}

.superadmin-dashboard__trf-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: $primary-dark;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 12px;
    color: $text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.superadmin-dashboard__trf-ws-section { display: flex; flex-direction: column; gap: 8px; }

.superadmin-dashboard__trf-ws-label {
  font-size: 11px;
  font-weight: 600;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 5px;
}

.superadmin-dashboard__trf-ws-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.superadmin-dashboard__trf-ws-chip {
  padding: 3px 8px;
  background: rgba($primary, 0.08);
  color: $primary;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;

  &--more {
    background: rgba($primary, 0.15);
    cursor: default;
    position: relative;

    &:hover::after {
      content: attr(title);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: $primary-dark;
      color: $white;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      white-space: normal;
      max-width: 220px;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
    }
  }

  &--empty {
    background: rgba($text-secondary, 0.08);
    color: $text-secondary;
    font-weight: 400;
    font-style: italic;
  }
}

.superadmin-dashboard__trf-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba($primary, 0.07);
}

.superadmin-dashboard__trf-view-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #d97706, #b45309);
  color: $white;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
  &:disabled { opacity: 0.45; cursor: default; }
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  &--sm {
    width: 14px;
    height: 14px;
    border-width: 2px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
