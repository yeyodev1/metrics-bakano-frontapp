<script setup lang="ts">
import type { VideoItem } from '@/types/videoPlanning'
import VideoPlanningRow from './VideoPlanningRow.vue'

defineProps<{
  items: VideoItem[]
  canManageFull: boolean
  canEditProduction: boolean
  locked: boolean
}>()

const emit = defineEmits<{
  (e: 'update-field', itemId: string, field: string, value: string): void
  (e: 'open-script', item: VideoItem): void
  (e: 'edit-item', item: VideoItem): void
  (e: 'delete-item', itemId: string): void
}>()
</script>

<template>
  <div class="vp-table-wrap">
    <table class="vp-table">
      <thead>
        <tr>
          <th class="vp-table__th--center">#</th>
          <th>Tema / Tipo</th>
          <th>Idea</th>
          <th>Producción</th>
          <th>Edición</th>
          <th>Publicación</th>
          <th>Cliente</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <VideoPlanningRow
          v-for="(item, i) in items"
          :key="item._id"
          :item="item"
          :index="i"
          :canManageFull="canManageFull"
          :canEditProduction="canEditProduction"
          :locked="locked"
          @update-field="(id, field, val) => emit('update-field', id, field, val)"
          @open-script="(item) => emit('open-script', item)"
          @edit-item="(item) => emit('edit-item', item)"
          @delete-item="(id) => emit('delete-item', id)"
        />
      </tbody>
    </table>

    <div v-if="!items.length" class="vp-table__empty">
      <i class="fa-solid fa-film" />
      <span>Sin videos — agrega el primero con el botón de arriba</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.vp-table-wrap {
  overflow-x: auto;
}

.vp-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;

  thead tr {
    background: rgba($primary-dark, 0.02);
  }

  th {
    padding: 0.6rem 0.875rem;
    text-align: left;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
    white-space: nowrap;
    border-bottom: 1px solid rgba($primary-dark, 0.06);

    &.vp-table__th--center { text-align: center; }
  }

  tbody tr:last-child :deep(td) {
    border-bottom: none;
  }

  tbody tr:not(.vp-row--confirming):hover :deep(td) {
    background: rgba($primary, 0.012);
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 3.5rem 1rem;
    color: $text-secondary;
    opacity: 0.4;
    font-size: 0.85rem;
    font-weight: 600;

    i { font-size: 1.1rem; }
  }
}
</style>
