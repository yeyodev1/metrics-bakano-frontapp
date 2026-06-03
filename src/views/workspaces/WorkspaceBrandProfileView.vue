<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile, BrandProfileFile } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const workspaceId = route.params['workspaceId'] as string

const profile = ref<BrandProfile>({
  descripcion: '',
  tipoNegocio: undefined,
  vertical: '',
  publicoObjetivo: '',
  propuestaValor: '',
  tono: '',
  productosServicios: '',
  problemaResuelto: '',
  trafficDirection: undefined,
  trafficLink: '',
  archivos: [],
})

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const saveSuccess = ref(false)
const error = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const isEditing = ref(false)
const originalProfile = ref<BrandProfile | null>(null)
const wizardStep = ref(1)

const PRESET_TONES = ['Profesional', 'Cercano', 'Divertido', 'Aspiracional', 'Educativo', 'Inspirador']

const WIZARD_STEPS = [
  {
    title: 'Tu negocio',
    icon: 'fa-solid fa-store',
    color: 'blue',
    why: 'La IA aprende qué es tu negocio para crear contenido que venda desde el primer video.',
  },
  {
    title: 'Tu cliente ideal',
    icon: 'fa-solid fa-bullseye',
    color: 'purple',
    why: 'Conocer a tu cliente ideal permite crear mensajes que realmente convierten — no contenido genérico.',
  },
  {
    title: 'Lo que vendes',
    icon: 'fa-solid fa-tag',
    color: 'green',
    why: 'Tus productos con precios + tu tono = CTAs que generan ventas reales, no solo likes.',
  },
  {
    title: 'Dónde capturas la venta',
    icon: 'fa-solid fa-route',
    color: 'orange',
    why: 'Sin el destino correcto, pierdes cada venta que genera el contenido. Este paso cierra el ciclo.',
  },
]

const isCustomTone = computed(() =>
  !!profile.value.tono && !PRESET_TONES.includes(profile.value.tono)
)

const canEdit = computed(() => true)

const isClientView = computed(() =>
  !userStore.isInternal && userStore.role !== 'superadmin'
)

const completionScore = computed(() => {
  const checks = [
    profile.value.descripcion?.trim(),
    profile.value.tipoNegocio,
    profile.value.publicoObjetivo?.trim(),
    profile.value.propuestaValor?.trim(),
    profile.value.tono?.trim(),
    profile.value.productosServicios?.trim(),
    profile.value.problemaResuelto?.trim(),
    profile.value.trafficDirection,
    profile.value.trafficLink?.trim(),
  ]
  return Math.round((checks.filter(Boolean).length / 9) * 100)
})

const hasBrandProfile = computed(() =>
  !!(profile.value.descripcion?.trim() || (profile.value.archivos?.length ?? 0) > 0)
)

function selectTone(t: string) {
  if (!isEditing.value) return
  profile.value.tono = profile.value.tono === t ? '' : t
}

function activateCustomTone() {
  if (!isEditing.value) return
  if (PRESET_TONES.includes(profile.value.tono || '')) {
    profile.value.tono = ''
  }
}

async function load() {
  loading.value = true
  try {
    const data = await brandProfileService.getProfile(workspaceId)
    if (data) {
      const loaded: BrandProfile = {
        descripcion: data.descripcion || '',
        tipoNegocio: data.tipoNegocio,
        vertical: data.vertical || '',
        publicoObjetivo: data.publicoObjetivo || '',
        propuestaValor: data.propuestaValor || '',
        tono: data.tono || '',
        productosServicios: data.productosServicios || '',
        problemaResuelto: data.problemaResuelto || '',
        trafficDirection: data.trafficDirection,
        trafficLink: data.trafficLink || '',
        archivos: data.archivos || [],
      }
      profile.value = loaded
      originalProfile.value = { ...loaded, archivos: [...(loaded.archivos || [])] }
    }
  } catch {
    error.value = 'No se pudo cargar el perfil de marca.'
  } finally {
    loading.value = false
    if (isClientView.value) isEditing.value = true
  }
}

