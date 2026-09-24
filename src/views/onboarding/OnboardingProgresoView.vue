<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RecorridoCliente from './components/RecorridoCliente.vue'
import {
  onboardingProgresoService,
  type EstadoPaso,
  type EventoOnboarding,
  type PasoOnboarding,
  type PasoProgreso,
  type ProgresoEntorno,
  type ResumenProgreso,
} from '@/services/onboardingProgreso.service'

const data = ref<ResumenProgreso | null>(null)
const cargando = ref(true)
const errorCarga = ref('')
const filtro = ref<'todos' | 'bloqueados' | 'pendientes'>('pendientes')
const busqueda = ref('')

const abierto = ref<ProgresoEntorno | null>(null)
const bitacora = ref<EventoOnboarding[]>([])
const cargandoDetalle = ref(false)
const guardando = ref<PasoOnboarding | null>(null)
const aviso = ref('')

/** Borrador por paso: lo que el responsable escribe antes de guardar. */
const borrador = ref<Record<string, { estado: EstadoPaso; motivo: string; nota: string; pendienteDelCliente: string }>>({})

const ESTADOS: { valor: EstadoPaso; texto: string }[] = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'agendada', texto: 'Agendada' },
  { valor: 'cumplida', texto: 'Cumplida' },
  { valor: 'bloqueada', texto: 'Bloqueada' },
  { valor: 'no_aplica', texto: 'No aplica' },
]

/** Emojis por estado: se leen de un vistazo sin tener que ir a la leyenda. */
const ESTADO_EMOJI: Record<EstadoPaso, string> = {
  pendiente: '⬜',
  agendada: '🗓️',
  cumplida: '✅',
  bloqueada: '⛔',
  no_aplica: '➖',
}

/** Y por paso, para reconocer la fila sin leerla entera. */
const PASO_EMOJI: Record<string, string> = {
  bienvenida: '🤝',
  especializacion: '📣',
  levantamiento: '📝',
  produccion: '🎬',
  meta: '📣',
  crm: '🗂️',
  estrategia: '📝',
}

const ESTADO_TEXTO: Record<EstadoPaso, string> = {
  pendiente: 'Pendiente',
  agendada: 'Agendada',
  cumplida: 'Cumplida',
  bloqueada: 'Bloqueada',
  no_aplica: 'No aplica',
}

