<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTraffickerDashboard } from './composables/useTraffickerDashboard'

import TraffickerHeader from './components/TraffickerHeader.vue'
import TraffickerSummaryStrip from './components/TraffickerSummaryStrip.vue'
import TraffickerFilters from './components/TraffickerFilters.vue'
import TraffickerSkeleton from './components/TraffickerSkeleton.vue'
import TraffickerGroup from './components/TraffickerGroup.vue'
import TraffickerCard from './components/TraffickerCard.vue'

const router = useRouter()
const userStore = useUserStore()

const {
  isLoading,
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
  load
} = useTraffickerDashboard()

const expandedGroups = ref(new Set(['pauta_sin_factura', 'sin_factura', 'critico', 'peligro', 'optimo', 'factura_sin_pauta']))

function toggleGroup(id: string) {
  if (expandedGroups.value.has(id)) expandedGroups.value.delete(id)
  else expandedGroups.value.add(id)
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
      v-if="cards.length > 0 && !isLoading"
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

    <!-- Skeleton loading -->
    <TraffickerSkeleton v-if="isLoading" />

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

      <!-- Grouped view -->
      <div class="trf__groups">
        <TraffickerGroup
          v-for="group in groups"
          :key="group.id"
          :group="group"
          :is-expanded="expandedGroups.has(group.id)"
          @toggle="toggleGroup(group.id)"
        >
          <TraffickerCard
            v-for="card in group.cards"
            :key="card.id"
            :card="card"
            :is-reminding="remindingSet.has(card.id)"
            :is-reminded="remindedSet.has(card.id)"
            @go-detail="go(card.id)"
            @remind="sendReminder(card.id)"
          />
        </TraffickerGroup>
      </div>
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

.trf__groups {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
