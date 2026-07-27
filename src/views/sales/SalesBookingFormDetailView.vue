<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { selectedForm } from '@/services/salesExecutiveState'
import { salesExecutiveService } from '@/services/salesExecutive.service'
import DateRangeFilter from '@/components/sales/DateRangeFilter.vue'
import type { SalesBookingForm } from '@/services/salesExecutive.service'

const route = useRoute()
const router = useRouter()
const form = ref<SalesBookingForm | null>(selectedForm.value || null)
const loadingApi = ref(!selectedForm.value)
const loadError = ref('')
const activeTab = ref('overview')
const downloading = ref(false)

watch(() => selectedForm.value, (val) => { if (val) form.value = val }, { immediate: true })

async function loadForm() {
  const id = route.params.formId as string
  if (!id) return
  loadingApi.value = true
  loadError.value = ''
  try {
    form.value = await salesExecutiveService.getBookingFormById(id)
  } catch (err: any) {
    loadError.value = err?.message || 'No pudimos cargar el perfil comercial. Intenta de nuevo.'
    console.error('Error loading form:', err)
  } finally {
    loadingApi.value = false
  }
}

onMounted(() => { if (!selectedForm.value) loadForm() })

const now = new Date()
const nowEC = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now).reduce<Record<string,string>>((r,p) => ({...r,[p.type]:p.value}),{})
const year = Number(nowEC.year)
const month = Number(nowEC.month)
const day = Number(nowEC.day)
const dateRange = ref({ start: new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0], end: new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0] })

