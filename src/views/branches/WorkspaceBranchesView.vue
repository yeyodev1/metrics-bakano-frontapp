<template>
  <div class="branches-view">
    <div class="branches-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <i class="fa-solid fa-store" />
        </div>
        <div>
          <h1>Sucursales</h1>
          <p class="header-sub">Administra las sedes físicas de tu negocio</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="fa-solid fa-plus" />
        Nueva Sucursal
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="loading-spinner" />
      <p>Cargando sucursales...</p>
    </div>

    <div v-else-if="branches.length === 0" class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-store-slash" /></div>
      <h3>No tienes sucursales registradas</h3>
      <p>Crea al menos una sucursal para poder registrar la facturación de forma desglosada por cada una de tus sedes.</p>
      <button class="btn-create btn-create--large" @click="openCreateModal">
        <i class="fa-solid fa-plus" />
        Crear mi primera sucursal
      </button>
    </div>

    <div v-else class="branches-grid">
      <div v-for="branch in branches" :key="branch._id" class="branch-card">
        <div class="branch-card-left">
          <div class="branch-avatar">
            {{ branch.name.substring(0, 2).toUpperCase() }}
          </div>
          <div class="branch-info">
            <h4>{{ branch.name }}</h4>
            <span class="branch-status" :class="branch.isActive ? 'status-active' : 'status-inactive'">
              {{ branch.isActive ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </div>
        <div class="branch-actions">
          <button class="btn-icon" @click="openEditModal(branch)" title="Editar">
            <i class="fa-solid fa-pen" />
          </button>
          <button class="btn-icon btn-icon--danger" @click="deleteBranch(branch)" title="Eliminar">
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </div>
    </div>

    <BranchFormModal
      v-model="showModal"
      :loading="submitting"
      :edit-mode="editMode"
      :existing-name="modalName"
      @confirmed="handleSaveBranch"
    />

    <!-- Success toast -->
    <Transition name="toast-fade">
      <div v-if="successMsg" class="success-toast">
        <i class="fa-solid fa-circle-check" />
        {{ successMsg }}
      </div>
    </Transition>

    <!-- Error toast -->
    <Transition name="toast-fade">
      <div v-if="errorMsg" class="error-toast">
        <i class="fa-solid fa-circle-exclamation" />
        {{ errorMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { branchService, type IBranch } from '@/services/branch.service'
import { useConfirm } from '@/composables/useConfirm'
import BranchFormModal from '@/components/branches/BranchFormModal.vue'

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)
const confirm = useConfirm()

const loading = ref(false)
const submitting = ref(false)
const branches = ref<IBranch[]>([])
const successMsg = ref('')
const errorMsg = ref('')

const showModal = ref(false)
const editMode = ref(false)
const modalName = ref('')
const currentBranchId = ref<string | null>(null)

async function fetchBranches() {
  loading.value = true
  try {
    const res = await branchService.getBranches(workspaceId.value)
    branches.value = res.branches || []
  } catch (err: any) {
    showError(err.message || 'Error al cargar sucursales')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editMode.value = false
  modalName.value = ''
  currentBranchId.value = null
  showModal.value = true
}

function openEditModal(branch: IBranch) {
  editMode.value = true
  modalName.value = branch.name
  currentBranchId.value = branch._id
  showModal.value = true
}

async function handleSaveBranch(payload: { name: string }) {
  submitting.value = true
  try {
    if (editMode.value && currentBranchId.value) {
      await branchService.updateBranch(workspaceId.value, currentBranchId.value, payload)
      showSuccess('Sucursal actualizada correctamente')
    } else {
      await branchService.createBranch(workspaceId.value, payload)
      showSuccess('Sucursal creada correctamente')
    }
    showModal.value = false
    await fetchBranches()
  } catch (err: any) {
    showError(err.message || 'Error al guardar la sucursal')
  } finally {
    submitting.value = false
  }
}

async function deleteBranch(branch: IBranch) {
  const isConfirmed = await confirm.confirm({
    title: '¿Eliminar sucursal?',
    message: `¿Estás seguro de que deseas eliminar la sucursal "${branch.name}"? Esta acción no se puede deshacer.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    requireHold: true
  })

  if (isConfirmed) {
    try {
      await branchService.deleteBranch(workspaceId.value, branch._id)
      showSuccess('Sucursal eliminada')
      await fetchBranches()
    } catch (err: any) {
      showError(err.message || 'Error al eliminar la sucursal')
    }
  }
}

function showSuccess(msg: string) {
  successMsg.value = msg
  setTimeout(() => (successMsg.value = ''), 4000)
}

function showError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => (errorMsg.value = ''), 5000)
}

onMounted(() => {
  fetchBranches()
})
</script>

<style scoped lang="scss">
.branches-view {
  padding: 16px 16px 80px;
  max-width: 1100px;
  width: 100%;

  @media (min-width: 640px) {
    padding: 28px 32px 80px;
  }
}

.branches-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;

  h1 {
    margin: 0 0 3px;
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .header-sub {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }

  &--large {
    padding: 12px 20px;
    font-size: 14px;
    margin-top: 10px;
  }
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(15, 23, 42, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  
  .empty-icon {
    font-size: 48px;
    color: #94a3b8;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 700;
    color: #334155;
  }

  p {
    margin: 0 0 20px;
    color: #64748b;
    font-size: 14px;
    max-width: 400px;
  }
}

.branches-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.branch-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
}

.branch-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.branch-info {
  h4 {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
  }

  .branch-status {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.status-active {
      background: #d1fae5;
      color: #059669;
    }

    &.status-inactive {
      background: #f1f5f9;
      color: #64748b;
    }
  }
}

.branch-actions {
  display: flex;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  &--danger:hover {
    background: #fee2e2;
    color: #ef4444;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 15px) scale(0.95);
}

.success-toast, .error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  z-index: 9999;
}

.success-toast {
  background: #10b981;
  color: #fff;
}

.error-toast {
  background: #ef4444;
  color: #fff;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
