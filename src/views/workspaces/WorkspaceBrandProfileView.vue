<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { brandProfileService } from '@/services/brandProfile.service'
import { resourceService } from '@/services/resource.service'
import type { BrandProfile, BrandProfileFile, Resource } from '@/types'

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

const brandResources = ref<Resource[]>([])
const resourceUploading = ref<'logo' | 'linea_grafica' | null>(null)
const resourcesLoading = ref(true)

const brandLogos = computed(() => brandResources.value.filter(r => r.categoria === 'logo'))
const brandLineas = computed(() => brandResources.value.filter(r => r.categoria === 'linea_grafica'))
const brandCatalogs = computed(() => brandResources.value.filter(r => r.categoria === 'catalogo'))

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

const showSummary = computed(() =>
  completionScore.value === 100 && hasBrandProfile.value && !isEditing.value
)

function editProfile() {
  isEditing.value = true
  wizardStep.value = 1
}

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

async function loadBrandResources() {
  resourcesLoading.value = true
  try {
    brandResources.value = await resourceService.getResources(workspaceId)
  } catch {
    // silent
  } finally {
    resourcesLoading.value = false
  }
}

async function uploadBrandResource(file: File, categoria: 'logo' | 'linea_grafica') {
  const accepted = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/avif']
  if (categoria === 'linea_grafica') accepted.push('application/pdf')
  if (!accepted.includes(file.type)) return
  if (file.size > 10 * 1024 * 1024) return
  resourceUploading.value = categoria
  try {
    const r = await resourceService.uploadResource(workspaceId, file, categoria)
    brandResources.value.push(r)
  } catch {} finally {
    resourceUploading.value = null
  }
}

function handleBrandResourceFile(e: Event, categoria: 'logo' | 'linea_grafica' | 'catalogo') {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  uploadBrandResource(input.files[0], categoria)
  input.value = ''
}

async function deleteBrandResource(resource: Resource) {
  try {
    await resourceService.deleteResource(workspaceId, resource._id)
    brandResources.value = brandResources.value.filter(r => r._id !== resource._id)
  } catch {}
}

onMounted(() => {
  load()
  loadBrandResources()
})
</script>

