<script setup lang="ts">
import { ref } from 'vue'
import type { VideoItem } from '@/types/videoPlanning'
import StatusBadge from './StatusBadge.vue'
import StatusSelect from './StatusSelect.vue'

const props = defineProps<{
  item: VideoItem
  index: number
  canManageFull: boolean
  canEditProduction: boolean
  canMarkEditado: boolean
  locked: boolean
}>()

const emit = defineEmits<{
  (e: 'update-field', itemId: string, field: string, value: string): void
  (e: 'open-script', item: VideoItem): void
  (e: 'edit-item', item: VideoItem): void
  (e: 'delete-item', itemId: string): void
}>()

const confirming = ref(false)

const IDEA_OPTS = [
  { value: 'APROBADO',   label: '✓ Aprobado' },
  { value: 'POR_REVISAR', label: '↻ Por revisar' },
  { value: 'RECHAZADO',  label: '✕ Rechazado' },
]
const PROD_OPTS = [
  { value: 'GRABADO',   label: '✓ Grabado' },
  { value: 'POR_GRABAR', label: '● Por grabar' },
  { value: 'RECHAZADO', label: '✕ Rechazado' },
]
const EDIC_OPTS = [
  { value: 'EDITADO',   label: '✓ Editado' },
  { value: 'POR_EDITAR', label: '● Por editar' },
  { value: 'RECHAZADO', label: '✕ Rechazado' },
]
const PUB_OPTS = [
  { value: 'PROGRAMADO',  label: '📅 Programado' },
  { value: 'PUBLICADO',   label: '✓ Publicado' },
  { value: 'POR_PUBLICAR', label: '● Por publicar' },
  { value: '-',           label: '— Sin estado' },
]

function onUpdate(field: string, value: string) {
  emit('update-field', props.item._id, field, value)
}
</script>

<template>
  <!-- Confirmation row -->
  <tr v-if="confirming" class="vp-row vp-row--confirming">
    <td :colspan="8" class="vp-row__confirm-cell">
      <div class="vp-row__confirm-bar">
        <i class="fa-solid fa-triangle-exclamation" />
        <span>¿Eliminar <strong>{{ item.tema }}</strong>? Esta acción no se puede deshacer.</span>
        <div class="vp-row__confirm-btns">
          <button class="vp-row__btn-cancel" @click="confirming = false">
            Cancelar
          </button>
          <button class="vp-row__btn-confirm-delete" @click="emit('delete-item', item._id); confirming = false">
            <i class="fa-solid fa-trash" />
            Sí, eliminar
          </button>
        </div>
      </div>
    </td>
  </tr>

  <!-- Normal row -->
  <tr
    v-else
    class="vp-row"
    :class="{
      'vp-row--locked': locked,
      'vp-row--rejected': item.clienteAprobacion === 'RECHAZADO',
    }"
  >
    <td class="vp-row__num">{{ index + 1 }}</td>

    <td class="vp-row__tema vp-row__tema--clickable" @click="emit('edit-item', item)">
      <span class="vp-row__tema-text">{{ item.tema }}</span>
      <span v-if="item.tipo" class="vp-row__tipo-chip">{{ item.tipo }}</span>
      <span v-if="item.clienteAprobacion === 'RECHAZADO'" class="vp-row__rejected-badge">
        <i class="fa-solid fa-rotate-right" /> Revisar
      </span>
    </td>

    <!-- Estado Idea -->
    <td>
      <StatusSelect
        v-if="canManageFull && !locked"
        :model-value="item.estadoIdea"
        :options="IDEA_OPTS"
        @update:model-value="onUpdate('estadoIdea', $event)"
      />
      <StatusBadge v-else :status="item.estadoIdea" type="idea" />
    </td>

    <!-- Estado Producción — editable siempre (tracking operativo) -->
    <td class="vp-row__operational">
      <StatusSelect
        v-if="canEditProduction"
        :model-value="item.estadoProduccion"
        :options="PROD_OPTS"
        @update:model-value="onUpdate('estadoProduccion', $event)"
      />
      <StatusBadge v-else :status="item.estadoProduccion" type="produccion" />
    </td>

    <!-- Edición — solo superadmin desde esta vista; editores usan su panel -->
    <td class="vp-row__operational">
      <StatusSelect
        v-if="canMarkEditado"
        :model-value="item.edicion"
        :options="EDIC_OPTS"
        @update:model-value="onUpdate('edicion', $event)"
      />
      <StatusBadge v-else :status="item.edicion" type="edicion" />
    </td>

    <!-- Publicación — editable siempre (tracking operativo) -->
    <td class="vp-row__operational">
      <StatusSelect
        v-if="canManageFull"
        :model-value="item.estadoPublicacion"
        :options="PUB_OPTS"
        @update:model-value="onUpdate('estadoPublicacion', $event)"
      />
      <StatusBadge v-else :status="item.estadoPublicacion" type="publicacion" />
    </td>

    <!-- Aprobación cliente -->
    <td>
      <StatusBadge :status="item.clienteAprobacion" type="aprobacion" />
      <span v-if="item.igScheduleStatus === 'SCHEDULED'" class="vp-row__ig-chip vp-row__ig-chip--ig" title="Programado en Instagram">
        <i class="fa-brands fa-instagram" />
      </span>
      <span v-else-if="item.igScheduleStatus === 'FAILED'" class="vp-row__ig-chip vp-row__ig-chip--fail" :title="`IG: ${item.igScheduleError || 'error'}`">
        <i class="fa-brands fa-instagram" />
      </span>
      <span v-if="item.fbScheduleStatus === 'SCHEDULED'" class="vp-row__ig-chip vp-row__ig-chip--fb" title="Programado en Facebook">
        <i class="fa-brands fa-facebook" />
      </span>
      <span v-else-if="item.fbScheduleStatus === 'FAILED'" class="vp-row__ig-chip vp-row__ig-chip--fail" :title="`FB: ${item.fbScheduleError || 'error'}`">
        <i class="fa-brands fa-facebook" />
      </span>
    </td>

    <!-- Acciones -->
    <td class="vp-row__actions">
      <button class="vp-row__action-btn vp-row__action-btn--script" title="Ver guión" @click="emit('open-script', item)">
        <i class="fa-solid fa-scroll" />
      </button>
      <button
        v-if="canManageFull"
        class="vp-row__action-btn vp-row__action-btn--edit-labeled"
        @click="emit('edit-item', item)"
      >
        <i class="fa-solid fa-pen-to-square" />
        <span>Editar</span>
      </button>
      <button
        v-if="canManageFull && !locked"
        class="vp-row__action-btn vp-row__action-btn--delete"
        title="Eliminar"
        @click="confirming = true"
      >
        <i class="fa-solid fa-trash" />
      </button>
    </td>
  </tr>
