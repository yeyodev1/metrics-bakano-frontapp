<script setup lang="ts">
import type { BotAcceso } from '@/types'

/** A qué agentes entra la persona en el entorno, en chips chiquitos. */
defineProps<{ bots?: BotAcceso[] }>()
</script>

<template>
  <span class="agentes-chips">
    <span v-if="!bots || bots.includes('bakano')" class="agentes-chips__chip agentes-chips__chip--bakano" title="Bakano People">
      <i class="fa-solid fa-robot" /> Bakano People
    </span>
    <span v-if="!bots || bots.includes('lucas')" class="agentes-chips__chip agentes-chips__chip--lucas" title="Lucas">
      <i class="fa-solid fa-comments-dollar" /> Lucas
    </span>
  </span>
</template>

<style lang="scss" scoped>
.agentes-chips { display: inline-flex; flex-wrap: wrap; gap: 0.3rem; }

.agentes-chips__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  white-space: nowrap;

  i { font-size: 0.6rem; }

  &--bakano { background: rgba(#e6285c, 0.1); color: #c01f4b; }
  &--lucas { background: rgba(#0e9f6e, 0.12); color: #047857; }
}
</style>