<template>
  <div class="bp-wrapper">
    <div class="bp-blob bp-blob--1"></div>
    <div class="bp-blob bp-blob--2"></div>
    <div class="bp-blob bp-blob--3"></div>
    <div class="bp bp-glass-container">

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
           CLIENT VIEW: summary or wizard
      ══════════════════════════════════════════════════════════════ -->
      <template v-if="isClientView">

        <!-- ── Summary (profile complete) ── -->
        <div v-if="showSummary" class="bp__summary">

          <!-- Header -->
          <div class="bp__summary-header">
            <div class="bp__summary-header__left">
              <div class="bp__summary-header__icon">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h2 class="bp__summary-header__title">Perfil de Marca</h2>
                <p class="bp__summary-header__desc">Información de tu negocio configurada para crear contenido personalizado.</p>
              </div>
            </div>
            <button class="bp__summary-edit-btn" type="button" @click="editProfile">
              <i class="fa-solid fa-pen-to-square"></i>
              Editar
            </button>
          </div>

          <!-- Sección 1: Tu negocio -->
          <div class="bp__summary-section">
            <div class="bp__summary-section__head">
              <i class="fa-solid fa-store" style="color: #3B5BDB"></i>
              <span>Tu negocio</span>
            </div>
            <div class="bp__summary-section__body">
              <div class="bp__summary-field">
                <span class="bp__summary-field__label">Descripción</span>
                <p class="bp__summary-field__value">{{ profile.descripcion }}</p>
              </div>
              <div v-if="profile.tipoNegocio || profile.vertical" class="bp__summary-field">
                <span class="bp__summary-field__label">Tipo / Industria</span>
                <p class="bp__summary-field__value">{{ [profile.tipoNegocio, profile.vertical].filter(Boolean).join(' · ') }}</p>
              </div>
            </div>
          </div>

          <!-- Sección 2: Audiencia y estrategia -->
          <div class="bp__summary-section">
            <div class="bp__summary-section__head">
              <i class="fa-solid fa-bullseye" style="color: #8B5CF6"></i>
              <span>Audiencia y estrategia</span>
            </div>
            <div class="bp__summary-section__body">
              <div v-if="profile.publicoObjetivo" class="bp__summary-field">
                <span class="bp__summary-field__label">Público objetivo</span>
                <p class="bp__summary-field__value">{{ profile.publicoObjetivo }}</p>
              </div>
              <div v-if="profile.propuestaValor" class="bp__summary-field">
                <span class="bp__summary-field__label">Propuesta de valor</span>
                <p class="bp__summary-field__value">{{ profile.propuestaValor }}</p>
              </div>
              <div v-if="profile.problemaResuelto" class="bp__summary-field">
                <span class="bp__summary-field__label">Problema que resuelves</span>
                <p class="bp__summary-field__value">{{ profile.problemaResuelto }}</p>
              </div>
              <div v-if="profile.tono" class="bp__summary-field">
                <span class="bp__summary-field__label">Tono de comunicación</span>
                <p class="bp__summary-field__value">{{ profile.tono }}</p>
              </div>
            </div>
          </div>

          <!-- Sección 3: Productos y captación -->
          <div class="bp__summary-section">
            <div class="bp__summary-section__head">
              <i class="fa-solid fa-tag" style="color: #10B981"></i>
              <span>Productos y captación</span>
            </div>
            <div class="bp__summary-section__body">
              <div v-if="profile.productosServicios" class="bp__summary-field">
                <span class="bp__summary-field__label">Productos / Servicios</span>
                <p class="bp__summary-field__value">{{ profile.productosServicios }}</p>
              </div>
              <div v-if="profile.trafficDirection" class="bp__summary-field">
                <span class="bp__summary-field__label">Dirección de tráfico</span>
                <p class="bp__summary-field__value">
                  <i :class="profile.trafficDirection === 'WHATSAPP' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-calendar-check'" style="margin-right: 0.35rem"></i>
                  {{ profile.trafficDirection === 'WHATSAPP' ? 'WhatsApp' : 'GHL / Agenda' }}
                  <span v-if="profile.trafficLink" style="color: #888; font-weight: 400; margin-left: 0.25rem">— {{ profile.trafficLink }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Sección 4: Archivos de contexto -->
          <div class="bp__summary-section">
            <div class="bp__summary-section__head">
              <i class="fa-solid fa-folder-open" style="color: #6366F1"></i>
              <span>Archivos de contexto</span>
            </div>
            <div class="bp__summary-section__body">
              <p v-if="(profile.archivos || []).length === 0" class="bp__summary-field__value" style="color: #aaa">Sin archivos</p>
              <div v-else class="bp__summary-files">
                <div v-for="f in profile.archivos" :key="f.publicId" class="bp__summary-file">
                  <i :class="f.tipo === 'application/pdf' ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'" style="color: #6366F1"></i>
                  <a :href="f.url" target="_blank">{{ f.nombre }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Recursos de Marca ── -->
          <div class="bp__summary-section bp__summary-section--resources">
            <div class="bp__summary-section__head">
              <i class="fa-solid fa-folder-open" style="color: #E8590C"></i>
              <span>Recursos de Marca</span>
            </div>
            <div class="bp__summary-section__body">
              <p class="bp__summary-section__desc">Sube aquí los archivos visuales de tu marca para que el equipo los use en tus materiales publicitarios.</p>
              <div class="bp__summary-resources-grid">
                <!-- Logo -->
                <div class="bp__summary-resource-card">
                  <div class="bp__summary-resource-card__head">
                    <i class="fa-solid fa-image" style="color: #3B5BDB"></i>
                    <div>
                      <strong>Logo</strong>
                      <span>{{ brandLogos.length }} archivo{{ brandLogos.length !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                  <label class="bp__summary-resource-card__btn" :class="{ 'is-loading': resourceUploading === 'logo' }">
                    <i :class="resourceUploading === 'logo' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                    {{ brandLogos.length ? 'Cambiar' : 'Subir logo' }}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" hidden @change="handleBrandResourceFile($event, 'logo')" :disabled="!!resourceUploading">
                  </label>
                  <div v-if="brandLogos.length" class="bp__summary-resource-card__files">
                    <div v-for="r in brandLogos" :key="r._id" class="bp__summary-resource-card__file">
                      <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                      <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                  </div>
                </div>
                <!-- Línea Gráfica -->
                <div class="bp__summary-resource-card">
                  <div class="bp__summary-resource-card__head">
                    <i class="fa-solid fa-pen-ruler" style="color: #8B5CF6"></i>
                    <div>
                      <strong>Línea Gráfica</strong>
                      <span>{{ brandLineas.length }} archivo{{ brandLineas.length !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                  <label class="bp__summary-resource-card__btn" :class="{ 'is-loading': resourceUploading === 'linea_grafica' }">
                    <i :class="resourceUploading === 'linea_grafica' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                    {{ brandLineas.length ? 'Cambiar' : 'Subir línea gráfica' }}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,application/pdf" hidden @change="handleBrandResourceFile($event, 'linea_grafica')" :disabled="!!resourceUploading">
                  </label>
                  <div v-if="brandLineas.length" class="bp__summary-resource-card__files">
                    <div v-for="r in brandLineas" :key="r._id" class="bp__summary-resource-card__file">
                      <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                      <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                  </div>
                </div>
                <!-- Catálogo (siempre visible) -->
                <div class="bp__summary-resource-card bp__summary-resource-card--highlight">
                  <div class="bp__summary-resource-card__head">
                    <i class="fa-solid fa-receipt" style="color: #E8590C"></i>
                    <div>
                      <strong>Catálogo / Lista de Precios</strong>
                      <span>{{ brandCatalogs.length }} archivo{{ brandCatalogs.length !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                  <label class="bp__summary-resource-card__btn" :class="{ 'is-loading': resourceUploading === 'catalogo' }">
                    <i :class="resourceUploading === 'catalogo' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                    {{ brandCatalogs.length ? 'Cambiar' : 'Subir catálogo' }}
                    <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden @change="handleBrandResourceFile($event, 'catalogo')" :disabled="!!resourceUploading">
                  </label>
                  <p class="bp__summary-resource-card__hint">Catálogo de productos, menú, lista de precios o servicios. Ayuda a la IA a generar guiones precisos.</p>
                  <div v-if="brandCatalogs.length" class="bp__summary-resource-card__files">
                    <div v-for="r in brandCatalogs" :key="r._id" class="bp__summary-resource-card__file">
                      <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                      <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Wizard ── -->
        <div v-else class="bp__wizard-container">

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

          <!-- Brand Resources (clients) -->
          <div v-if="saveSuccess" class="bp__brand-resources">
            <h3 class="bp__brand-resources-title">
              <i class="fa-solid fa-folder-open"></i>
              Recursos de Marca
            </h3>
            <p class="bp__brand-resources-desc">Sube aquí el logo y la línea gráfica de tu marca para que nuestro equipo los use en tus materiales.</p>
            <div class="bp__brand-resources-grid">
              <div class="bp__brand-resource-card">
                <div class="bp__brand-resource-card__icon">
                  <i class="fa-solid fa-image"></i>
                </div>
                <div class="bp__brand-resource-card__info">
                  <strong>Logo</strong>
                  <span>{{ brandLogos.length }} archivo{{ brandLogos.length !== 1 ? 's' : '' }}</span>
                </div>
                <label class="bp__brand-resource-btn" :class="{ 'is-loading': resourceUploading === 'logo' }">
                  <i :class="resourceUploading === 'logo' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" hidden @change="handleBrandResourceFile($event, 'logo')" :disabled="!!resourceUploading">
                </label>
                <div v-if="brandLogos.length" class="bp__brand-resource-card__files">
                  <div v-for="r in brandLogos" :key="r._id" class="bp__brand-resource-file">
                    <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                    <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                  </div>
                </div>
              </div>
              <div class="bp__brand-resource-card">
                <div class="bp__brand-resource-card__icon">
                  <i class="fa-solid fa-pen-ruler"></i>
                </div>
                <div class="bp__brand-resource-card__info">
                  <strong>Línea Gráfica</strong>
                  <span>{{ brandLineas.length }} archivo{{ brandLineas.length !== 1 ? 's' : '' }}</span>
                </div>
                <label class="bp__brand-resource-btn" :class="{ 'is-loading': resourceUploading === 'linea_grafica' }">
                  <i :class="resourceUploading === 'linea_grafica' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,application/pdf" hidden @change="handleBrandResourceFile($event, 'linea_grafica')" :disabled="!!resourceUploading">
                </label>
                <div v-if="brandLineas.length" class="bp__brand-resource-card__files">
                  <div v-for="r in brandLineas" :key="r._id" class="bp__brand-resource-file">
                    <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                    <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>

      <!-- ══════════════════════════════════════════════════════════
           ADMIN/INTERNAL VIEW: flat single-column
      ══════════════════════════════════════════════════════════════ -->
      <div v-if="!isClientView" class="bp__content">

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

        <!-- ── Card 5: Recursos de Marca ── -->
        <div class="bp__card">
          <div class="bp__card-header">
            <div class="bp__card-icon bp__card-icon--blue">
              <i class="fa-solid fa-folder-open" />
            </div>
            <div>
              <h3>Recursos de Marca</h3>
              <p>Logo y línea gráfica para que el equipo de contenido los utilice</p>
            </div>
          </div>
          <div class="bp__brand-resources-grid bp__brand-resources-grid--admin">
            <div class="bp__brand-resource-card">
              <div class="bp__brand-resource-card__icon">
                <i class="fa-solid fa-image"></i>
              </div>
              <div class="bp__brand-resource-card__info">
                <strong>Logo</strong>
                <span>{{ brandLogos.length }} archivo{{ brandLogos.length !== 1 ? 's' : '' }}</span>
              </div>
              <label class="bp__brand-resource-btn" :class="{ 'is-loading': resourceUploading === 'logo' }">
                <i :class="resourceUploading === 'logo' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" hidden @change="handleBrandResourceFile($event, 'logo')" :disabled="!!resourceUploading">
              </label>
              <div v-if="brandLogos.length" class="bp__brand-resource-card__files">
                <div v-for="r in brandLogos" :key="r._id" class="bp__brand-resource-file">
                  <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                  <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                </div>
              </div>
            </div>
            <div class="bp__brand-resource-card">
              <div class="bp__brand-resource-card__icon">
                <i class="fa-solid fa-pen-ruler"></i>
              </div>
              <div class="bp__brand-resource-card__info">
                <strong>Línea Gráfica</strong>
                <span>{{ brandLineas.length }} archivo{{ brandLineas.length !== 1 ? 's' : '' }}</span>
              </div>
              <label class="bp__brand-resource-btn" :class="{ 'is-loading': resourceUploading === 'linea_grafica' }">
                <i :class="resourceUploading === 'linea_grafica' ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'"></i>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,application/pdf" hidden @change="handleBrandResourceFile($event, 'linea_grafica')" :disabled="!!resourceUploading">
              </label>
              <div v-if="brandLineas.length" class="bp__brand-resource-card__files">
                <div v-for="r in brandLineas" :key="r._id" class="bp__brand-resource-file">
                  <a :href="r.url" target="_blank">{{ r.nombre }}</a>
                  <button @click="deleteBrandResource(r)"><i class="fa-solid fa-xmark"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bp-wrapper {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

/* Animated Background Blobs */
.bp-blob {
  position: absolute;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
  animation: floatBlobs 20s ease-in-out infinite alternate;
  
  &--1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba($primary, 0.4) 0%, rgba($primary, 0) 70%);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
  }
  
  &--2 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0) 70%);
    bottom: -200px;
    right: -100px;
    animation-delay: -5s;
  }
  
  &--3 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0) 70%);
    top: 40%;
    left: 40%;
    animation-delay: -10s;
  }
}

@keyframes floatBlobs {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 50px) scale(1.1); }
  100% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Glassmorphism Container */
