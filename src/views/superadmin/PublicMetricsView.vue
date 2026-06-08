<template>
  <div class="pub-metrics">
    <div class="pub-metrics__header">
      <div>
        <h2 class="pub-metrics__title">Métricas Públicas</h2>
        <p class="pub-metrics__subtitle">
          Vista consolidada de todos los workspaces — Meta spend, facturación y ROAS del día.
        </p>
      </div>
      <div class="pub-metrics__header-actions">
        <input
          v-model="filterText"
          class="pub-metrics__search"
          placeholder="Buscar workspace..."
          type="text"
        />
        <button class="pub-metrics__btn pub-metrics__btn--primary" :disabled="isLoading" @click="loadData">
          <i class="fa-solid fa-rotate" />
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="!apiKey" class="pub-metrics__no-key">
      <i class="fa-solid fa-key" />
      <div>
        <strong>API key requerida.</strong>
        <p>
          <router-link :to="{ name: 'SuperadminApiKeys' }">Genera tu API key</router-link>
          y vuelve aquí, o pégala directamente:
        </p>
        <div class="pub-metrics__key-paste">
          <input
            v-model="pastedKey"
            class="pub-metrics__key-input"
            placeholder="bkn_xxxxxxxx..."
            type="text"
          />
          <button class="pub-metrics__btn pub-metrics__btn--primary" @click="usePastedKey">
            Usar
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="pub-metrics__summary">
        <div class="pub-metrics__summary-card">
          <div class="pub-metrics__summary-icon pub-metrics__summary-icon--spend">
            <i class="fa-brands fa-meta" />
          </div>
          <div>
            <div class="pub-metrics__summary-value">${{ fmt(totalSpend) }}</div>
            <div class="pub-metrics__summary-label">Gasto Meta hoy</div>
          </div>
        </div>
        <div class="pub-metrics__summary-card">
          <div class="pub-metrics__summary-icon pub-metrics__summary-icon--billing">
            <i class="fa-solid fa-money-bill-wave" />
          </div>
          <div>
            <div class="pub-metrics__summary-value">${{ fmt(totalBilling) }}</div>
            <div class="pub-metrics__summary-label">Facturación hoy</div>
          </div>
        </div>
        <div class="pub-metrics__summary-card">
          <div class="pub-metrics__summary-icon pub-metrics__summary-icon--roas">
            <i class="fa-solid fa-chart-line" />
          </div>
          <div>
            <div class="pub-metrics__summary-value">{{ avgROAS.toFixed(2) }}x</div>
            <div class="pub-metrics__summary-label">ROAS promedio</div>
          </div>
        </div>
        <div class="pub-metrics__summary-card pub-metrics__summary-card--alert">
          <div class="pub-metrics__summary-icon pub-metrics__summary-icon--alert">
            <i class="fa-solid fa-triangle-exclamation" />
          </div>
          <div>
            <div class="pub-metrics__summary-value">{{ alertCount }}</div>
            <div class="pub-metrics__summary-label">Sin billing ayer</div>
          </div>
        </div>
      </div>

      <!-- Alerts section -->
      <div v-if="missingBilling.length > 0" class="pub-metrics__alerts-bar">
        <i class="fa-solid fa-bell" />
        <strong>Sin facturación de ayer:</strong>
        <span v-for="ws in missingBilling" :key="ws.workspaceId" class="pub-metrics__alert-chip">
          {{ ws.name }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="pub-metrics__loading">
        <div class="pub-metrics__spinner" />
        <span>Cargando métricas...</span>
      </div>

      <!-- Table -->
      <div v-else class="pub-metrics__table-wrap">
        <table class="pub-metrics__table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Meta Ads</th>
              <th>Gasto hoy</th>
              <th>Billing hoy</th>
              <th>ROAS</th>
              <th>Billing mes</th>
              <th>Spend mes</th>
              <th>Ayer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredWorkspaces.length === 0">
              <td colspan="8" class="pub-metrics__empty-row">Sin resultados</td>
            </tr>
            <tr
              v-for="ws in filteredWorkspaces"
              :key="ws.workspaceId"
              :class="{ 'pub-metrics__row--alert': !ws.hasBillingYesterday }"
            >
              <td>
                <div class="pub-metrics__ws-name">
                  {{ ws.name }}
                  <span
                    class="pub-metrics__status-dot"
                    :class="ws.isActive ? 'pub-metrics__status-dot--active' : 'pub-metrics__status-dot--inactive'"
                  />
                </div>
              </td>
              <td>
                <span v-if="ws.metaAds?.connected" class="pub-metrics__chip pub-metrics__chip--green">
                  <i class="fa-solid fa-circle-check" /> Conectado
                </span>
                <span v-else class="pub-metrics__chip pub-metrics__chip--gray">
                  Sin cuenta
                </span>
              </td>
              <td>${{ fmt(ws.today?.totalMetaSpend ?? 0) }}</td>
              <td>
                <span v-if="(ws.today?.totalBilling ?? 0) > 0" class="pub-metrics__chip pub-metrics__chip--blue">
                  ${{ fmt(ws.today?.totalBilling ?? 0) }}
                </span>
                <span v-else class="pub-metrics__chip pub-metrics__chip--gray">—</span>
              </td>
              <td>
                <span
                  v-if="(ws.today?.avgROAS ?? 0) > 0"
                  class="pub-metrics__roas"
                  :class="roasClass(ws.today?.avgROAS ?? 0)"
                >
                  {{ (ws.today?.avgROAS ?? 0).toFixed(2) }}x
                </span>
                <span v-else class="pub-metrics__chip pub-metrics__chip--gray">—</span>
              </td>
              <td>${{ fmt(ws.month?.totalBilling ?? 0) }}</td>
              <td>${{ fmt(ws.month?.totalMetaSpend ?? 0) }}</td>
              <td>
                <span
                  class="pub-metrics__chip"
                  :class="ws.hasBillingYesterday ? 'pub-metrics__chip--green' : 'pub-metrics__chip--red'"
                >
                  <i :class="ws.hasBillingYesterday ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
                  {{ ws.hasBillingYesterday ? 'OK' : 'Falta' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pub-metrics__pagination">
        <button
          class="pub-metrics__btn pub-metrics__btn--outline"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <i class="fa-solid fa-chevron-left" />
        </button>
        <span>{{ currentPage }} / {{ pagination.totalPages }}</span>
        <button
          class="pub-metrics__btn pub-metrics__btn--outline"
          :disabled="currentPage === pagination.totalPages"
          @click="changePage(currentPage + 1)"
        >
          <i class="fa-solid fa-chevron-right" />
        </button>
      </div>
    </template>

    <div v-if="error" class="pub-metrics__error">
      <i class="fa-solid fa-circle-exclamation" />
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { superadminApiService } from '../../services/superadminApi.service'

const isLoading = ref(false)
const error = ref<string | null>(null)
const filterText = ref('')
const currentPage = ref(1)
const pageSize = 50
const pastedKey = ref('')

const apiKey = ref<string | null>(null)
const workspaces = ref<any[]>([])
const missingBilling = ref<any[]>([])
const pagination = ref({ page: 1, limit: pageSize, total: 0, totalPages: 1 })

onMounted(async () => {
  const stored = localStorage.getItem('superadmin_api_key')
  if (stored) {
    apiKey.value = stored
    await loadData()
  }
})

function usePastedKey() {
  const k = pastedKey.value.trim()
  if (!k) return
  localStorage.setItem('superadmin_api_key', k)
  apiKey.value = k
  loadData()
}

async function loadData() {
  if (!apiKey.value) return
  isLoading.value = true
  error.value = null
  try {
    const [metricsRes, alertsRes] = await Promise.all([
      superadminApiService.getPublicMetrics(apiKey.value, { page: currentPage.value, limit: pageSize }),
      superadminApiService.getBillingAlerts(apiKey.value),
    ])
    workspaces.value = metricsRes.data ?? []
    pagination.value = metricsRes.pagination ?? pagination.value
    missingBilling.value = alertsRes.missing ?? []
  } catch (e: any) {
    error.value = e.message || 'Error al cargar métricas'
  } finally {
    isLoading.value = false
  }
}

async function changePage(page: number) {
  currentPage.value = page
  await loadData()
}

const filteredWorkspaces = computed(() => {
  const q = filterText.value.toLowerCase()
  if (!q) return workspaces.value
  return workspaces.value.filter((ws) => ws.name?.toLowerCase().includes(q))
})

const totalSpend = computed(() =>
  workspaces.value.reduce((s, ws) => s + (ws.today?.totalMetaSpend ?? 0), 0),
)
const totalBilling = computed(() =>
  workspaces.value.reduce((s, ws) => s + (ws.today?.totalBilling ?? 0), 0),
)
const avgROAS = computed(() => {
  const ws = workspaces.value.filter((w) => (w.today?.avgROAS ?? 0) > 0)
  if (!ws.length) return 0
  return ws.reduce((s, w) => s + (w.today?.avgROAS ?? 0), 0) / ws.length
})
const alertCount = computed(() => missingBilling.value.length)

function fmt(n: number) {
  return n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function roasClass(roas: number) {
  if (roas >= 3) return 'pub-metrics__roas--good'
  if (roas >= 1.5) return 'pub-metrics__roas--ok'
  return 'pub-metrics__roas--low'
}
</script>

<style lang="scss" scoped>
.pub-metrics {
  padding: 32px 24px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary, #1a1a2e);
    margin: 0 0 6px;
  }

  &__subtitle {
    font-size: 14px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;
  }

  &__header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  &__key-paste {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  &__key-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 13px;
    font-family: monospace;
    outline: none;
    background: #fff;

    &:focus {
      border-color: #f59e0b;
    }
  }

  &__search {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    width: 220px;
    outline: none;

    &:focus {
      border-color: #4f46e5;
    }
  }

  &__no-key {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 20px;
    font-size: 14px;
    color: #92400e;

    i {
      font-size: 22px;
      color: #f59e0b;
      margin-top: 2px;
    }

    p {
      margin: 4px 0 0;
    }

    a {
      color: #4f46e5;
      font-weight: 600;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  &__summary-card {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;

    &--alert {
      border-color: #fca5a5;
      background: #fff5f5;
    }
  }

  &__summary-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;

    &--spend {
      background: #ede9fe;
      color: #7c3aed;
    }

    &--billing {
      background: #dcfce7;
      color: #16a34a;
    }

    &--roas {
      background: #dbeafe;
      color: #2563eb;
    }

    &--alert {
      background: #fee2e2;
      color: #dc2626;
    }
  }

  &__summary-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary, #1a1a2e);
    line-height: 1.2;
  }

  &__summary-label {
    font-size: 12px;
    color: var(--color-text-secondary, #6b7280);
    margin-top: 2px;
  }

  &__alerts-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    color: #9a3412;
    margin-bottom: 16px;

    i {
      color: #f97316;
    }
  }

  &__alert-chip {
    background: #fed7aa;
    color: #9a3412;
    border-radius: 20px;
    padding: 2px 9px;
    font-size: 12px;
    font-weight: 500;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 32px 0;
    color: var(--color-text-secondary, #6b7280);
    font-size: 14px;
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    thead tr {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      padding: 11px 14px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f3f4f6;
      color: var(--color-text-primary, #1a1a2e);
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover td {
      background: #f9fafb;
    }
  }

  &__row--alert td {
    background: #fff9f9 !important;
  }

  &__ws-name {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 500;
  }

  &__status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--active {
      background: #22c55e;
    }

    &--inactive {
      background: #d1d5db;
    }
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    &--green {
      background: #dcfce7;
      color: #16a34a;
    }

    &--blue {
      background: #dbeafe;
      color: #2563eb;
    }

    &--red {
      background: #fee2e2;
      color: #dc2626;
    }

    &--gray {
      background: #f3f4f6;
      color: #9ca3af;
    }
  }

  &__roas {
    font-weight: 700;
    font-size: 13px;

    &--good {
      color: #16a34a;
    }

    &--ok {
      color: #d97706;
    }

    &--low {
      color: #dc2626;
    }
  }

  &__empty-row {
    text-align: center;
    color: #9ca3af;
    padding: 32px !important;
  }

  &__pagination {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
    font-size: 14px;
    color: var(--color-text-secondary, #6b7280);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, background 0.15s;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--primary {
      background: #4f46e5;
      color: #fff;

      &:not(:disabled):hover {
        background: #4338ca;
      }
    }

    &--outline {
      background: #fff;
      color: #374151;
      border: 1px solid #e5e7eb;

      &:not(:disabled):hover {
        background: #f9fafb;
      }
    }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    margin-top: 12px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
