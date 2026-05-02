<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
    <div class="modal-box">

      <!-- HEADER -->
      <div class="modal-header" :class="editMode ? 'modal-header--edit' : ''">
        <div class="modal-header-icon">
          <i :class="editMode ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-dollar-sign'" />
        </div>
        <div class="modal-header-text">
          <h2>{{ editMode ? 'Editar Facturación' : 'Registrar Facturación' }}</h2>
          <p class="modal-subtitle">{{ workspaceName }} · {{ formattedLocalDate }}</p>
        </div>
        <button class="modal-close" @click="handleClose" :disabled="loading">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>

      <!-- EDIT NOTICE -->
      <div v-if="editMode" class="edit-notice">
        <i class="fa-solid fa-circle-info" />
        <span>Editando registro existente. Monto actual: <strong>${{ formatAmount(existingAmount ?? 0) }}</strong></span>
      </div>

      <!-- BODY -->
      <div class="modal-body">

        <!-- Custom date picker (create mode only) -->
        <div v-if="!editMode" class="field">
          <div class="date-field-header">
            <label class="field-label">
              <i class="fa-solid fa-calendar-days" /> Fecha del registro
            </label>
            <span v-if="!isBackfill" class="today-default-hint">
              <i class="fa-solid fa-circle-check" /> Se registrará como hoy si no cambias la fecha
            </span>
            <span v-else class="backfill-tag">
              <i class="fa-solid fa-clock-rotate-left" /> Registro retroactivo
            </span>
          </div>

          <!-- Selected date display + toggle -->
          <button class="date-display-btn" :class="{ 'date-display-btn--past': isBackfill }" @click.prevent="calendarOpen = !calendarOpen">
            <i class="fa-solid fa-calendar-days" />
            <span class="date-display-btn__text">{{ formattedLocalDate }}</span>
            <span v-if="!isBackfill" class="date-display-btn__today-badge">HOY</span>
            <i class="fa-solid fa-chevron-down date-display-btn__caret" :class="{ 'rotated': calendarOpen }" />
          </button>

          <!-- Calendar dropdown -->
          <Transition name="cal-drop">
            <div v-if="calendarOpen" class="cal-dropdown">
              <!-- Month nav -->
              <div class="cal-nav">
                <button class="cal-nav-btn" @click.prevent="prevCalMonth"><i class="fa-solid fa-chevron-left" /></button>
                <span class="cal-nav-title">{{ calMonthLabel }}</span>
                <button class="cal-nav-btn" @click.prevent="nextCalMonth" :disabled="calAtCurrentMonth"><i class="fa-solid fa-chevron-right" /></button>
              </div>

              <!-- Day headers -->
              <div class="cal-grid">
                <span class="cal-weekday" v-for="d in ['L','M','M','J','V','S','D']" :key="d + Math.random()">{{ d }}</span>

                <!-- Empty cells before day 1 -->
                <span v-for="n in calFirstWeekday" :key="'e' + n" class="cal-cell cal-cell--empty" />

                <!-- Days -->
                <button
                  v-for="day in calDaysInMonth"
                  :key="day"
                  class="cal-cell cal-cell--day"
                  :class="{
                    'cal-cell--today': isCalToday(day),
                    'cal-cell--selected': isCalSelected(day),
                    'cal-cell--future': isCalFuture(day),
                    'cal-cell--my-entry': isCalMyEntry(day),
                    'cal-cell--has-data': isCalHasData(day),
                  }"
                  :disabled="isCalFuture(day) || isCalMyEntry(day)"
                  :title="isCalMyEntry(day) ? `Ya registraste este día (${calDayTotal(day)})` : isCalHasData(day) ? `Otros registraron ${calDayTotal(day)}` : ''"
                  @click.prevent="selectCalDay(day)"
                >
                  <span class="cal-day-num">{{ day }}</span>
                  <span v-if="isCalMyEntry(day)" class="cal-day-dot cal-day-dot--mine" />
                  <span v-else-if="isCalHasData(day)" class="cal-day-dot cal-day-dot--other" />
                  <span v-if="(isCalMyEntry(day) || isCalHasData(day)) && calDayTotal(day)" class="cal-day-amount">{{ calDayTotal(day) }}</span>
                </button>
              </div>

              <!-- Legend + Today shortcut -->
              <div class="cal-footer">
                <div class="cal-legend">
                  <span class="cal-legend-item">
                    <span class="cal-legend-dot cal-legend-dot--mine" /> Tu registro
                  </span>
                  <span class="cal-legend-item">
                    <span class="cal-legend-dot cal-legend-dot--other" /> Otros
                  </span>
                </div>
                <button class="cal-today-btn" @click.prevent="jumpToToday">
                  <i class="fa-solid fa-rotate-left" /> Hoy
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Legacy Amount input / Fallback when no branches -->
        <div v-if="!useBranchBreakdown" class="field">
          <label class="field-label">
            {{ editMode ? '¿Cuál es el monto correcto?' : amountLabel }}
          </label>
          <div class="amount-wrap" :class="{ focused: amountFocused, filled: localAmount > 0 }">
            <span class="currency-symbol">$</span>
            <input
              v-model.number="localAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="amount-input"
              @focus="amountFocused = true"
              @blur="amountFocused = false"
              @input="localAmount = Math.max(0, localAmount)"
              autofocus
            />
            <span class="currency-label">USD</span>
          </div>
        </div>

        <!-- Branch Breakdown -->
        <div v-else class="branch-inputs-container">
          <div class="field" v-for="branch in activeBranches" :key="branch._id">
            <label class="field-label">
              <i class="fa-solid fa-store" style="color:#3b82f6" />
              Sede {{ branch.name }}
            </label>
            <div class="amount-wrap" :class="{ filled: (branchAmounts[branch._id] ?? 0) > 0 }">
              <span class="currency-symbol">$</span>
              <input
                v-model.number="branchAmounts[branch._id]"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="amount-input"
              />
              <span class="currency-label">USD</span>
            </div>
          </div>
        </div>

        <!-- Day total preview -->
        <Transition name="slide-down">
          <div v-if="computedTotalAmount > 0" class="total-preview">
            <div class="total-preview__row">
              <span class="total-preview__label">
                <i class="fa-solid fa-chart-column" />
                Total del día {{ editMode ? '(actualizado)' : 'con tu ingreso' }}
              </span>
              <span class="total-preview__value">${{ formatAmount(projectedTotal) }}</span>
            </div>
          </div>
        </Transition>

        <!-- Zero day banner -->
        <Transition name="slide-down">
          <div v-if="computedTotalAmount === 0" class="zero-day-banner">
            <div class="zero-day-banner__icon">
              <i class="fa-solid fa-store-slash" />
            </div>
            <div class="zero-day-banner__text">
              <strong>Día sin ventas — $0.00</strong>
              <p>Indica el motivo para que el equipo lo tenga registrado.</p>
            </div>
          </div>
        </Transition>

        <!-- Zero reason (required when amount = 0) -->
        <div v-if="computedTotalAmount === 0" class="field">
          <label class="field-label">
            <i class="fa-solid fa-circle-exclamation" style="color:#dc2626" /> Razón del día sin ventas
            <span class="required-tag">Obligatorio</span>
          </label>
          <div class="zero-chips">
            <button
              v-for="r in ZERO_REASONS"
              :key="r"
              type="button"
              class="zero-chip"
              :class="{ 'zero-chip--active': zeroReason === r }"
              @click.prevent="zeroReason = (zeroReason === r ? '' : r)"
            >{{ r }}</button>
          </div>
          <input
            v-model="zeroReason"
            type="text"
            placeholder="O escribe tu propia razón…"
            class="zero-reason-input"
            maxlength="150"
          />
        </div>

        <!-- Online revenue (only for sales > 0) -->
        <div v-if="computedTotalAmount > 0" class="field">
          <label class="field-label">
            <i class="fa-solid fa-globe" style="color:#6366f1" />
            Ventas online <span class="optional">(opcional)</span>
          </label>
          <div class="online-revenue-hint">
            <i class="fa-solid fa-circle-info" />
            <span>Incluye ventas por <strong>página web</strong> o <strong>WhatsApp</strong>. Mejora el cálculo de conversión digital. Si no tienes este dato, déjalo en blanco.</span>
          </div>
          <div class="amount-wrap" :class="{ focused: false, filled: (localOnlineRevenue ?? 0) > 0 }">
            <span class="currency-symbol">$</span>
            <input
              v-model.number="localOnlineRevenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="amount-input"
              @input="localOnlineRevenue = localOnlineRevenue !== null ? Math.max(0, localOnlineRevenue) : null"
            />
          </div>
        </div>

        <!-- Notes (only for sales > 0) -->
        <div v-if="computedTotalAmount > 0" class="field">
          <label class="field-label">
            Notas <span class="optional">(opcional)</span>
          </label>
          <textarea
            v-model="localNotes"
            placeholder="Ej: Ventas de temporada alta, descuentos especiales…"
            rows="2"
            class="notes-input"
          />
        </div>

        <!-- Info notice -->
        <div class="info-notice" :class="editMode ? 'info-notice--blue' : 'info-notice--amber'">
          <i :class="editMode ? 'fa-solid fa-rotate' : 'fa-solid fa-calendar-check'" />
          <span v-if="editMode">Puedes editar este registro durante <strong>7 días</strong> desde la fecha de creación.</span>
          <span v-else>Podrás editar este registro durante los próximos <strong>7 días</strong>.</span>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleClose" :disabled="loading">
          Cancelar
        </button>
        <button
          class="btn-save"
          :class="editMode ? 'btn-save--edit' : ''"
          :disabled="!canSave || loading"
          @click="handleConfirm"
        >
          <div v-if="loading" class="spinner" />
          <template v-else>
            <i :class="editMode ? 'fa-solid fa-check' : 'fa-solid fa-floppy-disk'" />
            {{ editMode ? 'Actualizar' : 'Guardar' }}
          </template>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { branchService, type IBranch } from '@/services/branch.service'

