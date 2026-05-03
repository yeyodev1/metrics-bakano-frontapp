<template>
  <div class="branches-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h1 class="view-title">
          <i class="fa-solid fa-store" />
          Sucursales
        </h1>
        <p class="view-subtitle">Gestiona las sedes de este workspace</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <i class="fa-solid fa-plus" />
        Nueva sucursal
      </button>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <span class="stat-chip">
        <i class="fa-solid fa-store" />
        {{ branches.length }} sede{{ branches.length !== 1 ? 's' : '' }}
      </span>
      <span class="stat-chip stat-chip--green">
        <span class="dot dot--green" />
        {{ activeBranches.length }} activa{{ activeBranches.length !== 1 ? 's' : '' }}
      </span>
      <span v-if="inactiveBranches.length > 0" class="stat-chip stat-chip--gray">
        <span class="dot dot--gray" />
        {{ inactiveBranches.length }} inactiva{{ inactiveBranches.length !== 1 ? 's' : '' }}
      </span>
      <RouterLink :to="billingRoute" class="stat-chip stat-chip--link">
        <i class="fa-solid fa-chart-line" />
        Ver facturación →
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-loading">
      <i class="fa-solid fa-spinner fa-spin" />
      Cargando sucursales…
    </div>

    <!-- Empty state -->
    <div v-else-if="branches.length === 0" class="state-empty">
      <div class="empty-icon">
        <i class="fa-solid fa-store" />
      </div>
      <h3>Sin sucursales</h3>
      <p>Crea la primera sede para este workspace.</p>
      <button class="btn-primary" @click="openCreateModal">
        <i class="fa-solid fa-plus" />
        Nueva sucursal
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="branches-grid">
      <div
        v-for="(branch, idx) in branches"
        :key="branch._id"
        class="branch-card"
        :class="{ 'branch-card--inactive': !branch.isActive }"
      >
        <div class="branch-color-bar" :style="{ background: BRANCH_COLORS[idx % BRANCH_COLORS.length] }" />
        <div class="branch-card-body">
          <div class="branch-card-top">
            <div
              class="branch-avatar"
              :style="{
                background: BRANCH_COLORS[idx % BRANCH_COLORS.length] + '20',
                color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
              }"
            >
              {{ branch.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="branch-info">
              <h4>{{ branch.name }}</h4>
              <span class="branch-status" :class="branch.isActive ? 'status-active' : 'status-inactive'">
                <span class="dot" :class="branch.isActive ? 'dot--green' : 'dot--gray'" />
                {{ branch.isActive ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
          </div>

          <div class="branch-card-actions">
            <button
              class="btn-toggle"
              :class="branch.isActive ? 'btn-toggle--off' : 'btn-toggle--on'"
              :disabled="toggling === branch._id"
              @click="toggleBranch(branch)"
            >
              <i v-if="toggling === branch._id" class="fa-solid fa-spinner fa-spin" />
              <template v-else>
                <i :class="branch.isActive ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
                {{ branch.isActive ? 'Activa' : 'Inactiva' }}
              </template>
            </button>

            <div class="icon-actions">
              <button class="btn-icon" title="Editar" @click="openEditModal(branch)">
                <i class="fa-solid fa-pen" />
              </button>
              <button class="btn-icon btn-icon--danger" title="Eliminar" @click="deleteBranch(branch)">
                <i class="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <BranchFormModal
      v-model="isModalOpen"
      :loading="saving"
      :edit-mode="!!editingBranch"
      :existing-name="editingBranch?.name"
      @confirmed="handleSaveBranch"
    />

    <!-- Toast -->
    <Transition name="toast-fade">
      <div v-if="toast.visible" class="toast" :class="toast.type === 'success' ? 'success-toast' : 'error-toast'">
        <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'" />
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'
import { branchService } from '@/services/branch.service'
import BranchFormModal from '@/components/branches/BranchFormModal.vue'
import type { IBranch } from '@/types'

const route = useRoute()
const { confirm } = useConfirm()

const workspaceId = computed(() => route.params.workspaceId as string)
const billingRoute = computed(() => `/app/workspaces/${workspaceId.value}/billing`)

const BRANCH_COLORS = [
  '#3b82f6', '#059669', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
]

const branches = ref<IBranch[]>([])
const loading = ref(false)
const saving = ref(false)
const toggling = ref<string | null>(null)
const isModalOpen = ref(false)
const editingBranch = ref<IBranch | null>(null)

const activeBranches = computed(() => branches.value.filter(b => b.isActive))
const inactiveBranches = computed(() => branches.value.filter(b => !b.isActive))

const toast = ref({ visible: false, type: 'success', message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showSuccess(msg: string) {
  showToast('success', msg)
}
function showError(msg: string) {
  showToast('error', msg)
}
function showToast(type: 'success' | 'error', message: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { visible: true, type, message }
  toastTimer = setTimeout(() => (toast.value.visible = false), 3000)
}

async function fetchBranches() {
  loading.value = true
  try {
    const data = await branchService.getBranches(workspaceId.value)
    branches.value = data
  } catch (err: any) {
    showError(err.message || 'Error al cargar sucursales')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingBranch.value = null
  isModalOpen.value = true
}

function openEditModal(branch: IBranch) {
  editingBranch.value = branch
  isModalOpen.value = true
}

async function handleSaveBranch({ name }: { name: string }) {
  saving.value = true
  try {
    if (editingBranch.value) {
      await branchService.updateBranch(workspaceId.value, editingBranch.value._id, { name })
      editingBranch.value.name = name
      showSuccess('Sucursal actualizada')
    } else {
      const created = await branchService.createBranch(workspaceId.value, { name })
      branches.value.push(created)
      showSuccess('Sucursal creada')
    }
    isModalOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Error al guardar la sucursal')
  } finally {
    saving.value = false
  }
}

async function toggleBranch(branch: IBranch) {
  toggling.value = branch._id
  try {
    await branchService.updateBranch(workspaceId.value, branch._id, {
      name: branch.name,
      isActive: !branch.isActive,
    })
    branch.isActive = !branch.isActive
    showSuccess(branch.isActive ? `${branch.name} activada` : `${branch.name} desactivada`)
  } catch (err: any) {
    showError(err.message || 'Error al actualizar la sucursal')
  } finally {
    toggling.value = null
  }
}

async function deleteBranch(branch: IBranch) {
  const ok = await confirm({
    title: 'Eliminar sucursal',
    message: `¿Seguro que quieres eliminar "${branch.name}"? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  })
  if (!ok) return
  try {
    await branchService.deleteBranch(workspaceId.value, branch._id)
    branches.value = branches.value.filter(b => b._id !== branch._id)
    showSuccess('Sucursal eliminada')
  } catch (err: any) {
    showError(err.message || 'Error al eliminar la sucursal')
  }
}

onMounted(fetchBranches)
</script>

<style scoped lang="scss">
.branches-view {
  padding: 24px 16px;
  max-width: 1100px;
  margin: 0 auto;

  @media (min-width: 640px) {
    padding: 32px 24px;
  }
}

/* Header */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;

  i {
    color: #3b82f6;
  }
}

.view-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Stats bar */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;

  &--green {
    background: #f0fdf4;
    color: #059669;
    border-color: #d1fae5;
  }

  &--gray {
    background: #f8fafc;
    color: #94a3b8;
    border-color: #e2e8f0;
  }

  &--link {
    text-decoration: none;
    background: #eff6ff;
    color: #3b82f6;
    border-color: #bfdbfe;
    transition: background 0.15s;

    &:hover {
      background: #dbeafe;
    }
  }
}

/* States */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  color: #64748b;
  font-size: 15px;
}

.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  text-align: center;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #3b82f6;
}

/* Grid */
.branches-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Card */
.branch-card {
  display: flex;
  overflow: hidden;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  transition: box-shadow 0.2s, opacity 0.2s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  &--inactive {
    opacity: 0.65;
  }
}

.branch-color-bar {
  width: 5px;
  flex-shrink: 0;
}

.branch-card-body {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.branch-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.branch-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.branch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  h4 {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.branch-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;

  &.status-active { color: #059669; }
  &.status-inactive { color: #94a3b8; }
}

/* Dot */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--green { background: #059669; }
  &--gray { background: #94a3b8; }
}

/* Card actions */
.branch-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
  transition: background 0.15s;

  &--on {
    background: #f0fdf4;
    color: #059669;
    border-color: #d1fae5;

    &:hover:not(:disabled) {
      background: #dcfce7;
    }
  }

  &--off {
    background: #f8fafc;
    color: #94a3b8;
    border-color: #e2e8f0;

    &:hover:not(:disabled) {
      background: #f1f5f9;
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.icon-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  &--danger {
    &:hover {
      background: #fef2f2;
      color: #ef4444;
      border-color: #fecaca;
    }
  }
}

/* Primary button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 10px;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-width: 340px;
}

.success-toast {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #d1fae5;
}

.error-toast {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
