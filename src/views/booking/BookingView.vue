<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import carlosPhoto from '@/assets/team/carlos.jpg'
import { bookingService, type SalesBookingEligibility } from '@/services/booking.service'

type ExpertKey = 'soporte' | 'meta' | 'ventas' | null
const selected = ref<ExpertKey>(null)
const fallbackImg = ref<Record<string, boolean>>({})
const route = useRoute()
const router = useRouter()
const salesEligibility = ref<SalesBookingEligibility | null>(null)
const salesLoading = ref(true)
const salesSubmitting = ref(false)
const salesError = ref('')
const salesFiles = ref<File[]>([])
const salesStep = ref(1)
const salesForm = ref({
  salesApproach: '',
  commonObjection: '',
  otherObjection: '',
})

const experts = [
  {
    key: 'soporte' as ExpertKey,
    name: 'Carlos Jurado',
    role: 'Especialista en Tecnología',
    photo: carlosPhoto,
    initials: 'CJ',
    color: '#3B5BDB',
    gradient: 'linear-gradient(135deg, #3B5BDB, #6C5CE7)',
    accentBg: 'rgba(59, 91, 219, 0.08)',
    accentBorder: 'rgba(59, 91, 219, 0.2)',
    shadowColor: 'rgba(59, 91, 219, 0.25)',
    topics: [
      'Soporte técnico de la plataforma',
      'CRM, reportes y metrics.bakano.ec',
      'Integraciones y herramientas',
      'Resolución de incidencias',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/aaHn06pmWuNFuF7tjDST',
    warning: 'Solo temas técnicos',
    warningDesc:
      'Si tu consulta es sobre el funcionamiento de la plataforma, CRM, reportes o integraciones, estás en el lugar correcto. Cualquier otro tema será redirigido.',
    icon: 'fa-solid fa-laptop-code',
  },
  {
    key: 'meta' as ExpertKey,
    name: 'Denisse Quimi',
    role: 'Especialista en Meta Ads',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1775356095/sorbito-de-verdad/collaborators/bakano-team-denisse.webp',
    initials: 'DQ',
    color: '#E91E8C',
    gradient: 'linear-gradient(135deg, #E91E8C, #FD79A8)',
    accentBg: 'rgba(233, 30, 140, 0.08)',
    accentBorder: 'rgba(233, 30, 140, 0.2)',
    shadowColor: 'rgba(233, 30, 140, 0.25)',
    topics: [
      'Anuncios en Facebook e Instagram',
      'Estrategia y optimización de campañas',
      'Creativos, copy y segmentación',
      'Resultados y métricas de campañas',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/GNizdekhY5SQaYTPdKPP',
    warning: 'Solo Meta Ads',
    warningDesc:
      'Si tu duda es sobre anuncios en Facebook o Instagram, estás en el lugar correcto. Otros temas serán redirigidos.',
    icon: 'fa-solid fa-chart-simple',
  },
  {
    key: 'ventas' as ExpertKey,
    name: 'Luis Reyes',
    role: 'Especialista en Ventas',
    photo: 'https://res.cloudinary.com/dpjzfua3n/image/upload/q_auto/f_auto/v1/sorbito-de-verdad/collaborators/bakano-team-luis',
    initials: 'LR',
    color: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    accentBg: 'rgba(14, 165, 233, 0.08)',
    accentBorder: 'rgba(14, 165, 233, 0.2)',
    shadowColor: 'rgba(14, 165, 233, 0.25)',
    topics: [
      'Nuevos servicios y contrataciones',
      'Facturación y planes comerciales',
      'Escalabilidad y crecimiento',
      'Propuestas y negociación',
    ],
    url: 'https://api.leadconnectorhq.com/widget/booking/nF8Yw6KCBE0R4a3B8XGy',
    warning: 'Exclusivo ventas',
    warningDesc:
      'Exclusivo para temas comerciales. Cualquier otro tema será cancelado y no podrás agendar nuevamente.',
    icon: 'fa-solid fa-handshake',
  },
]

const currentExpert = () => experts.find((e) => e.key === selected.value) ?? null

function selectExpert(key: ExpertKey) {
  if (key === 'ventas') salesStep.value = 1
  selected.value = key
}

function backToSelection() {
  selected.value = null
}

function imgError(key: string) {
  fallbackImg.value[key] = true
}

async function loadSalesEligibility() {
  salesLoading.value = true
  try {
    const eligibility = await bookingService.getSalesEligibility(String(route.params.workspaceId))
    salesEligibility.value = eligibility
  } catch (error: any) {
    salesError.value = error?.message || 'No pudimos validar los requisitos para ventas.'
  } finally {
    salesLoading.value = false
  }
}

function selectEvidence(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  const invalid = files.find((file) => !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
  if (invalid) {
    salesError.value = 'Usa PDF, JPG, PNG o WEBP de hasta 10 MB.'
    return
  }
  if (files.length > 5) {
    salesError.value = 'Puedes subir un máximo de 5 archivos.'
    return
  }
  salesError.value = ''
  salesFiles.value = files
}

function nextSalesStep() {
  if (salesStep.value === 1) {
    if (!salesForm.value.salesApproach || !salesForm.value.commonObjection || (salesForm.value.commonObjection === 'other' && !salesForm.value.otherObjection)) {
      salesError.value = 'Selecciona cómo abordas las ventas y la objeción principal.'
      return
    }
  }
  if (salesStep.value === 2 && !salesFiles.value.length) {
    salesError.value = 'Sube al menos una evidencia de una venta perdida.'
    return
  }
  salesError.value = ''
  salesStep.value += 1
}

function previousSalesStep() {
  salesError.value = ''
  salesStep.value -= 1
}

async function submitSalesRequest() {
  if (!salesFiles.value.length) {
    salesError.value = 'Sube al menos una evidencia de una venta perdida.'
    return
  }
  salesSubmitting.value = true
  salesError.value = ''
  try {
    const eligibility = await bookingService.submitSalesRequest(
      String(route.params.workspaceId),
      salesForm.value,
      salesFiles.value,
    )
    salesEligibility.value = eligibility
  } catch (error: any) {
    if (error?.status === 403) {
      await loadSalesEligibility()
      return
    }
    salesError.value = error?.message || 'No pudimos guardar la información comercial.'
  } finally {
    salesSubmitting.value = false
  }
}

function goToBilling() {
  router.push({ name: 'BillingRoas', params: { workspaceId: route.params.workspaceId } })
}

onMounted(loadSalesEligibility)
</script>

<template>
  <div class="bv">
    <!-- ════════ SELECTION SCREEN ════════ -->
    <template v-if="!selected">
      <div class="bv-hero">
        <div class="bv-hero__bg"></div>
        <div class="bv-hero__deco bv-hero__deco--1"></div>
        <div class="bv-hero__deco bv-hero__deco--2"></div>
        <div class="bv-hero__inner">
          <div class="bv-hero__badge">Agenda una reunión</div>
          <h1 class="bv-hero__title">¿Con quién necesitas hablar?</h1>
          <p class="bv-hero__desc">
            Selecciona a la persona adecuada según tu consulta. Cada reunión está diseñada para un propósito específico.
          </p>
        </div>
      </div>

      <div class="bv-cards-section">
        <div class="bv-cards">
          <button
            v-for="expert in experts"
            :key="expert.key!"
            class="bv-card"
            :class="{ 'bv-card--ventas': expert.key === 'ventas' }"
            :style="{
              '--accent': expert.color,
              '--accent-bg': expert.accentBg,
              '--accent-gradient': expert.gradient,
              '--shadow': expert.shadowColor,
            }"
            @click="selectExpert(expert.key)"
          >
            <div class="bv-card__photo-ring">
              <div class="bv-card__photo-wrap">
                <img
                  v-if="!fallbackImg[expert.key]"
                  :src="expert.photo"
                  :alt="expert.name"
                  class="bv-card__photo"
                  @error="imgError(expert.key)"
                />
                <div v-else class="bv-card__initials">{{ expert.initials }}</div>
              </div>
            </div>

            <span class="bv-card__name">{{ expert.name }}</span>
            <span class="bv-card__role">{{ expert.role }}</span>

            <i :class="expert.icon" class="bv-card__icon"></i>

            <ul class="bv-card__topics">
              <li v-for="t in expert.topics" :key="t">{{ t }}</li>
            </ul>

            <div class="bv-card__cta">
              <span>Agendar reunión</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </button>
        </div>

        <div class="bv-policy">
          <div class="bv-policy__icon">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div class="bv-policy__body">
            <strong>Política de uso:</strong> Las reuniones de ventas son exclusivas para temas comerciales. El uso indebido será registrado y perderás acceso a futuras agendas con el equipo comercial.
          </div>
        </div>
      </div>
    </template>

    <!-- ════════ SALES REQUIREMENTS SCREEN ════════ -->
    <template v-else-if="selected === 'ventas' && !salesEligibility?.eligible">
      <div class="bv-gate">
        <button class="bv-back-link" @click="backToSelection"><i class="fa-solid fa-arrow-left"></i> Volver a selección</button>
        <section class="bv-gate__card">
          <div class="bv-gate__eyebrow"><i class="fa-solid fa-shield-halved"></i> Agenda de Luis Reyes</div>
          <h1>Tu agenda de ventas está casi lista.</h1>
          <p>Antes de responder el diagnóstico, necesitamos que la facturación de este mes esté completa hasta hoy.</p>

          <div v-if="salesLoading" class="bv-gate__loading"><i class="fa-solid fa-spinner fa-spin"></i> Validando requisitos...</div>
          <template v-else>
            <div class="bv-gate__checklist">
              <div :class="{ 'is-ready': salesEligibility?.hasSalesInformation }"><i :class="salesEligibility?.hasSalesInformation ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i><span>Diagnóstico comercial y evidencia de venta perdida</span></div>
              <div :class="{ 'is-ready': salesEligibility?.isBillingUpToDate }"><i :class="salesEligibility?.isBillingUpToDate ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'"></i><span>Facturación registrada día a día hasta hoy</span></div>
            </div>

            <section v-if="!salesEligibility?.isBillingUpToDate" class="bv-billing-required">
              <div class="bv-billing-required__icon"><i class="fa-solid fa-calendar-check"></i></div>
              <div class="bv-billing-required__content">
                <span class="bv-billing-required__eyebrow">Facturación pendiente</span>
                <h2>Completa {{ salesEligibility?.missingBillingDates.length || 1 }} día{{ (salesEligibility?.missingBillingDates.length || 1) === 1 ? '' : 's' }} de este mes.</h2>
                <p>Registra la facturación pendiente día por día hasta la fecha actual. Al terminar, vuelve a esta agenda y podrás continuar.</p>
                <button type="button" @click="goToBilling"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ir a Facturación & ROAS</button>
              </div>
            </section>

            <form v-else-if="!salesEligibility?.hasSalesInformation" class="bv-sales-form" @submit.prevent="submitSalesRequest">
              <div class="bv-sales-form__progress" aria-label="Progreso del diagnóstico">
                <span v-for="step in 2" :key="step" :class="{ 'is-active': step === salesStep, 'is-complete': step < salesStep }"><i v-if="step < salesStep" class="fa-solid fa-check"></i><template v-else>{{ step }}</template></span>
              </div>
              <Transition name="bv-wizard" mode="out-in">
                <section v-if="salesStep === 1" key="approach" class="bv-sales-form__step">
                  <span class="bv-sales-form__step-label">Antes de agendar</span>
                  <h2>Identifiquemos tu conversación comercial.</h2>
                  <fieldset><legend>¿Cómo abordas al cliente? *</legend><label v-for="option in [{ value: 'spin', text: 'Método SPIN' }, { value: 'automatic_paragraph', text: 'Le envío un párrafo automático' }, { value: 'direct_service', text: 'Hablo directamente de mi servicio' }, { value: 'catalog', text: 'Envío catálogo' }]" :key="option.value" class="bv-sales-form__choice"><input v-model="salesForm.salesApproach" type="radio" :value="option.value" /> {{ option.text }}</label></fieldset>
                  <fieldset><legend>¿Cuál es la objeción más común? *</legend><label v-for="option in [{ value: 'price_no_response', text: 'No responden después del precio' }, { value: 'think_about_it', text: 'Lo voy a pensar / para otro día' }, { value: 'out_of_budget', text: 'Está fuera de mi presupuesto' }, { value: 'curiosity', text: 'Solo preguntan por curiosidad' }, { value: 'other', text: 'Otra' }]" :key="option.value" class="bv-sales-form__choice"><input v-model="salesForm.commonObjection" type="radio" :value="option.value" /> {{ option.text }}</label><input v-if="salesForm.commonObjection === 'other'" v-model.trim="salesForm.otherObjection" placeholder="Describe la objeción" /></fieldset>
                </section>
                <section v-else key="evidence" class="bv-sales-form__step">
                  <span class="bv-sales-form__step-label">Último paso</span>
                  <h2>Sube una conversación que no se cerró.</h2>
                  <p>Nos permitirá llegar preparados con recomendaciones reales.</p>
                  <label class="bv-sales-form__upload">Evidencia de venta perdida *<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple @change="selectEvidence" /><span><i class="fa-solid fa-cloud-arrow-up"></i> {{ salesFiles.length ? `${salesFiles.length} archivo(s) seleccionado(s)` : 'PDF o imagen, hasta 5 archivos de 10 MB' }}</span></label>
                </section>
              </Transition>
              <p v-if="salesError" class="bv-sales-form__error">{{ salesError }}</p>
              <div class="bv-sales-form__actions">
                <button v-if="salesStep > 1" class="bv-sales-form__back" type="button" @click="previousSalesStep">Atrás</button>
                <button v-if="salesStep < 2" class="bv-sales-form__submit" type="button" @click="nextSalesStep">Continuar <i class="fa-solid fa-arrow-right"></i></button>
                <button v-else class="bv-sales-form__submit" :disabled="salesSubmitting" type="submit"><i :class="salesSubmitting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i> {{ salesSubmitting ? 'Guardando...' : 'Continuar a Facturación' }}</button>
              </div>
            </form>

            <div v-else class="bv-gate__billing"><i class="fa-solid fa-spinner fa-spin"></i><div><strong>Actualizando tu agenda.</strong><span>Tu información comercial ya fue registrada.</span></div></div>
          </template>
        </section>
      </div>
    </template>

    <!-- ════════ CALENDAR SCREEN ════════ -->
    <template v-else>
      <div class="bv-calendar-page">
        <div class="bv-sidebar-cal">
          <button class="bv-back-link" @click="backToSelection">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Volver a selección</span>
          </button>

          <div class="bv-sidebar-cal__card">
            <div class="bv-sidebar-cal__photo-wrap">
              <img
                v-if="!fallbackImg[selected]"
                :src="currentExpert()?.photo"
                :alt="currentExpert()?.name"
                class="bv-sidebar-cal__photo"
                @error="imgError(selected)"
              />
              <div
                v-else
                class="bv-sidebar-cal__initials"
                :style="{ background: currentExpert()?.color }"
              >
                {{ currentExpert()?.initials }}
              </div>
            </div>

            <h3 class="bv-sidebar-cal__name">{{ currentExpert()?.name }}</h3>
            <span class="bv-sidebar-cal__role" :style="{ color: currentExpert()?.color }">{{
              currentExpert()?.role
            }}</span>

            <div
              class="bv-sidebar-cal__badge"
              :style="{
                '--badge-color': currentExpert()?.color,
                '--badge-bg': currentExpert()?.accentBg,
                '--badge-border': currentExpert()?.accentBorder,
              }"
            >
              <i class="fa-solid fa-circle-info"></i>
              {{ currentExpert()?.warning }}
            </div>

            <div class="bv-sidebar-cal__desc">{{ currentExpert()?.warningDesc }}</div>

            <div class="bv-sidebar-cal__topics-label">Temas que se tratarán:</div>
            <ul class="bv-sidebar-cal__topics">
              <li v-for="t in currentExpert()?.topics" :key="t!">
                <i
                  class="fa-solid fa-circle-check"
                  :style="{ color: currentExpert()?.color }"
                ></i>
                {{ t }}
              </li>
            </ul>
          </div>
        </div>

        <div class="bv-calendar-main">
          <iframe
            :src="currentExpert()?.url"
            class="bv-calendar-main__iframe"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.bv {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

// ═══════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════
.bv-hero {
  position: relative;
  overflow: hidden;
  padding: 3rem 2rem 2.5rem;
  text-align: center;

  &__bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba($primary, 0.04) 0%, transparent 100%);
    z-index: 0;
  }

  &__deco {
    position: absolute;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;

    &--1 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba($primary, 0.06) 0%, transparent 70%);
      top: -100px;
      right: -80px;
    }

    &--2 {
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba($primary, 0.04) 0%, transparent 70%);
      bottom: -60px;
      left: -60px;
    }
  }

  &__inner {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: 0 auto;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: $primary;
    background: rgba($primary, 0.08);
    border: 1px solid rgba($primary, 0.15);
    padding: 0.3rem 0.85rem;
    border-radius: 100px;
    margin-bottom: 1.25rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 800;
    color: $primary-dark;
    line-height: 1.2;
    margin: 0 0 0.75rem;
    letter-spacing: -0.02em;
  }

  &__desc {
    font-size: 0.95rem;
    color: $text-secondary;
    line-height: 1.6;
    margin: 0;
    max-width: 480px;
    margin: 0 auto;
  }
}

