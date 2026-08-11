<template>
  <section class="smg">
    <button type="button" class="smg__header" :aria-expanded="open" @click="open = !open">
      <i class="smg__chevron fa-solid fa-chevron-right" :class="{ 'is-open': open }" />

      <span class="smg__label">
        {{ group.label }}
        <span v-if="group.approximate" class="smg__approx" title="Fecha tomada de la planificación, no de la publicación">
          aprox.
        </span>
      </span>

      <span class="smg__count">{{ group.items.length }} guiones</span>

      <span class="smg__linked" :class="{ 'is-complete': group.linked === group.items.length }">
        <i :class="group.linked === group.items.length ? 'fa-solid fa-circle-check' : 'fa-brands fa-instagram'" />
        {{ group.linked }}/{{ group.items.length }} vinculados
      </span>
    </button>

    <AccordionTransition>
      <div v-if="open" class="smg__rows">
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

.smg__approx {
  padding: 0.05rem 0.35rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: $text-secondary;
  text-transform: uppercase;
  background: rgba($text-secondary, 0.12);
  border-radius: 20px;
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
