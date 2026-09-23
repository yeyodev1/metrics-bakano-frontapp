<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  incidenteService,
  type Incidente,
  type GravedadIncidente,
  type PersonaEquipo,
} from '@/services/incidente.service'
import IncidenteModal from './IncidenteModal.vue'

/**
 * Incidentes de clientes detectados por el bot en Telegram.
 *
 * Todo el equipo ve todo: lo suyo y lo de los demás. Cada caso se puede
 * asignar a dedo, tomar y cerrar, y guarda su propia auditoría, así nadie
 * tiene que preguntar en Slack "quién está viendo esto".
 *
 * Nada de window.prompt/confirm ni emojis sueltos: modal propio e iconos, y
 * la columna alineada a la izquierda, que centrada en pantallas anchas dejaba
 * la mirada saltando de un lado al otro.
 */
const route = useRoute()

const incidentes = ref<Incidente[]>([])
const equipo = ref<PersonaEquipo[]>([])
const destacado = ref<Incidente | null>(null)
const abiertos = ref(0)
const total = ref(0)
const pagina = ref(1)
const paginas = ref(1)
const cargando = ref(true)
const error = ref('')
const filtro = ref<'abierto' | 'tomado' | 'cerrado' | 'todos'>('abierto')
const soloMios = ref(false)
const buscar = ref('')
const trabajando = ref<string | null>(null)
const abiertoHistorial = ref<Set<string>>(new Set())
const modal = ref<{ modo: 'cerrar' | 'asignar'; incidente: Incidente } | null>(null)

const GRAVEDAD: Record<GravedadIncidente, { texto: string; icono: string }> = {
  molesto: { texto: 'Molesto', icono: 'fa-solid fa-face-frown' },
  angustiado: { texto: 'Angustiado', icono: 'fa-solid fa-triangle-exclamation' },
  en_peligro: { texto: 'En peligro de irse', icono: 'fa-solid fa-fire' },
}

const ACCION: Record<string, { texto: string; icono: string }> = {
  abierto: { texto: 'Detectado', icono: 'fa-solid fa-robot' },
  asignado: { texto: 'Asignado', icono: 'fa-solid fa-user-plus' },
  tomado: { texto: 'Tomado', icono: 'fa-solid fa-hand' },
  cerrado: { texto: 'Cerrado', icono: 'fa-solid fa-circle-check' },
  reabierto: { texto: 'Reabierto', icono: 'fa-solid fa-rotate-left' },
  recordatorio: { texto: 'Recordatorio', icono: 'fa-solid fa-bell' },
  nota: { texto: 'Nota', icono: 'fa-solid fa-note-sticky' },
}

const FILTROS = [
  { id: 'abierto', label: 'Sin atender' },
  { id: 'tomado', label: 'Tomados' },
  { id: 'cerrado', label: 'Cerrados' },
  { id: 'todos', label: 'Todos' },
] as const

const VACIO: Record<string, string> = {
  abierto: 'No hay incidentes sin atender.',
  tomado: 'Nadie tiene un caso en curso ahora mismo.',
  cerrado: 'Todavía no se ha cerrado ningún caso.',
  todos: 'Aún no hay incidentes registrados.',
}

const listados = computed(() => {
  const resto = incidentes.value.filter((i) => i._id !== destacado.value?._id)
  return destacado.value && pagina.value === 1 ? [destacado.value, ...resto] : resto
})

let debounce: ReturnType<typeof setTimeout> | undefined
function buscarConEspera(): void {
  clearTimeout(debounce)
  debounce = setTimeout(() => { pagina.value = 1; cargar() }, 350)
}

async function cargar(): Promise<void> {
  cargando.value = true
  error.value = ''
  try {
    const datos = await incidenteService.listar({
      estado: filtro.value,
      mios: soloMios.value,
      buscar: buscar.value.trim() || undefined,
      pagina: pagina.value,
      limite: 20,
    })
    incidentes.value = datos.incidentes
    abiertos.value = datos.abiertos
    total.value = datos.total
    paginas.value = datos.paginas
  } catch (e: any) {
    error.value = e?.message || 'No se pudieron cargar los incidentes.'
  } finally {
    cargando.value = false
  }
}

async function abrirDelLink(): Promise<void> {
  const id = route.query.id as string | undefined
  if (!id) return
  try {
    destacado.value = await incidenteService.uno(id)
  } catch {
    destacado.value = null
  }
}

function esDestacado(inc: Incidente): boolean {
  return destacado.value?._id === inc._id
}

function alternarHistorial(id: string): void {
  const s = new Set(abiertoHistorial.value)
  s.has(id) ? s.delete(id) : s.add(id)
  abiertoHistorial.value = s
}

