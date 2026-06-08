import { ref, computed } from 'vue'
import { branchService } from '@/services/branch.service'
import { billingService } from '@/services/billing.service'
import { useConfirm } from '@/composables/useConfirm'
import type { IBranch } from '@/types'

export function useBranches(workspaceId: string) {
  const { confirm } = useConfirm()

  // State
  const now = new Date()
  const currentYear = ref(now.getFullYear())
  const currentMonth = ref(now.getMonth() + 1)
  
  const branches = ref<IBranch[]>([])
  const branchTotals = ref<Record<string, number>>({})
  const onlineMonthTotal = ref(0)
  const loading = ref(false)
  const saving = ref(false)
  const toggling = ref<string | null>(null)
  const isModalOpen = ref(false)
  const editingBranch = ref<IBranch | null>(null)
  const toast = ref({ visible: false, type: 'success' as 'success' | 'error', message: '' })
  
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // Computed
  const isCurrentMonth = computed(() => {
    const n = new Date()
    return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
  })
  
  const monthLabel = computed(() => {
    const d = new Date(currentYear.value, currentMonth.value - 1, 1)
    return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  })

  const activeBranches = computed(() => branches.value.filter(b => b.isActive))
  const inactiveBranches = computed(() => branches.value.filter(b => !b.isActive))
  const billingRoute = computed(() => `/app/workspaces/${workspaceId}/billing`)

  const branchesWithBilling = computed(() => {
    return branches.value.map(b => ({
      ...b,
      currentMonthTotal: branchTotals.value[b._id] || 0,
    }))
  })

  // Actions
  function showToast(type: 'success' | 'error', message: string) {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { visible: true, type, message }
    toastTimer = setTimeout(() => (toast.value.visible = false), 3000)
  }

  const showSuccess = (msg: string) => showToast('success', msg)
  const showError = (msg: string) => showToast('error', msg)

  async function fetchMonthBilling() {
    try {
      const monthData = await billingService.getMonthData(workspaceId, currentYear.value, currentMonth.value).catch(() => null)
      const totals: Record<string, number> = {}
      let onlineTotal = 0
      
      if (monthData && monthData.days) {
        for (const day of monthData.days) {
          onlineTotal += (day.totalOnlineRevenue || 0)
          for (const entry of (day.entries || [])) {
            for (const b of (entry.branches || [])) {
              totals[b.branchId] = (totals[b.branchId] || 0) + b.amount
            }
          }
        }
      }
      branchTotals.value = totals
      onlineMonthTotal.value = onlineTotal
    } catch {
      branchTotals.value = {}
      onlineMonthTotal.value = 0
    }
  }

  async function fetchBranches() {
    loading.value = true
    try {
      const [data] = await Promise.all([
        branchService.getBranches(workspaceId),
        fetchMonthBilling()
      ])
      branches.value = data
    } catch (err: any) {
      showError(err.message || 'Error al cargar sucursales')
    } finally {
      loading.value = false
    }
  }

  function prevMonth() {
    if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
    else { currentMonth.value-- }
    loading.value = true
    fetchMonthBilling().finally(() => (loading.value = false))
  }
  
  function nextMonth() {
    if (isCurrentMonth.value) return
    if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
    else { currentMonth.value++ }
    loading.value = true
    fetchMonthBilling().finally(() => (loading.value = false))
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
        const updated = await branchService.updateBranch(workspaceId, editingBranch.value._id, { name })
        const index = branches.value.findIndex(b => b._id === updated._id)
        if (index !== -1) branches.value[index] = updated
        showSuccess('Sucursal actualizada')
      } else {
        const created = await branchService.createBranch(workspaceId, { name })
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
      const updated = await branchService.updateBranch(workspaceId, branch._id, {
        name: branch.name,
        isActive: !branch.isActive,
      })
      const index = branches.value.findIndex(b => b._id === updated._id)
      if (index !== -1) branches.value[index] = updated
      showSuccess(updated.isActive ? `${updated.name} activada` : `${updated.name} desactivada`)
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
      await branchService.deleteBranch(workspaceId, branch._id)
      branches.value = branches.value.filter(b => b._id !== branch._id)
      showSuccess('Sucursal eliminada')
    } catch (err: any) {
      showError(err.message || 'Error al eliminar la sucursal')
    }
  }

  return {
    // State
    branches,
    branchesWithBilling,
    loading,
    saving,
    toggling,
    isModalOpen,
    editingBranch,
    toast,
    
    // Computed
    activeBranches,
    inactiveBranches,
    billingRoute,
    isCurrentMonth,
    monthLabel,
    onlineMonthTotal,
    
    // Actions
    fetchBranches,
    fetchMonthBilling,
    openCreateModal,
    openEditModal,
    handleSaveBranch,
    toggleBranch,
    deleteBranch,
    prevMonth,
    nextMonth,
  }
}
