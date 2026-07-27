<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { SalesBookingEligibility } from '@/services/booking.service'
import type { SalesBookingPayload } from './booking.types'

type Evidence = SalesBookingPayload['evidence'][number] & { previewUrl?: string }
const props = defineProps<{ eligibility: SalesBookingEligibility | null; loading: boolean; forceNewRequest: boolean; submitting: boolean; serverError: string }>()
const emit = defineEmits<{ back: []; billing: []; submit: [payload: SalesBookingPayload] }>()
const step = ref(1)
const error = ref('')
const evidence = ref<Evidence[]>([])
const form = ref({ salesApproach: '', commonObjection: '', otherObjection: '' })
const message = computed(() => error.value || props.serverError)

function next() {
  if (step.value === 1 && (!form.value.salesApproach || !form.value.commonObjection || (form.value.commonObjection === 'other' && !form.value.otherObjection))) {
    error.value = 'Selecciona cómo abordas las ventas y la objeción principal.'
    return
  }
  error.value = ''
  step.value += 1
}

function selectEvidence(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  const invalid = files.find((file) => !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
  if (invalid) error.value = 'Usa PDF, JPG, PNG o WEBP de hasta 10 MB.'
  else if (evidence.value.length + files.length > 5) error.value = 'Puedes subir un máximo de 5 archivos.'
  else {
    error.value = ''
    evidence.value.push(...files.map((file) => ({ file, description: '', previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined })))
  }
  ;(event.target as HTMLInputElement).value = ''
}

function removeEvidence(index: number) {
  const [removed] = evidence.value.splice(index, 1)
  if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
}

function submit() {
  if (!evidence.value.length) {
    error.value = 'Sube al menos una evidencia de una venta perdida.'
    return
  }
  error.value = ''
  emit('submit', { ...form.value, evidence: evidence.value.map(({ file, description }) => ({ file, description })) })
}

onBeforeUnmount(() => evidence.value.forEach(({ previewUrl }) => previewUrl && URL.revokeObjectURL(previewUrl)))
</script>

<template>
  <section class="gate">
    <button class="gate__back" @click="$emit('back')"><i class="fa-solid fa-arrow-left"></i> Volver a selección</button>
    <div class="gate__card">
      <span class="gate__eyebrow"><i class="fa-solid fa-shield-halved"></i> Agenda de Luis Reyes</span>
      <h1>Tu agenda de ventas está casi lista.</h1>
      <p>Antes de responder el diagnóstico, necesitamos que la facturación de este mes esté completa hasta anteayer.</p>

      <div v-if="loading" class="gate__loading"><i class="fa-solid fa-spinner fa-spin"></i> Validando requisitos...</div>
      <template v-else>
        <div class="gate__checklist">
          <span :class="{ ready: eligibility?.hasSalesInformation }"><i :class="eligibility?.hasSalesInformation ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>Diagnóstico comercial y evidencia de venta perdida</span>
          <span :class="{ ready: eligibility?.isBillingUpToDate }"><i :class="eligibility?.isBillingUpToDate ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i>Facturación registrada día a día hasta anteayer</span>
        </div>

        <section v-if="!eligibility?.isBillingUpToDate" class="gate__billing"><i class="fa-solid fa-calendar-check"></i><div><small>Facturación pendiente</small><h2>Completa {{ eligibility?.missingBillingDates.length || 1 }} día{{ (eligibility?.missingBillingDates.length || 1) === 1 ? '' : 's' }} de este mes.</h2><p>Registra la facturación pendiente día por día hasta anteayer. Al terminar, vuelve a esta agenda y podrás continuar.</p><button @click="$emit('billing')">Ir a Facturación & ROAS <i class="fa-solid fa-arrow-up-right-from-square"></i></button></div></section>

        <form v-else-if="forceNewRequest || !eligibility?.hasSalesInformation" class="sales-form" @submit.prevent="submit">
          <div class="sales-form__progress"><i v-for="number in 2" :key="number" :class="{ active: number === step, complete: number < step }">{{ number < step ? '✓' : number }}</i></div>
          <Transition name="wizard" mode="out-in">
            <fieldset v-if="step === 1" key="approach"><small>Antes de agendar</small><h2>Identifiquemos tu conversación comercial.</h2><legend>¿Cómo abordas al cliente? *</legend><label v-for="option in [{ value: 'spin', text: 'Método SPIN' }, { value: 'automatic_paragraph', text: 'Le envío un párrafo automático' }, { value: 'direct_service', text: 'Hablo directamente de mi servicio' }, { value: 'catalog', text: 'Envío catálogo' }]" :key="option.value"><input v-model="form.salesApproach" type="radio" :value="option.value" />{{ option.text }}</label><legend>¿Cuál es la objeción más común? *</legend><label v-for="option in [{ value: 'price_no_response', text: 'No responden después del precio' }, { value: 'think_about_it', text: 'Lo voy a pensar / para otro día' }, { value: 'out_of_budget', text: 'Está fuera de mi presupuesto' }, { value: 'curiosity', text: 'Solo preguntan por curiosidad' }, { value: 'other', text: 'Otra' }]" :key="option.value"><input v-model="form.commonObjection" type="radio" :value="option.value" />{{ option.text }}</label><input v-if="form.commonObjection === 'other'" v-model.trim="form.otherObjection" placeholder="Describe la objeción" /></fieldset>
            <section v-else key="evidence" class="sales-form__evidence-step"><small>Último paso</small><h2>Sube una conversación que no se cerró.</h2><p>Nos permitirá llegar preparados con recomendaciones reales.</p><label class="sales-form__upload">Evidencia de venta perdida *<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple @change="selectEvidence" /><span><i class="fa-solid fa-cloud-arrow-up"></i>{{ evidence.length ? `Agregar más archivos (${evidence.length}/5)` : 'PDF o imagen, hasta 5 archivos de 10 MB' }}</span></label><article v-for="(item, index) in evidence" :key="`${item.file.name}-${index}`"><img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.file.name" /><i v-else class="fa-solid fa-file-pdf"></i><div><strong>{{ item.file.name }}</strong><input v-model.trim="item.description" maxlength="300" placeholder="Descripción opcional" /></div><button type="button" @click="removeEvidence(index)"><i class="fa-solid fa-xmark"></i></button></article></section>
          </Transition>
          <p v-if="message" class="sales-form__error">{{ message }}</p>
          <div class="sales-form__actions"><button v-if="step > 1" type="button" class="secondary" @click="step -= 1">Atrás</button><button v-if="step < 2" type="button" @click="next">Continuar <i class="fa-solid fa-arrow-right"></i></button><button v-else :disabled="submitting">{{ submitting ? 'Guardando...' : 'Continuar a Facturación' }} <i :class="submitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i></button></div>
        </form>
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
.gate { width: min(100%,920px); margin: 0 auto; padding: clamp(1rem,3vw,2.5rem) 1.25rem; }
.gate__back { display: inline-flex; align-items: center; gap: .45rem; padding: .3rem 0; border: 0; color: #888; background: transparent; cursor: pointer; font: inherit; font-size: .82rem; font-weight: 700; }
.gate__card { position: relative; overflow: hidden; margin-top: 1rem; padding: clamp(1.35rem,4vw,2.75rem); border: 1px solid rgba($primary,.16); border-radius: 28px; background: linear-gradient(135deg,$white,#fff9fb); box-shadow: 0 24px 60px rgba($primary-dark,.1); }
.gate__card::after { position: absolute; top: 0; right: 0; width: 34%; height: 5px; background: linear-gradient(90deg,$secondary,$primary); content: ''; }
.gate h1 { margin: .9rem 0 .55rem; color: $primary-dark; font-size: clamp(1.65rem,4.2vw,2.55rem); letter-spacing: -.035em; }
.gate__card > p { max-width: 650px; margin: 0; color: $text-secondary; line-height: 1.65; }
.gate__eyebrow { display: inline-flex; align-items: center; gap: .45rem; padding: .42rem .7rem; border-radius: 999px; color: $primary; background: rgba($primary,.09); font-size: .72rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.gate__loading { padding: 2rem 0; color: $text-secondary; text-align: center; }
.gate__checklist { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1.75rem 0; }
.gate__checklist span { display: flex; align-items: center; flex: 1 1 280px; gap: .7rem; padding: .85rem 1rem; border: 1px solid rgba($primary-dark,.07); border-radius: 14px; color: $text-secondary; background: rgba($primary-dark,.03); font-size: .82rem; font-weight: 700; }
.gate__checklist .ready { border-color: rgba($BAKANO-GREEN,.22); color: #16714b; background: rgba($BAKANO-GREEN,.09); }
.gate__billing { display: flex; align-items: flex-start; gap: 1.25rem; padding: clamp(1.25rem,4vw,2rem); border: 1px solid rgba($primary,.18); border-radius: 20px; background: linear-gradient(135deg,rgba($primary,.06),rgba($secondary,.06)); }
.gate__billing > i { display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; flex: 0 0 auto; border-radius: 14px; color: $white; background: linear-gradient(135deg,$primary,$secondary); }
.gate__billing small { color: $primary; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.gate__billing h2 { margin: .35rem 0; color: $primary-dark; }
.gate__billing p { color: $text-secondary; line-height: 1.6; }
button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .9rem 1rem; border: 0; border-radius: 12px; color: $white; background: $primary; box-shadow: 0 10px 20px rgba($primary,.22); cursor: pointer; font: inherit; font-size: .86rem; font-weight: 800; transition: transform .2s, box-shadow .2s; }
button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 26px rgba($primary,.3); }
.sales-form { display: flex; flex-direction: column; gap: 1.15rem; }
.sales-form__progress { display: flex; align-items: center; gap: .5rem; margin-top: 1.5rem; }
.sales-form__progress i { display: inline-flex; align-items: center; justify-content: center; width: 1.9rem; height: 1.9rem; border-radius: 50%; color: $secondary; background: rgba($secondary,.12); font-size: .75rem; font-style: normal; font-weight: 800; }
.sales-form__progress .active, .sales-form__progress .complete { color: $white; background: $primary; }
fieldset, .sales-form__evidence-step { display: flex; flex-direction: column; gap: .75rem; min-width: 0; padding: clamp(1.1rem,3vw,1.75rem); border: 1px solid rgba($primary,.12); border-radius: 20px; background: $white; }
fieldset small, .sales-form__evidence-step > small { color: $primary; font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
fieldset h2, .sales-form__evidence-step h2 { margin: 0 0 .35rem; color: $primary-dark; font-size: clamp(1.35rem,3.5vw,1.75rem); }
legend { color: $primary-dark; font-size: .96rem; font-weight: 800; }
fieldset label { display: flex; align-items: center; min-height: 2.9rem; gap: .7rem; padding: .7rem 1rem; border: 1px solid rgba($primary-dark,.1); border-radius: 12px; color: $text-secondary; background: #fffcfd; cursor: pointer; font-size: .86rem; font-weight: 700; }
input { box-sizing: border-box; width: 100%; padding: .72rem .8rem; border: 1px solid rgba($primary-dark,.15); border-radius: 10px; font: inherit; }
input[type='radio'] { width: 1.05rem; height: 1.05rem; padding: 0; accent-color: $primary; }
.sales-form__upload { display: flex; flex-direction: column; gap: .55rem; padding: 1rem; border: 1.5px dashed rgba($primary,.35); border-radius: 12px; color: $primary; background: rgba($primary,.03); cursor: pointer; font-weight: 800; text-align: center; }
.sales-form__upload input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.sales-form article { display: flex; align-items: center; gap: .75rem; padding: .65rem; border: 1px solid rgba($primary,.14); border-radius: 12px; background: #fffcfd; }
.sales-form article > img, .sales-form article > i { display: flex; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; flex: 0 0 auto; border-radius: 9px; color: $primary; background: rgba($primary,.1); object-fit: cover; }
.sales-form article div { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: .3rem; }
.sales-form article strong { overflow: hidden; color: $primary-dark; font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
.sales-form article button { width: 1.9rem; height: 1.9rem; flex: 0 0 auto; padding: 0; color: $alert-error; background: rgba($alert-error,.08); box-shadow: none; }
.sales-form__error { margin: 0; color: $alert-error; font-size: .8rem; }
.sales-form__actions { display: flex; justify-content: space-between; gap: .75rem; }
.sales-form__actions button:last-child { margin-left: auto; }
.sales-form__actions .secondary { border: 1px solid rgba($primary-dark,.15); color: $text-secondary; background: $white; box-shadow: none; }
.wizard-enter-active, .wizard-leave-active { transition: opacity .22s ease, transform .22s ease; }
.wizard-enter-from { opacity: 0; transform: translateX(18px); }
.wizard-leave-to { opacity: 0; transform: translateX(-18px); }
@media (max-width: 500px) { .gate { padding: 1rem; } .gate__card { border-radius: 18px; padding: 1.35rem 1.1rem; } .gate__billing { flex-direction: column; } .gate__checklist { flex-direction: column; margin: 1rem 0; } }
</style>
