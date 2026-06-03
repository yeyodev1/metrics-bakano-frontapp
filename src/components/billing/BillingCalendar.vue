<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  calendarEntryMap: {
    type: Object as () => Record<string, { hasMyEntry: boolean; total: number; entryCount: number }>,
    required: false,
    default: () => ({}),
  },
  todayStr: {
    type: String,
    required: true,
  }
})

const emit = defineEmits(['update:modelValue'])

const calendarOpen = ref(false)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth()) // 0-indexed

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

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

const isBackfill = computed(() => !!props.modelValue && props.modelValue < props.todayStr)

function calDayStr(day: number): string {
  return `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isCalToday(day: number): boolean { return calDayStr(day) === props.todayStr }
function isCalSelected(day: number): boolean { return calDayStr(day) === props.modelValue }
function isCalFuture(day: number): boolean { return calDayStr(day) > props.todayStr }

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
  if (d <= props.todayStr && !isCalMyEntry(day)) {
    emit('update:modelValue', d)
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
  emit('update:modelValue', props.todayStr)
  const now = new Date()
  calYear.value = now.getFullYear()
  calMonth.value = now.getMonth()
  calendarOpen.value = false
}

function formatDateStr(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil'
  })
}

const formattedLocalDate = computed(() => formatDateStr(props.modelValue))

defineExpose({
  syncToDate: (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    calYear.value = d.getFullYear()
    calMonth.value = d.getMonth()
  }
})
</script>

<template>
  <div class="field">
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
          <span class="cal-weekday" v-for="d in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="d + Math.random()">{{ d }}</span>

          <!-- Empty cells before day 1 -->
          <span v-for="n in calFirstWeekday" :key="'e' + n" class="cal-cell cal-cell--empty" />

          <!-- Days -->
          <button v-for="day in calDaysInMonth" :key="day" class="cal-cell cal-cell--day" :class="{
            'cal-cell--today': isCalToday(day),
            'cal-cell--selected': isCalSelected(day),
            'cal-cell--future': isCalFuture(day),
            'cal-cell--my-entry': isCalMyEntry(day),
            'cal-cell--has-data': isCalHasData(day),
          }" :disabled="isCalFuture(day) || isCalMyEntry(day)" :title="isCalMyEntry(day) ? `Ya registraste este día (${calDayTotal(day)})` : isCalHasData(day) ? `Otros registraron ${calDayTotal(day)}` : ''" @click.prevent="selectCalDay(day)">
            <span class="cal-day-num">{{ day }}</span>
            
            <div v-if="isCalMyEntry(day) || isCalHasData(day)" class="cal-day-indicator">
              <span class="cal-day-dot" :class="isCalMyEntry(day) ? 'cal-day-dot--mine' : 'cal-day-dot--other'" />
              <span v-if="calDayTotal(day)" class="cal-day-amount" :class="isCalMyEntry(day) ? 'cal-day-amount--mine' : 'cal-day-amount--other'">
                {{ calDayTotal(day) }}
              </span>
            </div>
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
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

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
    border: 1px solid transparent;
    background: #f8fafc;
    border-radius: 8px;
    padding: 6px 4px;
    font-size: 14px;
    font-weight: 700;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    position: relative;
    min-height: 48px;

    &:hover:not(:disabled) {
      background: #ede9fe;
      color: #7c3aed;
      border-color: #ddd6fe;
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

.cal-day-num { 
  line-height: 1; 
}

.cal-day-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 4px;
}

.cal-day-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;

  &--mine  { background: #16a34a; box-shadow: 0 0 4px rgba(22, 163, 74, 0.4); }
  &--other { background: #94a3b8; }
}

.cal-day-amount {
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.2px;

  &--mine  { color: #16a34a; }
  &--other { color: #64748b; }
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

.cal-drop-enter-active, .cal-drop-leave-active {
  transition: all 0.2s ease;
}
.cal-drop-enter-from, .cal-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