// ═══════════════════════════════════════════════════════════════
// CARDS SECTION
// ═══════════════════════════════════════════════════════════════
.bv-cards-section {
  padding: 0 2rem 3.5rem;
  flex: 1;
}

.bv-cards {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 1.75rem;
  max-width: 1160px;
  margin: 0 auto 2rem;
}

.bv-card {
  --accent: #999;
  --accent-bg: rgba(153, 153, 153, 0.06);
  --accent-gradient: linear-gradient(135deg, #999, #bbb);
  --shadow: rgba(0, 0, 0, 0.08);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  padding: 2.25rem 1.5rem 1.5rem;
  border-radius: 20px;
  background: $white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  font-family: inherit;
  font-size: inherit;
  overflow: hidden;
  flex: 1 1 290px;
  max-width: 360px;
  min-height: 410px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    padding: 2px;
    background: var(--accent-gradient);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px var(--shadow);
    border-color: transparent;

    &::before {
      opacity: 1;
    }

    .bv-card__cta {
      background: var(--accent-gradient);
      box-shadow: 0 6px 20px var(--shadow);
    }

    .bv-card__photo-ring {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--accent-bg), 0 8px 24px var(--shadow);
    }
  }

  &--ventas::after {
    content: 'Exclusivo';
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 0.5rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: $alert-error;
    background: rgba($alert-error, 0.08);
    border: 1px solid rgba($alert-error, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 100px;
  }

  &__photo-ring {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  &__photo-wrap {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  &__initials {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1.6rem;
    background: linear-gradient(135deg, #3b3b3b, #666);
  }

  &__name {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0d0d0d;
    margin-top: 0.25rem;
  }

  &__role {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  &__icon {
    font-size: 1.5rem;
    color: var(--accent);
  }

  &__topics {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    text-align: left;

    li {
      position: relative;
      font-size: 0.78rem;
      color: #555;
      padding-left: 1rem;
      line-height: 1.4;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.5em;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--accent);
      }
    }
  }

  &__cta {
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.04);
    color: #333;
    font-size: 0.82rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    margin-top: auto;

    i {
      font-size: 0.75rem;
      transition: transform 0.3s ease;
    }
  }

  &:hover .bv-card__cta i {
    transform: translateX(3px);
  }
}

// ═══════════════════════════════════════════════════════════════
// POLICY
// ═══════════════════════════════════════════════════════════════
.bv-policy {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.25rem;
  background: $white;
  border: 1px solid rgba($alert-error, 0.12);
  border-radius: 14px;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba($alert-error, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 0.9rem;
      color: $alert-error;
    }
  }

  &__body {
    font-size: 0.78rem;
    color: #666;
    line-height: 1.6;

    strong {
      color: #444;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR SPLIT VIEW
// ═══════════════════════════════════════════════════════════════
.bv-calendar-page {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 60px);
  background: #f8f7f5;

  @media (max-width: 820px) {
    flex-direction: column;
  }
}

.bv-sidebar-cal {
  width: 320px;
  flex-shrink: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: $white;
  border-right: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 820px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.65rem;
    padding: 1.5rem 1rem;
    border-radius: 16px;
    background: #fafafa;
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  &__photo-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid $white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  &__initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 1.3rem;
  }

  &__name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0d0d0d;
    margin: 0;
  }

  &__role {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  &__badge {
    --badge-color: #999;
    --badge-bg: rgba(153, 153, 153, 0.08);
    --badge-border: rgba(153, 153, 153, 0.2);

    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--badge-color);
    background: var(--badge-bg);
    border: 1px solid var(--badge-border);
    padding: 0.3rem 0.7rem;
    border-radius: 100px;
  }

  &__desc {
    font-size: 0.78rem;
    color: #777;
    line-height: 1.5;
    max-width: 260px;
  }

  &__topics-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.25rem;
  }

  &__topics {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;

    li {
      font-size: 0.78rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 0.45rem;

      i {
        font-size: 0.75rem;
        flex-shrink: 0;
      }
    }
  }
}

