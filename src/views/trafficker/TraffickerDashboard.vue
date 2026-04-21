<template>
  <div class="trf">

    <!-- Header -->
    <div class="trf__header">
      <div class="trf__header-left">
        <div class="trf__header-icon">
          <i class="fa-solid fa-bullseye-arrow" />
        </div>
        <div>
          <h1>Panel Trafficker</h1>
          <p class="trf__header-sub">{{ userStore.name || 'Trafficker' }} · <span class="trf__month-text">{{ monthLabel }}</span></p>
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

    <!-- Summary strip -->
    <div v-if="cards.length > 0 && !isLoading" class="trf__strip">
      <div class="trf__strip-item">
        <span class="trf__strip-label">ROAS promedio</span>
        <span class="trf__strip-val" :class="stripRoasClass">{{ avgRoas > 0 ? avgRoas.toFixed(2) + 'x' : '—' }}</span>
      </div>
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <span class="trf__strip-label">Facturación total</span>
        <span class="trf__strip-val">${{ fmt(totalRevenue) }}</span>
      </div>
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <span class="trf__strip-label">Gasto Meta total</span>
        <span class="trf__strip-val">${{ fmt(totalSpend) }}</span>
      </div>
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <span class="trf__strip-label">Clientes</span>
        <span class="trf__strip-val">{{ cards.length }}</span>
      </div>
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <span class="trf__strip-label">Sin facturación</span>
        <span class="trf__strip-val" :class="cardsWithoutBilling.length > 0 ? 'trf__strip-val--red' : 'trf__strip-val--green'">
          {{ cardsWithoutBilling.length }}
        </span>
      </div>
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <span class="trf__strip-label">En objetivo ≥4x</span>
        <span class="trf__strip-val trf__strip-val--green">{{ onTarget }}</span>
      </div>

      <!-- Recordar a todos -->
      <div class="trf__strip-divider" />
      <div class="trf__strip-item">
        <button
          v-if="!remindAllDone"
          class="trf__remind-all-btn"
          :class="{ 'trf__remind-all-btn--active': remindAll.active }"
          :disabled="remindAll.active || cardsWithoutBilling.length === 0"
          @click="sendReminderToAll"
        >
          <i :class="remindAll.active ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-bell'" />
          <span v-if="remindAll.active">
            Enviando {{ remindAll.done }} / {{ remindAll.total }}…
          </span>
          <span v-else>
            Recordar a todos <span v-if="cardsWithoutBilling.length" class="trf__remind-all-count">{{ cardsWithoutBilling.length }}</span>
          </span>
        </button>
        <div v-else class="trf__remind-all-done">
          <i class="fa-solid fa-check" /> Enviado a {{ remindAll.total - remindAll.errors }} entornos
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="isLoading" class="trf__grid">
      <div v-for="n in 6" :key="n" class="trf-sk-card">
        <div class="trf-sk-card__top">
          <div class="trf-sk-card__name-area">
            <div class="trf-sk trf-sk--avatar" />
            <div>
              <div class="trf-sk trf-sk--name" />
              <div class="trf-sk trf-sk--sub" />
            </div>
          </div>
          <div class="trf-sk trf-sk--badge" />
        </div>
        <div class="trf-sk-card__metrics">
          <div class="trf-sk trf-sk--metric" />
          <div class="trf-sk trf-sk--metric" />
        </div>
        <div class="trf-sk trf-sk--progress" />
        <div class="trf-sk trf-sk--footer" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="cards.length === 0" class="trf__empty">
      <i class="fa-solid fa-layer-group" />
      <h3>Sin entornos asignados</h3>
      <p>Contacta al superadmin para que te asigne entornos de clientes.</p>
    </div>

    <!-- Search -->
    <div v-if="!isLoading && cards.length > 0" class="trf__search-wrap">
      <i class="fa-solid fa-magnifying-glass trf__search-icon" />
      <input
        v-model="searchQuery"
        class="trf__search-input"
        type="search"
        placeholder="Buscar cliente..."
        autocomplete="off"
      />
      <button v-if="searchQuery" class="trf__search-clear" @click="searchQuery = ''">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <!-- Filter tabs -->
    <div v-if="!isLoading && cards.length > 0" class="trf__filter-tabs">
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'all' }"
        @click="filterMode = 'all'"
      >
        <i class="fa-solid fa-layer-group" /> Todos
        <span class="trf__filter-tab-count">{{ cards.length }}</span>
      </button>
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'con_pauta' }"
        @click="filterMode = 'con_pauta'"
      >
        <i class="fa-brands fa-meta" /> Con pauta
        <span class="trf__filter-tab-count">{{ cards.filter(c => c.spend > 0).length }}</span>
      </button>
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'sin_pauta' }"
        @click="filterMode = 'sin_pauta'"
      >
        <i class="fa-solid fa-minus" /> Sin pauta
        <span class="trf__filter-tab-count">{{ cards.filter(c => c.spend === 0).length }}</span>
      </button>
    </div>

    <!-- Grouped view -->
    <div v-if="!isLoading && cards.length > 0" class="trf__groups">
      <div
        v-for="group in groups"
        :key="group.id"
        class="trf__group"
        :class="`trf__group--${group.color}`"
      >
        <!-- Group header (collapsible) -->
        <button class="trf__group-header" @click="toggleGroup(group.id)">
          <div class="trf__group-icon">
            <i :class="group.icon" />
          </div>
          <div class="trf__group-meta">
            <span class="trf__group-title">{{ group.label }}</span>
            <span class="trf__group-desc">{{ group.desc }}</span>
          </div>
          <span class="trf__group-count">{{ group.cards.length }}</span>
          <i
            class="fa-solid fa-chevron-down trf__group-caret"
            :class="{ open: expandedGroups.has(group.id) }"
          />
        </button>

        <!-- Cards grid (with slide transition) -->
        <Transition
          :css="false"
          @enter="slideEnter"
          @after-enter="slideAfterEnter"
          @leave="slideLeave"
          @after-leave="slideAfterLeave"
        >
        <div v-if="expandedGroups.has(group.id)" class="trf__group-grid">
          <div
            v-for="card in group.cards"
            :key="card.id"
            class="trf-card"
            :class="cardClass(card.roas)"
            @click="go(card.id)"
          >
            <!-- Top row: name + status badges -->
            <div class="trf-card__top">
              <div class="trf-card__name-wrap">
                <div class="trf-card__avatar">{{ card.name[0]?.toUpperCase() }}</div>
                <div>
                  <p class="trf-card__name">{{ card.name }}</p>
                  <!-- Billing + Ads badges -->
                  <div class="trf-card__badges">
                    <span class="trf-card__badge" :class="card.revenue > 0 ? 'trf-card__badge--ok' : 'trf-card__badge--missing'">
                      <i :class="card.revenue > 0 ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
                      Facturación
                    </span>
                    <span class="trf-card__badge" :class="card.spend > 0 ? 'trf-card__badge--ok' : 'trf-card__badge--neutral'">
                      <i :class="card.spend > 0 ? 'fa-brands fa-meta' : 'fa-solid fa-minus'" />
                      Pauta
                    </span>
                  </div>
                </div>
              </div>
              <div class="trf-card__roas-wrap">
                <div class="trf-card__roas" :class="roasBadge(card.roas)">
                  {{ card.roas > 0 ? card.roas.toFixed(2) + 'x' : '—' }}
                </div>
                <span class="trf-card__roas-label" :class="roasLabelClass(card.roas)">
                  {{ roasLabel(card.roas) }}
                </span>
              </div>
            </div>

            <!-- Metrics row -->
            <div class="trf-card__metrics">
              <div class="trf-card__metric trf-card__metric--revenue">
                <div class="trf-card__metric-icon"><i class="fa-solid fa-building-columns" /></div>
                <div>
                  <span class="trf-card__metric-label">Facturación</span>
                  <span class="trf-card__metric-val">${{ fmt(card.revenue) }}</span>
                </div>
              </div>
              <template v-if="card.onlineRevenue > 0">
                <div class="trf-card__metric-sep" />
                <div class="trf-card__metric trf-card__metric--online">
                  <div class="trf-card__metric-icon"><i class="fa-solid fa-globe" /></div>
                  <div>
                    <span class="trf-card__metric-label">Online</span>
                    <span class="trf-card__metric-val">${{ fmt(card.onlineRevenue) }}</span>
                  </div>
                </div>
              </template>
              <div class="trf-card__metric-sep" />
              <div class="trf-card__metric trf-card__metric--spend">
                <div class="trf-card__metric-icon"><i class="fa-brands fa-meta" /></div>
                <div>
                  <span class="trf-card__metric-label">Gasto Meta</span>
                  <span class="trf-card__metric-val">${{ fmt(card.spend) }}</span>
                </div>
              </div>
            </div>

            <!-- Progress bar toward 4x -->
            <div class="trf-card__progress">
              <div class="trf-card__progress-track">
                <div
                  class="trf-card__progress-fill"
                  :class="roasBadge(card.roas)"
                  :style="{ width: Math.min((card.roas / 4) * 100, 100) + '%' }"
                />
              </div>
              <div class="trf-card__progress-info">
                <span class="trf-card__progress-ratio">
                  {{ card.roas > 0 ? Math.round(Math.min((card.roas / 4) * 100, 100)) + '%' : '0%' }} del objetivo 4x
                </span>
                <span v-if="card.metaConnected" class="trf-card__meta-dot">
                  <i class="fa-brands fa-meta" /> Meta
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="trf-card__actions" @click.stop>
              <button class="trf-card__action trf-card__action--primary" @click="go(card.id)">
                <i class="fa-solid fa-arrow-up-right-from-square" /> Ver detalle
              </button>
              <RouterLink
                class="trf-card__action"
                :to="{ name: 'BillingRoas', params: { workspaceId: card.id } }"
              >
                <i class="fa-solid fa-chart-column" /> Facturación
              </RouterLink>
              <RouterLink
                v-if="card.metaConnected"
                class="trf-card__action"
                :to="{ name: 'AppDashboard', params: { workspaceId: card.id } }"
              >
                <i class="fa-brands fa-meta" /> Meta Ads
              </RouterLink>
              <button
                class="trf-card__action trf-card__action--remind"
                :class="{
                  'trf-card__action--reminding': remindingSet.has(card.id),
                  'trf-card__action--reminded': remindedSet.has(card.id),
                }"
                :disabled="remindingSet.has(card.id) || remindedSet.has(card.id)"
                @click="sendReminder(card.id)"
                :title="remindedSet.has(card.id) ? 'Recordatorio enviado' : 'Enviar recordatorio de facturación a colaboradores'"
              >
                <i
                  :class="remindedSet.has(card.id)
                    ? 'fa-solid fa-check'
                    : remindingSet.has(card.id)
                      ? 'fa-solid fa-spinner fa-spin'
                      : 'fa-solid fa-bell'"
                />
                {{ remindedSet.has(card.id) ? 'Enviado' : remindingSet.has(card.id) ? 'Enviando…' : 'Recordar' }}
              </button>
            </div>
          </div>
        </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { workspaceService } from '@/services/workspace.service'
