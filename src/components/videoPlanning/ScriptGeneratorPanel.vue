<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile } from '@/types'
import type { VideoItem, GuionIA, TipoGuion } from '@/types/videoPlanning'

const router = useRouter()

const props = defineProps<{
  item: VideoItem | null
  workspaceId: string
  tema?: string
  tipo?: string
  hasBrandProfile: boolean
  brandProfile?: BrandProfile | null
}>()

const emit = defineEmits<{
  (e: 'script-generated', guionIA: GuionIA): void
  (e: 'brand-profile-updated', profile: BrandProfile): void
}>()

const generating = ref(false)
const error = ref<string | null>(null)

// ── LLM availability ──────────────────────────────────────────
const llmStatus = ref<{ available: boolean; model: string; error?: string } | null>(null)
const llmChecking = ref(true)

onMounted(async () => {
  try {
    llmStatus.value = await brandProfileService.getLLMStatus()
  } catch {
    llmStatus.value = { available: false, model: '', error: 'No se pudo verificar disponibilidad de IA' }
  } finally {
    llmChecking.value = false
  }
})

// ── Inline brand profile editor ──────────────────────────────
const showBpEditor = ref(false)
const bpSaving = ref(false)
const bpError = ref<string | null>(null)
const bpForm = ref({
  descripcion: props.brandProfile?.descripcion || '',
  tipoNegocio: props.brandProfile?.tipoNegocio || '' as 'SERVICIOS' | 'PRODUCTOS' | '',
  vertical: props.brandProfile?.vertical || '',
  publicoObjetivo: props.brandProfile?.publicoObjetivo || '',
  propuestaValor: props.brandProfile?.propuestaValor || '',
  tono: props.brandProfile?.tono || '',
  productosServicios: props.brandProfile?.productosServicios || '',
  trafficDirection: props.brandProfile?.trafficDirection || '' as 'WHATSAPP' | 'GHL' | '',
  trafficLink: props.brandProfile?.trafficLink || '',
})

// Sync form when brandProfile prop changes
watch(() => props.brandProfile, (bp) => {
  if (!bp) return
  bpForm.value = {
    descripcion: bp.descripcion || '',
    tipoNegocio: bp.tipoNegocio || '',
    vertical: bp.vertical || '',
    publicoObjetivo: bp.publicoObjetivo || '',
    propuestaValor: bp.propuestaValor || '',
    tono: bp.tono || '',
    productosServicios: bp.productosServicios || '',
    trafficDirection: bp.trafficDirection || '',
    trafficLink: bp.trafficLink || '',
  }
}, { immediate: false })

async function saveBrandProfile() {
  bpSaving.value = true
  bpError.value = null
  try {
    const saved = await brandProfileService.upsert(props.workspaceId, {
      descripcion: bpForm.value.descripcion,
      tipoNegocio: bpForm.value.tipoNegocio || undefined,
      vertical: bpForm.value.vertical,
      publicoObjetivo: bpForm.value.publicoObjetivo,
      propuestaValor: bpForm.value.propuestaValor,
      tono: bpForm.value.tono,
      productosServicios: bpForm.value.productosServicios,
      trafficDirection: bpForm.value.trafficDirection || undefined,
      trafficLink: bpForm.value.trafficLink,
    })
    showBpEditor.value = false
    emit('brand-profile-updated', saved)
  } catch {
    bpError.value = 'Error al guardar el perfil. Intenta de nuevo.'
  } finally {
    bpSaving.value = false
  }
}

const contextoMes = ref({
  productoMes: '',
  ofertaEspecial: '',
  referenciasAdicionales: '',
})

const localGuionIA = ref<GuionIA | null>(props.item?.guionIA || null)

// Staggered field reveal: when a new script is generated, fields appear one by one
const visibleFieldCount = ref(0)
const FIELD_KEYS: (keyof GuionIA)[] = ['conceptoVisual', 'gancho', 'textoPantalla', 'cuerpo', 'cta', 'broll']

