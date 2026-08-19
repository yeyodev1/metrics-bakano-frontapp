<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { videoPlanningService, type ReviewQueueItem } from '@/services/videoPlanning.service'
import { useToast } from '@/composables/useToast'
import ReviewVideoCard from './components/ReviewVideoCard.vue'
import RejectVideoModal from './components/RejectVideoModal.vue'

/**
 * Revision de videos editados. El editor marca EDITADO, llega el correo y
 * el PM/CM verifica aqui: aprueba (queda listo para publicar) o rechaza con
 * motivo (vuelve a la cola del editor y alimenta las banderas).
 */
const toast = useToast()

const pendientes = ref<ReviewQueueItem[]>([])
const loading = ref(true)
const busyItemId = ref<string | null>(null)
const rechazando = ref<ReviewQueueItem | null>(null)
const guardandoRechazo = ref(false)

const porCliente = computed(() => {
  const grupos = new Map<string, ReviewQueueItem[]>()
  for (const item of pendientes.value) {
    const lista = grupos.get(item.workspaceName) ?? []
    lista.push(item)
    grupos.set(item.workspaceName, lista)
  }
  return [...grupos.entries()].map(([nombre, items]) => ({ nombre, items }))
})

async function cargar() {
  loading.value = true
  try {
    const res = await videoPlanningService.getReviewQueue()
    pendientes.value = res.pendientes
  } catch {
    toast.error('No se pudo cargar la cola de revisión.')
  } finally {
    loading.value = false
  }
}

async function aprobar(item: ReviewQueueItem) {
  busyItemId.value = item.itemId
  try {
    await videoPlanningService.updateItem(item.planningId, item.itemId, {
      edicionRevisada: true,
    } as any)
    pendientes.value = pendientes.value.filter((p) => p.itemId !== item.itemId)
    toast.success(`#${String(item.numero).padStart(2, '0')} ${item.tema} aprobado.`)
  } catch {
    toast.error('No se pudo aprobar. Intenta de nuevo.')
  } finally {
    busyItemId.value = null
  }
}

async function confirmarRechazo(payload: { motivo: string; motivoCategoria: string }) {
  const item = rechazando.value
  if (!item) return
  guardandoRechazo.value = true
  try {
    await videoPlanningService.updateItem(item.planningId, item.itemId, {
      edicion: 'RECHAZADO',
      motivoRechazo: payload.motivo,
      motivoCategoria: payload.motivoCategoria,
    } as any)
    pendientes.value = pendientes.value.filter((p) => p.itemId !== item.itemId)
    rechazando.value = null
    toast.success('Devuelto al editor con tu motivo.')
  } catch {
    toast.error('No se pudo rechazar. Intenta de nuevo.')
  } finally {
    guardandoRechazo.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="rvv">
    <header class="rvv__header">
      <div>
        <h1 class="rvv__title">Revisión de videos</h1>
        <span class="rvv__sub">
          Editados esperando tu visto bueno antes de publicar
        </span>
      </div>
      <span class="rvv__total" :class="{ 'rvv__total--zero': pendientes.length === 0 }">
        {{ pendientes.length }} pendientes
      </span>
    </header>

    <div v-if="loading" class="rvv__loading"><span class="rvv__spinner" /></div>

    <div v-else-if="pendientes.length === 0" class="rvv__empty">
      <div class="rvv__empty-icon"><i class="fa-solid fa-circle-check" /></div>
      <h3>Nada pendiente de revisión</h3>
      <p>Cuando un editor marque un video como editado, aparecerá aquí y te llegará un correo.</p>
    </div>

    <template v-else>
      <section v-for="grupo in porCliente" :key="grupo.nombre" class="rvv__grupo">
        <div class="rvv__grupo-head">
          <span class="rvv__grupo-avatar">{{ grupo.nombre.charAt(0).toUpperCase() }}</span>
          <h2 class="rvv__grupo-title">{{ grupo.nombre }}</h2>
          <span class="rvv__grupo-count">{{ grupo.items.length }}</span>
        </div>
        <div class="rvv__grid">
          <ReviewVideoCard
            v-for="item in grupo.items"
            :key="item.itemId"
            :item="item"
            :busy="busyItemId === item.itemId"
            @aprobar="aprobar(item)"
            @rechazar="rechazando = item"
          />
        </div>
      </section>
    </template>

    <RejectVideoModal
      :item="rechazando"
      :saving="guardandoRechazo"
      @close="rechazando = null"
      @confirm="confirmarRechazo"
    />
  </div>
</template>

<style lang="scss" scoped>
// Mobile-first: una columna; el grid crece con la pantalla.
.rvv {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (min-width: 768px) { padding: 1.5rem 2rem; }
}

.rvv__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.rvv__title { font-size: 1.35rem; font-weight: 800; color: $primary-dark; }

.rvv__sub { font-size: 0.82rem; color: $text-secondary; }

.rvv__total {
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba($primary, 0.1);
  color: $primary;

  &--zero { background: rgba($alert-success, 0.1); color: darken($alert-success, 8%); }
}

.rvv__grupo { display: flex; flex-direction: column; gap: 0.7rem; }

.rvv__grupo-head { display: flex; align-items: center; gap: 0.55rem; }

.rvv__grupo-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba($primary, 0.09);
  color: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
}

.rvv__grupo-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: $primary-dark;
}

.rvv__grupo-count {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: rgba($primary-dark, 0.06);
  color: $text-secondary;
}

.rvv__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;

  @media (min-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 1200px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.rvv__loading { display: flex; justify-content: center; padding: 4rem 0; }

.rvv__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba($primary, 0.2);
  border-top-color: $primary;
  border-radius: 50%;
  animation: rvv-spin 0.8s linear infinite;
}

.rvv__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3.5rem 1rem;
  text-align: center;

  h3 { font-size: 1rem; font-weight: 800; color: $primary-dark; }
  p { font-size: 0.84rem; color: $text-secondary; max-width: 380px; }
}

.rvv__empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba($alert-success, 0.1);
  color: $alert-success;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-bottom: 0.4rem;
}

@keyframes rvv-spin { to { transform: rotate(360deg); } }
</style>
