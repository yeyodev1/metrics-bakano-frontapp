<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    searchPlaceholder?: string
    options: Array<{ value: string; label: string; icon?: string; image?: string; subtitle?: string }>
  }>(),
  {
    label: '',
    placeholder: 'Selecciona una opción',
    searchPlaceholder: 'Buscar...',
  }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const containerRef = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref('')

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase().trim()
  return props.options.filter((opt) => opt.label.toLowerCase().includes(q))
})

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue)
})

const selectedLabel = computed(() => {
  return selectedOption.value ? selectedOption.value.label : props.placeholder
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  query.value = ''
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    query.value = ''
    await nextTick()
    inputEl.value?.focus()
  }
}

function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="ss" :class="{ 'ss--open': open }">
    <label v-if="label" class="ss__label">{{ label }}</label>
    <button class="ss__trigger" type="button" @click="toggle">
      <div class="ss__trigger-content">
        <img v-if="selectedOption?.image" :src="selectedOption.image" class="ss__opt-img" alt="">
        <i v-else-if="selectedOption?.icon" :class="selectedOption.icon" class="ss__opt-icon" />
        <span class="ss__value" :class="{ 'ss__value--placeholder': !modelValue }">{{ selectedLabel }}</span>
      </div>
      <i class="fa-solid fa-chevron-down" />
    </button>
    <Transition name="ss-dropdown-fade">
      <div v-if="open" class="ss__dropdown">
        <input
          ref="inputEl"
          v-model="query"
          class="ss__search"
          type="text"
          :placeholder="searchPlaceholder"
        >
        <ul class="ss__list">
          <li
            v-for="opt in filtered"
            :key="opt.value"
            class="ss__option"
            :class="{ 'ss__option--active': opt.value === modelValue }"
            @click="select(opt.value)"
          >
            <img v-if="opt.image" :src="opt.image" class="ss__opt-img" alt="">
            <i v-else-if="opt.icon" :class="opt.icon" class="ss__opt-icon" />
            <div class="ss__opt-text">
              <span class="ss__opt-label">{{ opt.label }}</span>
              <span v-if="opt.subtitle" class="ss__opt-sub">{{ opt.subtitle }}</span>
            </div>
          </li>
          <li v-if="!filtered.length" class="ss__option ss__option--empty">Sin resultados</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.ss {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .35rem;
  width: 100%;
  min-width: 0;
}
.ss__label {
  color: $text-secondary;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.ss__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .6rem;
  width: 100%;
  min-width: 0;
  padding: .65rem .8rem;
  border: 1px solid rgba($primary-dark, .18);
  border-radius: 9px;
  color: $primary-dark;
  background: $white;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: .88rem;
  text-align: left;
  transition: border-color .15s, box-shadow .15s;
}
.ss__trigger-content {
  display: flex;
  align-items: center;
  gap: .6rem;
  min-width: 0;
  flex: 1;
}
.ss__trigger i {
  font-size: .75rem;
  color: $text-secondary;
  transition: transform .2s;
  flex-shrink: 0;
}
.ss__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ss__value--placeholder {
  color: $text-secondary;
  font-weight: 500;
}
.ss--open .ss__trigger {
  border-color: $primary;
  box-shadow: 0 0 0 3px rgba($primary, .12);
}
.ss--open .ss__trigger i {
  transform: rotate(-180deg);
}
.ss__dropdown {
  position: absolute;
  z-index: 1050;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba($primary-dark, .15);
  border-radius: 10px;
  background: $white;
  box-shadow: 0 10px 30px rgba($primary-dark, .2);
  overflow: hidden;
}
.ss__search {
  width: 100%;
  padding: .7rem .85rem;
  border: 0;
  border-bottom: 1px solid rgba($primary-dark, .08);
  color: $primary-dark;
  background: $white;
  font: inherit;
  font-size: .85rem;
  outline: none;
}
.ss__list {
  display: flex;
  flex-direction: column;
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: .25rem 0;
}
.ss__option {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .6rem .85rem;
  cursor: pointer;
  color: $primary-dark;
  font-size: .85rem;
  font-weight: 600;
  transition: background .15s;
}
.ss__opt-img {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.ss__opt-icon {
  font-size: 1rem;
  color: $primary;
  flex-shrink: 0;
}
.ss__opt-text {
  display: flex;
  flex-direction: column;
  gap: .1rem;
  min-width: 0;
}
.ss__opt-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ss__opt-sub {
  font-size: .75rem;
  color: $text-secondary;
  font-weight: 400;
}
.ss__option:hover {
  background: rgba($primary, .08);
}
.ss__option--active {
  color: $primary;
  background: rgba($primary, .12);
}
.ss__option--empty {
  color: $text-secondary;
  cursor: default;
  font-weight: 400;
  text-align: center;
  justify-content: center;
}

/* Dropdown Entrance/Exit Transition */
.ss-dropdown-fade-enter-active,
.ss-dropdown-fade-leave-active {
  transition: opacity .2s ease, transform .2s cubic-bezier(0.16, 1, 0.3, 1);
}
.ss-dropdown-fade-enter-from,
.ss-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>