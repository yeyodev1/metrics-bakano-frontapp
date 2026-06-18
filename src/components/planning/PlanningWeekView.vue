<script setup lang="ts">
import { computed } from 'vue'
import type { PlanningEntry, GlobalPlanningEntry } from '@/types'
import PlanningEntryCard from './PlanningEntryCard.vue'
import PlanningGlobalEntryCard from './PlanningGlobalEntryCard.vue'
import type { VideoCalendarItem } from '@/types/videoPlanning'

const props = defineProps({
  monday: {
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
  ghlMeetings: {
    type: Array as () => any[],
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

const emit = defineEmits(['click-day', 'edit-entry', 'click-video', 'click-meeting'])

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(props.monday)
    d.setDate(d.getDate() + i)
    return d
  })
})

const WORKSPACE_COLORS = [
  { bg: '#7c3aed', dark: '#5b21b6', shadow: 'rgba(124,58,237,0.22)' },
  { bg: '#0891b2', dark: '#0e7490', shadow: 'rgba(8,145,178,0.22)' },
  { bg: '#059669', dark: '#047857', shadow: 'rgba(5,150,105,0.22)' },
  { bg: '#d97706', dark: '#b45309', shadow: 'rgba(217,119,6,0.22)' },
  { bg: '#dc2626', dark: '#b91c1c', shadow: 'rgba(220,38,38,0.22)' },
  { bg: '#db2777', dark: '#be185d', shadow: 'rgba(219,39,119,0.22)' },
  { bg: '#2563eb', dark: '#1d4ed8', shadow: 'rgba(37,99,235,0.22)' },
  { bg: '#ea580c', dark: '#c2410c', shadow: 'rgba(234,88,12,0.22)' },
  { bg: '#65a30d', dark: '#4d7c0f', shadow: 'rgba(101,163,13,0.22)' },
  { bg: '#0d9488', dark: '#0f766e', shadow: 'rgba(13,148,136,0.22)' },
]

const workspaceIndexMap = computed(() => {
  const map = new Map<string, number>()
  let idx = 0
  for (const entry of props.entries) {
    const wsId = (entry as GlobalPlanningEntry).workspaceId
    if (wsId && !map.has(wsId)) {
      map.set(wsId, idx % WORKSPACE_COLORS.length)
      idx++
    }
  }
  return map
})

function getWorkspaceColors(workspaceId: string) {
  const idx = workspaceIndexMap.value.get(workspaceId) ?? 0
  return WORKSPACE_COLORS[idx]
}

function getEntriesForDay(day: Date) {
  const targetDate = day.toLocaleDateString('en-CA')
  return props.entries.filter(e => {
    const entryDate = new Date(e.date).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return entryDate === targetDate
  }).sort((a, b) => a.date.localeCompare(b.date))
}

function getVideoItemsForDay(day: Date): VideoCalendarItem[] {
  const targetDate = day.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return props.videoItems.filter(v => {
    // Use the stored date string directly (first 10 chars = YYYY-MM-DD)
    // to avoid UTC-midnight shifting one day back in UTC-5 Ecuador
    const d = v.fechaPublicacion.substring(0, 10)
    return d === targetDate
  })
}

function getGhlMeetingsForDay(day: Date): any[] {
  const targetDate = day.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return props.ghlMeetings.filter((m: any) => {
    const d = new Date(m.startTime).toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
    return d === targetDate
  })
}

const PUB_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  PUBLICADO:   { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  PROGRAMADO:  { bg: '#eef2ff', text: '#4338ca', dot: '#4f46e5' },
  POR_PUBLICAR:{ bg: '#fef3c7', text: '#b45309', dot: '#d97706' },
  '-':         { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
}

function pubColor(status: string): { bg: string; text: string; dot: string } {
  const color = PUB_COLOR[status] || PUB_COLOR['-']
  return color as { bg: string; text: string; dot: string }
}

function isToday(day: Date) {
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate === ectNow
}

function isPast(day: Date) {
  const targetDate = day.toLocaleDateString('en-CA')
  const ectNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })
  return targetDate < ectNow
}
</script>

