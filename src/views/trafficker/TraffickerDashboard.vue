<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTraffickerDashboard } from './composables/useTraffickerDashboard'

import TraffickerHeader from './components/TraffickerHeader.vue'
import TraffickerSummaryStrip from './components/TraffickerSummaryStrip.vue'
import TraffickerFilters from './components/TraffickerFilters.vue'
import TraffickerSkeleton from './components/TraffickerSkeleton.vue'
import TraffickerLoteBar from './components/TraffickerLoteBar.vue'
import TraffickerRow from './components/TraffickerRow.vue'

const router = useRouter()
const userStore = useUserStore()

const {
  isLoading,
  lote,
  loteFaltan,
  lotePorcentaje,
  cards,
  groups,
  avgRoas,
  totalRevenue,
  totalSpend,
  cardsWithoutBilling,
  onTargetCount,
  remindAll,
  remindAllDone,
  searchQuery,
  filterMode,
  currentYear,
  currentMonth,
  changeMonth,
  remindingSet,
  remindedSet,
  sendReminder,
  sendReminderToAll,
  load,
  pagina,
  totalPaginas,
  totalEntornos,
  irAPagina,
} = useTraffickerDashboard()

/**
 * Una fila abierta a la vez: con diez entornos en pantalla, abrir varias
 * convierte la lista en un muro y se pierde la comparacion, que es para lo
 * que sirve el listado.
 */
const abierta = ref<string | null>(null)

function alternar(id: string) {
  abierta.value = abierta.value === id ? null : id
}

/** Lleva a la pantalla donde se completa la vinculacion con Meta. */
function irAConectar(id: string) {
  router.push({ name: 'SuperadminMetaIntegrations', query: { workspaceId: id } })
}

function go(id: string) {
  router.push({ name: 'TraffickerWorkspace', params: { workspaceId: id } })
}

onMounted(() => load())
</script>

<template>
  <div class="trf">
    <!-- Header -->
    <TraffickerHeader
      :is-loading="isLoading"
      :current-year="currentYear"
      :current-month="currentMonth"
      :user-name="userStore.name || 'Trafficker'"
      @change-month="changeMonth"
    />

    <!-- Summary strip -->
    <TraffickerSummaryStrip
      v-if="cards.length > 0 && !lote.activo"
      :cards-length="cards.length"
      :avg-roas="avgRoas"
      :total-revenue="totalRevenue"
      :total-spend="totalSpend"
      :cards-without-billing-length="cardsWithoutBilling.length"
      :on-target="onTargetCount"
      :remind-all-active="remindAll.active"
      :remind-all-done="remindAllDone"
      :remind-all-total="remindAll.total"
      :remind-all-errors="remindAll.errors"
      :remind-all-done-count="remindAll.done"
      @remind-all="sendReminderToAll"
    />

    <!-- Cuántos del lote ya cargaron: reemplaza la espera muda -->
    <TraffickerLoteBar
      v-if="lote.activo"
      :listos="lote.listos"
      :total="lote.total"
      :faltan="loteFaltan"
      :porcentaje="lotePorcentaje"
    />

    <!-- Esqueleto solo en la primera pintada, cuando aún no hay ni nombres -->
    <TraffickerSkeleton v-if="isLoading && cards.length === 0" />

    <!-- Empty -->
    <div v-else-if="cards.length === 0" class="trf__empty">
      <i class="fa-solid fa-layer-group" />
      <h3>Sin entornos asignados</h3>
      <p>Contacta al superadmin para que te asigne entornos de clientes.</p>
    </div>

    <template v-else>
      <!-- Search & Filters -->
      <TraffickerFilters
        v-model:search-query="searchQuery"
        v-model:filter-mode="filterMode"
        :cards-length="cards.length"
        :cards-con-pauta-length="cards.filter(c => c.spend > 0).length"
        :cards-sin-pauta-length="cards.filter(c => c.spend === 0).length"
      />

      <!-- Lista en acordeón: una fila por entorno, el detalle se abre debajo -->
      <!-- El cambio de página era un salto seco: la lista se reemplazaba y
           costaba notar que el contenido ya era otro. -->
      <Transition name="pagina" mode="out-in">
      <div :key="pagina" class="trf__lista">
        <TraffickerRow
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :abierta="abierta === card.id"
          :is-reminding="remindingSet.has(card.id)"
          :is-reminded="remindedSet.has(card.id)"
          @toggle="alternar(card.id)"
          @go-detail="go(card.id)"
          @remind="sendReminder(card.id)"
          @conectar="irAConectar(card.id)"
        />
      </div>
      </Transition>

      <nav v-if="totalPaginas > 1" class="trf__paginacion" aria-label="Paginación">
        <button type="button" :disabled="pagina === 1" @click="irAPagina(pagina - 1, searchQuery)">
          <i class="fa-solid fa-chevron-left" aria-hidden="true" /> Anterior
        </button>
        <span>Página {{ pagina }} de {{ totalPaginas }} · {{ totalEntornos }} entornos</span>
        <button type="button" :disabled="pagina === totalPaginas" @click="irAPagina(pagina + 1, searchQuery)">
          Siguiente <i class="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </nav>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.trf {
  padding: 16px 14px 80px;
  width: 100%;

  @media (min-width: 480px) { padding: 20px 20px 80px; }
  @media (min-width: 640px) { padding: 28px 28px 80px; }
  @media (min-width: 1024px) { padding: 32px 36px 80px; }
}

.trf__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: $text-secondary;
  text-align: center;

  i  { font-size: 40px; opacity: 0.3; }
  h3 { margin: 0; font-size: 18px; color: $primary-dark; }
  p  { margin: 0; font-size: 14px; max-width: 300px; }
}

.trf__lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Corta: acompaña el cambio sin hacer esperar. */
.pagina-enter-active,
.pagina-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.pagina-enter-from { opacity: 0; transform: translateY(8px); }
.pagina-leave-to { opacity: 0; transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .pagina-enter-active,
  .pagina-leave-active { transition: opacity 0.01s; transform: none; }
}

.trf__paginacion {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;

  span { font-size: 0.8rem; color: $text-secondary; }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 9px;
    cursor: pointer;

    &:hover:not(:disabled) { border-color: rgba($primary, 0.5); }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }
}
</style>