async function save() {
  saving.value = true
  error.value = null
  try {
    await brandProfileService.upsert(workspaceId, {
      descripcion: profile.value.descripcion,
      tipoNegocio: profile.value.tipoNegocio,
      vertical: profile.value.vertical,
      publicoObjetivo: profile.value.publicoObjetivo,
      propuestaValor: profile.value.propuestaValor,
      tono: profile.value.tono,
      productosServicios: profile.value.productosServicios,
      problemaResuelto: profile.value.problemaResuelto,
      trafficDirection: profile.value.trafficDirection,
      trafficLink: profile.value.trafficLink,
    })
    saveSuccess.value = true
    isEditing.value = false
    originalProfile.value = { ...profile.value, archivos: [...(profile.value.archivos || [])] }
    setTimeout(() => { saveSuccess.value = false }, 2500)
  } catch {
    error.value = 'Error al guardar. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

async function saveStep(nextStep?: number) {
  saving.value = true
  error.value = null
  try {
    await brandProfileService.upsert(workspaceId, {
      descripcion: profile.value.descripcion,
      tipoNegocio: profile.value.tipoNegocio,
      vertical: profile.value.vertical,
      publicoObjetivo: profile.value.publicoObjetivo,
      propuestaValor: profile.value.propuestaValor,
      tono: profile.value.tono,
      productosServicios: profile.value.productosServicios,
      problemaResuelto: profile.value.problemaResuelto,
      trafficDirection: profile.value.trafficDirection,
      trafficLink: profile.value.trafficLink,
    })
    originalProfile.value = { ...profile.value, archivos: [...(profile.value.archivos || [])] }
    if (nextStep) {
      wizardStep.value = nextStep
    } else {
      saveSuccess.value = true
      if (isClientView.value) {
        userStore.setBrandProfileCompleted(true)
        setTimeout(() => {
          router.push({ name: 'BillingRoas', params: { workspaceId } })
        }, 2000)
      } else {
        setTimeout(() => { saveSuccess.value = false }, 3000)
      }
    }
  } catch {
    error.value = 'Error al guardar. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  if (originalProfile.value) {
    profile.value = { ...originalProfile.value, archivos: [...(originalProfile.value.archivos || [])] }
  }
  isEditing.value = false
  error.value = null
}

async function handleFileUpload(files: FileList | null) {
  if (!files || files.length === 0) return
  uploading.value = true
  error.value = null
  try {
    for (const file of Array.from(files)) {
      const uploaded = await brandProfileService.uploadFile(workspaceId, file)
      profile.value.archivos = [...(profile.value.archivos || []), uploaded]
    }
  } catch {
    error.value = 'Error al subir el archivo. Intenta de nuevo.'
  } finally {
    uploading.value = false
  }
}

async function deleteFile(file: BrandProfileFile) {
  try {
    await brandProfileService.deleteFile(workspaceId, file.publicId)
    profile.value.archivos = (profile.value.archivos || []).filter(f => f.publicId !== file.publicId)
  } catch {
    error.value = 'No se pudo eliminar el archivo.'
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFileUpload(e.dataTransfer?.files || null)
}

onMounted(load)
</script>

<template>
  <div class="bp">

    <!-- ── Page header ─────────────────────────────────────────── -->
    <div class="bp__header">
      <div class="bp__header-left">
        <div class="bp__header-icon-wrap">
          <i class="fa-solid fa-palette" />
        </div>
        <div>
          <h1 class="bp__title">Perfil de Marca</h1>
          <p class="bp__subtitle">
            {{ isClientView ? 'Cuéntanos sobre tu negocio para crear contenido que venda' : 'Contexto del cliente para que la IA genere guiones personalizados' }}
          </p>
        </div>
      </div>
      <div class="bp__header-right">
        <!-- Admin/Internal: edit/save buttons -->
        <template v-if="!isClientView">
          <span v-if="hasBrandProfile" class="bp__badge bp__badge--ok">
            <i class="fa-solid fa-circle-check" /> Perfil configurado
          </span>
          <span v-else class="bp__badge bp__badge--warn">
            <i class="fa-solid fa-triangle-exclamation" /> Sin configurar
          </span>
          <div v-if="isEditing" class="bp__header-actions">
            <button class="bp__cancel-btn" type="button" @click="cancelEdit">
              <i class="fa-solid fa-xmark" /> Cancelar
            </button>
            <button
              class="bp__save-btn"
              :class="{ 'is-success': saveSuccess }"
              :disabled="saving"
              type="button"
              @click="save"
            >
              <i :class="saveSuccess ? 'fa-solid fa-check' : saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
              {{ saveSuccess ? 'Guardado' : saving ? 'Guardando...' : 'Guardar perfil' }}
            </button>
          </div>
          <button v-else class="bp__edit-btn" type="button" @click="isEditing = true">
            <i class="fa-solid fa-pen-to-square" /> Editar
          </button>
        </template>
        <!-- Client: completion badge -->
        <template v-else>
          <span v-if="completionScore === 100" class="bp__badge bp__badge--ok">
            <i class="fa-solid fa-circle-check" /> Perfil completo
          </span>
          <span v-else class="bp__badge bp__badge--warn">
            <i class="fa-solid fa-chart-pie" /> {{ completionScore }}% completado
          </span>
        </template>
      </div>
    </div>

    <!-- ── Progress bar (all users) ──────────────────────────────── -->
    <div class="bp__progress-wrap">
      <div class="bp__progress-bar">
        <div
          class="bp__progress-fill"
          :class="{ 'is-complete': completionScore === 100 }"
          :style="{ width: completionScore + '%' }"
        />
      </div>
      <span class="bp__progress-label">{{ completionScore }}% del perfil completado</span>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────── -->
    <div v-if="loading" class="bp__loading">
      <div class="bp__spinner" />
      <span>Cargando perfil de marca...</span>
    </div>

    <template v-else>
      <!-- ── Error ─────────────────────────────────────────────── -->
      <div v-if="error" class="bp__notice bp__notice--error">
        <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
      </div>

      <!-- ══════════════════════════════════════════════════════════
           CLIENT VIEW: 4-step wizard
      ══════════════════════════════════════════════════════════════ -->
      <div v-if="isClientView" class="bp__wizard-container">

        <!-- Step indicator -->
        <div class="bp__step-indicator">
          <div
            v-for="(step, i) in WIZARD_STEPS"
            :key="i"
            class="bp__step-dot"
            :class="{
              'is-active': wizardStep === i + 1,
              'is-done': wizardStep > i + 1,
            }"
            @click="wizardStep = i + 1"
          >
            <div class="bp__step-dot-circle">
              <i v-if="wizardStep > i + 1" class="fa-solid fa-check" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="bp__step-dot-label">{{ step.title }}</span>
          </div>
        </div>

        <!-- ── Step 1: Tu negocio ─────────────────────────────── -->
        <div v-if="wizardStep === 1" class="bp__step">
          <div class="bp__step-why">
            <i class="fa-solid fa-lightbulb" />
            <span>{{ WIZARD_STEPS[0].why }}</span>
          </div>
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--blue">
                <i class="fa-solid fa-store" />
              </div>
              <div>
                <h3>Tu negocio</h3>
                <p>Qué hace, qué vende y en qué industria opera</p>
              </div>
            </div>
            <div class="bp__field">
              <label>Descripción del negocio <span class="bp__req">requerido para IA</span></label>
              <textarea
                v-model="profile.descripcion"
                rows="4"
                placeholder="Ej: Restaurante de comida saludable en Guayaquil, especializado en bowls y jugos naturales. Atendemos a jóvenes adultos de 25-40 años que cuidan su alimentación..."
              />
            </div>
            <div class="bp__row">
              <div class="bp__field">
                <label>Tipo de negocio</label>
                <div class="bp__toggle-group">
                  <button
                    :class="['bp__toggle', { 'is-active': profile.tipoNegocio === 'PRODUCTOS' }]"
                    type="button"
                    @click="profile.tipoNegocio = 'PRODUCTOS'"
                  ><i class="fa-solid fa-box" /> Productos</button>
                  <button
                    :class="['bp__toggle', { 'is-active': profile.tipoNegocio === 'SERVICIOS' }]"
                    type="button"
                    @click="profile.tipoNegocio = 'SERVICIOS'"
                  ><i class="fa-solid fa-handshake" /> Servicios</button>
                </div>
              </div>
              <div class="bp__field">
                <label>Vertical / Industria</label>
                <input v-model="profile.vertical" type="text" placeholder="Ej: Restaurante, Clínica dental, Moda..." />
              </div>
            </div>
          </div>
          <div class="bp__step-nav">
            <button class="bp__step-next" :disabled="saving" type="button" @click="saveStep(2)">
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'" />
              {{ saving ? 'Guardando...' : 'Guardar y continuar' }}
            </button>
          </div>
        </div>

        <!-- ── Step 2: Tu cliente ideal ───────────────────────── -->
        <div v-if="wizardStep === 2" class="bp__step">
          <div class="bp__step-why">
            <i class="fa-solid fa-lightbulb" />
            <span>{{ WIZARD_STEPS[1].why }}</span>
          </div>
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--purple">
                <i class="fa-solid fa-bullseye" />
              </div>
              <div>
                <h3>Tu cliente ideal</h3>
                <p>A quién le hablas, qué problema resuelves y qué te diferencia</p>
              </div>
            </div>
            <div class="bp__row">
              <div class="bp__field">
                <label>Público objetivo <span class="bp__req">clave para IA</span></label>
                <textarea
                  v-model="profile.publicoObjetivo"
                  rows="3"
                  placeholder="Ej: Madres de 28-42 años en Quito que trabajan y buscan comida sana rápida para su familia..."
                />
              </div>
              <div class="bp__field">
                <label>Propuesta de valor <span class="bp__req">qué te diferencia</span></label>
                <textarea
                  v-model="profile.propuestaValor"
                  rows="3"
                  placeholder="Ej: Somos la única clínica en Quito que garantiza resultados en 3 sesiones o te devolvemos el dinero..."
                />
              </div>
            </div>
            <div class="bp__field">
              <label>Problema que resuelves</label>
              <textarea
                v-model="profile.problemaResuelto"
                rows="3"
                placeholder="Ej: La mayoría de nuestros clientes llegaban agotados de dietas que no funcionan y sin ver resultados reales..."
              />
            </div>
          </div>
          <div class="bp__step-nav">
            <button class="bp__step-back" type="button" @click="wizardStep = 1">
              <i class="fa-solid fa-arrow-left" /> Atrás
            </button>
            <button class="bp__step-next" :disabled="saving" type="button" @click="saveStep(3)">
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'" />
              {{ saving ? 'Guardando...' : 'Guardar y continuar' }}
            </button>
          </div>
        </div>

        <!-- ── Step 3: Lo que vendes ──────────────────────────── -->
        <div v-if="wizardStep === 3" class="bp__step">
          <div class="bp__step-why">
            <i class="fa-solid fa-lightbulb" />
            <span>{{ WIZARD_STEPS[2].why }}</span>
          </div>
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--green">
                <i class="fa-solid fa-tag" />
              </div>
              <div>
                <h3>Lo que vendes</h3>
                <p>Tus productos o servicios y cómo le hablas a tu cliente</p>
              </div>
            </div>
            <div class="bp__field">
              <label>Productos o servicios principales <span class="bp__hint">con precios si los tienes</span></label>
              <textarea
                v-model="profile.productosServicios"
                rows="3"
                placeholder="Ej: Plan mensual $120/mes · Bowl de quinoa $8.50 · Jugo detox $4.00 · Catering empresarial desde $500..."
              />
            </div>
            <div class="bp__field">
              <label>
                Tono de comunicación
                <span v-if="isCustomTone" class="bp__tone-custom-badge">
                  <i class="fa-solid fa-pen-nib" /> Personalizado
                </span>
              </label>
              <div class="bp__tone-grid">
                <button
                  v-for="t in PRESET_TONES"
                  :key="t"
                  :class="['bp__tone-btn', { 'is-active': profile.tono === t }]"
                  type="button"
                  @click="profile.tono = profile.tono === t ? '' : t"
                >{{ t }}</button>
                <button
                  :class="['bp__tone-btn', 'bp__tone-btn--custom', { 'is-active': isCustomTone }]"
                  type="button"
                  @click="activateCustomTone"
                >
                  <i class="fa-solid fa-plus" /> Otro
                </button>
              </div>
              <transition name="bp-tone-input">
                <div v-if="isCustomTone || !profile.tono" class="bp__tone-custom-wrap">
                  <input
                    v-model="profile.tono"
                    type="text"
                    class="bp__tone-custom-input"
                    maxlength="80"
                    placeholder="Describe el tono exacto: ej. 'Directo y empático, como un amigo experto'"
                    @focus="activateCustomTone"
                  />
                  <p class="bp__tone-custom-hint">
                    <i class="fa-solid fa-circle-info" />
                    Cuanto más específico seas, mejores guiones generará la IA. Ej: <em>"Serio pero accesible, con humor técnico y jerga del sector"</em>
                  </p>
                </div>
              </transition>
            </div>
          </div>
          <div class="bp__step-nav">
            <button class="bp__step-back" type="button" @click="wizardStep = 2">
              <i class="fa-solid fa-arrow-left" /> Atrás
            </button>
            <button class="bp__step-next" :disabled="saving" type="button" @click="saveStep(4)">
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'" />
              {{ saving ? 'Guardando...' : 'Guardar y continuar' }}
            </button>
          </div>
        </div>

        <!-- ── Step 4: Dónde capturas la venta ───────────────── -->
        <div v-if="wizardStep === 4" class="bp__step">
          <div class="bp__step-why">
            <i class="fa-solid fa-lightbulb" />
            <span>{{ WIZARD_STEPS[3].why }}</span>
          </div>
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--orange">
                <i class="fa-solid fa-route" />
              </div>
              <div>
                <h3>Dónde capturas la venta</h3>
                <p>A dónde dirigen los videos a tus clientes potenciales</p>
              </div>
            </div>
            <div class="bp__row">
              <div class="bp__field">
                <label>
                  Dirección de tráfico
                  <span class="bp__tooltip-wrap">
                    <i class="fa-solid fa-circle-question" />
                    <span class="bp__tooltip">A dónde van los CTA de los videos de venta.</span>
                  </span>
                </label>
                <div class="bp__toggle-group">
                  <button
                    :class="['bp__toggle', { 'is-active': profile.trafficDirection === 'WHATSAPP' }]"
                    type="button"
                    @click="profile.trafficDirection = 'WHATSAPP'"
                  ><i class="fa-brands fa-whatsapp" /> WhatsApp</button>
                  <button
                    :class="['bp__toggle', { 'is-active': profile.trafficDirection === 'GHL' }]"
                    type="button"
                    @click="profile.trafficDirection = 'GHL'"
                  ><i class="fa-solid fa-calendar-check" /> GHL / Agenda</button>
                </div>
              </div>
              <div class="bp__field">
                <label>Link / Número de WhatsApp</label>
                <input v-model="profile.trafficLink" type="text" placeholder="Ej: +593 99 123 4567 o https://..." />
              </div>
            </div>
          </div>
          <div class="bp__step-nav">
            <button class="bp__step-back" type="button" @click="wizardStep = 3">
              <i class="fa-solid fa-arrow-left" /> Atrás
            </button>
            <button
              class="bp__step-finish"
              :disabled="saving"
              :class="{ 'is-success': saveSuccess }"
              type="button"
              @click="saveStep()"
            >
              <i :class="saveSuccess ? 'fa-solid fa-check' : saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" />
              {{ saveSuccess ? '¡Perfil completado!' : saving ? 'Guardando...' : 'Completar perfil' }}
            </button>
          </div>
          <transition name="bp-success">
            <div v-if="saveSuccess" class="bp__wizard-success">
              <i class="fa-solid fa-circle-check" />
              <div>
                <strong>¡Listo! Tu perfil está guardado.</strong>
                <p>Nuestro equipo puede ahora crear contenido personalizado que genera ventas para tu negocio.</p>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════
           ADMIN/INTERNAL VIEW: flat single-column
      ══════════════════════════════════════════════════════════════ -->
      <div v-else class="bp__content">

        <!-- Card 1: Identidad del negocio -->
        <div class="bp__card">
          <div class="bp__card-header">
            <div class="bp__card-icon bp__card-icon--blue">
              <i class="fa-solid fa-store" />
            </div>
            <div>
              <h3>Identidad del negocio</h3>
              <p>Qué hace, qué vende y en qué industria opera</p>
            </div>
          </div>
          <div class="bp__field">
            <label>Descripción del negocio <span class="bp__req">requerido para IA</span></label>
            <textarea
              v-model="profile.descripcion"
              :disabled="!isEditing"
              rows="4"
              placeholder="Ej: Restaurante de comida saludable en Guayaquil, especializado en bowls y jugos naturales. Atendemos a jóvenes adultos de 25-40 años que cuidan su alimentación..."
            />
          </div>
          <div class="bp__row">
            <div class="bp__field">
              <label>Tipo de negocio</label>
              <div class="bp__toggle-group">
                <button
                  :class="['bp__toggle', { 'is-active': profile.tipoNegocio === 'PRODUCTOS' }]"
                  :disabled="!isEditing" type="button"
                  @click="profile.tipoNegocio = 'PRODUCTOS'"
                ><i class="fa-solid fa-box" /> Productos</button>
                <button
                  :class="['bp__toggle', { 'is-active': profile.tipoNegocio === 'SERVICIOS' }]"
                  :disabled="!isEditing" type="button"
                  @click="profile.tipoNegocio = 'SERVICIOS'"
                ><i class="fa-solid fa-handshake" /> Servicios</button>
              </div>
            </div>
            <div class="bp__field">
              <label>Vertical / Industria</label>
              <input v-model="profile.vertical" :disabled="!isEditing" type="text" placeholder="Ej: Restaurante, Clínica dental, Moda..." />
            </div>
          </div>
        </div>

        <!-- Card 2: Audiencia y estrategia -->
        <div class="bp__card">
          <div class="bp__card-header">
            <div class="bp__card-icon bp__card-icon--purple">
              <i class="fa-solid fa-bullseye" />
            </div>
            <div>
              <h3>Audiencia y estrategia</h3>
              <p>A quién le hablan, qué problema resuelven y qué los diferencia</p>
            </div>
          </div>
          <div class="bp__row">
            <div class="bp__field">
              <label>Público objetivo <span class="bp__req">clave para IA</span></label>
              <textarea
                v-model="profile.publicoObjetivo"
                :disabled="!isEditing"
                rows="3"
                placeholder="Ej: Madres de 28-42 años, Quito, que trabajan y buscan comida sana rápida para su familia..."
              />
            </div>
            <div class="bp__field">
              <label>Propuesta de valor <span class="bp__req">qué te diferencia</span></label>
              <textarea
                v-model="profile.propuestaValor"
                :disabled="!isEditing"
                rows="3"
                placeholder="Ej: Somos la única clínica en Quito que garantiza resultados en 3 sesiones o te devolvemos el dinero..."
              />
            </div>
          </div>
          <div class="bp__field">
            <label>Problema que resuelves</label>
            <textarea
              v-model="profile.problemaResuelto"
              :disabled="!isEditing"
              rows="3"
              placeholder="Ej: La mayoría de nuestros clientes llegaban agotados de dietas que no funcionan..."
            />
          </div>
          <div class="bp__field">
            <label>
              Tono de comunicación
              <span v-if="isCustomTone" class="bp__tone-custom-badge">
                <i class="fa-solid fa-pen-nib" /> Personalizado
              </span>
            </label>
            <div class="bp__tone-grid">
              <button
                v-for="t in PRESET_TONES"
                :key="t"
                :class="['bp__tone-btn', { 'is-active': profile.tono === t }]"
                :disabled="!isEditing"
                type="button"
                @click="selectTone(t)"
              >{{ t }}</button>
              <button
                :class="['bp__tone-btn', 'bp__tone-btn--custom', { 'is-active': isCustomTone }]"
                :disabled="!isEditing"
                type="button"
                @click="activateCustomTone"
              >
                <i class="fa-solid fa-plus" /> Otro
              </button>
            </div>
            <transition name="bp-tone-input">
              <div v-if="isCustomTone || (isEditing && !profile.tono)" class="bp__tone-custom-wrap">
                <div v-if="!isEditing && isCustomTone" class="bp__tone-custom-display">
                  <i class="fa-solid fa-pen-nib" />
                  {{ profile.tono }}
                </div>
                <template v-if="isEditing">
                  <input
                    v-model="profile.tono"
                    type="text"
                    class="bp__tone-custom-input"
                    maxlength="80"
                    placeholder="Describe el tono exacto: ej. 'Directo y empático, como un amigo experto'"
                    @focus="activateCustomTone"
                  />
                  <p class="bp__tone-custom-hint">
                    <i class="fa-solid fa-circle-info" />
                    Cuanto más específico seas, mejores guiones generará la IA. Ej: <em>"Serio pero accesible, con humor técnico y jerga del sector"</em>
                  </p>
                </template>
              </div>
            </transition>
          </div>
        </div>

        <!-- Card 3: Oferta y captación -->
        <div class="bp__card">
          <div class="bp__card-header">
            <div class="bp__card-icon bp__card-icon--green">
              <i class="fa-solid fa-tag" />
            </div>
            <div>
              <h3>Oferta y captación</h3>
              <p>Productos/servicios con precios y destino del tráfico</p>
            </div>
          </div>
          <div class="bp__field">
            <label>Productos o servicios principales <span class="bp__hint">con precios si los tienes</span></label>
            <textarea
              v-model="profile.productosServicios"
              :disabled="!isEditing"
              rows="3"
              placeholder="Ej: Plan mensual $120/mes · Bowl de quinoa $8.50 · Jugo detox $4.00 · Catering empresarial desde $500..."
            />
          </div>
          <div class="bp__row">
            <div class="bp__field">
              <label>
                Dirección de tráfico
                <span class="bp__tooltip-wrap">
                  <i class="fa-solid fa-circle-question" />
                  <span class="bp__tooltip">A dónde van los CTA de los videos de venta.</span>
                </span>
              </label>
              <div class="bp__toggle-group">
                <button
                  :class="['bp__toggle', { 'is-active': profile.trafficDirection === 'WHATSAPP' }]"
                  :disabled="!isEditing" type="button"
                  @click="profile.trafficDirection = 'WHATSAPP'"
                ><i class="fa-brands fa-whatsapp" /> WhatsApp</button>
                <button
                  :class="['bp__toggle', { 'is-active': profile.trafficDirection === 'GHL' }]"
                  :disabled="!isEditing" type="button"
                  @click="profile.trafficDirection = 'GHL'"
                ><i class="fa-solid fa-calendar-check" /> GHL / Agenda</button>
              </div>
            </div>
            <div class="bp__field">
              <label>Link / Número de WhatsApp</label>
              <input v-model="profile.trafficLink" :disabled="!isEditing" type="text" placeholder="Ej: +593 99 123 4567 o https://..." />
            </div>
          </div>
        </div>

        <!-- Card 4: Archivos de contexto -->
        <div class="bp__card">
          <div class="bp__card-header">
            <div class="bp__card-icon bp__card-icon--indigo">
              <i class="fa-solid fa-folder-open" />
            </div>
            <div>
              <h3>Archivos de contexto</h3>
              <p>PDFs, imágenes o documentos que la IA puede leer para personalizar los guiones</p>
            </div>
          </div>
          <div
            class="bp__dropzone"
            :class="{ 'is-dragging': dragOver, 'is-uploading': uploading }"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
            @click="fileInputRef?.click()"
          >
            <i v-if="!uploading" class="fa-solid fa-cloud-arrow-up" />
            <div v-else class="bp__spinner" />
            <span>{{ uploading ? 'Subiendo...' : 'Arrastra o haz clic' }}</span>
            <small>PDF, imágenes — máx. 10MB</small>
            <input ref="fileInputRef" type="file" accept=".pdf,image/*" multiple @change="handleFileUpload(($event.target as HTMLInputElement).files)" />
          </div>
          <div v-if="(profile.archivos || []).length > 0" class="bp__file-list">
            <div v-for="file in profile.archivos" :key="file.publicId" class="bp__file-item">
              <i :class="file.tipo === 'application/pdf' ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'" class="bp__file-type-icon" />
              <div class="bp__file-info">
                <span>{{ file.nombre }}</span>
                <a :href="file.url" target="_blank">Ver <i class="fa-solid fa-arrow-up-right-from-square" /></a>
              </div>
              <button class="bp__file-delete" type="button" @click="deleteFile(file)">
                <i class="fa-solid fa-trash" />
              </button>
            </div>
          </div>
          <p v-else class="bp__no-files">No hay archivos cargados.</p>
        </div>

      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.bp {
  padding: 0 0 4rem;

  // ── Page header ───────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 2rem 2.5rem 1.75rem;
    border-bottom: 1px solid rgba($primary-dark, 0.06);
    flex-wrap: wrap;

    @media (max-width: 768px) { padding: 1.5rem 1.25rem; }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__header-icon-wrap {
    width: 46px; height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, $primary, darken($primary, 12%));
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    i { font-size: 1.1rem; color: #fff; }
  }

  &__title {
    font-size: 1.3rem;
    font-weight: 900;
    color: $primary-dark;
    margin: 0 0 0.2rem;
  }

  &__subtitle {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 0;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;

    &--ok {
      background: rgba(#22c55e, 0.1);
      color: #16a34a;
      i { color: #22c55e; }
    }
    &--warn {
      background: rgba(#f59e0b, 0.1);
      color: #b45309;
      i { color: #f59e0b; }
    }
  }

  &__edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 10px;
    background: $white;
    font-size: 0.82rem;
    font-weight: 700;
    color: $primary-dark;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: $primary; color: $primary; }
  }

  &__cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 10px;
    background: transparent;
    font-size: 0.82rem;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: #ef4444; color: #ef4444; }
  }

  &__save-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.2rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { background: darken($primary, 8%); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
    &.is-success { background: #16a34a; }
  }

  // ── Progress bar ───────────────────────────────────────────────
  &__progress-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 2.5rem;
    border-bottom: 1px solid rgba($primary-dark, 0.05);
    background: rgba($primary-dark, 0.015);

    @media (max-width: 768px) { padding: 0.75rem 1.25rem; }
  }

  &__progress-bar {
    flex: 1;
    height: 6px;
    background: rgba($primary-dark, 0.08);
    border-radius: 99px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary, darken($primary, 10%));
    border-radius: 99px;
    transition: width 0.45s ease;

    &.is-complete { background: linear-gradient(90deg, #22c55e, #16a34a); }
  }

  &__progress-label {
    font-size: 0.72rem;
    font-weight: 800;
    color: $text-secondary;
    white-space: nowrap;
  }

  // ── Notices ─────────────────────────────────────────────────────
  &__notice {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 1.25rem 2.5rem;
    padding: 0.9rem 1.1rem;
    border-radius: 12px;
    font-size: 0.82rem;
    font-weight: 600;

    @media (max-width: 768px) { margin: 1rem 1.25rem; }

    &--error {
      background: rgba(#ef4444, 0.07);
      border: 1px solid rgba(#ef4444, 0.15);
      color: #dc2626;
      i { color: #ef4444; }
    }
  }

  // ── Loading ────────────────────────────────────────────────────
  &__loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 4rem 2.5rem;
    color: $text-secondary;
    font-size: 0.9rem;
  }

  &__spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba($primary, 0.2);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  // ── Admin/Internal: flat single-column content ─────────────────
  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 2rem 2.5rem;

    @media (max-width: 768px) { padding: 1.5rem 1.25rem; }
  }

  // ── Cards ──────────────────────────────────────────────────────
  &__card {
    background: $white;
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 18px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &__card-header {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;

    h3 {
      font-size: 0.95rem;
      font-weight: 800;
      color: $primary-dark;
      margin: 0 0 0.2rem;
    }
    p {
      font-size: 0.75rem;
      color: $text-secondary;
      margin: 0;
      line-height: 1.4;
    }
  }

  &__card-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    i { font-size: 0.9rem; color: #fff; }

    &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    &--purple { background: linear-gradient(135deg, #a855f7, #7c3aed); }
    &--green  { background: linear-gradient(135deg, #22c55e, #16a34a); }
    &--orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &--indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  }

  // ── Fields ─────────────────────────────────────────────────────
  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;

    label {
      font-size: 0.72rem;
      font-weight: 800;
      color: $primary-dark;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    input, textarea {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid rgba($primary-dark, 0.1);
      border-radius: 10px;
      font-size: 0.88rem;
      color: $primary-dark;
      background: $white;
      font-family: inherit;
      line-height: 1.55;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 4px rgba($primary, 0.08);
      }
      &:disabled {
        background: rgba($primary-dark, 0.025);
        color: $text-secondary;
        cursor: not-allowed;
      }
    }
    textarea { resize: vertical; }
  }

  &__req {
    font-size: 0.62rem;
    font-weight: 600;
    background: rgba($primary, 0.08);
    color: $primary;
    padding: 0.1rem 0.45rem;
    border-radius: 6px;
    text-transform: none;
    letter-spacing: 0;
  }

  &__hint {
    font-size: 0.65rem;
    font-weight: 500;
    color: $text-secondary;
    text-transform: none;
    letter-spacing: 0;
  }

  &__row {
    display: flex;
    gap: 1rem;

    @media (max-width: 640px) { flex-direction: column; }
  }

  // ── Toggle group ──────────────────────────────────────────────
  &__toggle-group {
    display: flex;
    gap: 0.4rem;
  }

  &__toggle {
    flex: 1;
    padding: 0.55rem 0.65rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 10px;
    background: $white;
    font-size: 0.8rem;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;

    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: #fff; }
    &:disabled { cursor: not-allowed; opacity: 0.55; }
  }

  // ── Tooltip ───────────────────────────────────────────────────
  &__tooltip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;

    i { font-size: 0.7rem; color: $text-secondary; cursor: help; }

    &:hover .bp__tooltip { opacity: 1; transform: translateY(0); }
  }

  &__tooltip {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    background: $primary-dark;
    color: $white;
    min-width: 180px;
    max-width: 220px;
    font-size: 0.72rem;
    font-weight: 400;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    line-height: 1.45;
    opacity: 0;
    transition: all 0.2s;
    pointer-events: none;
    z-index: 20;
    text-transform: none;
    letter-spacing: 0;
    white-space: normal;
  }

  // ── Tone picker ───────────────────────────────────────────────
  &__tone-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  &__tone-btn {
    padding: 0.38rem 0.9rem;
    border: 1.5px solid rgba($primary-dark, 0.12);
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;

    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: #fff; }
    &:disabled { cursor: not-allowed; opacity: 0.55; }

    &--custom {
      border-style: dashed;
      &:hover:not(:disabled) { border-color: #a855f7; color: #a855f7; }
      &.is-active { background: #a855f7; border-color: #a855f7; color: #fff; border-style: solid; }
    }
  }

  &__tone-custom-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 0.5rem;
    padding: 0.15rem 0.55rem;
    border-radius: 10px;
    background: rgba(#a855f7, 0.1);
    color: #a855f7;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0;
    i { font-size: 0.65rem; }
  }

  &__tone-custom-wrap {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__tone-custom-display {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    border: 1.5px solid rgba(#a855f7, 0.3);
    background: rgba(#a855f7, 0.06);
    color: #7c3aed;
    font-size: 0.88rem;
    font-weight: 600;
    i { font-size: 0.75rem; opacity: 0.7; }
  }

  &__tone-custom-input {
    width: 100%;
    padding: 0.55rem 0.85rem;
    border: 1.5px solid #a855f7;
    border-radius: 10px;
    font-size: 0.88rem;
    color: $primary-dark;
    font-family: inherit;
    background: rgba(#a855f7, 0.03);
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #a855f7;
      box-shadow: 0 0 0 3px rgba(#a855f7, 0.12);
    }
    &::placeholder { color: rgba($text-secondary, 0.6); font-style: italic; }
  }

  &__tone-custom-hint {
    font-size: 0.73rem;
    color: $text-secondary;
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    line-height: 1.5;
    i { color: #a855f7; font-size: 0.72rem; flex-shrink: 0; margin-top: 0.15rem; }
    em { color: $primary-dark; font-style: italic; font-weight: 500; }
  }

  // ── Transitions ────────────────────────────────────────────────
  .bp-tone-input-enter-active,
  .bp-tone-input-leave-active { transition: all 0.25s ease; }
  .bp-tone-input-enter-from,
  .bp-tone-input-leave-to { opacity: 0; transform: translateY(-6px); }

  .bp-success-enter-active,
  .bp-success-leave-active { transition: all 0.35s ease; }
  .bp-success-enter-from,
  .bp-success-leave-to { opacity: 0; transform: translateY(8px); }

  // ── Dropzone & files ───────────────────────────────────────────
  &__dropzone {
    border: 2px dashed rgba($primary-dark, 0.2);
    border-radius: 14px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    i { font-size: 1.75rem; color: rgba($primary-dark, 0.2); }
    span { font-size: 0.82rem; font-weight: 600; color: $primary-dark; }
    small { font-size: 0.72rem; color: $text-secondary; }
    input { display: none; }

    &:hover, &.is-dragging { border-color: $primary; background: rgba($primary, 0.03); i { color: $primary; } }
    &.is-uploading { pointer-events: none; }
  }

  &__file-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__file-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.6rem 0.75rem;
    background: rgba($primary-dark, 0.025);
    border: 1px solid rgba($primary-dark, 0.07);
    border-radius: 10px;
  }

  &__file-type-icon {
    font-size: 1.25rem;
    color: $primary;
    flex-shrink: 0;
  }

  &__file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;

    span {
      font-size: 0.8rem;
      font-weight: 600;
      color: $primary-dark;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    a {
      font-size: 0.7rem;
      color: $primary;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      &:hover { text-decoration: underline; }
      i { font-size: 0.6rem; }
    }
  }

  &__file-delete {
    width: 28px; height: 28px;
    border: none; border-radius: 7px;
    background: rgba(#ef4444, 0.07);
    color: #ef4444;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover { background: rgba(#ef4444, 0.15); }
  }

  &__no-files {
    font-size: 0.78rem;
    color: $text-secondary;
    font-style: italic;
    margin: 0;
    text-align: center;
    padding: 0.5rem 0;
  }

  // ── CLIENT WIZARD ──────────────────────────────────────────────
  &__wizard-container {
    padding: 2rem 2.5rem;

    @media (max-width: 768px) { padding: 1.5rem 1.25rem; }
  }

  &__step-indicator {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    margin-bottom: 2.5rem;

    &::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 12.5%;
      right: 12.5%;
      height: 2px;
      background: rgba($primary-dark, 0.1);
      z-index: 0;
    }
  }

  &__step-dot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    cursor: pointer;
    position: relative;
    z-index: 1;

    &-circle {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid rgba($primary-dark, 0.15);
      background: $white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem;
      font-weight: 800;
      color: $text-secondary;
      transition: all 0.25s;
    }

    &-label {
      font-size: 0.66rem;
      font-weight: 700;
      color: $text-secondary;
      text-align: center;
      transition: color 0.25s;
      max-width: 72px;
      line-height: 1.3;
    }

    &.is-active {
      .bp__step-dot-circle {
        border-color: $primary;
        background: $primary;
        color: $white;
        box-shadow: 0 0 0 4px rgba($primary, 0.15);
      }
      .bp__step-dot-label { color: $primary; }
    }

    &.is-done {
      .bp__step-dot-circle {
        border-color: #22c55e;
        background: #22c55e;
        color: $white;
      }
      .bp__step-dot-label { color: #16a34a; }
    }
  }

  &__step {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 760px;
    margin: 0 auto;
  }

  &__step-why {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: rgba($primary, 0.04);
    border: 1px solid rgba($primary, 0.12);
    border-radius: 12px;

    i {
      color: $primary;
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    span {
      font-size: 0.88rem;
      font-weight: 600;
      color: $primary-dark;
      line-height: 1.5;
    }
  }

  &__step-nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  &__step-back {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 10px;
    background: transparent;
    font-size: 0.82rem;
    font-weight: 700;
    color: $text-secondary;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: $primary; color: $primary; }
  }

  &__step-next {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.5rem;
    background: $primary;
    color: $white;
    border: none;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { background: darken($primary, 8%); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__step-finish {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.5rem;
    background: #22c55e;
    color: $white;
    border: none;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { background: darken(#22c55e, 8%); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
    &.is-success { background: #16a34a; }
  }

  &__wizard-success {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: rgba(#22c55e, 0.06);
    border: 1px solid rgba(#22c55e, 0.2);
    border-radius: 14px;

    > i {
      color: #22c55e;
      font-size: 1.5rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    strong {
      display: block;
      font-size: 0.95rem;
      font-weight: 800;
      color: #15803d;
      margin-bottom: 0.25rem;
    }

    p {
      margin: 0;
      font-size: 0.82rem;
      color: $text-secondary;
      line-height: 1.5;
    }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
