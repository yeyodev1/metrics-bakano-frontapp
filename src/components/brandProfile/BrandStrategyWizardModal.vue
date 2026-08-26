<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue'
import { useUnsavedCloseGuard } from '@/composables/useUnsavedCloseGuard'
import type { BrandProfile, SegmentoMercado, CustomerJourneyCase } from '@/types'
import BrandStrategyDocument from './BrandStrategyDocument.vue'

const props = defineProps<{
  show: boolean
  profile: BrandProfile
  isSaving: boolean
  /** Nombre del workspace; encabeza el documento del último paso. */
  marca?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'finish', data: {
    propuestaValor: string
    segmentosMercado: SegmentoMercado[]
    canalesDetail: string[]
    actividadesClave: string[]
    customerJourneyCases: CustomerJourneyCase[]
  }): void
}>()

const STEPS = [
  { n: 1, label: 'Propuesta', icon: 'fa-solid fa-gem' },
  { n: 2, label: 'Segmentos', icon: 'fa-solid fa-users' },
  { n: 3, label: 'Canales', icon: 'fa-solid fa-tower-broadcast' },
  { n: 4, label: 'Actividades', icon: 'fa-solid fa-list-check' },
  { n: 5, label: 'Customer Journey', icon: 'fa-solid fa-route' },
  { n: 6, label: 'Confirmar', icon: 'fa-solid fa-circle-check' },
]

const CONFIRM_STEP = 6

const step = ref(1)

const propuestaValor = ref('')
const segmentos = ref<SegmentoMercado[]>([])
const canales = ref<string[]>([])
const actividades = ref<string[]>([])
const casos = ref<CustomerJourneyCase[]>([])

function resetFromProfile() {
  propuestaValor.value = props.profile.propuestaValor || ''
  segmentos.value = props.profile.segmentosMercado?.length
    ? JSON.parse(JSON.stringify(props.profile.segmentosMercado))
    : [{ nombre: '', descripcion: '' }]
  // Empty rows, not pre-written answers: anything left here gets saved as if
  // the team had written it, and then feeds the AI as fact about this brand.
  canales.value = props.profile.canalesDetail?.length
    ? [...props.profile.canalesDetail]
    : ['', '']
  actividades.value = props.profile.actividadesClave?.length
    ? [...props.profile.actividadesClave]
    : ['', '']
  casos.value = props.profile.customerJourneyCases?.length
    ? JSON.parse(JSON.stringify(props.profile.customerJourneyCases))
    : [
        { casoNumero: 1, nombreCaso: '', potencialCliente: '', efectoAnuncio: '', accionEsperada: '' },
        { casoNumero: 2, nombreCaso: '', potencialCliente: '', efectoAnuncio: '', accionEsperada: '' },
        { casoNumero: 3, nombreCaso: '', potencialCliente: '', efectoAnuncio: '', accionEsperada: '' },
      ]
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      step.value = 1
      resetFromProfile()
    }
  },
  { immediate: true }
)

// El onboarding no guarda nada hasta el paso 6: cerrarlo por error borra los
// seis pasos, así que las salidas pasan por el guardia compartido.
const { isDirty, requestClose } = useUnsavedCloseGuard({
  show: toRef(props, 'show'),
  state: () => ({
    propuestaValor: propuestaValor.value,
    segmentos: segmentos.value,
    canales: canales.value,
    actividades: actividades.value,
    casos: casos.value,
  }),
  isBusy: toRef(props, 'isSaving'),
  onClose: () => emit('close'),
  title: '¿Salir del onboarding?',
  message:
    'Lo que escribiste todavía no se ha guardado. Si sales ahora se pierde y hay que empezar de nuevo desde el paso 1.',
})

// Lo que realmente se va a guardar. El resumen del paso de confirmación lee
// estos mismos computed que finish(), así que lo que el usuario ve confirmado
// es exactamente lo que se envía — sin filas vacías que se cuelen.
const segmentosLimpios = computed(() =>
  segmentos.value.filter((s) => s.nombre.trim() || s.descripcion.trim())
)
const canalesLimpios = computed(() => canales.value.filter((c) => c.trim()))
const actividadesLimpias = computed(() => actividades.value.filter((a) => a.trim()))
const casosLimpios = computed(() =>
  casos.value.filter(
    (c) => c.potencialCliente.trim() || c.efectoAnuncio.trim() || c.accionEsperada.trim()
  )
)