async function tomar(inc: Incidente): Promise<void> {
  trabajando.value = inc._id
  try {
    aplicar(await incidenteService.tomar(inc._id))
  } catch (e: any) {
    error.value = e?.message || 'No se pudo tomar el caso.'
  } finally {
    trabajando.value = null
  }
}

async function confirmarModal(datos: { nota?: string; userId?: string }): Promise<void> {
  if (!modal.value) return
  const { modo, incidente } = modal.value
  trabajando.value = incidente._id
  try {
    const actualizado =
      modo === 'cerrar'
        ? await incidenteService.cerrar(incidente._id, datos.nota)
        : await incidenteService.asignar(incidente._id, datos.userId!, datos.nota)
    aplicar(actualizado)
    modal.value = null
  } catch (e: any) {
    error.value = e?.message || 'No se pudo completar la acción.'
  } finally {
    trabajando.value = null
  }
}

/** Se actualiza la tarjeta en el sitio: no desaparece lo que estabas mirando. */
function aplicar(actualizado: Incidente): void {
  const i = incidentes.value.findIndex((x) => x._id === actualizado._id)
  if (i >= 0) {
    if (filtro.value !== 'todos' && actualizado.estado !== filtro.value) incidentes.value.splice(i, 1)
    else incidentes.value[i] = actualizado
  }
  if (destacado.value?._id === actualizado._id) destacado.value = actualizado
  if (actualizado.estado !== 'abierto' && abiertos.value > 0) abiertos.value -= 1
}

