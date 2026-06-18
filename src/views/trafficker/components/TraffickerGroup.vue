<script setup lang="ts">
import type { PropType } from 'vue'
import type { GroupDef } from '../composables/useTraffickerDashboard'

const props = defineProps({
  group: {
    type: Object as PropType<GroupDef>,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function slideEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.overflow = 'hidden'
  e.style.height = '0'
  e.style.opacity = '0'
  void e.offsetHeight
  e.style.transition = 'height 0.36s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease'
  e.style.height = e.scrollHeight + 'px'
  e.style.opacity = '1'
  const onEnd = () => { e.removeEventListener('transitionend', onEnd); done() }
  e.addEventListener('transitionend', onEnd)
}

function slideAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = 'auto'
  e.style.overflow = ''
  e.style.transition = ''
}

function slideLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.overflow = 'hidden'
  e.style.height = e.scrollHeight + 'px'
  e.style.opacity = '1'
  void e.offsetHeight
  e.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease'
  e.style.height = '0'
  e.style.opacity = '0'
  const onEnd = () => { e.removeEventListener('transitionend', onEnd); done() }
  e.addEventListener('transitionend', onEnd)
}

function slideAfterLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.opacity = ''
  e.style.transition = ''
}
</script>

<template>
  <div
    class="trf__group"
    :class="`trf__group--${group.color}`"
  >
    <!-- Group header -->
    <button class="trf__group-header" @click="emit('toggle')">
      <div class="trf__group-icon">
        <i :class="group.icon" />
      </div>
      <div class="trf__group-meta">
        <span class="trf__group-title">{{ group.label }}</span>
        <span class="trf__group-desc">{{ group.desc }}</span>
      </div>
      <span class="trf__group-count">{{ group.cards.length }}</span>
      <i
        class="fa-solid fa-chevron-down trf__group-caret"
        :class="{ open: isExpanded }"
      />
    </button>

    <!-- Cards grid slot -->
    <Transition
      :css="false"
      @enter="slideEnter"
      @after-enter="slideAfterEnter"
      @leave="slideLeave"
      @after-leave="slideAfterLeave"
    >
      <div v-if="isExpanded" class="trf__group-grid">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.trf__group {
  border-radius: 18px;
  border: 1.5px solid;
  overflow: hidden;
  transition: box-shadow 0.18s;

  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  &--red    { border-color: #ef4444; background: rgba(#ef4444, 0.04); }
  &--orange { border-color: #f97316; background: rgba(#f97316, 0.04); }
  &--amber  { border-color: #f59e0b; background: rgba(#f59e0b, 0.04); }
  &--green  { border-color: #16a34a; background: rgba(#16a34a, 0.04); }
  &--blue   { border-color: #2563eb; background: rgba(#2563eb, 0.04); }
  &--gray   { border-color: #e2e8f0; background: white; }
}

.trf__group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  @media (min-width: 640px) { gap: 14px; padding: 16px 20px; }

  &:hover  { background: rgba(0,0,0,0.025); }
  &:active { background: rgba(0,0,0,0.05); }
}

.trf__group-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;

  .trf__group--red &    { background: #ef4444; color: #fff; }
  .trf__group--orange & { background: #f97316; color: #fff; }
  .trf__group--amber &  { background: #f59e0b; color: #fff; }
  .trf__group--green &  { background: #16a34a; color: #fff; }
  .trf__group--blue &   { background: #2563eb; color: #fff; }
  .trf__group--gray &   { background: #94a3b8; color: #fff; }
}

.trf__group-meta {
  flex: 1;
  min-width: 0;
}

.trf__group-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: $primary-dark;
  margin-bottom: 2px;

  .trf__group--red &    { color: #dc2626; }
  .trf__group--orange & { color: #c2410c; }
  .trf__group--amber &  { color: #b45309; }
  .trf__group--green &  { color: #15803d; }
  .trf__group--blue &   { color: #1d4ed8; }
}

.trf__group-desc {
  display: none;
  font-size: 12px;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 420px) { display: block; }
}

.trf__group-count {
  min-width: 30px;
  height: 30px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  padding: 0 9px;
  flex-shrink: 0;

  .trf__group--red &    { background: #ef4444; color: #fff; }
  .trf__group--orange & { background: #f97316; color: #fff; }
  .trf__group--amber &  { background: #f59e0b; color: #fff; }
  .trf__group--green &  { background: #16a34a; color: #fff; }
  .trf__group--blue &   { background: #2563eb; color: #fff; }
  .trf__group--gray &   { background: #94a3b8; color: #fff; }
}

.trf__group-caret {
  font-size: 12px;
  color: $text-secondary;
  transition: transform 0.25s;
  flex-shrink: 0;

  &.open { transform: rotate(180deg); }
}

.trf__group-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 0 12px 14px;

  @media (min-width: 480px)  { padding: 0 16px 16px; }
  @media (min-width: 640px)  { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1360px) { grid-template-columns: repeat(3, 1fr); }
}
</style>
