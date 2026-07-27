<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{ modelValue: boolean; dates: string[]; loading?: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirmed', payload: { total: number; allocations: { date: string; amount: number }[] }): void
}>()

const total = ref<number | null>(null)
const allocations = ref<{ date: string; amount: number }[]>([])

function distribute(value: number) {
  const cents = Math.round(value * 100)
  const base = Math.floor(cents / props.dates.length)
  const remainder = cents - base * props.dates.length
  allocations.value = props.dates.map((date, index) => ({ date, amount: (base + (index < remainder ? 1 : 0)) / 100 }))
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  total.value = null
  allocations.value = []
})

watch(total, (value) => {
  if (value && value > 0) {
    distribute(value)
  }
})

const allocationTotal = computed(() => allocations.value.reduce((sum, allocation) => sum + allocation.amount, 0))
const differenceCents = computed(() => Math.round(((total.value || 0) - allocationTotal.value) * 100))
const valid = computed(() => !!total.value && total.value > 0 && allocations.value.length === props.dates.length && differenceCents.value === 0)
const balanceMessage = computed(() => {
  const difference = Math.abs(differenceCents.value) / 100
  if (differenceCents.value === 0) return 'La distribución cuadra exactamente.'
  return differenceCents.value > 0 ? `Faltan $${difference.toFixed(2)} por asignar.` : `Debes quitar $${difference.toFixed(2)} para cuadrar.`
})

function updateAllocation(index: number, value: number) {
  allocations.value[index].amount = Math.max(0, value || 0)
}

function onAllocationInput(index: number, event: Event) {
  updateAllocation(index, Number((event.target as HTMLInputElement).value))
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
}

function close() { if (!props.loading) emit('update:modelValue', false) }
function confirm() { if (valid.value && !props.loading) emit('confirmed', { total: total.value!, allocations: allocations.value }) }
</script>

<template>
  <Transition name="bulk-modal">
    <div v-if="modelValue" class="bulk-overlay" @click.self="close">
      <section class="bulk-modal">
      <header class="bulk-modal__header">
        <div><span>Carga masiva</span><h2>Completa este mes en una sola acción</h2></div>
        <button @click="close" :disabled="loading"><i class="fa-solid fa-xmark" /></button>
      </header>
      <div class="bulk-modal__body">
        <div class="bulk-modal__intro"><i class="fa-solid fa-calendar-days" /><p>Detectamos <strong>{{ dates.length }} {{ dates.length === 1 ? 'día pendiente' : 'días pendientes' }}</strong> hasta anteayer. Ingresa el total y lo distribuimos por día.</p></div>
        <label class="bulk-modal__total">Total facturado este mes (USD)<input v-model.number="total" type="number" min="0" step="0.01" placeholder="0.00" autofocus /></label>
        <div v-if="allocations.length" class="bulk-modal__preview">
          <div class="bulk-modal__preview-head"><strong>Revisa la distribución</strong><span>${{ allocationTotal.toFixed(2) }} / ${{ (total || 0).toFixed(2) }}</span></div>
          <div class="bulk-modal__recommendation"><i class="fa-solid fa-circle-info" /><span>La distribución automática es la recomendada. Si conoces el valor real de cada día, puedes ajustarlo abajo.</span></div>
          <div class="bulk-modal__days"><label v-for="(allocation, index) in allocations" :key="allocation.date"><span>{{ formatDate(allocation.date) }}</span><input :value="allocation.amount" type="number" min="0" step="0.01" @input="onAllocationInput(index, $event)" /></label></div>
        </div>
        <p v-if="total" class="bulk-modal__balance" :class="{ 'bulk-modal__balance--valid': valid, 'bulk-modal__balance--invalid': !valid }"><i :class="valid ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'" /> {{ balanceMessage }}</p>
      </div>
      <footer><button class="bulk-modal__cancel" @click="close" :disabled="loading">Cancelar</button><button class="bulk-modal__save" :disabled="!valid || loading" @click="confirm"><i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" /> {{ loading ? 'Guardando...' : 'Confirmar y guardar' }}</button></footer>
      </section>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.bulk-overlay { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba($primary-dark, 0.62); backdrop-filter: blur(5px); }