import { billingService } from '@/services/billing.service'
import { salesSummaryService } from '@/services/salesSummary.service'
import { metaService } from '@/services/meta.service'
import { notificationService } from '@/services/notification.service'

const BOLONCITY_WS_ID = '69bdadc67386136fc3682734'

interface Card {
  id: string
  name: string
  metaConnected: boolean
  roas: number
  revenue: number
  onlineRevenue: number
  spend: number
  ts?: number
}

const router = useRouter()
const userStore = useUserStore()

// ── Billing reminder ──────────────────────────────────────
const remindingSet = ref(new Set<string>())  // workspaceIds being sent right now
const remindedSet  = ref(new Set<string>())  // workspaceIds that just got sent (success flash)

async function sendReminder(id: string) {
  if (remindingSet.value.has(id) || remindedSet.value.has(id)) return
  remindingSet.value = new Set(remindingSet.value).add(id)
  try {
    await notificationService.sendBillingReminder(id)
    remindingSet.value.delete(id)
    remindingSet.value = new Set(remindingSet.value)
    remindedSet.value = new Set(remindedSet.value).add(id)
    // Reset success state after 3 s
    setTimeout(() => {
      remindedSet.value.delete(id)
      remindedSet.value = new Set(remindedSet.value)
    }, 3000)
  } catch {
    remindingSet.value.delete(id)
    remindingSet.value = new Set(remindingSet.value)
  }
}

