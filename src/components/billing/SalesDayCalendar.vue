<template>
  <div class="sdc">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="sdc__header">
      <span class="sdc__month-label">{{ monthLabel }}</span>
      <button class="sdc__today-btn" @click="selectToday">
        <i class="fa-solid fa-rotate-left" /> Hoy
      </button>
    </div>

    <!-- ── Weekday labels ─────────────────────────────────────────────────── -->
    <div class="sdc__weekdays">
      <span v-for="d in ['L','M','M','J','V','S','D']" :key="d">{{ d }}</span>
    </div>

    <!-- ── Days grid ──────────────────────────────────────────────────────── -->
    <div class="sdc__grid">
      <!-- Empty offset cells -->
      <div v-for="n in firstDayOffset" :key="`e${n}`" class="sdc__cell sdc__cell--empty" />

      <!-- Day cells -->
      <div
        v-for="cell in dayCells"
        :key="cell.date"
        class="sdc__cell"
        :class="{
          'sdc__cell--today':    cell.isToday,
          'sdc__cell--selected': cell.date === modelValue,
          'sdc__cell--has-data': cell.data,
          'sdc__cell--no-data':  !cell.data && !cell.isFuture,
          'sdc__cell--future':   cell.isFuture,
        }"
        @click="!cell.isFuture && emit('update:modelValue', cell.date)"
      >
        <span class="sdc__num">{{ cell.num }}</span>
        <span v-if="cell.data && cell.data.totalSessions > 0" class="sdc__dot sdc__dot--sales" :title="`${cell.data.totalOrders} pedidos · $${formatK(cell.data.totalRevenue)}`" />
        <span v-else-if="cell.data && cell.data.totalSessions === 0" class="sdc__dot sdc__dot--zero" />
        <span v-else-if="!cell.isFuture" class="sdc__empty-dot" />
      </div>
    </div>

    <!-- ── Legend ─────────────────────────────────────────────────────────── -->
    <div class="sdc__legend">
      <span class="sdc__legend-item sdc__legend-item--data">
        <span class="sdc__legend-dot" /> Con ventas
      </span>
      <span class="sdc__legend-item">
        <span class="sdc__legend-dot sdc__legend-dot--empty" /> Sin datos
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ISalesDaySummary } from '../../services/salesSummary.service'

const props = defineProps<{
  modelValue: string          // YYYY-MM-DD selected date
  year: number
  month: number
  days: ISalesDaySummary[]    // already-synced days from monthData
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const todayStr = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const monthLabel = computed(() => {
  const d = new Date(props.year, props.month - 1, 1)
  return d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
})

// Day of week for the 1st (0=Sun → shift to Mon=0)
const firstDayOffset = computed(() => {
  const dow = new Date(props.year, props.month - 1, 1).getDay()
  return dow === 0 ? 6 : dow - 1
})

const daysInMonthCount = computed(() =>
  new Date(props.year, props.month, 0).getDate()
)

// Build a lookup map from date string → day summary
const dataMap = computed(() => {
  const map = new Map<string, ISalesDaySummary>()
  for (const d of props.days) map.set(d.date, d)
  return map
})

interface DayCell {
  date: string
  num: number
  isToday: boolean
  isFuture: boolean
  data: ISalesDaySummary | undefined
}

const dayCells = computed((): DayCell[] => {
  const cells: DayCell[] = []
  for (let d = 1; d <= daysInMonthCount.value; d++) {
    const date = `${props.year}-${String(props.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      date,
      num: d,
      isToday: date === todayStr.value,
      isFuture: date > todayStr.value,
      data: dataMap.value.get(date),
    })
  }
  return cells
})

function selectToday() {
  emit('update:modelValue', todayStr.value)
}

function formatK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k'
  return n.toFixed(0)
}
</script>

<style lang="scss" scoped>
$purple:      $secondary;      // #85529c — brand secondary
$purple-dark: #5a2d6e;
$green:       $BAKANO-GREEN;   // #3bb77e — brand green
$muted:       #6b7280;
$border:      #e5e7eb;
$text:        $primary-dark;   // #191423 — brand dark
$radius:      0.75rem;

.sdc {
  background: #fff;
  border: 1.5px solid $border;
  border-radius: $radius;
  padding: 0.75rem 0.875rem;
  user-select: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  &__month-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: $text;
    text-transform: capitalize;
  }

  &__today-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: $purple;
    background: rgba($purple, 0.07);
    border: 1px solid #c4b5fd;
    border-radius: 6px;
    padding: 0.25rem 0.625rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba($purple, 0.12); }
  }

  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 0.25rem;

    span {
      text-align: center;
      font-size: 0.625rem;
      font-weight: 700;
      color: $muted;
      text-transform: uppercase;
      padding: 0.15rem 0;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  &__cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s, box-shadow 0.12s;
    padding: 2px 0;
    position: relative;

    &--empty { cursor: default; }

    &--future {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--has-data:not(.sdc__cell--selected):hover {
      background: rgba($green, 0.1);
      .sdc__dot--sales { transform: scale(1.4); }
    }

    &--no-data:not(.sdc__cell--selected):not(.sdc__cell--future):hover {
      background: #f9fafb;
    }

    &--today:not(.sdc__cell--selected) {
      background: rgba($purple, 0.12);
      .sdc__num { color: $purple; font-weight: 800; }
    }

    &--selected {
      background: $purple;
      box-shadow: 0 2px 10px rgba($purple, 0.4);

      .sdc__num { color: #fff; font-weight: 800; }
      .sdc__revenue { color: rgba(255,255,255,0.9); }
    }
  }

  &__num {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $text;
    line-height: 1;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 2px;
    flex-shrink: 0;
    transition: transform 0.15s ease;

    &--sales {
      background: $green;
      box-shadow: 0 0 0 2px rgba($green, 0.2);
    }

    &--zero {
      background: #d1d5db;
    }
  }

  &__empty-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    border: 1.5px solid #d1d5db;
    background: transparent;
    margin-top: 2px;
  }

  &__legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid $border;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.6875rem;
    color: $muted;
    font-weight: 500;
  }

  &__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $green;
    display: inline-block;

    &--empty {
      background: transparent;
      border: 1.5px solid #d1d5db;
    }
  }
}
</style>
