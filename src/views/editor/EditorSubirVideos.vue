<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  driveService,
  type GuionParaConectar,
  type PlanificacionParaSubir,
} from '@/services/drive.service'
import { useToast } from '@/composables/useToast'

/**
 * Subida masiva de videos de una planificacion.
 *
 * 1. El editor elige cliente y planificacion.
 * 2. Suelta TODOS los videos de una vez: suben directo a Drive (2 a la vez,
 *    por chunks reanudables), a la carpeta del cliente y la planificacion,
 *    que el backend crea si no existe. El editor nunca entra a Drive.
 * 3. Conecta cada archivo con su guion (viene sugerido por el nombre). Al
 *    conectar queda como version nueva, EDITADO y pasa a la revision interna;
 *    cuando esta aprobada, al cliente le llega el aviso para revisar.
 */

type EstadoArchivo = 'pendiente' | 'subiendo' | 'listo' | 'error' | 'conectado'
interface ArchivoSubida {
  id: number
  nombre: string
  tamano: number
  pct: number
  estado: EstadoArchivo
  error?: string
  fileId?: string
  itemId: string
}

const toast = useToast()
const MAX_SIMULTANEAS = 2

const cargando = ref(true)
const planificaciones = ref<PlanificacionParaSubir[]>([])
const workspaceId = ref('')
const planningId = ref('')
const archivos = ref<ArchivoSubida[]>([])
const files = new Map<number, File>()
let siguienteId = 1
let activas = 0
const arrastrando = ref(false)
const conectando = ref(false)
const resultado = reactive<{ errores: string[]; conectados: number }>({ errores: [], conectados: 0 })

