<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { workspaceService } from '@/services/workspace.service'
import { swr } from '@/composables/useSwrCache'
import ResourcesView from '@/views/resources/ResourcesView.vue'
import type { Workspace } from '@/types'

/**
 * Recursos de marca (logo, línea gráfica, catálogo) desde el panel del editor.
 * El editor vive aislado en /editor y no llegaba a la pantalla de recursos del
 * entorno: editaba sin el logo ni los colores del cliente a la mano.
 */
const route = useRoute()
const router = useRouter()

const workspaces = ref<Workspace[]>([])
const loadingWs = ref(true)

const workspaceId = computed(() => (route.params.workspaceId as string) || '')

const ordenados = computed(() => [...workspaces.value].sort((a, b) => a.name.localeCompare(b.name)))

function elegir(id: string) {
  router.replace({ name: 'EditorRecursos', params: id ? { workspaceId: id } : {} })
}

// Misma caché que el calendario del editor: la lista ya suele estar cargada.
async function loadWorkspaces() {
  loadingWs.value = true
  try {
    const { cached, fresh } = swr('editor:workspaces', () => workspaceService.listWorkspaces({ limit: 200 }), {
      ttlMs: 5 * 60_000,
      onFresh: (res) => { workspaces.value = res.workspaces.filter(w => w.isActive) },
    })
    if (cached) workspaces.value = cached.workspaces.filter(w => w.isActive)
    else await fresh
  } finally {
    loadingWs.value = false
  }
}

onMounted(loadWorkspaces)
</script>

<template>
  <div class="erc">
    <header class="erc__header">
      <div>
        <h1 class="erc__title"><i class="fa-solid fa-folder-open" /> Recursos de marca</h1>
        <p class="erc__sub">Logo, línea gráfica y catálogo de cada cliente.</p>
      </div>

      <label class="erc__picker">
        <span>Cliente</span>
        <select
          :value="workspaceId"
          :disabled="loadingWs"
          @change="elegir(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ loadingWs ? 'Cargando clientes…' : 'Elige un cliente' }}</option>
          <option v-for="ws in ordenados" :key="ws._id" :value="ws._id">{{ ws.name }}</option>
        </select>
      </label>
    </header>

    <ResourcesView v-if="workspaceId" :key="workspaceId" />

    <div v-else class="erc__empty">
      <i class="fa-solid fa-hand-pointer" />
      <p>Elige un cliente para ver su logo, su línea gráfica y su catálogo.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.erc {
  display: flex;
  flex-direction: column;
  min-width: 0;
  // El shell del editor corta el overflow en desktop: el scroll vive aqui.
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 1.5rem 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;

    i { color: #f59e0b; }
  }

  &__sub {
    margin: 0.25rem 0 0;
    color: #6b7280;
    font-size: 0.9rem;
  }

  &__picker {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 240px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #6b7280;

    select {
      padding: 0.6rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      background: #fff;
      font-size: 0.95rem;
      color: #111827;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin: 3rem 1.5rem;
    padding: 2.5rem 1rem;
    border: 1px dashed #d1d5db;
    border-radius: 14px;
    color: #6b7280;
    text-align: center;

    i { font-size: 1.75rem; color: #6366f1; }
    p { margin: 0; }
  }
}
</style>
