<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { branchService, type IBranch } from '@/services/branch.service'
import BillingCalendar from './BillingCalendar.vue'
import BillingBranchBreakdown from './BillingBranchBreakdown.vue'
import BillingZeroDaySection from './BillingZeroDaySection.vue'
import BillingTotalPreview from './BillingTotalPreview.vue'
import BillingOnlineRevenue from './BillingOnlineRevenue.vue'
import BillingNotes from './BillingNotes.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  currentDayTotal: { type: Number, required: true },
  workspaceName: { type: String, required: true },
  date: { type: String, required: true },
  loading: { type: Boolean, default: false },
  editMode: { type: Boolean, default: false },
  existingAmount: { type: Number, required: false },
  existingNotes: { type: String, required: false },
  existingOnlineRevenue: { type: Number, required: false },
  existingBranches: { type: Array as () => { branchId: string; amount: number }[], required: false },
  entryId: { type: String, required: false },
  calendarEntryMap: { type: Object as () => Record<string, { hasMyEntry: boolean; total: number; entryCount: number }>, required: false, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'confirmed'])

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)

const billingCalendarRef = ref<any>(null)
const branches = ref<IBranch[]>([])
const activeBranches = computed(() => branches.value.filter(b => b.isActive))
const branchAmounts = ref<Record<string, number | null>>({})

const localAmount = ref<number>(0)
const localOnlineRevenue = ref<number | null>(null)
const localNotes = ref('')
const localDate = ref('')
const zeroReason = ref('')
const amountFocused = ref(false)

const todayStr = computed(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }))

const useBranchBreakdown = computed(() => {
  if (activeBranches.value.length === 0) return false
  if (props.editMode && (props.existingAmount || 0) > 0 && (!props.existingBranches || props.existingBranches.length === 0)) return false
  return true
})

const computedTotalAmount = computed(() => {
  if (useBranchBreakdown.value) {
    let sum = 0
    for (const key in branchAmounts.value) { if (branchAmounts.value[key]) sum += branchAmounts.value[key]! }
    if (localOnlineRevenue.value) sum += localOnlineRevenue.value
    return sum
  }
  return localAmount.value
})

const canSave = computed(() => {
  if (!localDate.value) return false
  return computedTotalAmount.value > 0 || (computedTotalAmount.value === 0 && zeroReason.value.trim().length > 0)
})

const projectedTotal = computed(() => localDate.value !== props.date ? computedTotalAmount.value : props.currentDayTotal + computedTotalAmount.value)

function handleClose() { if (!props.loading) emit('update:modelValue', false) }

function handleConfirm() {
  if (!canSave.value || props.loading) return
  const notes = computedTotalAmount.value === 0 ? zeroReason.value.trim() : (localNotes.value.trim() || undefined)
  let branchesPayload: { branchId: string; amount: number }[] | undefined = undefined
  if (useBranchBreakdown.value && computedTotalAmount.value > 0) {
    branchesPayload = Object.entries(branchAmounts.value).filter(([_, a]) => a != null && a > 0).map(([branchId, amount]) => ({ branchId, amount: amount as number }))
  }
  emit('confirmed', { amount: computedTotalAmount.value, notes, onlineRevenue: localOnlineRevenue.value ?? undefined, entryId: props.entryId, date: localDate.value, branches: branchesPayload })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    localAmount.value = props.editMode ? (props.existingAmount ?? 0) : 0
    localOnlineRevenue.value = props.editMode ? (props.existingOnlineRevenue ?? null) : null
    localNotes.value = (props.editMode && props.existingNotes && (props.existingAmount ?? 0) > 0) ? props.existingNotes : ''
    zeroReason.value = (props.editMode && props.existingAmount === 0 && props.existingNotes) ? props.existingNotes : ''
    localDate.value = props.date || todayStr.value
    branchAmounts.value = {}
    if (props.editMode && props.existingBranches) props.existingBranches.forEach(b => { branchAmounts.value[b.branchId] = b.amount })
    if (billingCalendarRef.value) billingCalendarRef.value.syncToDate(localDate.value)
  }
})

onMounted(async () => { if (workspaceId.value) branches.value = (await branchService.getBranches(workspaceId.value)).branches || [] })