const props = defineProps<{
  modelValue: boolean
  currentDayTotal: number
  workspaceName: string
  date: string
  loading?: boolean
  editMode?: boolean
  existingAmount?: number
  existingNotes?: string
  existingOnlineRevenue?: number
  existingBranches?: { branchId: string; amount: number }[]
  entryId?: string
  calendarEntryMap?: Record<string, { hasMyEntry: boolean; total: number; entryCount: number }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirmed', payload: { amount: number; notes?: string; onlineRevenue?: number; entryId?: string; date?: string; branches?: { branchId: string; amount: number }[] }): void
}>()

const route = useRoute()
const workspaceId = computed(() => route.params.workspaceId as string)

const branches = ref<IBranch[]>([])
const activeBranches = computed(() => branches.value.filter(b => b.isActive))
const hasBranches = computed(() => activeBranches.value.length > 0)
const branchAmounts = ref<Record<string, number | null>>({})

const ZERO_REASONS = ['No abrimos', 'No hubo venta', 'Día festivo / feriado', 'Problemas técnicos']

const localAmount = ref<number>(0)
const localOnlineRevenue = ref<number | null>(null)
const localNotes = ref('')
const localDate = ref('')
const zeroReason = ref('')
const amountFocused = ref(false)
const calendarOpen = ref(false)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth()) // 0-indexed