const clientes = computed(() => {
  const vistos = new Map<string, { id: string; nombre: string; total: number }>()
  for (const p of planificaciones.value) {
    const c = vistos.get(p.workspaceId) ?? { id: p.workspaceId, nombre: p.workspaceName, total: 0 }
    c.total++
    vistos.set(p.workspaceId, c)
  }
  return [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const delCliente = computed(() => planificaciones.value.filter((p) => p.workspaceId === workspaceId.value))
const planificacion = computed(() => planificaciones.value.find((p) => p.planningId === planningId.value) ?? null)
const guiones = computed<GuionParaConectar[]>(() => planificacion.value?.items ?? [])

const subiendo = computed(() => archivos.value.some((a) => a.estado === 'pendiente' || a.estado === 'subiendo'))
const listos = computed(() => archivos.value.filter((a) => a.estado === 'listo'))
const asignados = computed(() => listos.value.filter((a) => a.itemId))
const repetidos = computed(() => {
  const vistos = new Set<string>()
  const rep = new Set<string>()
  for (const a of asignados.value) {
    if (vistos.has(a.itemId)) rep.add(a.itemId)
    vistos.add(a.itemId)
  }
  return rep
})
const puedeConectar = computed(() => asignados.value.length > 0 && !repetidos.value.size && !conectando.value)

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

function peso(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`
}

function estadoGuion(g: GuionParaConectar): { texto: string; clase: string } {
  if (g.edicion === 'RECHAZADO' && g.correcciones.length) return { texto: 'Con cambios del cliente', clase: 'rojo' }
  if (g.edicion === 'RECHAZADO') return { texto: 'Rechazado', clase: 'rojo' }
  if (g.videoClienteAprobacion === 'APROBADO') return { texto: 'Aprobado por el cliente', clase: 'verde' }
  if (g.edicion === 'EDITADO') return { texto: `Entregado · v${g.versiones || 1}`, clase: 'azul' }
  if (g.estadoProduccion === 'GRABADO') return { texto: 'Grabado, por editar', clase: 'ambar' }
  return { texto: 'Por grabar', clase: 'gris' }
}

async function cargar() {
  cargando.value = true
  try {
    planificaciones.value = await driveService.planificaciones()
  } catch (e: any) {
    toast.error(e?.data?.message || 'No pude cargar las planificaciones.')
  } finally {
    cargando.value = false
  }
}

watch(workspaceId, () => {
  if (!delCliente.value.some((p) => p.planningId === planningId.value)) planningId.value = delCliente.value[0]?.planningId ?? ''
})

function elegirPlanificacion(id: string) {
  if (subiendo.value) {
    toast.error('Espera a que terminen las subidas antes de cambiar de planificación.')
    return
  }
  planningId.value = id
  archivos.value = []
  files.clear()
  resultado.errores = []
  resultado.conectados = 0
}

function agregar(lista: FileList | File[] | null) {
  if (!lista || !planningId.value) return
  const videos = [...lista].filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f.name))
  const otros = [...lista].length - videos.length
  if (otros) toast.error(`${otros} archivo${otros === 1 ? '' : 's'} no ${otros === 1 ? 'es video' : 'son videos'} y se ${otros === 1 ? 'quitó' : 'quitaron'}.`)
  for (const f of videos) {
    const id = siguienteId++
    files.set(id, f)
    archivos.value.push({ id, nombre: f.name, tamano: f.size, pct: 0, estado: 'pendiente', itemId: '' })
  }
  procesar()
}

function onDrop(e: DragEvent) {
  arrastrando.value = false
  agregar(e.dataTransfer?.files ?? null)
}

async function subir(a: ArchivoSubida) {
  const file = files.get(a.id)
  if (!file) {
    a.estado = 'error'
    a.error = 'Archivo perdido: vuelve a soltarlo.'
    return
  }
  a.estado = 'subiendo'
  a.error = undefined
  try {
    const { uploadUrl } = await driveService.sesionPlanificacion(planningId.value, file)
    a.fileId = await driveService.uploadFile(uploadUrl, file, (pct) => (a.pct = pct))
    a.estado = 'listo'
    a.pct = 100
    await sugerir([a])
  } catch (e: any) {
    a.estado = 'error'
    a.error = e?.data?.message || e?.message || 'Error al subir a Drive.'
  }
}

function procesar() {
  while (activas < MAX_SIMULTANEAS) {
    const siguiente = archivos.value.find((a) => a.estado === 'pendiente')
    if (!siguiente) break
    activas++
    subir(siguiente).finally(() => {
      activas--
      procesar()
    })
  }
}

function reintentar(a: ArchivoSubida) {
  a.estado = 'pendiente'
  a.pct = 0
  procesar()
}

function quitar(a: ArchivoSubida) {
  if (a.estado === 'subiendo') return
  archivos.value = archivos.value.filter((x) => x.id !== a.id)
  files.delete(a.id)
}

/** Sugerencia por nombre de archivo, sin pisar lo que el editor ya eligio. */
async function sugerir(lote: ArchivoSubida[]) {
  const sinGuion = lote.filter((a) => a.fileId && !a.itemId)
  if (!sinGuion.length) return
  try {
    const sug = await driveService.sugerencias(
      planningId.value,
      sinGuion.map((a) => ({ fileId: a.fileId!, nombre: a.nombre })),
    )
    const ocupados = new Set(archivos.value.map((a) => a.itemId).filter(Boolean))
    for (const s of sug) {
      const a = archivos.value.find((x) => x.fileId === s.fileId)
      if (a && !a.itemId && s.itemId && !ocupados.has(s.itemId)) {
        a.itemId = s.itemId
        ocupados.add(s.itemId)
      }
    }
  } catch {
    // Sin sugerencia el editor elige a mano.
  }
}

async function conectar() {
  if (!puedeConectar.value || !planificacion.value) return
  conectando.value = true
  resultado.errores = []
  try {
    const r = await driveService.conectar(
      planificacion.value.planningId,
      asignados.value.map((a) => ({ itemId: a.itemId, fileId: a.fileId! })),
    )
    const ok = new Set(r.conectados.map((c) => c.itemId))
    for (const a of asignados.value) if (ok.has(a.itemId)) a.estado = 'conectado'
    resultado.conectados += r.conectados.length
    resultado.errores = r.errores
    toast.success(
      `${r.conectados.length} video${r.conectados.length === 1 ? '' : 's'} conectado${r.conectados.length === 1 ? '' : 's'}. Pasan a revisión interna y luego al cliente.`,
    )
    const id = planningId.value
    await cargar()
    planningId.value = id
  } catch (e: any) {
    toast.error(e?.data?.message || 'No se pudo conectar los videos.')
  } finally {
    conectando.value = false
  }
}

function avisarAntesDeCerrar(e: BeforeUnloadEvent) {
  if (!subiendo.value) return
  e.preventDefault()
  e.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (!subiendo.value) return true
  return window.confirm('Hay videos subiendo. Si sales se cancelan. ¿Salir igual?')
})

onMounted(() => {
  window.addEventListener('beforeunload', avisarAntesDeCerrar)
  cargar()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', avisarAntesDeCerrar))
</script>

<template>
  <section class="esv">
    <div v-if="cargando" class="esv__estado"><i class="fa-solid fa-spinner fa-spin" /> Cargando planificaciones…</div>

    <div v-else-if="!planificaciones.length" class="esv__estado">
      <i class="fa-regular fa-folder-open esv__estado-icono" />
      <p>No hay planificaciones con guiones en tus clientes por ahora.</p>
    </div>

    <template v-else>
      <!-- Paso 1: cliente y planificacion -->
      <div class="esv__paso">
        <span class="esv__num">1</span>
        <div class="esv__cuerpo">
          <h3>Elige el cliente y la planificación</h3>
          <select v-model="workspaceId" class="esv__select">
            <option value="" disabled>Selecciona un cliente</option>
            <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }} ({{ c.total }})</option>
          </select>
          <div v-if="workspaceId" class="esv__planes">
            <button
              v-for="p in delCliente"
              :key="p.planningId"
              type="button"
              class="esv__plan"
              :class="{ 'is-active': p.planningId === planningId }"
              @click="elegirPlanificacion(p.planningId)"
            >
              <strong>{{ p.titulo }}</strong>
              <span><i class="fa-regular fa-calendar" /> {{ fecha(p.fecha) }} · {{ p.items.length }} guiones</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Paso 2: soltar videos -->
      <div v-if="planificacion" class="esv__paso">
        <span class="esv__num">2</span>
        <div class="esv__cuerpo">
          <h3>Suelta todos los videos</h3>
          <p class="esv__ayuda">
            Se guardan solos en la carpeta de <b>{{ planificacion.workspaceName }}</b> ·
            {{ planificacion.titulo }}. Si el nombre del archivo trae el número del guion (ej. <code>03.mp4</code>), lo conectamos solos.
            <a v-if="planificacion.carpetaLink" :href="planificacion.carpetaLink" target="_blank" rel="noopener">
              <i class="fa-brands fa-google-drive" /> Ver carpeta
            </a>
          </p>
          <label
            class="esv__drop"
            :class="{ 'is-over': arrastrando }"
            @dragover.prevent="arrastrando = true"
            @dragleave.prevent="arrastrando = false"
            @drop.prevent="onDrop"
          >
            <i class="fa-solid fa-cloud-arrow-up" />
            <span><b>Arrastra los videos aquí</b> o toca para elegirlos</span>
            <small>Puedes soltar todos a la vez · hasta 5 GB cada uno</small>
            <input type="file" accept="video/*" multiple @change="agregar(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''" />
          </label>
        </div>
      </div>

      <!-- Paso 3: conectar -->
      <div v-if="planificacion && archivos.length" class="esv__paso">
        <span class="esv__num">3</span>
        <div class="esv__cuerpo">
          <h3>Conecta cada video con su guion</h3>
          <ul class="esv__lista">
            <li v-for="a in archivos" :key="a.id" class="esv__archivo" :class="`esv__archivo--${a.estado}`">
              <div class="esv__archivo-info">
                <i
                  class="esv__archivo-icono"
                  :class="{
                    'fa-solid fa-film': a.estado === 'pendiente' || a.estado === 'subiendo',
                    'fa-solid fa-circle-check': a.estado === 'listo',
                    'fa-solid fa-link': a.estado === 'conectado',
                    'fa-solid fa-triangle-exclamation': a.estado === 'error',
                  }"
                />
                <div class="esv__archivo-texto">
                  <span class="esv__archivo-nombre">{{ a.nombre }}</span>
                  <small>
                    {{ peso(a.tamano) }} ·
                    <template v-if="a.estado === 'pendiente'">en espera</template>
                    <template v-else-if="a.estado === 'subiendo'">subiendo {{ a.pct }}%</template>
                    <template v-else-if="a.estado === 'listo'">en Drive</template>
                    <template v-else-if="a.estado === 'conectado'">conectado</template>
                    <template v-else>{{ a.error }}</template>
                  </small>
                  <div v-if="a.estado === 'subiendo'" class="esv__barra"><div :style="{ width: `${a.pct}%` }" /></div>
                </div>
              </div>

              <select
                v-if="a.estado === 'listo'"
                v-model="a.itemId"
                class="esv__select esv__select--guion"
                :class="{ 'is-error': a.itemId && repetidos.has(a.itemId) }"
              >
                <option value="">¿Qué guion es?</option>
                <option v-for="g in guiones" :key="g.itemId" :value="g.itemId">
                  #{{ String(g.numero).padStart(2, '0') }} {{ g.tema }} — {{ estadoGuion(g).texto }}
                </option>
              </select>
              <button v-else-if="a.estado === 'error'" type="button" class="esv__mini" @click="reintentar(a)">
                <i class="fa-solid fa-rotate-right" /> Reintentar
              </button>
              <button
                v-if="a.estado !== 'subiendo' && a.estado !== 'conectado'"
                type="button"
                class="esv__quitar"
                aria-label="Quitar"
                @click="quitar(a)"
              >
                <i class="fa-solid fa-xmark" />
              </button>
            </li>
          </ul>

          <p v-if="repetidos.size" class="esv__aviso esv__aviso--error">
            <i class="fa-solid fa-triangle-exclamation" /> Hay dos videos conectados al mismo guion.
          </p>
          <ul v-if="resultado.errores.length" class="esv__aviso esv__aviso--error">
            <li v-for="(e, i) in resultado.errores" :key="i">{{ e }}</li>
          </ul>

          <button type="button" class="esv__btn" :disabled="!puedeConectar" @click="conectar">
            <i v-if="conectando" class="fa-solid fa-spinner fa-spin" />
            <i v-else class="fa-solid fa-link" />
            Conectar {{ asignados.length }} video{{ asignados.length === 1 ? '' : 's' }}
          </button>
          <p class="esv__ayuda">
            Al conectar, cada video queda como versión nueva y pasa a la revisión interna. Cuando el equipo
            la aprueba, al cliente le llega el aviso por Telegram, WhatsApp y correo para revisarlo.
          </p>
        </div>
      </div>

      <!-- Guiones con cambios del cliente: lo que hay que corregir antes de re-subir -->
      <div v-if="planificacion && guiones.some((g) => g.correcciones.length && g.edicion === 'RECHAZADO')" class="esv__paso esv__paso--cambios">
        <span class="esv__num"><i class="fa-solid fa-pen-to-square" /></span>
        <div class="esv__cuerpo">
          <h3>Cambios que pidió el cliente</h3>
          <div v-for="g in guiones.filter((x) => x.correcciones.length && x.edicion === 'RECHAZADO')" :key="g.itemId" class="esv__corr">
            <strong>#{{ String(g.numero).padStart(2, '0') }} {{ g.tema }}</strong>
            <small v-if="!g.rondasRestantes">Última ronda usada: la próxima versión solo se aprueba.</small>
            <ul>
              <li v-for="(c, i) in g.correcciones" :key="i"><span class="esv__seg">{{ c.segundo }}</span> {{ c.texto }}</li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.esv {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  &__estado {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2.5rem 1rem;
    color: $text-secondary;
    font-size: 0.88rem;
    text-align: center;
  }

  &__estado-icono {
    font-size: 1.8rem;
    color: #f59e0b;
  }

  &__paso {
    display: flex;
    gap: 0.8rem;
    background: $white;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 14px;
    padding: 1rem;

    &--cambios { border-color: rgba(#f59e0b, 0.35); }
  }

  &__num {
    flex-shrink: 0;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba($primary, 0.1);
    color: $primary;
    font-weight: 800;
    font-size: 0.85rem;
  }

  &__cuerpo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    h3 {
      margin: 0.2rem 0 0;
      font-size: 0.95rem;
      color: $primary-dark;
    }
  }

  &__ayuda {
    margin: 0;
    font-size: 0.78rem;
    color: $text-secondary;
    line-height: 1.5;

    a {
      color: #1ea362;
      font-weight: 700;
      text-decoration: none;
      margin-left: 0.3rem;
    }

    code {
      background: rgba($primary, 0.07);
      border-radius: 4px;
      padding: 0 0.25rem;
    }
  }

  &__select {
    width: 100%;
    max-width: 420px;
    border: 1px solid rgba($primary-dark, 0.15);
    border-radius: 10px;
    padding: 0.55rem 0.7rem;
    font-size: 0.85rem;
    background: $white;
    color: $primary-dark;

    &--guion {
      max-width: 340px;
      flex: 1;
      min-width: 0;
    }

    &.is-error { border-color: #dc2626; }
  }

  &__planes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 0.5rem;
  }

  &__plan {
    text-align: left;
    border: 1px solid rgba($primary-dark, 0.1);
    background: $white;
    border-radius: 12px;
    padding: 0.65rem 0.75rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    transition: border-color 0.15s ease, background 0.15s ease;

    strong { font-size: 0.85rem; color: $primary-dark; }
    span { font-size: 0.74rem; color: $text-secondary; }
    i { color: #2563eb; margin-right: 0.2rem; }

    &:hover { border-color: rgba($primary, 0.35); }
    &.is-active {
      border-color: $primary;
      background: rgba($primary, 0.05);
    }
  }

  &__drop {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    border: 2px dashed rgba($primary, 0.3);
    border-radius: 14px;
    padding: 1.6rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    i { font-size: 1.7rem; color: #2563eb; }
    span { font-size: 0.88rem; color: $primary-dark; }
    small { font-size: 0.74rem; color: $text-secondary; }

    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    &.is-over,
    &:hover {
      background: rgba(#2563eb, 0.05);
      border-color: #2563eb;
    }
  }

  &__lista {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__archivo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 12px;
    padding: 0.55rem 0.7rem;

    &--error { border-color: rgba(#dc2626, 0.35); }
    &--conectado { border-color: rgba(#10b981, 0.4); background: rgba(#10b981, 0.04); }
  }

  &__archivo-info {
    flex: 1 1 220px;
    min-width: 0;
    display: flex;
    gap: 0.55rem;
    align-items: flex-start;
  }

  &__archivo-icono {
    margin-top: 0.15rem;
    color: #7c3aed;

    &.fa-circle-check { color: #10b981; }
    &.fa-link { color: #059669; }
    &.fa-triangle-exclamation { color: #dc2626; }
  }

  &__archivo-texto {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;

    small { font-size: 0.72rem; color: $text-secondary; }
  }

  &__archivo-nombre {
    font-size: 0.83rem;
    font-weight: 600;
    color: $primary-dark;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__barra {
    height: 4px;
    border-radius: 4px;
    background: rgba($primary, 0.1);
    overflow: hidden;

    div {
      height: 100%;
      background: #2563eb;
      transition: width 0.3s ease;
    }
  }

  &__mini {
    border: 1px solid rgba($primary, 0.25);
    background: $white;
    color: $primary;
    border-radius: 9px;
    padding: 0.35rem 0.65rem;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
  }

  &__quitar {
    border: none;
    background: none;
    color: $text-secondary;
    cursor: pointer;
    padding: 0.3rem;

    &:hover { color: #dc2626; }
  }

  &__aviso {
    margin: 0;
    padding: 0.5rem 0.7rem;
    border-radius: 10px;
    font-size: 0.78rem;
    list-style: none;

    &--error {
      background: rgba(#dc2626, 0.06);
      color: #b91c1c;
    }

    i { margin-right: 0.3rem; }
  }

  &__btn {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: none;
    border-radius: 11px;
    padding: 0.65rem 1.1rem;
    background: #e6285c;
    color: #fff;
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__corr {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    strong { font-size: 0.84rem; color: $primary-dark; }
    small { font-size: 0.74rem; color: #b45309; }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    li { font-size: 0.8rem; color: $primary-dark; }
  }

  &__seg {
    display: inline-block;
    min-width: 2.6rem;
    font-family: ui-monospace, Menlo, monospace;
    font-weight: 700;
    color: #e6285c;
  }
}
</style>
