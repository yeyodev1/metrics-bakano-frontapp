<template>
  <div class="bpe">
    <div class="bpe__header">
      <i class="fa-solid fa-palette" />
      <span>{{ hasBrandProfile ? 'Editar perfil de marca' : 'Configurar perfil de marca' }}</span>
      <button type="button" class="bpe__close" @click="$emit('close')">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <div class="bpe__field">
      <label>Descripción del negocio <span class="bpe__req">requerido</span></label>
      <textarea v-model="form.descripcion" rows="3" placeholder="Ej: Restaurante de comida saludable en Guayaquil..." />
    </div>

    <div class="bpe__row">
      <div class="bpe__field">
        <label>Tipo de negocio</label>
        <div class="bpe__toggle-group">
          <button :class="['bpe__toggle', { 'is-active': form.tipoNegocio === 'PRODUCTOS' }]" type="button" @click="form.tipoNegocio = 'PRODUCTOS'">
            <i class="fa-solid fa-box" /> Productos
          </button>
          <button :class="['bpe__toggle', { 'is-active': form.tipoNegocio === 'SERVICIOS' }]" type="button" @click="form.tipoNegocio = 'SERVICIOS'">
            <i class="fa-solid fa-handshake" /> Servicios
          </button>
        </div>
      </div>
      <div class="bpe__field">
        <label>Vertical / Industria</label>
        <input v-model="form.vertical" type="text" placeholder="Ej: Restaurante, Clínica..." />
      </div>
    </div>

    <div class="bpe__row">
      <div class="bpe__field">
        <label>Público objetivo</label>
        <textarea v-model="form.publicoObjetivo" rows="2" placeholder="Ej: Mujeres 28-45 años..." />
      </div>
      <div class="bpe__field">
        <label>Propuesta de valor</label>
        <textarea v-model="form.propuestaValor" rows="2" placeholder="Ej: Lo que los hace únicos..." />
      </div>
    </div>

    <div class="bpe__field">
      <label>Productos / Servicios principales</label>
      <textarea v-model="form.productosServicios" rows="2" placeholder="Ej: Plan mensual $120, Bowl $8.50..." />
    </div>

    <div class="bpe__row">
      <div class="bpe__field">
        <label>Tono</label>
        <div class="bpe__tone">
          <button
            v-for="t in TONE_PRESETS"
            :key="t"
            type="button"
            :class="['bpe__tone-btn', { 'is-active': form.tono === t }]"
            @click="form.tono = form.tono === t ? '' : t"
          >
            {{ t }}
          </button>
        </div>
      </div>
      <div class="bpe__field">
        <label>Tráfico</label>
        <div class="bpe__toggle-group">
          <button :class="['bpe__toggle', { 'is-active': form.trafficDirection === 'WHATSAPP' }]" type="button" @click="form.trafficDirection = 'WHATSAPP'">
            <i class="fa-brands fa-whatsapp" /> WhatsApp
          </button>
          <button :class="['bpe__toggle', { 'is-active': form.trafficDirection === 'GHL' }]" type="button" @click="form.trafficDirection = 'GHL'">
            <i class="fa-solid fa-calendar-check" /> GHL
          </button>
        </div>
      </div>
    </div>

    <p v-if="saveError" class="bpe__error">
      <i class="fa-solid fa-triangle-exclamation" /> {{ saveError }}
    </p>

    <div class="bpe__actions">
      <button type="button" class="bpe__btn-cancel" @click="$emit('close')">Cancelar</button>
      <button type="button" class="bpe__btn-save" :disabled="saving" @click="save">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" />
        {{ saving ? 'Guardando...' : 'Guardar perfil' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { brandProfileService } from '@/services/brandProfile.service'
import type { BrandProfile } from '@/types'
import { TONE_PRESETS } from './constants'

const props = defineProps<{
  workspaceId: string
  brandProfile?: BrandProfile | null
  hasBrandProfile: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', profile: BrandProfile): void
}>()

type EditableProfile = {
  descripcion: string
  tipoNegocio: 'SERVICIOS' | 'PRODUCTOS' | ''
  vertical: string
  publicoObjetivo: string
  propuestaValor: string
  tono: string
  productosServicios: string
  trafficDirection: 'WHATSAPP' | 'GHL' | ''
  trafficLink: string
}

function toForm(bp?: BrandProfile | null): EditableProfile {
  return {
    descripcion: bp?.descripcion ?? '',
    tipoNegocio: bp?.tipoNegocio ?? '',
    vertical: bp?.vertical ?? '',
    publicoObjetivo: bp?.publicoObjetivo ?? '',
    propuestaValor: bp?.propuestaValor ?? '',
    tono: bp?.tono ?? '',
    productosServicios: bp?.productosServicios ?? '',
    trafficDirection: bp?.trafficDirection ?? '',
    trafficLink: bp?.trafficLink ?? '',
  }
}

const form = ref<EditableProfile>(toForm(props.brandProfile))
const saving = ref(false)
const saveError = ref<string | null>(null)

watch(() => props.brandProfile, (bp) => { if (bp) form.value = toForm(bp) })

async function save() {
  saving.value = true
  saveError.value = null
  try {
    const saved = await brandProfileService.upsert(props.workspaceId, {
      ...form.value,
      // Empty strings are not valid enum values — send undefined instead.
      tipoNegocio: form.value.tipoNegocio || undefined,
      trafficDirection: form.value.trafficDirection || undefined,
    })
    emit('saved', saved)
    emit('close')
  } catch {
    saveError.value = 'Error al guardar el perfil. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.bpe {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem;
  background: rgba($alert-info, 0.04);
  border: 1.5px solid rgba($alert-info, 0.18);
  border-radius: 10px;

  &__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    color: $alert-info;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    i { font-size: 0.8rem; }
    span { flex: 1; }
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: 0.7rem;
    color: $alert-info;
    background: rgba($alert-info, 0.12);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: rgba($alert-info, 0.22); }
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  &__field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;

    label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: $primary-dark;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.5rem 0.65rem;
      font-family: inherit;
      font-size: 0.82rem;
      color: $primary-dark;
      background: $white;
      border: 1.5px solid rgba($primary-dark, 0.1);
      border-radius: 8px;
      resize: vertical;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: $alert-info;
      }
    }
  }

  &__req {
    padding: 0.05rem 0.35rem;
    font-size: 0.6rem;
    font-weight: 600;
    color: $primary;
    text-transform: none;
    letter-spacing: 0;
    background: rgba($primary, 0.1);
    border-radius: 6px;
  }

  &__toggle-group {
    display: flex;
    gap: 0.35rem;
  }

  &__toggle {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.4rem 0.5rem;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { color: $primary; border-color: $primary; }
    &.is-active { color: $white; background: $primary; border-color: $primary; }
  }

  &__tone {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  &__tone-btn {
    padding: 0.28rem 0.65rem;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.1);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { color: $primary; border-color: $primary; }
    &.is-active { color: $white; background: $primary; border-color: $primary; }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0.55rem 0.75rem;
    font-size: 0.78rem;
    color: $alert-error;
    background: $alert-error-bg;
    border-radius: 8px;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 0.15rem;
  }

  &__btn-cancel {
    padding: 0.5rem 0.9rem;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    color: $text-secondary;
    background: $white;
    border: 1.5px solid rgba($primary-dark, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { color: $primary-dark; border-color: rgba($primary-dark, 0.3); }
  }

  &__btn-save {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: $white;
    background: linear-gradient(135deg, $primary, $secondary);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  @media (min-width: 541px) {
    &__row { flex-direction: row; }
  }
}
</style>
