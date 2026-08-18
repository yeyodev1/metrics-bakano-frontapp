<template>
  <div class="wsb" :class="{ 'is-loading': cargando }" role="group" aria-label="Filtrar entornos">
    <button
      v-for="chip in chips"
      :key="chip.valor"
      type="button"
      class="wsb__chip"
      :class="[`wsb__chip--${chip.tono}`, { 'is-active': filtro === chip.valor }]"
      @click="seleccionar(chip.valor)"
    >
      <i v-if="chip.icon" :class="chip.icon" aria-hidden="true" />
      <span class="wsb__chip-label">{{ chip.label }}</span>
      <span class="wsb__chip-count">{{ cargando ? '—' : chip.conteo }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { workspaceService } from '@/services/workspace.service'

/**
 * Antes esto era una fila de números pasivos: "71 sin perfil de marca" no
 * llevaba a ningún lado y habia que buscar esos 71 a mano. Ahora cada conteo
 * es un filtro: tocarlo filtra el listado con el MISMO criterio con el que
 * el servidor lo contó, así el número y la lista nunca se contradicen.
 */
export type FiltroEntornos = '' | 'activos' | 'inactivos' | 'sin_perfil' | 'sin_meta'

interface Resumen {
  total: number
  activos: number
  inactivos: number
  sinPerfilMarca: number
  sinMetaVinculada: number
}

const filtro = defineModel<FiltroEntornos>('filtro', { default: '' })

const resumen = ref<Resumen | null>(null)
const cargando = ref(true)

const chips = computed(() => [
  { valor: '' as FiltroEntornos, label: 'Todos', conteo: resumen.value?.total ?? 0, tono: 'neutro', icon: '' },
  { valor: 'activos' as FiltroEntornos, label: 'Activos', conteo: resumen.value?.activos ?? 0, tono: 'ok', icon: '' },
  { valor: 'inactivos' as FiltroEntornos, label: 'Inactivos', conteo: resumen.value?.inactivos ?? 0, tono: 'apagado', icon: '' },
  // Estos dos son trabajo pendiente del equipo, no estadística: sin perfil de
  // marca la IA no puede escribir guiones, y sin Meta no hay ROAS.
  { valor: 'sin_perfil' as FiltroEntornos, label: 'Sin perfil de marca', conteo: resumen.value?.sinPerfilMarca ?? 0, tono: 'alerta', icon: 'fa-solid fa-triangle-exclamation' },
  { valor: 'sin_meta' as FiltroEntornos, label: 'Sin Meta', conteo: resumen.value?.sinMetaVinculada ?? 0, tono: 'alerta', icon: 'fa-brands fa-meta' },
])

function seleccionar(valor: FiltroEntornos) {
  // Volver a tocar el filtro activo lo apaga: regresa a "Todos".
  filtro.value = filtro.value === valor ? '' : valor
}

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
// Mobile-first: una fila con scroll horizontal; en pantallas anchas envuelve.
.wsb {
  width: 100%;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;

  &.is-loading { opacity: 0.6; }

  @media (min-width: 768px) {
    flex-wrap: wrap;
    overflow-x: visible;
    padding-bottom: 0;
  }
}

.wsb__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid rgba($primary-dark, 0.12);
  background: $white;
  color: $primary-dark;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.15s ease;

  i { font-size: 0.72rem; }

  &--ok i, &--ok .wsb__chip-count { color: $alert-success; }
  &--apagado .wsb__chip-count { color: $text-secondary; }

  &--alerta {
    border-color: rgba(#d97706, 0.35);
    background: rgba(#d97706, 0.05);
    color: #92400e;

    i, .wsb__chip-count { color: #d97706; }
  }

  &:hover:not(.is-active) {
    border-color: rgba($primary-dark, 0.3);
  }

  &.is-active {
    background: $primary-dark;
    border-color: $primary-dark;
    color: $white;

    i, .wsb__chip-count { color: $white; }

    .wsb__chip-count {
      background: rgba($white, 0.18);
    }
  }
}

.wsb__chip-count {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: rgba($primary-dark, 0.06);
}
</style>
