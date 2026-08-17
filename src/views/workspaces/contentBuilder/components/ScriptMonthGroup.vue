<template>
  <section class="smg" :class="{ 'smg--sin-fecha': group.sinFecha }">
    <button type="button" class="smg__header" :aria-expanded="open" @click="open = !open">
      <i class="smg__chevron fa-solid fa-chevron-right" :class="{ 'is-open': open }" />

      <span class="smg__label">
        <i v-if="group.sinFecha" class="fa-regular fa-calendar-xmark smg__label-icono" />
        {{ group.label }}
      </span>

      <span class="smg__count">{{ group.items.length }} guiones</span>

      <span
        v-if="group.sinFecha"
        class="smg__aviso"
      >Falta agendarlos</span>
      <span v-else class="smg__linked" :class="{ 'is-complete': group.linked === group.items.length }">
        <i :class="group.linked === group.items.length ? 'fa-solid fa-circle-check' : 'fa-brands fa-instagram'" />
        {{ group.linked }}/{{ group.items.length }} vinculados
      </span>
    </button>

    <AccordionTransition>
      <div v-if="open" class="smg__rows">
        <!-- Sin fecha no hay nada que medir ni que avisar: se dice aquí, junto
             a los guiones afectados, en vez de dejar que lo descubran cuando el
             botón de notificar no responda. -->
        <p v-if="group.sinFecha" class="smg__explicacion">
          <i class="fa-solid fa-circle-info" />
          <span>
            Estos guiones <strong>todavía no tienen fecha de publicación</strong>. Hasta que se la
            pongas no entran al calendario, no se pueden medir y
            <strong>no se puede avisar al cliente</strong>. Abre cada uno y elige el día en
            «Fecha de publicación».
          </span>
        </p>
        <ScriptRow
          v-for="item in group.items"
          :key="item._id"
          :item="item"
          @link-reel="$emit('link-reel', $event)"
          @edit-item="$emit('edit-item', $event)"
        />
      </div>
    </AccordionTransition>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScriptRow from './ScriptRow.vue'
import AccordionTransition from '@/components/common/AccordionTransition.vue'
import type { ScriptGroup } from '../useScriptGroups'
import type { WorkspaceVideoItem } from '@/types/videoPlanning'

const props = defineProps<{ group: ScriptGroup; defaultOpen?: boolean }>()

defineEmits<{
  (e: 'link-reel', item: WorkspaceVideoItem): void
  (e: 'edit-item', item: WorkspaceVideoItem): void
}>()

// Only the newest month opens by default; 98 rows at once is not a list, it is a wall.
const open = ref(props.defaultOpen ?? false)
</script>

<style scoped lang="scss">
.smg {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.smg__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.65rem 0.9rem;
  font-family: inherit;
  text-align: left;
  background: rgba($primary-dark, 0.03);
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: rgba($primary-dark, 0.05); }
}

.smg__chevron {
  flex-shrink: 0;
  width: 0.8rem;
  font-size: 0.75rem;
  color: $text-secondary;
  transition: transform 0.22s ease;

  &.is-open { transform: rotate(90deg); }
}

@media (prefers-reduced-motion: reduce) {
  .smg__chevron { transition: none; }
}

.smg__label {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 800;
  color: $primary-dark;
}

// ── Apartado de los que aún no tienen fecha ─────────────────────────────────
.smg--sin-fecha {
  .smg__header {
    background: rgba($alert-warning, 0.09);
    border-color: rgba($alert-warning, 0.35);

    &:hover { background: rgba($alert-warning, 0.14); }
  }
}

.smg__label-icono {
  color: $alert-warning;
  font-size: 0.85rem;
}

.smg__aviso {
  flex-shrink: 0;
  padding: 0.15rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: $white;
  background: $alert-warning;
  border-radius: 20px;
}

.smg__explicacion {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  padding: 0.7rem 0.85rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: $text-secondary;
  background: rgba($alert-warning, 0.07);
  border: 1px dashed rgba($alert-warning, 0.4);
  border-radius: 10px;

  i { flex-shrink: 0; margin-top: 0.15rem; color: $alert-warning; }
  strong { color: $primary-dark; }
}

.smg__count {
  flex-shrink: 0;
  font-size: 0.76rem;
  color: $text-secondary;
}

.smg__linked {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: $text-secondary;
  background: rgba($text-secondary, 0.1);
  border-radius: 20px;

  &.is-complete { color: $BAKANO-GREEN; background: rgba($BAKANO-GREEN, 0.12); }
}

.smg__rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-left: 1.4rem;
}

@media (max-width: 600px) {
  .smg__rows { padding-left: 0; }
}
</style>
