<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import type { AppNotification, NotificationType } from '@/types'

const store = useNotificationStore()
const router = useRouter()

// ── Load page 1 on mount ──────────────────────────────────────
onMounted(() => store.fetchPage(1))

// ── Group current page (already sorted by backend DESC) ───────
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
    if (dStr === today) groups[0].items.push(n)
    else if (dStr === yesterdayStr) groups[1].items.push(n)
    else if (d >= weekAgo) groups[2].items.push(n)
    else groups[3].items.push(n)
  }

  return groups.filter(g => g.items.length > 0)
})

const hasUnread = computed(() => store.unreadCount > 0)

// ── Notification metadata ─────────────────────────────────────
const typeIcon: Record<NotificationType, string> = {
  new_client_assigned:  'fa-solid fa-user-plus',
  video_status_changed: 'fa-solid fa-circle-play',
  video_planning_resent: 'fa-solid fa-calendar-pen',
}

const typeColor: Record<NotificationType, string> = {
  new_client_assigned:  'notif--primary',
  video_status_changed: 'notif--info',
  video_planning_resent: 'notif--warning',
}

const typeLabel: Record<NotificationType, string> = {
  new_client_assigned:  'Cliente asignado',
  video_status_changed: 'Video publicado',
  video_planning_resent: 'Planificación',
}

// ── Redirect logic ────────────────────────────────────────────
function getRedirectRoute(n: AppNotification): { name: string; params: Record<string, string> } | null {
  if (!n.workspaceId) return null
  switch (n.type) {
    case 'new_client_assigned':
      return { name: 'BillingRoas', params: { workspaceId: n.workspaceId } }
    case 'video_status_changed':
    case 'video_planning_resent':
      return { name: 'AppPlanning', params: { workspaceId: n.workspaceId } }
    default:
      return null
  }
}

function hasRedirect(n: AppNotification): boolean {
  return !!getRedirectRoute(n)
}

// ── Actions ───────────────────────────────────────────────────
async function handleMarkRead(n: AppNotification) {
  if (!n.isRead) await store.markRead(n._id)
}

async function handleCardClick(n: AppNotification) {
  if (!n.isRead) await store.markRead(n._id)
  const route = getRedirectRoute(n)
  if (route) router.push(route)
}

// ── Helpers ───────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' })
}

function visiblePages(): (number | '...')[] {
  const total = store.totalPages
  const current = store.currentPage
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

async function goToPage(p: number) {
  await store.fetchPage(p)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="notif-view">

    <!-- Header -->
    <div class="notif-view__header">
      <div class="notif-view__header-left">
        <div class="notif-view__header-icon">
          <i class="fa-solid fa-bell" />
        </div>
        <div>
          <h1 class="notif-view__title">Notificaciones</h1>
          <p class="notif-view__subtitle">
            <template v-if="store.unreadCount > 0">
              <span class="unread-badge">{{ store.unreadCount }}</span> sin leer
            </template>
            <template v-else>Todo al día ✓</template>
          </p>
        </div>
      </div>
      <button
        v-if="hasUnread"
        class="btn-read-all"
        @click="store.markAllRead()"
      >
        <i class="fa-solid fa-check-double" />
        Marcar todo como leído
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading && store.notifications.length === 0" class="notif-empty">
      <div class="notif-empty__icon"><i class="fa-solid fa-circle-notch fa-spin" /></div>
      <p>Cargando notificaciones…</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.isLoading && store.total === 0" class="notif-empty">
      <div class="notif-empty__icon"><i class="fa-solid fa-bell-slash" /></div>
      <h3>Sin notificaciones</h3>
      <p>Aquí verás avisos de clientes asignados, videos publicados y más.</p>
    </div>

    <template v-else>
      <!-- Count + pagination info -->
      <div class="notif-meta">
        <span class="notif-meta__count">
          {{ store.total }} notificación{{ store.total !== 1 ? 'es' : '' }}
        </span>
        <span v-if="store.totalPages > 1" class="notif-meta__page">
          Página {{ store.currentPage }} de {{ store.totalPages }}
        </span>
      </div>

      <!-- Grouped list -->
      <div class="notif-groups">
        <div v-for="group in grouped" :key="group.label" class="notif-group">
          <p class="notif-group__label">{{ group.label }}</p>

          <div class="notif-list">
            <div
              v-for="n in group.items"
              :key="n._id"
              class="notif-item"
              :class="{
                'notif-item--unread': !n.isRead,
                'notif-item--clickable': hasRedirect(n),
              }"
              @click="handleCardClick(n)"
            >
              <!-- Unread dot -->
              <span v-if="!n.isRead" class="notif-item__dot" />

              <!-- Icon -->
              <div class="notif-item__icon-wrap" :class="typeColor[n.type]">
                <i :class="typeIcon[n.type]" />
              </div>

              <!-- Content -->
              <div class="notif-item__body">
                <div class="notif-item__meta">
                  <span class="notif-item__type-tag" :class="typeColor[n.type]">
                    {{ typeLabel[n.type] }}
                  </span>
                  <span class="notif-item__time">{{ relativeTime(n.createdAt) }}</span>
                </div>
                <p class="notif-item__title">{{ n.title }}</p>
                <p class="notif-item__text">{{ n.body }}</p>
                <span v-if="hasRedirect(n)" class="notif-item__cta">
                  <i class="fa-solid fa-arrow-right" /> Ver detalles
                </span>
              </div>

              <!-- Actions (always visible) -->
              <div class="notif-item__actions" @click.stop>
                <!-- Mark read manually -->
                <button
                  v-if="!n.isRead"
                  class="notif-action-btn notif-action-btn--read"
                  title="Marcar como leído"
                  @click="handleMarkRead(n)"
                >
                  <i class="fa-solid fa-check" />
                </button>

                <!-- Delete -->
                <button
                  class="notif-action-btn notif-action-btn--delete"
                  title="Eliminar notificación"
                  @click="store.deleteOne(n._id)"
                >
                  <i class="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="notif-pagination">
        <button
          class="page-btn page-btn--nav"
          :disabled="store.currentPage === 1 || store.isLoading"
          @click="goToPage(store.currentPage - 1)"
        >
          <i class="fa-solid fa-chevron-left" />
        </button>

        <template v-for="p in visiblePages()" :key="String(p)">
          <span v-if="p === '...'" class="page-dots">…</span>
          <button
            v-else
            class="page-btn"
            :class="{ 'page-btn--active': p === store.currentPage }"
            :disabled="store.isLoading"
            @click="goToPage(p as number)"
          >{{ p }}</button>
        </template>

        <button
          class="page-btn page-btn--nav"
          :disabled="store.currentPage === store.totalPages || store.isLoading"
          @click="goToPage(store.currentPage + 1)"
        >
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
    </template>

  </div>
</template>

<style lang="scss" scoped>
.notif-view {
  padding: 24px 24px 60px;
  max-width: 720px;
  width: 100%;

  @media (min-width: 640px) { padding: 32px 40px 80px; }
}

// ── Header ────────────────────────────────────────────────────
.notif-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  &-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #0f1117 0%, #1e293b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    flex-shrink: 0;
  }
}

