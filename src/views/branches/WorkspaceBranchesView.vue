<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBranches } from '@/composables/useBranches'

// Components
import BranchHeader from '@/components/branches/BranchHeader.vue'
import BranchStats from '@/components/branches/BranchStats.vue'
import BranchCard from '@/components/branches/BranchCard.vue'
import BranchEmptyState from '@/components/branches/BranchEmptyState.vue'
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

    <!-- Empty state -->
    <BranchEmptyState v-else-if="branches.length === 0" @create="openCreateModal" />

    <!-- Grid -->
    <TransitionGroup v-else name="grid" tag="div" class="branches-grid">
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
    </TransitionGroup>

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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
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
