<template>
  <!-- Client onboarding: four guided steps, saved one by one. -->
  <div class="bp__wizard-container">

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
function saveStep(n?: number) { emit('save-step', n) }
const WIZARD_STEPS = computed(() => props.wizardSteps)
const PRESET_TONES = computed(() => props.presetTones)

function activateCustomTone() { emit('activate-custom-tone') }

const profile = defineModel<BrandProfile>('profile', { required: true })
</script>

<style lang="scss" scoped>
@use '../profileStyles.scss';
</style>
