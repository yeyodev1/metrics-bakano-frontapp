<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { EditorQueue, EditorQueueItem } from '@/services/videoPlanning.service'
import EditorQueueCard from './components/EditorQueueCard.vue'

/**
 * La cola de trabajo del editor. Re-editar y por-subir son listas cortas y
 * van planas; "por editar" puede pasar de 100 items (todos los clientes del
 * mes), asi que se agrupa por cliente en bloques colapsables con contador y
 * la fecha mas urgente del grupo a la vista.
 */
const props = defineProps<{ queue: EditorQueue | null; loading: boolean }>()

const router = useRouter()
const listosAbierto = ref(false)
const busqueda = ref('')
const gruposAbiertos = ref<Set<string>>(new Set())

function coincide(item: EditorQueueItem): boolean {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return true
  return (
    item.workspaceName.toLowerCase().includes(q) ||
    item.tema.toLowerCase().includes(q)
  )
}

const reEditar = computed(() => (props.queue?.reEditar ?? []).filter(coincide))
const porSubir = computed(() => (props.queue?.porSubirMaster ?? []).filter(coincide))

interface Grupo {
  workspaceId: string
  workspaceName: string
  items: EditorQueueItem[]
  /** Timestamp de la fecha de publicacion mas proxima; Infinity sin fechas. */
  fechaMin: number
  urgente: boolean
}

const grupos = computed<Grupo[]>(() => {
  const porWorkspace = new Map<string, Grupo>()
  for (const item of props.queue?.porEditar ?? []) {
    if (!coincide(item)) continue
    let g = porWorkspace.get(item.workspaceId)
    if (!g) {
      g = {
        workspaceId: item.workspaceId,
        workspaceName: item.workspaceName,
        items: [],
        fechaMin: Infinity,
        urgente: false,
      }
      porWorkspace.set(item.workspaceId, g)
    }
    g.items.push(item)
    if (item.fechaPublicacion) {
      const t = new Date(item.fechaPublicacion).getTime()
      if (t < g.fechaMin) g.fechaMin = t
      if (t - Date.now() < 4 * 86_400_000) g.urgente = true
    }
  }
  // El cliente que publica antes va primero; sin fechas, al final.
  return [...porWorkspace.values()].sort((a, b) => a.fechaMin - b.fechaMin)
})

const totalPorEditar = computed(() =>
  grupos.value.reduce((n, g) => n + g.items.length, 0)
)

/** Con busqueda activa los grupos se abren solos: el editor busca un video. */
function grupoAbierto(id: string): boolean {
  if (busqueda.value.trim()) return true
  return gruposAbiertos.value.has(id)
}

function toggleGrupo(id: string) {
  const set = new Set(gruposAbiertos.value)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  gruposAbiertos.value = set
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

function etiquetaGrupo(g: Grupo): string | null {
  if (!isFinite(g.fechaMin)) return null
  const dia = new Date(g.fechaMin)
  dia.setHours(0, 0, 0, 0)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86_400_000)
  if (diff < 0) return `Vencido hace ${-diff} d`
  if (diff === 0) return 'Publica HOY'
  if (diff <= 3) return `Publica en ${diff} d`
  return new Date(g.fechaMin).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
}

function abrir(item: EditorQueueItem) {
  router.push({
    name: 'EditorVideoPlanning',
    params: { workspaceId: item.workspaceId, entryId: item.entryId },
  })
}
</script>

