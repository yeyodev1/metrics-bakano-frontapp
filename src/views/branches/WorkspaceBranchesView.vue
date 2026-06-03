<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBranches } from '@/composables/useBranches'

// Components
import BranchHeader from '@/components/branches/BranchHeader.vue'
import BranchStats from '@/components/branches/BranchStats.vue'
import BranchCard from '@/components/branches/BranchCard.vue'
import BranchFormModal from '@/components/branches/BranchFormModal.vue'

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)

const {
  branches,
  branchesWithBilling,
  loading,
  saving,
  toggling,
  isModalOpen,
  editingBranch,
  toast,
  activeBranches,
  inactiveBranches,
  billingRoute,
  isCurrentMonth,
  monthLabel,
  onlineMonthTotal,
  fetchBranches,
  openCreateModal,
  openEditModal,
  handleSaveBranch,
  toggleBranch,
  deleteBranch,
  prevMonth,
  nextMonth,
} = useBranches(workspaceId.value)

const BRANCH_COLORS = ['#3b82f6', '#059669', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']

onMounted(fetchBranches)
</script>

<template>
  <div class="branches-view">
    <BranchHeader 
      :month-label="monthLabel"
      :is-current-month="isCurrentMonth"
      :loading="loading"
      @create="openCreateModal" 
      @prev-month="prevMonth"
      @next-month="nextMonth"
    />

    <BranchStats
      :total="branches.length"
      :active="activeBranches.length"
      :inactive="inactiveBranches.length"
      :billing-route="billingRoute"
    />

    <!-- Loading state -->
    <div v-if="loading" class="state-loading">
      <div class="state-loading__spinner" />
      <span>Cargando sucursales…</span>
    </div>

    <template v-else>
      <!-- Grid (Always shows to display at least the Virtual Online Branch) -->
      <TransitionGroup name="grid" tag="div" class="branches-grid">
        <!-- Virtual Online Branch -->
        <BranchCard
          key="virtual-online"
          :branch="{ _id: 'online', name: 'Ventas Online', isActive: true } as any"
          color="#8b5cf6"
          :current-month-total="onlineMonthTotal"
          :month-label="monthLabel"
          is-virtual
          icon="fa-solid fa-globe"
        />

        <!-- Physical Branches -->
        <BranchCard
          v-for="(branch, idx) in branchesWithBilling"
          :key="branch._id"
          :branch="branch"
          :color="BRANCH_COLORS[idx % BRANCH_COLORS.length]"
          :is-toggling="toggling === branch._id"
          :current-month-total="branch.currentMonthTotal"
          :month-label="monthLabel"
          @toggle="toggleBranch"
          @edit="openEditModal"
          @delete="deleteBranch"
        />
        <!-- Add New Branch Card -->
        <div key="add-branch" class="add-branch-card" @click="openCreateModal">
          <div class="add-branch-card__icon">
            <i class="fa-solid fa-plus" />
          </div>
          <div class="add-branch-card__text">
            <h3>Añadir sucursal física</h3>
            <p>Crea una nueva sede para organizar tu facturación por ubicación.</p>
          </div>
        </div>
      </TransitionGroup>
    </template>

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
      <div v-if="toast.visible" class="toast" :class="toast.type === 'success' ? 'toast--success' : 'toast--error'">
        <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'" />
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.branches-view {
  padding: 28px 32px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    padding: 20px 16px;
  }
}

/* Loading */
.state-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;

  &__spinner {
    width: 22px;
    height: 22px;
    border: 2.5px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

/* Grid */
.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Add Branch Card */
.add-branch-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  background: rgba(248, 250, 252, 0.4);
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 30px 24px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 220px;

  &:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.08);
    transform: translateY(-2px);
    
    .add-branch-card__icon {
      background: #3b82f6;
      color: #fff;
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    h3 { color: #2563eb; }
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      transition: color 0.2s;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.4;
      max-width: 200px;
    }
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
  max-width: 360px;

  &--success {
    background: #f0fdf4;
    color: #059669;
    border: 1.5px solid #a7f3d0;
  }

  &--error {
    background: #fef2f2;
    color: #dc2626;
    border: 1.5px solid #fecaca;
  }
}

/* Grid Transitions */
.grid-enter-active,
.grid-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.grid-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Toast Transition */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
