<script setup lang="ts">
import type { FilterMode } from '../composables/useTraffickerDashboard'

const props = defineProps({
  searchQuery: { type: String, required: true },
  filterMode: { type: String, required: true },
  cardsLength: { type: Number, required: true },
  cardsConPautaLength: { type: Number, required: true },
  cardsSinPautaLength: { type: Number, required: true },
})

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:filterMode', val: FilterMode): void
}>()

function onSearch(e: Event) {
  emit('update:searchQuery', (e.target as HTMLInputElement).value)
}

function clearSearch() {
  emit('update:searchQuery', '')
}
</script>

<template>
  <div>
    <!-- Search -->
    <div class="trf__search-wrap">
      <i class="fa-solid fa-magnifying-glass trf__search-icon" />
      <input
        :value="searchQuery"
        @input="onSearch"
        class="trf__search-input"
        type="search"
        placeholder="Buscar cliente..."
        autocomplete="off"
      />
      <button v-if="searchQuery" class="trf__search-clear" @click="clearSearch">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="trf__filter-tabs">
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'all' }"
        @click="emit('update:filterMode', 'all')"
      >
        <i class="fa-solid fa-layer-group" /> Todos
        <span class="trf__filter-tab-count">{{ cardsLength }}</span>
      </button>
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'con_pauta' }"
        @click="emit('update:filterMode', 'con_pauta')"
      >
        <i class="fa-brands fa-meta" /> Con pauta
        <span class="trf__filter-tab-count">{{ cardsConPautaLength }}</span>
      </button>
      <button
        class="trf__filter-tab"
        :class="{ 'trf__filter-tab--active': filterMode === 'sin_pauta' }"
        @click="emit('update:filterMode', 'sin_pauta')"
      >
        <i class="fa-solid fa-minus" /> Sin pauta
        <span class="trf__filter-tab-count">{{ cardsSinPautaLength }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trf__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.trf__search-icon {
  position: absolute;
  left: 14px;
  color: $text-secondary;
  font-size: 13px;
  pointer-events: none;
}

.trf__search-input {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 36px;
  border-radius: 100px;
  border: 1.5px solid rgba($primary, 0.15);
  background: white;
  font-size: 14px;
  color: $primary-dark;
  outline: none;
  transition: border-color 0.14s;
  -webkit-appearance: none;

  &::placeholder { color: $text-secondary; }
  &:focus { border-color: rgba($primary, 0.4); }

  &::-webkit-search-cancel-button { display: none; }
}

.trf__search-clear {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 100px;
  border: none;
  background: rgba($primary, 0.08);
  color: $text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;

  &:hover { background: rgba($primary, 0.15); color: $primary-dark; }
}

.trf__filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.trf__filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid rgba($primary, 0.15);
  background: white;
  color: $text-secondary;
  transition: all 0.14s;

  i { font-size: 11px; }

  &:hover { background: rgba($primary, 0.05); color: $primary-dark; border-color: rgba($primary, 0.3); }

  &--active {
    background: $primary;
    color: white;
    border-color: $primary;

    .trf__filter-tab-count { background: rgba(255,255,255,0.25); color: #fff; }
  }
}

.trf__filter-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 100px;
  background: rgba($primary, 0.1);
  color: $primary-dark;
  font-size: 11px;
  font-weight: 900;
}
</style>
