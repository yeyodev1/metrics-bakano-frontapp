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
    <header class="onb__head">
      <p class="onb__tag">Equipo Bakano</p>
      <h1 class="onb__title">Onboarding de clientes</h1>
      <p class="onb__sub">
        En qué paso va cada cliente, quién lo tiene y, si está trabado, por qué. Marca tu avance aquí mismo.
      </p>
    </header>

    <section class="onb__totals">
      <article class="onb__total">
        <p class="onb__total-label">Clientes</p>
        <p class="onb__total-value">{{ totales.clientes }}</p>
        <p class="onb__total-foot">en la lista</p>
      </article>
      <article class="onb__total onb__total--bad">
        <p class="onb__total-label">Trabados</p>
        <p class="onb__total-value">{{ totales.bloqueados }}</p>
        <p class="onb__total-foot">con motivo escrito</p>
      </article>
      <article class="onb__total onb__total--warn">
        <p class="onb__total-label">Sin moverse</p>
        <p class="onb__total-value">{{ totales.parados }}</p>
        <p class="onb__total-foot">7 días o más</p>
      </article>
      <article class="onb__total onb__total--ok">
        <p class="onb__total-label">Completos</p>
        <p class="onb__total-value">{{ totales.completos }}</p>
        <p class="onb__total-foot">listos para producir</p>
      </article>
    </section>

    <div class="onb__filters">
      <button :class="{ 'is-active': filtro === 'pendientes' }" @click="filtro = 'pendientes'; cargar()">En proceso</button>
      <button :class="{ 'is-active': filtro === 'bloqueados' }" @click="filtro = 'bloqueados'; cargar()">Trabados</button>
      <button :class="{ 'is-active': filtro === 'todos' }" @click="filtro = 'todos'; cargar()">Todos</button>
      <input v-model="busqueda" class="onb__buscador" type="search" placeholder="Buscar cliente…" />
      <span class="onb__cuenta">{{ filas.length }} clientes</span>
    </div>

    <p v-if="cargando" class="onb__loading">Cargando…</p>
    <p v-else-if="errorCarga" class="onb__error">{{ errorCarga }}</p>
    <p v-else-if="!filas.length" class="onb__vacio">No hay clientes con ese filtro.</p>

    <ul v-else class="onb__lista">
      <li v-for="row in filas" :key="row.workspaceId" class="onb__fila" @click="abrir(row)">
        <div class="onb__fila-main">
          <p class="onb__fila-nombre">
            {{ row.entorno }}
            <span v-if="row.bloqueado" class="onb__chip onb__chip--bad">Trabado</span>
            <span v-else-if="row.porcentaje === 100" class="onb__chip onb__chip--ok">Completo</span>
            <span v-if="row.tieneTelegram" class="onb__chip onb__chip--tg">Telegram</span>
          </p>
          <p class="onb__fila-sub">
            <template v-if="row.bloqueado">{{ row.motivoBloqueo }}</template>
            <template v-else-if="row.siguiente">
              Sigue: {{ row.pasos.find((p) => p.paso === row.siguiente)?.etiqueta }} ·
              {{ row.pasos.find((p) => p.paso === row.siguiente)?.responsable }}
            </template>
            <template v-else>Todo cumplido</template>
          </p>
        </div>
        <div class="onb__fila-pasos">
          <span
            v-for="paso in row.pasos"
            :key="paso.paso"
            class="onb__punto"
            :class="`onb__punto--${paso.estado}`"
            :title="`${paso.etiqueta}: ${ESTADO_TEXTO[paso.estado]}`"
          />
        </div>
        <div class="onb__fila-barra">
          <div class="onb__barra"><span :style="{ width: `${row.porcentaje}%` }" /></div>
          <span class="onb__pct">{{ row.porcentaje }}%</span>
        </div>
        <p class="onb__fila-dias">{{ row.diasSinMover ?? 0 }} d</p>
      </li>
    </ul>

    <!-- Detalle: los pasos del cliente y el formulario de avance -->
    <div v-if="abierto" class="onb__panel" @click.self="cerrar">
      <aside class="onb__panel-caja">
        <header class="onb__panel-head">
          <div>
            <p class="onb__tag">Onboarding</p>
            <h2 class="onb__panel-title">{{ abierto.entorno }}</h2>
            <p class="onb__sub">{{ abierto.porcentaje }}% completado · {{ abierto.diasSinMover ?? 0 }} días sin moverse</p>
          </div>
          <button class="onb__cerrar" @click="cerrar">✕</button>
        </header>

        <p v-if="aviso" class="onb__aviso">{{ aviso }}</p>
        <p v-if="cargandoDetalle" class="onb__loading">Cargando detalle…</p>

        <section v-for="paso in abierto.pasos" :key="paso.paso" class="onb__paso">
          <header class="onb__paso-head">
            <p class="onb__paso-title">{{ paso.etiqueta }}</p>
            <span class="onb__chip" :class="`onb__chip--${paso.estado}`">{{ ESTADO_TEXTO[paso.estado] }}</span>
          </header>
          <p class="onb__paso-meta">
            {{ paso.responsable }} · {{ paso.fecha ? fecha(paso.fecha) : 'sin fecha' }}
            <template v-if="paso.actualizadoPorNombre">
              · último cambio: {{ paso.actualizadoPorNombre }} ({{ fecha(paso.actualizadoEn) }})
            </template>
          </p>

          <div v-if="borrador[paso.paso]" class="onb__form">
            <select v-model="borrador[paso.paso].estado" class="onb__select">
              <option v-for="e in ESTADOS" :key="e.valor" :value="e.valor">{{ e.texto }}</option>
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
                {{ guardando === paso.paso ? 'Guardando…' : 'Guardar avance' }}
              </button>
              <button
                class="onb__btn onb__btn--ghost"
                :disabled="guardando === paso.paso || !abierto.tieneTelegram"
                :title="abierto.tieneTelegram ? 'Enviar recordatorio por Telegram' : 'El cliente no tiene Telegram conectado'"
                @click="recordar(paso)"
              >
                Recordar por Telegram
              </button>
            </div>
          </div>
        </section>

        <!-- El recorrido completo, con las etapas internas que el cliente
             también ve en el bot. -->
        <RecorridoCliente v-if="abierto" :workspace-id="abierto.workspaceId" :key="abierto.workspaceId" />

        <section v-if="bitacora.length" class="onb__bitacora">
          <p class="onb__paso-title">Bitácora</p>
          <ul>
            <li v-for="e in bitacora" :key="e._id">
              <strong>{{ fecha(e.createdAt) }}</strong> · {{ e.paso }} → {{ ESTADO_TEXTO[e.estado] }}
              <template v-if="e.porNombre"> · {{ e.porNombre }}</template>
              <template v-if="e.motivo"> · {{ e.motivo }}</template>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.onb {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.onb__head { margin-bottom: 1.25rem; }
.onb__tag {
  margin: 0;
  color: $text-secondary;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.onb__title { margin: 0.5rem 0 0.25rem; color: $primary-dark; font-size: 1.6rem; font-weight: 800; }
.onb__sub { margin: 0; color: $text-secondary; font-size: 0.86rem; }
.onb__loading { color: $text-secondary; font-size: 0.9rem; padding: 1.5rem 0; }
.onb__error { color: $alert-error; font-size: 0.9rem; padding: 1rem 0; }
.onb__vacio { color: $text-secondary; font-size: 0.9rem; padding: 2rem 0; text-align: center; }

.onb__totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.9rem;
}
.onb__total {
  --tono: #{$primary-dark};
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 4px solid var(--tono);
  border-radius: 12px;
  padding: 0.9rem 1rem;

  &--bad { --tono: #{$alert-error}; }
  &--warn { --tono: #{$alert-warning}; }
  &--ok { --tono: #059669; }
}
.onb__total-label { margin: 0; color: $text-secondary; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.onb__total-value { margin: 0.2rem 0 0.1rem; color: $primary-dark; font-size: 1.5rem; font-weight: 800; }
.onb__total-foot { margin: 0; color: $text-secondary; font-size: 0.75rem; }

.onb__filters {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 1rem 0 0.75rem;
  flex-wrap: wrap;

  button {
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    color: $text-secondary;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;

    &.is-active { background: $primary-dark; color: #fff; border-color: $primary-dark; }
  }
}
.onb__buscador {
  flex: 1;
  min-width: 180px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
}
.onb__cuenta { color: $text-secondary; font-size: 0.75rem; font-weight: 700; }

.onb__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
.onb__fila {
  display: grid;
  grid-template-columns: 1fr auto 160px 48px;
  align-items: center;
  gap: 0.9rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;

  &:hover { border-color: rgba(0, 0, 0, 0.16); }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}
.onb__fila-nombre { margin: 0; color: $primary-dark; font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.onb__fila-sub { margin: 0.15rem 0 0; color: $text-secondary; font-size: 0.78rem; }
.onb__fila-pasos { display: flex; gap: 0.3rem; }
.onb__fila-dias { margin: 0; color: $text-secondary; font-size: 0.78rem; text-align: right; }

.onb__punto {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2e8f0;

  &--agendada { background: #3b82f6; }
  &--cumplida { background: #059669; }
  &--bloqueada { background: #{$alert-error}; }
  &--no_aplica { background: #cbd5e1; }
}

.onb__fila-barra { display: flex; align-items: center; gap: 0.5rem; }
.onb__barra {
  flex: 1;
  height: 8px;
  background: #eef2f7;
  border-radius: 999px;
  overflow: hidden;

  span { display: block; height: 100%; background: linear-gradient(90deg, #e6285c, #85529c); }
}
.onb__pct { color: $text-secondary; font-size: 0.75rem; font-weight: 700; }

.onb__chip {
  display: inline-block;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  background: #eef2f7;
  color: $text-secondary;

  &--ok, &--cumplida { background: #dcfce7; color: #047857; }
  &--bad, &--bloqueada { background: #fee2e2; color: #b91c1c; }
  &--agendada { background: #dbeafe; color: #1d4ed8; }
  &--tg { background: #e0f2fe; color: #0369a1; }
}

.onb__panel {
  position: fixed;
  inset: 0;
  background: rgba(15, 17, 23, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 60;
}
.onb__panel-caja {
  width: min(560px, 100%);
  background: #f8fafc;
  height: 100%;
  overflow-y: auto;
  padding: 1.25rem;
}
.onb__panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; }
.onb__panel-title { margin: 0.4rem 0 0.2rem; color: $primary-dark; font-size: 1.3rem; font-weight: 800; }
.onb__cerrar { border: none; background: transparent; font-size: 1.1rem; cursor: pointer; color: $text-secondary; }
.onb__aviso {
  margin: 0 0 0.75rem;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  color: #3730a3;
  font-size: 0.82rem;
}

.onb__paso {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  margin-bottom: 0.7rem;
}
.onb__paso-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.onb__paso-title { margin: 0; color: $primary-dark; font-size: 0.95rem; font-weight: 800; }
.onb__paso-meta { margin: 0.2rem 0 0.6rem; color: $text-secondary; font-size: 0.76rem; }

.onb__form { display: grid; gap: 0.45rem; }
.onb__select, .onb__input {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 9px;
  padding: 0.45rem 0.7rem;
  font-size: 0.82rem;
  width: 100%;
}
.onb__acciones { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.onb__btn {
  border: none;
  background: $primary-dark;
  color: #fff;
  border-radius: 9px;
  padding: 0.45rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: default; }
  &--ghost { background: #fff; color: $primary-dark; border: 1px solid rgba(0, 0, 0, 0.12); }
}

.onb__bitacora {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 0.9rem 1rem;

  ul { list-style: none; margin: 0.5rem 0 0; padding: 0; display: grid; gap: 0.35rem; }
  li { color: $text-secondary; font-size: 0.78rem; }
}
</style>