const canGoNext = computed(() => {
  if (step.value === 1) return propuestaValor.value.trim().length > 0
  if (step.value === 2) return segmentos.value.some((s) => s.nombre.trim() || s.descripcion.trim())
  if (step.value === 3) return canales.value.some((c) => c.trim())
  if (step.value === 4) return actividades.value.some((a) => a.trim())
  if (step.value === 5) return casos.value.some((c) => c.potencialCliente.trim())
  return true
})

function nextStep() {
  if (step.value < STEPS.length) step.value++
}
function prevStep() {
  if (step.value > 1) step.value--
  else requestClose()
}
function goToStep(n: number) {
  step.value = n
}

function addSegmento() {
  segmentos.value.push({ nombre: '', descripcion: '' })
}
function removeSegmento(idx: number) {
  segmentos.value.splice(idx, 1)
}

function addCanal() {
  canales.value.push('')
}
function removeCanal(idx: number) {
  canales.value.splice(idx, 1)
}

function addActividad() {
  actividades.value.push('')
}
function removeActividad(idx: number) {
  actividades.value.splice(idx, 1)
}

function addCaso() {
  const nextNum = casos.value.length + 1
  casos.value.push({ casoNumero: nextNum, nombreCaso: '', potencialCliente: '', efectoAnuncio: '', accionEsperada: '' })
}
function removeCaso(idx: number) {
  casos.value.splice(idx, 1)
  casos.value.forEach((c, i) => { c.casoNumero = i + 1 })
}