const isLoading = ref(false)
const cards = ref<Card[]>([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

const isCurrentMonth = computed(() => {
  const n = new Date()
  return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth() + 1
})

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value - 1, 1)
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
  currentYear.value = year
  currentMonth.value = month
  monthPickerOpen.value = false
  load()
}

const byName = (a: Card, b: Card) => a.name.localeCompare(b.name)

const byRoasAsc = (a: Card, b: Card) => {
  if (!a.roas && !b.roas) return byName(a, b)
  if (!a.roas) return 1
  if (!b.roas) return -1
  return a.roas - b.roas
}

// ── Filter tabs ───────────────────────────────────────────
type FilterMode = 'all' | 'con_pauta' | 'sin_pauta'
const filterMode = ref<FilterMode>('all')
const searchQuery = ref('')

const filteredCards = computed(() => {
  const src = cards.value
  if (filterMode.value === 'con_pauta') return src.filter(c => c.spend > 0)
  if (filterMode.value === 'sin_pauta') return src.filter(c => c.spend === 0)
  return src
})

// ── Meta spend background cache ───────────────────────────
const metaSpendCache = new Map<string, number>()

async function loadMetaSpend(wsId: string, adAccountId: string, year: number, month: number) {
  const key = `meta:${wsId}:${year}:${month}`
  if (metaSpendCache.has(key)) return
  try {
    const spend = await metaService.getMonthSpend(wsId, year, month)
    if (spend <= 0) return
    metaSpendCache.set(key, spend)
    const idx = cards.value.findIndex(c => c.id === wsId)
    if (idx === -1) return
    const card = cards.value[idx]
    const roas = card.revenue > 0 ? card.revenue / spend : 0
    cards.value = [...cards.value.slice(0, idx), { ...card, spend, roas }, ...cards.value.slice(idx + 1)]
    const bKey = `${wsId}:${year}:${month}`
    const hit = billingCache.get(bKey)
    if (hit) billingCache.set(bKey, { ...hit, spend, roas })
  } catch { /* silent — workspace may lack adAccountId */ }
}

// ── ROAS label helpers ────────────────────────────────────
function roasLabel(roas: number) {
  if (!roas)    return 'Sin datos'
  if (roas < 1) return 'Crítico'
  if (roas < 4) return 'En peligro'
  return 'Óptimo'
}
function roasLabelClass(roas: number) {
  if (!roas)    return 'roas-label--gray'
  if (roas < 1) return 'roas-label--red'
  if (roas < 4) return 'roas-label--orange'
  return 'roas-label--green'
}