</template>

<style lang="scss" scoped>
.vp-row {
  &--locked td { opacity: 0.82; }
  &--locked td:not(.vp-row__actions):not(.vp-row__tema):not(.vp-row__operational) {
    pointer-events: none;
    opacity: 0.55;
  }

  &--rejected {
    background: rgba(#fee2e2, 0.45) !important;
    td { border-color: rgba(#fca5a5, 0.2) !important; }
  }

  td {
    padding: 0.6rem 0.875rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    vertical-align: middle;
    font-size: 0.85rem;
    color: $primary-dark;
  }

  &--confirming td { padding: 0; }

  &__confirm-cell { padding: 0 !important; }

  &__confirm-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fff1f2;
    border-bottom: 1px solid #fda4af;
    flex-wrap: wrap;

    > i { color: #be123c; font-size: 0.9rem; flex-shrink: 0; }
    > span { flex: 1; font-size: 0.83rem; font-weight: 600; color: #be123c; min-width: 0; }
  }

  &__confirm-btns {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__btn-cancel {
    background: transparent;
    border: 1.5px solid rgba(#be123c, 0.2);
    color: #6b7280;
    padding: 0.35rem 0.85rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: #f3f4f6; color: $primary-dark; }
  }

  &__btn-confirm-delete {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #be123c;
    color: #fff;
    border: none;
    padding: 0.35rem 0.85rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: #9f1239; }
  }

  &__num {
    font-weight: 800;
    color: $text-secondary;
    font-size: 0.75rem;
    text-align: center;
    width: 36px;
  }

  &__tema { min-width: 160px; max-width: 220px; }
  &__tema--clickable {
    cursor: pointer;
    &:hover .vp-row__tema-text { color: $primary; text-decoration: underline; }
  }
  &__tema-text { display: block; font-weight: 700; line-height: 1.3; font-size: 0.83rem; transition: color 0.15s; }
  &__rejected-badge {
    display: inline-flex; align-items: center; gap: 0.2rem;
    margin-top: 0.2rem; font-size: 0.6rem; font-weight: 800;
    color: #dc2626; background: #fee2e2; border-radius: 6px;
    padding: 0.1rem 0.4rem; text-transform: uppercase; letter-spacing: 0.04em;
  }
  &__tipo-chip {
    display: inline-block;
    margin-top: 0.2rem;
    padding: 0.08rem 0.4rem;
    background: rgba($primary, 0.08);
    color: $primary;
    border-radius: 8px;
    font-size: 0.62rem;
    font-weight: 700;
  }

  &__actions {
    display: flex;
    gap: 0.3rem;
    align-items: center;
    white-space: nowrap;
  }

  &__action-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: rgba($primary-dark, 0.04);
    color: $text-secondary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: all 0.15s;
    flex-shrink: 0;

    &--script:hover { background: rgba($primary, 0.1); color: $primary; }
    &--delete:hover { background: #fee2e2; color: #dc2626; }

  &__ig-chip {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 5px;
    font-size: 0.65rem; margin-left: 0.3rem; cursor: default;

    &--ig {
      background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af);
      color: #fff;
    }
    &--fb {
      background: #1877f2;
      color: #fff;
    }
    &--fail {
      background: rgba(#dc2626, 0.1); color: #dc2626;
      border: 1px solid rgba(#dc2626, 0.25);
    }
  }

    &--edit-labeled {
      width: auto;
      padding: 0 0.75rem;
      gap: 0.35rem;
      background: rgba($primary, 0.07);
      color: $primary;
      font-size: 0.75rem;
      font-weight: 700;

      span { line-height: 1; }

      &:hover {
        background: $primary;
        color: #fff;
      }
    }
  }
}
</style>