const filteredEntries = computed(() => {
  if (!form.value) return []
  const s = new Date(dateRange.value.start + 'T00:00:00')
  const e = new Date(dateRange.value.end + 'T23:59:59')
  return form.value.billing.entries.filter((entry) => {
    const d = new Date(entry.date)
    return d >= s && d <= e
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const totals = computed(() => {
  const revenue = filteredEntries.value.reduce((s, e) => s + e.amount, 0)
  return { revenue, days: filteredEntries.value.length, avgDaily: filteredEntries.value.length > 0 ? revenue / filteredEntries.value.length : 0 }
})

const allTotals = computed(() => {
  if (!form.value) return { revenue: 0, days: 0 }
  const entries = form.value.billing.entries
  return { revenue: entries.reduce((s, e) => s + e.amount, 0), days: entries.length }
})

const tabs = [
  { key: 'overview', label: 'Resumen', icon: 'fa-chart-pie' },
  { key: 'billing', label: 'Facturacion', icon: 'fa-receipt' },
  { key: 'evidence', label: 'Evidencia', icon: 'fa-paperclip' },
]

const approachLabels: Record<string, string> = { spin: 'Metodo SPIN', automatic_paragraph: 'Parrafo automatico', direct_service: 'Habla directo del servicio', catalog: 'Envia catalogo' }
const objectionLabels: Record<string, string> = { price_no_response: 'No responden tras el precio', think_about_it: 'Lo va a pensar', out_of_budget: 'Fuera de presupuesto', curiosity: 'Solo curiosidad', other: 'Otra objecion' }

function date(v: string) { return new Date(v).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Guayaquil' }) }
function money(v: number) { return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v) }
function submittedAt(v: string) { return new Date(v).toLocaleString('es-EC', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guayaquil' }) }

async function downloadForm() {
  if (!form.value) return
  downloading.value = true
  const f = form.value
  const lines = [
    '========================================',
    '  BAKANO - PERFIL COMERCIAL',
    '========================================',
    '',
    'CLIENTE: ' + f.client.name,
    'EMAIL: ' + f.client.email,
    'WORKSPACE: ' + f.workspace.name,
    'INGRESO: ' + submittedAt(f.submittedAt),
    '',
    '--- Diagnostico ---',
    'Enfoque de venta: ' + (approachLabels[f.diagnostic?.salesApproach || ''] || f.diagnostic?.salesApproach || 'N/A'),
    'Objecion principal: ' + (f.diagnostic?.commonObjection === 'other' ? f.diagnostic?.otherObjection : objectionLabels[f.diagnostic?.commonObjection || ''] || 'N/A'),
    '',
    '--- Comparativa de Ventas ---',
    'Mes actual: ' + money(f.billing.monthlyComparison.currentMonthRevenue),
    'Mes anterior: ' + money(f.billing.monthlyComparison.previousMonthRevenue),
    'Cambio: ' + (f.billing.monthlyComparison.changePercent === null ? 'Sin base comparativa' : f.billing.monthlyComparison.changePercent.toFixed(1) + '%'),
    '',
    '--- Facturacion Total ---',
    'Ingreso total: ' + money(allTotals.value.revenue),
    'Dias registrados: ' + allTotals.value.days,
    '',
    '--- Detalle Diario (periodo: ' + dateRange.value.start + ' a ' + dateRange.value.end + ') ---',
    'Ingreso periodo: ' + money(totals.value.revenue),
    'Dias periodo: ' + totals.value.days,
    '',
    'FECHA | INGRESO',
    ...filteredEntries.value.map((e) => date(e.date) + ' | ' + money(e.amount)),
    '',
    '--- Evidencia Adjunta ---',
    ...(f.diagnostic?.evidence?.map((ev) => ev.name + ' - ' + ev.url) || ['Sin evidencia adjunta']),
    '',
    'Generado: ' + new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
    '========================================',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'perfil-comercial-' + f.client.name.replace(/\s+/g, '-').toLowerCase() + '-' + new Date().toISOString().split('T')[0] + '.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  downloading.value = false
}
</script>

<template>
  <Transition name="page-fade" appear>
    <main class="detail">
      <!-- Header -->
      <Transition name="slide-down" appear>
        <header class="detail__header" v-if="form">
          <div class="detail__header__top">
            <button class="detail__back" @click="router.back()"><i class="fa-solid fa-arrow-left"></i> Volver</button>
            <button class="detail__download" @click="downloadForm" :disabled="downloading"><i :class="downloading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'"></i> {{ downloading ? 'Guardando...' : 'Descargar respaldo' }}</button>
          </div>
          <div class="detail__header__info">
            <div class="detail__header__avatar"><i class="fa-solid fa-user"></i></div>
            <div>
              <span>Perfil comercial</span>
              <h1>{{ form.client.name }}</h1>
              <p><i class="fa-solid fa-inbox"></i>{{ submittedAt(form.submittedAt) }}</p>
            </div>
          </div>
          <div class="detail__header__meta">
            <span class="detail__badge"><i class="fa-solid fa-building"></i>{{ form.workspace.name }}</span>
            <span class="detail__badge"><i class="fa-solid fa-envelope"></i>{{ form.client.email }}</span>
          </div>
        </header>
      </Transition>

      <!-- Loading -->
      <section v-if="loadingApi" class="detail__loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Cargando perfil comercial...</span></section>

      <!-- Error -->
      <section v-else-if="loadError" class="detail__error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <strong>No se pudo cargar el perfil</strong>
        <span>{{ loadError }}</span>
        <button @click="loadForm"><i class="fa-solid fa-rotate-right"></i> Reintentar</button>
      </section>

      <!-- Content -->
      <template v-if="form && !loadingApi && !loadError">
        <!-- Tabs -->
        <Transition name="slide-up" appear>
          <nav class="detail__tabs">
            <button v-for="tab in tabs" :key="tab.key" class="detail__tab" :class="{ 'detail__tab--active': activeTab === tab.key }" @click="activeTab = tab.key">
              <i :class="'fa-solid ' + tab.icon"></i><span>{{ tab.label }}</span>
            </button>
          </nav>
        </Transition>

        <!-- Tab: Overview -->
        <Transition name="fade" mode="out-in">
          <section v-if="activeTab === 'overview'" class="detail__panel" key="overview">
            <!-- KPI Cards -->
            <div class="detail__kpi-row">
              <article class="kpi-card kpi-card--accent">
                <i class="fa-solid fa-sack-dollar"></i>
                <div>
                  <span>Facturacion total</span>
                  <strong>{{ money(allTotals.revenue) }}</strong>
                  <em>{{ allTotals.days }} dias registrados</em>
                </div>
              </article>
              <article class="kpi-card">
                <i class="fa-solid fa-calendar-check"></i>
                <div>
                  <span>Periodo actual</span>
                  <strong>{{ money(totals.revenue) }}</strong>
                  <em>{{ totals.days }} dias en este rango</em>
                </div>
              </article>
              <article class="kpi-card">
                <i class="fa-solid fa-chart-line"></i>
                <div>
                  <span>Promedio diario</span>
                  <strong>{{ money(totals.avgDaily) }}</strong>
                  <em>Ingreso por dia</em>
                </div>
              </article>
            </div>

            <!-- Diagnostic -->
            <section class="detail__card">
              <header><i class="fa-solid fa-clipboard-check"></i><span>Diagnostico comercial</span></header>
              <div class="detail__card__body">
                <article><label>Enfoque de venta</label><strong>{{ approachLabels[form.diagnostic?.salesApproach || ''] || form.diagnostic?.salesApproach || 'N/A' }}</strong></article>
                <article><label>Objecion principal</label><strong>{{ form.diagnostic?.commonObjection === 'other' ? form.diagnostic?.otherObjection : objectionLabels[form.diagnostic?.commonObjection || ''] || 'N/A' }}</strong></article>
              </div>
            </section>

            <!-- Performance Comparison -->
            <section class="detail__card detail__card--accent">
              <header><i class="fa-solid fa-arrow-trend-up"></i><span>Comparativa de ventas al ingreso</span></header>
              <div class="detail__card__body">
                <article class="perf-card">
                  <span>{{ new Date(form.billing.monthlyComparison.currentMonthStart).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) }}</span>
                  <strong>{{ money(form.billing.monthlyComparison.currentMonthRevenue) }}</strong>
                  <em>Ingreso acumulado</em>
                </article>
                <article class="perf-card">
                  <span>{{ new Date(form.billing.monthlyComparison.previousMonthStart).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) }}</span>
                  <strong>{{ money(form.billing.monthlyComparison.previousMonthRevenue) }}</strong>
                  <em>Mes anterior mismo corte</em>
                </article>
                <div class="perf-badge" :class="{ 'perf-badge--positive': (form.billing.monthlyComparison.changePercent || 0) >= 0 }">
                  <i :class="(form.billing.monthlyComparison.changePercent || 0) >= 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"></i>
                  <span>{{ form.billing.monthlyComparison.changePercent === null ? 'Sin base comparativa' : form.billing.monthlyComparison.changePercent.toFixed(1) + '% de cambio' }}</span>
                </div>
              </div>
            </section>

            <!-- Recent entries preview -->
            <section class="detail__card" v-if="form.billing.entries.length">
              <header><i class="fa-solid fa-clock-rotate-left"></i><span>Ultimos registros de facturacion</span></header>
              <div class="detail__recent-entries">
                <div v-for="entry in form.billing.entries.slice(0, 8)" :key="entry.date" class="detail__recent-entry">
                  <span class="detail__recent-entry__date">{{ date(entry.date) }}</span>
                  <span class="detail__recent-entry__amount">{{ money(entry.amount) }}</span>
                </div>
              </div>
              <button class="detail__see-all" @click="activeTab = 'billing'">Ver todos los registros <i class="fa-solid fa-arrow-right"></i></button>
            </section>
          </section>
        </Transition>

        <!-- Tab: Billing -->
        <Transition name="fade" mode="out-in">
          <section v-if="activeTab === 'billing'" class="detail__panel" key="billing">
            <!-- Date Range Filter -->
            <div class="detail__toolbar">
              <DateRangeFilter v-model="dateRange" label="Periodo de facturacion" />
              <span class="detail__toolbar__count"><strong>{{ money(totals.revenue) }}</strong> en {{ totals.days }} registros</span>
            </div>

            <!-- Entries table -->
            <section class="detail__card">
              <header><i class="fa-solid fa-table"></i><span>Detalle diario de facturacion</span></header>
              <div class="detail__table-wrap">
                <table class="detail__table">
                  <thead><tr><th>#</th><th>Fecha</th><th>Ingreso</th></tr></thead>
                  <tbody>
                    <tr v-for="(entry, idx) in filteredEntries" :key="entry.date" :style="{ animationDelay: (idx * 30) + 'ms' }" class="detail__table-row">
                      <td>{{ idx + 1 }}</td>
                      <td><strong>{{ date(entry.date) }}</strong></td>
                      <td class="detail__table__amount">{{ money(entry.amount) }}</td>
                    </tr>
                    <tr v-if="!filteredEntries.length"><td colspan="3" class="detail__table__empty">No hay registros en este periodo.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </Transition>

        <!-- Tab: Evidence -->
        <Transition name="fade" mode="out-in">
          <section v-if="activeTab === 'evidence'" class="detail__panel" key="evidence">
            <section class="detail__card" v-if="form.diagnostic?.evidence?.length">
              <header><i class="fa-solid fa-paperclip"></i><span>{{ form.diagnostic.evidence.length }} archivo(s) adjunto(s)</span></header>
              <div class="detail__evidence-list">
                <a v-for="(ev, idx) in form.diagnostic.evidence" :key="ev.url" :href="ev.url" target="_blank" rel="noopener" class="detail__evidence-item" :style="{ animationDelay: (idx * 60) + 'ms' }">
                  <div class="detail__evidence__icon"><i :class="ev.mimeType?.includes('image') ? 'fa-solid fa-image' : ev.mimeType?.includes('video') ? 'fa-solid fa-video' : ev.mimeType?.includes('pdf') ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file'"></i></div>
                  <div class="detail__evidence__info">
                    <strong>{{ ev.name }}</strong>
                    <span v-if="ev.description">{{ ev.description }}</span>
                    <em>{{ ev.mimeType || 'Archivo' }}</em>
                  </div>
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </div>
            </section>
            <section v-else class="detail__card detail__card--empty">
              <i class="fa-solid fa-inbox"></i>
              <strong>Sin evidencia adjunta</strong>
              <span>El cliente no adjunto archivos en este formulario.</span>
            </section>
          </section>
        </Transition>
      </template>
    </main>
  </Transition>
</template>

<style scoped lang="scss">
.detail { display: flex; flex-direction: column; gap: 1.25rem; margin: 0; padding: clamp(1rem, 3vw, 2.5rem); }

/* Header */
.detail__header { display: flex; flex-direction: column; gap: 1.1rem; padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: 24px; color: $white; background: linear-gradient(135deg, $primary-dark 0%, $primary 100%); }
.detail__header__top { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.detail__back { display: inline-flex; align-items: center; gap: .45rem; padding: .55rem .9rem; border: 0; border-radius: 10px; color: $white; background: rgba($white,.15); cursor: pointer; font: inherit; font-weight: 700; font-size: .82rem; transition: background .2s; }.detail__back:hover { background: rgba($white,.25); }
.detail__download { display: inline-flex; align-items: center; gap: .45rem; padding: .55rem .9rem; border: 0; border-radius: 10px; color: $white; background: rgba($white,.2); cursor: pointer; font: inherit; font-weight: 700; font-size: .82rem; transition: background .2s; }.detail__download:hover { background: rgba($white,.3); }
.detail__header__info { display: flex; align-items: center; gap: 1rem; }
.detail__header__avatar { display: flex; align-items: center; justify-content: center; width: 3.2rem; height: 3.2rem; border-radius: 14px; background: rgba($white,.15); font-size: 1.3rem; }
.detail__header__info > div > span { font-size: .68rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; opacity: .8; }
.detail__header__info h1 { margin: .3rem 0 0; font-size: clamp(1.6rem, 3.5vw, 2.4rem); }
.detail__header__info p { margin: .35rem 0 0; opacity: .85; font-size: .85rem; }.detail__header__info p i { margin-right: .35rem; }
.detail__header__meta { display: flex; flex-wrap: wrap; gap: .5rem; }
.detail__badge { display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .7rem; border-radius: 999px; background: rgba($white,.15); font-size: .8rem; font-weight: 600; }.detail__badge i { font-size: .75rem; }

/* Loading & Error */
.detail__loading { display: flex; flex-direction: column; align-items: center; gap: .8rem; padding: 4rem; color: $text-secondary; font-size: .9rem; }
.detail__loading i { font-size: 1.5rem; color: $primary; }
.detail__error { display: flex; flex-direction: column; align-items: center; gap: .6rem; padding: 3rem; border-radius: 18px; background: $alert-error-bg; color: $alert-error; }
.detail__error i { font-size: 2rem; }
.detail__error strong { color: $primary-dark; font-size: 1.1rem; }
.detail__error span { color: $text-secondary; font-size: .85rem; }
.detail__error button { display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.2rem; border: 0; border-radius: 10px; color: $white; background: $alert-error; cursor: pointer; font: inherit; font-weight: 700; margin-top: .5rem; }

/* Tabs */
.detail__tabs { display: flex; gap: .5rem; padding: .35rem; border-radius: 14px; background: rgba($primary,.04); }
.detail__tab { display: inline-flex; align-items: center; gap: .45rem; padding: .65rem 1rem; border: 0; border-radius: 11px; background: none; cursor: pointer; font: inherit; font-size: .85rem; font-weight: 600; color: $text-secondary; transition: all .2s; }
.detail__tab i { font-size: .9rem; }
.detail__tab:hover { color: $primary-dark; }
.detail__tab--active { color: $white; background: $primary; box-shadow: 0 2px 8px rgba($primary,.25); }

/* Panel */
.detail__panel { display: flex; flex-direction: column; gap: 1rem; }

/* KPI Row */
.detail__kpi-row { display: flex; flex-wrap: wrap; gap: .85rem; }
.kpi-card { display: flex; flex: 1 1 240px; align-items: center; gap: .85rem; padding: 1.25rem 1.4rem; border-radius: 16px; background: $white; border: 1px solid rgba($primary-dark,.06); box-shadow: 0 2px 8px rgba($primary-dark,.04); transition: transform .2s, box-shadow .2s; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba($primary-dark,.08); }
.kpi-card--accent { border-color: rgba($primary,.15); background: linear-gradient(135deg, rgba($primary,.02), rgba($primary,.06)); }
.kpi-card > i { display: flex; align-items: center; justify-content: center; width: 2.8rem; height: 2.8rem; border-radius: 12px; color: $primary; background: rgba($primary,.08); font-size: 1.15rem; }
.kpi-card > div { display: flex; flex-direction: column; gap: .15rem; }
.kpi-card > div > span { color: $text-secondary; font-size: .68rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.kpi-card > div > strong { color: $primary-dark; font-size: 1.35rem; }
.kpi-card > div > em { color: $text-secondary; font-size: .75rem; font-style: normal; }

/* Cards */
.detail__card { display: flex; flex-direction: column; gap: .75rem; padding: 1.25rem; border-radius: 18px; background: $white; border: 1px solid rgba($primary-dark,.06); box-shadow: 0 2px 8px rgba($primary-dark,.03); }
.detail__card > header { display: flex; align-items: center; gap: .5rem; }
.detail__card > header > i { display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 8px; color: $primary; background: rgba($primary,.08); font-size: .85rem; }
.detail__card > header > span { color: $primary; font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.detail__card__body { display: flex; flex-wrap: wrap; gap: .75rem; }
.detail__card__body article { display: flex; flex-direction: column; gap: .2rem; padding: .85rem; border-radius: 12px; background: rgba($primary,.04); min-width: 180px; flex: 1; }
.detail__card__body article label { color: $text-secondary; font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.detail__card__body article strong { color: $primary-dark; font-size: 1.05rem; }
.detail__card--accent { border-color: rgba($primary,.15); }
.detail__card--empty { align-items: center; text-align: center; padding: 3rem; }.detail__card--empty > i { font-size: 2.2rem; color: $text-secondary; margin-bottom: .5rem; }.detail__card--empty > strong { color: $primary-dark; font-size: 1rem; }.detail__card--empty > span { color: $text-secondary; font-size: .85rem; }

/* Perf */
.perf-card { flex: 1 1 200px; padding: 1rem; background: $white; border-radius: 12px; }
.perf-card > span { color: $text-secondary; font-size: .7rem; font-weight: 800; text-transform: capitalize; }
.perf-card > strong { display: block; margin-top: .25rem; font-size: 1.2rem; color: $primary-dark; }
.perf-card > em { color: $text-secondary; font-size: .75rem; font-style: normal; }
.perf-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .8rem; border-radius: 999px; color: #b45309; font-size: .82rem; font-weight: 700; background: rgba(180,83,9,.08); }
.perf-badge--positive { color: #16714b; background: rgba(22,113,75,.08); }

/* Recent entries */
.detail__recent-entries { display: flex; flex-wrap: wrap; gap: .5rem; }
.detail__recent-entry { display: flex; justify-content: space-between; align-items: center; padding: .6rem .9rem; border-radius: 10px; background: rgba($primary,.03); flex: 1 1 200px; min-width: 180px; }
.detail__recent-entry__date { color: $text-secondary; font-size: .8rem; font-weight: 600; }
.detail__recent-entry__amount { color: $primary-dark; font-size: .95rem; font-weight: 700; }
.detail__see-all { display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1rem; border: 0; border-radius: 10px; color: $primary; background: rgba($primary,.06); cursor: pointer; font: inherit; font-weight: 700; font-size: .82rem; width: fit-content; transition: background .2s; }.detail__see-all:hover { background: rgba($primary,.12); }

/* Toolbar */
.detail__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; padding: 1rem 1.25rem; border-radius: 14px; background: rgba($primary,.04); }
.detail__toolbar__count { color: $text-secondary; font-size: .85rem; font-weight: 700; }.detail__toolbar__count strong { color: $primary-dark; font-size: 1rem; }

/* Table */
.detail__table-wrap { overflow: auto; border-radius: 12px; border: 1px solid rgba($primary-dark,.06); }
.detail__table { width: 100%; border-collapse: collapse; }
.detail__table thead th { padding: .75rem 1rem; text-align: left; color: $text-secondary; font-size: .68rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; background: rgba($primary,.03); border-bottom: 2px solid rgba($primary,.12); }
.detail__table tbody td { padding: .75rem 1rem; color: $primary-dark; font-size: .9rem; border-bottom: 1px solid rgba($primary-dark,.04); }
.detail__table-row { animation: rowFadeIn .3s ease both; }
.detail__table__amount { font-weight: 700; color: $primary-dark; }
.detail__table__empty { text-align: center; color: $text-secondary; padding: 2.5rem !important; font-style: italic; }

/* Evidence */
.detail__evidence-list { display: flex; flex-direction: column; gap: .5rem; }
.detail__evidence-item { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; border-radius: 12px; background: $white; border: 1px solid rgba($primary-dark,.06); text-decoration: none; transition: border-color .2s, box-shadow .2s, transform .2s; animation: rowFadeIn .4s ease both; }
.detail__evidence-item:hover { border-color: rgba($primary,.2); box-shadow: 0 4px 12px rgba($primary-dark,.06); transform: translateX(4px); }
.detail__evidence__icon { display: flex; align-items: center; justify-content: center; width: 2.6rem; height: 2.6rem; border-radius: 10px; color: $primary; background: rgba($primary,.08); font-size: 1rem; }
.detail__evidence__info { display: flex; flex-direction: column; gap: .1rem; flex: 1; }
.detail__evidence__info > strong { color: $primary-dark; font-size: .9rem; }
.detail__evidence__info > span { color: $text-secondary; font-size: .78rem; }
.detail__evidence__info > em { color: $text-secondary; font-size: .72rem; font-style: normal; }
.detail__evidence-item > i { color: $text-secondary; font-size: .8rem; transition: color .2s; }
.detail__evidence-item:hover > i { color: $primary; }

/* Transitions */
.page-fade-enter-active { transition: opacity .35s ease; }
.page-fade-enter-from { opacity: 0; }
.slide-down-enter-active { transition: all .4s cubic-bezier(.16,1,.3,1); }
.slide-down-enter-from { opacity: 0; transform: translateY(-16px); }
.slide-up-enter-active { transition: all .4s cubic-bezier(.16,1,.3,1) .1s; }
.slide-up-enter-from { opacity: 0; transform: translateY(12px); }
.fade-enter-active { transition: opacity .25s ease, transform .25s ease; }
.fade-leave-active { transition: opacity .15s ease, transform .15s ease; }
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-4px); }
@keyframes rowFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 680px) {
  .detail__header__top { flex-direction: column; align-items: flex-start; }
  .detail__header__info { flex-direction: column; align-items: flex-start; }
  .detail__kpi-row { flex-direction: column; }
  .kpi-card { flex: 1 1 auto; }
  .detail__card__body article { min-width: 0; width: 100%; }
  .detail__tabs { overflow: auto; }
  .perf-badge { flex: 1 1 100%; justify-content: center; }
  .detail__recent-entry { flex: 1 1 auto; }
}
</style>
