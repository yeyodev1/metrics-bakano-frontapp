<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import integracionesService, { type CrmMetricasVista } from '@/services/integraciones.service'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

/**
 * Dashboard del CRM del cliente: conversaciones día a día, contactos que
 * escribieron y cómo respondió cada asesor. Los números salen del cálculo
 * nocturno (crm-metricas): solo días cerrados, hasta ayer.
 */
const route = useRoute()
const workspaceId = computed(() => String(route.params.workspaceId))
const userStore = useUserStore()
const toast = useToast()
const esEquipo = computed(() => userStore.isInternal || userStore.role === 'superadmin')

const RANGOS = [7, 14, 30] as const
const dias = ref<number>(7)
const data = ref<CrmMetricasVista | null>(null)
const loading = ref(true)
const loadError = ref('')
const recalculando = ref(false)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await integracionesService.metricasCrm(workspaceId.value, dias.value)
  } catch (error) {
    loadError.value = (error as { message?: string })?.message || 'No pudimos cargar las métricas del CRM.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([dias, workspaceId], load)

async function recalcular() {
  if (!data.value || recalculando.value) return
  recalculando.value = true
  try {
    const r = await integracionesService.recalcularMetricasCrm(workspaceId.value, data.value.desde, data.value.hasta)
    if (r.errores.length) toast.error(r.errores[0] || 'Hubo un error al recalcular')
    else if (r.pendientes) toast.success(`Calculé ${r.calculados} días; los ${r.pendientes} que faltan los sigue el cálculo automático.`)
    else toast.success('Métricas recalculadas')
    await load()
  } catch (error) {
    toast.error((error as { message?: string })?.message || 'No se pudo recalcular')
  } finally {
    recalculando.value = false
  }
}

function duracion(seg: number | null | undefined): string {
  if (seg === null || seg === undefined) return '—'
  if (seg < 60) return `${seg} s`
  const min = Math.round(seg / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`
  const d = Math.floor(h / 24)
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`
}

function etiquetaDia(dia: string): string {
  const d = new Date(`${dia}T12:00:00`)
  return `${d.toLocaleDateString('es-EC', { weekday: 'short' })} ${d.getDate()}`
}

function rangoTexto(desde: string, hasta: string): string {
  const f = (dia: string) => new Date(`${dia}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
  return `${f(desde)} – ${f(hasta)}`
}

const hayDatos = computed(() => !!data.value?.dias.some((d) => d.estado === 'terminada'))

const tarjetas = computed(() => {
  const t = data.value?.totales
  if (!t) return []
  return [
    { icono: 'fa-solid fa-comments', color: '#6366f1', valor: t.conversaciones.toLocaleString('es-EC'), label: 'Conversaciones', nota: `${t.nuevas} nuevas` },
    { icono: 'fa-solid fa-user-group', color: '#0ea5e9', valor: t.contactosQueEscribieron.toLocaleString('es-EC'), label: 'Contactos que escribieron', nota: `${t.mensajesEntrantes} mensajes` },
    { icono: 'fa-solid fa-user-tie', color: '#10b981', valor: String(t.asesoresActivos), label: 'Asesores activos', nota: `${t.mensajesSalientes} mensajes enviados` },
    { icono: 'fa-solid fa-stopwatch', color: '#f59e0b', valor: duracion(t.medianaRespuestaSeg), label: 'Tiempo de respuesta (mediana)', nota: `${t.sinRespuesta} quedaron esperando` },
  ]
})

const canales = computed(() => {
  const c = data.value?.porCanal
  if (!c) return []
  return [
    { icono: 'fa-brands fa-whatsapp', color: '#25d366', label: 'WhatsApp', valor: c.whatsapp },
    { icono: 'fa-brands fa-instagram', color: '#e1306c', label: 'Instagram', valor: c.instagram },
    { icono: 'fa-brands fa-facebook-messenger', color: '#0084ff', label: 'Facebook', valor: c.facebook },
    { icono: 'fa-solid fa-comment-sms', color: '#64748b', label: 'SMS', valor: c.sms },
    { icono: 'fa-solid fa-envelope', color: '#94a3b8', label: 'Otros', valor: c.otro },
  ].filter((x) => x.valor > 0)
})

const chartData = computed(() => {
  const ds = data.value?.dias || []
  return {
    labels: ds.map((d) => etiquetaDia(d.dia)),
    datasets: [
      { label: 'Conversaciones', data: ds.map((d) => d.conversaciones), backgroundColor: '#6366f1', borderRadius: 6, maxBarThickness: 28 },
      { label: 'Nuevas', data: ds.map((d) => d.nuevas), backgroundColor: '#0ea5e9', borderRadius: 6, maxBarThickness: 28 },
      { label: 'Quedaron esperando', data: ds.map((d) => d.sinRespuesta), backgroundColor: '#f97316', borderRadius: 6, maxBarThickness: 28 },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 12, usePointStyle: true } } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
}
</script>

<template>
  <div class="crmd">
    <header class="crmd__header">
      <div>
        <h1><i class="fa-solid fa-chart-column" aria-hidden="true" /> CRM</h1>
        <p>Cuántas conversaciones entraron cada día y cómo respondió tu equipo. Se actualiza cada madrugada con el día anterior.</p>
      </div>
      <div class="crmd__rangos" role="group" aria-label="Rango de días">
        <button
          v-for="r in RANGOS"
          :key="r"
          type="button"
          :class="{ 'is-active': dias === r }"
          :aria-pressed="dias === r"
          @click="dias = r"
        >
          {{ r }} días
        </button>
      </div>
    </header>

    <div v-if="loading && !data" class="crmd__skeleton" aria-busy="true" aria-label="Cargando métricas">
      <div class="crmd__skeleton-block" />
      <div class="crmd__skeleton-block crmd__skeleton-block--tall" />
    </div>

    <div v-else-if="loadError && !data" class="crmd__empty" role="alert">
      <i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b" aria-hidden="true" />
      <h3>No pudimos cargar las métricas</h3>
      <p>{{ loadError }}</p>
      <button type="button" class="crmd__btn" @click="load">Reintentar</button>
    </div>

    <div v-else-if="data && !data.conectado" class="crmd__empty">
      <i class="fa-solid fa-plug-circle-xmark" style="color: #6366f1" aria-hidden="true" />
      <h3>{{ data.estadoCrm === 'error' ? 'Tu CRM dejó de responder' : 'Tu CRM todavía no está conectado' }}</h3>
      <p v-if="data.problema">{{ data.problema }}</p>
      <p v-else>Conecta tu GoHighLevel y aquí verás cada día cuántas conversaciones te entraron y cómo respondió cada asesor.</p>
      <RouterLink class="crmd__btn" :to="{ name: 'WorkspaceIntegrations', params: { workspaceId } }">
        <i class="fa-solid fa-plug" aria-hidden="true" /> Ir a Integraciones
      </RouterLink>
    </div>

    <template v-else-if="data">
      <p class="crmd__rango">
        <i class="fa-regular fa-calendar" aria-hidden="true" /> {{ rangoTexto(data.desde, data.hasta) }}
        <span v-if="data.pendientes" class="crmd__chip crmd__chip--info">
          <i class="fa-solid fa-hourglass-half" aria-hidden="true" /> {{ data.pendientes }} días por calcular
        </span>
        <span v-if="data.truncado" class="crmd__chip crmd__chip--warn" title="Algún día tuvo más conversaciones de las que se alcanzaron a leer">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Datos parciales
        </span>
        <button v-if="esEquipo" type="button" class="crmd__link" :disabled="recalculando" @click="recalcular">
          <i :class="recalculando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true" />
          {{ recalculando ? 'Recalculando…' : 'Recalcular' }}
        </button>
      </p>

      <p v-for="aviso in data.advertencias" :key="aviso" class="crmd__aviso">
        <i class="fa-solid fa-user-tie" aria-hidden="true" /> {{ aviso }}
      </p>

      <div v-if="!hayDatos" class="crmd__empty">
        <i class="fa-solid fa-hourglass-half" style="color: #0ea5e9" aria-hidden="true" />
        <h3>Estamos calculando tus primeros días</h3>
        <p>Tu CRM ya está conectado. En unos minutos aparecen los últimos 7 días; después, cada madrugada se suma el día anterior.</p>
      </div>

      <template v-else>
        <section class="crmd__cards">
          <article v-for="t in tarjetas" :key="t.label" class="crmd__card">
            <i :class="t.icono" :style="{ color: t.color }" aria-hidden="true" />
            <strong>{{ t.valor }}</strong>
            <span>{{ t.label }}</span>
            <small>{{ t.nota }}</small>
          </article>
        </section>

        <section class="crmd__panel">
          <h2><i class="fa-solid fa-chart-column" style="color: #6366f1" aria-hidden="true" /> Conversaciones por día</h2>
          <div class="crmd__chart"><Bar :data="chartData" :options="chartOptions" /></div>
          <ul v-if="canales.length" class="crmd__canales">
            <li v-for="c in canales" :key="c.label">
              <i :class="c.icono" :style="{ color: c.color }" aria-hidden="true" /> {{ c.label }} <b>{{ c.valor }}</b>
            </li>
          </ul>
        </section>

        <section class="crmd__panel">
          <h2><i class="fa-solid fa-user-tie" style="color: #10b981" aria-hidden="true" /> Cómo respondió cada asesor</h2>
          <p v-if="!data.asesores.length" class="crmd__muted">Ningún asesor respondió desde el CRM en estos días.</p>
          <div v-else class="crmd__tabla-wrap">
            <table class="crmd__tabla">
              <thead>
                <tr>
                  <th scope="col">Asesor</th>
                  <th scope="col">Conversaciones</th>
                  <th scope="col">Respuestas</th>
                  <th scope="col">Respuesta (mediana)</th>
                  <th scope="col">Promedio</th>
                  <th scope="col">Quedaron esperando</th>
                  <th scope="col">Días activo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in data.asesores" :key="a.userId">
                  <th scope="row">{{ a.nombre }}</th>
                  <td>{{ a.conversaciones }}</td>
                  <td>{{ a.respuestas }}</td>
                  <td><b>{{ duracion(a.medianaRespuestaSeg) }}</b></td>
                  <td>{{ duracion(a.promedioRespuestaSeg) }}</td>
                  <td :class="{ 'is-warn': a.sinRespuesta > 0 }">{{ a.sinRespuesta }}</td>
                  <td>{{ a.diasActivo }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="crmd__muted crmd__nota">
            Los mensajes de flujos, campañas y bots no cuentan como respuesta.
            <template v-if="data.totales.mensajesAutomaticos">En este rango salieron {{ data.totales.mensajesAutomaticos }} automáticos.</template>
          </p>
        </section>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.crmd {
  padding: 1.3rem 1.4rem 2.5rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 560px) { padding: 1rem 1rem 2rem; }
}

.crmd__header {
  display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 0.8rem;
  margin-bottom: 1rem;

  h1 {
    font-size: 1.35rem; font-weight: 800; color: $primary-dark; margin: 0;
    display: flex; align-items: center; gap: 0.55rem;
    i { color: #6366f1; font-size: 1.1rem; }
  }

  p { font-size: 0.88rem; line-height: 1.5; color: $text-secondary; margin: 0.4rem 0 0; max-width: 62ch; }
}

.crmd__rangos {
  display: inline-flex; background: rgba($primary-dark, 0.05); border-radius: 999px; padding: 0.2rem;

  button {
    border: 0; background: transparent; border-radius: 999px; padding: 0.4rem 0.85rem;
    font-size: 0.8rem; font-weight: 700; color: $text-secondary; cursor: pointer;

    &.is-active { background: $white; color: $primary-dark; box-shadow: 0 1px 3px rgba($primary-dark, 0.12); }
    &:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
  }
}

.crmd__rango {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
  font-size: 0.82rem; font-weight: 600; color: $text-secondary; margin: 0 0 0.9rem;
}

.crmd__chip {
  display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.74rem; font-weight: 700;
  &--info { background: rgba(#0ea5e9, 0.1); color: #0369a1; }
  &--warn { background: rgba(#d97706, 0.1); color: #92400e; }
}

.crmd__link {
  margin-left: auto; border: 0; background: transparent; color: #6366f1; font-weight: 700; font-size: 0.8rem; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.35rem;
  &:disabled { opacity: 0.6; cursor: default; }
}

.crmd__aviso {
  display: flex; align-items: flex-start; gap: 0.5rem; margin: 0 0 0.9rem; padding: 0.7rem 0.8rem; border-radius: 10px;
  font-size: 0.8rem; line-height: 1.45; background: rgba(#d97706, 0.1); color: #92400e;
  i { color: #d97706; margin-top: 0.15rem; }
}

.crmd__cards {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem;
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.crmd__card {
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-radius: 16px; padding: 0.95rem 1rem;
  display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;

  i { font-size: 1.05rem; margin-bottom: 0.3rem; }
  strong { font-size: 1.5rem; font-weight: 800; color: $primary-dark; font-variant-numeric: tabular-nums; }
  span { font-size: 0.8rem; font-weight: 700; color: $primary-dark; }
  small { font-size: 0.74rem; color: $text-secondary; }
}

.crmd__panel {
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-radius: 16px; padding: 1rem 1.1rem; margin-bottom: 1rem;

  h2 { font-size: 0.95rem; font-weight: 800; color: $primary-dark; margin: 0 0 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
}

.crmd__chart { height: 280px; }

.crmd__canales {
  list-style: none; margin: 0.8rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem;
  li {
    display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.7rem; border-radius: 999px;
    background: rgba($primary-dark, 0.04); font-size: 0.78rem; font-weight: 600; color: $primary-dark;
  }
}

.crmd__tabla-wrap { overflow-x: auto; }

.crmd__tabla {
  width: 100%; border-collapse: collapse; font-size: 0.82rem; font-variant-numeric: tabular-nums;

  th, td { padding: 0.55rem 0.6rem; text-align: right; border-bottom: 1px solid rgba($primary-dark, 0.06); white-space: nowrap; }
  th:first-child { text-align: left; }
  thead th { font-size: 0.68rem; font-weight: 800; color: $text-secondary; text-transform: uppercase; letter-spacing: 0.04em; }
  tbody th { font-weight: 700; color: $primary-dark; }
  td.is-warn { color: #c2410c; font-weight: 700; }
}

.crmd__muted { font-size: 0.8rem; color: $text-secondary; margin: 0; }
.crmd__nota { margin-top: 0.7rem; }

.crmd__empty {
  background: $white; border: 1px solid rgba($primary-dark, 0.08); border-radius: 16px; padding: 2rem 1.2rem;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem;

  > i { font-size: 1.8rem; }
  h3 { margin: 0; font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0; font-size: 0.85rem; color: $text-secondary; max-width: 52ch; line-height: 1.5; }
}

.crmd__btn {
  margin-top: 0.5rem; display: inline-flex; align-items: center; gap: 0.4rem; border: 0; border-radius: 10px;
  padding: 0.55rem 1rem; background: #6366f1; color: $white; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-decoration: none;
}

.crmd__skeleton { display: flex; flex-direction: column; gap: 1rem; }

.crmd__skeleton-block {
  height: 110px; border-radius: 16px;
  background: linear-gradient(100deg, rgba($primary-dark, 0.05) 40%, rgba($primary-dark, 0.02) 50%, rgba($primary-dark, 0.05) 60%);
  background-size: 200% 100%;
  animation: crmd-shimmer 1.3s infinite;

  &--tall { height: 300px; }
}

@keyframes crmd-shimmer { to { background-position: -200% 0; } }

@media (prefers-reduced-motion: reduce) {
  .crmd__skeleton-block { animation: none; }
}
</style>
