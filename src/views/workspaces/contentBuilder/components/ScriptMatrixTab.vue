<template>
  <div class="smt">
    <div class="smt__filters">
      <div class="smt__filter">
        <SearchableSelect
          v-model="filterCasoStr"
          label="Caso Customer Journey"
          placeholder="Todos los casos"
          search-placeholder="Buscar caso de uso..."
          :options="casoOptions"
        />
      </div>
      <div class="smt__filter">
        <SearchableSelect
          v-model="filterFunnel"
          label="Etapa del Embudo"
          placeholder="Todas las etapas"
          search-placeholder="Buscar etapa..."
          :options="FUNNEL_OPTIONS"
        />
      </div>
    </div>

    <!-- Linking is the bottleneck for every metric, so progress leads the tab -->
    <section v-if="items.length" class="smt__progress">
      <div class="smt__progress-icon" :class="{ 'is-done': !pendingCount }">
        <i :class="pendingCount ? 'fa-brands fa-instagram' : 'fa-solid fa-check'" />
      </div>

      <div class="smt__progress-body">
        <div class="smt__progress-top">
          <h4>Vinculación de reels</h4>
          <span class="smt__progress-count">
            <strong>{{ linkedCount }}</strong> de {{ items.length }}
          </span>
        </div>

        <div class="smt__bar" role="progressbar" :aria-valuenow="linkedPercent" aria-valuemin="0" aria-valuemax="100">
          <div class="smt__bar-fill" :style="{ width: `${linkedPercent}%` }" />
        </div>

        <p class="smt__progress-note">
          <template v-if="pendingCount">
            Faltan <strong>{{ pendingCount }}</strong> guiones por conectar con su
            publicación. Hasta entonces no hay métricas que analizar.
          </template>
          <template v-else>
            Todos los guiones están vinculados. Las métricas ya se están midiendo.
          </template>
        </p>
      </div>

      <div v-if="pendingCount" class="smt__segmented" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="!onlyUnlinked"
          :class="{ 'is-active': !onlyUnlinked }"
          @click="onlyUnlinked = false"
        >
          Todos
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="onlyUnlinked"
          :class="{ 'is-active': onlyUnlinked }"
          @click="onlyUnlinked = true"
        >
          Pendientes
          <span class="smt__segmented-badge">{{ pendingCount }}</span>
        </button>
      </div>
    </section>

    <p class="smt__count">
      Mostrando {{ filteredItems.length }} de {{ items.length }} guiones
    </p>

    <div v-if="!filteredItems.length" class="smt__empty">
      <i class="fa-solid fa-film" />
      <h4>No hay guiones para estos filtros</h4>
      <p>Cambia los filtros o crea un guion nuevo para comenzar.</p>
    </div>

    <!-- Grouped by month: a flat grid of 98 equal cards has no sense of time -->
    <div v-else class="smt__groups">
      <ScriptMonthGroup
        v-for="(group, index) in groups"
        :key="group.key"
        :group="group"
        :default-open="index === 0"
        @link-reel="$emit('link-reel', $event)"
        @edit-item="$emit('edit-item', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SearchableSelect from '@/components/sales/SearchableSelect.vue'
import ScriptMonthGroup from './ScriptMonthGroup.vue'
import { useScriptGroups } from '../useScriptGroups'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'
import type { CustomerJourneyCase } from '@/types'

const props = defineProps<{
  items: WorkspaceVideoItem[]
  journeyCases: CustomerJourneyCase[]
}>()

defineEmits<{
  (e: 'link-reel', item: WorkspaceVideoItem): void
  (e: 'edit-item', item: WorkspaceVideoItem): void
}>()

const FUNNEL_OPTIONS = [
  { value: 'all', label: 'Todas las etapas', icon: 'fa-solid fa-filter' },
  { value: 'TOFU', label: 'TOFU (Atracción)', subtitle: 'Top of Funnel - Alcance masivo' },
  { value: 'MOFU', label: 'MOFU (Nutrición)', subtitle: 'Middle of Funnel - Valor y prueba' },
  { value: 'BOFU', label: 'BOFU (Conversión)', subtitle: 'Bottom of Funnel - Venta directa' },
]

