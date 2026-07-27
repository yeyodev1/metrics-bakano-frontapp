<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: { start: string; end: string }
  label?: string
  presets?: Array<{ label: string; start: string; end: string }>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: { start: string; end: string }]; preset: [label: string] }>()

const open = ref(false)
const query = ref('')
const triggerRef = ref<HTMLElement | null>(null)

const rangeLabel = computed(() => {
  if (!props.modelValue.start || !props.modelValue.end) return props.label || 'Seleccionar rango'
  const s = new Date(props.modelValue.start + 'T00:00:00')
  const e = new Date(props.modelValue.end + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Guayaquil' }
  return s.toLocaleDateString('es-EC', opts) + ' \u2192 ' + e.toLocaleDateString('es-EC', opts)
})

function applyPreset(label: string, start: string, end: string) {
  emit('update:modelValue', { start, end })
  emit('preset', label)
  open.value = false
  query.value = ''
}

function clearSelection() {
  emit('update:modelValue', { start: '', end: '' })
  open.value = false
  query.value = ''
}

const presets = computed(() => {
  if (props.presets) return props.presets
  const now = new Date()
  const ec = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now).reduce<Record<string,string>>((r,p) => ({...r,[p.type]:p.value}),{})
  const y = Number(ec.year), m = Number(ec.month), d = Number(ec.day)
  const thisMonth = { start: new Date(Date.UTC(y, m - 1, 1)).toISOString().split('T')[0], end: new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0] }
  const prevM = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const prevMonth = { start: new Date(Date.UTC(prevM.y, prevM.m - 1, 1)).toISOString().split('T')[0], end: new Date(Date.UTC(prevM.y, prevM.m, 0)).toISOString().split('T')[0] }
  const last30 = { start: new Date(Date.UTC(y, m - 1, d - 29)).toISOString().split('T')[0], end: new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0] }
  const last90 = { start: new Date(Date.UTC(y, m - 1, d - 89)).toISOString().split('T')[0], end: new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0] }
  return [
    { label: 'Este mes', start: thisMonth.start, end: thisMonth.end },
    { label: 'Mes anterior', start: prevMonth.start, end: prevMonth.end },
    { label: 'Ultimos 30 dias', start: last30.start, end: last30.end },
    { label: 'Ultimos 90 dias', start: last90.start, end: last90.end },
  ]
})

const filteredPresets = computed(() => {
  if (!query.value) return presets.value
  const q = query.value.toLowerCase()
  return presets.value.filter((p) => p.label.toLowerCase().includes(q))
})
</script>

<template>
  <div class="drf" :class="{ 'drf--open': open }" ref="triggerRef">
    <label v-if="label" class="drf__label">{{ label }}</label>
    <button class="drf__trigger" type="button" @click="open = !open">
      <i class="fa-solid fa-calendar-days"></i>
      <span>{{ rangeLabel }}</span>
      <i class="fa-solid fa-chevron-down"></i>
    </button>
    <Transition name="drf-fade">
      <div v-if="open" class="drf__panel">
        <input v-model="query" class="drf__search" type="text" placeholder="Buscar preset..." />
        <div class="drf__presets">
          <button v-for="p in filteredPresets" :key="p.label" class="drf__preset" @click="applyPreset(p.label, p.start, p.end)">{{ p.label }}</button>
        </div>
        <div class="drf__custom">
          <label>Desde <input type="date" :value="modelValue.start" @change="emit('update:modelValue', { ...modelValue, start: ($event.target as HTMLInputElement).value })" /></label>
          <label>Hasta <input type="date" :value="modelValue.end" @change="emit('update:modelValue', { ...modelValue, end: ($event.target as HTMLInputElement).value })" /></label>
        </div>
        <button class="drf__clear" @click="clearSelection"><i class="fa-solid fa-xmark"></i> Limpiar</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.drf { position: relative; display: flex; flex-direction: column; gap: .35rem; }
.drf__label { color: $text-secondary; font-size: .7rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.drf__trigger { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .85rem; border: 1px solid rgba($primary,.2); border-radius: 10px; color: $primary-dark; background: $white; cursor: pointer; font: inherit; font-weight: 600; font-size: .82rem; white-space: nowrap; transition: border-color .2s, box-shadow .2s; }
.drf__trigger > i:first-child { color: $primary; font-size: .9rem; }
.drf__trigger > i:last-child { font-size: .65rem; color: $text-secondary; transition: transform .2s; }
.drf--open .drf__trigger { border-color: $primary; box-shadow: 0 0 0 3px rgba($primary,.1); }
.drf--open .drf__trigger > i:last-child { transform: rotate(-180deg); }
.drf__panel { position: absolute; z-index: 200; top: calc(100% + 6px); left: 0; display: flex; width: min(320px, 90vw); flex-direction: column; border-radius: 14px; background: $white; border: 1px solid rgba($primary-dark,.1); box-shadow: 0 12px 32px rgba($primary-dark,.15); overflow: hidden; }
.drf__search { width: 100%; padding: .65rem .8rem; border: 0; border-bottom: 1px solid rgba($primary-dark,.06); font: inherit; font-size: .85rem; outline: none; }
.drf__presets { display: flex; flex-direction: column; max-height: 180px; overflow: auto; }
.drf__preset { padding: .6rem .85rem; border: 0; border-bottom: 1px solid rgba($primary-dark,.04); background: none; cursor: pointer; font: inherit; font-size: .85rem; font-weight: 600; color: $primary-dark; text-align: left; transition: background .15s; }
.drf__preset:hover { background: rgba($primary,.06); }
.drf__custom { display: flex; gap: .5rem; padding: .65rem .8rem; border-top: 1px solid rgba($primary-dark,.06); }
.drf__custom label { display: flex; flex-direction: column; gap: .2rem; flex: 1; font-size: .7rem; color: $text-secondary; font-weight: 700; }
.drf__custom input[type="date"] { padding: .4rem .5rem; border: 1px solid rgba($primary,.15); border-radius: 7px; font-size: .8rem; color: $primary-dark; }
.drf__clear { display: flex; align-items: center; justify-content: center; gap: .4rem; padding: .55rem; border: 0; border-top: 1px solid rgba($primary-dark,.06); background: none; color: $text-secondary; cursor: pointer; font-size: .78rem; font-weight: 600; transition: color .15s; }
.drf__clear:hover { color: $alert-error; }
.drf-fade-enter-active, .drf-fade-leave-active { transition: opacity .2s, transform .2s; }
.drf-fade-enter-from, .drf-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