.bp-glass-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 32px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bp {
  padding: 0 0 4rem;
  width: 100%;

  // ── Page header ───────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 2.5rem 3rem 2rem;
    border-bottom: 1px solid rgba($primary-dark, 0.04);
    flex-wrap: wrap;

    @media (max-width: 768px) { padding: 1.5rem 1.5rem; }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  &__header-icon-wrap {
    width: 54px; height: 54px;
    border-radius: 16px;
    background: linear-gradient(135deg, $primary 0%, #c91e4c 100%);
    box-shadow: 0 10px 20px rgba($primary, 0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    i { font-size: 1.4rem; color: #fff; }
  }

  &__title {
    font-size: 1.75rem;
    font-weight: 900;
    color: $primary-dark;
    margin: 0 0 0.2rem;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, $primary-dark, #1f2937);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    font-size: 0.95rem;
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    box-shadow: 0 4px 10px rgba(0,0,0,0.03);

    &--ok {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      color: #16a34a;
      border: 1px solid rgba(#22c55e, 0.2);
      i { color: #22c55e; }
    }
    &--warn {
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      color: #b45309;
      border: 1px solid rgba(#f59e0b, 0.2);
      i { color: #f59e0b; }
    }
  }

  &__edit-btn, &__cancel-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__edit-btn {
    border: 1.5px solid rgba($primary-dark, 0.1);
    background: rgba(255,255,255,0.5);
    color: $primary-dark;
    &:hover { 
      border-color: $primary; 
      color: $primary; 
      background: $white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  }

  &__cancel-btn {
    border: 1.5px solid transparent;
    background: rgba(#ef4444, 0.05);
    color: #ef4444;
    &:hover { 
      background: rgba(#ef4444, 0.1); 
      transform: translateY(-2px);
    }
  }

  &__save-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.5rem;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 16px rgba($primary, 0.25);

    &:hover:not(:disabled) { 
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba($primary, 0.3);
    }
    &:active:not(:disabled) { transform: translateY(0); }
    &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
    &.is-success { 
      background: linear-gradient(135deg, #22c55e, #16a34a); 
      box-shadow: 0 8px 16px rgba(#22c55e, 0.25);
    }
  }

  // ── Progress bar ───────────────────────────────────────────────
  &__progress-wrap {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.25rem 3rem;
    border-bottom: 1px solid rgba($primary-dark, 0.04);
    background: rgba(255, 255, 255, 0.3);

    @media (max-width: 768px) { padding: 1rem 1.5rem; }
  }

  &__progress-bar {
    flex: 1;
    height: 8px;
    background: rgba($primary-dark, 0.06);
    border-radius: 99px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary, #f43f5e);
    border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba($primary, 0.4);

    &.is-complete { 
      background: linear-gradient(90deg, #34d399, #10b981); 
      box-shadow: 0 0 10px rgba(#10b981, 0.4);
    }
  }

  &__progress-label {
    font-size: 0.8rem;
    font-weight: 800;
    color: #475569;
    white-space: nowrap;
  }

  // ── Notices ─────────────────────────────────────────────────────
  &__notice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem 3rem;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);

    @media (max-width: 768px) { margin: 1rem 1.5rem; }

    &--error {
      background: rgba(#fef2f2, 0.8);
      border: 1px solid rgba(#f87171, 0.3);
      color: #b91c1c;
      i { color: #ef4444; font-size: 1.1rem; }
    }
  }

  // ── Loading ────────────────────────────────────────────────────
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 6rem 2.5rem;
    color: #64748b;
    font-size: 1.1rem;
    font-weight: 600;
  }

  &__spinner {
    width: 32px; height: 32px;
    border: 3px solid rgba($primary, 0.1);
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  // ── Cards (Admin/Internal) ─────────────────────────────────────
  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2.5rem 3rem;

    @media (max-width: 768px) { padding: 1.5rem; gap: 1.5rem; }
  }

  &__card {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 1);
    border-radius: 24px;
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
    }
    
    @media (max-width: 768px) { padding: 1.5rem; }
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 0.5rem;

    h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: $primary-dark;
      margin: 0 0 0.3rem;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
  }

  &__card-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    i { font-size: 1.2rem; color: #fff; }

    &--blue   { background: linear-gradient(135deg, #60a5fa, #3b82f6); box-shadow: 0 8px 16px rgba(#3b82f6, 0.25); }
    &--purple { background: linear-gradient(135deg, #c084fc, #9333ea); box-shadow: 0 8px 16px rgba(#9333ea, 0.25); }
    &--green  { background: linear-gradient(135deg, #34d399, #10b981); box-shadow: 0 8px 16px rgba(#10b981, 0.25); }
    &--orange { background: linear-gradient(135deg, #fbbf24, #f59e0b); box-shadow: 0 8px 16px rgba(#f59e0b, 0.25); }
    &--indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); box-shadow: 0 8px 16px rgba(#4f46e5, 0.25); }
  }

  // ── Fields ─────────────────────────────────────────────────────
  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;

    label {
      font-size: 0.78rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    input, textarea {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 2px solid rgba(#cbd5e1, 0.5);
      border-radius: 14px;
      font-size: 0.95rem;
      color: #1e293b;
      background: rgba(255, 255, 255, 0.6);
      font-family: inherit;
      line-height: 1.6;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: $primary;
        background: $white;
        box-shadow: 0 0 0 4px rgba($primary, 0.15);
      }
      &:disabled {
        background: rgba(#f1f5f9, 0.5);
        color: #94a3b8;
        cursor: not-allowed;
        border-color: rgba(#cbd5e1, 0.3);
      }
      &::placeholder {
        color: #94a3b8;
      }
    }
    textarea { resize: vertical; min-height: 100px; }
  }

  &__req {
    font-size: 0.65rem;
    font-weight: 700;
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    text-transform: none;
    letter-spacing: 0;
  }

  &__hint {
    font-size: 0.7rem;
    font-weight: 500;
    color: #64748b;
    text-transform: none;
    letter-spacing: 0;
  }

  &__row {
    display: flex;
    gap: 1.5rem;

    @media (max-width: 640px) { flex-direction: column; }
  }

  // ── Toggle group ──────────────────────────────────────────────
  &__toggle-group {
    display: flex;
    gap: 0.75rem;
    background: rgba(241, 245, 249, 0.5);
    padding: 0.4rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  &__toggle {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 12px;
    background: transparent;
    font-size: 0.9rem;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &:hover:not(:disabled) { 
      color: $primary; 
      background: rgba($primary, 0.05);
    }
    &.is-active { 
      background: $white; 
      color: $primary; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    &:disabled { cursor: not-allowed; opacity: 0.55; }
  }

  // ── Tooltip ───────────────────────────────────────────────────
  &__tooltip-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;

    i { font-size: 0.8rem; color: #94a3b8; cursor: help; transition: color 0.2s; }
    &:hover i { color: $primary; }

    &:hover .bp__tooltip { opacity: 1; transform: translateY(0) scale(1); }
  }

  &__tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(-10px) scale(0.95);
    transform-origin: bottom center;
    background: #1e293b;
    color: $white;
    min-width: 200px;
    max-width: 250px;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    line-height: 1.5;
    opacity: 0;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 20;
    text-transform: none;
    letter-spacing: 0;
    white-space: normal;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 6px;
      border-style: solid;
      border-color: #1e293b transparent transparent transparent;
    }
  }

  // ── Tone picker ───────────────────────────────────────────────
  &__tone-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  &__tone-btn {
    padding: 0.6rem 1.25rem;
    border: 2px solid rgba(#cbd5e1, 0.4);
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
    background: $white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &:hover:not(:disabled) { 
      border-color: rgba($primary, 0.5); 
      color: $primary; 
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba($primary, 0.1);
    }
    &.is-active { 
      background: linear-gradient(135deg, $primary, darken($primary, 10%)); 
      border-color: transparent; 
      color: #fff; 
      box-shadow: 0 6px 15px rgba($primary, 0.25);
    }
    &:disabled { cursor: not-allowed; opacity: 0.55; }

    &--custom {
      border-style: dashed;
      &:hover:not(:disabled) { border-color: #a855f7; color: #a855f7; }
      &.is-active { 
        background: linear-gradient(135deg, #c084fc, #9333ea); 
        border-color: transparent; 
        color: #fff; 
        border-style: solid; 
        box-shadow: 0 6px 15px rgba(#9333ea, 0.25);
      }
    }
  }

  &__tone-custom-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.75rem;
    padding: 0.2rem 0.75rem;
    border-radius: 8px;
    background: rgba(#a855f7, 0.1);
    color: #9333ea;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: none;
    letter-spacing: 0;
    i { font-size: 0.7rem; }
  }

  &__tone-custom-wrap {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__tone-custom-display {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    border: 2px solid rgba(#a855f7, 0.3);
    background: rgba(#a855f7, 0.05);
    color: #7c3aed;
    font-size: 0.95rem;
    font-weight: 600;
    i { font-size: 0.9rem; opacity: 0.8; }
  }

  &__tone-custom-input {
    width: 100%;
    padding: 0.8rem 1.25rem;
    border: 2px solid rgba(#a855f7, 0.5);
    border-radius: 12px;
    font-size: 0.95rem;
    color: #1e293b;
    font-family: inherit;
    background: $white;
    transition: all 0.3s ease;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #9333ea;
      box-shadow: 0 0 0 4px rgba(#a855f7, 0.15);
    }
    &::placeholder { color: #94a3b8; font-style: italic; }
  }

  &__tone-custom-hint {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    line-height: 1.5;
    i { color: #9333ea; font-size: 0.8rem; flex-shrink: 0; margin-top: 0.2rem; }
    em { color: #1e293b; font-style: italic; font-weight: 600; }
  }

  // ── Transitions ────────────────────────────────────────────────
  .bp-tone-input-enter-active,
  .bp-tone-input-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .bp-tone-input-enter-from,
  .bp-tone-input-leave-to { opacity: 0; transform: translateY(-10px); }

  .bp-success-enter-active,
  .bp-success-leave-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .bp-success-enter-from,
  .bp-success-leave-to { opacity: 0; transform: translateY(15px) scale(0.95); }

  // ── Dropzone & files ───────────────────────────────────────────
  &__dropzone {
    border: 2px dashed rgba(#94a3b8, 0.5);
    border-radius: 16px;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    background: rgba(255, 255, 255, 0.5);

    i { font-size: 2.5rem; color: #94a3b8; transition: color 0.3s; margin-bottom: 0.5rem; }
    span { font-size: 1rem; font-weight: 700; color: #334155; }
    small { font-size: 0.8rem; color: #64748b; }
    input { display: none; }

    &:hover, &.is-dragging { 
      border-color: $primary; 
      background: rgba($primary, 0.02); 
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.02);
      i { color: $primary; transform: scale(1.1); } 
    }
    &.is-uploading { pointer-events: none; opacity: 0.8; }
  }

  &__file-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    background: $white;
    border: 1px solid rgba(#cbd5e1, 0.5);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    transition: transform 0.2s, box-shadow 0.2s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  }

  &__file-type-icon {
    font-size: 1.5rem;
    color: $primary;
    flex-shrink: 0;
  }

  &__file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    span {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    a {
      font-size: 0.75rem;
      color: $primary;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      &:hover { text-decoration: underline; }
      i { font-size: 0.7rem; }
    }
  }

  &__file-delete {
    width: 36px; height: 36px;
    border: none; border-radius: 10px;
    background: rgba(#ef4444, 0.05);
    color: #ef4444;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem;
    transition: all 0.2s;
    flex-shrink: 0;
    &:hover { background: rgba(#ef4444, 0.15); transform: scale(1.05); }
  }

  &__no-files {
    font-size: 0.9rem;
    color: #64748b;
    font-style: italic;
    margin: 0;
    text-align: center;
    padding: 1rem 0;
  }

  // ── CLIENT WIZARD ──────────────────────────────────────────────
  &__wizard-container {
    padding: 3rem 4rem;

    @media (max-width: 768px) { padding: 2rem 1.5rem; }
  }

  &__step-indicator {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    margin-bottom: 4rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;

    &::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 12.5%;
      right: 12.5%;
      height: 4px;
      background: rgba(#cbd5e1, 0.5);
      border-radius: 4px;
      z-index: 0;
    }
  }

  &__step-dot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    cursor: pointer;
    position: relative;
    z-index: 1;

    &-circle {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 4px solid #e2e8f0;
      background: $white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      font-weight: 800;
      color: #94a3b8;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    &-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-align: center;
      transition: color 0.3s;
      max-width: 100px;
      line-height: 1.4;
    }

    &.is-active {
      .bp__step-dot-circle {
        border-color: $primary;
        background: $primary;
        color: $white;
        box-shadow: 0 0 0 6px rgba($primary, 0.15), 0 8px 16px rgba($primary, 0.3);
        transform: scale(1.1);
      }
      .bp__step-dot-label { color: $primary-dark; font-weight: 800; }
    }

    &.is-done {
      .bp__step-dot-circle {
        border-color: #10b981;
        background: #10b981;
        color: $white;
        box-shadow: 0 4px 10px rgba(#10b981, 0.2);
      }
      .bp__step-dot-label { color: #10b981; }
    }
  }

  &__step {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
    animation: fadeSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  &__step-why {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, rgba($primary, 0.05), rgba($primary, 0.02));
    border: 1px solid rgba($primary, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba($primary, 0.03);

    i {
      color: $primary;
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
      filter: drop-shadow(0 2px 4px rgba($primary, 0.2));
    }

    span {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.6;
    }
  }

  &__step-nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }

  &__step-back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: 2px solid rgba(#cbd5e1, 0.5);
    border-radius: 12px;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    transition: all 0.3s;

    &:hover { border-color: $primary; color: $primary; background: rgba($primary, 0.02); transform: translateY(-1px); }
  }

  &__step-next {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.75rem;
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 20px rgba($primary, 0.25);

    &:hover:not(:disabled) { 
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba($primary, 0.35);
    }
    &:active:not(:disabled) { transform: translateY(0); }
    &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
  }

  &__step-finish {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.75rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: $white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 20px rgba(#10b981, 0.3);

    &:hover:not(:disabled) { 
      transform: translateY(-2px);
      box-shadow: 0 12px 25px rgba(#10b981, 0.4);
    }
    &:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
    &.is-success { background: #059669; }
  }

  &__wizard-success {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(#10b981, 0.1), rgba(#059669, 0.05));
    border: 1px solid rgba(#10b981, 0.25);
    border-radius: 16px;
    margin-top: 1rem;
    box-shadow: 0 10px 30px rgba(#10b981, 0.1);

    > i {
      color: #10b981;
      font-size: 2rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    strong {
      display: block;
      font-size: 1.1rem;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 0.3rem;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.5;
    }
  }
}

// ── Brand Resources ──────────────────────────────────────
.bp__brand-resources {
  margin-top: 1.5rem;

  &-title {
    font-size: 1rem;
    font-weight: 700;
    color: $primary-dark;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.3rem;

    i { color: $primary; }
  }

  &-desc {
    font-size: 0.82rem;
    color: $text-secondary;
    margin: 0 0 1rem;
  }
}

.bp__brand-resources-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;

  &--admin {
    margin-top: 0.5rem;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.bp__brand-resource-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  background: $white;
  border: 1px solid rgba($primary-dark, 0.07);
  border-radius: 12px;
  position: relative;
  flex-wrap: wrap;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: $primary-light;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      font-size: 0.9rem;
      color: $primary;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-size: 0.82rem;
      color: $primary-dark;
    }

    span {
      font-size: 0.7rem;
      color: $text-secondary;
    }
  }

  &__files {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-top: 0.4rem;
    border-top: 1px solid rgba($primary-dark, 0.05);
  }
}

.bp__brand-resource-file {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;

  a {
    color: $primary;
    text-decoration: none;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  button {
    background: none;
    border: none;
    color: $text-secondary;
    cursor: pointer;
    padding: 2px;
    font-size: 0.7rem;
    flex-shrink: 0;

    &:hover { color: $alert-error; }
  }
}

.bp__brand-resource-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba($primary, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;

  &:hover {
    background: rgba($primary, 0.15);
  }

  i {
    color: $primary;
    font-size: 0.85rem;
  }

  &.is-loading {
    opacity: 0.6;
    pointer-events: none;
  }

  input[type="file"] { display: none; }
}

/* ── Summary ──────────────────────────────────────────── */

.bp__summary {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.bp__summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;

  &__left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba($alert-success, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    i {
      color: $alert-success;
      font-size: 1.15rem;
    }
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  &__desc {
    font-size: 0.8rem;
    color: $text-secondary;
    margin: 0.1rem 0 0;
  }
}

.bp__summary-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba($primary, 0.25);
  background: rgba($primary, 0.08);
  color: $primary;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    background: rgba($primary, 0.15);
    border-color: rgba($primary, 0.4);
  }
}

.bp__summary-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;

    i { font-size: 0.95rem; }
  }

  &__body {
    padding: 1rem 1.25rem;
  }

  &__desc {
    font-size: 0.8rem;
    color: $text-secondary;
    margin: 0 0 1rem;
  }
}

.bp__summary-section--resources {
  border-color: rgba(#E8590C, 0.15);
  background: rgba(#E8590C, 0.03);
}

.bp__summary-field {
  & + & { margin-top: 0.85rem; }
}

.bp__summary-field__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 500;
  color: $text-secondary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
}

.bp__summary-field__value {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.bp__summary-files {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bp__summary-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;

  i { font-size: 0.9rem; }

  a {
    color: $primary;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

/* ── Summary Resource Cards ── */

.bp__summary-resources-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.bp__summary-resource-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    i { font-size: 1rem; }

    strong {
      display: block;
      font-size: 0.85rem;
      color: #fff;
      font-weight: 600;
    }

    span {
      font-size: 0.75rem;
      color: $text-secondary;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    background: rgba($primary, 0.08);
    color: $primary;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    align-self: flex-start;
    transition: all 0.15s;

    &:hover {
      background: rgba($primary, 0.15);
    }

    i { font-size: 0.8rem; }

    &.is-loading {
      opacity: 0.6;
      pointer-events: none;
    }

    input[type="file"] { display: none; }
  }

  &__hint {
    font-size: 0.75rem;
    color: $text-secondary;
    margin: 0;
    line-height: 1.4;
  }

  &__files {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__file {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;

    a {
      color: $primary;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    button {
      background: none;
      border: none;
      color: $text-secondary;
      cursor: pointer;
      padding: 1px;
      font-size: 0.7rem;
      flex-shrink: 0;
      &:hover { color: $alert-error; }
    }
  }
}

.bp__summary-resource-card--highlight {
  border-color: rgba(#E8590C, 0.25);
  background: rgba(#E8590C, 0.05);

  .bp__summary-resource-card__btn {
    background: rgba(#E8590C, 0.12);
    color: #E8590C;
    &:hover { background: rgba(#E8590C, 0.2); }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>