.notif-view__title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.notif-view__subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 5px;
}

.unread-badge {
  background: #7c3aed;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 20px;
}

.btn-read-all {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  i { font-size: 11px; }
  &:hover { background: #e2e8f0; color: #0f172a; }
}

// ── Meta row ──────────────────────────────────────────────────
.notif-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;

  &__count {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }

  &__page {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }
}

// ── Empty ─────────────────────────────────────────────────────
.notif-empty {
  text-align: center;
  padding: 64px 24px;
  color: #94a3b8;

  &__icon {
    font-size: 40px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 700;
    color: #64748b;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
}

// ── Groups ────────────────────────────────────────────────────
.notif-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notif-group__label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
  margin: 0 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// ── Notification item ─────────────────────────────────────────
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  position: relative;
  transition: box-shadow 0.15s, border-color 0.15s, background 0.15s;

  &--unread {
    border-color: rgba(124, 58, 237, 0.25);
    background: rgba(124, 58, 237, 0.03);
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.09);
      border-color: #cbd5e1;
      background: #f8fafc;

      .notif-item__cta { opacity: 1; transform: translateX(0); }
    }
  }

  &__dot {
    position: absolute;
    top: 16px;
    left: -5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7c3aed;
    border: 2px solid #fff;
    flex-shrink: 0;
  }

  &__icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;

    &.notif--primary { background: #ede9fe; color: #7c3aed; }
    &.notif--info    { background: #dbeafe; color: #2563eb; }
    &.notif--warning { background: #fef3c7; color: #d97706; }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  &__type-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.3px;

    &.notif--primary { background: #ede9fe; color: #7c3aed; }
    &.notif--info    { background: #dbeafe; color: #2563eb; }
    &.notif--warning { background: #fef3c7; color: #d97706; }
  }

  &__time {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 3px;
    line-height: 1.4;
  }

  &__text {
    font-size: 12px;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #0f1117;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.15s, transform 0.15s;

    i { font-size: 10px; }

    @media (max-width: 480px) { opacity: 1; transform: none; }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
    padding-top: 2px;
  }
}

// ── Action buttons ────────────────────────────────────────────
.notif-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 7px;
  width: 30px;
  height: 30px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;

  &--read {
    background: #d1fae5;
    color: #059669;

    &:hover { background: #059669; color: #fff; }
  }

  &--delete {
    background: #f1f5f9;
    color: #94a3b8;

    &:hover { background: #fee2e2; color: #dc2626; }
  }
}

// ── Pagination ────────────────────────────────────────────────
.notif-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-family: inherit;

  &:hover:not(:disabled) { border-color: #0f1117; color: #0f1117; background: #f8fafc; }

  &--active {
    background: #0f1117;
    border-color: #0f1117;
    color: #fff;
    &:hover { background: #1e293b; }
  }

  &--nav {
    i { font-size: 11px; }
    &:disabled { opacity: 0.35; cursor: not-allowed; }
  }
}

.page-dots {
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
  line-height: 36px;
}
</style>