/** Sin tildes y en minúscula: "ñato" tiene que encontrar a "Parrilla del Ñato". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const filas = computed(() => {
  const rows = data.value?.progresos ?? []
  const q = normalizar(busqueda.value)
  return q ? rows.filter((r) => normalizar(r.entorno).includes(q)) : rows
})

const totales = computed(() => {
  const rows = data.value?.progresos ?? []
  return {
    clientes: rows.length,
    bloqueados: rows.filter((r) => r.bloqueado).length,
    completos: rows.filter((r) => r.porcentaje === 100).length,
    parados: rows.filter((r) => (r.diasSinMover ?? 0) >= 7 && r.porcentaje < 100).length,
  }
})

function fecha(valor?: string): string {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(valor))
}

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    data.value = await onboardingProgresoService.getResumen({
      bloqueados: filtro.value === 'bloqueados',
      pendientes: filtro.value === 'pendientes',
    })
  } catch (error: any) {
    errorCarga.value = error?.message || 'No se pudo cargar el onboarding.'
  } finally {
    cargando.value = false
  }
}

async function abrir(row: ProgresoEntorno) {
  abierto.value = row
  aviso.value = ''
  cargandoDetalle.value = true
  try {
    const detalle = await onboardingProgresoService.getDetalle(row.workspaceId)
    abierto.value = detalle.progreso
    bitacora.value = detalle.bitacora
    borrador.value = {}
    for (const paso of detalle.progreso.pasos) {
      borrador.value[paso.paso] = {
        estado: paso.estado,
        motivo: paso.motivo || '',
        nota: paso.nota || '',
        pendienteDelCliente: paso.pendienteDelCliente || '',
      }
    }
  } catch (error: any) {
    aviso.value = error?.message || 'No se pudo cargar el detalle.'
  } finally {
    cargandoDetalle.value = false
  }
}

function cerrar() {
  abierto.value = null
  bitacora.value = []
  aviso.value = ''
}

async function guardar(paso: PasoProgreso) {
  if (!abierto.value) return
  const b = borrador.value[paso.paso]
  if (b.estado === 'bloqueada' && !b.motivo.trim()) {
    aviso.value = 'Para marcar como bloqueada escribe el motivo.'
    return
  }
  guardando.value = paso.paso
  aviso.value = ''
  try {
    const progreso = await onboardingProgresoService.marcarPaso(abierto.value.workspaceId, paso.paso, {
      estado: b.estado,
      motivo: b.motivo,
      nota: b.nota,
      pendienteDelCliente: b.pendienteDelCliente,
    })
    abierto.value = progreso
    const detalle = await onboardingProgresoService.getDetalle(progreso.workspaceId)
    bitacora.value = detalle.bitacora
    aviso.value = 'Avance guardado.'
    await cargar()
  } catch (error: any) {
    aviso.value = error?.message || 'No se pudo guardar el avance.'
  } finally {
    guardando.value = null
  }
}

async function recordar(paso: PasoProgreso) {
  if (!abierto.value) return
  guardando.value = paso.paso
  try {
    const r = await onboardingProgresoService.recordar(
      abierto.value.workspaceId,
      paso.paso,
      borrador.value[paso.paso]?.pendienteDelCliente
    )
    aviso.value = r.message
  } catch (error: any) {
    aviso.value = error?.message || 'No se pudo enviar el recordatorio.'
  } finally {
    guardando.value = null
  }
}

onMounted(cargar)
</script>

<template>
  <div class="onb">
    <!-- Ancho completo y pegado a la izquierda: esta pantalla es una lista de
         trabajo, no un articulo. Centrarla dejaba media pantalla en blanco. -->
    <header class="onb__head">
      <p class="onb__tag">🚀 Equipo Bakano</p>
      <h1 class="onb__title">Onboarding de clientes</h1>
      <p class="onb__sub">
        En qué paso va cada cliente, quién lo tiene y, si está trabado, por qué. Marca tu avance aquí mismo.
      </p>
    </header>

    <section class="onb__totals">
      <template v-if="cargando">
        <article v-for="n in 4" :key="n" class="onb__total onb__total--skel">
          <span class="skel skel--sm" />
          <span class="skel skel--lg" />
          <span class="skel skel--sm" />
        </article>
      </template>
      <template v-else>
        <article class="onb__total">
          <p class="onb__total-label">👥 Clientes</p>
          <p class="onb__total-value">{{ totales.clientes }}</p>
          <p class="onb__total-foot">en la lista</p>
        </article>
        <article class="onb__total onb__total--bad">
          <p class="onb__total-label">⛔ Trabados</p>
          <p class="onb__total-value">{{ totales.bloqueados }}</p>
          <p class="onb__total-foot">con motivo escrito</p>
        </article>
        <article class="onb__total onb__total--warn">
          <p class="onb__total-label">🐢 Sin moverse</p>
          <p class="onb__total-value">{{ totales.parados }}</p>
          <p class="onb__total-foot">7 días o más</p>
        </article>
        <article class="onb__total onb__total--ok">
          <p class="onb__total-label">✅ Completos</p>
          <p class="onb__total-value">{{ totales.completos }}</p>
          <p class="onb__total-foot">listos para producir</p>
        </article>
      </template>
    </section>

    <div class="onb__filters">
      <button :class="{ 'is-active': filtro === 'pendientes' }" @click="filtro = 'pendientes'; cargar()">⏳ En proceso</button>
      <button :class="{ 'is-active': filtro === 'bloqueados' }" @click="filtro = 'bloqueados'; cargar()">⛔ Trabados</button>
      <button :class="{ 'is-active': filtro === 'todos' }" @click="filtro = 'todos'; cargar()">📋 Todos</button>
      <input v-model="busqueda" class="onb__buscador" type="search" placeholder="🔍 Buscar cliente…" />
      <span v-if="!cargando" class="onb__cuenta">{{ filas.length }} clientes</span>
    </div>

    <!-- Esqueleto con la forma exacta de las filas: la pantalla no salta
         cuando llegan los datos. -->
    <ul v-if="cargando" class="onb__lista">
      <li v-for="n in 8" :key="n" class="onb__fila onb__fila--skel">
        <div class="onb__fila-main">
          <span class="skel skel--md" />
          <span class="skel skel--sm" />
        </div>
        <div class="onb__fila-pasos">
          <span v-for="p in 4" :key="p" class="skel skel--punto" />
        </div>
        <div class="onb__fila-barra"><span class="skel skel--barra" /></div>
        <span class="skel skel--dias" />
      </li>
    </ul>

    <p v-else-if="errorCarga" class="onb__error">😕 {{ errorCarga }}</p>
    <p v-else-if="!filas.length" class="onb__vacio">🔎 No hay clientes con ese filtro.</p>

    <ul v-else class="onb__lista">
      <li v-for="row in filas" :key="row.workspaceId" class="onb__fila" @click="abrir(row)">
        <div class="onb__fila-main">
          <p class="onb__fila-nombre">
            {{ row.entorno }}
            <span v-if="row.bloqueado" class="onb__chip onb__chip--bad">⛔ Trabado</span>
            <span v-else-if="row.porcentaje === 100" class="onb__chip onb__chip--ok">✅ Completo</span>
            <span v-if="row.tieneTelegram" class="onb__chip onb__chip--tg">💬 Telegram</span>
          </p>
          <p class="onb__fila-sub">
            <template v-if="row.bloqueado">{{ row.motivoBloqueo }}</template>
            <template v-else-if="row.siguiente">
              Sigue: {{ PASO_EMOJI[row.siguiente] }}
              {{ row.pasos.find((p) => p.paso === row.siguiente)?.etiqueta }} ·
              {{ row.pasos.find((p) => p.paso === row.siguiente)?.responsable }}
            </template>
            <template v-else>Todo cumplido</template>
          </p>
        </div>
        <div class="onb__fila-pasos">
          <span
            v-for="paso in row.pasos"
            :key="paso.paso"
            class="onb__paso-emoji"
            :title="`${paso.etiqueta}: ${ESTADO_TEXTO[paso.estado]}`"
          >{{ ESTADO_EMOJI[paso.estado] }}</span>
        </div>
        <div class="onb__fila-barra">
          <div class="onb__barra"><span :style="{ width: `${row.porcentaje}%` }" /></div>
          <span class="onb__pct">{{ row.porcentaje }}%</span>
        </div>
        <p class="onb__fila-dias" :class="{ 'onb__fila-dias--alerta': (row.diasSinMover ?? 0) >= 7 }">
          {{ row.diasSinMover ?? 0 }} d
        </p>
      </li>
    </ul>

    <!-- Detalle: los pasos del cliente y el formulario de avance -->
    <div v-if="abierto" class="onb__panel" @click.self="cerrar">
      <aside class="onb__panel-caja">
        <header class="onb__panel-head">
          <div>
            <p class="onb__tag">🚀 Onboarding</p>
            <h2 class="onb__panel-title">{{ abierto.entorno }}</h2>
            <p class="onb__sub">
              {{ abierto.porcentaje }}% completado · {{ abierto.diasSinMover ?? 0 }} días sin moverse
              <template v-if="abierto.tieneTelegram"> · 💬 Telegram conectado</template>
            </p>
          </div>
          <button class="onb__cerrar" @click="cerrar">✕</button>
        </header>

        <p v-if="aviso" class="onb__aviso">{{ aviso }}</p>

        <template v-if="cargandoDetalle">
          <section v-for="n in 3" :key="n" class="onb__paso onb__paso--skel">
            <span class="skel skel--md" />
            <span class="skel skel--sm" />
            <span class="skel skel--campo" />
          </section>
        </template>

        <template v-else>
          <section v-for="paso in abierto.pasos" :key="paso.paso" class="onb__paso">
            <header class="onb__paso-head">
              <p class="onb__paso-title">{{ PASO_EMOJI[paso.paso] }} {{ paso.etiqueta }}</p>
              <span class="onb__chip" :class="`onb__chip--${paso.estado}`">
                {{ ESTADO_EMOJI[paso.estado] }} {{ ESTADO_TEXTO[paso.estado] }}
              </span>
            </header>
            <p class="onb__paso-meta">
              {{ paso.responsable }} · {{ paso.fecha ? fecha(paso.fecha) : 'sin fecha' }}
              <template v-if="paso.actualizadoPorNombre">
                · último cambio: {{ paso.actualizadoPorNombre }} ({{ fecha(paso.actualizadoEn) }})
              </template>
            </p>

            <div v-if="borrador[paso.paso]" class="onb__form">
              <select v-model="borrador[paso.paso].estado" class="onb__select">
                <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ ESTADO_EMOJI[e.valor] }} {{ e.texto }}</option>
              </select>
              <input
                v-model="borrador[paso.paso].motivo"
                class="onb__input"
                :placeholder="borrador[paso.paso].estado === 'bloqueada' ? 'Por qué no avanza (obligatorio)' : 'Motivo (opcional)'"
              />
              <input v-model="borrador[paso.paso].nota" class="onb__input" placeholder="Nota interna" />
              <input
                v-model="borrador[paso.paso].pendienteDelCliente"
                class="onb__input"
                placeholder="Qué falta del cliente (se lo puede recordar el bot)"
              />
              <div class="onb__acciones">
                <button class="onb__btn" :disabled="guardando === paso.paso" @click="guardar(paso)">
                  {{ guardando === paso.paso ? 'Guardando…' : '💾 Guardar avance' }}
                </button>
                <button
                  class="onb__btn onb__btn--ghost"
                  :disabled="guardando === paso.paso || !abierto.tieneTelegram"
                  :title="abierto.tieneTelegram ? 'Enviar recordatorio por Telegram' : 'El cliente no tiene Telegram conectado'"
                  @click="recordar(paso)"
                >
                  💬 Recordar por Telegram
                </button>
              </div>
            </div>
          </section>

          <!-- El recorrido completo, con las etapas internas que el cliente
               también ve en el bot. -->
          <RecorridoCliente :workspace-id="abierto.workspaceId" :key="abierto.workspaceId" />

          <section v-if="bitacora.length" class="onb__bitacora">
            <p class="onb__paso-title">🗒️ Bitácora</p>
            <ul>
              <li v-for="e in bitacora" :key="e._id">
                <strong>{{ fecha(e.createdAt) }}</strong> · {{ PASO_EMOJI[e.paso] }} {{ e.paso }} →
                {{ ESTADO_EMOJI[e.estado] }} {{ ESTADO_TEXTO[e.estado] }}
                <template v-if="e.porNombre"> · {{ e.porNombre }}</template>
                <template v-if="e.motivo"> · {{ e.motivo }}</template>
              </li>
            </ul>
          </section>
        </template>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Lista de trabajo: ancho completo, pegada a la izquierda. */