const formattedLocalDate = computed(() => localDate.value ? new Date(localDate.value + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' }) : '')
const amountLabel = computed(() => (!localDate.value || localDate.value === todayStr.value) ? '¿Cuánto facturaste hoy?' : `¿Cuánto facturaste el ${new Date(localDate.value + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Guayaquil' })}?`)
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
    <div class="modal-box">
      <div class="modal-header" :class="{ 'modal-header--edit': editMode }">
        <div class="modal-header-icon"><i :class="editMode ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-dollar-sign'" /></div>
        <div class="modal-header-text">
          <h2>{{ editMode ? 'Editar Facturación' : 'Registrar Facturación' }}</h2>
          <p class="modal-subtitle">{{ workspaceName }} · {{ formattedLocalDate }}</p>
        </div>
        <button class="modal-close" @click="handleClose" :disabled="loading"><i class="fa-solid fa-xmark" /></button>
      </div>

      <div v-if="editMode" class="edit-notice">
        <i class="fa-solid fa-circle-info" />
        <span>Editando registro existente. Monto actual: <strong>${{ existingAmount?.toLocaleString('es-EC', { minimumFractionDigits: 2 }) }}</strong></span>
      </div>

      <div class="modal-body">
        <BillingCalendar v-if="!editMode" ref="billingCalendarRef" v-model="localDate" :calendar-entry-map="calendarEntryMap" :today-str="todayStr" />

        <div v-if="!useBranchBreakdown" class="field">
          <label class="field-label">{{ editMode ? '¿Cuál es el monto correcto?' : amountLabel }}</label>
          <div class="amount-wrap" :class="{ focused: amountFocused, filled: localAmount > 0 }">
            <span class="currency-symbol">$</span>
            <input v-model.number="localAmount" type="number" min="0" step="0.01" placeholder="0.00" class="amount-input" @focus="amountFocused = true" @blur="amountFocused = false" @input="localAmount = Math.max(0, localAmount)" autofocus />
            <span class="currency-label">USD</span>
          </div>
        </div>

        <BillingBranchBreakdown v-else v-model="branchAmounts" :active-branches="activeBranches" />
        <BillingTotalPreview :amount="projectedTotal" :edit-mode="editMode" v-if="computedTotalAmount > 0" />
        <BillingZeroDaySection v-if="computedTotalAmount === 0" v-model="zeroReason" />

        <template v-if="computedTotalAmount > 0">
          <BillingOnlineRevenue v-model="localOnlineRevenue" />
          <BillingNotes v-model="localNotes" />
        </template>

        <div class="info-notice" :class="editMode ? 'info-notice--blue' : 'info-notice--amber'">
          <i :class="editMode ? 'fa-solid fa-rotate' : 'fa-solid fa-calendar-check'" />
          <span>{{ editMode ? 'Puedes editar este registro durante 7 días desde la fecha de creación.' : 'Podrás editar este registro durante los próximos 7 días.' }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose" :disabled="loading">Cancelar</button>
        <button class="btn-save" :class="{ 'btn-save--edit': editMode }" :disabled="!canSave || loading" @click="handleConfirm">
          <div v-if="loading" class="spinner" />
          <template v-else><i :class="editMode ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'" />{{ editMode ? 'Actualizar' : 'Guardar' }}</template>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 17, 23, 0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; backdrop-filter: blur(3px); }
.modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 440px; max-height: 90vh; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18); overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%); padding: 22px 24px; flex-shrink: 0; &--edit { background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); } }
.modal-header-icon { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.12); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; flex-shrink: 0; }
.modal-header-text { flex: 1; h2 { margin: 0 0 2px; color: #fff; font-size: 17px; font-weight: 800; } }
.modal-subtitle { margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 12px; font-weight: 500; }
.modal-close { background: rgba(255, 255, 255, 0.1); border: none; color: rgba(255, 255, 255, 0.7); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s; &:hover { background: rgba(255, 255, 255, 0.2); color: #fff; } &:disabled { opacity: 0.4; cursor: not-allowed; } }
.edit-notice { display: flex; align-items: center; gap: 8px; background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 10px 24px; font-size: 13px; color: #1e40af; flex-shrink: 0; i { flex-shrink: 0; color: #3b82f6; } strong { color: #1e3a5f; } }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; }
.modal-footer { display: flex; gap: 10px; padding: 16px 24px 24px; flex-shrink: 0; border-top: 1px solid #f3f4f6; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 700; color: #374151; }
.amount-wrap { display: flex; align-items: center; gap: 0; border: 2px solid #e5e7eb; border-radius: 12px; background: #f9fafb; transition: border-color 0.15s, box-shadow 0.15s; overflow: hidden; &.focused { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); background: #fff; } &.filled { border-color: #059669; } }
.currency-symbol { padding: 0 12px 0 16px; font-size: 20px; font-weight: 800; color: #374151; }
.amount-input { flex: 1; border: none; background: transparent; font-size: 22px; font-weight: 800; color: #0f172a; outline: none; padding: 14px 0; min-width: 0; &::placeholder { color: #d1d5db; font-weight: 400; } &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; } -moz-appearance: textfield; }
.currency-label { padding: 0 16px 0 8px; font-size: 13px; font-weight: 700; color: #9ca3af; }
.info-notice { display: flex; align-items: flex-start; gap: 8px; border-radius: 10px; padding: 10px 14px; font-size: 13px; line-height: 1.5; i { flex-shrink: 0; margin-top: 1px; } strong { font-weight: 700; } &--amber { background: #fffbeb; border: 1.5px solid #fde68a; color: #92400e; i { color: #d97706; } } &--blue { background: #eff6ff; border: 1.5px solid #bfdbfe; color: #1e40af; i { color: #3b82f6; } } }
.btn-cancel { flex: 1; border: 2px solid #e5e7eb; background: transparent; color: #6b7280; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; &:hover { border-color: #9ca3af; color: #374151; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-save { flex: 2; background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%); color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s, transform 0.1s; &:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); } &:disabled { opacity: 0.35; cursor: not-allowed; transform: none; } &--edit { background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%); } }
.spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