.bv-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  padding: 0.3rem 0;
  font-family: inherit;
  align-self: flex-start;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
}

.bv-calendar-main {
  flex: 1;
  display: flex;
  padding: 1.5rem;

  &__iframe {
    flex: 1;
    width: 100%;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    background: $white;
    min-height: 500px;
  }
}

.bv-gate {
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2.5rem) 1.25rem;

  &__card {
    position: relative;
    overflow: hidden;
    margin-top: 1rem;
    padding: clamp(1.35rem, 4vw, 2.75rem);
    border: 1px solid rgba($primary, 0.16);
    border-radius: 28px;
    background: linear-gradient(135deg, $white 0%, #fff9fb 100%);
    box-shadow: 0 24px 60px rgba($primary-dark, 0.1);

    &::after { content: ''; position: absolute; top: 0; right: 0; width: 34%; height: 5px; background: linear-gradient(90deg, $secondary, $primary); }

    h1 { max-width: 660px; margin: 0.9rem 0 0.55rem; color: $primary-dark; font-size: clamp(1.65rem, 4.2vw, 2.55rem); line-height: 1.08; letter-spacing: -0.035em; }
    > p { max-width: 650px; margin: 0; color: $text-secondary; font-size: 1rem; line-height: 1.65; }
  }

  &__eyebrow {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    padding: 0.42rem 0.7rem;
    border-radius: 100px;
    color: $primary;
    background: rgba($primary, 0.09);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__loading { padding: 2rem 0; text-align: center; color: $text-secondary; }

  &__checklist {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.75rem 0;
    > div { flex: 1 1 280px; display: flex; gap: 0.7rem; align-items: center; padding: 0.85rem 1rem; border-radius: 14px; border: 1px solid rgba($primary-dark, 0.07); background: rgba($primary-dark, 0.03); color: $text-secondary; font-size: 0.82rem; font-weight: 600; }
    i { color: rgba($secondary, 0.65); }
    .is-ready { color: #16714b; border-color: rgba($BAKANO-GREEN, 0.22); background: rgba($BAKANO-GREEN, 0.09); i { color: $BAKANO-GREEN; } }
  }

  &__billing {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
    align-items: center;
    padding: 1rem;
    border-radius: 16px;
    background: rgba(#f59e0b, 0.1);
    color: #78350f;
    > i { font-size: 1.3rem; flex: 0 0 auto; }
    > div { flex: 1 1 220px; }
    strong, span { display: block; }
    span { margin-top: 0.15rem; font-size: 0.8rem; line-height: 1.4; }
    button { margin-left: auto; width: max-content; border: 0; border-radius: 10px; padding: 0.65rem 0.8rem; background: #b45309; color: $white; font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
  }
}

.bv-sales-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  label, fieldset { display: flex; flex-direction: column; gap: 0.55rem; color: $primary-dark; font-size: 0.86rem; font-weight: 700; }
  input { width: 100%; box-sizing: border-box; padding: 0.72rem 0.8rem; border: 1px solid rgba($primary-dark, 0.15); border-radius: 10px; color: $primary-dark; background: $white; font: inherit; font-size: 0.88rem; }
  fieldset { padding: 0; border: 0; }
  legend { margin-bottom: 0.15rem; font-size: 0.96rem; }
  fieldset label { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 0.7rem; color: $text-secondary; font-weight: 600; }
  input[type='radio'] { width: 1.05rem; height: 1.05rem; flex: 0 0 auto; margin: 0; padding: 0; accent-color: $primary; }

  &__row { display: flex; flex-direction: column; gap: 1rem; }
  &__row > label { flex: 1 1 0; }
  &__progress { display: flex; align-items: center; gap: 0.5rem; }
  &__progress span { position: relative; width: 1.9rem; height: 1.9rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba($secondary, 0.12); color: $secondary; font-size: 0.75rem; font-weight: 800; transition: 0.25s ease; }
  &__progress span:not(:last-child) { margin-right: clamp(2.5rem, 12vw, 6rem); }
  &__progress span:not(:last-child)::after { content: ''; position: absolute; top: calc(50% - 1px); left: calc(100% + 0.25rem); width: clamp(2rem, 11vw, 5.5rem); height: 2px; background: rgba($secondary, 0.18); }
  &__progress .is-active, &__progress .is-complete { background: $primary; color: $white; box-shadow: 0 5px 12px rgba($primary, 0.26); }
  &__progress .is-complete::after { background: rgba($primary, 0.45); }
  &__step { display: flex; flex-direction: column; gap: 1.1rem; min-height: 0; padding: clamp(1.1rem, 3vw, 1.75rem); border: 1px solid rgba($primary, 0.12); border-radius: 20px; background: $white; box-shadow: inset 0 1px 0 rgba($white, 0.7); }
  &__step h2 { margin: 0; color: $primary-dark; font-size: clamp(1.35rem, 3.5vw, 1.75rem); line-height: 1.16; letter-spacing: -0.025em; }
  &__step p { margin: -0.35rem 0 0.3rem; color: $text-secondary; font-size: 0.86rem; line-height: 1.5; }
  &__step-label { color: $primary; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  &__choice { min-height: 2.9rem; box-sizing: border-box; padding: 0.85rem 1rem; border: 1px solid rgba($primary-dark, 0.1); border-radius: 12px; background: #fffcfd; transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  &__choice:hover { transform: translateX(3px); border-color: rgba($primary, 0.45); background: rgba($primary, 0.035); }
  &__choice:has(input:checked) { border-color: $primary; background: rgba($primary, 0.065); color: $primary-dark; box-shadow: 0 6px 16px rgba($primary, 0.1); }
  &__upload { cursor: pointer; padding: 1rem; border: 1.5px dashed rgba($primary, 0.35); border-radius: 12px; background: rgba($primary, 0.03); text-align: center; }
  &__upload input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  &__upload span { color: $primary; font-size: 0.78rem; }
  &__error { margin: 0; color: $alert-error; font-size: 0.8rem; }
  &__actions { display: flex; justify-content: space-between; gap: 0.75rem; padding-top: 0.15rem; }
  &__back { border: 1px solid rgba($primary-dark, 0.15); border-radius: 12px; padding: 0.9rem 1rem; color: $text-secondary; background: $white; font: inherit; font-size: 0.86rem; font-weight: 700; cursor: pointer; }
  &__submit { border: 0; border-radius: 12px; padding: 0.95rem 1.2rem; background: linear-gradient(135deg, $primary, lighten($primary, 8%)); color: $white; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; box-shadow: 0 10px 22px rgba($primary, 0.25); transition: transform 0.2s, box-shadow 0.2s; &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 28px rgba($primary, 0.3); } &:disabled { opacity: 0.65; cursor: wait; } }

  @media (min-width: 640px) { &__row { flex-direction: row; } }
}

.bv-billing-required {
  display: flex;
  align-items: flex-start;
  gap: clamp(1rem, 3vw, 1.5rem);
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid rgba($primary, 0.18);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba($primary, 0.06), rgba($secondary, 0.06));

  &__icon {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 14px;
    color: $white;
    background: linear-gradient(135deg, $primary, $secondary);
    box-shadow: 0 10px 22px rgba($primary, 0.22);
  }

  &__content { flex: 1; }
  &__eyebrow { display: block; margin-bottom: 0.35rem; color: $primary; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
  h2 { margin: 0; color: $primary-dark; font-size: clamp(1.2rem, 3vw, 1.5rem); letter-spacing: -0.02em; }
  p { max-width: 580px; margin: 0.55rem 0 1.25rem; color: $text-secondary; font-size: 0.9rem; line-height: 1.6; }
  button { display: inline-flex; align-items: center; gap: 0.5rem; border: 0; border-radius: 12px; padding: 0.9rem 1rem; color: $white; background: $primary; box-shadow: 0 10px 20px rgba($primary, 0.22); font: inherit; font-size: 0.86rem; font-weight: 800; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 14px 26px rgba($primary, 0.3); } }
}

.bv-wizard-enter-active,
.bv-wizard-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.bv-wizard-enter-from { opacity: 0; transform: translateX(18px); }
.bv-wizard-leave-to { opacity: 0; transform: translateX(-18px); }

@media (max-width: 500px) {
  .bv-hero { padding: 2.25rem 1.25rem 2rem; }
  .bv-cards-section { padding: 0 1rem 2.5rem; }
  .bv-cards { gap: 1rem; }
  .bv-card { min-height: 0; max-width: none; padding: 1.75rem 1.25rem 1.25rem; }
  .bv-gate { padding: 1rem; }
  .bv-gate__card { border-radius: 18px; }
  .bv-gate__billing button { width: 100%; margin-left: 0; }
  .bv-gate__checklist { flex-direction: column; }
  .bv-billing-required { flex-direction: column; }
  .bv-sales-form__step { padding: 1.1rem; }
  .bv-sales-form__actions .bv-sales-form__submit { flex: 1; }
}
</style>
