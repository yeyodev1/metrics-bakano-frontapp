<template>
  <!-- Internal/admin view: one flat column of cards, always editable. -->
  <div class="bp__content">

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

<script setup lang="ts">
import { computed } from 'vue'
import type { BrandProfile, BrandProfileFile, Resource } from '@/types'
import type { ResourceCategory } from '../useBrandResources'

const props = defineProps<{
  isEditing: boolean
  uploading: boolean
  dragOver: boolean
  isCustomTone: boolean
  presetTones: string[]
  brandLogos: Resource[]
  brandLineas: Resource[]
  brandCatalogs: Resource[]
  resourceUploading: ResourceCategory | null
}>()

const emit = defineEmits<{
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
function selectTone(t: string) { emit('select-tone', t) }
const PRESET_TONES = computed(() => props.presetTones)

function activateCustomTone() { emit('activate-custom-tone') }

const profile = defineModel<BrandProfile>('profile', { required: true })
</script>

<style lang="scss" scoped>
@use '../profileStyles.scss';
</style>
