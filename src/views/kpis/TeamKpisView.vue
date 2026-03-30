<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { teamKpiService, type TeamKpiRecord, type KpiUser, type UpsertKpiPayload, type KpiRoleType } from '@/services/teamKpi.service'
import { visitLogService, type VisitLog, type VisitLogUser, type VisitLogWorkspace } from '@/services/visitLog.service'
import { workspaceService } from '@/services/workspace.service'
import KpiEditorForm from '@/components/kpi/KpiEditorForm.vue'
import KpiProducerForm from '@/components/kpi/KpiProducerForm.vue'
import KpiContentForm from '@/components/kpi/KpiContentForm.vue'
import VisitLogModal from '@/components/kpi/VisitLogModal.vue'

const userStore = useUserStore()

// ── Month navigation ───────────────────────────────────────────
const now = new Date()
const currentDate = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const currentMonthKey = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = String(currentDate.value.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

const currentMonthLabel = computed(() =>
  currentDate.value.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
)

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
  fetchAll()
}

function nextMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
  fetchAll()
}

// ── Tabs ───────────────────────────────────────────────────────
type TabKey = 'editor' | 'asistente_produccion' | 'content'
const activeTab = ref<TabKey>('editor')

const tabs: { key: TabKey; label: string; icon: string; color: string }[] = [
  { key: 'editor', label: 'Editor', icon: 'fa-solid fa-film', color: '#6366f1' },
  { key: 'asistente_produccion', label: 'Asistente Producción', icon: 'fa-solid fa-video', color: '#f59e0b' },
  { key: 'content', label: 'Content', icon: 'fa-solid fa-pen-nib', color: '#22c55e' },
]

// ── Data ───────────────────────────────────────────────────────
const loading = ref(false)
const records = ref<TeamKpiRecord[]>([])
const eligibleUsers = ref<KpiUser[]>([])
const visitLogs = ref<VisitLog[]>([])
const workspaces = ref<{ _id: string; name: string }[]>([])

// ── Edit state ──────────────────────────────────────────────────
const editingUserId = ref<string | null>(null)
const saving = ref(false)

// ── Visit log state ─────────────────────────────────────────────
const showVisitModal = ref(false)
const savingVisit = ref(false)
const expandedVisitUserId = ref<string | null>(null)

// ── Permissions ─────────────────────────────────────────────────
const canWrite = computed(() =>
  userStore.role === 'superadmin' ||
  ['editor', 'director'].includes(userStore.internalRole || '')
)

// Can log visits: the producer themselves, PM, director, superadmin
const canLogVisit = computed(() =>
  userStore.role === 'superadmin' ||
  ['director', 'asistente_produccion', 'productor'].includes(userStore.internalRole || '')
)

// ── Computed filtered records for current tab ──────────────────
const tabRecords = computed(() =>
  records.value.filter(r => r.roleType === activeTab.value)
)

const usersForTab = computed((): KpiUser[] => {
  const roleMap: Record<TabKey, string[]> = {
    editor: ['editor'],
    asistente_produccion: ['asistente_produccion', 'productor'],
    content: ['content_manager', 'community_manager'],
  }
  const allowed = roleMap[activeTab.value]
  return eligibleUsers.value.filter(u => allowed.includes(u.internalRole))
})

function recordFor(userId: string): TeamKpiRecord | null {
  return records.value.find(r => r.userId === userId && r.roleType === activeTab.value) ?? null
}

// ── Visit log helpers ──────────────────────────────────────────
function visitLogsFor(userId: string): VisitLog[] {
  return visitLogs.value.filter(v => {
    const pId = typeof v.producerId === 'object' ? (v.producerId as VisitLogUser)._id : v.producerId
    return pId === userId
  })
}

function workspaceName(ws: string | VisitLogWorkspace): string {
  if (typeof ws === 'object') return (ws as VisitLogWorkspace).name
  return ws
}

function attendeeNames(attendees: (string | VisitLogUser)[]): string {
  return attendees
    .map(a => (typeof a === 'object' ? (a as VisitLogUser).name : a))
    .join(', ')
}

function formatVisitDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Score helpers ──────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 95) return '#22c55e'
  if (score >= 80) return '#f59e0b'
  return '#ef4444'
}

function scoreIcon(score: number): string {
  if (score >= 95) return 'fa-solid fa-circle-check'
  if (score >= 80) return 'fa-solid fa-circle-exclamation'
  return 'fa-solid fa-circle-xmark'
}

function scoreLabel(score: number): string {
  if (score >= 95) return 'Óptimo'
  if (score >= 80) return 'Aceptable'
  return 'Bajo'
}

// ── Data fetching ──────────────────────────────────────────────
async function fetchWorkspaces() {
  try {
    const res = await workspaceService.listWorkspaces({ limit: 200 })
    workspaces.value = (res.workspaces || []).map((w: { _id: string; name: string }) => ({
      _id: w._id,
      name: w.name,
    }))
  } catch {
    // non-critical
  }
}

async function fetchAll() {
  loading.value = true
  try {
    const [kpiRes, usersRes, visitRes] = await Promise.all([
      teamKpiService.getTeamKpis(currentMonthKey.value),
      teamKpiService.getKpiEligibleUsers(),
      visitLogService.getVisitLogs(currentMonthKey.value),
    ])
    records.value = kpiRes.records
    eligibleUsers.value = usersRes.users
    visitLogs.value = visitRes.logs
  } catch (err) {
    console.error('fetchAll KPIs error:', err)
  } finally {
    loading.value = false
  }
}

async function handleSave(userId: string, roleType: KpiRoleType, payload: Partial<TeamKpiRecord>) {
  saving.value = true
  try {
    const upsertPayload: UpsertKpiPayload = {
      userId,
      month: currentMonthKey.value,
      roleType,
      ...payload,
    }
    const res = await teamKpiService.upsertTeamKpi(upsertPayload)
    const idx = records.value.findIndex(r => r.userId === userId && r.roleType === roleType)
    if (idx >= 0) {
      records.value[idx] = res.record
    } else {
      records.value.push(res.record)
    }
    editingUserId.value = null
  } catch (err) {
    console.error('upsertTeamKpi error:', err)
  } finally {
    saving.value = false
  }
}

async function handleSaveVisit(payload: { workspaceId: string; visitDate: string; attendees: string[]; notes: string }) {
  savingVisit.value = true
  try {
    const res = await visitLogService.createVisitLog(payload)
    visitLogs.value.unshift(res.log)
    showVisitModal.value = false
    // Expand logs for the current user
    const myId = userStore.id
    if (myId) expandedVisitUserId.value = myId
  } catch (err) {
    console.error('createVisitLog error:', err)
  } finally {
    savingVisit.value = false
  }
}

async function handleDeleteVisit(logId: string) {
  if (!confirm('¿Eliminar este registro de visita?')) return
  try {
    await visitLogService.deleteVisitLog(logId)
    visitLogs.value = visitLogs.value.filter(v => v._id !== logId)
  } catch (err) {
    console.error('deleteVisitLog error:', err)
  }
}

onMounted(() => {
  fetchAll()
  fetchWorkspaces()
})
</script>