.bulk-modal { display: flex; flex-direction: column; width: min(100%, 620px); max-height: 90vh; overflow: hidden; border-radius: 22px; background: $white; box-shadow: 0 28px 70px rgba($primary-dark, 0.3); }
.bulk-modal__header { display: flex; justify-content: space-between; gap: 1rem; padding: 1.4rem 1.5rem; color: $white; background: linear-gradient(135deg, $primary-dark, $secondary-dark); span { color: rgba($white, 0.68); font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; } h2 { margin: .3rem 0 0; font-size: 1.35rem; } button { width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border: 0; border-radius: 10px; color: $white; background: rgba($white, .12); cursor: pointer; } }
.bulk-modal__body { display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding: 1.35rem 1.5rem; }
.bulk-modal__intro { display: flex; gap: .75rem; align-items: flex-start; padding: .9rem; border-radius: 14px; color: $primary-dark; background: rgba($primary, .07); i { margin-top: .15rem; color: $primary; } p { margin: 0; font-size: .87rem; line-height: 1.5; } }
.bulk-modal__total { display: flex; flex-direction: column; gap: .4rem; color: $primary-dark; font-size: .82rem; font-weight: 800; input { width: 100%; box-sizing: border-box; padding: .9rem 1rem; border: 2px solid rgba($primary, .18); border-radius: 12px; color: $primary-dark; font: inherit; font-size: 1.35rem; font-weight: 800; outline: none; &:focus { border-color: $primary; } } }
.bulk-modal__preview { display: flex; flex-direction: column; gap: .7rem; }.bulk-modal__preview-head { display: flex; justify-content: space-between; font-size: .82rem; color: $text-secondary; strong { color: $primary-dark; } }.bulk-modal__recommendation { display: flex; gap: .5rem; align-items: flex-start; padding: .7rem .8rem; border-radius: 10px; color: #7c4b17; background: rgba($alert-warning, .1); font-size: .76rem; line-height: 1.45; i { margin-top: .1rem; color: $alert-warning; } }
.bulk-modal__days { display: flex; flex-direction: column; max-height: 230px; overflow-y: auto; border: 1px solid rgba($primary-dark, .09); border-radius: 12px; label { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .65rem .8rem; border-bottom: 1px solid rgba($primary-dark, .06); color: $text-secondary; font-size: .8rem; &:last-child { border: 0; } input { width: 105px; padding: .5rem .6rem; border: 1px solid rgba($primary-dark, .12); border-radius: 8px; color: $primary-dark; font: inherit; font-weight: 700; text-align: right; } } }
.bulk-modal__balance { display: flex; align-items: center; gap: .5rem; margin: 0; padding: .75rem .85rem; border-radius: 10px; font-size: .8rem; font-weight: 700; &--valid { color: #16714b; background: rgba($BAKANO-GREEN, .1); } &--invalid { color: #a12a45; background: rgba($primary, .09); } }.bulk-modal footer { display: flex; gap: .75rem; padding: 1rem 1.5rem 1.35rem; border-top: 1px solid rgba($primary-dark, .08); button { padding: .8rem 1rem; border-radius: 10px; font: inherit; font-weight: 800; cursor: pointer; } }.bulk-modal__cancel { flex: 1; border: 1px solid rgba($primary-dark, .12); color: $text-secondary; background: $white; }.bulk-modal__save { flex: 2; border: 0; color: $white; background: $primary; &:disabled { opacity: .45; cursor: not-allowed; } }
@media (max-width: 500px) { .bulk-modal__header, .bulk-modal__body, .bulk-modal footer { padding-left: 1rem; padding-right: 1rem; } .bulk-modal__header h2 { font-size: 1.15rem; } }
.bulk-modal-enter-active { transition: opacity .24s ease; .bulk-modal { transition: opacity .3s cubic-bezier(.16, 1, .3, 1), transform .3s cubic-bezier(.16, 1, .3, 1); } }
.bulk-modal-leave-active { transition: opacity .18s ease; .bulk-modal { transition: opacity .18s ease, transform .18s ease; } }
.bulk-modal-enter-from, .bulk-modal-leave-to { opacity: 0; .bulk-modal { opacity: 0; transform: translateY(22px) scale(.96); } }
</style>