function finish() {
  emit('finish', {
    propuestaValor: propuestaValor.value.trim(),
    segmentosMercado: segmentosLimpios.value,
    canalesDetail: canalesLimpios.value,
    actividadesClave: actividadesLimpias.value,
    customerJourneyCases: casosLimpios.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bsw-fade">
      <div v-if="show" class="bsw-overlay" @click.self="requestClose">
        <div class="bsw-modal">
          <!-- Header -->
          <header class="bsw-header">
            <div class="bsw-header__title">
              <i class="fa-solid fa-compass-drafting" />
              <div>
                <h3>Onboarding de Estrategia de Marca</h3>
                <p>Define tu propuesta de valor, mercado y Customer Journey paso a paso.</p>
              </div>
            </div>
            <button
              class="bsw-close"
              :disabled="isSaving"
              :title="isDirty ? 'Cerrar (te pedirá confirmación)' : 'Cerrar'"
              aria-label="Cerrar"
              @click="requestClose"
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </header>

          <!-- Step Indicator -->
          <div class="bsw-steps">
            <template v-for="(s, idx) in STEPS" :key="s.n">
              <div :class="['bsw-step', { 'is-active': step === s.n, 'is-done': step > s.n }]">
                <span class="bsw-step__dot">
                  <i v-if="step > s.n" class="fa-solid fa-check" />
                  <i v-else :class="s.icon" />
                </span>
                <span class="bsw-step__label">{{ s.label }}</span>
              </div>
              <div v-if="idx < STEPS.length - 1" class="bsw-step__line" :class="{ 'is-done': step > s.n }" />
            </template>
          </div>

          <!-- Body -->
          <div class="bsw-body">
            <Transition name="bsw-slide" mode="out-in">
              <!-- STEP 1: Propuesta de Valor -->
              <div v-if="step === 1" key="1" class="bsw-panel">
                <div class="bsw-hint">
                  <i class="fa-solid fa-circle-info" />
                  <span>¿Qué te diferencia? Describe la promesa central que hace única a tu marca frente a la competencia.</span>
                </div>
                <div class="bsw-field">
                  <label>Propuesta de Valor</label>
                  <textarea
                    v-model="propuestaValor"
                    rows="6"
                    placeholder="Ej: Servicios aduaneros para empresas de importación con seguimiento proactivo en tiempo real y soporte constante como diferenciador..."
                  />
                </div>
              </div>

              <!-- STEP 2: Segmento de Mercado -->
              <div v-else-if="step === 2" key="2" class="bsw-panel">
                <div class="bsw-hint">
                  <i class="fa-solid fa-circle-info" />
                  <span>Enumera los tipos de empresas o personas que forman tu mercado objetivo (uno por tarjeta).</span>
                </div>
                <div class="bsw-list">
                  <div v-for="(seg, idx) in segmentos" :key="idx" class="bsw-list-item">
                    <div class="bsw-list-item__head">
                      <span class="bsw-list-item__num">#{{ idx + 1 }}</span>
                      <input v-model="seg.nombre" type="text" placeholder="Nombre del segmento (opcional)..." class="bsw-input-inline" />
                      <button type="button" class="bsw-del-btn" @click="removeSegmento(idx)"><i class="fa-solid fa-trash-can" /></button>
                    </div>
                    <textarea v-model="seg.descripcion" rows="2" placeholder="Ej: Empresas que buscan optimizar costos trayendo equipos de China con facturación por encima de 50,000 dólares..." />
                  </div>
                </div>
                <button type="button" class="bsw-btn-add" @click="addSegmento">
                  <i class="fa-solid fa-plus" /> Agregar Segmento
                </button>
              </div>

              <!-- STEP 3: Canales -->
              <div v-else-if="step === 3" key="3" class="bsw-panel">
                <div class="bsw-hint">
                  <i class="fa-solid fa-circle-info" />
                  <span>¿Dónde vas a captar y convertir a tus clientes? Ej: Redes Sociales, WhatsApp, Punto Físico...</span>
                </div>
                <div class="bsw-list">
                  <div v-for="(canal, idx) in canales" :key="idx" class="bsw-list-row">
                    <i class="fa-solid fa-tower-broadcast bsw-row-icon" />
                    <input v-model="canales[idx]" type="text" placeholder="Ej: WhatsApp (llevar a que pregunten por el taller)..." />
                    <button type="button" class="bsw-del-btn" @click="removeCanal(idx)"><i class="fa-solid fa-trash-can" /></button>
                  </div>
                </div>
                <button type="button" class="bsw-btn-add" @click="addCanal">
                  <i class="fa-solid fa-plus" /> Agregar Canal
                </button>
              </div>

              <!-- STEP 4: Actividades Clave -->
              <div v-else-if="step === 4" key="4" class="bsw-panel">
                <div class="bsw-hint">
                  <i class="fa-solid fa-circle-info" />
                  <span>¿Qué tareas son indispensables para que tu estrategia funcione? Ej: Creación de guiones, articular ventas con anuncios...</span>
                </div>
                <div class="bsw-list">
                  <div v-for="(act, idx) in actividades" :key="idx" class="bsw-list-row">
                    <i class="fa-solid fa-list-check bsw-row-icon" />
                    <input v-model="actividades[idx]" type="text" placeholder="Ej: Creación de guiones..." />
                    <button type="button" class="bsw-del-btn" @click="removeActividad(idx)"><i class="fa-solid fa-trash-can" /></button>
                  </div>
                </div>
                <button type="button" class="bsw-btn-add" @click="addActividad">
                  <i class="fa-solid fa-plus" /> Agregar Actividad
                </button>
              </div>

              <!-- STEP 5: Customer Journey -->
              <div v-else-if="step === 5" key="5" class="bsw-panel">
                <div class="bsw-hint">
                  <i class="fa-solid fa-circle-info" />
                  <span>Por cada caso responde: <strong>¿Quién es?</strong> · <strong>¿Cómo se siente al ver el anuncio?</strong> · <strong>¿Qué obtenemos?</strong> Agrega tantos casos como necesites.</span>
                </div>
                <div class="bsw-cases">
                  <div v-for="(caso, idx) in casos" :key="idx" class="bsw-case-card">
                    <div class="bsw-case-card__head">
                      <span class="bsw-case-badge">Caso #{{ caso.casoNumero }}</span>
                      <input v-model="caso.nombreCaso" type="text" placeholder="Nombre del caso (opcional)..." class="bsw-input-inline" />
                      <button type="button" class="bsw-del-btn" @click="removeCaso(idx)"><i class="fa-solid fa-trash-can" /></button>
                    </div>
                    <div class="bsw-case-card__field">
                      <label><i class="fa-solid fa-user" /> ¿Quién es? (Potencial cliente)</label>
                      <textarea v-model="caso.potencialCliente" rows="2" placeholder="Hombres y mujeres, gerentes o dueños de empresas..." />
                    </div>
                    <div class="bsw-case-card__field">
                      <label><i class="fa-solid fa-face-flushed" /> ¿Cómo se siente al ver el anuncio?</label>
                      <textarea v-model="caso.efectoAnuncio" rows="2" placeholder="Se ve reflejado ante la necesidad de..." />
                    </div>
                    <div class="bsw-case-card__field">
                      <label><i class="fa-solid fa-bullseye" /> ¿Qué obtenemos? (Acción esperada)</label>
                      <textarea v-model="caso.accionEsperada" rows="2" placeholder="Se obtiene que el cliente..." />
                    </div>
                  </div>
                </div>
                <button type="button" class="bsw-btn-add" @click="addCaso">
                  <i class="fa-solid fa-plus" /> Agregar Caso de Uso
                </button>
              </div>

              <!-- STEP 6: el resumen se lee como documento, no como formulario -->
              <div v-else key="6" class="bsw-panel">
                <BrandStrategyDocument
                  :marca="marca"
                  :propuesta-valor="propuestaValor"
                  :segmentos="segmentosLimpios"
                  :canales="canalesLimpios"
                  :actividades="actividadesLimpias"
                  :casos="casosLimpios"
                  @editar="goToStep"
                />
              </div>
            </Transition>
          </div>

          <!-- Footer -->
          <footer class="bsw-footer">
            <button type="button" class="bsw-btn-ghost" :disabled="isSaving" @click="prevStep">
              <i class="fa-solid fa-arrow-left" /> {{ step === 1 ? 'Cancelar' : 'Atrás' }}
            </button>
            <span class="bsw-footer__progress">
              Paso {{ step }} de {{ STEPS.length }}
              <!-- Que sepan que nada se ha guardado todavía, antes de cerrar. -->
              <em v-if="isDirty" class="bsw-unsaved">
                <i class="fa-solid fa-circle" /> Sin guardar
              </em>
            </span>
            <button
              v-if="step < STEPS.length"
              type="button"
              class="bsw-btn-primary"
              :disabled="!canGoNext"
              @click="nextStep"
            >
              {{ step === CONFIRM_STEP - 1 ? 'Revisar' : 'Siguiente' }}
              <i class="fa-solid fa-arrow-right" />
            </button>
            <button
              v-else
              type="button"
              class="bsw-btn-primary"
              :disabled="isSaving"
              @click="finish"
            >
              <i :class="isSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle-check'" />
              {{ isSaving ? 'Guardando...' : 'Confirmar y Guardar' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.bsw-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(#0f172a, 0.68);
  backdrop-filter: blur(6px);
}

.bsw-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 42rem;
  max-height: 92vh;
  background: $white;
  border-radius: 20px;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.bsw-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(#a855f7, 0.1), rgba(#7c3aed, 0.04));
  border-bottom: 1px solid rgba($primary-dark, 0.08);
}

.bsw-header__title {
  display: flex;
  align-items: center;
  gap: 0.9rem;

  i { font-size: 1.6rem; color: #a855f7; flex-shrink: 0; }
  h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: $primary-dark; }
  p { margin: 0.2rem 0 0; font-size: 0.82rem; color: $text-secondary; }
}

.bsw-close {
  border: 0;
  background: transparent;
  color: $text-secondary;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  &:hover { color: #ef4444; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.bsw-steps {
  display: flex;
  align-items: center;
  padding: 1.1rem 1.75rem;
  border-bottom: 1px solid rgba($primary-dark, 0.06);
  overflow-x: auto;
}

.bsw-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: $text-secondary;
  flex-shrink: 0;
  width: 76px;

  &.is-active {
    color: #a855f7;
    font-weight: 800;
    .bsw-step__dot { background: #a855f7; color: $white; box-shadow: 0 0 0 4px rgba(#a855f7, 0.15); }
  }

  &.is-done {
    color: #16a34a;
    .bsw-step__dot { background: #22c55e; color: $white; }
    .bsw-step__label { color: #16a34a; }
  }
}

.bsw-step__dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba($primary-dark, 0.08);
  color: $text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.bsw-step__label {
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  transition: color 0.25s;
}

.bsw-step__line {
  flex: 1;
  height: 2px;
  min-width: 12px;
  background: rgba($primary-dark, 0.1);
  margin: 0 0.15rem;
  margin-bottom: 1.1rem;
  border-radius: 99px;
  transition: background 0.35s ease;
  &.is-done { background: #22c55e; }
}

.bsw-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.75rem;
}

.bsw-panel {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.bsw-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  background: rgba(#a855f7, 0.06);
  border: 1px solid rgba(#a855f7, 0.15);
  border-radius: 10px;
  font-size: 0.83rem;
  color: $primary-dark;
  line-height: 1.5;

  i { color: #a855f7; margin-top: 2px; flex-shrink: 0; }
  strong { color: #7c3aed; }
}

.bsw-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label { font-size: 0.88rem; font-weight: 700; color: $primary-dark; }
  textarea {
    width: 100%;
    padding: 0.85rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 12px;
    font-size: 0.92rem;
    outline: none;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;
    &:focus { border-color: #a855f7; box-shadow: 0 0 0 4px rgba(#a855f7, 0.12); }
  }
}

.bsw-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.bsw-list-item {
  padding: 1rem;
  background: rgba($primary-dark, 0.015);
  border: 1.5px solid rgba($primary-dark, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  textarea {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;
    resize: vertical;
    &:focus { border-color: #a855f7; }
  }
}

.bsw-list-item__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.bsw-list-item__num {
  font-size: 0.75rem;
  font-weight: 800;
  color: #a855f7;
  flex-shrink: 0;
}

.bsw-list-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.2rem 0;

  input {
    flex: 1;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    font-size: 0.88rem;
    outline: none;
    &:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(#a855f7, 0.1); }
  }
}

.bsw-row-icon {
  color: #a855f7;
  font-size: 0.9rem;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.bsw-input-inline {
  flex: 1;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba($primary-dark, 0.12);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  outline: none;
  &:focus { border-color: #a855f7; }
}

.bsw-del-btn {
  background: transparent;
  border: none;
  color: $text-secondary;
  cursor: pointer;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  flex-shrink: 0;
  transition: all 0.15s;
  &:hover { color: #ef4444; background: rgba(#ef4444, 0.08); }
}

.bsw-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  padding: 0.6rem 1.1rem;
  border: 1.5px dashed rgba(#a855f7, 0.35);
  border-radius: 10px;
  background: rgba(#a855f7, 0.04);
  color: #a855f7;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(#a855f7, 0.1); border-color: #a855f7; }
}

.bsw-cases {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.bsw-case-card {
  padding: 1.15rem;
  background: rgba($primary-dark, 0.015);
  border: 1.5px solid rgba($primary-dark, 0.09);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.bsw-case-card__head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.bsw-case-badge {
  background: #a855f7;
  color: $white;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  flex-shrink: 0;
  white-space: nowrap;
}

.bsw-case-card__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  label {
    font-size: 0.75rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    i { color: #a855f7; font-size: 0.7rem; }
  }

  textarea {
    padding: 0.6rem 0.8rem;
    border: 1px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    font-size: 0.84rem;
    outline: none;
    font-family: inherit;
    resize: vertical;
    &:focus { border-color: #a855f7; }
  }
}

.bsw-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.1rem 1.75rem;
  border-top: 1px solid rgba($primary-dark, 0.08);
  background: rgba($primary-dark, 0.015);
}

.bsw-footer__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: $text-secondary;
}

.bsw-unsaved {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 800;
  color: #d97706;

  i { font-size: 0.4rem; }
}

.bsw-btn-ghost, .bsw-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  border: 0;
  transition: all 0.2s;
}

.bsw-btn-ghost {
  background: transparent;
  color: $text-secondary;
  border: 1px solid rgba($primary-dark, 0.15);
  &:hover { background: rgba($primary-dark, 0.04); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.bsw-btn-primary {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: $white;
  box-shadow: 0 4px 14px rgba(#a855f7, 0.3);
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(#a855f7, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
}

/* Transitions */
.bsw-fade-enter-active, .bsw-fade-leave-active { transition: opacity 0.25s ease; .bsw-modal { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; } }
.bsw-fade-enter-from, .bsw-fade-leave-to { opacity: 0; .bsw-modal { opacity: 0; transform: scale(0.94) translateY(16px); } }

.bsw-slide-enter-active, .bsw-slide-leave-active { transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
.bsw-slide-enter-from { opacity: 0; transform: translateX(18px); }
.bsw-slide-leave-to { opacity: 0; transform: translateX(-18px); }
</style>
