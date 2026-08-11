<template>
  <Transition
    name="acc"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @leave="onLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
/**
 * Height-aware accordion transition.
 *
 * CSS alone cannot animate to `height: auto`, so the element's measured height
 * is set explicitly for the duration of the animation and released afterwards
 * — otherwise the panel could not grow when its content changes while open.
 */
withDefaults(defineProps<{ duration?: number }>(), { duration: 220 })

function onEnter(el: Element) {
  const node = el as HTMLElement
  node.style.height = '0'
  node.style.opacity = '0'
  node.style.overflow = 'hidden'
  // Force a reflow so the browser registers the starting height.
  void node.offsetHeight
  node.style.height = `${node.scrollHeight}px`
  node.style.opacity = '1'
}

function onAfterEnter(el: Element) {
  const node = el as HTMLElement
  node.style.height = ''
  node.style.opacity = ''
  node.style.overflow = ''
}

function onLeave(el: Element) {
  const node = el as HTMLElement
  node.style.height = `${node.scrollHeight}px`
  node.style.overflow = 'hidden'
  void node.offsetHeight
  node.style.height = '0'
  node.style.opacity = '0'
}
</script>

<style scoped lang="scss">
.acc-enter-active,
.acc-leave-active {
  transition: height 0.22s ease, opacity 0.18s ease;
}

// Users who asked the OS for less motion get the state change without the slide.
@media (prefers-reduced-motion: reduce) {
  .acc-enter-active,
  .acc-leave-active {
    transition: none;
  }
}
</style>
