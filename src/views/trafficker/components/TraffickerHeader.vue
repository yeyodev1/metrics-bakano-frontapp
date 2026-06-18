<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
  currentYear: {
    type: Number,
    required: true,
  },
  currentMonth: {
    type: Number,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'changeMonth', year: number, month: number): void
}>()

const isCurrentMonth = computed(() => {
  const n = new Date()
  return props.currentYear === n.getFullYear() && props.currentMonth === n.getMonth() + 1
})

const monthLabel = computed(() =>
  new Date(props.currentYear, props.currentMonth - 1, 1)
    .toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
)

const monthPickerOpen = ref(false)

const monthOptions = computed(() => {
  const opts: { year: number; month: number; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
    })
  }
  return opts
})

function selectMonth(year: number, month: number) {
  monthPickerOpen.value = false
  emit('changeMonth', year, month)
}

function prevMonth() {
  let y = props.currentYear
  let m = props.currentMonth
  if (m === 1) { m = 12; y-- }
  else m--
  emit('changeMonth', y, m)
}

function nextMonth() {
  if (isCurrentMonth.value) return
  let y = props.currentYear
  let m = props.currentMonth
  if (m === 12) { m = 1; y++ }
  else m++
  emit('changeMonth', y, m)
}
</script>

<template>
  <div class="trf__header">
    <div class="trf__header-left">
      <div class="trf__header-icon">
        <i class="fa-solid fa-bullseye-arrow" />
      </div>
      <div>
        <h1>Panel Trafficker</h1>
        <p class="trf__header-sub">{{ userName }} · <span class="trf__month-text">{{ monthLabel }}</span></p>
      </div>
    </div>
    <div class="trf__month-nav">
      <button class="trf__nav-btn" @click="prevMonth" :disabled="isLoading">
        <i class="fa-solid fa-chevron-left" />
      </button>
      <div class="trf__month-picker">
        <button
          class="trf__month-display"
          :disabled="isLoading"
          @click="monthPickerOpen = !monthPickerOpen"
        >
          <i class="fa-regular fa-calendar" />
          <span>{{ monthLabel }}</span>
          <i class="fa-solid fa-chevron-down trf__month-display-caret" :class="{ open: monthPickerOpen }" />
        </button>
        <Teleport to="body">
          <div v-if="monthPickerOpen" class="trf__month-backdrop" @click="monthPickerOpen = false" />
        </Teleport>
        <div v-if="monthPickerOpen" class="trf__month-dropdown">
          <button
            v-for="opt in monthOptions"
            :key="`${opt.year}-${opt.month}`"
            class="trf__month-option"
            :class="{ active: opt.year === currentYear && opt.month === currentMonth }"
            @click="selectMonth(opt.year, opt.month)"
          >{{ opt.label }}</button>
        </div>
      </div>
      <button class="trf__nav-btn" @click="nextMonth" :disabled="isLoading || isCurrentMonth">
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trf__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 24px;
}

.trf__header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.trf__header-icon {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: linear-gradient(135deg, $primary 0%, darken($primary, 18%) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.trf__header h1 {
  margin: 0 0 3px;
  font-size: 22px;
  font-weight: 800;
  color: $primary-dark;
}

.trf__header-sub {
  margin: 0;
  font-size: 13px;
  color: $text-secondary;
}

.trf__month-text { text-transform: capitalize; }

.trf__month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $primary-dark;
  text-transform: capitalize;
  white-space: nowrap;
}

.trf__nav-btn {
  width: 34px;
  height: 34px;
  border: 1.5px solid rgba($primary, 0.22);
  border-radius: 8px;
  background: white;
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) { background: rgba($primary, 0.08); border-color: $primary; }
  &:disabled { opacity: 0.3; cursor: default; }
}

.trf__month-picker {
  position: relative;
}

.trf__month-display {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border: 1.5px solid rgba($primary, 0.2);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: $primary-dark;
  background: white;
  text-transform: capitalize;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  i { font-size: 12px; color: $primary; }

  .trf__month-display-caret {
    font-size: 9px;
    opacity: 0.5;
    transition: transform 0.2s;
    &.open { transform: rotate(180deg); }
  }

  &:hover:not(:disabled) { border-color: $primary; background: rgba($primary, 0.04); }
  &:disabled { opacity: 0.45; cursor: default; }
}

.trf__month-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
}

.trf__month-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 999;
  background: white;
  border: 1.5px solid rgba($primary, 0.12);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.13);
  padding: 6px;
  min-width: 210px;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trf__month-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: $primary-dark;
  cursor: pointer;
  text-align: left;
  text-transform: capitalize;
  transition: background 0.1s;

  &:hover { background: rgba($primary, 0.06); }

  &.active {
    background: rgba($primary, 0.1);
    color: $primary;
    font-weight: 700;
  }
}
</style>
