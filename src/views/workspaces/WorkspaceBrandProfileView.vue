<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile, BrandProfileFile } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const workspaceId = route.params.workspaceId as string

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

const PRESET_TONES = ['Profesional', 'Cercano', 'Divertido', 'Aspiracional', 'Educativo', 'Inspirador']

const isCustomTone = computed(() =>
  !!profile.value.tono && !PRESET_TONES.includes(profile.value.tono)
)

function selectTone(t: string) {
  if (!isEditing.value) return
  profile.value.tono = profile.value.tono === t ? '' : t
}

function activateCustomTone() {
  if (!isEditing.value) return
  // Clear preset selection so the user can type freely
  if (PRESET_TONES.includes(profile.value.tono || '')) {
    profile.value.tono = ''
  }
}

const canEdit = computed(() =>
  userStore.role === 'superadmin' ||
  ['community_manager', 'content_manager'].includes(userStore.internalRole || '')
)

const hasBrandProfile = computed(() =>
  !!(profile.value.descripcion?.trim() || (profile.value.archivos?.length ?? 0) > 0)
)

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
          <p class="bp__subtitle">Contexto del cliente para que la IA genere guiones personalizados</p>
        </div>
      </div>
      <div class="bp__header-right">
        <span v-if="hasBrandProfile" class="bp__badge bp__badge--ok">
          <i class="fa-solid fa-circle-check" /> Perfil configurado
        </span>
        <span v-else class="bp__badge bp__badge--warn">
          <i class="fa-solid fa-triangle-exclamation" /> Sin configurar
        </span>

        <!-- Edit mode: Cancel + Save grouped together -->
        <div v-if="canEdit && isEditing" class="bp__header-actions">
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

        <!-- View mode: Editar button -->
        <button
          v-else-if="canEdit"
          class="bp__edit-btn"
          type="button"
          @click="isEditing = true"
        >
          <i class="fa-solid fa-pen-to-square" /> Editar
        </button>
      </div>
    </div>

    <!-- ── Readonly notice ────────────────────────────────────── -->
    <div v-if="!canEdit" class="bp__notice bp__notice--lock">
      <i class="fa-solid fa-lock" />
      <span>Solo el Community Manager, Content Manager o Superadmin pueden editar este perfil.</span>
    </div>

    <!-- ── Loading ────────────────────────────────────────────── -->
    <div v-if="loading" class="bp__loading">
      <div class="bp__spinner" />
      <span>Cargando perfil de marca...</span>
    </div>

    <template v-else>
      <!-- ── Error ─────────────────────────────────────────────── -->
      <div v-if="error" class="bp__notice bp__notice--error">
        <i class="fa-solid fa-triangle-exclamation" /> {{ error }}
      </div>

      <!-- ── Two-column body ───────────────────────────────────── -->
      <div class="bp__body">

        <!-- LEFT: form cards -->
        <div class="bp__main">

          <!-- Card 1 – Identidad del negocio -->
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

          <!-- Card 2 – Audiencia y estrategia -->
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
                  placeholder="Ej: Mujeres de 28-45 años en Guayaquil, profesionales, interesadas en bienestar y nutrición..."
                />
              </div>
              <div class="bp__field">
                <label>Problema principal que resuelven <span class="bp__req">clave para IA</span></label>
                <textarea
                  v-model="profile.problemaResuelto"
                  :disabled="!isEditing"
                  rows="3"
                  placeholder="Ej: Las personas no saben cómo comer saludable con poco tiempo..."
                />
              </div>
            </div>

            <div class="bp__field">
              <label>Propuesta de valor única <span class="bp__req">clave para IA</span></label>
              <textarea
                v-model="profile.propuestaValor"
                :disabled="!isEditing"
                rows="3"
                placeholder="Ej: Somos la única clínica en Quito que garantiza resultados en 3 sesiones o te devolvemos el dinero..."
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
                  <i class="fa-solid fa-plus" />
                  Otro
                </button>
              </div>
              <transition name="bp-tone-input">
                <div v-if="isCustomTone || (isEditing && !profile.tono)" class="bp__tone-custom-wrap">
                  <!-- Read mode: show the saved custom value -->
                  <div v-if="!isEditing && isCustomTone" class="bp__tone-custom-display">
                    <i class="fa-solid fa-pen-nib" />
                    {{ profile.tono }}
                  </div>

                  <!-- Edit mode: editable input -->
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

          <!-- Card 3 – Oferta y CTA -->
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--green">
                <i class="fa-solid fa-tags" />
              </div>
              <div>
                <h3>Oferta y llamado a la acción</h3>
                <p>Qué venden, a qué precio y a dónde dirigen el tráfico</p>
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

        </div>

        <!-- RIGHT: sidebar -->
        <div class="bp__sidebar">

          <!-- Completion status -->
          <div class="bp__card bp__card--sticky">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--orange">
                <i class="fa-solid fa-chart-pie" />
              </div>
              <div>
                <h3>Completitud del perfil</h3>
                <p>Más info = mejores guiones</p>
              </div>
            </div>
            <ul class="bp__checklist">
              <li :class="{ 'is-done': profile.descripcion?.trim() }">
                <i :class="profile.descripcion?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Descripción del negocio
              </li>
              <li :class="{ 'is-done': profile.tipoNegocio }">
                <i :class="profile.tipoNegocio ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Tipo de negocio
              </li>
              <li :class="{ 'is-done': profile.vertical?.trim() }">
                <i :class="profile.vertical?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Vertical / Industria
              </li>
              <li :class="{ 'is-done': profile.publicoObjetivo?.trim() }">
                <i :class="profile.publicoObjetivo?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Público objetivo
              </li>
              <li :class="{ 'is-done': profile.problemaResuelto?.trim() }">
                <i :class="profile.problemaResuelto?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Problema que resuelven
              </li>
              <li :class="{ 'is-done': profile.propuestaValor?.trim() }">
                <i :class="profile.propuestaValor?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Propuesta de valor
              </li>
              <li :class="{ 'is-done': profile.tono?.trim() }">
                <i :class="profile.tono?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Tono de comunicación
              </li>
              <li :class="{ 'is-done': profile.productosServicios?.trim() }">
                <i :class="profile.productosServicios?.trim() ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Productos / Servicios
              </li>
              <li :class="{ 'is-done': profile.trafficDirection }">
                <i :class="profile.trafficDirection ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Dirección de tráfico
              </li>
              <li :class="{ 'is-done': (profile.archivos?.length ?? 0) > 0 }">
                <i :class="(profile.archivos?.length ?? 0) > 0 ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'" />
                Archivos de contexto
              </li>
            </ul>
          </div>

          <!-- File upload -->
          <div class="bp__card">
            <div class="bp__card-header">
              <div class="bp__card-icon bp__card-icon--indigo">
                <i class="fa-solid fa-folder-open" />
              </div>
              <div>
                <h3>Archivos de contexto</h3>
                <p>Menú, catálogo, brief, precios...</p>
              </div>
            </div>

            <div
              v-if="canEdit"
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
                <button v-if="canEdit" class="bp__file-delete" type="button" @click="deleteFile(file)">
                  <i class="fa-solid fa-trash" />
                </button>
              </div>
            </div>
            <p v-else class="bp__no-files">No hay archivos cargados.</p>
          </div>

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
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, $primary, #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6px 16px rgba($primary, 0.3);
    i { font-size: 1.25rem; color: #fff; }
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 800;
    color: $primary-dark;
    margin: 0 0 0.2rem;
    line-height: 1.2;
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
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.4rem 0.85rem;
    border-radius: 20px;

    &--ok {
      background: rgba(#22c55e, 0.1);
      color: #15803d;
      border: 1px solid rgba(#22c55e, 0.25);
    }
    &--warn {
      background: rgba(#f59e0b, 0.1);
      color: #92400e;
      border: 1px solid rgba(#f59e0b, 0.25);
    }
  }

  &__save-btn {
    padding: 0.6rem 1.35rem;
    border: none;
    border-radius: 10px;
    background: $primary;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba($primary, 0.25);

    &:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
    &.is-success { background: #22c55e; box-shadow: 0 4px 12px rgba(#22c55e, 0.3); }
  }

  &__edit-btn {
    padding: 0.6rem 1.35rem;
    border: 1.5px solid $primary;
    border-radius: 10px;
    background: transparent;
    color: $primary;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    transition: all 0.2s;

    &:hover { background: rgba($primary, 0.06); transform: translateY(-1px); }
  }

  &__cancel-btn {
    padding: 0.6rem 1.1rem;
    border: 1.5px solid rgba($primary-dark, 0.18);
    border-radius: 10px;
    background: transparent;
    color: rgba($primary-dark, 0.6);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;

    &:hover { border-color: rgba($primary-dark, 0.35); color: $primary-dark; }
  }

  // ── Notices ────────────────────────────────────────────────────
  &__notice {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 2.5rem;
    font-size: 0.82rem;

    @media (max-width: 768px) { padding: 0.75rem 1.25rem; }

    &--lock {
      background: rgba($primary-dark, 0.03);
      border-bottom: 1px solid rgba($primary-dark, 0.06);
      color: $text-secondary;
      i { color: $primary-dark; }
    }

    &--error {
      background: rgba(#ef4444, 0.06);
      border-bottom: 1px solid rgba(#ef4444, 0.15);
      color: #b91c1c;
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

  // ── Two-column body ────────────────────────────────────────────
  &__body {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.75rem;
    padding: 2rem 2.5rem;
    align-items: start;

    @media (max-width: 1100px) { grid-template-columns: 1fr 280px; }
    @media (max-width: 860px) { grid-template-columns: 1fr; padding: 1.5rem 1.25rem; }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);

    &--sticky {
      position: sticky;
      top: 1.5rem;
    }
  }

  &__card-header {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;

    h3 {
      font-size: 0.95rem;
      font-weight: 800;
      color: $primary-dark;
      margin: 0 0 0.15rem;
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
    background: rgba($primary, 0.1);
    color: $primary;
    padding: 0.08rem 0.4rem;
    border-radius: 8px;
    text-transform: none;
    letter-spacing: 0;
  }

  &__hint {
    font-size: 0.68rem;
    font-weight: 400;
    color: $text-secondary;
    text-transform: none;
    letter-spacing: 0;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) { grid-template-columns: 1fr; }
  }

  // ── Tone chips ────────────────────────────────────────────────
  &__tone-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
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
    gap: 0.3rem;

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

  // ── Transition for custom tone input ─────────────────────────
  .bp-tone-input-enter-active,
  .bp-tone-input-leave-active { transition: all 0.25s ease; }
  .bp-tone-input-enter-from,
  .bp-tone-input-leave-to { opacity: 0; transform: translateY(-6px); }

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
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;

    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &.is-active { background: $primary; border-color: $primary; color: #fff; }
    &:disabled { cursor: not-allowed; opacity: 0.55; }
  }

  // ── Tooltip ───────────────────────────────────────────────────
  &__tooltip-wrap {
    position: relative;
    display: inline-flex;
    cursor: help;
    color: $text-secondary;
    font-size: 0.8rem;

    &:hover .bp__tooltip { opacity: 1; transform: translateY(0); pointer-events: auto; }
  }

  &__tooltip {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 200px;
    background: $primary-dark;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 400;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    line-height: 1.45;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.2s;
    pointer-events: none;
    z-index: 20;
    text-transform: none;
    letter-spacing: 0;
    white-space: normal;
  }

  // ── Checklist ─────────────────────────────────────────────────
  &__checklist {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba($primary-dark, 0.45);
      transition: color 0.2s;

      i { font-size: 0.85rem; color: rgba($primary-dark, 0.25); transition: color 0.2s; }

      &.is-done {
        color: $primary-dark;
        i { color: #22c55e; }
      }
    }
  }

  // ── Dropzone ──────────────────────────────────────────────────
  &__dropzone {
    border: 2px dashed rgba($primary-dark, 0.15);
    border-radius: 12px;
    padding: 1.25rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;

    i { font-size: 1.6rem; color: rgba($primary-dark, 0.2); }
    span { font-size: 0.82rem; font-weight: 600; color: $primary-dark; }
    small { font-size: 0.72rem; color: $text-secondary; }
    input { display: none; }

    &:hover, &.is-dragging { border-color: $primary; background: rgba($primary, 0.03); i { color: $primary; } }
    &.is-uploading { pointer-events: none; }
  }

  // ── File list ─────────────────────────────────────────────────
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
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