<template>
  <div class="planning-week" :class="{ 'is-global': isGlobal }">
    <div
      v-for="(day, idx) in weekDays"
      :key="idx"
      class="planning-week__col"
      :class="{ 'is-today': isToday(day), 'is-past': isPast(day) }"
    >
      <div class="planning-week__header">
        <span class="planning-week__day-name">{{ WEEKDAYS[idx] }}</span>
        <span class="planning-week__day-num" :class="{ 'is-today': isToday(day) }">
          {{ day.getDate() }}
        </span>
      </div>

      <div class="planning-week__body">
        <template v-if="!isGlobal">
          <PlanningEntryCard
            v-for="entry in getEntriesForDay(day)"
            :key="entry._id"
            :entry="entry"
            :is-past="isPast(day)"
            :can-manage="canManage"
            :workspace-name="workspaceName"
            :workspace-meta-page-id="workspaceMetaPageId"
            @edit="emit('edit-entry', $event)"
          />
        </template>
        <template v-else>
          <PlanningGlobalEntryCard
            v-for="entry in (getEntriesForDay(day) as GlobalPlanningEntry[])"
            :key="entry._id"
            :entry="entry"
            :is-past="isPast(day)"
            :can-manage="canManage"
            :colors="getWorkspaceColors(entry.workspaceId)!"
            @edit="emit('edit-entry', $event)"
          />
        </template>

        <!-- Video publication chips -->
        <div
          v-for="video in getVideoItemsForDay(day)"
          :key="video._id"
          class="planning-week__video-chip"
          :style="{
            background: pubColor(video.estadoPublicacion).bg,
            color: pubColor(video.estadoPublicacion).text,
            borderColor: pubColor(video.estadoPublicacion).dot,
          }"
          :title="`${video.tema}${video.tipo ? ' · ' + video.tipo : ''} — ${video.estadoPublicacion.replace(/_/g, ' ')}`"
          @click="emit('click-video', video)"
        >
          <span
            class="planning-week__video-dot"
            :style="{ background: pubColor(video.estadoPublicacion).dot }"
          />
          <i class="fa-solid fa-clapperboard planning-week__video-icon" />
          <span class="planning-week__video-name">{{ video.tema }}</span>
          <span v-if="video.estadoPublicacion === 'PUBLICADO'" class="planning-week__video-badge">✓</span>
        </div>

        <!-- GHL Meetings chips -->
        <div
          v-for="meeting in getGhlMeetingsForDay(day)"
          :key="meeting._id"
          class="planning-week__meeting-chip"
          @click="emit('click-meeting', meeting)"
          :title="meeting.title"
        >
          <div class="planning-week__meeting-header">
            <i class="fa-brands fa-google planning-week__meeting-icon" />
            <span class="planning-week__meeting-title">{{ meeting.title }}</span>
          </div>
          <div class="planning-week__meeting-avatars">
            <div v-for="att in meeting.attendees" :key="att.email" class="planning-week__meeting-avatar">
              <img v-if="att.photoUrl" :src="att.photoUrl" :alt="att.name" :title="att.name" />
              <div v-else class="fallback" :title="att.name">{{ att.name ? att.name.charAt(0).toUpperCase() : 'U' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.planning-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(130px, 1fr));
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 16px;
  overflow: hidden;
  overflow-x: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  background: $white;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(7, minmax(110px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    border: none;
    box-shadow: none;
    background: transparent;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__col {
    min-height: 400px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba($primary-dark, 0.06);
    background: $white;
    position: relative;

    &:last-child { border-right: none; }

    &.is-today {
      background: rgba($primary, 0.012);
      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, $primary, darken($primary, 10%));
      }
    }

    &.is-past { 
      background: rgba($primary-dark, 0.005); 
    }

    @media (max-width: 768px) {
      min-height: auto;
      border: 1px solid rgba($primary-dark, 0.08);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    }
  }

  &__header {
    padding: 1rem 0.75rem;
    text-align: center;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    background: rgba($primary-dark, 0.015);
    flex-shrink: 0;

    @media (max-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      background: rgba($primary-dark, 0.025);
    }
  }

  &__day-name {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $text-secondary;
  }

  &__day-num {
    font-size: 1.35rem;
    font-weight: 800;
    color: rgba($primary-dark, 0.25);
    line-height: 1;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;

    &.is-today {
      background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
      color: $white;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba($primary, 0.3);
    }

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
      font-size: 1.15rem;
    }
  }

  &__body {
    flex: 1;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 0;

    @media (max-width: 768px) {
      padding: 1.25rem;
    }
  }

  &__video-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: 10px;
    border: 1px solid transparent;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: default;
    white-space: nowrap;
    overflow: hidden;
    max-width: 100%;
    transition: all 0.2s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);

    &:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06); }
  }

  &__video-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  }

  &__video-icon {
    font-size: 0.65rem; flex-shrink: 0; opacity: 0.8;
  }

  &__video-name {
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  &__video-badge {
    font-size: 0.7rem; font-weight: 900; flex-shrink: 0;
  }

  &__meeting-chip {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.45rem 0.65rem;
    border-radius: 10px;
    background: rgba(#8b5cf6, 0.1);
    border: 1px solid rgba(#8b5cf6, 0.2);
    cursor: default;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);

    &:hover {
      background: rgba(#8b5cf6, 0.15);
      border-color: rgba(#8b5cf6, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
    }
  }

  &__meeting-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #6d28d9;
  }

  &__meeting-icon {
    font-size: 0.8rem;
  }

  &__meeting-title {
    font-size: 0.75rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meeting-avatars {
    display: flex;
    flex-wrap: wrap;
    gap: -0.3rem;
    padding-left: 0.2rem;
  }

  &__meeting-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid $white;
    margin-left: -0.4rem;
    position: relative;
    z-index: 1;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .fallback {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #8b5cf6;
      color: $white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
    }

    &:hover {
      z-index: 10;
      transform: translateY(-2px);
    }
  }
}
</style>
