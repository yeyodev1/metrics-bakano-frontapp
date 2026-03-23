<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import type { AppNotification, NotificationType } from '@/types'

const store = useNotificationStore()

onMounted(() => store.fetchAll())

const hasUnread = computed(() => store.notifications.some(n => !n.isRead))

// ── Group notifications by date ───────────────────────────────
const grouped = computed(() => {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const groups: { label: string; items: AppNotification[] }[] = [
    { label: 'Hoy', items: [] },
    { label: 'Ayer', items: [] },
    { label: 'Esta semana', items: [] },
    { label: 'Antes', items: [] },
  ]

  for (const n of store.notifications) {
    const d = new Date(n.createdAt)
    const dStr = d.toDateString()
    if (dStr === today) {
      groups[0].items.push(n)
    } else if (dStr === yesterdayStr) {
      groups[1].items.push(n)
    } else if (d >= weekAgo) {
      groups[2].items.push(n)
    } else {
      groups[3].items.push(n)
    }
  }

  return groups.filter(g => g.items.length > 0)
})

const typeIcon: Record<NotificationType, string> = {
  new_client_assigned: 'fa-solid fa-user-plus',
  video_status_changed: 'fa-solid fa-circle-play',
  video_planning_resent: 'fa-solid fa-calendar-pen',
}

const typeColor: Record<NotificationType, string> = {
  new_client_assigned: 'notif--primary',
  video_status_changed: 'notif--info',
  video_planning_resent: 'notif--warning',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function handleClick(n: AppNotification) {
  if (!n.isRead) store.markRead(n._id)
}
</script>

<template>
  <div class="notif-view">
    <div class="notif-view__header">
      <div>
        <h1 class="notif-view__title">Notificaciones</h1>
        <p class="notif-view__subtitle">
          {{ store.unreadCount > 0 ? `${store.unreadCount} sin leer` : 'Todo al día' }}
        </p>
      </div>
      <button
        v-if="hasUnread"
        class="notif-view__read-all"
        @click="store.markAllRead()"
      >
        <i class="fa-solid fa-check-double" />
        Marcar todo como leído
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="store.notifications.length === 0" class="notif-view__empty">
      <div class="notif-view__empty-icon">
        <i class="fa-solid fa-bell-slash" />
      </div>
      <p class="notif-view__empty-text">No tienes notificaciones</p>
      <p class="notif-view__empty-sub">Aquí verás avisos de clientes asignados, videos y más.</p>
    </div>

    <!-- Grouped list -->
    <div v-else class="notif-view__groups">
      <div v-for="group in grouped" :key="group.label" class="notif-view__group">
        <p class="notif-view__group-label">{{ group.label }}</p>

        <div class="notif-view__list">
          <div
            v-for="n in group.items"
            :key="n._id"
            class="notif-item"
            :class="[!n.isRead && 'notif-item--unread']"
            @click="handleClick(n)"
          >
            <!-- Unread dot -->
            <span v-if="!n.isRead" class="notif-item__dot" />

            <!-- Icon -->
            <div class="notif-item__icon" :class="typeColor[n.type]">
              <i :class="typeIcon[n.type]" />
            </div>

            <!-- Content -->
            <div class="notif-item__content">
              <p class="notif-item__title">{{ n.title }}</p>
              <p class="notif-item__body">{{ n.body }}</p>
              <span class="notif-item__time">{{ relativeTime(n.createdAt) }}</span>
            </div>

            <!-- Delete -->
            <button class="notif-item__delete" @click.stop="store.deleteOne(n._id)">
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notif-view {
  padding: 2rem;
  max-width: 680px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 1.6rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__subtitle {
    font-size: 0.85rem;
    color: rgba($primary-dark, 0.45);
    margin: 0;
  }

  &__read-all {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba($primary, 0.08);
    color: $primary;
    border: 1px solid rgba($primary, 0.2);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.83rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover { background: rgba($primary, 0.14); }

    i { font-size: 0.85rem; }
  }

  // ── Empty ──
  &__empty {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba($primary-dark, 0.35);
  }

  &__empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  &__empty-text {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
    color: rgba($primary-dark, 0.5);
  }

  &__empty-sub {
    font-size: 0.85rem;
    margin: 0;
  }

  // ── Groups ──
  &__groups {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  &__group-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba($primary-dark, 0.4);
    margin: 0 0 0.6rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}

// ── Notification item ────────────────────────────────────────
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  cursor: pointer;
  position: relative;
  transition: background 0.15s, box-shadow 0.15s;

  &--unread {
    background: rgba($primary, 0.04);
    border-color: rgba($primary, 0.15);
  }

  &:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,0.07);

    .notif-item__delete {
      opacity: 1;
    }
  }

  &__dot {
    position: absolute;
    top: 0.9rem;
    left: -6px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $primary;
    border: 2px solid $white;
    flex-shrink: 0;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    flex-shrink: 0;

    &.notif--primary {
      background: rgba($primary, 0.12);
      color: $primary;
    }
    &.notif--info {
      background: rgba($alert-info, 0.12);
      color: $alert-info;
    }
    &.notif--warning {
      background: rgba($alert-warning, 0.12);
      color: $alert-warning;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 0.88rem;
    font-weight: 700;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__body {
    font-size: 0.82rem;
    color: rgba($primary-dark, 0.6);
    margin: 0 0 0.35rem;
    line-height: 1.5;
  }

  &__time {
    font-size: 0.72rem;
    color: rgba($primary-dark, 0.35);
    font-weight: 500;
  }

  &__delete {
    width: 28px;
    height: 28px;
    border: none;
    background: rgba($primary-dark, 0.06);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba($primary-dark, 0.45);
    font-size: 0.8rem;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;

    &:hover {
      background: rgba($alert-error, 0.1);
      color: $alert-error;
    }
  }
}
</style>
