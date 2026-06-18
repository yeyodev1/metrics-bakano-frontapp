<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workspaceService } from '@/services/workspace.service'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useSuperadminModal } from '@/composables/useSuperadminModal'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const confirm = useConfirm()
const toast = useToast()
const superadminModal = useSuperadminModal()

const admins = ref<any[]>([])
const isLoading = ref(false)

async function fetchSuperadmins(): Promise<void> {
  isLoading.value = true
  try {
    const { admins: data } = await workspaceService.listSuperadmins()
    admins.value = data
  } catch {
    toast.error('Error al cargar superadmins')
  } finally {
    isLoading.value = false
  }
}

function openCreate(): void {
  superadminModal.open().then((user) => {
    if (user) admins.value.unshift(user)
  })
}

async function confirmDeleteSuperadmin(admin: any): Promise<void> {
  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar superadmin?',
    message: `Esta acción es irreversible. Se eliminará a ${admin.email} con todos sus privilegios de sistema.`,
    confirmText: 'Sí, eliminar superadmin',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    try {
      await workspaceService.deleteSuperadmin(admin._id)
      admins.value = admins.value.filter(a => a._id !== admin._id)
      toast.success('Superadmin eliminado.')
    } catch {
      toast.error('Error al eliminar el superadmin.')
    }
  }
}

defineExpose({ openCreate })

onMounted(fetchSuperadmins)
</script>

<template>
  <div class="superadmin-dashboard__superadmins-panel">
    <!-- Danger Alert -->
    <div class="superadmin-dashboard__danger-alert">
      <div class="superadmin-dashboard__danger-alert-icon">
        <i class="fa-solid fa-triangle-exclamation" />
      </div>
      <div class="superadmin-dashboard__danger-alert-body">
        <strong>Zona de Alto Privilegio</strong>
        <p>Los usuarios Superadmin tienen <strong>acceso total e irrestricto</strong> al sistema: pueden crear y eliminar entornos, gestionar cualquier usuario, y modificar cualquier configuración de clientes. Crea estas cuentas solo para personas de absoluta confianza.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="superadmin-dashboard__loading">
      <span class="superadmin-dashboard__spinner" />
      <p>Cargando superadmins...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="admins.length === 0" class="superadmin-dashboard__empty-state">
      <div class="superadmin-dashboard__empty-state-icon superadmin-dashboard__empty-state-icon--danger">
        <i class="fa-solid fa-user-shield" />
      </div>
      <h4 class="superadmin-dashboard__empty-state-title">No hay superadmins registrados</h4>
      <p class="superadmin-dashboard__empty-state-desc">Solo verás tu propia cuenta en esta lista una vez que se sincronice.</p>
    </div>

    <!-- Superadmin List -->
    <div v-else class="superadmin-dashboard__superadmin-grid">
      <div
        v-for="admin in admins"
        :key="admin._id"
        class="superadmin-dashboard__superadmin-card"
        :class="{ 'superadmin-dashboard__superadmin-card--self': admin._id === userStore.id }"
      >
        <div class="superadmin-dashboard__user-main">
          <div class="superadmin-dashboard__superadmin-avatar">
            <i class="fa-solid fa-user-shield" />
          </div>
          <div class="superadmin-dashboard__user-info">
            <div class="superadmin-dashboard__user-name-row">
              <span class="superadmin-dashboard__user-name">{{ admin.name || 'Sin nombre' }}</span>
              <span class="superadmin-dashboard__role-badge superadmin-dashboard__role-badge--superadmin">
                superadmin
              </span>
              <span v-if="admin._id === userStore.id" class="superadmin-dashboard__self-tag">
                <i class="fa-solid fa-circle-check" /> Tú
              </span>
            </div>
            <span class="superadmin-dashboard__user-email">{{ admin.email }}</span>
          </div>
        </div>
        <div class="superadmin-dashboard__user-actions">
          <button
            v-if="admin._id !== userStore.id"
            class="superadmin-dashboard__action-btn superadmin-dashboard__action-btn--danger"
            title="Eliminar superadmin"
            @click="confirmDeleteSuperadmin(admin)"
          >
            <i class="fa-solid fa-trash-can" />
          </button>
          <span v-else class="superadmin-dashboard__self-lock" title="No puedes eliminarte a ti mismo">
            <i class="fa-solid fa-lock" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.superadmin-dashboard__superadmins-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.superadmin-dashboard__danger-alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba($alert-error, 0.06);
  border: 1px solid rgba($alert-error, 0.2);
  border-left: 4px solid $alert-error;
  border-radius: 10px;
  color: darken($alert-error, 10%);

  &-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    padding-top: 0.1rem;
  }

  &-body {
    strong {
      display: block;
      font-size: 1rem;
      margin-bottom: 0.35rem;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: rgba(darken($alert-error, 20%), 0.85);
    }
  }
}

.superadmin-dashboard__superadmin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

.superadmin-dashboard__superadmin-card {
  background: $white;
  border: 1px solid rgba($alert-error, 0.15);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba($alert-error, 0.08);
  }

  .superadmin-dashboard__user-main {
    padding-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  .superadmin-dashboard__user-actions {
    padding-top: 0.75rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    .superadmin-dashboard__user-main {
      padding-bottom: 0;
    }

    .superadmin-dashboard__user-actions {
      padding-top: 0;
      border-top: none;
    }
  }

  &--self {
    border-color: rgba($primary, 0.2);
    background: rgba($primary, 0.01);
  }
}

.superadmin-dashboard__superadmin-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba($alert-error, 0.1);
  color: $alert-error;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.superadmin-dashboard__role-badge--superadmin {
  background: rgba($alert-error, 0.1);
  color: $alert-error;
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}

.superadmin-dashboard__self-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: $primary;
  font-weight: 700;
  background: rgba($primary, 0.08);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.superadmin-dashboard__self-lock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba($primary-dark, 0.04);
  color: rgba($text-secondary, 0.5);
  font-size: 0.85rem;
}

.superadmin-dashboard__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.superadmin-dashboard__user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.superadmin-dashboard__user-name {
  font-weight: 600;
  color: $primary-dark;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__user-email {
  font-size: 0.85rem;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.superadmin-dashboard__action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba($primary-dark, 0.05);
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba($primary, 0.1);
    color: $primary;
  }

  &--danger:hover {
    background: rgba($alert-error, 0.1);
    color: $alert-error;
  }
}

.superadmin-dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: $text-secondary;
}

.superadmin-dashboard__spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.superadmin-dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  height: 100%;
  color: $text-secondary;
}

.superadmin-dashboard__empty-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba($primary, 0.05) 0%, rgba($primary, 0.1) 100%);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba($primary, 0.1);

  &--danger {
    background: linear-gradient(135deg, rgba($alert-error, 0.05) 0%, rgba($alert-error, 0.1) 100%);
    color: $alert-error;
    box-shadow: 0 8px 24px rgba($alert-error, 0.1);
  }
}

.superadmin-dashboard__empty-state-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: $primary-dark;
  margin: 0 0 0.5rem;
}

.superadmin-dashboard__empty-state-desc {
  font-size: 0.95rem;
  max-width: 320px;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}
</style>