watch(localGuionIA, (val) => {
  if (!val?.gancho) return
  visibleFieldCount.value = 0
  let i = 0
  const reveal = () => {
    if (i < FIELD_KEYS.length) {
      visibleFieldCount.value = i + 1
      i++
      setTimeout(reveal, 220)
    }
  }
  setTimeout(reveal, 100)
})

// On mount, if script already exists show all fields immediately
if (props.item?.guionIA?.gancho) {
  visibleFieldCount.value = FIELD_KEYS.length
}

const TIPO_GUION_INFO: Record<TipoGuion, { label: string; color: string; icon: string; desc: string }> = {
  TOFU: {
    label: 'Educativo',
    color: '#3b82f6',
    icon: 'fa-solid fa-lightbulb',
    desc: 'Top of Funnel — alcance y viralidad. Ganchos agresivos, derribo de mitos, educación rápida. Objetivo: que te conozcan.',
  },
  MOFU: {
    label: 'Creación de Valor',
    color: '#8b5cf6',
    icon: 'fa-solid fa-heart-pulse',
    desc: 'Middle of Funnel — confianza. Ayuda al usuario a identificar que tiene un problema y que tú eres el experto que sabe resolverlo.',
  },
  BOFU: {
    label: 'Venta',
    color: '#ef4444',
    icon: 'fa-solid fa-fire',
    desc: 'Bottom of Funnel — venta directa. CTA claros hacia WhatsApp o agenda. Basado en la oferta especial del mes.',
  },
}

const tipoInfo = computed(() => {
  if (!props.item?.tipoGuion) return null
  return TIPO_GUION_INFO[props.item.tipoGuion]
})

const hasExistingScript = computed(() => !!localGuionIA.value?.gancho)
const canGenerate = computed(() => props.hasBrandProfile && !!llmStatus.value?.available && !llmChecking.value)

const bpSummary = computed(() => {
  const bp = props.brandProfile
  if (!bp) return null
  const chips: string[] = []
  if (bp.tipoNegocio) chips.push(bp.tipoNegocio)
  if (bp.vertical) chips.push(bp.vertical)
  if (bp.trafficDirection) chips.push(bp.trafficDirection)
  const archivos = (bp as any).archivos?.length ?? 0
  return {
    descripcion: bp.descripcion,
    chips,
    archivos,
  }
})

async function generate() {
  if (!canGenerate.value) return
  generating.value = true
  error.value = null
  try {
    const ctx = {
      productoMes: contextoMes.value.productoMes || undefined,
      ofertaEspecial: contextoMes.value.ofertaEspecial || undefined,
      referenciasAdicionales: contextoMes.value.referenciasAdicionales || undefined,
    }
    let res
    if (props.item?._id) {
      // Edit mode: save result to the existing item
      res = await brandProfileService.generateScript(props.item._id, ctx)
    } else {
      // Create mode: quick generation, no item ID needed
      const temaTopic = props.tema || ''
      if (!temaTopic.trim()) {
        error.value = 'Escribe el tema del video antes de generar el guión.'
        generating.value = false
        return
      }
      res = await brandProfileService.generateScriptQuick(props.workspaceId, temaTopic, props.tipo, ctx)
    }
    localGuionIA.value = res.guionIA
    emit('script-generated', res.guionIA)
  } catch (err: unknown) {
    const e = err as { message?: string }
    error.value = e?.message || 'Error al generar el guión. Intenta de nuevo.'
  } finally {
    generating.value = false
  }
}

function isFieldVisible(index: number) {
  return visibleFieldCount.value > index
}
</script>

