<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { videoPlanningService } from '@/services/videoPlanning.service'
import AvisoRevisionBanner from '@/components/videoPlanning/AvisoRevisionBanner.vue'
import EditorPlanningItemCard from './components/EditorPlanningItemCard.vue'
import { EstadoEdicion } from '@/types/videoPlanning'
import type { VideoItem, VideoPlanning } from '@/types/videoPlanning'

/**
 * La produccion vista por el editor, ordenada por lo que tiene que HACER:
 * primero lo editable (rechazados y grabados sin editar) con su fecha limite,
 * despues lo que aun no se graba, y los editados al final, colapsados.
 * La lista cronologica de antes obligaba a escanear 20 filas para encontrar
 * el trabajo pendiente.
 */
const route = useRoute()
const router = useRouter()

const workspaceId = route.params['workspaceId'] as string
const entryId = route.params['entryId'] as string
const title = (route.query['title'] as string) || 'Producción'

const planning = ref<VideoPlanning | null>(null)
const loading = ref(true)
const expandedId = ref<string | null>(null)
const updatingId = ref<string | null>(null)
const editadosAbierto = ref(false)

async function load() {
  try {
    const loaded = await videoPlanningService.getByEntry(entryId)
    if (loaded && loaded.workspaceId && loaded.workspaceId !== workspaceId) {
      throw new Error('Workspace mismatch')
    }
    planning.value = loaded
  } catch { /* silent */ } finally {
    loading.value = false
  }
}

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function advanceEdicion(item: VideoItem) {
  if (!planning.value || updatingId.value) return
  const next = item.edicion === EstadoEdicion.EDITADO
    ? EstadoEdicion.POR_EDITAR
    : EstadoEdicion.EDITADO
  updatingId.value = item._id
  try {
    planning.value = await videoPlanningService.updateItem(planning.value._id, item._id, { edicion: next })
  } catch { /* silent */ } finally {
    updatingId.value = null
  }
}