.onb {
  padding: 1.5rem 2rem 3rem;
  width: 100%;
}

.onb__head { margin-bottom: 1.5rem; }

.onb__tag {
  margin: 0;
  color: $text-secondary;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.onb__title {
  margin: 0.25rem 0 0;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.onb__sub {
  margin: 0.35rem 0 0;
  color: $text-secondary;
  font-size: 0.9rem;
  max-width: 70ch;
}

/* ── Totales ─────────────────────────────────────────────── */
.onb__totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.onb__total {
  background: $white;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 14px;
  padding: 0.9rem 1.1rem;
  border-left: 3px solid rgba(107, 114, 128, 0.18);

  &--bad { border-left-color: #e6285c; }
  &--warn { border-left-color: #b4671a; }
  &--ok { border-left-color: #2f7d5d; }

  &--skel {
    display: grid;
    gap: 0.4rem;
  }
}

.onb__total-label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.onb__total-value {
  margin: 0.2rem 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.onb__total-foot {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: $text-secondary;
}

/* ── Filtros ─────────────────────────────────────────────── */
.onb__filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  button {
    border: 1px solid rgba(107, 114, 128, 0.18);
    background: $white;
    color: $text-secondary;
    border-radius: 10px;
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;

    &.is-active {
      background: #85529c;
      border-color: #85529c;
      color: $white;
    }
  }
}

.onb__buscador {
  flex: 1 1 220px;
  min-width: 0;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 10px;
  padding: 0.45rem 0.8rem;
  font-size: 0.85rem;
  background: $white;
}

.onb__cuenta {
  font-size: 0.8rem;
  color: $text-secondary;
  white-space: nowrap;
}

/* ── Filas ───────────────────────────────────────────────── */
.onb__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.onb__fila {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 180px 48px;
  align-items: center;
  gap: 1rem;
  background: $white;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 12px;
  padding: 0.8rem 1.1rem;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;

  &:hover { border-color: #85529c; transform: translateX(2px); }

  &--skel { cursor: default; &:hover { transform: none; border-color: rgba(107, 114, 128, 0.18); } }
}

.onb__fila-main { min-width: 0; display: grid; gap: 0.25rem; }

.onb__fila-nombre {
  margin: 0;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.onb__fila-sub {
  margin: 0;
  font-size: 0.8rem;
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.onb__fila-pasos { display: flex; gap: 0.3rem; }

.onb__paso-emoji { font-size: 0.95rem; line-height: 1; cursor: help; }

.onb__fila-barra { display: flex; align-items: center; gap: 0.5rem; }

.onb__barra {
  flex: 1;
  height: 7px;
  background: rgba(133, 82, 156, 0.12);
  border-radius: 999px;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #e6285c, #85529c);
    border-radius: 999px;
  }
}

.onb__pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: $text-secondary;
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  text-align: right;
}

.onb__fila-dias {
  margin: 0;
  font-size: 0.78rem;
  color: $text-secondary;
  text-align: right;
  font-variant-numeric: tabular-nums;

  &--alerta { color: #b4671a; font-weight: 700; }
}

.onb__chip {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: rgba(100, 100, 110, 0.1);
  color: $text-secondary;
  white-space: nowrap;

  &--bad { background: rgba(230, 40, 92, 0.12); color: #e6285c; }
  &--ok, &--cumplida { background: rgba(47, 125, 93, 0.14); color: #2f7d5d; }
  &--tg { background: rgba(42, 171, 238, 0.14); color: #1d8cc4; }
  &--bloqueada { background: rgba(230, 40, 92, 0.12); color: #e6285c; }
  &--agendada { background: rgba(133, 82, 156, 0.14); color: #85529c; }
}

.onb__error, .onb__vacio {
  margin: 2rem 0;
  color: $text-secondary;
  font-size: 0.9rem;
}

/* ── Panel de detalle ────────────────────────────────────── */
.onb__panel {
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 26, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 60;
}

.onb__panel-caja {
  width: min(560px, 100%);
  height: 100%;
  overflow-y: auto;
  background: $primary-light;
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
  align-content: start;
}

.onb__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.onb__panel-title { margin: 0.25rem 0 0; font-size: 1.3rem; font-weight: 800; }

.onb__cerrar {
  border: 1px solid rgba(107, 114, 128, 0.18);
  background: $white;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.9rem;
}

.onb__aviso {
  margin: 0;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: rgba(133, 82, 156, 0.1);
  color: #6b3f80;
  font-size: 0.85rem;
}

.onb__paso {
  background: $white;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 12px;
  padding: 1rem;

  &--skel { display: grid; gap: 0.5rem; }
}

.onb__paso-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.onb__paso-title { margin: 0; font-weight: 700; font-size: 0.95rem; }

.onb__paso-meta { margin: 0.3rem 0 0.7rem; font-size: 0.78rem; color: $text-secondary; }

.onb__form { display: grid; gap: 0.5rem; }

.onb__select, .onb__input {
  width: 100%;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 9px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  background: $white;
}

.onb__acciones { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.onb__btn {
  border: none;
  background: #85529c;
  color: $white;
  border-radius: 9px;
  padding: 0.5rem 1rem;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.55; cursor: default; }

  &--ghost {
    background: $white;
    color: #85529c;
    border: 1px solid rgba(107, 114, 128, 0.18);
  }
}

.onb__bitacora {
  background: $white;
  border: 1px solid rgba(107, 114, 128, 0.18);
  border-radius: 12px;
  padding: 1rem;

  ul { list-style: none; margin: 0.6rem 0 0; padding: 0; display: grid; gap: 0.4rem; }
  li { font-size: 0.8rem; color: $text-secondary; }
}

/* ── Esqueletos ──────────────────────────────────────────── */
.skel {
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(133, 82, 156, 0.08) 25%, rgba(133, 82, 156, 0.16) 50%, rgba(133, 82, 156, 0.08) 75%);
  background-size: 200% 100%;
  animation: onb-brillo 1.2s ease-in-out infinite;

  &--sm { height: 10px; width: 45%; }
  &--md { height: 14px; width: 60%; }
  &--lg { height: 26px; width: 55%; }
  &--campo { height: 34px; width: 100%; }
  &--barra { height: 7px; width: 100%; border-radius: 999px; }
  &--dias { height: 10px; width: 28px; }
  &--punto { height: 14px; width: 14px; border-radius: 50%; }
}

@keyframes onb-brillo {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 900px) {
  .onb { padding: 1.25rem 1rem 2.5rem; }

  .onb__fila {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .onb__fila-dias { text-align: left; }
}
</style>
