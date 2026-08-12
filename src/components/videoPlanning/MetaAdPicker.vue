<template>
  <div class="adp">
    <div class="adp__filters">
      <div class="adp__search">
        <i class="fa-solid fa-magnifying-glass" />
        <input v-model="search" type="text" placeholder="Buscar anuncio por nombre o ID…" />
        <button v-if="search" type="button" title="Limpiar" @click="search = ''">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <button
        type="button"
        role="switch"
        :aria-checked="onlyActive"
        :class="['adp__chip', { 'is-on': onlyActive }]"
        title="Mostrar solo anuncios activos"
        @click="onlyActive = !onlyActive"
      >
        <i :class="onlyActive ? 'fa-solid fa-circle-play' : 'fa-regular fa-circle-play'" />
        <span>Solo activos</span>
      </button>
    </div>

    <div v-if="loading" class="adp__state">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando anuncios de Meta Ads…
    </div>

    <p v-else-if="error" class="adp__state adp__state--error">
      <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
    </p>

    <p v-else-if="!ads.length" class="adp__state">
      Esta cuenta no tiene anuncios, o el workspace no tiene cuenta publicitaria vinculada.
    </p>

    <template v-else>
      <p v-if="!visibleAds.length" class="adp__state">Ningún anuncio coincide con la búsqueda.</p>

      <div v-else class="adp__list">
        <div
          v-for="ad in visibleAds"
          :key="ad.id"
          :class="['adp__card', { 'is-selected': modelValue === ad.id }]"
          role="button"
          tabindex="0"
          @click="select(ad.id)"
          @keydown.enter="select(ad.id)"
        >
          <div class="adp__thumb">
            <img v-if="ad.thumbnailUrl" :src="ad.thumbnailUrl" alt="" />
            <i v-else class="fa-solid fa-bullhorn" />
          </div>

          <div class="adp__info">
            <div class="adp__name-row">
              <span class="adp__name">{{ ad.name }}</span>
              <span :class="['adp__status', `is-${(ad.status || '').toLowerCase()}`]">
                {{ statusLabel(ad.status) }}
              </span>
            </div>
            <div class="adp__stats">
              <span><i class="fa-solid fa-dollar-sign" /> {{ money(ad.spend) }}</span>
              <span><i class="fa-solid fa-users" /> {{ num(ad.reach) }} alcance</span>
              <span v-if="ad.leads" class="adp__stat-lead">
                <i class="fa-solid fa-comments" /> {{ num(ad.leads) }} conversaciones
              </span>
              <span v-if="ad.roas"><i class="fa-solid fa-arrow-trend-up" /> ROAS {{ ad.roas.toFixed(2) }}</span>
            </div>
          </div>

          <i :class="modelValue === ad.id ? 'fa-solid fa-circle-check adp__check' : 'fa-regular fa-circle adp__check'" />
        </div>
      </div>

      <button
        v-if="nextCursor"
        type="button"
        class="adp__more"
        :disabled="loadingMore"
        @click="load(true)"
      >
        <i :class="loadingMore ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-down'" />
        {{ loadingMore ? 'Cargando…' : `Cargar ${PAGE_SIZE} anuncios más` }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { videoPlanningService } from '@/services/videoPlanning.service'
import type { MetaAdOption } from '@/types/videoPlanning'

const props = defineProps<{ workspaceId: string; modelValue: string; active: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const PAGE_SIZE = 10

const ads = ref<MetaAdOption[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const search = ref('')
const onlyActive = ref(true)

async function load(append = false) {
  if (!props.workspaceId) return

  if (append) loadingMore.value = true
  else {
    loading.value = true
    ads.value = []
    nextCursor.value = null
  }
  error.value = ''

  try {
    const page = await videoPlanningService.getWorkspaceAds(props.workspaceId, {
      limit: PAGE_SIZE,
      after: append ? nextCursor.value ?? undefined : undefined,
    })
    ads.value = append ? [...ads.value, ...page.ads] : page.ads
    nextCursor.value = page.nextCursor
  } catch (err: any) {
    error.value = err?.message ?? 'No se pudieron cargar los anuncios.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Only hit Meta once the section is actually opened.
watch(
  () => props.active,
  (open) => {
    if (open && !ads.value.length && !loading.value) load()
  },
  { immediate: true }
)

const visibleAds = computed(() => {
  const term = search.value.trim().toLowerCase()
  return ads.value.filter((ad) => {
    if (onlyActive.value && ad.status !== 'ACTIVE') return false
    if (!term) return true
    return ad.name.toLowerCase().includes(term) || ad.id.includes(term)
  })
})

/** Clicking the selected ad again clears it — the link is optional. */
function select(id: string) {
  emit('update:modelValue', props.modelValue === id ? '' : id)
}

function statusLabel(status: string | null) {
  if (status === 'ACTIVE') return 'Activo'
  if (status === 'PAUSED') return 'Pausado'
  return 'Inactivo'
}

const money = (n: number) => `$${n.toFixed(2)}`
const num = (n: number) => new Intl.NumberFormat('es-EC').format(n)
</script>

<style scoped lang="scss">
.adp {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.adp__filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.adp__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 42px;
  padding: 0 0.75rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;

  &:focus-within { border-color: rgba($secondary, 0.5); }

  i { font-size: 0.85rem; color: $text-secondary; }

  input {
    flex: 1;
    min-width: 0;
    font-family: inherit;
    font-size: 0.85rem;
    background: transparent;
    border: none;
    outline: none;
  }

  button {
    color: $text-secondary;
    background: transparent;
    border: none;
    cursor: pointer;
  }
}

.adp__chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  height: 42px;
  padding: 0 0.9rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-secondary;
  white-space: nowrap;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;

  &.is-on {
    color: $BAKANO-GREEN;
    background: rgba($BAKANO-GREEN, 0.1);
    border-color: rgba($BAKANO-GREEN, 0.45);
  }
}

.adp__state {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.85rem;
  font-size: 0.82rem;
  color: $text-secondary;
  background: rgba($text-secondary, 0.06);
  border-radius: 10px;

  &--error { color: $alert-error; background: $alert-error-bg; }
}

.adp__list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  // Igual que el picker de reels: el tope escala con la pantalla.
  max-height: min(20rem, 34vh);
  overflow-y: auto;
  overscroll-behavior: contain;
}

// Pantalla baja: un solo scroll, el del modal. Ver ReelPickerList.
@media (max-height: 780px) {
  .adp__list {
    max-height: none;
    overflow-y: visible;
  }
}

.adp__card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s;

  &:hover { border-color: rgba($secondary, 0.4); background: rgba($secondary, 0.02); }

  &.is-selected {
    border-color: $secondary;
    background: $overlay-purple;

    .adp__check { color: $secondary; }
  }
}

.adp__thumb {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  overflow: hidden;
  font-size: 0.9rem;
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
  border-radius: 9px;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.adp__info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.adp__name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.adp__name {
  overflow: hidden;
  font-size: 0.84rem;
  font-weight: 700;
  color: $primary-dark;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adp__status {
  flex-shrink: 0;
  padding: 0.1rem 0.4rem;
  font-size: 0.62rem;
  font-weight: 800;
  color: $text-secondary;
  text-transform: uppercase;
  background: rgba($text-secondary, 0.12);
  border-radius: 20px;

  &.is-active { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.12); }
  &.is-paused { color: $alert-warning; background: $alert-warning-bg; }
}

.adp__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  font-size: 0.72rem;
  color: $text-secondary;

  i { margin-right: 0.15rem; }
}

.adp__stat-lead { font-weight: 700; color: $BAKANO-GREEN; }

.adp__check {
  flex-shrink: 0;
  font-size: 1.05rem;
  color: rgba($primary-dark, 0.2);
}

.adp__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.6rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: $secondary;
  background: $overlay-purple;
  border: 1.5px dashed rgba($secondary, 0.35);
  border-radius: 10px;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

@media (min-width: 640px) {
  .adp__filters { flex-direction: row; align-items: center; }
  .adp__search { flex: 1; }
}
</style>
