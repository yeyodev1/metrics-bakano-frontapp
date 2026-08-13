<template>
  <div class="wsb" :class="{ 'is-loading': cargando }">
    <article v-for="dato in datos" :key="dato.label" class="wsb__card" :class="`wsb__card--${dato.tono}`">
      <span class="wsb__icon"><i :class="dato.icon" aria-hidden="true" /></span>
      <div class="wsb__body">
        <strong class="wsb__valor">{{ cargando ? '—' : dato.valor }}</strong>
        <span class="wsb__label">{{ dato.label }}</span>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { workspaceService } from '@/services/workspace.service'

/**
 * Los números que el listado no podía dar.
 *
 * El listado viene paginado de 10 en 10, así que "cuántos entornos hay" o
 * "cuántos siguen sin perfil de marca" no se podían responder sin traerse
 * todos los documentos. Esto sale de un solo agregado en el servidor.
 */
interface Resumen {
  total: number
  activos: number
  inactivos: number
  sinPerfilMarca: number
  sinMetaVinculada: number
}

const resumen = ref<Resumen | null>(null)
const cargando = ref(true)

const datos = computed(() => [
  {
    label: 'Entornos',
    valor: resumen.value?.total ?? 0,
    icon: 'fa-solid fa-layer-group',
    tono: 'neutro',
  },
  {
    label: 'Activos',
    valor: resumen.value?.activos ?? 0,
    icon: 'fa-solid fa-circle-check',
    tono: 'ok',
  },
  {
    label: 'Inactivos',
    valor: resumen.value?.inactivos ?? 0,
    icon: 'fa-solid fa-circle-pause',
    tono: 'apagado',
  },
  // Estos dos son trabajo pendiente del equipo, no estadística: sin perfil de
  // marca la IA no puede escribir guiones, y sin Meta no hay ROAS.
  {
    label: 'Sin perfil de marca',
    valor: resumen.value?.sinPerfilMarca ?? 0,
    icon: 'fa-solid fa-triangle-exclamation',
    tono: 'alerta',
  },
  {
    label: 'Sin Meta vinculada',
    valor: resumen.value?.sinMetaVinculada ?? 0,
    icon: 'fa-brands fa-meta',
    tono: 'alerta',
  },
])

async function cargar() {
  try {
    const { summary } = await workspaceService.getWorkspacesSummary()
    resumen.value = summary
  } catch {
    // Sin resumen la pantalla sigue siendo usable: el listado no depende de esto.
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
defineExpose({ recargar: cargar })
</script>

<style lang="scss" scoped>
.wsb {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;

  &.is-loading { opacity: 0.6; }
}

.wsb__card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 14px;

  &--alerta { border-color: rgba(#d97706, 0.35); background: rgba(#d97706, 0.04); }
}

.wsb__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  font-size: 0.9rem;
  border-radius: 10px;
  color: $text-secondary;
  background: rgba($primary-dark, 0.05);

  .wsb__card--ok & { color: $alert-success; background: rgba($alert-success, 0.1); }
  .wsb__card--alerta & { color: #d97706; background: rgba(#d97706, 0.12); }
}

.wsb__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wsb__valor {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
  color: $primary-dark;
}

.wsb__label {
  font-size: 0.72rem;
  font-weight: 600;
  color: $text-secondary;
}
</style>