function cuando(fecha: string): string {
  const d = new Date(fecha)
  const minutos = Math.round((Date.now() - d.getTime()) / 60000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  if (minutos < 1440) return `hace ${Math.round(minutos / 60)} h`
  return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function hora(fecha: string): string {
  return new Date(fecha).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function abrirModal(modo: 'cerrar' | 'asignar', incidente: Incidente): Promise<void> {
  modal.value = { modo, incidente }
  if (modo === 'asignar' && !equipo.value.length) {
    try {
      equipo.value = await incidenteService.equipo()
    } catch {
      error.value = 'No se pudo cargar el equipo.'
    }
  }
}

function irA(p: number): void {
  pagina.value = Math.min(Math.max(1, p), paginas.value)
  cargar()
}

onMounted(async () => {
  await Promise.all([abrirDelLink(), cargar()])
})
</script>

<template>
  <div class="inc">
    <header class="inc__head">
      <div>
        <h1 class="inc__title">Incidentes de clientes</h1>
        <p class="inc__sub">
          Lo que el bot detecta en Telegram cuando un cliente la está pasando mal.
          <strong v-if="abiertos">{{ abiertos }} sin atender.</strong>
        </p>
      </div>
      <button class="inc__btn" :disabled="cargando" @click="cargar">
        <i class="fa-solid" :class="cargando ? 'fa-spinner fa-spin' : 'fa-rotate'" />
        Actualizar
      </button>
    </header>

    <div class="inc__barra">
      <div class="inc__chips">
        <button
          v-for="f in FILTROS"
          :key="f.id"
          class="inc__chip"
          :class="{ 'is-on': filtro === f.id }"
          :disabled="cargando"
          @click="filtro = f.id; pagina = 1; cargar()"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="inc__buscador">
        <i class="fa-solid fa-magnifying-glass" />
        <input v-model="buscar" type="search" placeholder="Buscar por cliente o por lo que dijo" @input="buscarConEspera" />
      </div>

      <label class="inc__mios">
        <input type="checkbox" v-model="soloMios" :disabled="cargando" @change="pagina = 1; cargar()" />
        Solo los míos
      </label>
    </div>

    <p v-if="error" class="inc__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>

    <template v-if="cargando">
      <div v-for="n in 3" :key="`sk-${n}`" class="inc__card inc__card--sk">
        <div class="sk sk--chip" />
        <div class="sk sk--titulo" />
        <div class="sk sk--frase" />
        <div class="sk sk--linea" />
        <div class="sk sk--linea sk--corta" />
      </div>
    </template>

    <p v-else-if="!listados.length" class="inc__vacio">{{ VACIO[filtro] }}</p>

    <article
      v-for="inc in listados"
      v-else
      :key="inc._id"
      class="inc__card"
      :class="[`is-${inc.gravedad}`, { 'is-destacado': esDestacado(inc) }]"
    >
      <p v-if="esDestacado(inc)" class="inc__pin">
        <i class="fa-solid fa-thumbtack" /> Este es el incidente del enlace que abriste
      </p>

      <div class="inc__card-top">
        <div class="inc__tags">
          <span class="inc__grav" :class="`is-${inc.gravedad}`">
            <i :class="GRAVEDAD[inc.gravedad].icono" /> {{ GRAVEDAD[inc.gravedad].texto }}
          </span>
          <span class="inc__tag"><i class="fa-brands fa-telegram" /> Telegram</span>
          <span v-if="inc.fueraDeHorario" class="inc__tag"><i class="fa-solid fa-moon" /> fuera de horario</span>
          <span v-if="inc.estado === 'tomado'" class="inc__tag is-azul"><i class="fa-solid fa-hand" /> en curso</span>
          <span v-else-if="inc.estado === 'cerrado'" class="inc__tag is-verde"><i class="fa-solid fa-check" /> cerrado</span>
        </div>
        <span class="inc__cuando">{{ cuando(inc.createdAt) }}</span>
      </div>

      <h2 class="inc__cliente">
        {{ inc.workspaceName }}
        <small v-if="inc.cliente?.nombre">· {{ inc.cliente.nombre }}</small>
      </h2>

      <blockquote class="inc__frase">{{ inc.frase }}</blockquote>
      <p v-if="inc.motivo" class="inc__dato"><strong>Motivo:</strong> {{ inc.motivo }}</p>
      <p v-if="inc.recomendacion" class="inc__reco">
        <i class="fa-solid fa-bolt" /> <strong>Recomendación:</strong> {{ inc.recomendacion }}
      </p>
      <p class="inc__dato">
        <strong>Le toca a:</strong> {{ inc.responsableNombre || '—' }}
        <span v-if="inc.responsableEmail" class="inc__correo">{{ inc.responsableEmail }}</span>
      </p>
      <p v-if="inc.asignadoA" class="inc__dato inc__dato--asignado">
        <i class="fa-solid fa-user-check" />
        <strong>Asignado a {{ inc.asignadoA.nombre }}</strong> por {{ inc.asignadoA.porNombre }}
      </p>

      <div class="inc__pie">
        <button class="inc__link" type="button" @click="alternarHistorial(inc._id)">
          <i class="fa-solid" :class="abiertoHistorial.has(inc._id) ? 'fa-chevron-up' : 'fa-clock-rotate-left'" />
          {{ abiertoHistorial.has(inc._id) ? 'Ocultar auditoría' : `Auditoría (${inc.historial?.length || 0})` }}
        </button>

        <div class="inc__acciones">
          <button class="inc__btn" :disabled="trabajando === inc._id" @click="abrirModal('asignar', inc)">
            <i class="fa-solid fa-user-plus" /> Asignar
          </button>
          <button
            v-if="inc.estado === 'abierto'"
            class="inc__btn inc__btn--primario"
            :disabled="trabajando === inc._id"
            @click="tomar(inc)"
          >
            <i v-if="trabajando === inc._id" class="fa-solid fa-spinner fa-spin" />
            <i v-else class="fa-solid fa-hand" />
            Tomar el caso
          </button>
          <button
            v-if="inc.estado !== 'cerrado'"
            class="inc__btn"
            :disabled="trabajando === inc._id"
            @click="abrirModal('cerrar', inc)"
          >
            <i class="fa-solid fa-circle-check" /> Cerrar
          </button>
        </div>
      </div>

      <ol v-if="abiertoHistorial.has(inc._id)" class="inc__hist">
        <li v-for="(h, i) in inc.historial || []" :key="i" class="inc__hito">
          <i :class="(ACCION[h.accion] || ACCION.nota).icono" />
          <div>
            <p class="inc__hito-top">
              <strong>{{ (ACCION[h.accion] || ACCION.nota).texto }}</strong>
              por {{ h.porNombre }}
              <span class="inc__hito-hora">{{ hora(h.en) }}</span>
            </p>
            <p v-if="h.detalle" class="inc__hito-detalle">{{ h.detalle }}</p>
          </div>
        </li>
        <li v-if="!(inc.historial || []).length" class="inc__hito inc__hito--vacio">
          Este caso es anterior a la auditoría, así que no tiene historial.
        </li>
      </ol>
    </article>

    <nav v-if="!cargando && paginas > 1" class="inc__paginas">
      <button class="inc__btn" :disabled="pagina <= 1" @click="irA(pagina - 1)">
        <i class="fa-solid fa-chevron-left" /> Anterior
      </button>
      <span class="inc__pagina-texto">Página {{ pagina }} de {{ paginas }} · {{ total }} casos</span>
      <button class="inc__btn" :disabled="pagina >= paginas" @click="irA(pagina + 1)">
        Siguiente <i class="fa-solid fa-chevron-right" />
      </button>
    </nav>

    <IncidenteModal
      v-if="modal"
      :modo="modal.modo"
      :cliente="modal.incidente.workspaceName"
      :equipo="equipo"
      :trabajando="trabajando === modal.incidente._id"
      @cerrar="modal = null"
      @confirmar="confirmarModal"
    />
  </div>
</template>

<style scoped lang="scss">
.inc {
  padding: 1.5rem;
  max-width: 940px;

  &__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  &__title { font-size: 1.5rem; font-weight: 700; margin: 0; }
  &__sub { color: #6b7280; margin: 0.25rem 0 0; font-size: 0.9rem; }

  &__barra { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
  &__chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }

  &__chip {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-on { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  &__buscador {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.4rem 0.7rem;
    color: #9ca3af;
    min-width: 260px;
    flex: 1;

    input { border: 0; outline: 0; flex: 1; font-size: 0.88rem; color: #111827; background: transparent; }
  }

  &__mios { font-size: 0.85rem; color: #374151; display: flex; gap: 0.35rem; align-items: center; }
  &__error { color: #b91c1c; font-size: 0.9rem; display: flex; gap: 0.4rem; align-items: center; }
  &__vacio { color: #6b7280; padding: 2.5rem 0; }

  &__card {
    border: 1px solid #e5e7eb;
    border-left: 4px solid #9ca3af;
    border-radius: 12px;
    padding: 1rem 1.15rem;
    margin-bottom: 0.85rem;
    background: #fff;
    animation: aparecer 0.18s ease;

    &.is-angustiado, &.is-en_peligro { border-left-color: #dc2626; }
    &.is-molesto { border-left-color: #f59e0b; }
    &.is-destacado { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
    &--sk { animation: none; }
  }

  &__pin { margin: 0 0 0.6rem; font-size: 0.78rem; color: #1d4ed8; }
  &__card-top { display: flex; justify-content: space-between; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap; }
  &__tags { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }

  &__grav {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;

    &.is-molesto { background: #fef3c7; color: #92400e; }
    &.is-angustiado, &.is-en_peligro { background: #fee2e2; color: #991b1b; }
  }

  &__tag {
    font-size: 0.72rem;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;

    &.is-azul { background: #eff6ff; color: #1d4ed8; }
    &.is-verde { background: #ecfdf5; color: #047857; }
  }

  &__cuando { font-size: 0.75rem; color: #9ca3af; }
  &__cliente { font-size: 1.05rem; margin: 0.6rem 0 0.4rem; small { color: #6b7280; font-weight: 400; } }

  &__frase {
    margin: 0 0 0.6rem;
    padding: 0.6rem 0.8rem;
    background: #f9fafb;
    border-left: 3px solid #e5e7eb;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #111827;
  }

  &__dato { margin: 0.2rem 0; font-size: 0.87rem; color: #374151; }
  &__dato--asignado { color: #047857; display: flex; gap: 0.4rem; align-items: center; }
  &__correo { color: #6b7280; margin-left: 0.35rem; }
  &__reco { margin: 0.4rem 0; font-size: 0.87rem; color: #1d4ed8; }

  &__pie { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-top: 0.9rem; flex-wrap: wrap; }
  &__acciones { display: flex; gap: 0.5rem; margin-left: auto; flex-wrap: wrap; }

  &__link {
    border: 0;
    background: transparent;
    color: #6b7280;
    font-size: 0.82rem;
    cursor: pointer;
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    padding: 0;

    &:hover { color: #111827; }
  }

  &__btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    padding: 0.45rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &--primario { background: #111827; color: #fff; border-color: #111827; }
    &:disabled { opacity: 0.6; cursor: default; }
  }

  &__hist {
    list-style: none;
    margin: 0.9rem 0 0;
    padding: 0.9rem 0 0;
    border-top: 1px dashed #e5e7eb;
  }

  &__hito {
    display: flex;
    gap: 0.6rem;
    padding: 0.35rem 0;
    font-size: 0.83rem;
    color: #374151;

    > i { color: #9ca3af; width: 16px; text-align: center; margin-top: 0.15rem; }
    &--vacio { color: #9ca3af; }
  }

  &__hito-top { margin: 0; }
  &__hito-hora { color: #9ca3af; margin-left: 0.4rem; }
  &__hito-detalle { margin: 0.1rem 0 0; color: #6b7280; }

  &__paginas { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }
  &__pagina-texto { font-size: 0.82rem; color: #6b7280; }
}

.sk {
  background: linear-gradient(90deg, #f3f4f6 25%, #e9eaed 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: brillo 1.3s ease infinite;
  border-radius: 6px;

  &--chip { width: 110px; height: 18px; margin-bottom: 0.7rem; }
  &--titulo { width: 45%; height: 20px; margin-bottom: 0.7rem; }
  &--frase { width: 100%; height: 44px; margin-bottom: 0.6rem; }
  &--linea { width: 70%; height: 12px; margin-bottom: 0.4rem; }
  &--corta { width: 40%; }
}

@keyframes brillo {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
</style>