// Billing-first grouping — filtered by current tab
const groups = computed(() => {
  const src = filteredCards.value
  return [
    {
      id: 'pauta_sin_factura',
      label: 'Pauta activa · Sin facturación',
      desc: 'Ads corriendo pero sin datos de facturación — ROAS incalculable',
      icon: 'fa-solid fa-circle-xmark',
      color: 'red',
      needsReminder: true,
      cards: src.filter(c => c.spend > 0 && c.revenue === 0).sort(byName),
    },
    {
      id: 'sin_factura',
      label: 'Sin facturación',
      desc: 'Pendiente de registrar datos del mes',
      icon: 'fa-solid fa-triangle-exclamation',
      color: 'orange',
      needsReminder: true,
      cards: src.filter(c => c.spend === 0 && c.revenue === 0).sort(byName),
    },
    {
      id: 'critico',
      label: 'Crítico · ROAS < 1x',
      desc: 'Facturación registrada — ROAS por debajo del gasto en ads',
      icon: 'fa-solid fa-fire',
      color: 'red',
      needsReminder: false,
      cards: src.filter(c => c.revenue > 0 && c.roas > 0 && c.roas < 1).sort(byRoasAsc),
    },
    {
      id: 'peligro',
      label: 'En peligro · ROAS 1x – 3.99x',
      desc: 'Por debajo del objetivo de 4x — necesita atención',
      icon: 'fa-solid fa-triangle-exclamation',
      color: 'amber',
      needsReminder: false,
      cards: src.filter(c => c.roas >= 1 && c.roas < 4).sort(byRoasAsc),
    },
    {
      id: 'optimo',
      label: 'Óptimo · ROAS ≥ 4x',
      desc: 'En objetivo — seguir optimizando',
      icon: 'fa-solid fa-circle-check',
      color: 'green',
      needsReminder: false,
      cards: src.filter(c => c.roas >= 4).sort(byRoasAsc),
    },
    {
      id: 'factura_sin_pauta',
      label: 'Facturando · Sin pauta activa',
      desc: 'Facturación al día · Sin gasto Meta este mes',
      icon: 'fa-solid fa-building-columns',
      color: 'blue',
      needsReminder: false,
      cards: src.filter(c => c.revenue > 0 && c.spend === 0).sort(byName),
    },
  ].filter(g => g.cards.length > 0)
})

const expandedGroups = ref(new Set(['pauta_sin_factura', 'sin_factura', 'critico', 'peligro', 'optimo', 'factura_sin_pauta']))

// ── Remind all (workspaces without billing) ───────────────
const cardsWithoutBilling = computed(() => filteredCards.value.filter(c => c.revenue === 0))

const remindAll = ref({ active: false, done: 0, total: 0, errors: 0 })
const remindAllDone = ref(false)

async function sendReminderToAll() {
  const targets = cardsWithoutBilling.value
  if (!targets.length || remindAll.value.active) return
  remindAll.value = { active: true, done: 0, total: targets.length, errors: 0 }
  remindAllDone.value = false
  for (const card of targets) {
    if (remindingSet.value.has(card.id) || remindedSet.value.has(card.id)) {
      remindAll.value.done++
      continue
    }
    try {
      await notificationService.sendBillingReminder(card.id)
      remindedSet.value = new Set(remindedSet.value).add(card.id)
    } catch {
      remindAll.value.errors++
    }
    remindAll.value = { ...remindAll.value, done: remindAll.value.done + 1 }
  }
  remindAll.value.active = false
  remindAllDone.value = true
  setTimeout(() => { remindAllDone.value = false }, 5000)
}

function toggleGroup(id: string) {
  if (expandedGroups.value.has(id)) expandedGroups.value.delete(id)
  else expandedGroups.value.add(id)
}

// ── Slide transition hooks (:css="false" → must call done()) ─
function slideEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.overflow = 'hidden'
  e.style.height = '0'
  e.style.opacity = '0'
  // force reflow so initial state registers
  void e.offsetHeight
  e.style.transition = 'height 0.36s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease'
  e.style.height = e.scrollHeight + 'px'
  e.style.opacity = '1'
  const onEnd = () => { e.removeEventListener('transitionend', onEnd); done() }
  e.addEventListener('transitionend', onEnd)
}

function slideAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = 'auto'
  e.style.overflow = ''
  e.style.transition = ''
}

function slideLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.overflow = 'hidden'
  e.style.height = e.scrollHeight + 'px'
  e.style.opacity = '1'
  void e.offsetHeight
  e.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease'
  e.style.height = '0'
  e.style.opacity = '0'
  const onEnd = () => { e.removeEventListener('transitionend', onEnd); done() }
  e.addEventListener('transitionend', onEnd)
}

function slideAfterLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.opacity = ''
  e.style.transition = ''
}