const items = computed(() =>
  (planning.value?.items ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((i) => i.estadoIdea !== 'RECHAZADO')
)

const grabadasCount = computed(() => items.value.filter(i => i.estadoProduccion === 'GRABADO').length)
const editadosList = computed(() => items.value.filter(i => i.edicion === EstadoEdicion.EDITADO))

/** Editables ya: rechazados de edicion primero, luego grabados sin editar. */
const paraEditar = computed(() => {
  const rechazados = items.value.filter(i => i.edicion === 'RECHAZADO')
  const grabados = items.value.filter(
    i => i.edicion === EstadoEdicion.POR_EDITAR && i.estadoProduccion === 'GRABADO'
  )
  return [...rechazados, ...grabados]
})

onMounted(load)

/** Sin material todavia: no se pueden editar, solo dan contexto. */
const sinGrabar = computed(() =>
  items.value.filter(
    i => i.edicion === EstadoEdicion.POR_EDITAR && i.estadoProduccion !== 'GRABADO'
  )
)

const DIA = 86_400_000

/**
 * Fecha limite por video. Con fechaPublicacion manda esa fecha (el video se
 * edita ANTES de publicarse). Sin fecha se estima: los pendientes se
 * reparten parejo entre hoy y fin de mes, en su orden — mejor un "mas o
 * menos" visible que ninguna presion de tiempo.
 */
const deadlines = computed(() => {
  const map = new Map<string, { texto: string; urgente: boolean; estimado: boolean }>()
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  const diasRestantes = Math.max(1, Math.round((finMes.getTime() - hoy.getTime()) / DIA))

  const sinFecha = paraEditar.value.filter(i => !i.fechaPublicacion)
  const paso = diasRestantes / Math.max(1, sinFecha.length)

  const etiqueta = (fecha: Date, estimado: boolean) => {
    const dia = new Date(fecha)
    dia.setHours(0, 0, 0, 0)
    const diff = Math.round((dia.getTime() - hoy.getTime()) / DIA)
    const corta = fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
    if (diff < 0) return { texto: `Venció hace ${-diff} d`, urgente: true, estimado }
    if (diff === 0) return { texto: 'Listo HOY', urgente: true, estimado }
    if (diff <= 2) return { texto: `Listo en ${diff} d`, urgente: true, estimado }
    return { texto: `Listo para el ${corta}`, urgente: false, estimado }
  }

  for (const item of paraEditar.value) {
    if (item.fechaPublicacion) {
      // Un dia antes de publicar: el cliente necesita margen para revisarlo.
      const limite = new Date(new Date(item.fechaPublicacion).getTime() - DIA)
      map.set(item._id, etiqueta(limite, false))
    }
  }
  sinFecha.forEach((item, i) => {
    const limite = new Date(hoy.getTime() + Math.ceil((i + 1) * paso) * DIA)
    map.set(item._id, etiqueta(limite, true))
  })
  return map
})
</script>

<template>
  <div class="evp">
    <header class="evp__header">
      <button class="evp__back" @click="router.push({ name: 'EditorDashboard' })">
        <i class="fa-solid fa-arrow-left" />
      </button>

      <div class="evp__header-info">
        <h1 class="evp__title">{{ title }}</h1>
        <div class="evp__meta">
          <span class="evp__meta-item"><i class="fa-solid fa-film" /> {{ items.length }} videos</span>
          <span class="evp__meta-sep">·</span>
          <span class="evp__meta-item evp__meta-item--green">
            <i class="fa-solid fa-circle-check" /> {{ grabadasCount }} grabados
          </span>
          <span class="evp__meta-sep">·</span>
          <span class="evp__meta-item evp__meta-item--indigo">
            <i class="fa-solid fa-wand-magic-sparkles" /> {{ editadosList.length }} / {{ items.length }} editados
          </span>
          <template v-if="planning?.driveMonthFolderLink">
            <span class="evp__meta-sep">·</span>
            <a :href="planning.driveMonthFolderLink" target="_blank" rel="noopener" class="evp__meta-item evp__drive-link">
              <i class="fa-brands fa-google-drive" /> Carpeta del mes en Drive
            </a>
          </template>
        </div>
      </div>

      <div class="evp__progress-wrap">
        <div
          class="evp__progress-bar"
          :style="{ width: items.length ? (editadosList.length / items.length * 100) + '%' : '0%' }"
        />
      </div>
    </header>

    <AvisoRevisionBanner
      v-if="planning && !loading"
      :planning="planning"
      :editadas="editadosList.length"
      :total="items.length"
      @notified="load"
    />

    <div v-if="loading" class="evp__loading">
      <i class="fa-solid fa-circle-notch fa-spin" />
      <span>Cargando videos…</span>
    </div>

    <div v-else-if="!items.length" class="evp__empty">
      <i class="fa-solid fa-video-slash" />
      <span>Sin videos en esta producción</span>
    </div>

    <div v-else class="evp__body">
      <!-- Lo que hay que editar YA, con su fecha limite -->
      <section class="evp__section">
        <div class="evp__section-head">
          <span class="evp__dot evp__dot--primary" />
          <h2 class="evp__section-title">Para editar</h2>
          <span class="evp__count evp__count--primary">{{ paraEditar.length }}</span>
        </div>
        <p v-if="!paraEditar.length" class="evp__vacio">
          <i class="fa-solid fa-circle-check" /> Nada pendiente con material grabado. Buen trabajo.
        </p>
        <div v-else class="evp__cards">
          <EditorPlanningItemCard
            v-for="item in paraEditar"
            :key="item._id"
            :item="item"
            :expanded="expandedId === item._id"
            :updating="updatingId === item._id"
            :deadline="deadlines.get(item._id) ?? null"
            @toggle="toggle(item._id)"
            @advance="advanceEdicion(item)"
          />
        </div>
      </section>

      <!-- Aun sin grabar: contexto, no trabajo -->
      <section v-if="sinGrabar.length" class="evp__section">
        <div class="evp__section-head">
          <span class="evp__dot evp__dot--muted" />
          <h2 class="evp__section-title">Aún sin grabar</h2>
          <span class="evp__count evp__count--muted">{{ sinGrabar.length }}</span>
          <span class="evp__hint">se editan cuando producción los grabe</span>
        </div>
        <div class="evp__cards">
          <EditorPlanningItemCard
            v-for="item in sinGrabar"
            :key="item._id"
            :item="item"
            :expanded="expandedId === item._id"
            :updating="updatingId === item._id"
            :deadline="null"
            @toggle="toggle(item._id)"
            @advance="advanceEdicion(item)"
          />
        </div>
      </section>

      <!-- Editados: al final y colapsados, ya no son trabajo -->
      <section class="evp__section">
        <button type="button" class="evp__toggle" @click="editadosAbierto = !editadosAbierto">
          <span class="evp__dot evp__dot--ok" />
          <span class="evp__section-title">Editados</span>
          <span class="evp__count evp__count--ok">{{ editadosList.length }}</span>
          <i class="fa-solid" :class="editadosAbierto ? 'fa-chevron-up' : 'fa-chevron-down'" />
        </button>
        <div v-if="editadosAbierto" class="evp__cards">
          <EditorPlanningItemCard
            v-for="item in editadosList"
            :key="item._id"
            :item="item"
            :expanded="expandedId === item._id"
            :updating="updatingId === item._id"
            :deadline="null"
            @toggle="toggle(item._id)"
            @advance="advanceEdicion(item)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evp {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f1f5f9;
}