// Today in YYYY-MM-DD (Ecuador timezone)
const todayStr = computed(() => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
})

const isBackfill = computed(() => !!localDate.value && localDate.value < todayStr.value)

const useBranchBreakdown = computed(() => {
  if (!hasBranches.value) return false
  // Backward compatibility: If editing an old entry with a total amount but no branches recorded
  if (props.editMode && (props.existingAmount || 0) > 0 && (!props.existingBranches || props.existingBranches.length === 0)) {
    return false
  }
  return true
})

const computedTotalAmount = computed(() => {
  if (useBranchBreakdown.value) {
    let sum = 0
    for (const key in branchAmounts.value) {
      if (branchAmounts.value[key]) sum += branchAmounts.value[key]!
    }
    if (localOnlineRevenue.value) sum += localOnlineRevenue.value
    return sum
  }
  return localAmount.value
})

const canSave = computed(() => {
  if (!localDate.value) return false
  if (computedTotalAmount.value > 0) return true
  return computedTotalAmount.value === 0 && zeroReason.value.trim().length > 0
})

// ── Calendar helpers ──────────────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const calMonthLabel = computed(() => `${MONTH_NAMES[calMonth.value]} ${calYear.value}`)

const calDaysInMonth = computed(() => new Date(calYear.value, calMonth.value + 1, 0).getDate())

