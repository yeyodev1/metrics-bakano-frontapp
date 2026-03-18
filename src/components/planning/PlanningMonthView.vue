<script setup lang="ts">
import { computed } from 'vue'
import type { PlanningEntry, GlobalPlanningEntry } from '@/types'
import type { VideoCalendarItem } from '@/types/videoPlanning'
import PlanningEntryCard from './PlanningEntryCard.vue'

const props = defineProps({
  currentMonth: {
    type: Date,
    required: true,
  },
  entries: {
    type: Array as () => (PlanningEntry | GlobalPlanningEntry)[],
    required: true,
  },
  videoItems: {
    type: Array as () => VideoCalendarItem[],
    default: () => [],
  },
  isGlobal: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
  workspaceName: {
    type: String,
    default: '',
  },
  workspaceMetaPageId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['click-day', 'edit-entry'])

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const daysInMonth = computed(() => {
  const year = props.currentMonth.getFullYear()
  const month = props.currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days: (Date | null)[] = []
  
  // Fill empty days at start (Monday-based)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6 // Sunday
  
  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }
  
  // Fill actual days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  return days
})

function getEntriesForDay(day: Date) {
  const targetDate = day.toLocaleDateString('en-CA') 
  return props.entries.filter(e => {
    const entryDate = new Date(e.date).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return entryDate === targetDate
  }).sort((a, b) => a.date.localeCompare(b.date))
}

function isToday(day: Date | null) {
  if (!day) return false
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate === ectNow
}

function isPast(day: Date | null) {
  if (!day) return false
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate < ectNow
}

function getVideoItemsForDay(day: Date): VideoCalendarItem[] {
  const targetDate = day.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return props.videoItems.filter(v => {
    const d = new Date(v.fechaPublicacion).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return d === targetDate
  })
}

const PUB_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  PUBLICADO:   { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  PROGRAMADO:  { bg: '#eef2ff', text: '#4338ca', dot: '#4f46e5' },
  POR_PUBLICAR:{ bg: '#fef3c7', text: '#b45309', dot: '#d97706' },
  '-':         { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
}

function pubColor(status: string) {
  return PUB_COLOR[status] ?? PUB_COLOR['-']
}
</script>

<template>
  <div class="planning-month" :class="{ 'is-global': isGlobal }">
    <div class="planning-month__header">
      <div v-for="day in WEEKDAYS" :key="day" class="planning-month__weekday">
        {{ day }}
      </div>
    </div>

    <div class="planning-month__grid">
      <div
        v-for="(day, idx) in daysInMonth"
        :key="idx"
        class="planning-month__day"
        :class="{
          'is-empty': !day,
          'is-today': isToday(day),
          'is-past': isPast(day),
          'is-clickable': day && canManage
        }"
        @click="day && canManage && emit('click-day', day)"
      >
        <template v-if="day">
          <span class="planning-month__day-number">{{ day.getDate() }}</span>
          
          <div class="planning-month__day-content">
            <div class="planning-month__day-entries">
              <PlanningEntryCard
                v-for="entry in getEntriesForDay(day)"
                :key="entry._id"
                :entry="entry"
                :is-past="isPast(day)"
                :can-manage="canManage"
                :workspace-name="isGlobal ? (entry as GlobalPlanningEntry).workspaceName : workspaceName"
                :workspace-meta-page-id="isGlobal ? ((entry as GlobalPlanningEntry).workspaceMetaPageId || '') : workspaceMetaPageId"
                compact
                @edit="emit('edit-entry', $event)"
              />

              <!-- Video publication chips -->
              <div
                v-for="video in getVideoItemsForDay(day)"
                :key="video._id"
                class="planning-month__video-chip"
                :style="{
                  background: pubColor(video.estadoPublicacion).bg,
                  color: pubColor(video.estadoPublicacion).text,
                  borderColor: pubColor(video.estadoPublicacion).dot,
                }"
                :title="`${video.tema}${video.tipo ? ' · ' + video.tipo : ''} — ${video.estadoPublicacion.replace(/_/g, ' ')}`"
              >
                <span
                  class="planning-month__video-dot"
                  :style="{ background: pubColor(video.estadoPublicacion).dot }"
                />
                <i class="fa-solid fa-clapperboard planning-month__video-icon" />
                <span class="planning-month__video-name">{{ video.tema }}</span>
                <span v-if="video.estadoPublicacion === 'PUBLICADO'" class="planning-month__video-badge">✓</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planning-month {
  background: $white;
  border-radius: 20px;
  border: 1px solid rgba($primary-dark, 0.08);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);

  &__header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: rgba($primary-dark, 0.02);
    border-bottom: 1px solid rgba($primary-dark, 0.06);

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__weekday {
    padding: 1rem;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $text-secondary;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__day {
    min-height: 140px;
    padding: 0.75rem;
    border-right: 1px solid rgba($primary-dark, 0.04);
    border-bottom: 1px solid rgba($primary-dark, 0.04);
    position: relative;
    transition: background 0.2s;

    &:nth-child(7n) { border-right: none; }

    &.is-empty {
      background: rgba($primary-dark, 0.01);
    }

    &.is-clickable {
      cursor: pointer;
      &:hover {
        background: rgba($primary, 0.02);
      }
    }

    &.is-today {
      background: rgba($primary, 0.03);
      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, $primary, darken($primary, 10%));
      }
      .planning-month__day-number {
        color: $primary;
        font-weight: 800;
      }
    }

    &.is-past {
      background: rgba($primary-dark, 0.005);
    }

    @media (max-width: 768px) {
      min-height: auto;
      padding: 1.25rem 1.5rem;
      &.is-empty { display: none; }
      
      border-right: none;
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }
  }

  &__day-number {
    font-size: 0.85rem;
    font-weight: 700;
    color: rgba($primary-dark, 0.4);
    display: block;
    margin-bottom: 0.75rem;

    @media (max-width: 768px) {
      margin-bottom: 0;
      min-width: 2.5rem;
      font-size: 1.1rem;
    }
  }

  &__day-content {
    flex: 1;
    min-width: 0;
  }

  &__day-entries {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__video-chip {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.22rem 0.55rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: default;
    white-space: nowrap;
    overflow: hidden;
    max-width: 100%;
    transition: opacity 0.15s;

    &:hover { opacity: 0.8; }
  }

  &__video-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }

  &__video-icon {
    font-size: 0.6rem; flex-shrink: 0; opacity: 0.7;
  }

  &__video-name {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  &__video-badge {
    font-size: 0.65rem; font-weight: 900; flex-shrink: 0;
  }
}
</style>