.evp__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  background: $primary-dark;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(white, 0.07);
  position: relative;
}

.evp__back {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(white, 0.15);
  border-radius: 10px;
  background: rgba(white, 0.06);
  color: rgba(white, 0.65);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  transition: all 0.18s;

  &:hover { background: rgba(white, 0.13); color: white; border-color: rgba(white, 0.3); }
}

.evp__header-info { flex: 1; min-width: 0; }

.evp__title {
  font-size: 1.05rem;
  font-weight: 800;
  color: white;
  margin: 0 0 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evp__meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.evp__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: rgba(white, 0.6);

  &--green { color: #34d399; }
  &--indigo { color: #a5b4fc; }
}

.evp__drive-link { color: #34d399; &:hover { text-decoration: underline; color: #34d399; } }

.evp__meta-sep { color: rgba(white, 0.25); font-size: 0.74rem; }

.evp__progress-wrap {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 3px; background: rgba(white, 0.1);
}

.evp__progress-bar { height: 100%; background: #8b5cf6; transition: width 0.3s ease; }

.evp__loading,
.evp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3.5rem 1rem;
  color: $text-secondary;
  font-size: 0.9rem;

  i { font-size: 1.4rem; }
}

.evp__body {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.1rem 1.2rem 2rem;
  max-width: 980px;
  width: 100%;
  margin: 0 auto;
}

.evp__section { display: flex; flex-direction: column; gap: 0.55rem; }

.evp__section-head { display: flex; align-items: center; gap: 0.5rem; }

.evp__dot {
  width: 8px; height: 8px; border-radius: 50%;
  &--primary { background: #6366f1; }
  &--muted { background: #94a3b8; }
  &--ok { background: $alert-success; }
}

.evp__section-title {
  font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; color: $primary-dark;
}

.evp__count {
  font-size: 0.7rem; font-weight: 800; padding: 0.05rem 0.5rem; border-radius: 999px;
  &--primary { background: rgba(#6366f1, 0.1); color: #6366f1; }
  &--muted { background: rgba(#94a3b8, 0.15); color: #64748b; }
  &--ok { background: rgba($alert-success, 0.1); color: darken($alert-success, 8%); }
}

.evp__hint { font-size: 0.72rem; color: $text-secondary; }

.evp__vacio {
  font-size: 0.82rem; color: $text-secondary;
  display: flex; align-items: center; gap: 0.4rem;
  i { color: $alert-success; font-size: 0.78rem; }
}

.evp__cards { display: flex; flex-direction: column; gap: 0.55rem; }

.evp__toggle {
  display: flex; align-items: center; gap: 0.5rem; padding: 0;
  background: none; border: none; font-family: inherit; cursor: pointer;
  > i { font-size: 0.6rem; color: $text-secondary; }
}
</style>
