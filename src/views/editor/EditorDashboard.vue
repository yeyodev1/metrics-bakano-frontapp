<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { swr } from '@/composables/useSwrCache'
import { videoPlanningService, type EditorQueue } from '@/services/videoPlanning.service'
import EditorWorkQueue from './EditorWorkQueue.vue'
import EditorCalendar from './EditorCalendar.vue'

/**
 * Panel del editor. Antes era SOLO el calendario de planificaciones: no
 * decia que editar, que rechazaron ni que master falta. Ahora la pestana
 * principal es la cola de trabajo y el calendario queda como apoyo.
 */
const userStore = useUserStore()

// La pestana es la ruta: /editor = trabajo, /editor/calendario = calendario.
const route = useRoute()
const tab = computed<'trabajo' | 'calendario'>(() => (route.name === 'EditorCalendario' ? 'calendario' : 'trabajo'))
const queue = ref<EditorQueue | null>(null)
const loading = ref(true)

const nombre = computed(() => (userStore.name || 'Editor').split(' ')[0])

const flagClass = computed(() => {
  const pct = queue.value?.stats.pct
  if (pct === null || pct === undefined) return 'edd__stat-flag--none'
  if (pct >= 85) return 'edd__stat-flag--verde'
  if (pct >= 70) return 'edd__stat-flag--amarillo'
  return 'edd__stat-flag--rojo'
})

const pendientes = computed(() =>
  (queue.value?.reEditar.length ?? 0) +
  (queue.value?.porEditar.length ?? 0) +
  (queue.value?.porSubirMaster.length ?? 0),
)

/** Pinta la ultima cola vista al instante y la refresca por detras. */
async function cargar() {
  const { cached, fresh } = swr('editor:queue', () => videoPlanningService.getEditorQueue(), {
    onFresh: (q) => { queue.value = q },
  })
  if (cached) { queue.value = cached; loading.value = false }
  try {
    queue.value = await fresh
  } catch {
    if (!queue.value) queue.value = null
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="edd">
    <!-- Header: saludo + numeros personales (sistema de banderas) -->
    <div class="edd__header">
      <div class="edd__saludo">
        <h1 class="edd__titulo">Hola, {{ nombre }}</h1>
        <span class="edd__sub">
          {{ pendientes }} pendientes en tu cola ·
          {{ new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }) }}
        </span>
      </div>
      <div class="edd__stats">
        <div class="edd__stat">
          <span class="edd__stat-flag" :class="flagClass"><i class="fa-solid fa-flag" /></span>
          <div class="edd__stat-body">
            <strong>{{ queue?.stats.pct != null ? queue.stats.pct + '%' : '—' }}</strong>
            <span>Aprobación</span>
          </div>
        </div>
        <div class="edd__stat">
          <div class="edd__stat-body">
            <strong>{{ queue?.listosCount ?? '—' }}</strong>
            <span>Editados este mes</span>
          </div>
        </div>
        <div class="edd__stat" :class="{ 'edd__stat--alerta': (queue?.reEditar.length ?? 0) > 0 }">
          <div class="edd__stat-body">
            <strong>{{ queue?.reEditar.length ?? '—' }}</strong>
            <span>Re-ediciones</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="edd__tabs">
      <RouterLink
        :to="{ name: 'EditorDashboard' }"
        class="edd__tab"
        :class="{ 'is-active': tab === 'trabajo' }"
      >
        <i class="fa-solid fa-list-check" /> Mi trabajo
        <span v-if="pendientes > 0" class="edd__tab-count">{{ pendientes }}</span>
      </RouterLink>
      <RouterLink
        :to="{ name: 'EditorCalendario' }"
        class="edd__tab"
        :class="{ 'is-active': tab === 'calendario' }"
      >
        <i class="fa-regular fa-calendar" /> Calendario
      </RouterLink>
    </div>

    <EditorWorkQueue v-if="tab === 'trabajo'" :queue="queue" :loading="loading" />
    <EditorCalendar v-else />
  </div>
</template>

<style lang="scss" scoped>
// Mobile-first: header apilado, stats con scroll horizontal.
.edd {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  // El shell del editor corta el overflow en desktop: el scroll vive aqui.
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  @media (min-width: 768px) { padding: 1.5rem 1.75rem; }
}

.edd__header {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  @media (min-width: 900px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.edd__titulo {
  font-size: 1.35rem;
  font-weight: 800;
  color: $primary-dark;
}

.edd__sub {
  font-size: 0.8rem;
  color: $text-secondary;
  text-transform: capitalize;
}

.edd__stats {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;

  @media (min-width: 900px) { overflow-x: visible; padding-bottom: 0; }
}

.edd__stat {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  padding: 0.55rem 0.9rem;
  flex-shrink: 0;

  &--alerta {
    border-color: rgba($alert-error, 0.3);
    background: rgba($alert-error, 0.04);

    .edd__stat-body strong { color: $alert-error; }
  }
}

.edd__stat-flag {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;

  &--verde { background: rgba($alert-success, 0.12); color: $alert-success; }
  &--amarillo { background: rgba(#d97706, 0.12); color: #d97706; }
  &--rojo { background: $alert-error-bg; color: $alert-error; }
  &--none { background: rgba($primary-dark, 0.06); color: $text-secondary; }
}

.edd__stat-body {
  display: flex;
  flex-direction: column;
  line-height: 1.15;

  strong { font-size: 0.95rem; font-weight: 800; color: $primary-dark; }
  span { font-size: 0.62rem; font-weight: 600; color: $text-secondary; white-space: nowrap; }
}

.edd__tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid rgba($primary-dark, 0.08);
}

.edd__tab {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  padding: 0.6rem 0.9rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;

  i { font-size: 0.78rem; }

  &.is-active {
    color: #6366f1;
    font-weight: 700;
    border-bottom-color: #6366f1;
  }
}

.edd__tab-count {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  background: rgba(#6366f1, 0.1);
  color: #6366f1;
}
</style>