<template>
  <div class="tkv">
    <!-- ── Page Header ─────────────────────────────────────── -->
    <div class="tkv__header">
      <div class="tkv__header-left">
        <div class="tkv__header-icon">
          <i class="fa-solid fa-chart-bar" />
        </div>
        <div>
          <h1 class="tkv__title">KPIs del Equipo</h1>
          <p class="tkv__subtitle">Evaluación mensual de rendimiento por rol</p>
        </div>
      </div>

      <div class="tkv__header-right">
        <!-- Log visit button (producer / director / superadmin) -->
        <button
          v-if="canLogVisit && activeTab === 'asistente_produccion'"
          class="tkv__log-btn"
          type="button"
          @click="showVisitModal = true"
        >
          <i class="fa-solid fa-map-pin" />
          Registrar visita
        </button>

        <!-- Month Navigator -->
        <div class="tkv__month-nav">
          <button class="tkv__month-btn" type="button" @click="prevMonth">
            <i class="fa-solid fa-chevron-left" />
          </button>
          <span class="tkv__month-label">{{ currentMonthLabel }}</span>
          <button class="tkv__month-btn" type="button" @click="nextMonth">
            <i class="fa-solid fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────── -->
    <div class="tkv__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tkv__tab"
        :class="{ 'tkv__tab--active': activeTab === tab.key }"
        :style="activeTab === tab.key ? { '--tab-color': tab.color } : {}"
        type="button"
        @click="activeTab = tab.key; editingUserId = null"
      >
        <i :class="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ── Loading ──────────────────────────────────────────── -->
    <div v-if="loading" class="tkv__loading">
      <div class="tkv__spinner" />
      <span>Cargando métricas...</span>
    </div>

    <!-- ── Content ──────────────────────────────────────────── -->
    <div v-else class="tkv__body">

      <!-- Empty state -->
      <div v-if="usersForTab.length === 0" class="tkv__empty">
        <i class="fa-solid fa-users-slash" />
        <p>No hay usuarios asignados a este rol.</p>
      </div>

      <!-- User cards -->
      <div v-else class="tkv__cards">
        <div
          v-for="user in usersForTab"
          :key="user._id"
          class="tkv__card"
        >
          <!-- Card Header -->
          <div class="tkv__card-header">
            <div class="tkv__card-avatar">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="tkv__card-info">
              <span class="tkv__card-name">{{ user.name }}</span>
              <span class="tkv__card-role">{{ user.internalRole.replace(/_/g, ' ') }}</span>
            </div>

            <!-- Score badge -->
            <div
              v-if="recordFor(user._id)"
              class="tkv__score-badge"
              :style="{ background: scoreColor(recordFor(user._id)!.performanceScore) + '18', color: scoreColor(recordFor(user._id)!.performanceScore), border: '1.5px solid ' + scoreColor(recordFor(user._id)!.performanceScore) + '40' }"
            >
              <i :class="scoreIcon(recordFor(user._id)!.performanceScore)" />
              {{ recordFor(user._id)!.performanceScore }}%
              <span>{{ scoreLabel(recordFor(user._id)!.performanceScore) }}</span>
            </div>
            <div v-else class="tkv__score-badge tkv__score-badge--empty">
              <i class="fa-solid fa-dash" />
              Sin datos
            </div>

            <!-- Visit log toggle (producer tab only) -->
            <button
              v-if="activeTab === 'asistente_produccion'"
              class="tkv__visit-toggle"
              type="button"
              :class="{ 'tkv__visit-toggle--active': expandedVisitUserId === user._id }"
              @click="expandedVisitUserId = expandedVisitUserId === user._id ? null : user._id"
            >
              <i class="fa-solid fa-map-location-dot" />
              {{ visitLogsFor(user._id).length }} visita{{ visitLogsFor(user._id).length !== 1 ? 's' : '' }}
              <i :class="expandedVisitUserId === user._id ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" style="font-size:0.65rem" />
            </button>

            <!-- Edit button: only for write roles -->
            <button
              v-if="canWrite"
              class="tkv__edit-btn"
              type="button"
              :class="{ 'tkv__edit-btn--active': editingUserId === user._id }"
              @click="editingUserId = editingUserId === user._id ? null : user._id"
            >
              <i :class="editingUserId === user._id ? 'fa-solid fa-xmark' : 'fa-solid fa-pen'" />
              {{ editingUserId === user._id ? 'Cancelar' : 'Editar' }}
            </button>
          </div>

          <!-- Metrics summary row (read mode) -->
          <div v-if="editingUserId !== user._id && recordFor(user._id)" class="tkv__metrics">
            <template v-if="activeTab === 'editor'">
              <div class="tkv__metric">
                <span>Meta</span>
                <strong>{{ recordFor(user._id)!.targetVideos ?? '—' }} videos</strong>
              </div>
              <div class="tkv__metric">
                <span>Entregados</span>
                <strong>{{ recordFor(user._id)!.deliveredVideos ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Devueltos</span>
                <strong>{{ recordFor(user._id)!.returnedVideos ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Urgencias</span>
                <strong>{{ recordFor(user._id)!.urgencies ?? '—' }}</strong>
              </div>
            </template>

            <template v-else-if="activeTab === 'asistente_produccion'">
              <div class="tkv__metric">
                <span>Visitas Meta</span>
                <strong>{{ recordFor(user._id)!.targetVisits ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Registradas</span>
                <strong :style="{ color: '#f59e0b' }">{{ visitLogsFor(user._id).length }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Videos Meta</span>
                <strong>{{ recordFor(user._id)!.targetVideosMade ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Producidos</span>
                <strong>{{ recordFor(user._id)!.videosMade ?? '—' }}</strong>
              </div>
            </template>

            <template v-else>
              <div class="tkv__metric">
                <span>Planes Meta</span>
                <strong>{{ recordFor(user._id)!.targetPlans ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Entregados</span>
                <strong>{{ recordFor(user._id)!.deliveredPlans ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>Completos</span>
                <strong>{{ recordFor(user._id)!.completePlans20 ?? '—' }}</strong>
              </div>
              <div class="tkv__metric">
                <span>A tiempo</span>
                <strong>{{ recordFor(user._id)!.plansOnTime ?? '—' }}</strong>
              </div>
            </template>
          </div>

          <div v-else-if="editingUserId !== user._id" class="tkv__no-data">
            <i class="fa-solid fa-circle-dashed" />
            Sin métricas para este mes
            <button v-if="canWrite" class="tkv__add-btn" type="button" @click="editingUserId = user._id">
              <i class="fa-solid fa-plus" /> Agregar métricas
            </button>
          </div>

          <!-- Inline edit forms -->
          <div v-if="editingUserId === user._id" class="tkv__form-wrapper">
            <KpiEditorForm
              v-if="activeTab === 'editor'"
              :record="recordFor(user._id)"
              :saving="saving"
              @save="(p) => handleSave(user._id, 'editor', p)"
              @cancel="editingUserId = null"
            />
            <KpiProducerForm
              v-else-if="activeTab === 'asistente_produccion'"
              :record="recordFor(user._id)"
              :saving="saving"
              @save="(p) => handleSave(user._id, 'asistente_produccion', p)"
              @cancel="editingUserId = null"
            />
            <KpiContentForm
              v-else
              :record="recordFor(user._id)"
              :saving="saving"
              @save="(p) => handleSave(user._id, 'content', p)"
              @cancel="editingUserId = null"
            />
          </div>

          <!-- ── Visit Log Panel (producer tab) ──────────────── -->
          <div
            v-if="activeTab === 'asistente_produccion' && expandedVisitUserId === user._id"
            class="tkv__visit-panel"
          >
            <div class="tkv__visit-panel-header">
              <i class="fa-solid fa-map-location-dot" />
              Visitas registradas en {{ currentMonthLabel }}
            </div>

            <div v-if="visitLogsFor(user._id).length === 0" class="tkv__visit-empty">
              <i class="fa-solid fa-route" />
              No hay visitas registradas este mes
            </div>

            <div v-else class="tkv__visit-list">
              <div
                v-for="log in visitLogsFor(user._id)"
                :key="log._id"
                class="tkv__visit-item"
              >
                <div class="tkv__visit-item-left">
                  <div class="tkv__visit-date">
                    <i class="fa-regular fa-calendar" />
                    {{ formatVisitDate(log.visitDate) }}
                  </div>
                  <div class="tkv__visit-workspace">
                    <i class="fa-solid fa-building" />
                    {{ workspaceName(log.workspaceId) }}
                  </div>
                  <div class="tkv__visit-attendees">
                    <i class="fa-solid fa-users" />
                    {{ attendeeNames(log.attendees) }}
                  </div>
                  <div v-if="log.notes" class="tkv__visit-notes">
                    <i class="fa-regular fa-note-sticky" />
                    {{ log.notes }}
                  </div>
                </div>
                <button
                  class="tkv__visit-delete"
                  type="button"
                  title="Eliminar visita"
                  @click="handleDeleteVisit(log._id)"
                >
                  <i class="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Summary footer -->
      <div v-if="tabRecords.length > 0" class="tkv__summary">
        <div class="tkv__summary-title">Resumen del mes — {{ currentMonthLabel }}</div>
        <div class="tkv__summary-stats">
          <div class="tkv__summary-stat">
            <span>Promedio del equipo</span>
            <strong>
              {{ (tabRecords.reduce((acc, r) => acc + r.performanceScore, 0) / tabRecords.length).toFixed(1) }}%
            </strong>
          </div>
          <div class="tkv__summary-stat">
            <span>Óptimos (≥95%)</span>
            <strong style="color:#22c55e">{{ tabRecords.filter(r => r.performanceScore >= 95).length }}</strong>
          </div>
          <div class="tkv__summary-stat">
            <span>Aceptables (80-94%)</span>
            <strong style="color:#f59e0b">{{ tabRecords.filter(r => r.performanceScore >= 80 && r.performanceScore < 95).length }}</strong>
          </div>
          <div class="tkv__summary-stat">
            <span>Bajo rendimiento (&lt;80%)</span>
            <strong style="color:#ef4444">{{ tabRecords.filter(r => r.performanceScore < 80).length }}</strong>
          </div>
          <!-- Visit summary for producer tab -->
          <div v-if="activeTab === 'asistente_produccion'" class="tkv__summary-stat">
            <span>Total visitas</span>
            <strong style="color:#f59e0b">{{ visitLogs.length }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Visit Log Modal ─────────────────────────────────── -->
    <VisitLogModal
      v-if="showVisitModal"
      :workspaces="workspaces"
      :team-users="eligibleUsers"
      :saving="savingVisit"
      @save="handleSaveVisit"
      @cancel="showVisitModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.tkv {
  min-height: 100vh;
  background: #f8f7f5;

  // ── Header ───────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 2rem 2.5rem 1.75rem;
    background: $white;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    flex-wrap: wrap;

    @media (max-width: 768px) { padding: 1.5rem 1.25rem; }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__header-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6px 16px rgba(#6366f1, 0.3);
    i { font-size: 1.25rem; color: #fff; }
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__subtitle {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 0;
  }

  // ── Log Visit Button ──────────────────────────────────────────
  &__log-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(#f59e0b, 0.3);
    transition: filter 0.2s;
    &:hover { filter: brightness(1.08); }
    i { font-size: 0.9rem; }
  }

  // ── Month Navigator ───────────────────────────────────────────
  &__month-nav {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba($primary-dark, 0.04);
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 0.4rem 0.6rem;
  }

  &__month-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    color: $primary-dark;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba($primary, 0.08); color: $primary; border-color: rgba($primary, 0.3); }
    i { font-size: 0.75rem; }
  }

  &__month-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: $primary-dark;
    text-transform: capitalize;
    min-width: 140px;
    text-align: center;
  }

  // ── Tabs ─────────────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1.25rem 2.5rem;
    background: $white;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    overflow-x: auto;

    @media (max-width: 768px) { padding: 1rem 1.25rem; }
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    border: 1.5px solid rgba($primary-dark, 0.1);
    background: transparent;
    color: $text-secondary;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover { border-color: rgba($primary, 0.3); color: $primary-dark; }

    &--active {
      background: rgba(var(--tab-color, #{$primary}), 0.08);
      border-color: var(--tab-color, #{$primary});
      color: var(--tab-color, #{$primary});
      font-weight: 700;
    }
  }

  // ── Body ─────────────────────────────────────────────────────
  &__body {
    padding: 1.75rem 2.5rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    @media (max-width: 768px) { padding: 1.25rem; }
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 4rem 2.5rem;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba($primary, 0.2);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 4rem;
    color: $text-secondary;
    font-size: 0.9rem;
    text-align: center;
    i { font-size: 2.5rem; opacity: 0.3; }
  }

  // ── Cards ────────────────────────────────────────────────────
  &__cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__card {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 18px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: box-shadow 0.2s;

    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__card-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary, #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
  }

  &__card-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__card-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__card-role {
    font-size: 0.75rem;
    color: $text-secondary;
    text-transform: capitalize;
  }

  // ── Score Badge ───────────────────────────────────────────────
  &__score-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 700;

    span { font-weight: 500; font-size: 0.72rem; opacity: 0.8; }

    &--empty {
      background: rgba($primary-dark, 0.05);
      color: $text-secondary;
      border: 1.5px solid rgba($primary-dark, 0.1);
    }
  }

  // ── Visit Toggle ──────────────────────────────────────────────
  &__visit-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.8rem;
    border-radius: 8px;
    border: 1.5px solid rgba(#f59e0b, 0.35);
    background: rgba(#f59e0b, 0.05);
    color: #d97706;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: rgba(#f59e0b, 0.1); }
    &--active { background: rgba(#f59e0b, 0.12); border-color: #f59e0b; }
    i { font-size: 0.9rem; }
  }

  // ── Edit Button ───────────────────────────────────────────────
  &__edit-btn {
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    border: 1.5px solid rgba($primary, 0.3);
    background: transparent;
    color: $primary;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s;
    margin-left: auto;

    &:hover { background: rgba($primary, 0.06); }
    &--active { background: rgba(#ef4444, 0.06); color: #dc2626; border-color: rgba(#ef4444, 0.3); }
  }

  // ── Metrics Row ───────────────────────────────────────────────
  &__metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: rgba($primary-dark, 0.02);
    border-radius: 12px;
    border: 1px solid rgba($primary-dark, 0.05);

    @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
  }

  &__metric {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    span {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $text-secondary;
      font-weight: 700;
    }
    strong {
      font-size: 1rem;
      font-weight: 800;
      color: $primary-dark;
    }
  }

  &__no-data {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: $text-secondary;
    font-style: italic;
    padding: 0.5rem 0;
    i { font-size: 1rem; opacity: 0.4; }
  }

  &__add-btn {
    margin-left: auto;
    padding: 0.35rem 0.85rem;
    border-radius: 8px;
    border: 1.5px dashed rgba($primary, 0.4);
    background: transparent;
    color: $primary;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-style: normal;
    transition: all 0.2s;
    &:hover { background: rgba($primary, 0.06); }
  }

  &__form-wrapper {
    background: rgba($primary-dark, 0.02);
    border: 1.5px dashed rgba($primary, 0.2);
    border-radius: 12px;
    padding: 1.25rem;
  }

  // ── Visit Panel ───────────────────────────────────────────────
  &__visit-panel {
    border-top: 1px solid rgba(#f59e0b, 0.2);
    padding-top: 1rem;

    &-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #d97706;
      margin-bottom: 0.85rem;
      i { font-size: 0.9rem; }
    }
  }

  &__visit-empty {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.82rem;
    color: $text-secondary;
    font-style: italic;
    padding: 0.5rem 0;
    i { font-size: 1.1rem; opacity: 0.35; }
  }

  &__visit-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__visit-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 0.9rem;
    background: rgba(#f59e0b, 0.04);
    border: 1px solid rgba(#f59e0b, 0.15);
    border-radius: 10px;

    &-left {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }
  }

  &__visit-date,
  &__visit-workspace,
  &__visit-attendees,
  &__visit-notes {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: $primary-dark;

    i {
      font-size: 0.75rem;
      color: #d97706;
      width: 14px;
      flex-shrink: 0;
    }
  }

  &__visit-date { font-weight: 700; }

  &__visit-attendees {
    color: $text-secondary;
    font-size: 0.78rem;
  }

  &__visit-notes {
    color: $text-secondary;
    font-size: 0.76rem;
    font-style: italic;
  }

  &__visit-delete {
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(#ef4444, 0.2);
    background: transparent;
    color: rgba(#ef4444, 0.5);
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover { background: rgba(#ef4444, 0.06); color: #dc2626; border-color: rgba(#ef4444, 0.4); }
    i { font-size: 0.75rem; }
  }

  // ── Summary ───────────────────────────────────────────────────
  &__summary {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 18px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  &__summary-title {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $text-secondary;
    margin-bottom: 0.85rem;
  }

  &__summary-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    @media (max-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  }

  &__summary-stat {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    span {
      font-size: 0.72rem;
      color: $text-secondary;
    }
    strong {
      font-size: 1.25rem;
      font-weight: 800;
      color: $primary-dark;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
