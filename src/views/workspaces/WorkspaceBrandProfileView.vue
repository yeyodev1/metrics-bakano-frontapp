<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBrandProfile } from './brandProfile/useBrandProfile'
import { useBrandResources, type ResourceCategory } from './brandProfile/useBrandResources'
import type { Resource } from '@/types'
import BrandProfileInternalView from './brandProfile/sections/BrandProfileInternalView.vue'
import ClientProfileSummary from './brandProfile/sections/ClientProfileSummary.vue'
import ClientProfileWizard from './brandProfile/sections/ClientProfileWizard.vue'

const route = useRoute()
const workspaceId = route.params['workspaceId'] as string

const {
  profile,
  loading,
  saving,
  uploading,
  saveSuccess,
  error,
  isEditing,
  isClientView,
  completionScore,
  hasBrandProfile,
  showSummary,
  load,
  save,
  saveStep: persistStep,
  cancelEdit,
  uploadFiles: handleFileUpload,
  deleteFile,
} = useBrandProfile(workspaceId)

const resources = useBrandResources(workspaceId)

const brandLogos = resources.logos
const brandLineas = resources.lineas
const brandCatalogs = resources.catalogs
const resourceUploading = resources.uploadingCategory

const handleBrandResourceFile = (e: Event, categoria: ResourceCategory) =>
  resources.handleInput(e, categoria)
const deleteBrandResource = (r: Resource) => resources.remove(r)

// ── Local UI state ──────────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const wizardStep = ref(1)

function onDrop(e: DragEvent) {
  dragOver.value = false
  handleFileUpload(e.dataTransfer?.files || null)
}

/** The wizard owns its own step; the composable only persists. */
const saveStep = (next?: number) => persistStep(next, (n) => { wizardStep.value = n })

function editProfile() {
  isEditing.value = true
  wizardStep.value = 1
}

// ── Tone ────────────────────────────────────────────────────────────────
const PRESET_TONES = ['Profesional', 'Cercano', 'Divertido', 'Aspiracional', 'Educativo', 'Inspirador']

const isCustomTone = computed(
  () => !!profile.value.tono && !PRESET_TONES.includes(profile.value.tono)
)

function selectTone(t: string) {
  if (!isEditing.value) return
  profile.value.tono = profile.value.tono === t ? '' : t
}

function activateCustomTone() {
  if (!isEditing.value) return
  if (PRESET_TONES.includes(profile.value.tono || '')) profile.value.tono = ''
}

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

onMounted(() => {
  load()
  resources.load()
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
        <ClientProfileSummary
          v-if="showSummary"
          v-model:profile="profile"
          :wizard-step="wizardStep"
          :saving="saving"
          :save-success="saveSuccess"
          :wizard-steps="WIZARD_STEPS"
          :completion-score="completionScore"
          :preset-tones="PRESET_TONES"
          :brand-logos="brandLogos"
          :brand-lineas="brandLineas"
          :brand-catalogs="brandCatalogs"
          :resource-uploading="resourceUploading"
          :is-custom-tone="isCustomTone"
          :uploading="uploading"
          :drag-over="dragOver"
          @select-tone="selectTone"
          @activate-custom-tone="activateCustomTone"
          @upload-files="handleFileUpload"
          @drop="onDrop"
          @update:drag-over="dragOver = $event"
          @delete-file="deleteFile"
          @resource-file="handleBrandResourceFile"
          @delete-resource="deleteBrandResource"
          @edit-profile="editProfile"
          @save-step="saveStep"
          @update:wizard-step="wizardStep = $event"
        />

        <ClientProfileWizard
          v-else
          v-model:profile="profile"
          :wizard-step="wizardStep"
          :saving="saving"
          :save-success="saveSuccess"
          :wizard-steps="WIZARD_STEPS"
          :completion-score="completionScore"
          :preset-tones="PRESET_TONES"
          :brand-logos="brandLogos"
          :brand-lineas="brandLineas"
          :brand-catalogs="brandCatalogs"
          :resource-uploading="resourceUploading"
          :is-custom-tone="isCustomTone"
          :uploading="uploading"
          :drag-over="dragOver"
          @select-tone="selectTone"
          @activate-custom-tone="activateCustomTone"
          @upload-files="handleFileUpload"
          @drop="onDrop"
          @update:drag-over="dragOver = $event"
          @delete-file="deleteFile"
          @resource-file="handleBrandResourceFile"
          @delete-resource="deleteBrandResource"
          @edit-profile="editProfile"
          @save-step="saveStep"
          @update:wizard-step="wizardStep = $event"
        />

      </template>

      <!-- Internal/admin view -->
      <BrandProfileInternalView
        v-if="!isClientView"
        v-model:profile="profile"
        :is-editing="isEditing"
        :uploading="uploading"
        :drag-over="dragOver"
        :is-custom-tone="isCustomTone"
        :preset-tones="PRESET_TONES"
        :brand-logos="brandLogos"
        :brand-lineas="brandLineas"
        :brand-catalogs="brandCatalogs"
        :resource-uploading="resourceUploading"
        @select-tone="selectTone"
        @activate-custom-tone="activateCustomTone"
        @upload-files="handleFileUpload"
        @drop="onDrop"
        @update:drag-over="dragOver = $event"
        @delete-file="deleteFile"
        @resource-file="handleBrandResourceFile"
        @delete-resource="deleteBrandResource"
      />

    </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './brandProfile/profileStyles.scss';
</style>
