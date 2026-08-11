<template>
  <!-- Client view once the profile is complete: read-only recap. -->
  <div class="bp__summary">

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

      <!-- Sección Customer Journey (Casos de Uso) -->
      <div v-if="(profile.customerJourneyCases || []).length > 0" class="bp__summary-section">
        <div class="bp__summary-section__head">
          <i class="fa-solid fa-route" style="color: #a855f7"></i>
          <span>Customer Journey & Casos de Uso</span>
        </div>
        <div class="bp__summary-section__body">
          <div
            v-for="c in profile.customerJourneyCases"
            :key="c.casoNumero"
            class="bp__summary-field"
            style="border-left: 3px solid #a855f7; padding-left: 0.85rem; margin-bottom: 0.85rem;"
          >
            <span class="bp__summary-field__label" style="color: #a855f7; font-weight: 800;">
              Caso #{{ c.casoNumero }}: {{ c.nombreCaso || 'Sin nombre' }}
            </span>
            <p class="bp__summary-field__value" style="margin-top: 0.2rem;">
              <strong>Target:</strong> {{ c.potencialCliente }}
            </p>
            <p class="bp__summary-field__value" style="margin-top: 0.2rem;">
              <strong>Efecto del Anuncio:</strong> {{ c.efectoAnuncio }}
            </p>
            <p class="bp__summary-field__value" style="margin-top: 0.2rem;">
              <strong>Acción Esperada:</strong> {{ c.accionEsperada }}
            </p>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BrandProfile, BrandProfileFile, Resource } from '@/types'
import type { ResourceCategory } from '../useBrandResources'

const props = defineProps<{
  wizardStep: number
  saving: boolean
  saveSuccess: boolean
  uploading: boolean
  dragOver: boolean
  isCustomTone: boolean
  presetTones: string[]
  wizardSteps: Array<{ title: string; icon: string; color: string; why: string }>
  completionScore: number
  brandLogos: Resource[]
  brandLineas: Resource[]
  brandCatalogs: Resource[]
  resourceUploading: ResourceCategory | null
}>()

const emit = defineEmits<{
  (e: 'update:wizardStep', step: number): void
  (e: 'save-step', next?: number): void
  (e: 'edit-profile'): void
  (e: 'select-tone', tone: string): void
  (e: 'activate-custom-tone'): void
  (e: 'upload-files', files: FileList | null): void
  (e: 'drop', event: DragEvent): void
  (e: 'update:dragOver', value: boolean): void
  (e: 'delete-file', file: BrandProfileFile): void
  (e: 'resource-file', event: Event, categoria: ResourceCategory): void
  (e: 'delete-resource', resource: Resource): void
}>()

/**
 * Bridges to the parent: the extracted template still calls these by name,
 * and the state they act on lives one level up.
 */
function deleteBrandResource(r: Resource) { emit('delete-resource', r) }
function handleBrandResourceFile(e: Event, c: ResourceCategory) { emit('resource-file', e, c) }

function editProfile() { emit('edit-profile') }

const profile = defineModel<BrandProfile>('profile', { required: true })
</script>

<style lang="scss" scoped>
@use '../profileStyles.scss';
</style>
