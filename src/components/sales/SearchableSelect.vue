<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: string
  label: string
  options: Array<{ value: string; label: string }>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const query = ref('')

const filtered = computed(() => {
  if (!query.value) return props.options
  const q = query.value.toLowerCase()
  return props.options.filter((opt) => opt.label.toLowerCase().includes(q))
})

const selectedLabel = computed(() => {
  const found = props.options.find((opt) => opt.value === props.modelValue)
  return found ? found.label : props.label
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  query.value = ''
}

function toggle() {
  open.value = !open.value
  if (open.value) query.value = ''
}
</script>

<template>
  <div class="ss" :class="{ 'ss--open': open }">
    <label class="ss__label">{{ label }}</label>
    <button class="ss__trigger" type="button" @click="toggle">
      <span>{{ selectedLabel }}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>
    <div v-if="open" class="ss__dropdown">
      <input
        ref="inputEl"
        v-model="query"
        class="ss__search"
        type="text"
placeholder="Buscar workspace..."
    >
      <ul class="ss__list">
        <li v-for="opt in filtered" :key="opt.value" class="ss__option" :class="{ 'ss__option--active': opt.value === modelValue }" @click="select(opt.value)">
          <span>{{ opt.label }}</span>
        </li>
        <li v-if="!filtered.length" class="ss__option ss__option--empty">Sin resultados</li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ss { position: relative; display: flex; flex-direction: column; gap: .35rem; }
.ss__label { color: $text-secondary; font-size: .7rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.ss__trigger { display: flex; align-items: center; justify-content: space-between; gap: .6rem; width: 100%; padding: .65rem .8rem; border: 1px solid rgba($primary,.2); border-radius: 9px; color: $primary-dark; background: $white; cursor: pointer; font: inherit; font-weight: 700; text-align: left; white-space: nowrap; }.ss__trigger i { font-size: .75rem; color: $text-secondary; transition: transform .2s; }
.ss--open .ss__trigger { border-color: $primary; }.ss--open .ss__trigger i { transform: rotate(-180deg); }
.ss__dropdown { position: absolute; z-index: 100; top: 100%; left: 0; right: 0; display: flex; flex-direction: column; margin-top: 4px; border: 1px solid rgba($primary,.15); border-radius: 10px; background: $white; box-shadow: 0 8px 24px rgba($primary-dark,.12); overflow: hidden; }
.ss__search { width: 100%; padding: .7rem .8rem; border: 0; border-bottom: 1px solid rgba($primary-dark,.08); color: $primary-dark; font: inherit; font-size: .85rem; outline: none; }
.ss__list { display: flex; flex-direction: column; max-height: 220px; overflow: auto; list-style: none; margin: 0; padding: .25rem 0; }
.ss__option { padding: .55rem .8rem; cursor: pointer; color: $primary-dark; font-size: .85rem; font-weight: 600; transition: background .15s; }.ss__option:hover { background: rgba($primary,.07); }
.ss__option--active { color: $primary; background: rgba($primary,.08); }
.ss__option--empty { color: $text-secondary; cursor: default; font-weight: 400; text-align: center; }
</style>