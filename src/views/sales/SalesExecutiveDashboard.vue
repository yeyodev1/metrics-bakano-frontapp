<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { selectedForm } from '@/services/salesExecutiveState'
import SalesBookingFormList from '@/components/sales/SalesBookingFormList.vue'
import { salesExecutiveService, type SalesBookingForm } from '@/services/salesExecutive.service'

const router = useRouter()
const forms = ref<SalesBookingForm[]>([])
const loading = ref(true)
const error = ref('')

async function loadMeetings() {
  loading.value = true
  error.value = ''
  try { forms.value = (await salesExecutiveService.getBookingForms()).forms }
  catch (requestError: any) { error.value = requestError?.message || 'No pudimos cargar los formularios comerciales.' }
  finally { loading.value = false }
}

function openForm(form: SalesBookingForm) {
  selectedForm.value = form
  router.push({ name: 'SalesExecutiveFormDetail', params: { formId: form.id } })
}

onMounted(loadMeetings)
</script>

<template>
  <main class="dashboard">
    <header>
      <div>
        <span>Ejecutivo de ventas</span>
        <h1>Formularios para preparar asesorias.</h1>
        <p>Revisa cada diagnostico comercial, filtrado por workspace y ordenado por llegada.</p>
      </div>
      <button @click="loadMeetings"><i class="fa-solid fa-rotate-right"></i> Actualizar</button>
    </header>
    <section v-if="loading || error || !forms.length" class="dashboard__state" :class="{ 'dashboard__state--error': error }">
      <i :class="loading ? 'fa-solid fa-spinner fa-spin' : error ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-calendar'"></i>
      {{ loading ? 'Cargando formularios comerciales...' : error || 'No hay formularios comerciales por ahora.' }}
    </section>
    <SalesBookingFormList v-else :forms="forms" @select="openForm" />
  </main>
</template>

<style scoped lang="scss">
.dashboard { display: flex; max-width: 1100px; flex-direction: column; gap: 1.5rem; margin: 0 auto; padding: clamp(1rem,3vw,2.5rem); }
.dashboard header { display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; padding: clamp(1.5rem,4vw,2.75rem); border-radius: 24px; color: $white; background: linear-gradient(135deg,$primary-dark,$primary); }
.dashboard span { font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.dashboard h1, .dashboard p { margin: 0; }.dashboard h1 { margin-top: .4rem; font-size: clamp(1.8rem,4vw,2.7rem); }
.dashboard header p { margin-top: .6rem; opacity: .8; }
.dashboard button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .85rem 1rem; border: 0; border-radius: 12px; color: $primary; background: $white; cursor: pointer; font: inherit; font-weight: 800; }
.dashboard__state { padding: 3rem; border: 1px dashed rgba($primary,.25); border-radius: 20px; color: $text-secondary; text-align: center; }.dashboard__state i { margin-right: .5rem; }.dashboard__state--error { color: $alert-error; }
@media (max-width: 600px) { .dashboard header { align-items: flex-start; flex-direction: column; }.dashboard header button { width: 100%; } }
</style>
