<script setup lang="ts">
import { computed, ref } from 'vue'
import SearchableSelect from '@/components/sales/SearchableSelect.vue'
import type { SalesBookingForm } from '@/services/salesExecutive.service'

const props = defineProps<{ forms: SalesBookingForm[] }>()
const emit = defineEmits<{ select: [form: SalesBookingForm] }>()

const workspace = ref('all')
const sortedForms = computed(() => [...props.forms].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
const workspaces = computed(() => Array.from(new Map(props.forms.map((form) => [form.workspace.id, form.workspace])).values()))
const wsOptions = computed(() => [{ value: 'all', label: 'Todos los workspaces' }, ...workspaces.value.map((w) => ({ value: w.id, label: w.name }))])
const filteredForms = computed(() => workspace.value === 'all' ? sortedForms.value : sortedForms.value.filter((form) => form.workspace.id === workspace.value))

function date(value: string) { return new Date(value).toLocaleString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guayaquil' }) }
function objection(form: SalesBookingForm) { return form.diagnostic?.commonObjection === 'other' ? form.diagnostic?.otherObjection || 'Otra objecion' : (form.diagnostic?.commonObjection || '').replaceAll('_', ' ') }
</script>

<template>
  <section class="form-list">
    <header class="form-list__toolbar">
      <div class="form-list__count"><strong>{{ filteredForms.length }}</strong><span>formularios recibidos</span></div>
      <SearchableSelect v-model="workspace" label="Filtrar por workspace" :options="wsOptions" />
    </header>

    <article v-for="form in filteredForms" :key="form.id" class="form-card">
      <div class="form-card__workspace"><i class="fa-solid fa-building"></i><div><span>Workspace</span><strong>{{ form.workspace.name }}</strong></div></div>
      <div class="form-card__client"><span>Cliente</span><h2>{{ form.client.name }}</h2><p>{{ form.client.email }}</p></div>
      <div class="form-card__process"><span>Ingreso al proceso</span><strong>{{ date(form.submittedAt) }}</strong></div>
      <div class="form-card__objection"><span>Objecion principal</span><strong>{{ objection(form) }}</strong></div>
      <button @click="emit('select', form)">Ver perfil comercial <i class="fa-solid fa-arrow-right"></i></button>
    </article>

    <p v-if="!filteredForms.length" class="form-list__empty">No hay formularios para este workspace.</p>
  </section>
</template>

<style scoped lang="scss">
.form-list { display: flex; flex-direction: column; gap: .85rem; }
.form-list__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-radius: 16px; background: rgba($primary,.06); }
.form-list__count { display: flex; align-items: baseline; gap: .5rem; color: $primary-dark; }.form-list__count strong { font-size: 1.65rem; }.form-list__count span { color: $text-secondary; font-size: .7rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.form-card { display: flex; flex-wrap: wrap; align-items: center; gap: 1.15rem; padding: 1.1rem 1.25rem; border: 1px solid rgba($primary-dark,.08); border-radius: 17px; background: $white; box-shadow: 0 3px 12px rgba($primary-dark,.03); transition: border-color .2s, box-shadow .2s, transform .2s; }.form-card:hover { transform: translateY(-2px); border-color: rgba($primary,.22); box-shadow: 0 10px 22px rgba($primary-dark,.07); }
.form-card__workspace { display: flex; align-items: center; min-width: 180px; gap: .65rem; }.form-card__workspace > i { display: flex; align-items: center; justify-content: center; width: 2.4rem; height: 2.4rem; border-radius: 10px; color: $primary; background: rgba($primary,.1); }.form-card__workspace div, .form-card__client, .form-card__process, .form-card__objection { display: flex; flex: 1 1 145px; flex-direction: column; gap: .25rem; }.form-card__workspace strong, .form-card__process strong, .form-card__objection strong { color: $primary-dark; font-size: .86rem; }
.form-card h2, .form-card p { margin: 0; }.form-card h2 { color: $primary-dark; font-size: 1rem; }.form-card p { color: $text-secondary; font-size: .8rem; }.form-card__objection strong { text-transform: capitalize; }
.form-card button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .85rem 1rem; border: 0; border-radius: 12px; color: $white; background: $primary; cursor: pointer; font: inherit; font-size: .82rem; font-weight: 800; }
.form-list__empty { padding: 2.5rem; border: 1px dashed rgba($primary,.25); border-radius: 16px; color: $text-secondary; text-align: center; }
@media (max-width: 680px) { .form-list__toolbar { align-items: flex-start; flex-direction: column; }.form-card button { width: 100%; }.form-card { align-items: flex-start; flex-direction: column; width: auto; }.form-card__workspace, .form-card__client, .form-card__process, .form-card__objection { width: 100%; flex: 0 0 auto; } }
</style>