const totalRevenue = computed(() => cards.value.reduce((s, c) => s + c.revenue, 0))
const totalSpend   = computed(() => cards.value.reduce((s, c) => s + c.spend, 0))
const avgRoas = computed(() => {
  const w = cards.value.filter(c => c.roas > 0)
  return w.length ? w.reduce((s, c) => s + c.roas, 0) / w.length : 0
})
const onTarget = computed(() => cards.value.filter(c => c.roas >= 4).length)
const critical = computed(() => cards.value.filter(c => c.roas > 0 && c.roas < 1).length)

const stripRoasClass = computed(() => {
  const r = avgRoas.value
  if (!r) return ''
  if (r >= 4) return 'trf__strip-val--green'
  if (r >= 3) return 'trf__strip-val--teal'
  if (r >= 1) return 'trf__strip-val--orange'
  return 'trf__strip-val--red'
})

function fmt(v: number) {
  return (v || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cardClass(roas: number) {
  if (!roas) return 'trf-card--gray'
  if (roas >= 4) return 'trf-card--green'
  if (roas >= 3) return 'trf-card--teal'
  if (roas >= 1) return 'trf-card--orange'
  return 'trf-card--red'
}

function roasBadge(roas: number) {
  if (!roas) return 'badge--gray'
  if (roas >= 4) return 'badge--green'
  if (roas >= 3) return 'badge--teal'
  if (roas >= 1) return 'badge--orange'
  return 'badge--red'
}

function statusClass(roas: number) {
  if (!roas) return 'status--gray'
  if (roas >= 4) return 'status--green'
  if (roas >= 3) return 'status--teal'
  if (roas >= 1) return 'status--orange'
  return 'status--red'
}

function statusIcon(roas: number) {
  if (!roas) return 'fa-solid fa-circle-minus'
  if (roas >= 4) return 'fa-solid fa-circle-check'
  if (roas >= 3) return 'fa-solid fa-arrow-trend-up'
  if (roas >= 1) return 'fa-solid fa-triangle-exclamation'
  return 'fa-solid fa-circle-xmark'
}

function statusLabel(roas: number) {
  if (!roas) return 'Sin datos'
  if (roas >= 4) return 'En objetivo'
  if (roas >= 3) return 'Cerca del objetivo'
  if (roas >= 1) return 'En riesgo'
  return 'Crítico'
}

function go(id: string) {
  router.push({ name: 'TraffickerWorkspace', params: { workspaceId: id } })
}

function prevMonth() {
  if (currentMonth.value === 1) { currentMonth.value = 12; currentYear.value-- }
  else currentMonth.value--
  load()
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 12) { currentMonth.value = 1; currentYear.value++ }
  else currentMonth.value++
  load()
}

// ── Billing + Meta spend cache (5 min TTL) ────────────────
interface CachedBilling { revenue: number; onlineRevenue: number; spend: number; roas: number; ts: number }
const billingCache = new Map<string, CachedBilling>()
const CACHE_TTL = 5 * 60 * 1000

async function getCachedBilling(wsId: string, year: number, month: number) {
  const key = `${wsId}:${year}:${month}`
  const hit = billingCache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit

  let revenue = 0, onlineRevenue = 0, spend = 0, roas = 0
  try {
    if (wsId === BOLONCITY_WS_ID) {
      const [salesData, billingData] = await Promise.all([
        salesSummaryService.getMonthData(wsId, year, month),
        billingService.getMonthData(wsId, year, month),
      ])
      revenue = salesData.totalBilled ?? 0
      spend = (billingData.days ?? []).reduce((s: number, d: any) => s + (d.totalMetaSpend ?? 0), 0)
      onlineRevenue = (billingData.days ?? []).reduce((s: number, d: any) => s + (d.totalOnlineRevenue ?? 0), 0)
      roas = spend > 0 ? revenue / spend : 0
    } else {
      const data = await billingService.getMonthData(wsId, year, month)
      const days = data.days ?? []
      revenue = days.reduce((s: number, d: any) => s + (d.totalAmount ?? 0), 0)
      onlineRevenue = days.reduce((s: number, d: any) => s + (d.totalOnlineRevenue ?? 0), 0)
      spend = days.reduce((s: number, d: any) => s + (d.totalMetaSpend ?? 0), 0)
      roas = spend > 0 ? revenue / spend : 0
    }
  } catch {}

  const entry: CachedBilling = { revenue, onlineRevenue, spend, roas, ts: Date.now() }
  billingCache.set(key, entry)
  return entry
}

async function fetchAllWorkspaces(search?: string) {
  const all: any[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const res = await workspaceService.listWorkspaces({ limit: 50, page, search: search || undefined })
    all.push(...res.workspaces)
    hasMore = res.metadata?.hasMore ?? false
    page++
  }
  return all
}

async function load(search?: string) {
  isLoading.value = true
  try {
    const workspaces = await fetchAllWorkspaces(search)

    // ① Show cached data instantly (no skeleton for returning visits)
    const fromCache = workspaces.map((ws: any) => {
      const key = `${ws._id}:${currentYear.value}:${currentMonth.value}`
      const hit = billingCache.get(key)
      if (hit && Date.now() - hit.ts < CACHE_TTL) {
        return { id: ws._id, name: ws.name, metaConnected: !!(ws.metaAds?.pageId), ...hit } as Card
      }
      return null
    }).filter(Boolean) as Card[]

    if (fromCache.length === workspaces.length) {
      cards.value = fromCache
      isLoading.value = false
    }

    // ② Fetch fresh: billing + real Meta spend in parallel per workspace
    const fresh = await Promise.all(
      workspaces.map(async (ws: any) => {
        try {
          const data = await getCachedBilling(ws._id, currentYear.value, currentMonth.value)
          return { id: ws._id, name: ws.name, metaConnected: !!(ws.metaAds?.pageId), ...data } as Card
        } catch {
          return { id: ws._id, name: ws.name, metaConnected: !!(ws.metaAds?.pageId), roas: 0, revenue: 0, onlineRevenue: 0, spend: 0, ts: 0 } as Card
        }
      })
    )
    cards.value = fresh

    // ③ Background: live Meta spend for workspaces with adAccountId
    workspaces.forEach((ws: any) => {
      if (ws.metaAds?.adAccountId) {
        loadMetaSpend(ws._id, ws.metaAds.adAccountId, currentYear.value, currentMonth.value)
      }
    })
  } catch (e) {
    console.error('TraffickerDashboard load error', e)
  } finally {
    isLoading.value = false
  }
}

let _searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (q) => {
  if (_searchTimer) clearTimeout(_searchTimer)
  _searchTimer = setTimeout(() => load(q.trim() || undefined), 300)
})