<template>
  <div class="sgp">

    <!-- ── Section header (no toggle) ────────────────────────── -->
    <div class="sgp__header">
      <div class="sgp__header-left">
        <i class="fa-solid fa-wand-magic-sparkles sgp__toggle-icon" />
        <span class="sgp__toggle-title">Guión IA</span>
        <span
          v-if="item?.tipoGuion && tipoInfo"
          class="sgp__tipo-badge"
          :style="{ background: tipoInfo.color + '18', color: tipoInfo.color, borderColor: tipoInfo.color + '30' }"
        >
          <i :class="tipoInfo.icon" /> {{ tipoInfo.label }}
        </span>
      </div>
      <span v-if="hasExistingScript" class="sgp__has-script">
        <i class="fa-solid fa-circle-check" /> Guión generado
      </span>
    </div>

    <div class="sgp__body">

      <!-- ── No brand profile warning ───────────────────────── -->
      <div v-if="!hasBrandProfile && !showBpEditor" class="sgp__no-profile">
        <i class="fa-solid fa-circle-exclamation" />
        <div>
          <strong>Perfil de marca no configurado</strong>
          <p>Completa el perfil para que la IA genere guiones personalizados.</p>
          <div class="sgp__profile-actions">
            <button class="sgp__profile-btn" type="button" @click="showBpEditor = true">
              <i class="fa-solid fa-pen-to-square" /> Configurar aquí
            </button>
            <button class="sgp__profile-btn sgp__profile-btn--ghost" type="button"
              @click="router.push({ name: 'WorkspaceBrandProfile', params: { workspaceId } })">
              <i class="fa-solid fa-arrow-up-right-from-square" /> Ir a la página
            </button>
          </div>
        </div>
      </div>

      <!-- ── Inline BP editor ───────────────────────────────── -->
      <div v-if="showBpEditor" class="sgp__bp-editor">
        <div class="sgp__bp-editor-header">
          <i class="fa-solid fa-palette" />
          <span>{{ hasBrandProfile ? 'Editar perfil de marca' : 'Configurar perfil de marca' }}</span>
          <button type="button" class="sgp__bp-editor-close" @click="showBpEditor = false">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
        <div class="sgp__bp-field">
          <label>Descripción del negocio <span class="sgp__bp-req">requerido</span></label>
          <textarea v-model="bpForm.descripcion" rows="3" placeholder="Ej: Restaurante de comida saludable en Guayaquil..." />
        </div>
        <div class="sgp__bp-row">
          <div class="sgp__bp-field">
            <label>Tipo de negocio</label>
            <div class="sgp__bp-toggle-group">
              <button :class="['sgp__bp-toggle', { 'is-active': bpForm.tipoNegocio === 'PRODUCTOS' }]" type="button" @click="bpForm.tipoNegocio = 'PRODUCTOS'"><i class="fa-solid fa-box" /> Productos</button>
              <button :class="['sgp__bp-toggle', { 'is-active': bpForm.tipoNegocio === 'SERVICIOS' }]" type="button" @click="bpForm.tipoNegocio = 'SERVICIOS'"><i class="fa-solid fa-handshake" /> Servicios</button>
            </div>
          </div>
          <div class="sgp__bp-field">
            <label>Vertical / Industria</label>
            <input v-model="bpForm.vertical" type="text" placeholder="Ej: Restaurante, Clínica..." />
          </div>
        </div>
        <div class="sgp__bp-row">
          <div class="sgp__bp-field">
            <label>Público objetivo</label>
            <textarea v-model="bpForm.publicoObjetivo" rows="2" placeholder="Ej: Mujeres 28-45 años..." />
          </div>
          <div class="sgp__bp-field">
            <label>Propuesta de valor</label>
            <textarea v-model="bpForm.propuestaValor" rows="2" placeholder="Ej: Lo que los hace únicos..." />
          </div>
        </div>
        <div class="sgp__bp-field">
          <label>Productos / Servicios principales</label>
          <textarea v-model="bpForm.productosServicios" rows="2" placeholder="Ej: Plan mensual $120, Bowl $8.50..." />
        </div>
        <div class="sgp__bp-row">
          <div class="sgp__bp-field">
            <label>Tono</label>
            <div class="sgp__bp-tone">
              <button v-for="t in ['Profesional','Cercano','Divertido','Aspiracional','Educativo','Inspirador']" :key="t" :class="['sgp__bp-tone-btn', { 'is-active': bpForm.tono === t }]" type="button" @click="bpForm.tono = bpForm.tono === t ? '' : t">{{ t }}</button>
            </div>
          </div>
          <div class="sgp__bp-field">
            <label>Tráfico</label>
            <div class="sgp__bp-toggle-group">
              <button :class="['sgp__bp-toggle', { 'is-active': bpForm.trafficDirection === 'WHATSAPP' }]" type="button" @click="bpForm.trafficDirection = 'WHATSAPP'"><i class="fa-brands fa-whatsapp" /> WhatsApp</button>
              <button :class="['sgp__bp-toggle', { 'is-active': bpForm.trafficDirection === 'GHL' }]" type="button" @click="bpForm.trafficDirection = 'GHL'"><i class="fa-solid fa-calendar-check" /> GHL</button>
            </div>
          </div>
        </div>
        <div v-if="bpError" class="sgp__error"><i class="fa-solid fa-triangle-exclamation" /> {{ bpError }}</div>
        <div class="sgp__bp-actions">
          <button type="button" class="sgp__ctx-btn" @click="showBpEditor = false">Cancelar</button>
          <button type="button" class="sgp__generate-btn" :disabled="bpSaving" @click="saveBrandProfile">
            <i :class="bpSaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
            {{ bpSaving ? 'Guardando...' : 'Guardar perfil' }}
          </button>
        </div>
      </div>

      <template v-else>

        <!-- ── Brand profile summary bar ──────────────────── -->
        <div v-if="hasBrandProfile && bpSummary" class="sgp__bp-bar">
          <div class="sgp__bp-bar-chips">
            <span v-for="chip in bpSummary.chips" :key="chip" class="sgp__meta-chip">{{ chip }}</span>
            <span v-if="bpSummary.archivos > 0" class="sgp__meta-chip sgp__meta-chip--file">
              <i class="fa-solid fa-paperclip" /> {{ bpSummary.archivos }} archivo{{ bpSummary.archivos > 1 ? 's' : '' }}
            </span>
          </div>
          <button class="sgp__edit-bp-btn" type="button" @click="showBpEditor = true">
            <i class="fa-solid fa-pen" /> Editar perfil
          </button>
        </div>

        <!-- ── TOFU/MOFU/BOFU banner ──────────────────────── -->
        <div v-if="item?.tipoGuion && tipoInfo" class="sgp__tipo-banner" :style="{ borderColor: tipoInfo.color + '30', background: tipoInfo.color + '08' }">
          <i :class="tipoInfo.icon" :style="{ color: tipoInfo.color }" />
          <div>
            <strong :style="{ color: tipoInfo.color }">{{ tipoInfo.label }} ({{ item.tipoGuion }})</strong>
            <p>{{ tipoInfo.desc }}</p>
          </div>
        </div>

        <!-- ── STEP 1: Context + Generate ────────────────── -->
        <div class="sgp__generate-area">
          <p class="sgp__ctx-label">
            <i class="fa-solid fa-calendar-day" />
            Contexto del mes <em>(opcional — mejora el resultado)</em>
          </p>
          <div class="sgp__ctx-grid">
            <div class="sgp__ctx-field">
              <label>Producto o servicio a destacar</label>
              <input v-model="contextoMes.productoMes" type="text" placeholder="Ej: Plan mensual, Catering empresarial..." />
            </div>
            <div class="sgp__ctx-field">
              <label>Oferta especial</label>
              <input v-model="contextoMes.ofertaEspecial" type="text" placeholder="Ej: 20% off en planes anuales..." />
            </div>
          </div>
          <div class="sgp__ctx-field">
            <label>Referencias adicionales</label>
            <textarea v-model="contextoMes.referenciasAdicionales" rows="2" placeholder="Evento próximo, temporada, tono especial, referencias de videos..." />
          </div>

          <div v-if="error" class="sgp__error">
            <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
          </div>

          <div class="sgp__actions">
            <div class="sgp__llm-status" :class="llmChecking ? 'is-checking' : llmStatus?.available ? 'is-ok' : 'is-down'">
              <template v-if="llmChecking">
                <i class="fa-solid fa-spinner fa-spin" /><span>Verificando IA...</span>
              </template>
              <template v-else-if="llmStatus?.available">
                <i class="fa-solid fa-circle-check" /><span>IA lista</span>
              </template>
              <template v-else>
                <i class="fa-solid fa-triangle-exclamation" /><span>IA no disponible</span>
              </template>
            </div>
            <button
              class="sgp__generate-btn"
              :class="{ 'is-loading': generating }"
              :disabled="generating || !canGenerate"
              type="button"
              @click="generate"
            >
              <i :class="generating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'" />
              {{ generating ? 'Generando...' : hasExistingScript ? 'Regenerar guión' : 'Generar guión con IA' }}
            </button>
          </div>
        </div>

        <!-- ── STEP 2: Generated result ───────────────────── -->
        <div v-if="hasExistingScript && localGuionIA" class="sgp__result">
          <div class="sgp__result-header">
            <i class="fa-solid fa-sparkles" />
            <span>Resultado generado</span>
            <span v-if="localGuionIA.generadoEn" class="sgp__generated-at">
              {{ new Date(localGuionIA.generadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>

          <div class="sgp__fields">
            <Transition name="sgp-field">
              <div v-if="isFieldVisible(0)" class="sgp__field">
                <div class="sgp__field-header"><i class="fa-solid fa-clapperboard" /><span>Concepto Visual / Dirección de Arte</span></div>
                <div class="sgp__field-content">{{ localGuionIA.conceptoVisual }}</div>
              </div>
            </Transition>

            <Transition name="sgp-field">
              <div v-if="isFieldVisible(1)" class="sgp__field-row">
                <div class="sgp__field sgp__field--highlight">
                  <div class="sgp__field-header"><i class="fa-solid fa-bolt" /><span>Gancho (0-3 seg)</span><span class="sgp__field-chip">Voz</span></div>
                  <div class="sgp__field-content sgp__field-content--bold">{{ localGuionIA.gancho }}</div>
                </div>
                <div class="sgp__field">
                  <div class="sgp__field-header"><i class="fa-solid fa-mobile-screen-button" /><span>Texto en pantalla</span><span class="sgp__field-chip">Overlay</span></div>
                  <div class="sgp__field-content">{{ localGuionIA.textoPantalla }}</div>
                </div>
              </div>
            </Transition>

            <Transition name="sgp-field">
              <div v-if="isFieldVisible(3)" class="sgp__field">
                <div class="sgp__field-header"><i class="fa-solid fa-scroll" /><span>Cuerpo del video (3-45 seg)</span></div>
                <div class="sgp__field-content sgp__field-content--script">{{ localGuionIA.cuerpo }}</div>
              </div>
            </Transition>

            <Transition name="sgp-field">
              <div v-if="isFieldVisible(4)" class="sgp__field-row">
                <div class="sgp__field sgp__field--cta">
                  <div class="sgp__field-header"><i class="fa-solid fa-megaphone" /><span>CTA (Llamado a acción)</span></div>
                  <div class="sgp__field-content sgp__field-content--bold">{{ localGuionIA.cta }}</div>
                </div>
                <div class="sgp__field">
                  <div class="sgp__field-header"><i class="fa-solid fa-film" /><span>B-Roll / Apoyo visual</span></div>
                  <div class="sgp__field-content">{{ localGuionIA.broll }}</div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sgp {
  border: 1.5px solid rgba($primary-dark, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.75rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba($primary, 0.05), rgba(#a855f7, 0.04));
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__toggle-icon {
    font-size: 0.9rem;
    background: linear-gradient(135deg, $primary, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__toggle-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
  }

  &__toggle-chevron {
    font-size: 0.75rem;
    color: $text-secondary;
    flex-shrink: 0;
  }

  &__tipo-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 20px;
    border: 1px solid;
    cursor: help;

    &:hover .sgp__tipo-tooltip {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  }

  &__tipo-tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    min-width: 220px;
    background: $primary-dark;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 400;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    line-height: 1.45;
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.2s;
    pointer-events: none;
    z-index: 50;
    white-space: normal;
  }

  &__has-script {
    font-size: 0.7rem;
    font-weight: 700;
    color: #15803d;
    background: rgba(#22c55e, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  // ── Brand profile summary bar ───────────────────────────────
  &__bp-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba($primary, 0.04);
    border: 1px solid rgba($primary, 0.1);
    border-radius: 8px;
    flex-wrap: wrap;
  }

  &__bp-bar-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  // ── Generate area ────────────────────────────────────────────
  &__generate-area {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.85rem;
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 10px;
  }

  &__ctx-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;

    em { font-style: normal; font-weight: 400; }
  }

  &__ctx-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;

    @media (max-width: 560px) { grid-template-columns: 1fr; }
  }

  &__ctx-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    label {
      font-size: 0.72rem;
      font-weight: 600;
      color: $text-secondary;
    }

    input, textarea {
      padding: 0.45rem 0.65rem;
      border: 1.5px solid rgba($primary-dark, 0.12);
      border-radius: 7px;
      font-size: 0.8rem;
      background: #fff;
      color: $primary-dark;
      resize: vertical;
      transition: border-color 0.15s;

      &:focus {
        outline: none;
        border-color: rgba($primary, 0.4);
      }

      &::placeholder { color: rgba($primary-dark, 0.35); }
    }
  }

  // ── Result section ───────────────────────────────────────────
  &__result {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: $primary;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid rgba($primary, 0.12);

    i { font-size: 0.8rem; }

    .sgp__generated-at {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 400;
      color: $text-secondary;
    }
  }

  // ── Section labels ──────────────────────────────────────────
  &__section-label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: -0.15rem;

    > i { font-size: 0.72rem; }

    &--global { color: #0369a1; }
    &--monthly { color: #7c3aed; }
  }

  &__section-badge {
    margin-left: auto;
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.12rem 0.45rem;
    border-radius: 20px;
    text-transform: none;
    letter-spacing: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &--global {
      background: rgba(#0369a1, 0.1);
      color: #0369a1;
    }

    &--monthly {
      background: rgba(#7c3aed, 0.1);
      color: #7c3aed;
    }
  }

  // ── Global brand profile card ────────────────────────────────
  &__global-card {
    background: rgba(#0369a1, 0.04);
    border: 1.5px solid rgba(#0369a1, 0.12);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
  }

  &__global-desc {
    font-size: 0.8rem;
    color: $primary-dark;
    line-height: 1.5;
    margin: 0 0 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__global-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  &__meta-chip {
    font-size: 0.65rem;
    font-weight: 700;
    background: rgba(#0369a1, 0.1);
    color: #0369a1;
    padding: 0.12rem 0.45rem;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;

    &--file {
      background: rgba(#7c3aed, 0.1);
      color: #7c3aed;
    }
  }

  &__global-empty {
    font-size: 0.78rem;
    color: $text-secondary;
    font-style: italic;
  }

  // ── Dividers ────────────────────────────────────────────────
  &__divider {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.1rem 0;

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba($primary-dark, 0.1);
    }

    span {
      font-size: 0.68rem;
      font-weight: 700;
      color: $text-secondary;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.06em;

      em {
        font-style: normal;
        font-weight: 400;
        color: rgba($text-secondary, 0.7);
      }
    }

    &--monthly {
      &::before, &::after {
        background: rgba(#7c3aed, 0.15);
      }
      span { color: #7c3aed; }
    }
  }

  // ── TOFU/MOFU/BOFU banner ────────────────────────────────────
  &__tipo-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    border: 1px solid;
    border-radius: 10px;
    padding: 0.65rem 0.9rem;
    font-size: 0.78rem;
    line-height: 1.45;

    > i { font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }
    strong { font-weight: 700; font-size: 0.78rem; display: block; margin-bottom: 0.15rem; }
    p { margin: 0; color: $text-secondary; }
  }

  // ── Generated script fields ──────────────────────────────────
  &__fields {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__field {
    background: rgba($primary-dark, 0.02);
    border: 1px solid rgba($primary-dark, 0.08);
    border-radius: 10px;
    padding: 0.65rem 0.8rem;

    &--highlight {
      background: rgba($primary, 0.04);
      border-color: rgba($primary, 0.15);
    }

    &--cta {
      background: rgba(#ef4444, 0.03);
      border-color: rgba(#ef4444, 0.12);
    }
  }

  &__field-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
    margin-bottom: 0.4rem;

    > i { color: $primary; font-size: 0.7rem; }
  }

  &__field-chip {
    font-size: 0.6rem;
    font-weight: 700;
    background: rgba($primary-dark, 0.08);
    color: $primary-dark;
    padding: 0.1rem 0.35rem;
    border-radius: 6px;
    text-transform: none;
    letter-spacing: 0;
  }

  &__field-content {
    font-size: 0.82rem;
    color: $primary-dark;
    line-height: 1.5;
    white-space: pre-wrap;

    &--bold { font-weight: 700; }
    &--script { line-height: 1.65; }
  }

  &__generated-at {
    font-size: 0.7rem;
    color: $text-secondary;
    font-style: italic;
    margin: 0;
  }

  // ── Context form ────────────────────────────────────────────
  &__context-form {
    background: rgba(#7c3aed, 0.03);
    border: 1.5px solid rgba(#7c3aed, 0.12);
    border-radius: 10px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__context-intro {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.78rem;
    color: $text-secondary;
    margin: 0;
    line-height: 1.45;
    i { color: #3b82f6; flex-shrink: 0; margin-top: 0.1rem; }
  }

  &__context-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    opacity: 0;
    transform: translateY(6px);
    animation: sgp-field-in 0.25s ease forwards;

    &--1 { animation-delay: 0ms; }
    &--2 { animation-delay: 120ms; }
    &--3 { animation-delay: 240ms; }

    label {
      font-size: 0.72rem;
      font-weight: 700;
      color: $primary-dark;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    input, textarea {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1.5px solid rgba($primary-dark, 0.12);
      border-radius: 8px;
      font-size: 0.82rem;
      color: $primary-dark;
      background: $white;
      resize: vertical;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #7c3aed;
      }
    }
  }

  // ── Inline brand profile editor ─────────────────────────────
  &__bp-editor {
    background: rgba(#0369a1, 0.03);
    border: 1.5px solid rgba(#0369a1, 0.15);
    border-radius: 10px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__bp-editor-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #0369a1;
    i { font-size: 0.8rem; }
    span { flex: 1; }
  }

  &__bp-editor-close {
    width: 22px; height: 22px;
    border: none; border-radius: 6px;
    background: rgba(#0369a1, 0.1);
    color: #0369a1;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem;
    transition: all 0.2s;
    &:hover { background: rgba(#0369a1, 0.2); }
  }

  &__bp-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    @media (max-width: 540px) { grid-template-columns: 1fr; }
  }

  &__bp-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;

    label {
      font-size: 0.68rem;
      font-weight: 700;
      color: $primary-dark;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    input, textarea {
      width: 100%;
      padding: 0.5rem 0.65rem;
      border: 1.5px solid rgba($primary-dark, 0.1);
      border-radius: 8px;
      font-size: 0.82rem;
      color: $primary-dark;
      background: $white;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.2s;
      &:focus { outline: none; border-color: #0369a1; box-shadow: 0 0 0 3px rgba(#0369a1, 0.08); }
    }
  }

  &__bp-req {
    font-size: 0.6rem;
    font-weight: 600;
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.05rem 0.35rem;
    border-radius: 6px;
    text-transform: none;
    letter-spacing: 0;
  }

  &__bp-toggle-group {
    display: flex;
    gap: 0.35rem;
  }

  &__bp-toggle {
    flex: 1;
    padding: 0.4rem 0.5rem;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 0.3rem;
    &:hover { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: #fff; }
  }

  &__bp-tone {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  &__bp-tone-btn {
    padding: 0.28rem 0.65rem;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: #fff; }
  }

  &__bp-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: flex-end;
    padding-top: 0.15rem;
  }

  &__edit-bp-btn {
    margin-left: auto;
    padding: 0.2rem 0.6rem;
    border: 1px solid rgba(#0369a1, 0.25);
    border-radius: 6px;
    background: rgba(#0369a1, 0.06);
    color: #0369a1;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s;
    &:hover { background: rgba(#0369a1, 0.12); }
  }

  &__profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  // ── Create mode hint ────────────────────────────────────────
  &__create-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
    color: #7c3aed;
    background: rgba(#7c3aed, 0.05);
    border: 1px solid rgba(#7c3aed, 0.15);
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
    i { flex-shrink: 0; }
  }

  // ── Error ────────────────────────────────────────────────────
  &__no-profile {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    background: rgba(#f59e0b, 0.08);
    border: 1px solid rgba(#f59e0b, 0.25);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    color: #92400e;

    > i { flex-shrink: 0; margin-top: 0.1rem; color: #d97706; }
    strong { font-weight: 700; display: block; margin-bottom: 0.15rem; }
    p { margin: 0 0 0.6rem; }
  }

  &__profile-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.42rem 0.85rem;
    background: #d97706;
    color: #fff;
    border: 1.5px solid transparent;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { filter: brightness(1.1); }

    &--ghost {
      background: transparent;
      border-color: rgba(#d97706, 0.4);
      color: #d97706;
      &:hover { background: rgba(#d97706, 0.08); filter: none; }
    }
  }

  &__error {
    background: rgba(#ef4444, 0.07);
    border: 1px solid rgba(#ef4444, 0.2);
    border-radius: 8px;
    padding: 0.55rem 0.75rem;
    font-size: 0.78rem;
    color: #b91c1c;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  // ── Actions ──────────────────────────────────────────────────
  &__actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  &__ctx-btn {
    padding: 0.5rem 0.9rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    background: $white;
    color: $text-secondary;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &:hover {
      border-color: #7c3aed;
      color: #7c3aed;
    }

    &--cancel {
      &:hover {
        border-color: rgba($primary-dark, 0.3);
        color: $primary-dark;
      }
    }
  }

  &__llm-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.3rem 0.75rem;
    border-radius: 20px;

    &.is-checking {
      background: rgba(#94a3b8, 0.1);
      color: #64748b;
    }
    &.is-ok {
      background: rgba(#22c55e, 0.1);
      color: #15803d;
    }
    &.is-down {
      background: rgba(#ef4444, 0.1);
      color: #b91c1c;
    }
  }

  &__generate-btn {
    padding: 0.55rem 1.1rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, $primary, #a855f7);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    &.is-loading { opacity: 0.8; }
  }
}

@keyframes sgp-field-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


// ── Script field reveal transition ──────────────────────────────
.sgp-field-enter-active {
  transition: all 0.3s ease;
}
.sgp-field-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.sgp-field-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