const filterCaso = ref<number | 'all'>('all')
const filterFunnel = ref('all')
const onlyUnlinked = ref(false)

const filterCasoStr = computed({
  get: () => String(filterCaso.value),
  set: (val: string) => {
    filterCaso.value = val === 'all' ? 'all' : parseInt(val, 10)
  },
})

// Options come from this brand's own journey — never a hardcoded list.
const casoOptions = computed(() => [
  { value: 'all', label: 'Todos los casos', icon: 'fa-solid fa-route' },
  ...props.journeyCases.map((c) => ({
    value: String(c.casoNumero),
    label: `Caso ${c.casoNumero}: ${c.nombreCaso || 'Sin nombre'}`,
    icon: 'fa-solid fa-route',
    subtitle: (c.potencialCliente || '').substring(0, 60),
  })),
])

const linkedCount = computed(() => props.items.filter((i) => !!i.igMediaId).length)
const pendingCount = computed(() => props.items.length - linkedCount.value)

const linkedPercent = computed(() =>
  props.items.length ? Math.round((linkedCount.value / props.items.length) * 100) : 0
)

const filteredItems = computed(() =>
  props.items.filter((item) => {
    if (onlyUnlinked.value && item.igMediaId) return false
    if (filterCaso.value !== 'all' && item.casoUsoRef !== filterCaso.value) return false
    if (filterFunnel.value !== 'all' && item.tipoGuion !== filterFunnel.value) return false
    return true
  })
)

const groups = useScriptGroups(filteredItems)
</script>

<style scoped lang="scss">
.smt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.smt__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
}

.smt__filter {
  flex: 1 1 240px;
  min-width: 0;
}

// Progress, not an alarm: this is the normal state of work in flight.
.smt__progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
}

.smt__progress-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 1rem;
  color: $primary;
  background: rgba($primary, 0.1);
  border-radius: 11px;

  &.is-done { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.12); }
}

.smt__progress-body {
  display: flex;
  flex: 1 1 20rem;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.smt__progress-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;

  h4 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 800;
    color: $primary-dark;
  }
}

.smt__progress-count {
  font-size: 0.8rem;
  color: $text-secondary;
  white-space: nowrap;

  strong { font-size: 0.95rem; color: $primary; }
}

.smt__bar {
  width: 100%;
  height: 6px;
  overflow: hidden;
  background: rgba($text-secondary, 0.15);
  border-radius: 999px;
}

.smt__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary, $secondary);
  border-radius: 999px;
  transition: width 0.35s ease;
}

.smt__progress-note {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: $text-secondary;

  strong { color: $primary-dark; }
}

// Same segmented control as the performance panel, for consistency.
.smt__segmented {
  display: flex;
  flex-shrink: 0;
  gap: 0.25rem;
  padding: 0.25rem;
  background: $primary-light;
  border-radius: 9px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    background: transparent;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.15s;

    &.is-active {
      color: $white;
      background: $primary;

      .smt__segmented-badge {
        color: $primary;
        background: $white;
      }
    }
  }
}

.smt__segmented-badge {
  padding: 0.05rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: $primary;
  background: rgba($primary, 0.12);
  border-radius: 999px;
}

.smt__count {
  margin: 0;
  font-size: 0.78rem;
  color: $text-secondary;
}

.smt__groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.smt__empty {
  padding: 3rem;
  color: $text-secondary;
  text-align: center;
  background: $white;
  border: 1px dashed rgba($primary-dark, 0.15);
  border-radius: 16px;

  i { margin-bottom: 1rem; font-size: 2.5rem; color: $secondary; }
  h4 { margin: 0 0 0.4rem; font-size: 1.1rem; color: $primary-dark; }
  p { margin: 0; font-size: 0.88rem; }
}
</style>
