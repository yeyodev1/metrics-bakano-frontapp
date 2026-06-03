<template>
  <div class="billing-day-list">
    <!-- Filters -->
    <div class="filters-row">
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filterOnlyWithData }"
        @click="$emit('update:filterOnlyWithData', !filterOnlyWithData)"
      >
        <i class="fa-solid fa-calendar-check" />
        Solo días con datos
      </button>
      
      <button
        v-if="canEnterBilling"
        class="filter-btn"
        :class="{ 'filter-btn--active': filterMyEntries }"
        @click="$emit('update:filterMyEntries', !filterMyEntries)"
      >
        <i class="fa-solid fa-user" />
        Solo mis registros
      </button>
      
      <span v-if="filterOnlyWithData || filterMyEntries" class="filter-clear" @click="clearFilters">
        <i class="fa-solid fa-xmark" /> Limpiar filtros
      </span>
      
      <!-- View Mode Toggle -->
      <div class="view-toggle">
        <button 
          class="view-btn" 
          :class="{ 'view-btn--active': viewMode === 'list' }"
          @click="setViewMode('list')"
          title="Vista de Lista"
        >
          <i class="fa-solid fa-list" />
        </button>
        <button 
          class="view-btn" 
          :class="{ 'view-btn--active': viewMode === 'grid' }"
          @click="setViewMode('grid')"
          title="Vista de Cuadrícula"
        >
          <i class="fa-solid fa-border-all" />
        </button>
      </div>
    </div>

    <!-- Month navigation loading -->
    <div v-if="loading" class="loading-overlay-row">
      <div class="loading-spinner-sm" />
      <span>Actualizando...</span>
    </div>

    <!-- Pending banner -->
    <Transition name="slide-down">
      <div v-if="pendingDays.length > 0" class="pending-banner">
        <div class="pending-banner__icon">
          <i class="fa-solid fa-triangle-exclamation" />
        </div>
        <div class="pending-banner__text">
          <strong>{{ pendingDays.length }} {{ pendingDays.length === 1 ? 'día sin registrar' : 'días sin registrar' }}</strong>
          <span>este mes · completa tu historial</span>
        </div>
        <div class="pending-banner__dates">
          <span v-for="d in pendingDays.slice(0, 5)" :key="d.date" class="pending-date-chip">
            {{ dayNumber(d.date) }} {{ dayName(d.date) }}
          </span>
          <span v-if="pendingDays.length > 5" class="pending-date-more">+{{ pendingDays.length - 5 }} más</span>
        </div>
      </div>
    </Transition>

    <!-- Days list -->
    <div class="days-list-container" :class="'days-list-container--' + viewMode">
      <BillingDayCard
        v-for="day in visibleDays"
        :key="day.date"
        :day="day"
        :todayStr="todayStr"
        :canEnterBilling="canEnterBilling"
        :canRegister="canRegisterOnDay(day)"
        :viewMode="viewMode"
        @add-entry="(p) => $emit('add-entry', p)"
        @edit-entry="(p) => $emit('edit-entry', p)"
      />
    </div>

    <!-- Show More Button -->
    <div v-if="!showAllDays && daysToShow.length > 10" class="show-more-container">
      <button class="btn-show-more" @click="showAllDays = true">
        <i class="fa-solid fa-calendar-days" />
        Ver los {{ daysToShow.length - 10 }} días restantes
        <i class="fa-solid fa-chevron-down" />
      </button>
    </div>
    
    <div v-if="showAllDays && daysToShow.length > 10" class="show-more-container">
      <button class="btn-show-less" @click="showAllDays = false">
        <i class="fa-solid fa-chevron-up" /> Ocultar días anteriores
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BillingDayCard from './BillingDayCard.vue'

const props = defineProps<{
  daysToShow: any[]
  pendingDays: any[]
  loading: boolean
  canEnterBilling: boolean
  filterOnlyWithData: boolean
  filterMyEntries: boolean
  todayStr: string
  canRegisterOnDay: (day: any) => boolean
}>()

const emit = defineEmits<{
  (e: 'update:filterOnlyWithData', val: boolean): void
  (e: 'update:filterMyEntries', val: boolean): void
  (e: 'add-entry', payload: { date: string; total: number }): void
  (e: 'edit-entry', payload: { entry: any; date: string; total: number }): void
}>()

function clearFilters() {
  emit('update:filterOnlyWithData', false)
  emit('update:filterMyEntries', false)
}

const viewMode = ref<'list' | 'grid'>((localStorage.getItem('bakano_billing_view_mode') as 'list' | 'grid') || 'list')
const showAllDays = ref(false)

const visibleDays = computed(() => {
  if (showAllDays.value) return props.daysToShow
  return props.daysToShow.slice(0, 10)
})

watch(() => props.daysToShow, () => {
  // If the month changes, reset the showAllDays flag
  showAllDays.value = false
})

function setViewMode(mode: 'list' | 'grid') {
  viewMode.value = mode
  localStorage.setItem('bakano_billing_view_mode', mode)
}

function dateStr(date: string): string { return date.substring(0, 10) }
function dayNumber(date: string) { return new Date(dateStr(date) + 'T12:00:00').getDate().toString() }
function dayName(date: string) { return new Date(dateStr(date) + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short' }) }
</script>

<style scoped lang="scss">
.billing-day-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  .filter-btn {
    background: $white;
    border: 1px solid #e2e8f0;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;

    &:hover {
      background: #f8fafc;
      color: $primary-dark;
      border-color: #cbd5e1;
    }

    &--active {
      background: $primary;
      color: $white;
      border-color: $primary;

      &:hover {
        background: lighten($primary, 5%);
        color: $white;
        border-color: lighten($primary, 5%);
      }
    }
  }

  .filter-clear {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    transition: color 0.2s;

    &:hover { color: #dc2626; }
  }

  .view-toggle {
    margin-left: auto;
    display: flex;
    align-items: center;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 10px;
    gap: 4px;

    @media (max-width: 640px) {
      margin-left: 0;
      width: 100%;
      justify-content: center;
    }

    .view-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;

      &:hover {
        color: $primary-dark;
      }

      &--active {
        background: $white;
        color: $primary-dark;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      }
    }
  }
}

.loading-overlay-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: $white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;

  .loading-spinner-sm {
    width: 20px;
    height: 20px;
    border: 2px solid rgba($primary, 0.2);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

.pending-banner {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  &__icon {
    width: 44px;
    height: 44px;
    background: #fef3c7;
    color: #d97706;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;

    strong {
      color: #92400e;
      font-size: 15px;
    }

    span {
      color: #b45309;
      font-size: 13px;
      font-weight: 500;
    }
  }

  &__dates {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;

    @media (max-width: 640px) {
      margin-left: 0;
      width: 100%;
    }

    .pending-date-chip {
      background: #fef3c7;
      color: #92400e;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .pending-date-more {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #b45309;
    }
  }
}

.days-list-container {
  &--list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    align-items: stretch;
  }
}

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }

.show-more-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 20px;
}

.btn-show-more {
  background: $white;
  color: $primary-dark;
  border: 1px solid #cbd5e1;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);

  i { color: #64748b; font-size: 13px; }

  &:hover {
    border-color: $primary;
    color: $primary;
    box-shadow: 0 6px 16px rgba($primary, 0.15);
    transform: translateY(-2px);
    
    i { color: $primary; }
  }
}

.btn-show-less {
  background: transparent;
  color: #64748b;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    color: $primary-dark;
    background: #f1f5f9;
    border-radius: 8px;
  }
}
</style>
