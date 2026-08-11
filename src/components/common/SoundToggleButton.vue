<template>
  <button
    type="button"
    role="switch"
    :aria-checked="sound.enabled"
    :aria-label="label"
    :title="label"
    :class="['sndtoggle', `sndtoggle--${tone}`, { 'is-on': sound.enabled }]"
    data-no-sound
    @click="onToggle"
  >
    <i :class="sound.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'" />
    <span v-if="showLabel" class="sndtoggle__text">
      {{ sound.enabled ? 'Sonido activado' : 'Sonido silenciado' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { play } from 'cuelume'
import { useSoundStore } from '@/stores/sound'

withDefaults(
  defineProps<{
    showLabel?: boolean
    /** `onDark` is for the sidebar, whose background is dark. */
    tone?: 'default' | 'onDark'
  }>(),
  { showLabel: false, tone: 'default' }
)

const sound = useSoundStore()

const label = computed(() =>
  sound.enabled ? 'Silenciar sonido de la interfaz' : 'Activar sonido de la interfaz'
)

function onToggle() {
  sound.toggle()
  // Only confirm audibly when turning it on — muting should be silent.
  if (sound.enabled) play('toggle')
}
</script>

<style lang="scss" scoped>
.sndtoggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 36px;
  height: 36px;
  padding: 0 0.6rem;
  font-family: inherit;
  font-size: 0.82rem;
  background: transparent;
  border: 1px solid;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.18s;

  &:focus-visible {
    outline: 2px solid $secondary;
    outline-offset: 2px;
  }
}

.sndtoggle--default {
  color: $text-secondary;
  border-color: rgba($text-secondary, 0.25);

  &:hover {
    color: $primary-dark;
    border-color: rgba($primary-dark, 0.35);
  }

  // The on state has to read at a glance, not require squinting at the icon.
  &.is-on {
    color: $BAKANO-GREEN;
    background: rgba($BAKANO-GREEN, 0.1);
    border-color: rgba($BAKANO-GREEN, 0.45);
  }
}

.sndtoggle--onDark {
  color: rgba($white, 0.7);
  border-color: rgba($white, 0.2);

  &:hover {
    color: $white;
    border-color: rgba($white, 0.4);
  }

  &.is-on {
    color: $BAKANO-GREEN;
    background: rgba($BAKANO-GREEN, 0.16);
    border-color: rgba($BAKANO-GREEN, 0.5);
  }
}

.sndtoggle__text {
  font-weight: 600;
  white-space: nowrap;
}
</style>