// Monday-based: Mon=0 … Sun=6
const calFirstWeekday = computed(() => {
  const d = new Date(calYear.value, calMonth.value, 1).getDay()
  return d === 0 ? 6 : d - 1
})

const calAtCurrentMonth = computed(() => {
  const now = new Date()
  return calYear.value === now.getFullYear() && calMonth.value === now.getMonth()
})

function calDayStr(day: number): string {
  return `${calYear.value}-${String(calMonth.value + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function isCalToday(day: number): boolean { return calDayStr(day) === todayStr.value }
function isCalSelected(day: number): boolean { return calDayStr(day) === localDate.value }
function isCalFuture(day: number): boolean { return calDayStr(day) > todayStr.value }

function calDayEntry(day: number) {
  return props.calendarEntryMap?.[calDayStr(day)]
}

function isCalMyEntry(day: number): boolean {
  return calDayEntry(day)?.hasMyEntry ?? false
}

function isCalHasData(day: number): boolean {
  const e = calDayEntry(day)
  return !!e && e.entryCount > 0 && !e.hasMyEntry
}

function calDayTotal(day: number): string {
  const e = calDayEntry(day)
  if (!e || e.total === 0) return ''
  if (e.total >= 1000) return `$${(e.total / 1000).toFixed(0)}k`
  return `$${e.total.toFixed(0)}`
}

function selectCalDay(day: number) {
  const d = calDayStr(day)
  if (d <= todayStr.value && !isCalMyEntry(day)) {
    localDate.value = d
    calendarOpen.value = false
  }
}

function prevCalMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}

function nextCalMonth() {
  if (calAtCurrentMonth.value) return
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

function jumpToToday() {
  localDate.value = todayStr.value
  const now = new Date()
  calYear.value = now.getFullYear()
  calMonth.value = now.getMonth()
  calendarOpen.value = false
}

const projectedTotal = computed(() => {
  // Only meaningful if date matches original prop (same day total)
  if (localDate.value !== props.date) return computedTotalAmount.value
  return props.currentDayTotal + computedTotalAmount.value
})

function formatDateStr(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil'
  })
}

const formattedLocalDate = computed(() => formatDateStr(localDate.value || props.date))

const amountLabel = computed(() => {
  if (!localDate.value || localDate.value === todayStr.value) return '¿Cuánto facturaste hoy?'
  const d = new Date(localDate.value + 'T12:00:00')
  const dayName = d.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Guayaquil' })
  return `¿Cuánto facturaste el ${dayName}?`
})

function formatAmount(val: number) {
  return val.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleClose() {
  if (props.loading) return
  emit('update:modelValue', false)
}

function handleConfirm() {
  if (!canSave.value || props.loading) return
  const notes = computedTotalAmount.value === 0
    ? zeroReason.value.trim()
    : (localNotes.value.trim() || undefined)

  let branchesPayload: { branchId: string; amount: number }[] | undefined = undefined
  if (useBranchBreakdown.value && computedTotalAmount.value > 0) {
    branchesPayload = Object.entries(branchAmounts.value)
      .filter(([_, amount]) => amount != null && amount > 0)
      .map(([branchId, amount]) => ({ branchId, amount: amount as number }))
  }

  emit('confirmed', {
    amount: computedTotalAmount.value,
    notes,
    onlineRevenue: localOnlineRevenue.value != null && localOnlineRevenue.value > 0 ? localOnlineRevenue.value : undefined,
    entryId: props.entryId,
    date: localDate.value,
    branches: branchesPayload,
  })
}

async function loadBranches() {
  if (!workspaceId.value) return
  try {
    const res = await branchService.getBranches(workspaceId.value)
    branches.value = res.branches || []
  } catch (err) {
    console.error('Error fetching branches:', err)
  }
}

onMounted(() => {
  loadBranches()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    localAmount.value = (props.editMode && props.existingAmount != null) ? props.existingAmount : 0
    localOnlineRevenue.value = (props.editMode && props.existingOnlineRevenue != null) ? props.existingOnlineRevenue : null
    localNotes.value = (props.editMode && props.existingNotes && (props.existingAmount ?? 0) > 0) ? props.existingNotes : ''
    zeroReason.value = (props.editMode && props.existingAmount === 0 && props.existingNotes) ? props.existingNotes : ''
    localDate.value = props.date || todayStr.value
    
    // Initialize branch amounts if we are editing an entry with branches
    branchAmounts.value = {}
    if (props.editMode && props.existingBranches && props.existingBranches.length > 0) {
      props.existingBranches.forEach(b => {
        branchAmounts.value[b.branchId] = b.amount
      })
    }

    calendarOpen.value = false
    // Sync calendar view to initial date
    const d = new Date((localDate.value || todayStr.value) + 'T12:00:00')
    calYear.value = d.getFullYear()
    calMonth.value = d.getMonth()
    amountFocused.value = false
  }
})
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 23, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(3px);
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

// ── Header ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  padding: 22px 24px;

  &--edit {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
  }
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
}

.modal-header-text {
  flex: 1;

  h2 {
    margin: 0 0 2px;
    color: #fff;
    font-size: 17px;
    font-weight: 800;
  }
}

.modal-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 500;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// ── Edit notice ──────────────────────────────────────────
.edit-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border-bottom: 1px solid #bfdbfe;
  padding: 10px 24px;
  font-size: 13px;
  color: #1e40af;

  i { flex-shrink: 0; color: #3b82f6; }
  strong { color: #1e3a5f; }
}

// ── Body ────────────────────────────────────────────────
.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.online-revenue-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4338ca;
  line-height: 1.5;

  i { margin-top: 2px; flex-shrink: 0; }
  strong { font-weight: 700; }
}

// ── Custom date picker ────────────────────────────────────
.date-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.today-default-hint {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 4px;
  i { font-size: 10px; }
}

.backfill-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 3px 10px;
  border-radius: 20px;
  i { font-size: 10px; }
}

.date-display-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  padding: 11px 14px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  font-family: inherit;

  &:hover { border-color: #7c3aed; background: #fff; }

  > i:first-child { color: #7c3aed; font-size: 14px; flex-shrink: 0; }

  &__text {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    text-transform: capitalize;
  }

  &__today-badge {
    font-size: 9px;
    font-weight: 800;
    color: #059669;
    background: #d1fae5;
    border: 1px solid #6ee7b7;
    padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.5px;
  }

  &__caret {
    color: #9ca3af;
    font-size: 11px;
    transition: transform 0.2s;
    flex-shrink: 0;

    &.rotated { transform: rotate(180deg); }
  }

  &--past {
    border-color: #fde68a;
    background: #fffdf5;
    &:hover { border-color: #f59e0b; }
  }
}

// ── Calendar dropdown ─────────────────────────────────────
.cal-dropdown {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 14px;
  margin-top: 6px;
  user-select: none;
}

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  &-title {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    text-transform: capitalize;
  }

  &-btn {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1.5px solid #e5e7eb;
    background: #f8fafc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 11px;
    transition: all 0.15s;

    &:hover:not(:disabled) { border-color: #0f1117; color: #0f1117; }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.cal-cell {
  text-align: center;

  &--empty { pointer-events: none; }

  &--day {
    border: none;
    background: none;
    border-radius: 7px;
    padding: 3px 2px 5px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    position: relative;

    &:hover:not(:disabled) {
      background: #ede9fe;
      color: #7c3aed;
    }
  }

  &--today {
    background: #0f1117 !important;
    color: #fff !important;
    font-weight: 800;

    .cal-day-dot { background: rgba(255,255,255,0.5) !important; }
    .cal-day-amount { color: rgba(255,255,255,0.8) !important; }
  }

  &--selected {
    background: #7c3aed !important;
    color: #fff !important;
    font-weight: 800;

    .cal-day-dot { background: rgba(255,255,255,0.6) !important; }
    .cal-day-amount { color: rgba(255,255,255,0.85) !important; }
  }

  &--my-entry {
    background: #f0fdf4 !important;
    color: #166534 !important;
    cursor: not-allowed !important;
    font-weight: 700;

    &:hover { background: #f0fdf4 !important; }
  }

  &--has-data {
    background: #fafafa;
  }

  &--future {
    color: #d1d5db !important;
    cursor: not-allowed !important;
    &:hover { background: none !important; }
  }
}

.cal-day-num { line-height: 1; }

.cal-day-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  flex-shrink: 0;

  &--mine  { background: #16a34a; }
  &--other { background: #94a3b8; }
}

.cal-day-amount {
  font-size: 8px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
  letter-spacing: -0.2px;
}

.cal-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cal-legend {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cal-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
}

.cal-legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &--mine  { background: #16a34a; }
  &--other { background: #94a3b8; }
}

.cal-today-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  i { font-size: 11px; }
  &:hover { border-color: #0f1117; color: #0f1117; }
}

// ── Calendar transition ───────────────────────────────────
.cal-drop-enter-active, .cal-drop-leave-active {
  transition: all 0.2s ease;
}
.cal-drop-enter-from, .cal-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// ── Amount input ─────────────────────────────────────────
.amount-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  transition: border-color 0.15s, box-shadow 0.15s;
  overflow: hidden;

  &.focused {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    background: #fff;
  }

  &.filled { border-color: #059669; }
}

.currency-symbol {
  padding: 0 12px 0 16px;
  font-size: 20px;
  font-weight: 800;
  color: #374151;
}

.amount-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  outline: none;
  padding: 14px 0;
  min-width: 0;

  &::placeholder { color: #d1d5db; font-weight: 400; }

  /* Remove spinner arrows */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
  -moz-appearance: textfield;
}

.currency-label {
  padding: 0 16px 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #9ca3af;
}

// ── Day total preview ────────────────────────────────────
.total-preview {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%);
  border: 1.5px solid rgba(5, 150, 105, 0.2);
  border-radius: 10px;
  padding: 12px 16px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #064e3b;
    font-weight: 600;

    i { color: #059669; font-size: 12px; }
  }

  &__value {
    font-size: 18px;
    font-weight: 800;
    color: #059669;
  }
}

// ── Notes ────────────────────────────────────────────────
.notes-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  resize: none;
  outline: none;
  background: #f9fafb;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus { border-color: #7c3aed; background: #fff; }
  &::placeholder { color: #9ca3af; }
}

// ── Info notice ──────────────────────────────────────────
.info-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;

  i { flex-shrink: 0; margin-top: 1px; }
  strong { font-weight: 700; }

  &--amber {
    background: #fffbeb;
    border: 1.5px solid #fde68a;
    color: #92400e;
    i { color: #d97706; }
  }

  &--blue {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    color: #1e40af;
    i { color: #3b82f6; }
  }
}

// ── Footer ───────────────────────────────────────────────
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 0 24px 24px;
}

.btn-cancel {
  flex: 1;
  border: 2px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #9ca3af; color: #374151; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-save {
  flex: 2;
  background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s, transform 0.1s;

  &:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  &:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  &--edit {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── Transitions ──────────────────────────────────────────
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// ── Zero day ─────────────────────────────────────────────
.zero-day-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  padding: 12px 14px;

  &__icon {
    width: 36px;
    height: 36px;
    background: #ffedd5;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ea580c;
    font-size: 16px;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;

    strong {
      display: block;
      font-size: 13px;
      font-weight: 800;
      color: #9a3412;
    }

    p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #c2410c;
      line-height: 1.4;
    }
  }
}

.required-tag {
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 20px;
  padding: 2px 7px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.3px;
}

.zero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.zero-chip {
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &:hover {
    border-color: #ea580c;
    color: #ea580c;
    background: #fff7ed;
  }

  &--active {
    background: #ea580c;
    border-color: #ea580c;
    color: #fff;

    &:hover {
      background: #c2410c;
      border-color: #c2410c;
      color: #fff;
    }
  }
}

.zero-reason-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  outline: none;
  background: #f9fafb;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus { border-color: #ea580c; background: #fff; }
  &::placeholder { color: #9ca3af; }
}

// ── Branch Breakdown ─────────────────────────────────────
.branch-inputs-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 4px;
}
</style>

