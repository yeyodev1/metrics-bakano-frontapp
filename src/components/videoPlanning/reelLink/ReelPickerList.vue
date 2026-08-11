<template>
  <div class="rpl">
    <span class="rpl__label">
      <i class="fa-brands fa-instagram" /> Seleccionar Reel desde Instagram
    </span>

    <div v-if="picker.loading.value" class="rpl__state">
      <i class="fa-solid fa-spinner fa-spin" /> Cargando Reels del feed…
    </div>

    <div v-else-if="!picker.reels.value.length" class="rpl__state rpl__state--block">
      <p>No se encontraron Reels recientes en la cuenta conectada.</p>
      <label class="rpl__manual">
        ID del Reel / Media ID manual
        <input
          :value="modelValue"
          type="text"
          placeholder="Ej: 180123456789"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <template v-else>
      <div class="rpl__filters">
        <div class="rpl__search">
          <i class="fa-solid fa-magnifying-glass" />
          <input v-model="picker.search.value" type="text" placeholder="Buscar por caption o ID…" />
          <button v-if="picker.search.value" type="button" title="Limpiar" @click="picker.search.value = ''">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <button
          type="button"
          role="switch"
          :aria-checked="picker.onlyUnlinked.value"
          :class="['rpl__chip', { 'is-on': picker.onlyUnlinked.value }]"
          :title="picker.onlyUnlinked.value ? 'Mostrar también los ya vinculados' : 'Ocultar los reels ya vinculados a otro guion'"
          @click="picker.onlyUnlinked.value = !picker.onlyUnlinked.value"
        >
          <i :class="picker.onlyUnlinked.value ? 'fa-solid fa-eye-slash' : 'fa-regular fa-eye'" />
          <span>Ocultar vinculados</span>
          <span v-if="picker.linkedInPageCount.value" class="rpl__chip-badge">
            {{ picker.linkedInPageCount.value }}
          </span>
        </button>
      </div>

      <p class="rpl__count">
        Mostrando {{ picker.visibleReels.value.length }} de {{ picker.reels.value.length }} reels cargados
        <span v-if="picker.hiddenCount.value > 0">· {{ picker.hiddenCount.value }} ocultos por los filtros</span>
      </p>

      <p v-if="!picker.visibleReels.value.length" class="rpl__state">
        Ningún reel coincide con la búsqueda.
      </p>

      <div v-else class="rpl__grid">
        <ReelOptionCard
          v-for="r in picker.visibleReels.value"
          :key="r.id"
          :reel="r"
          :selected="modelValue === r.id"
          :suggested="picker.isLikelyMatch(r)"
          :taken-by="picker.linkedElsewhere.value.get(r.id) ?? null"
          @select="$emit('update:modelValue', r.id); $emit('picked', r)"
          @preview="$emit('preview', r)"
        />
      </div>

      <button
        v-if="picker.nextCursor.value"
        type="button"
        class="rpl__more"
        :disabled="picker.loadingMore.value"
        @click="picker.fetch(true)"
      >
        <i :class="picker.loadingMore.value ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-down'" />
        {{ picker.loadingMore.value ? 'Cargando…' : `Cargar ${PAGE_SIZE} reels más` }}
      </button>

      <p v-else class="rpl__end">
        <i class="fa-solid fa-check" /> Ya cargaste todos los reels de la cuenta.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import ReelOptionCard from './ReelOptionCard.vue'
import { PAGE_SIZE, type useReelPicker } from './useReelPicker'

defineProps<{
  modelValue: string
  picker: ReturnType<typeof useReelPicker>
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'picked', reel: any): void
  (e: 'preview', reel: any): void
}>()
</script>

<style scoped lang="scss">
.rpl {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rpl__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: $primary-dark;

  i { color: #e1306c; }
}

.rpl__state {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.85rem;
  font-size: 0.82rem;
  color: $text-secondary;
  background: rgba($text-secondary, 0.06);
  border-radius: 10px;

  &--block { flex-direction: column; align-items: stretch; gap: 0.6rem; }
  p { margin: 0; }
}

.rpl__manual {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: $primary-dark;

  input {
    padding: 0.5rem 0.65rem;
    font-family: inherit;
    font-size: 0.82rem;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 8px;
    outline: none;

    &:focus { border-color: rgba(#e1306c, 0.45); }
  }
}

.rpl__filters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rpl__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 42px;
  padding: 0 0.75rem;
  background: $white;
  border: 1.5px solid rgba($primary-dark, 0.12);
  border-radius: 10px;

  &:focus-within { border-color: rgba(#e1306c, 0.45); }

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

.rpl__chip {
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

  &:hover { color: $primary-dark; border-color: rgba($primary-dark, 0.25); }

  &.is-on {
    color: #e1306c;
    background: rgba(#e1306c, 0.08);
    border-color: rgba(#e1306c, 0.45);

    .rpl__chip-badge { color: $white; background: #e1306c; }
  }
}

.rpl__chip-badge {
  padding: 0.05rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: $text-secondary;
  background: rgba($text-secondary, 0.15);
  border-radius: 999px;
}

.rpl__count {
  margin: 0;
  font-size: 0.75rem;
  color: $text-secondary;
}

.rpl__grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
}

.rpl__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.6rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: #e1306c;
  background: rgba(#e1306c, 0.06);
  border: 1.5px dashed rgba(#e1306c, 0.35);
  border-radius: 10px;
  cursor: pointer;

  &:hover:not(:disabled) { background: rgba(#e1306c, 0.12); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.rpl__end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.75rem;
  color: $text-secondary;
}

@media (min-width: 640px) {
  .rpl__filters { flex-direction: row; align-items: center; }
  .rpl__search { flex: 1; }
}
</style>