onMounted(() => load())
</script>

<style scoped lang="scss">
// ── Root ───────────────────────────────────────────────────
.trf {
  padding: 16px 14px 80px;
  width: 100%;

  @media (min-width: 480px) { padding: 20px 20px 80px; }
  @media (min-width: 640px) { padding: 28px 28px 80px; }
  @media (min-width: 1024px) { padding: 32px 36px 80px; }
}

// ── Header ─────────────────────────────────────────────────
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

// ── Summary strip ──────────────────────────────────────────
.trf__strip {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  background: white;
  border: 1.5px solid rgba($primary, 0.1);
  border-radius: 16px;
  padding: 16px 12px;
  margin-bottom: 28px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);

  &::-webkit-scrollbar { display: none; }

  @media (min-width: 640px) { padding: 20px 16px; }
}

.trf__strip-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 4px 20px;
  flex-shrink: 0;

  @media (min-width: 640px) { padding: 6px 28px; }
}

.trf__strip-label {
  font-size: 10px;
  font-weight: 700;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;

  @media (min-width: 640px) { font-size: 11px; }
}

.trf__strip-val {
  font-size: 22px;
  font-weight: 900;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;

  @media (min-width: 640px) { font-size: 26px; }

  &--green  { color: #16a34a; }
  &--teal   { color: #0891b2; }
  &--orange { color: #d97706; }
  &--red    { color: #dc2626; }
}

.trf__strip-divider {
  width: 1px;
  height: 42px;
  background: rgba($primary, 0.1);
  flex-shrink: 0;
}

// ── Empty ──────────────────────────────────────────────────
.trf__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: $text-secondary;
  text-align: center;

  i  { font-size: 40px; opacity: 0.3; }
  h3 { margin: 0; font-size: 18px; color: $primary-dark; }
  p  { margin: 0; font-size: 14px; max-width: 300px; }
}

// ── Skeleton ───────────────────────────────────────────────
@keyframes sk-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

%sk-pulse {
  background: linear-gradient(90deg, #eef0f3 25%, #e4e6ea 50%, #eef0f3 75%);
  background-size: 1200px 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}

.trf-sk {
  @extend %sk-pulse;
  border-radius: 8px;

  &--avatar   { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
  &--name     { width: 120px; height: 13px; margin-bottom: 6px; }
  &--sub      { width: 80px; height: 10px; }
  &--badge    { width: 58px; height: 42px; border-radius: 12px; flex-shrink: 0; }
  &--metric   { flex: 1; height: 52px; border-radius: 0;
    &:first-child { border-radius: 12px 0 0 12px; }
    &:last-child  { border-radius: 0 12px 12px 0; }
  }
  &--progress { width: 100%; height: 7px; border-radius: 100px; }
  &--footer   { width: 45%; height: 14px; }
}

.trf-sk-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid rgba($primary, 0.06);
  border-left: 5px solid #e5e7eb;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  &__name-area {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__metrics {
    display: flex;
    border: 1px solid rgba($primary, 0.07);
    border-radius: 12px;
    overflow: hidden;
    gap: 1px;
    background: rgba($primary, 0.04);
  }
}

// ── Grid ───────────────────────────────────────────────────
.trf__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 580px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1020px) { grid-template-columns: repeat(3, 1fr); }
}

// ── Card ───────────────────────────────────────────────────
.trf-card {
  background: white;
  border-radius: 16px;
  border: 1.5px solid rgba($primary, 0.09);
  border-left: 5px solid transparent;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }

  // Color variants — vivid left border matches group
  &--green  {
    border-left-color: #16a34a;
    background: linear-gradient(160deg, #f0fdf4 0%, white 55%);
  }
  &--teal   {
    border-left-color: #0891b2;
    background: linear-gradient(160deg, #ecfeff 0%, white 55%);
  }
  &--orange {
    border-left-color: #f97316;
    background: linear-gradient(160deg, #fff7ed 0%, white 55%);
  }
  &--red    {
    border-left-color: #ef4444;
    background: linear-gradient(160deg, #fef2f2 0%, white 55%);
    animation: pulse-shadow 2.5s ease-in-out infinite;
  }
  &--gray   {
    border-left-color: #cbd5e1;
    background: white;
  }
}

@keyframes pulse-shadow {
  0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  50%       { box-shadow: 0 4px 20px rgba(220,38,38,0.18); }
}

// Card top
.trf-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.trf-card__name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.trf-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trf-card__name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: $primary-dark;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.trf-card__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  margin: 0;

  i { font-size: 10px; }

  &.status--green  { color: #16a34a; }
  &.status--teal   { color: #0891b2; }
  &.status--orange { color: #d97706; }
  &.status--red    { color: #dc2626; }
  &.status--gray   { color: #9ca3af; }
}

// ROAS big badge
.trf-card__roas {
  font-size: 26px;
  font-weight: 900;
  padding: 6px 12px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1;

  &.badge--green  { color: #fff;    background: #16a34a; }
  &.badge--teal   { color: #fff;    background: #0891b2; }
  &.badge--orange { color: #fff;    background: #f97316; }
  &.badge--red    { color: #fff;    background: #ef4444; }
  &.badge--gray   { color: #475569; background: #e2e8f0; }
}

// Metrics
.trf-card__metrics {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: rgba($primary, 0.03);
  border: 1px solid rgba($primary, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.trf-card__metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex: 1;

  &--revenue .trf-card__metric-icon { color: #16a34a; background: #dcfce7; }
  &--online  .trf-card__metric-icon { color: #6366f1; background: #e0e7ff; }
  &--spend   .trf-card__metric-icon { color: #1877f2; background: rgba(#1877f2, 0.1); }
}

.trf-card__metric-sep {
  width: 1px;
  background: rgba($primary, 0.1);
  margin: 8px 0;
  flex-shrink: 0;
}

.trf-card__metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  background: rgba($primary, 0.08);
  color: $primary;
}

.trf-card__metric-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.trf-card__metric-val {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: $primary-dark;
  font-variant-numeric: tabular-nums;
}

// Progress
.trf-card__progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trf-card__progress-track {
  height: 7px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

.trf-card__progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &.badge--green  { background: #16a34a; }
  &.badge--teal   { background: #0891b2; }
  &.badge--orange { background: #f97316; }
  &.badge--red    { background: #ef4444; }
  &.badge--gray   { background: #cbd5e1; }
}

.trf-card__progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trf-card__progress-ratio {
  font-size: 11px;
  color: $text-secondary;
  font-weight: 500;
}

.trf-card__meta-dot {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  color: #1877f2;
  background: rgba(#1877f2, 0.08);
  padding: 2px 6px;
  border-radius: 100px;
}

// Action buttons
.trf-card__actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba($primary, 0.07);
}

.trf-card__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.14s;
  border: 1.5px solid rgba($primary, 0.18);
  background: white;
  color: $primary-dark;

  i { font-size: 11px; }

  &:hover { background: rgba($primary, 0.07); border-color: $primary; }

  &--primary {
    background: $primary;
    color: white;
    border-color: $primary;

    &:hover { background: darken($primary, 8%); }
  }

  &--remind {
    border-color: rgba(#d97706, 0.3);
    color: #b45309;

    &:hover:not(:disabled) {
      background: rgba(#d97706, 0.08);
      border-color: #d97706;
    }
  }

  &--reminding {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--reminded {
    background: rgba(#16a34a, 0.08);
    border-color: #16a34a;
    color: #15803d;
    cursor: default;
  }
}

// ── Groups ─────────────────────────────────────────────────
.trf__groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trf__group {
  border-radius: 18px;
  border: 1.5px solid;
  overflow: hidden;
  transition: box-shadow 0.18s;

  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  &--red    { border-color: #ef4444; background: rgba(#ef4444, 0.04); }
  &--orange { border-color: #f97316; background: rgba(#f97316, 0.04); }
  &--amber  { border-color: #f59e0b; background: rgba(#f59e0b, 0.04); }
  &--green  { border-color: #16a34a; background: rgba(#16a34a, 0.04); }
  &--blue   { border-color: #2563eb; background: rgba(#2563eb, 0.04); }
  &--gray   { border-color: #e2e8f0; background: white; }
}

.trf__group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  @media (min-width: 640px) { gap: 14px; padding: 16px 20px; }

  &:hover  { background: rgba(0,0,0,0.025); }
  &:active { background: rgba(0,0,0,0.05); }
}

.trf__group-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;

  .trf__group--red &    { background: #ef4444; color: #fff; }
  .trf__group--orange & { background: #f97316; color: #fff; }
  .trf__group--amber &  { background: #f59e0b; color: #fff; }
  .trf__group--green &  { background: #16a34a; color: #fff; }
  .trf__group--blue &   { background: #2563eb; color: #fff; }
  .trf__group--gray &   { background: #94a3b8; color: #fff; }
}

.trf__group-meta {
  flex: 1;
  min-width: 0;
}

.trf__group-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: $primary-dark;
  margin-bottom: 2px;

  .trf__group--red &    { color: #dc2626; }
  .trf__group--orange & { color: #c2410c; }
  .trf__group--amber &  { color: #b45309; }
  .trf__group--green &  { color: #15803d; }
  .trf__group--blue &   { color: #1d4ed8; }
}

.trf__group-desc {
  display: none;
  font-size: 12px;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 420px) { display: block; }
}

.trf__group-count {
  min-width: 30px;
  height: 30px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  padding: 0 9px;
  flex-shrink: 0;

  .trf__group--red &    { background: #ef4444; color: #fff; }
  .trf__group--orange & { background: #f97316; color: #fff; }
  .trf__group--amber &  { background: #f59e0b; color: #fff; }
  .trf__group--green &  { background: #16a34a; color: #fff; }
  .trf__group--blue &   { background: #2563eb; color: #fff; }
  .trf__group--gray &   { background: #94a3b8; color: #fff; }
}

.trf__group-caret {
  font-size: 12px;
  color: $text-secondary;
  transition: transform 0.25s;
  flex-shrink: 0;

  &.open { transform: rotate(180deg); }
}

.trf__group-grid {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  gap: 10px;
  padding: 0 12px 14px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.12) transparent;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }

  > .trf-card {
    flex: 0 0 280px;
    scroll-snap-align: start;
  }

  @media (min-width: 480px)  { padding: 0 16px 16px; > .trf-card { flex: 0 0 300px; } }
  @media (min-width: 580px)  {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    overflow-x: unset;
    > .trf-card { flex: unset; }
  }
  @media (min-width: 1020px) { grid-template-columns: repeat(3, 1fr); }
}

// ── Filter tabs ────────────────────────────────────────────
// ── Search ─────────────────────────────────────────────────
.trf__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.trf__search-icon {
  position: absolute;
  left: 14px;
  color: $text-secondary;
  font-size: 13px;
  pointer-events: none;
}

.trf__search-input {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 36px;
  border-radius: 100px;
  border: 1.5px solid rgba($primary, 0.15);
  background: white;
  font-size: 14px;
  color: $primary-dark;
  outline: none;
  transition: border-color 0.14s;
  -webkit-appearance: none;

  &::placeholder { color: $text-secondary; }
  &:focus { border-color: rgba($primary, 0.4); }

  &::-webkit-search-cancel-button { display: none; }
}

.trf__search-clear {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 100px;
  border: none;
  background: rgba($primary, 0.08);
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;

  &:hover { background: rgba($primary, 0.15); color: $primary-dark; }
}

// ── Filter tabs ────────────────────────────────────────────
.trf__filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.trf__filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid rgba($primary, 0.15);
  background: white;
  color: $text-secondary;
  transition: all 0.14s;

  i { font-size: 11px; }

  &:hover { background: rgba($primary, 0.05); color: $primary-dark; border-color: rgba($primary, 0.3); }

  &--active {
    background: $primary;
    color: white;
    border-color: $primary;

    .trf__filter-tab-count { background: rgba(255,255,255,0.25); color: #fff; }
  }
}

.trf__filter-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 100px;
  background: rgba($primary, 0.1);
  color: $primary-dark;
  font-size: 11px;
  font-weight: 900;
}

// ── ROAS label below badge ─────────────────────────────────
.trf-card__roas-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.trf-card__roas-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.3px;
  white-space: nowrap;

  &--red    { color: #dc2626; }
  &--orange { color: #d97706; }
  &--green  { color: #16a34a; }
  &--gray   { color: #9ca3af; }
}

// ── Card billing/ads badges ────────────────────────────────
.trf-card__badges {
  display: flex;
  gap: 5px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.trf-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 100px;
  letter-spacing: 0.2px;

  i { font-size: 9px; }

  &--ok      { background: #dcfce7; color: #15803d; }
  &--missing { background: #fee2e2; color: #dc2626; }
  &--neutral { background: #f1f5f9; color: #64748b; }
}

// ── Remind-all button ─────────────────────────────────────
.trf__remind-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid rgba(#d97706, 0.4);
  background: rgba(#d97706, 0.06);
  color: #b45309;
  transition: all 0.14s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(#d97706, 0.14);
    border-color: #d97706;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--active {
    border-color: $primary;
    background: rgba($primary, 0.06);
    color: $primary-dark;
  }
}

.trf__remind-all-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #d97706;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.trf__remind-all-done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #15803d;

  i { font-size: 11px; }
}
</style>