<template>
  <div class="ewq">
    <div v-if="loading" class="ewq__loading"><span class="ewq__spinner" /></div>

    <template v-else>
      <label class="ewq__search">
        <i class="fa-solid fa-magnifying-glass" />
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por cliente o tema…"
          autocomplete="off"
        />
      </label>

      <!-- Re-editar: urgente, plano y con el motivo a la vista -->
      <section class="ewq__section">
        <div class="ewq__section-head">
          <span class="ewq__dot ewq__dot--danger" />
          <h2 class="ewq__section-title">Re-editar</h2>
          <span class="ewq__count ewq__count--danger">{{ reEditar.length }}</span>
        </div>
        <p v-if="reEditar.length === 0" class="ewq__vacio">
          <i class="fa-solid fa-circle-check" /> Nada rechazado. Sigue así.
        </p>
        <div v-else class="ewq__cards">
          <EditorQueueCard
            v-for="item in reEditar"
            :key="item.itemId"
            :item="item"
            modo="re-editar"
            mostrar-workspace
            @abrir="abrir(item)"
          />
        </div>
      </section>

      <!-- Por editar: agrupado por cliente -->
      <section class="ewq__section">
        <div class="ewq__section-head">
          <span class="ewq__dot ewq__dot--primary" />
          <h2 class="ewq__section-title">Por editar</h2>
          <span class="ewq__count ewq__count--primary">{{ totalPorEditar }}</span>
          <span class="ewq__hint">{{ grupos.length }} clientes</span>
        </div>
        <p v-if="grupos.length === 0" class="ewq__vacio">
          <i class="fa-solid fa-circle-check" /> Sin material grabado esperando edición.
        </p>
        <div v-else class="ewq__grupos">
          <div v-for="g in grupos" :key="g.workspaceId" class="ewq__grupo">
            <button type="button" class="ewq__grupo-head" @click="toggleGrupo(g.workspaceId)">
              <span class="ewq__avatar">{{ iniciales(g.workspaceName) }}</span>
              <span class="ewq__grupo-nombre">{{ g.workspaceName }}</span>
              <span class="ewq__count ewq__count--primary">{{ g.items.length }}</span>
              <span
                v-if="etiquetaGrupo(g)"
                class="ewq__grupo-fecha"
                :class="{ 'ewq__grupo-fecha--urgente': g.urgente }"
              >
                <i class="fa-regular fa-clock" /> {{ etiquetaGrupo(g) }}
              </span>
              <i
                class="fa-solid ewq__chevron"
                :class="grupoAbierto(g.workspaceId) ? 'fa-chevron-up' : 'fa-chevron-down'"
              />
            </button>
            <div v-if="grupoAbierto(g.workspaceId)" class="ewq__cards ewq__cards--anidadas">
              <EditorQueueCard
                v-for="item in g.items"
                :key="item.itemId"
                :item="item"
                modo="por-editar"
                @abrir="abrir(item)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Por subir master: lista corta, plana -->
      <section class="ewq__section">
        <div class="ewq__section-head">
          <span class="ewq__dot ewq__dot--warn" />
          <h2 class="ewq__section-title">Por subir master a Drive</h2>
          <span class="ewq__count ewq__count--warn">{{ porSubir.length }}</span>
        </div>
        <p v-if="porSubir.length === 0" class="ewq__vacio">
          <i class="fa-solid fa-circle-check" /> Todos los editados tienen su master en Drive.
        </p>
        <div v-else class="ewq__cards">
          <EditorQueueCard
            v-for="item in porSubir"
            :key="item.itemId"
            :item="item"
            modo="por-subir"
            mostrar-workspace
            @abrir="abrir(item)"
          />
        </div>
      </section>

      <!-- Listos este mes: colapsado, con sus links de Drive -->
      <div class="ewq__section">
        <button type="button" class="ewq__listos" @click="listosAbierto = !listosAbierto">
          <span class="ewq__dot ewq__dot--ok" />
          <span class="ewq__listos-label">Listos este mes</span>
          <span class="ewq__count ewq__count--ok">{{ queue?.listosCount ?? 0 }}</span>
          <i class="fa-solid" :class="listosAbierto ? 'fa-chevron-up' : 'fa-chevron-down'" />
        </button>
        <div v-if="listosAbierto" class="ewq__cards">
          <EditorQueueCard
            v-for="item in queue?.listos ?? []"
            :key="item.itemId"
            :item="item"
            modo="listo"
            mostrar-workspace
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// Mobile-first: todo apilado; en pantallas anchas las cards crecen a fila.
.ewq {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.ewq__loading { display: flex; justify-content: center; padding: 3rem 0; }

.ewq__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(#6366f1, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: ewq-spin 0.8s linear infinite;
}

.ewq__search {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.12);
  border-radius: 11px;
  padding: 0.55rem 0.85rem;

  i { color: $text-secondary; font-size: 0.78rem; }

  input {
    flex: 1;
    border: none;
    outline: none;
    background: none;
    font-family: inherit;
    font-size: 0.85rem;
    color: $primary-dark;

    &::placeholder { color: rgba($text-secondary, 0.7); }
  }

  &:focus-within { border-color: rgba(#6366f1, 0.5); }
}

.ewq__section { display: flex; flex-direction: column; gap: 0.55rem; }

.ewq__section-head { display: flex; align-items: center; gap: 0.5rem; }

.ewq__dot {
  width: 8px; height: 8px; border-radius: 50%;
  &--danger { background: $alert-error; }
  &--primary { background: #6366f1; }
  &--warn { background: #d97706; }
  &--ok { background: $alert-success; }
}

.ewq__section-title {
  font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; color: $primary-dark;
}

.ewq__count {
  font-size: 0.7rem; font-weight: 800; padding: 0.05rem 0.5rem; border-radius: 999px;
  &--danger { background: $alert-error-bg; color: $alert-error; }
  &--primary { background: rgba(#6366f1, 0.1); color: #6366f1; }
  &--warn { background: rgba(#d97706, 0.1); color: #b45309; }
  &--ok { background: rgba($alert-success, 0.1); color: darken($alert-success, 8%); }
}

.ewq__hint { font-size: 0.72rem; color: $text-secondary; }

.ewq__vacio {
  font-size: 0.82rem; color: $text-secondary; padding-left: 0.2rem;
  display: flex; align-items: center; gap: 0.4rem;
  i { color: $alert-success; font-size: 0.78rem; }
}

.ewq__cards {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;

  &--anidadas { padding: 0.55rem 0.65rem 0.65rem; }
}

.ewq__grupos { display: flex; flex-direction: column; gap: 0.55rem; }

.ewq__grupo {
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 13px;
  overflow: hidden;
}

.ewq__grupo-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  text-align: left;

  &:hover { background: rgba($primary-dark, 0.02); }
}

.ewq__avatar {
  width: 34px; height: 34px; border-radius: 9px;
  background: rgba(#6366f1, 0.1); color: #6366f1;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.74rem; font-weight: 800; flex-shrink: 0;
}

.ewq__grupo-nombre {
  flex: 1; min-width: 0; font-size: 0.86rem; font-weight: 800; color: $primary-dark;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.ewq__grupo-fecha {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;

  &--urgente { color: #b45309; background: rgba(#d97706, 0.1); }
}

.ewq__chevron { font-size: 0.62rem; color: $text-secondary; flex-shrink: 0; }

.ewq__listos {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.2rem 0.2rem 0.5rem;
  background: none; border: none; font-family: inherit; cursor: pointer;
  > i { font-size: 0.6rem; color: $text-secondary; }
}

.ewq__listos-label {
  font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; color: $text-secondary;
}

@keyframes ewq-spin { to { transform: rotate(360deg); } }
</style>
